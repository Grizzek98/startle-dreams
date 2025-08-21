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

const firebaseConfig = {
  type: "service_account",
  project_id: "startle-dreams",
  private_key_id: "be65c52f794e6a18944e441e1783de6fd784fc4c",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQChxcEP1d5s57+O\nyNoU2lmWpxXGc41hjoblLqqWP/B+B1NY9C8RlybLbMdMYg8/b07cQRzTz8mtmcz3\nKpjSH0GJyIkXcTS8kL1UZo3k58etyXFE9vfPuUTsC0C2Pzyp0x71OC3xzra8PT21\n9yY+xC3jaIYEi2UIHnyHP37KIy3GKIOnw4h9nJSsvj0CCau1f4ktGAEmbXzORA24\nFxNKPOAlScKdqD+XK8tydk1GCFbbnqYF0GoD7PofBnmZdqRwL3lxBXK0zCJAjgoB\ncGCSTkd0C/Jsj2U3e5BxJMifFX371cQj0oZKiOmtPd1kudRDmHLNl226vOQjez9x\nkZ/njxwrAgMBAAECggEAKcclZc6Iw71R5jEOyQXezx5VbEvZPlGNmtBjc6wNkq6X\noshlA3jypuRvz9UfNPWs+wrBxB3Mas3mdgqFLvateUTVyr0Mron+qzZU/MGy+rmk\nS/gv5XBmUUNSsf5Az2bbft7EVsdYv+Jc9opeUSVe6HTM742ESQV+iXsnZlKRdrQE\nSRDdCCK4Pch0PGGbFUTKe6pEjSvDKgqR9PWJJquiMbCbZUmvPmWbwsolfenHH2AB\nDrWpasqJU2/oAppixgrjh9HurgQhlRF1YCllS8k7DxVP1UjdpQhQT7M54wJMHLWk\nCfN8Iv8Iuhl89yUP37OQD8JahamQDjbhIwVP0fsTyQKBgQDezMg7Qn0BMGKBHpgB\nFm4UqPLy1qlLkpKXveMlOjaadBsa2x3xVp4/4SJ1byMiUJ3pxSwB0Zz74LVQsGSj\nHPjSvfAmTpH6UK8TyC26rysAUOu+Cx0gGKMW9uD2vbVOSGMAZozFrY/kflEPeQZ+\nPsuKQZ8gbgGt9s+Xc+/Ui+BwvQKBgQC54PBZbBLKEPi05yb0UKED+aTRdHDry3NT\nOdf+whIWW/+F1bu+ObQJjroxiHcbFZiuHUxMest59KrNXOVVbokL6LYe8qP6/vcz\njGTTJ8ElSA6KCvKoIkecpPDsRVpUto2CqQbMa0Cg+XfShkDGWD3TAMseH3WQDczd\n2rcncCYTBwKBgG5im1nw6SorpMJAPCNdz5Bg3G3AOQR+TC7uH5oUK3V+zOcTZNRr\ni+AuVPpF4+xecL6ft9v21IZeoLanjlTaR9Vx0YfJKb4RN4zfgviZTP7NGN+Bdh6u\n1i7Mhkz5VNjCOHq8VEakZURZ6SN3XOYzininZoWUuzRLsjJheJOf8cUpAoGAUM04\njhbN4CsagkFNjL0UEY9PF4IfqFDLtC0b+PHSPQgG/t3XfCzHV7REuk2RQSPVODMi\nPMjQdRZnvVgZlVa0momxyag+olh9i1oHZkcMzjERqO5zZ6VnLfABjyPizZqBz3+8\npdYlxRRNAyY7OD2ZuoTIxzJzv4hQO0zde3ZkBrcCgYEAxlkxPWE/rhjLWtGYXXZw\nC6DBtEzwI91YBkDDmo3apUs1nEnd1vtLtSqb1fkG4xprpujD25VdUutNgMpn0bXX\n+U+2De4pIC4n/gh/bkbEe9RRS647INJxCASNKedGNOFNppz3iws3eXEXstbJlf60\nDtbjqN8XeqrJ1oyADEc85ac=\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-fbsvc@startle-dreams.iam.gserviceaccount.com",
  client_id: "116536666258380747072",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40startle-dreams.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
export const signOutUser = () => signOut(auth);

export const postsCollection = () => collection(db, "posts");

export const createPost = (title, body, uid) =>
  addDoc(postsCollection(), {
    title,
    body,
    authorUid: uid,
    createdAt: serverTimestamp(),
  });
export const postsQuery = () =>
  query(postsCollection(), orderBy("createdAt", "desc"));
