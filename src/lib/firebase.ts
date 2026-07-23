import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  increment,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  getDoc,
  deleteDoc,
  serverTimestamp,
  setLogLevel
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { Video, Category } from '../types';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Silence Firestore SDK's verbose logging on connection timeout or offline status
setLogLevel('silent');

// Dynamic Firebase configuration loaded from environment or applet config
const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyB1zpGbjbG5JzPbzyuOFsJfowKQc2ZMPzE",
  authDomain: firebaseAppletConfig.authDomain || "veloura-17b0f.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "veloura-17b0f",
  storageBucket: firebaseAppletConfig.storageBucket || "veloura-17b0f.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "424963399080",
  appId: firebaseAppletConfig.appId || "1:424963399080:web:d6edf88cacddb72681519d",
  measurementId: firebaseAppletConfig.measurementId || "G-3387MW45L4"
};

const app = initializeApp(firebaseConfig);

// Prioritize custom Firestore database ID to avoid routing to the default database in multi-database environments.
// Enable long polling to ensure reliable reachability in sandbox environments.
export const db = firebaseAppletConfig.firestoreDatabaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseAppletConfig.firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

export const auth = getAuth(app);

// Safely initialize storage in case storage service is not enabled/available in the Firebase project
export const storage = (() => {
  try {
    return getStorage(app);
  } catch (error) {
    console.warn("Firebase Storage service is not enabled or available in this project:", error);
    return null;
  }
})();

const VIDEOS_COLLECTION = 'videos';

export const STATIC_SEED_VIDEOS: Video[] = [
  {
    id: 'sintel',
    title: 'Sintel - Premium Cinematic Showcase',
    description: 'A beautiful, legendary fantasy animation about a lonely girl named Sintel who rescues and bonds with a baby dragon she names Scales. When Scales is snatched away by an adult dragon, Sintel embarks on a desperate and dangerous quest to find him, leading to a tragic, heart-wrenching confrontation.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    duration: '14:48',
    views: 1254302,
    category: 'Romantic',
    uploadDate: new Date('2026-07-01').toISOString(),
    featured: true,
    premium: true,
    active: true,
    likes: 4520,
    dislikes: 21,
    favorites: 0,
    orientation: 'landscape',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fileSize: 12048052
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel - Sci-Fi Thriller',
    description: 'A dystopian sci-fi visual masterpiece set in an alternative future Amsterdam. A group of scientists attempt to rescue the world from destructive giant robots using a high-tech memory retrieval system to rewrite a painful romantic breakup from their past.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: '12:14',
    views: 894320,
    category: 'Hot',
    uploadDate: new Date('2026-07-02').toISOString(),
    featured: false,
    premium: false,
    active: true,
    likes: 3120,
    dislikes: 45,
    favorites: 0,
    orientation: 'landscape',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fileSize: 9482710
  },
  {
    id: 'gilded-symphony',
    title: 'Veloura Gilded Symphony - Amber Horizon',
    description: 'A luxurious experimental study of light, golden embers, and ambient city architectural projections. Captured in ultra-slow motion with pristine sound design to highlight the golden spirit of Veloura.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '00:15',
    views: 187400,
    category: 'Sri Lankan',
    uploadDate: new Date('2026-07-03').toISOString(),
    featured: true,
    premium: false,
    active: true,
    likes: 1240,
    dislikes: 15,
    favorites: 0,
    orientation: 'landscape',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fileSize: 120450
  },
  {
    id: 'machina-illusion',
    title: 'Machina Illusion - Surreal Drama',
    description: 'A surrealistic drama inside a giant, chaotic mechanical machine world where two characters, Proog and Emo, struggle with different perceptions of their mechanical reality.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '10:53',
    views: 312450,
    category: 'Indian',
    uploadDate: new Date('2026-07-04').toISOString(),
    featured: false,
    premium: false,
    active: true,
    likes: 1845,
    dislikes: 12,
    favorites: 0,
    orientation: 'landscape',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fileSize: 8491029
  },
  {
    id: 'neon-cipher',
    title: 'Neon Cipher - Cyber Mystery Theme',
    description: 'A sleek, visual sequence showcasing vibrant cybernetic highlights, digital noise, and heavy industrial synthesizer rhythms designed for premium thriller mystery sequences.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: '00:15',
    views: 98120,
    category: 'Leack',
    uploadDate: new Date('2026-07-05').toISOString(),
    featured: false,
    premium: false,
    active: true,
    likes: 712,
    dislikes: 2,
    favorites: 0,
    orientation: 'landscape',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fileSize: 110480
  },
  {
    id: 'midnight-escape',
    title: 'The Midnight Escape - Noir High Speed',
    description: 'An adrenaline-fueled visual display featuring extreme sports, high-speed motorcycle routes, and breathtaking mountain drops representing the ultimate physical escape from the modern concrete grid.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '00:15',
    views: 451200,
    category: 'Sri Lankan',
    uploadDate: new Date('2026-07-06').toISOString(),
    featured: false,
    premium: false,
    active: true,
    likes: 3410,
    dislikes: 8,
    favorites: 0,
    orientation: 'landscape',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fileSize: 115049
  },
  {
    id: 'elysium-meadow',
    title: 'Elysium Meadow - Symphonic Suite',
    description: 'A beautiful, gentle open-source rendering of woodland creature playfulness, lush gardens, and orchestral overtures highlighting natural landscapes in pristine 4K video streams.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '09:56',
    views: 2453109,
    category: 'Indian',
    uploadDate: new Date('2026-07-07').toISOString(),
    featured: false,
    premium: false,
    active: true,
    likes: 12900,
    dislikes: 104,
    favorites: 0,
    orientation: 'landscape',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fileSize: 7490218
  }
];

// --- FIRESTORE ERROR HANDLING SYSTEM (AS MANDATED BY SKILL) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const isOfflineError = (error: unknown): boolean => {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('offline') || 
    msg.includes('Could not reach') || 
    msg.includes('unavailable') || 
    msg.includes('network') ||
    msg.includes('Failed to get document')
  );
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Seed Initial Videos if the collection is empty
export const seedInitialVideos = async (force: boolean = false) => {
  try {
    // If the database has been explicitly cleared by the admin, skip automatic seeding
    if (!force && typeof window !== 'undefined' && localStorage.getItem('veloura_db_cleared') === 'true') {
      console.log('Seeding skipped because database was explicitly cleared by the admin.');
      return;
    }

    const videosRef = collection(db, VIDEOS_COLLECTION);
    const snapshot = await getDocs(videosRef);
    if (snapshot.empty) {
      console.log('Seeding initial premium videos into Firestore...');
      for (const vid of STATIC_SEED_VIDEOS) {
        // Exclude 'id' field when storing in Firestore document
        const { id, ...docData } = vid;
        await addDoc(videosRef, {
          ...docData,
          uploadDate: serverTimestamp()
        });
      }
      console.log('Successfully seeded Firestore with initial videos!');
    }
  } catch (error: any) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline or unreachable. Skipping seeding of initial videos.');
      return;
    }
    // Handle permission-denied gracefully (normal for non-admin visitors)
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      console.warn('User is not authorized to seed initial videos. Skipping seeding.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, VIDEOS_COLLECTION);
  }
};

// Helper to convert Firestore timestamp structures safely
const parseUploadDate = (data: any): string => {
  if (data.uploadDate) {
    if (typeof data.uploadDate.toDate === 'function') {
      return data.uploadDate.toDate().toISOString();
    } else if (typeof data.uploadDate === 'string') {
      return data.uploadDate;
    } else if (data.uploadDate.seconds) {
      return new Date(data.uploadDate.seconds * 1000).toISOString();
    }
  }
  return new Date().toISOString();
};

// Fetch active videos from Firestore
export const fetchActiveVideosFromFirestore = async (): Promise<Video[]> => {
  try {
    const videosRef = collection(db, VIDEOS_COLLECTION);
    const q = query(videosRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);
    
    const fetchedVideos: Video[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetchedVideos.push({
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        videoUrl: data.videoUrl || '',
        embedUrl: data.embedUrl || data.iframeUrl || '',
        driveFileId: data.driveFileId || '',
        iframeUrl: data.iframeUrl || '',
        duration: data.duration || '',
        views: data.views || 0,
        category: data.category || '',
        downloadUrl: data.downloadUrl || '',
        uploadDate: parseUploadDate(data),
        featured: !!data.featured,
        premium: !!data.premium,
        active: !!data.active,
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        favorites: data.favorites || 0,
        orientation: data.orientation || 'landscape',
        aspectRatio: data.aspectRatio || '16:9',
        resolution: data.resolution || '1920x1080',
        width: data.width || 1920,
        height: data.height || 1080,
        fileSize: data.fileSize || 0,
      });
    });
    
    return fetchedVideos;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Falling back to active static seed videos.');
      return STATIC_SEED_VIDEOS.filter(v => v.active);
    }
    handleFirestoreError(error, OperationType.LIST, VIDEOS_COLLECTION);
    return [];
  }
};

// Fetch ALL videos from Firestore (Admin mode)
export const fetchAllVideosFromFirestore = async (): Promise<Video[]> => {
  try {
    const videosRef = collection(db, VIDEOS_COLLECTION);
    const querySnapshot = await getDocs(videosRef);
    
    const fetchedVideos: Video[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetchedVideos.push({
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        videoUrl: data.videoUrl || '',
        embedUrl: data.embedUrl || data.iframeUrl || '',
        driveFileId: data.driveFileId || '',
        iframeUrl: data.iframeUrl || '',
        duration: data.duration || '',
        views: data.views || 0,
        category: data.category || '',
        downloadUrl: data.downloadUrl || '',
        uploadDate: parseUploadDate(data),
        featured: !!data.featured,
        premium: !!data.premium,
        active: data.active !== false,
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        favorites: data.favorites || 0,
        orientation: data.orientation || 'landscape',
        aspectRatio: data.aspectRatio || '16:9',
        resolution: data.resolution || '1920x1080',
        width: data.width || 1920,
        height: data.height || 1080,
        fileSize: data.fileSize || 0,
      });
    });
    
    return fetchedVideos;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Falling back to all static seed videos.');
      return STATIC_SEED_VIDEOS;
    }
    handleFirestoreError(error, OperationType.LIST, VIDEOS_COLLECTION);
    return [];
  }
};

// Increment views by 1
export const incrementVideoViews = async (id: string) => {
  const path = `${VIDEOS_COLLECTION}/${id}`;
  try {
    const videoDocRef = doc(db, VIDEOS_COLLECTION, id);
    await updateDoc(videoDocRef, {
      views: increment(1)
    });
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Skipping view increment.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Add video record
export const createVideoInFirestore = async (videoData: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'uploadDate'>) => {
  try {
    const videosRef = collection(db, VIDEOS_COLLECTION);
    const docRef = await addDoc(videosRef, {
      ...videoData,
      views: 0,
      likes: 0,
      dislikes: 0,
      favorites: 0,
      uploadDate: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Simulating local video creation.');
      return `local_${Date.now()}`;
    }
    handleFirestoreError(error, OperationType.CREATE, VIDEOS_COLLECTION);
    return '';
  }
};

// Update video record
export const updateVideoInFirestore = async (video: Video) => {
  const path = `${VIDEOS_COLLECTION}/${video.id}`;
  try {
    const videoDocRef = doc(db, VIDEOS_COLLECTION, video.id);
    await updateDoc(videoDocRef, {
      title: video.title,
      description: video.description,
      category: video.category,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      embedUrl: video.embedUrl || video.iframeUrl || '',
      downloadUrl: video.downloadUrl || '',
      driveFileId: video.driveFileId || '',
      iframeUrl: video.iframeUrl || '',
      duration: video.duration,
      featured: video.featured,
      premium: video.premium,
      active: video.active,
      likes: video.likes || 0,
      dislikes: video.dislikes || 0,
      favorites: video.favorites || 0,
      orientation: video.orientation || 'landscape',
      aspectRatio: video.aspectRatio || '16:9',
      resolution: video.resolution || '1920x1080',
      width: video.width || 1920,
      height: video.height || 1080,
      fileSize: video.fileSize || 0,
    });
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Skipping update video.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Delete video record
export const deleteVideoFromFirestore = async (id: string) => {
  const path = `${VIDEOS_COLLECTION}/${id}`;
  try {
    const videoDocRef = doc(db, VIDEOS_COLLECTION, id);
    await deleteDoc(videoDocRef);
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Skipping delete video.');
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Like/Dislike video in Firestore
export const registerReactionInFirestore = async (id: string, type: 'like' | 'dislike') => {
  const path = `${VIDEOS_COLLECTION}/${id}`;
  try {
    const videoDocRef = doc(db, VIDEOS_COLLECTION, id);
    if (type === 'like') {
      await updateDoc(videoDocRef, {
        likes: increment(1)
      });
    } else {
      await updateDoc(videoDocRef, {
        dislikes: increment(1)
      });
    }
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Skipping reaction register.');
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// --- AUTHENTICATED USER ROLES STORE IN FIRESTORE ---

// Seed/Save a user record on sign-up
export const registerUserInFirestore = async (uid: string, email: string, role: 'admin' | 'user') => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email,
      role,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Fetch user profile and role
export const getUserRoleFromFirestore = async (uid: string): Promise<'admin' | 'user' | null> => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data().role as 'admin' | 'user';
    }
    return null;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Simulating user role check.');
      const user = auth.currentUser;
      if (user) {
        const isAdminEmail = 
          user.email === 'mlahiru87@gmail.com' || 
          user.email === 'admin@veloura.tv' ||
          (user.email && (user.email.endsWith('@veloura.tv') || user.email.includes('admin')));
        return isAdminEmail ? 'admin' : 'user';
      }
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

// --- ADMINS COLLECTION OPERATIONS ---

export interface AdminDoc {
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  createdAt?: any;
}

// Seed/Save an admin record
export const registerAdminInFirestore = async (
  uid: string,
  email: string,
  fullName: string,
  role: 'admin' = 'admin',
  active: boolean = true
) => {
  const path = `admins/${uid}`;
  try {
    const adminRef = doc(db, 'admins', uid);
    await setDoc(adminRef, {
      email,
      fullName,
      role,
      active,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Skipping admin registration.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Fetch admin profile and active status
export const getAdminFromFirestore = async (uid: string): Promise<AdminDoc | null> => {
  const path = `admins/${uid}`;
  try {
    const adminRef = doc(db, 'admins', uid);
    const docSnap = await getDoc(adminRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        email: data.email || '',
        fullName: data.fullName || '',
        role: data.role || 'user',
        active: data.active === true,
        createdAt: data.createdAt
      };
    }
    return null;
  } catch (error) {
    if (isOfflineError(error)) {
      console.warn('Firestore is offline. Simulating admin status.');
      const user = auth.currentUser;
      if (user) {
        const isAdminEmail = 
          user.email === 'mlahiru87@gmail.com' || 
          user.email === 'admin@veloura.tv' ||
          (user.email && (user.email.endsWith('@veloura.tv') || user.email.includes('admin')));
        if (isAdminEmail) {
          return {
            email: user.email || '',
            fullName: user.displayName || user.email?.split('@')[0] || 'Master Admin',
            role: 'admin',
            active: true
          };
        }
      }
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};


