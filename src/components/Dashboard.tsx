import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList 
} from "recharts";
import { 
  FileText, Users, FileClock, CheckCircle2, AlertTriangle, 
  Clock, Calendar, ArrowRight, ShieldAlert, Sparkles, TrendingUp,
  Paperclip, ShieldCheck, ExternalLink, UserCheck, FileSpreadsheet, History,
  Plus, Search, ChevronDown, ChevronUp, Eye, Edit3, Check, Download, Lock, Shield
} from "lucide-react";
import { CallUpEntry, UserProfile, ActivityLog, translations } from "../types";
import { AdsterraBanner320x50, AdsterraBanner300x250, AdsterraContainerAd } from "./AdsterraAd";

interface DashboardProps {
  user: UserProfile;
  language: 'en' | 'si';
  setActiveTab: (tab: string) => void;
  setFilterPreset?: (preset: 'all' | 'pending' | 'completed' | 'overdue' | 'dueToday' | 'dueThisWeek') => void;
  onSelectEntry: (entry: CallUpEntry) => void;
  onNewEntryClick?: () => void;
  onEditEntry?: (entry: CallUpEntry) => void;
  entries: CallUpEntry[];
  users: UserProfile[];
  activityLogs: ActivityLog[];
}

const Dashboard = memo(function Dashboard({
  user,
  language,
  setActiveTab,
  setFilterPreset,
  onSelectEntry,
  onNewEntryClick,
  onEditEntry,
  entries,
  users,
  activityLogs
}: DashboardProps) {
  const t = translations[language];
  const isSi = language === 'si';

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dueToday: true,
    overdue: true,
    dueTomorrow: false,
    due7Days: false,
    completedToday: false,
    myPending: false,
    myRecords: false
  });

  // Calculate Dates
  const todayStr = new Date().toISOString().split('T')[0];
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

  // Helper: check if entry is assigned to/created by the active user
  const isUserAssignedOrCreator = (entry: CallUpEntry) => {
    const uids = entry.responsibleOfficers || (entry.responsibleOfficer ? entry.responsibleOfficer.split(",") : []);
    return uids.includes(user.uid) || entry.createdBy === user.uid;
  };

  // Helper: check if authorized to complete
  const checkCanComplete = (entry: CallUpEntry) => {
    if (entry.status === 'Completed') return false;
    return (
      user.role === 'Super Admin' || 
      user.role === 'Admin' || 
      isUserAssignedOrCreator(entry)
    );
  };

  // 1. SECTION 1: SYSTEM SUMMARY STATS (Exactly as they were, but beautifully designed)
  const totalRecords = entries.length;
  const totalUsers = users.length;
  const pendingItems = entries.filter(e => e.status === 'Pending' || e.status === 'In Progress').length;
  const completedItems = entries.filter(e => e.status === 'Completed').length;
  const overdueItems = entries.filter(e => e.status === 'Overdue').length;

  const totalAttachments = entries.reduce((acc, curr) => {
    let count = (curr.attachments ? curr.attachments.length : 0);
    if (curr.completionAttachment) count += 1;
    return acc + count;
  }, 0);

  const totalAdmins = users.filter(u => u.role === 'Admin').length;

  const systemSummaryCards = [
    { id: "pending", title: t.pendingItems, value: pendingItems, icon: FileClock, color: "amber" },
    { id: "completed", title: t.completedItems, value: completedItems, icon: CheckCircle2, color: "emerald" },
    { id: "overdue", title: t.overdue, value: overdueItems, icon: AlertTriangle, color: "red" },
    ...(user.role === 'Super Admin' ? [
      { id: "users", title: isSi ? "මුළු පරිශීලකයින්" : "Total Users", value: totalUsers, icon: Users, color: "teal" },
      { id: "admins", title: isSi ? "මුළු පරිපාලකයින්" : "Total Admins", value: totalAdmins, icon: ShieldCheck, color: "indigo" }
    ] : []),
    { id: "attachments", title: isSi ? "මුළු ඇමුණුම්" : "Total Attachments", value: totalAttachments, icon: Paperclip, color: "slate" }
  ];

  // 2. SECTION 2: TODAY'S REMINDER CENTER (Counts of items across various states)
  // Filters
  const dueTodayList = entries.filter(e => e.status !== 'Completed' && e.dueDate === todayStr);
  const overdueReportsList = entries.filter(e => e.status === 'Overdue' || (e.status !== 'Completed' && e.dueDate < todayStr));
  const dueTomorrowList = entries.filter(e => e.status !== 'Completed' && e.dueDate === tomorrowStr);
  const dueWithin7DaysList = entries.filter(e => e.status !== 'Completed' && e.dueDate >= todayStr && e.dueDate <= sevenDaysLaterStr);
  const completedTodayList = entries.filter(e => e.status === 'Completed' && e.completedAt && e.completedAt.split('T')[0] === todayStr);
  const myPendingTasksList = entries.filter(e => e.status !== 'Completed' && isUserAssignedOrCreator(e));
  const myRecordsList = entries; // Already database-filtered for 'User' role

  const reminderCenterCards = [
    { id: "dueToday", title: isSi ? "අද දිනට නියමිත" : "Today's Due", count: dueTodayList.length, statusColor: "amber", targetSection: "dueToday" },
    { id: "overdue", title: isSi ? "ප්‍රමාද වූ වාර්තා" : "Overdue Reports", count: overdueReportsList.length, statusColor: "red", targetSection: "overdue" },
    { id: "dueTomorrow", title: isSi ? "හෙට දිනට නියමිත" : "Due Tomorrow", count: dueTomorrowList.length, statusColor: "yellow", targetSection: "dueTomorrow" },
    { id: "due7Days", title: isSi ? "දින 7ක් ඇතුළත නියමිත" : "Due Within 7 Days", count: dueWithin7DaysList.length, statusColor: "purple", targetSection: "due7Days" },
    { id: "completedToday", title: isSi ? "අද දින නිම කළ" : "Completed Today", count: completedTodayList.length, statusColor: "emerald", targetSection: "completedToday" },
    { id: "myPending", title: isSi ? "මගේ නොවිසඳුණු කාර්යයන්" : "My Pending Tasks", count: myPendingTasksList.length, statusColor: "blue", targetSection: "myPending" }
  ];

  // Filter reminder center cards based on role
  // USER: Can only see My Pending Tasks, Today's Due, Completed, My Records
  const filteredReminderCards = reminderCenterCards.filter(card => {
    if (user.role === 'User') {
      return ["dueToday", "completedToday", "myPending"].includes(card.id);
    }
    return true;
  });

  // Global search filtering
  const applySearchAndFilter = (list: CallUpEntry[]) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(entry => {
      const refNum = (entry.referenceNumber || "").toLowerCase();
      const recNum = (entry.recordNumber || "").toLowerCase();
      const subject = (entry.subject || "").toLowerCase();
      const institution = (entry.officeInstitution || "").toLowerCase();
      const officer = (entry.responsibleOfficerName || entry.responsibleOfficer || "").toLowerCase();
      const priority = (entry.priority || "").toLowerCase();
      return refNum.includes(q) || recNum.includes(q) || subject.includes(q) || institution.includes(q) || officer.includes(q) || priority.includes(q);
    });
  };

  // Section 3: Expandable queues configuration
  const workQueues = [
    {
      id: "dueToday",
      title: isSi ? "අද දිනට නියමිත වාර්තා" : "Today's Due Reports",
      list: dueTodayList,
      color: "amber",
      roles: ["Super Admin", "Admin", "User"]
    },
    {
      id: "overdue",
      title: isSi ? "ප්‍රමාද වූ වාර්තා" : "Overdue Reports",
      list: overdueReportsList,
      color: "red",
      roles: ["Super Admin", "Admin"]
    },
    {
      id: "dueTomorrow",
      title: isSi ? "හෙට දිනට නියමිත වාර්තා" : "Tomorrow Reports",
      list: dueTomorrowList,
      color: "yellow",
      roles: ["Super Admin", "Admin"]
    },
    {
      id: "due7Days",
      title: isSi ? "ඉදිරි දින 7 වාර්තා" : "Next 7 Days Reports",
      list: dueWithin7DaysList,
      color: "purple",
      roles: ["Super Admin", "Admin"]
    },
    {
      id: "completedToday",
      title: isSi ? "අද දින නිම කරන ලද වාර්තා" : "Completed Today",
      list: completedTodayList,
      color: "emerald",
      roles: ["Super Admin", "Admin", "User"]
    },
    {
      id: "myPending",
      title: isSi ? "මගේ නොවිසඳුණු කාර්යයන්" : "My Pending Tasks Queue",
      list: myPendingTasksList,
      color: "blue",
      roles: ["Super Admin", "Admin", "User"]
    },
    ...(user.role === 'User' ? [{
      id: "myRecords",
      title: isSi ? "මගේ සියලුම වාර්තා" : "My All Records",
      list: myRecordsList,
      color: "slate",
      roles: ["User"]
    }] : [])
  ];

  const filteredWorkQueues = workQueues.filter(q => q.roles.includes(user.role));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScrollToQueue = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
    setTimeout(() => {
      const el = document.getElementById(`queue-section-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Top Alert Bar logic
  const renderTopAlertBar = () => {
    const overdueCount = overdueReportsList.length;
    const dueTodayCount = dueTodayList.length;
    const pendingCount = pendingItems;

    let alertText = "";
    let alertBg = "";
    let alertBorder = "";
    let alertIcon = null;

    if (overdueCount > 0) {
      alertText = isSi ? `🔴 ප්‍රමාද වූ වාර්තා ${overdueCount} ක් ඇත - වහාම ක්‍රියාත්මක වන්න` : `🔴 ${overdueCount} Overdue Reports - Action Required Immediately`;
      alertBg = "bg-red-50 dark:bg-red-950/20";
      alertBorder = "border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400";
      alertIcon = <ShieldAlert className="h-4.5 w-4.5 animate-bounce" />;
    } else if (dueTodayCount > 0) {
      alertText = isSi ? `🟠 අද දිනට නියමිත වාර්තා ${dueTodayCount} ක් ඇත - ප්‍රමුඛතාවය ලබා දෙන්න` : `🟠 ${dueTodayCount} Reports Due Today - Focus Attention`;
      alertBg = "bg-amber-50 dark:bg-amber-950/20";
      alertBorder = "border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400";
      alertIcon = <Clock className="h-4.5 w-4.5 text-amber-500 animate-pulse" />;
    } else if (pendingCount > 0) {
      alertText = isSi ? `🔵 ක්‍රියාකාරී නොවිසඳුණු වාර්තා ${pendingCount} ක් ඇත` : `🔵 ${pendingCount} Active Pending Reports in Workflow`;
      alertBg = "bg-blue-50 dark:bg-blue-950/20";
      alertBorder = "border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400";
      alertIcon = <FileClock className="h-4.5 w-4.5 text-blue-500" />;
    } else {
      alertText = isSi ? `🟢 සියලුම වාර්තා සම්පූර්ණ කර ඇත - විශිෂ්ටයි!` : `🟢 All Reports Completed`;
      alertBg = "bg-emerald-50 dark:bg-emerald-950/20";
      alertBorder = "border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400";
      alertIcon = <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />;
    }

    return (
      <div className={`flex items-center space-x-3 rounded-xl border p-3.5 ${alertBg} ${alertBorder} shadow-xs font-sans text-xs font-extrabold tracking-wide`}>
        {alertIcon}
        <span>{alertText}</span>
      </div>
    );
  };

  const handleSearchActionClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Alert Bar */}
      {renderTopAlertBar()}

      {/* Welcome Banner */}
      <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:space-y-0 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
        <div className="text-left">
          <div className="flex items-center space-x-2 text-indigo-900 dark:text-amber-500">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
            <span className="font-sans text-xs font-bold uppercase tracking-wider">
              {t.govLabel}
            </span>
          </div>
          <h1 className="font-sans text-2xl font-black text-slate-900 dark:text-white mt-1">
            {t.welcomeBack}, {user.displayName}
          </h1>
          <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.appSubTitle} &bull; Security Grade Dashboard &bull; {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'si-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Quick Actions (Preserved and beautifully enhanced) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <a
            href="https://www.police.lk/?page_id=1301"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-3 font-sans text-xs font-bold text-slate-900 shadow-md hover:shadow-lg transition-all border border-amber-400/50 cursor-pointer text-center"
            id="police-contacts-btn"
          >
            <ExternalLink className="h-4.5 w-4.5" />
            <span>{isSi ? 'පොලිස් ස්ථාන දුරකථන අංක' : 'Police Station Contact Numbers'}</span>
          </a>

          {user.role !== 'User' && onNewEntryClick && (
            <button
              onClick={onNewEntryClick}
              className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-900 px-5 py-3 font-sans text-xs font-bold text-white shadow-md hover:bg-indigo-950 hover:shadow-lg dark:bg-indigo-950 dark:hover:bg-slate-900 border border-amber-500/20 transition-all cursor-pointer text-center"
              id="dashboard-new-entry-btn"
            >
              <span>+ {t.createEntry}</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS BUTTONS SECTION */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
        <h2 className="font-sans text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3 text-left">
          {isSi ? "ක්ෂණික ක්‍රියාමාර්ග" : "Quick Action Hub"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {user.role !== 'User' && onNewEntryClick && (
            <button
              onClick={onNewEntryClick}
              className="flex items-center justify-center space-x-2 p-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl font-sans text-xs font-bold text-indigo-950 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-indigo-400 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isSi ? "නව වාර්තාව" : "New Entry"}</span>
            </button>
          )}
          <button
            onClick={handleSearchActionClick}
            className="flex items-center justify-center space-x-2 p-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl font-sans text-xs font-bold text-indigo-950 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-indigo-400 transition-all cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>{isSi ? "සෙවීම" : "Search Record"}</span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className="flex items-center justify-center space-x-2 p-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl font-sans text-xs font-bold text-indigo-950 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-indigo-400 transition-all cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            <span>{isSi ? "දින දර්ශනය" : "Calendar"}</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className="flex items-center justify-center space-x-2 p-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl font-sans text-xs font-bold text-indigo-950 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-indigo-400 transition-all cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>{isSi ? "නිවේදන" : "Notifications"}</span>
          </button>
          <a
            href="https://www.police.lk/?page_id=1301"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 p-3 bg-amber-400 hover:bg-amber-500 border border-amber-500 rounded-xl font-sans text-xs font-bold text-slate-900 transition-all text-center"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="truncate">{isSi ? "දුරකථන" : "Police Stations"}</span>
          </a>
        </div>
      </div>

      {/* SECTION 1: SYSTEM SUMMARY (Display six summary cards as requested) */}
      <div>
        <h2 className="font-sans text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3.5 text-left flex items-center space-x-2">
          <Shield className="h-4.5 w-4.5 text-indigo-600 dark:text-amber-500" />
          <span>{isSi ? "පද්ධති සාරාංශය" : "System Summary"}</span>
        </h2>

        <div className={`grid grid-cols-2 gap-4 ${user.role === 'Super Admin' ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-4'}`}>
          {systemSummaryCards.map((card) => {
            const IconComp = card.icon;
            
            // Premium custom color maps
            const colorThemes: Record<string, { bg: string; border: string; title: string; num: string; icon: string }> = {
              amber: {
                bg: "bg-amber-50/50 dark:bg-amber-950/10",
                border: "border-amber-200 dark:border-amber-900/30",
                title: "text-amber-800 dark:text-amber-400",
                num: "text-amber-600 dark:text-amber-400",
                icon: "text-amber-500 dark:text-amber-400"
              },
              emerald: {
                bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
                border: "border-emerald-200 dark:border-emerald-900/30",
                title: "text-emerald-800 dark:text-emerald-400",
                num: "text-emerald-600 dark:text-emerald-400",
                icon: "text-emerald-500 dark:text-emerald-400"
              },
              red: {
                bg: "bg-red-50/50 dark:bg-red-950/10",
                border: "border-red-200 dark:border-red-900/30",
                title: "text-red-800 dark:text-red-400",
                num: "text-red-600 dark:text-red-400",
                icon: "text-red-500 dark:text-red-400"
              },
              teal: {
                bg: "bg-teal-50/50 dark:bg-teal-950/10",
                border: "border-teal-200 dark:border-teal-900/30",
                title: "text-teal-800 dark:text-teal-400",
                num: "text-teal-600 dark:text-teal-400",
                icon: "text-teal-500 dark:text-teal-400"
              },
              indigo: {
                bg: "bg-indigo-50/50 dark:bg-indigo-950/10",
                border: "border-indigo-200 dark:border-indigo-900/30",
                title: "text-indigo-800 dark:text-indigo-400",
                num: "text-indigo-600 dark:text-indigo-400",
                icon: "text-indigo-500 dark:text-indigo-400"
              },
              slate: {
                bg: "bg-slate-50/50 dark:bg-slate-950/10",
                border: "border-slate-200 dark:border-slate-800/80",
                title: "text-slate-700 dark:text-slate-300",
                num: "text-slate-800 dark:text-slate-100",
                icon: "text-slate-500 dark:text-slate-400"
              }
            };

            const style = colorThemes[card.color] || colorThemes.slate;

            return (
              <button
                key={card.id}
                onClick={() => {
                  if (card.id === "pending") {
                    if (setFilterPreset) setFilterPreset("pending");
                    setActiveTab("pending");
                  } else if (card.id === "completed") {
                    if (setFilterPreset) setFilterPreset("completed");
                    setActiveTab("completed");
                  } else if (card.id === "overdue") {
                    if (setFilterPreset) setFilterPreset("overdue");
                    setActiveTab("pending");
                  } else if (card.id === "users" || card.id === "admins") {
                    setActiveTab("users");
                  } else if (card.id === "attachments") {
                    if (setFilterPreset) setFilterPreset("all");
                    setActiveTab("records");
                  }
                }}
                className={`flex flex-col items-start justify-between rounded-xl border p-4 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer ${style.bg} ${style.border} min-h-[110px]`}
                id={`system-stat-card-${card.id}`}
              >
                <div className="flex items-center justify-between w-full">
                  <IconComp className={`h-5 w-5 ${style.icon}`} />
                  <span className={`font-sans text-[26px] sm:text-[30px] font-black leading-none ${style.num}`}>
                    {card.value}
                  </span>
                </div>
                <span className={`font-sans text-[11px] sm:text-xs font-extrabold tracking-tight mt-3 text-left ${style.title}`}>
                  {card.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Advertisement Banner */}
      <AdsterraBanner320x50 language={language} />

      {/* SECTION 2: TODAY'S REMINDER CENTER */}
      <div>
        <h2 className="font-sans text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3 text-left flex items-center space-x-2">
          <Clock className="h-4.5 w-4.5 text-indigo-600 dark:text-amber-500" />
          <span>{isSi ? "අද දින මතක් කිරීම් මධ්‍යස්ථානය" : "Today's Reminder Center"}</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {filteredReminderCards.map((card) => {
            // Colors for reminder center
            const colorThemes: Record<string, { bg: string; text: string; accent: string; badge: string }> = {
              amber: {
                bg: "bg-amber-50/40 dark:bg-amber-950/10",
                text: "text-amber-800 dark:text-amber-400",
                accent: "border-amber-200 dark:border-amber-900/30",
                badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              },
              red: {
                bg: "bg-red-50/40 dark:bg-red-950/10",
                text: "text-red-800 dark:text-red-400",
                accent: "border-red-200 dark:border-red-900/30",
                badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              },
              yellow: {
                bg: "bg-yellow-50/40 dark:bg-yellow-950/10",
                text: "text-yellow-800 dark:text-yellow-400",
                accent: "border-yellow-200 dark:border-yellow-900/30",
                badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
              },
              purple: {
                bg: "bg-purple-50/40 dark:bg-purple-950/10",
                text: "text-purple-800 dark:text-purple-400",
                accent: "border-purple-200 dark:border-purple-900/30",
                badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
              },
              emerald: {
                bg: "bg-emerald-50/40 dark:bg-emerald-950/10",
                text: "text-emerald-800 dark:text-emerald-400",
                accent: "border-emerald-200 dark:border-emerald-900/30",
                badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              },
              blue: {
                bg: "bg-blue-50/40 dark:bg-blue-950/10",
                text: "text-blue-800 dark:text-blue-400",
                accent: "border-blue-200 dark:border-blue-900/30",
                badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              }
            };

            const style = colorThemes[card.statusColor] || colorThemes.blue;

            return (
              <div
                key={card.id}
                onClick={() => handleScrollToQueue(card.targetSection)}
                className={`flex flex-col justify-between p-4 rounded-xl border ${style.bg} ${style.accent} shadow-xs hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer min-h-[140px] text-left relative overflow-hidden`}
              >
                <div>
                  <span className={`inline-block rounded-full font-mono text-xs font-black px-2.5 py-0.5 ${style.badge}`}>
                    {card.count}
                  </span>
                  <h3 className={`font-sans text-xs font-black mt-3 leading-tight ${style.text}`}>
                    {card.title}
                  </h3>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScrollToQueue(card.targetSection);
                  }}
                  className={`mt-4 flex items-center space-x-1.5 font-sans text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-t border-slate-200/40 dark:border-slate-800/40 pt-2 w-full text-left`}
                >
                  <span>{isSi ? "ඉක්මන් නැරඹුම" : "Quick View"}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* GLOBAL SEARCH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isSi ? "යොමු අංකය, විෂයය, ආයතනය, නිලධාරියා, ප්‍රමුඛතාවය අනුව සොයන්න..." : "Search by Reference Number, Subject, Institution, Officer, Priority..."}
            className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900/60 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-sans text-xs font-medium placeholder-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 whitespace-nowrap px-3 py-2 cursor-pointer"
          >
            {isSi ? "ප්‍රත්‍යාවර්ත කරන්න" : "Clear Search"}
          </button>
        )}
      </div>

      {/* SECTION 3: WORK QUEUE (Expandable tables) */}
      <div className="space-y-4">
        <h2 className="font-sans text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider text-left flex items-center space-x-2">
          <FileClock className="h-4.5 w-4.5 text-indigo-600 dark:text-amber-500" />
          <span>{isSi ? "වැඩ පෝලිම" : "Work Queue Hub"}</span>
        </h2>

        {filteredWorkQueues.map((queue) => {
          const isExpanded = !!expandedSections[queue.id];
          const queryResults = applySearchAndFilter(queue.list);

          const colorMap: Record<string, { border: string; bg: string; iconBg: string; text: string }> = {
            amber: {
              border: "border-amber-200 dark:border-amber-900/30",
              bg: "bg-amber-500/10",
              iconBg: "bg-amber-500 text-slate-900",
              text: "text-amber-800 dark:text-amber-400"
            },
            red: {
              border: "border-red-200 dark:border-red-900/30",
              bg: "bg-red-500/10",
              iconBg: "bg-red-500 text-white",
              text: "text-red-800 dark:text-red-400"
            },
            yellow: {
              border: "border-yellow-200 dark:border-yellow-900/30",
              bg: "bg-yellow-500/10",
              iconBg: "bg-yellow-500 text-slate-900",
              text: "text-yellow-800 dark:text-yellow-400"
            },
            purple: {
              border: "border-purple-200 dark:border-purple-900/30",
              bg: "bg-purple-500/10",
              iconBg: "bg-purple-500 text-white",
              text: "text-purple-800 dark:text-purple-400"
            },
            emerald: {
              border: "border-emerald-200 dark:border-emerald-900/30",
              bg: "bg-emerald-500/10",
              iconBg: "bg-emerald-500 text-white",
              text: "text-emerald-800 dark:text-emerald-400"
            },
            blue: {
              border: "border-blue-200 dark:border-blue-900/30",
              bg: "bg-blue-500/10",
              iconBg: "bg-blue-500 text-white",
              text: "text-blue-800 dark:text-blue-400"
            },
            slate: {
              border: "border-slate-200 dark:border-slate-800",
              bg: "bg-slate-500/10",
              iconBg: "bg-slate-500 text-white",
              text: "text-slate-700 dark:text-slate-300"
            }
          };

          const style = colorMap[queue.color] || colorMap.slate;

          return (
            <div 
              key={queue.id} 
              id={`queue-section-${queue.id}`}
              className={`rounded-2xl border ${style.border} bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-all`}
            >
              {/* Header Toggle */}
              <button
                onClick={() => toggleSection(queue.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all text-left outline-none"
              >
                <div className="flex items-center space-x-3">
                  <span className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-xs ${style.iconBg}`}>
                    {queryResults.length}
                  </span>
                  <div>
                    <h3 className={`font-sans text-xs font-black uppercase tracking-wider ${style.text}`}>
                      {queue.title}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                  {queryResults.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      {isSi ? "වාර්තා කිසිවක් සොයා ගැනීමට නොමැත." : "No matching reports found in this queue."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {/* Desktop Table View */}
                      <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider w-36">{t.recordNumber}</th>
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.subject}</th>
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider w-40">{t.officeInstitution}</th>
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider w-40">{t.responsibleOfficer}</th>
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">{t.priority}</th>
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28">{t.dueDate}</th>
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">{t.status}</th>
                            <th className="py-3 px-4 font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider w-48 text-right">{isSi ? "ක්‍රියාමාර්ග" : "Actions"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {queryResults.map((entry) => {
                            let priorityStyle = "";
                            if (entry.priority === 'Urgent') priorityStyle = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-bold";
                            else if (entry.priority === 'High') priorityStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
                            else if (entry.priority === 'Medium') priorityStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                            else priorityStyle = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";

                            // Attachments logic
                            const attachments = [
                              ...(entry.attachments || []),
                              ...(entry.completionAttachment ? [entry.completionAttachment] : [])
                            ];

                            return (
                              <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                                <td className="py-3 px-4 font-mono text-[11px] font-bold text-indigo-900 dark:text-indigo-400">
                                  {entry.recordNumber}
                                </td>
                                <td className="py-3 px-4 max-w-xs truncate font-sans text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {entry.subject}
                                </td>
                                <td className="py-3 px-4 max-w-xs truncate font-sans text-xs text-slate-500 dark:text-slate-400">
                                  {entry.officeInstitution}
                                </td>
                                <td className="py-3 px-4 font-sans text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                                  {entry.responsibleOfficerName || entry.responsibleOfficer}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold ${priorityStyle}`}>
                                    {entry.priority}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-sans text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                  {entry.dueDate}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                    entry.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                                    entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                    entry.status === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  }`}>
                                    {entry.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    
                                    {/* View */}
                                    <button
                                      onClick={() => onSelectEntry(entry)}
                                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                                      title={isSi ? "නරඹන්න" : "Inspect"}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>

                                    {/* Edit (Admin/Super Admin only) */}
                                    {user.role !== 'User' && onEditEntry && (
                                      <button
                                        onClick={() => onEditEntry(entry)}
                                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                                        title={isSi ? "සංස්කරණය" : "Edit"}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                    )}

                                    {/* Complete (Authorized only) */}
                                    {checkCanComplete(entry) && (
                                      <button
                                        onClick={() => onSelectEntry(entry)}
                                        className="p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 hover:text-emerald-800 dark:text-emerald-500 dark:hover:text-emerald-300 transition-all cursor-pointer"
                                        title={isSi ? "නිම කරන්න" : "Complete"}
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                    )}

                                    {/* Download Attachment Button */}
                                    {attachments.length > 0 ? (
                                      <div className="relative">
                                        <button
                                          onClick={() => {
                                            setActiveDropdownId(activeDropdownId === `att-${entry.id}` ? null : `att-${entry.id}`);
                                          }}
                                          className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-all cursor-pointer flex items-center space-x-0.5"
                                          title={isSi ? "ඇමුණුම් බාගන්න" : "Download Attachment"}
                                        >
                                          <Download className="h-4 w-4" />
                                          <span className="text-[9px] font-black">{attachments.length}</span>
                                        </button>
                                        
                                        {activeDropdownId === `att-${entry.id}` && (
                                          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 text-left">
                                            {attachments.map((att, idx) => (
                                              <a
                                                key={idx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setActiveDropdownId(null)}
                                                className="block px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 truncate"
                                              >
                                                {att.name}
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <button 
                                        disabled
                                        className="p-1 text-slate-200 dark:text-slate-800"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                    )}

                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Mobile Card List View */}
                      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-850 p-2">
                        {queryResults.map((entry) => {
                          const attachments = [
                            ...(entry.attachments || []),
                            ...(entry.completionAttachment ? [entry.completionAttachment] : [])
                          ];
                          return (
                            <div key={entry.id} className="py-3 text-left space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[11px] font-black text-indigo-900 dark:text-indigo-400">
                                  {entry.recordNumber}
                                </span>
                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                  entry.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                                  entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  entry.status === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}>
                                  {entry.status}
                                </span>
                              </div>
                              <h4 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100">
                                {entry.subject}
                              </h4>
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                <div>Inst: <span className="text-slate-700 dark:text-slate-200">{entry.officeInstitution}</span></div>
                                <div>Due: <span className="text-slate-700 dark:text-slate-200">{entry.dueDate}</span></div>
                                <div className="col-span-2">Officer: <span className="text-slate-700 dark:text-slate-200">{entry.responsibleOfficerName || entry.responsibleOfficer}</span></div>
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <span className="inline-block bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-700 dark:text-slate-300">
                                  {entry.priority}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => onSelectEntry(entry)}
                                    className="p-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                                    title={isSi ? "නරඹන්න" : "Inspect"}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  {user.role !== 'User' && onEditEntry && (
                                    <button
                                      onClick={() => onEditEntry(entry)}
                                      className="p-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                                      title={isSi ? "සංස්කරණය" : "Edit"}
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {attachments.map((att, idx) => (
                                    <a
                                      key={idx}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 bg-indigo-50 border border-indigo-100 dark:bg-indigo-950 dark:border-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center space-x-1"
                                      title={att.name}
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Analytics Charts (Preserved exactly for Super Admin) */}
      {user.role === 'Super Admin' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Bar Chart: Document Status */}
          <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="text-left">
                <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Document Status Distribution
                </h3>
                <p className="font-sans text-[10px] text-slate-400">
                  Active workflow breakdown across processing stages
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                <BarChart data={[
                  { name: t.pending, count: entries.filter(e => e.status === 'Pending').length, fill: '#3b82f6' },
                  { name: t.inProgress, count: entries.filter(e => e.status === 'In Progress').length, fill: '#f59e0b' },
                  { name: t.completed, count: entries.filter(e => e.status === 'Completed').length, fill: '#10b981' },
                  { name: t.overdue, count: entries.filter(e => e.status === 'Overdue').length, fill: '#ef4444' }
                ]} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#475569', fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#475569', fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontFamily: 'Inter',
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="count" 
                      position="top" 
                      offset={8}
                      fill="#0f172a"
                      className="font-sans font-extrabold text-xs dark:fill-slate-200"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Priority Level Breakdown */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="text-left">
                <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Priority Distribution
                </h3>
                <p className="font-sans text-[10px] text-slate-400">
                  Record load sorted by urgency level
                </p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center mt-4 min-h-[220px]">
              {[
                { name: t.low, value: entries.filter(e => e.priority === 'Low').length, color: '#94a3b8' },
                { name: t.medium, value: entries.filter(e => e.priority === 'Medium').length, color: '#10b981' },
                { name: t.high, value: entries.filter(e => e.priority === 'High').length, color: '#f59e0b' },
                { name: t.urgent, value: entries.filter(e => e.priority === 'Urgent').length, color: '#ef4444' }
              ].filter(p => p.value > 0).length === 0 ? (
                <span className="font-sans text-xs text-slate-400">No priority data available</span>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t.low, value: entries.filter(e => e.priority === 'Low').length, color: '#94a3b8' },
                          { name: t.medium, value: entries.filter(e => e.priority === 'Medium').length, color: '#10b981' },
                          { name: t.high, value: entries.filter(e => e.priority === 'High').length, color: '#f59e0b' },
                          { name: t.urgent, value: entries.filter(e => e.priority === 'Urgent').length, color: '#ef4444' }
                        ].filter(p => p.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {[
                          { name: t.low, value: entries.filter(e => e.priority === 'Low').length, color: '#94a3b8' },
                          { name: t.medium, value: entries.filter(e => e.priority === 'Medium').length, color: '#10b981' },
                          { name: t.high, value: entries.filter(e => e.priority === 'High').length, color: '#f59e0b' },
                          { name: t.urgent, value: entries.filter(e => e.priority === 'Urgent').length, color: '#ef4444' }
                        ].filter(p => p.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Legend Indicators */}
              <div className="grid grid-cols-2 gap-2 w-full px-2 mt-2">
                {[
                  { name: t.low, value: entries.filter(e => e.priority === 'Low').length, color: '#94a3b8' },
                  { name: t.medium, value: entries.filter(e => e.priority === 'Medium').length, color: '#10b981' },
                  { name: t.high, value: entries.filter(e => e.priority === 'High').length, color: '#f59e0b' },
                  { name: t.urgent, value: entries.filter(e => e.priority === 'Urgent').length, color: '#ef4444' }
                ].filter(p => p.value > 0).map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-left">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-sans text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Recent Activity Panel & Attachments List (Preserved exactly) */}
      <div className={`grid grid-cols-1 gap-6 ${user.role === 'Super Admin' ? 'lg:grid-cols-2' : ''}`}>
        {/* Latest Uploaded Documents */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 text-left">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600 dark:text-amber-500" />
            <div>
              <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {isSi ? 'අලුතින්ම එක් කළ ගොනු ඇමුණුම්' : 'Latest Uploaded Documents'}
              </h3>
              <p className="font-sans text-[10px] text-slate-400">
                {isSi ? 'පද්ධතියට මෑතකදී උඩුගත කරන ලද ලේඛන සහ වාර්තා' : 'Most recently uploaded files and completion reports'}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {entries.reduce((acc: any[], curr) => {
              if (curr.attachments) {
                curr.attachments.forEach(att => {
                  acc.push({
                    name: att.name,
                    size: att.size,
                    uploadDate: att.uploadDate || (curr.createdAt ? curr.createdAt.split('T')[0] : ''),
                    recordNumber: curr.recordNumber,
                    recordId: curr.id,
                    subject: curr.subject
                  });
                });
              }
              if (curr.completionAttachment) {
                acc.push({
                  name: curr.completionAttachment.name,
                  size: curr.completionAttachment.size,
                  uploadDate: curr.completionAttachment.uploadDate || (curr.completedAt ? curr.completedAt.split('T')[0] : ''),
                  recordNumber: curr.recordNumber,
                  recordId: curr.id,
                  subject: curr.subject
                });
              }
              return acc;
            }, []).sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)).slice(0, 5).length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No documents uploaded yet.
              </div>
            ) : (
              entries.reduce((acc: any[], curr) => {
                if (curr.attachments) {
                  curr.attachments.forEach(att => {
                    acc.push({
                      name: att.name,
                      size: att.size,
                      uploadDate: att.uploadDate || (curr.createdAt ? curr.createdAt.split('T')[0] : ''),
                      recordNumber: curr.recordNumber,
                      recordId: curr.id,
                      subject: curr.subject
                    });
                  });
                }
                if (curr.completionAttachment) {
                  acc.push({
                    name: curr.completionAttachment.name,
                    size: curr.completionAttachment.size,
                    uploadDate: curr.completionAttachment.uploadDate || (curr.completedAt ? curr.completedAt.split('T')[0] : ''),
                    recordNumber: curr.recordNumber,
                    recordId: curr.id,
                    subject: curr.subject
                  });
                }
                return acc;
              }, []).sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)).slice(0, 5).map((file, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    const found = entries.find(e => e.id === file.recordId);
                    if (found) onSelectEntry(found);
                  }}
                  className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100 dark:border-slate-800/40 dark:bg-slate-950/40 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <Paperclip className="h-4.5 w-4.5 text-indigo-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[240px]" title={file.name}>
                        {file.name}
                      </span>
                      <span className="font-sans text-[10px] text-slate-400 mt-0.5 truncate">
                        Assoc: {file.recordNumber} &bull; {file.subject}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span className="font-mono text-[9px] text-slate-400">{file.uploadDate}</span>
                    {file.size && <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400">{file.size}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Registered Users */}
        {user.role === 'Super Admin' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 text-left">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="font-sans text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  {isSi ? 'මෑතකදී ලියාපදිංචි වූ පරිශීලකයින්' : 'Latest Registered Users'}
                </h3>
                <p className="font-sans text-[10px] text-slate-400">
                  {isSi ? 'පද්ධතියට මෑතකදී එක් කරන ලද නිලධාරීන්' : 'Recently registered officers and administrators'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {[...users]
                .sort((a, b) => {
                  const dateA = a.createdAt || '';
                  const dateB = b.createdAt || '';
                  return dateB.localeCompare(dateA);
                })
                .slice(0, 5).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No users registered yet.
                </div>
              ) : (
                [...users]
                  .sort((a, b) => {
                    const dateA = a.createdAt || '';
                    const dateB = b.createdAt || '';
                    return dateB.localeCompare(dateA);
                  })
                  .slice(0, 5).map((u, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/40 dark:bg-slate-950/40"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-900 dark:text-amber-500 shrink-0 uppercase">
                          {u.displayName ? u.displayName.charAt(0) : 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {u.displayName}
                          </span>
                          <span className="font-sans text-[10px] text-slate-400 truncate">
                            {u.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 ml-2">
                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                          {u.role}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 mt-1">
                          {u.createdAt ? u.createdAt.split('T')[0] : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Large Container Advertisement (Preserved exactly) */}
      <div className="mt-6">
        <AdsterraContainerAd language={language} />
      </div>

      {/* Sidebar-style 300x250 Banner at the very bottom (Preserved exactly) */}
      <div className="mt-6 flex justify-center">
        <AdsterraBanner300x250 language={language} />
      </div>

    </div>
  );
});

export default Dashboard;
