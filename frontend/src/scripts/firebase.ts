// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5m_AnO575kvWriahcF1SFIWp8Fj3gQno",
  authDomain: "monkey-type.firebaseapp.com",
  databaseURL: "https://monkey-type.firebaseio.com",
  projectId: "monkey-type",
  storageBucket: "monkey-type.appspot.com",
  messagingSenderId: "789788471140",
  appId: "1:789788471140:web:7e31b15959d68ac0a51471",
  measurementId: "G-PFV65WPEWF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const Auth = getAuth(app);
export const Analytics = getAnalytics(app);
