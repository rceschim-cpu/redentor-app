import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loadMatrix } from '../services/permissionMatrix';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/userProfile';
import { AppUserProfile } from '../types';
import { registerExpoPushToken } from '../services/notifications';

interface AuthContextType {
  user: User | null;
  appUser: AppUserProfile | null;
  loading: boolean;
  profilePersisted: boolean;
  isNewUser: boolean;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  profilePersisted: true,
  isNewUser: false,
  refreshAppUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // true APENAS quando o perfil foi criado nesta sessão (primeiro login real)
  const [isNewUser, setIsNewUser] = useState(false);
  // false quando o perfil existe apenas em memória por falha de gravação
  const [profilePersisted, setProfilePersisted] = useState(true);

  const loadAppUser = async (firebaseUser: User, freshLogin = false) => {
    let profile = await getUserProfile(firebaseUser.uid);
    if (!profile) {
      // Primeiro login — cria perfil com role padrão membro
      const newProfile: Omit<AppUserProfile, 'uid' | 'createdAt'> = {
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        email: firebaseUser.email ?? '',
        role: 'membro',
        ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
      };
      await createUserProfile(firebaseUser.uid, newProfile);
      profile = await getUserProfile(firebaseUser.uid);
      setIsNewUser(true); // só aqui: perfil criado agora nesta sessão
    } else {
      if (freshLogin) setIsNewUser(false); // usuário já existe, nunca bloquear

      const updates: Partial<AppUserProfile> = {};
      if (firebaseUser.photoURL && profile.photoURL !== firebaseUser.photoURL) {
        updates.photoURL = firebaseUser.photoURL;
      }
      if (Object.keys(updates).length > 0) {
        await updateUserProfile(firebaseUser.uid, updates);
        profile = { ...profile, ...updates };
      }
    }
    setAppUser(profile);
    if (profile) {
      registerExpoPushToken(profile.uid).catch(() => {});
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setAppUser(null);
        setProfilePersisted(true);
        setLoading(false);
        return;
      }

      // A matriz precisa estar ativa antes de qualquer tela consultar
      // permissões, senão a primeira renderização usa o padrão do código
      await loadMatrix().catch(() => {});

      // O token de autenticação pode ainda não ter chegado ao Firestore quando
      // este callback dispara, e a primeira gravação sai sem credencial. Sem
      // repetir a tentativa, o perfil nunca é criado e a pessoa fica só em
      // memória — invisível em /users e, por consequência, em Membros.
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await loadAppUser(u, true);
          setProfilePersisted(true);
          setLoading(false);
          return;
        } catch (err) {
          lastError = err;
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      }

      // Esgotou. Mantém a pessoa navegando, mas marca que o perfil NÃO foi
      // gravado — o app avisa em vez de fingir que deu certo.
      console.error('Perfil do usuário não pôde ser gravado:', lastError);
      setProfilePersisted(false);
      setAppUser({
        uid: u.uid,
        name: u.displayName || u.email?.split('@')[0] || 'Usuário',
        email: u.email ?? '',
        role: 'membro',
      });
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (user) {
      setIsNewUser(false); // após completar/pular perfil, nunca mais bloquear
      await loadAppUser(user);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, appUser, loading, isNewUser, profilePersisted, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
