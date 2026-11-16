import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

// Firebase web config is public by design; access is enforced by Firestore security rules.
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

const postsCollection = () => collection(db, "posts");
const postRef = (id) => doc(db, "posts", id);

export const postsQuery = () =>
  query(postsCollection(), orderBy("postDate", "desc"));

export const createPost = (body, uid, date) =>
  addDoc(postsCollection(), {
    body,
    authorUid: uid,
    postDate: Timestamp.fromDate(date),
  });

export const updatePost = (id, body, date) =>
  updateDoc(postRef(id), { body, postDate: Timestamp.fromDate(date) });

export const deletePost = (id) => deleteDoc(postRef(id));
