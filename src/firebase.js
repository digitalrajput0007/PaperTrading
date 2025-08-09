// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- The new import

// Your web app's Firebase configuration
// IMPORTANT: Use your actual Firebase config here, not these placeholders.
const firebaseConfig = {
    apiKey: "AIzaSyA8ygepAvhMD446wbrSWSNR_cOGhG5Jv0I",
  authDomain: "tradingdashboard-a2acb.firebaseapp.com",
  projectId: "tradingdashboard-a2acb",
  storageBucket: "tradingdashboard-a2acb.firebasestorage.app",
  messagingSenderId: "257501450542",
  appId: "1:257501450542:web:29e8626191094cbcc0eabf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- The new export