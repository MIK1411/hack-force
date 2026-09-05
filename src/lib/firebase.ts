import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "effective-setup-llcf1",
  appId: "1:656275003766:web:ea2d224b893a3106f14257",
  apiKey: "AIzaSyBlSsSldkGI1DDU3ok7rIJVwhx-a4XbXnk",
  authDomain: "effective-setup-llcf1.firebaseapp.com",
  storageBucket: "effective-setup-llcf1.firebasestorage.app",
  messagingSenderId: "656275003766",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-coalgrid-6028035b-5b9e-4917-9e88-69efe968cbda");
