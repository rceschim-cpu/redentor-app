import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '../services/userProfile';

export type FontSizePref = 'normal' | 'grande' | 'extra';

export const FONT_SCALES: Record<FontSizePref, number> = {
  normal: 1,
  grande: 1.2,
  extra: 1.4,
};

export const FONT_PREF_LABELS: Record<FontSizePref, string> = {
  normal: 'Normal',
  grande: 'Grande',
  extra: 'Extra Grande',
};

interface FontScaleContextType {
  pref: FontSizePref;
  scale: number;
  setPref: (p: FontSizePref) => Promise<void>;
}

const FontScaleContext = createContext<FontScaleContextType>({
  pref: 'normal',
  scale: 1,
  setPref: async () => {},
});

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const { user, appUser } = useAuth();
  const [pref, setPrefState] = useState<FontSizePref>('normal');

  // Carrega preferência do perfil do usuário
  useEffect(() => {
    const saved = (appUser as any)?.fontSizePreference as FontSizePref | undefined;
    if (saved && saved in FONT_SCALES) setPrefState(saved);
  }, [appUser?.uid]);

  const setPref = useCallback(async (p: FontSizePref) => {
    setPrefState(p);
    if (user) {
      await updateUserProfile(user.uid, { fontSizePreference: p } as any);
    }
  }, [user]);

  return (
    <FontScaleContext.Provider value={{ pref, scale: FONT_SCALES[pref], setPref }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale() {
  return useContext(FontScaleContext);
}
