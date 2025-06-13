import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config (replace with actual values from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDTeaQDeyElLcs9A1Iwdtq2V_yygbBv0_w",
  authDomain: "crushers-fdef6.firebaseapp.com",
  projectId: "crushers-fdef6",
  storageBucket: "crushers-fdef6.firebasestorage.app",
  messagingSenderId: "808539884493",
  appId: "1:808539884493:web:55a37a416b8c489cc9d284",
  measurementId: "G-X0XJ9BVCME"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
