
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// User provided config
const firebaseConfig = {
    apiKey: "key",
    authDomain: "cv.firebaseapp.com",
    projectId: "id",
    storageBucket: "cv.link.app",
    messagingSenderId: "oll",
    appId: "1::web:",
    measurementId: "G-"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
