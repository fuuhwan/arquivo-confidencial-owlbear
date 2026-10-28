import { getApp,getApps,initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDpiQqXDAm4ZjJUkYlL8L3IAucJYmZCKRs",
  authDomain: "arquivo-confidencial-hehehe.firebaseapp.com",
  databaseURL:
    "https://arquivo-confidencial-hehehe-default-rtdb.firebaseio.com",
  projectId: "arquivo-confidencial-hehehe",
  storageBucket: "arquivo-confidencial-hehehe.firebasestorage.app",
  messagingSenderId: "566477073274",
  appId: "1:566477073274:web:16327f3dffe769154a84c3",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
