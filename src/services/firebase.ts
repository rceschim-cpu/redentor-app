import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCE8zOz0nEqlHWqnIguB7tzkC6_HwWTaVM',
  authDomain: 'redentor-app.firebaseapp.com',
  projectId: 'redentor-app',
  storageBucket: 'redentor-app.firebasestorage.app',
  messagingSenderId: '405698183705',
  appId: '1:405698183705:web:1c7c66fffc50097562e088',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
