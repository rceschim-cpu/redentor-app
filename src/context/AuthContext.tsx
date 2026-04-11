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
        ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
      };
      await createUserProfile(firebaseUser.uid, newProfile);
      profile = await getUserProfile(firebaseUser.uid);
    } else {
      // Sincroniza campos que podem ter mudado (foto Google, displayName do signup)
      const updates: Partial<AppUserProfile> = {};
      if (firebaseUser.photoURL && profile.photoURL !== firebaseUser.photoURL) {
        updates.photoURL = firebaseUser.photoURL;
      }
      if (firebaseUser.displayName && profile.name !== firebaseUser.displayName) {
        updates.name = firebaseUser.displayName;
      }
      if (Object.keys(updates).length > 0) {
        await updateUserProfile(firebaseUser.uid, updates);
        profile = { ...profile, ...updates };
      }
    }
    setAppUser(profile);
    if (profile) {
      registerExpoPushToken(profile.uid).catch(() => {}); // best-effort, don't block
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          await loadAppUser(u);
        } catch (err) {
          console.error('Erro ao carregar perfil do usuário:', err);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (user) await loadAppUser(user);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, appUser, loading, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
