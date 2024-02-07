import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhoC2tMlqVfejhl1V0Cq0ngFpaEqjVBvc",
  authDomain: "treasurer-connect.firebaseapp.com",
  projectId: "treasurer-connect",
  storageBucket: "treasurer-connect.appspot.com",
  messagingSenderId: "583639357893",
  appId: "1:583639357893:web:4dc8c3c84c3972a6a4d3ac",
  measurementId: "G-1YS8YM8K8F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app);