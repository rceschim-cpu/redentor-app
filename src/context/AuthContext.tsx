import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile, createUserProfile } from '../services/userProfile';
import { AppUserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUserProfile | null;
  loading: boolean;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  refreshAppUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAppUser = async (firebaseUser: User) => {
    let profile = await getUserProfile(firebaseUser.uid);
    if (!profile) {
      // Primeiro login — cria perfil com role padrão membro
      const newProfile: Omit<AppUserProfile, 'uid' | 'createdAt'> = {
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        email: firebaseUser.email ?? '',
        role: 'membro',
      };
      await createUserProfile(firebaseUser.uid, newProfile);
      profile = await getUserProfile(firebaseUser.uid);
    }
    setAppUser(profile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadAppUser(u);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshAppUser = async () => {
    if (user) await loadAppUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
