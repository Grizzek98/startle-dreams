import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNWpyLCRh--reONt1QP1G4jDpXu5ZytBQ",
  authDomain: "startle-dreams.firebaseapp.com",
  projectId: "startle-dreams",
  storageBucket: "startle-dreams.firebasestorage.app",
  messagingSenderId: "578026578647",
  appId: "1:578026578647:web:5704455825da4017fdc692",
  measurementId: "G-8BPY200CKG",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);

export const postsCollection = () => collection(db, "posts");

export const createPost = (title, body, uid, postDate) =>
  addDoc(postsCollection(), {
    title,
    body,
    authorUid: uid,
    postDate: postDate,
  });
export const postsQuery = () =>
  query(postsCollection(), orderBy("postDate", "desc"));
