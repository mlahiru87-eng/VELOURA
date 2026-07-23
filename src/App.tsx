import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import EntryForm from "./components/EntryForm";
import EntryDetails from "./components/EntryDetails";
import CalendarView from "./components/CalendarView";
import Reports from "./components/Reports";
import UserManagement from "./components/UserManagement";
import ActivityLogs from "./components/ActivityLogs";
import SettingsView from "./components/SettingsView";
import RecordsGrid from "./components/RecordsGrid";
import NotificationsCenter from "./components/NotificationsCenter";
import UnitContactDirectory from "./components/UnitContactDirectory";
import Login from "./components/Login";

import { CallUpEntry, UserProfile, SystemNotification, ActivityLog, UnitContact, translations } from "./types";
import { 
  getSessionUser, signOutUser, createEntry, updateEntry, completeEntry, normalizeUserProfile, getUnitContacts
} from "./lib/db";
import { auth, db, isFirebaseEnabled } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { ShieldAlert } from "lucide-react";

function AccessDeniedView({ language }: { language: 'en' | 'si' }) {
  const isSi = language === 'si';
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="h-16 w-16 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-200/50 mx-auto">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="font-sans text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
        {isSi ? "ප්‍රවේශය ප්‍රතික්ෂේප කර ඇත" : "Access Denied"}
      </h2>
      <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed mx-auto">
        {isSi 
          ? "මෙම පිටුවට ප්‍රවේශ වීමට ඔබට අවසර නැත. කරුණාකර ඔබගේ පද්ධති පරිපාලක අමතන්න." 
          : "You do not have the required permissions to access this module. Please contact your system administrator."}
      </p>
    </div>
  );
}

const isTabAuthorized = (tab: string, role: string): boolean => {
  if (role === 'Super Admin') return true;
  if (role === 'Admin') {
    return ['dashboard', 'pending', 'completed', 'records', 'calendar', 'reports', 'directory', 'notifications', 'settings'].includes(tab);
  }
  // User role
  return ['dashboard', 'pending', 'completed', 'records', 'calendar', 'directory', 'notifications', 'settings'].includes(tab);
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [filterPreset, setFilterPreset] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'dueToday' | 'dueThisWeek'>('all');

  // Real-time synchronization states
  const [entries, setEntries] = useState<CallUpEntry[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [unitContacts, setUnitContacts] = useState<UnitContact[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    setFilterPreset('all');
  };
  
  // Registry selection and modal controls
  const [selectedEntry, setSelectedEntry] = useState<CallUpEntry | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CallUpEntry | null>(null);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Connection offline/online listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check login session on mount (Strict production mode using Firebase Auth)
  useEffect(() => {
    setLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(db!, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = normalizeUserProfile({ ...userDoc.data(), uid: firebaseUser.uid });
            setUser(profile);
            localStorage.setItem("sb_diary_active_user", JSON.stringify(profile));
          } else {
            console.error("User profile document not found in Firestore for uid:", firebaseUser.uid);
            setUser(null);
            localStorage.removeItem("sb_diary_active_user");
          }
        } catch (err: any) {
          const isOfflineErr = err?.message?.toLowerCase().includes("offline") || err?.code === "unavailable" || !navigator.onLine;
          if (isOfflineErr) {
            console.warn("Client is offline, loading cached user profile:", err.message || err);
          } else {
            console.error("Error fetching user profile:", err);
          }
          const activeUser = getSessionUser();
          if (activeUser && activeUser.uid === firebaseUser.uid) {
            setUser(activeUser);
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem("sb_diary_active_user");
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Synchronizer
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setUsersList([]);
      setNotifications([]);
      setActivityLogs([]);
      setUnitContacts([]);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // 1. Users real-time listener
    try {
      const qUsers = query(collection(db!, "users"));
      const unsubUsers = onSnapshot(qUsers, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), uid: doc.id } as UserProfile);
        });
        setUsersList(list);
      }, (error) => {
        console.error("Users subscription failed:", error);
      });
      unsubscribers.push(unsubUsers);
    } catch (e) {
      console.error(e);
    }

    // 2. Call-up entries real-time listener (Admin vs Regular User query splitting to match Firestore Rules)
    try {
      if (user.role === 'Super Admin' || user.role === 'Admin') {
        const qEntries = query(collection(db!, "callup_entries"));
        const unsubEntries = onSnapshot(qEntries, (snapshot) => {
          const list: CallUpEntry[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as CallUpEntry);
          });
          setEntries(list);
          
          // Keep the selected entry updated in real-time if open
          if (selectedEntry) {
            const matched = list.find(item => item.id === selectedEntry.id);
            if (matched) setSelectedEntry(matched);
          }
        }, (error) => {
          console.error("Entries subscription failed:", error);
        });
        unsubscribers.push(unsubEntries);
      } else {
        let assignedList: CallUpEntry[] = [];
        let createdList: CallUpEntry[] = [];

        const updateMergedEntries = (assigned: CallUpEntry[], created: CallUpEntry[]) => {
          const merged = [...assigned];
          created.forEach(item => {
            if (!merged.some(m => m.id === item.id)) {
              merged.push(item);
            }
          });
          setEntries(merged);
          
          if (selectedEntry) {
            const matched = merged.find(item => item.id === selectedEntry.id);
            if (matched) setSelectedEntry(matched);
          }
        };

        const qAssigned = query(collection(db!, "callup_entries"), where("responsibleOfficer", "==", user.uid));
        const unsubAssigned = onSnapshot(qAssigned, (snapshot) => {
          const list: CallUpEntry[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as CallUpEntry);
          });
          assignedList = list;
          updateMergedEntries(assignedList, createdList);
        }, (error) => {
          console.error("Assigned entries subscription failed:", error);
        });

        const qCreated = query(collection(db!, "callup_entries"), where("createdBy", "==", user.uid));
        const unsubCreated = onSnapshot(qCreated, (snapshot) => {
          const list: CallUpEntry[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as CallUpEntry);
          });
          createdList = list;
          updateMergedEntries(assignedList, createdList);
        }, (error) => {
          console.error("Created entries subscription failed:", error);
        });

        unsubscribers.push(unsubAssigned, unsubCreated);
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Notifications real-time listener (Relational sync query splitting to match security rules)
    try {
      if (user.role === 'Super Admin' || user.role === 'Admin') {
        const qNotifs = query(collection(db!, "notifications"), orderBy("createdAt", "desc"));
        const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
          const list: SystemNotification[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as SystemNotification);
          });
          setNotifications(list);
        }, (error) => {
          console.error("Notifications subscription failed:", error);
        });
        unsubscribers.push(unsubNotifs);
      } else {
        let personalNotifs: SystemNotification[] = [];
        let generalNotifs: SystemNotification[] = [];

        const updateMergedNotifs = (personal: SystemNotification[], general: SystemNotification[]) => {
          const merged = [...personal];
          general.forEach(item => {
            if (!merged.some(m => m.id === item.id)) {
              merged.push(item);
            }
          });
          merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setNotifications(merged);
        };

        const qPersonal = query(collection(db!, "notifications"), where("targetUserId", "==", user.uid));
        const unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
          const list: SystemNotification[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as SystemNotification);
          });
          personalNotifs = list;
          updateMergedNotifs(personalNotifs, generalNotifs);
        }, (error) => {
          console.error("Personal notifications subscription failed:", error);
        });

        const qGeneral = query(collection(db!, "notifications"), where("targetUserId", "==", ""));
        const unsubGeneral = onSnapshot(qGeneral, (snapshot) => {
          const list: SystemNotification[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as SystemNotification);
          });
          generalNotifs = list;
          updateMergedNotifs(personalNotifs, generalNotifs);
        }, (error) => {
          console.error("General notifications subscription failed:", error);
        });

        unsubscribers.push(unsubPersonal, unsubGeneral);
      }
    } catch (e) {
      console.error(e);
    }

    // 4. Activity Logs audit trail listener (Super Admin/Admin only)
    try {
      if (user.role === 'Super Admin' || user.role === 'Admin') {
        const qLogs = query(collection(db!, "activity_logs"), orderBy("timestamp", "desc"), limit(250));
        const unsubLogs = onSnapshot(qLogs, (snapshot) => {
          const list: ActivityLog[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as ActivityLog);
          });
          setActivityLogs(list);
        }, (error) => {
          console.error("Activity logs subscription failed:", error);
        });
        unsubscribers.push(unsubLogs);
      }
    } catch (e) {
      console.error(e);
    }

    // 5. Unit Contacts listener
    try {
      const qContacts = query(collection(db!, "unit_contacts"));
      const unsubContacts = onSnapshot(qContacts, (snapshot) => {
        const list: UnitContact[] = [];
        snapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id } as UnitContact);
        });
        list.sort((a, b) => (a.unitName || "").localeCompare(b.unitName || ""));
        setUnitContacts(list);
      }, (error) => {
        console.warn("Unit contacts subscription error, falling back to local/preseeded:", error);
        getUnitContacts().then(setUnitContacts);
      });
      unsubscribers.push(unsubContacts);
    } catch (e) {
      console.error(e);
      getUnitContacts().then(setUnitContacts);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user]);

  // Load background CPM network scripts
  useEffect(() => {
    // Check if running in iframe (AI Studio preview) to bypass aggressive scripts that trigger SecurityError
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch (e) {
      inIframe = true;
    }

    if (inIframe) {
      console.log("Bypassing external ad scripts inside sandboxed preview environment.");
      return;
    }

    const scripts = [
      "https://pl30126735.effectivecpmnetwork.com/c7/6b/66/c76b66b9af2465dd0d7a7e49f9979e1c.js",
      "https://pl30133386.effectivecpmnetwork.com/15/16/48/151648297d1956a0fd3a877731c8bb68.js"
    ];
    
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.src = src;
        s.async = true;
        document.body.appendChild(s);
      }
    });
  }, []);

  // Sync theme to root class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setUser(userProfile);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
    setSelectedEntry(null);
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  const handleOpenCreateForm = () => {
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleOpenEditForm = (entry: CallUpEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleFormSave = async (entryData: any) => {
    try {
      if (editingEntry) {
        const updated = await updateEntry({ ...editingEntry, ...entryData });
        setShowEntryForm(false);
        setEditingEntry(null);
        setRefreshTrigger(prev => prev + 1);
        if (selectedEntry && selectedEntry.id === updated.id) {
          setSelectedEntry(updated);
        }
      } else {
        await createEntry(entryData);
        setShowEntryForm(false);
        setEditingEntry(null);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSelectRecord = (record: CallUpEntry) => {
    setSelectedEntry(record);
  };

  if (loadingAuth) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-900 border-t-amber-500"></div>
          <p className="text-sm font-mono tracking-wide opacity-75">Establishing secure link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col transition-colors`}>
      
      {isOffline && (
        <div className="bg-amber-950/80 border-b border-amber-850 text-amber-300 px-4 py-2.5 text-center font-sans text-xs font-bold flex items-center justify-center space-x-2 z-50">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>SYSTEM OFFLINE: Connection to Special Branch server interrupted. Operating locally until link restores.</span>
        </div>
      )}

      {!user ? (
        /* Portal Login screen wrapper */
        <Login 
          language={language}
          setLanguage={setLanguage}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        /* Authorized System Shell */
        <div className="flex-1 flex flex-col md:flex-row relative">
          
          {/* Left Navigation Sidebar */}
          <Sidebar 
            user={user}
            language={language}
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            notificationsCount={notifications.filter(n => !n.read).length}
          />

          {/* Mobile Sidebar Backdrop overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Right Main Panel Body content */}
          <div className="flex-1 flex flex-col min-w-0 md:pl-64">
            
            {/* Top Navigation Header */}
            <Header 
              user={user}
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              setTheme={setTheme}
              onLogout={handleLogout}
              onNavigateToNotifications={() => handleSetActiveTab('notifications')}
              setActiveTab={handleSetActiveTab}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              notifications={notifications}
              usersCount={usersList.length}
            />

            {/* Inner scroll viewport container */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-12 print:p-0 print:overflow-visible">
              
              {!isTabAuthorized(activeTab, user.role) ? (
                <AccessDeniedView language={language} />
              ) : (
                <>
                  {/* Dynamic render tab panels based on sidebar states */}
              {activeTab === 'dashboard' && (
                <Dashboard 
                  user={user}
                  language={language}
                  setActiveTab={setActiveTab}
                  setFilterPreset={setFilterPreset}
                  onSelectEntry={handleSelectRecord}
                  onNewEntryClick={handleOpenCreateForm}
                  onEditEntry={handleOpenEditForm}
                  entries={entries}
                  users={usersList}
                  activityLogs={activityLogs}
                />
              )}

              {activeTab === 'pending' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="pending"
                  filterPreset={filterPreset}
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                  entries={entries}
                  users={usersList}
                />
              )}

              {activeTab === 'completed' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="completed"
                  filterPreset={filterPreset}
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                  entries={entries}
                  users={usersList}
                />
              )}

              {activeTab === 'records' && (
                <RecordsGrid 
                  user={user}
                  language={language}
                  mode="all"
                  filterPreset={filterPreset}
                  onSelectEntry={handleSelectRecord}
                  onEditEntry={handleOpenEditForm}
                  refreshTrigger={refreshTrigger}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                  entries={entries}
                  users={usersList}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView 
                  language={language}
                  onSelectEntry={handleSelectRecord}
                  entries={entries}
                />
              )}

              {activeTab === 'reports' && (
                <Reports 
                  user={user}
                  language={language}
                  entries={entries}
                  users={usersList}
                  activityLogs={activityLogs}
                />
              )}

              {activeTab === 'directory' && (
                <UnitContactDirectory 
                  user={user}
                  language={language}
                  contacts={unitContacts}
                  onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsCenter 
                  user={user}
                  language={language}
                  notifications={notifications}
                />
              )}

              {activeTab === 'users' && user.role === 'Super Admin' && (
                <UserManagement 
                  language={language}
                  onBackToHome={() => handleSetActiveTab('dashboard')}
                  users={usersList}
                />
              )}

              {activeTab === 'logs' && user.role === 'Super Admin' && (
                <ActivityLogs 
                  language={language}
                  activityLogs={activityLogs}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  user={user}
                  language={language}
                />
              )}

                </>
              )}
            </main>

          </div>

        </div>
      )}

      {/* OVERLAY: Create & Edit Form Modal */}
      {showEntryForm && (
        <EntryForm 
          language={language}
          entry={editingEntry || undefined}
          onSave={handleFormSave}
          onClose={() => { setShowEntryForm(false); setEditingEntry(null); }}
          users={usersList}
        />
      )}

      {/* OVERLAY: Inspect Entry details and completion modal */}
      {selectedEntry && (
        <EntryDetails 
          user={user!}
          language={language}
          entry={selectedEntry}
          onComplete={async (id, data) => {
            await completeEntry(id, data);
            setSelectedEntry(null);
            setRefreshTrigger(prev => prev + 1);
          }}
          onClose={() => setSelectedEntry(null)}
        />
      )}

    </div>
  );
}
