// firebase/firebase-init.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";

// Firebase config
const firebaseConfig = {
   apiKey: "AIzaSyAcAaHbimH9lfJ9nx3ma3OCEDKDI2URlIo",
   authDomain: "jobalytics.firebaseapp.com",
   projectId: "jobalytics",
   storageBucket: "jobalytics.appspot.com",
   messagingSenderId: "351217594342",
   appId: "1:351217594342:web:3d299befebae6864f07027",
   measurementId: "G-N7E5N8SE44",
};

// Init Firebase app
const app = initializeApp(firebaseConfig);

// Init Firestore
const db = getFirestore(app);

const storage = getStorage(app);
// Export everything you need
export { app, db, collection, getDocs, storage, ref, uploadBytes };
