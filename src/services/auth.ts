import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // updateProfile ANTES de retornar para que loadAppUser no AuthContext
  // já encontre o displayName correto quando rodar (evita race condition)
  await updateProfile(cred.user, { displayName: name });
  // Recarrega o usuário para sincronizar o displayName no objeto auth.currentUser
  await cred.user.reload();
  return cred;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  auth.languageCode = 'pt-BR';
  return sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function translateAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
    'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/operation-not-allowed': 'Cadastro desativado. Contate o administrador.',
  };
  return map[code] ?? 'Erro inesperado. Tente novamente.';
}
