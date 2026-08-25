import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBtmdf1JVi4HDfdhSgWon7Vk_5j2IMWncI",
  authDomain: "gen-lang-client-0005050059.firebaseapp.com",
  projectId: "gen-lang-client-0005050059",
  storageBucket: "gen-lang-client-0005050059.firebasestorage.app",
  messagingSenderId: "299302590666",
  appId: "1:299302590666:web:37b5845a8f4cd11e2abc33",
  databaseId: "ai-studio-sqlexcelsystemex-1c315985-c684-40c2-8117-8e88f44854b7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
