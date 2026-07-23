import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

let app;
let auth: any = null;
let db: any = null;
let storage: any = null;
let isFirebaseEnabled = false;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } else {
    app = getApp();
    db = getFirestore(app);
  }
  auth = getAuth(app);
  storage = getStorage(app);
  isFirebaseEnabled = true;
} catch (error) {
  console.error("Firebase failed to initialize cleanly:", error);
  isFirebaseEnabled = false;
}

export { auth, db, storage, isFirebaseEnabled };

