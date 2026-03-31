import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Substitua com as configurações do seu projeto Firebase:
// Console → Configurações do projeto → Seus apps → SDK setup
const firebaseConfig = {
  apiKey: 'COLE_AQUI',
  authDomain: 'COLE_AQUI',
  projectId: 'COLE_AQUI',
  storageBucket: 'COLE_AQUI',
  messagingSenderId: 'COLE_AQUI',
  appId: 'COLE_AQUI',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
