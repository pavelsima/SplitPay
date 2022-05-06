// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCy1t_eipv4nYI2Km5R9ZnVtTXtuKlVLvk",
  authDomain: "splitpay-48fd0.firebaseapp.com",
  projectId: "splitpay-48fd0",
  storageBucket: "splitpay-48fd0.appspot.com",
  messagingSenderId: "450261841614",
  appId: "1:450261841614:web:141577b9ea8770b17e429f"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);