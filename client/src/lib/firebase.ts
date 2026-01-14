
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// User provided config
const firebaseConfig = {
    apiKey: "AIzaSyAcuG1Js5TAu_ioPyx_MREd8tgb_WLyKwo",
    authDomain: "cv-ai-7050e.firebaseapp.com",
    projectId: "cv-ai-7050e",
    storageBucket: "cv-ai-7050e.firebasestorage.app",
    messagingSenderId: "531447719118",
    appId: "1:531447719118:web:b127a075c0dca01dff1c9f",
    measurementId: "G-7XBZG1S0SG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
