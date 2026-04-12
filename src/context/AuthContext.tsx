import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/userProfile';
import { AppUserProfile } from '../types';
import { registerExpoPushToken } from '../services/notifications';

interface AuthContextType {
  user: User | null;
  appUser: AppUserProfile | null;
  loading: boolean;
  isNewUser: boolean;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  isNewUser: false,
  refreshAppUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // true APENAS quando o perfil foi criado nesta sessão (primeiro login real)
  const [isNewUser, setIsNewUser] = useState(false);

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
      if (u) {
        try {
          await loadAppUser(u, true);
        } catch (err) {
          console.error('Erro ao carregar perfil do usuário:', err);
          // Se falhou, cria perfil mínimo para o usuário não ficar preso
          setAppUser({
            uid: u.uid,
            name: u.displayName || u.email?.split('@')[0] || 'Usuário',
            email: u.email ?? '',
            role: 'membro',
          });
        }
      } else {
        setAppUser(null);
      }
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
    <AuthContext.Provider value={{ user, appUser, loading, isNewUser, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
