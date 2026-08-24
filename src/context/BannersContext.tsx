import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAllBanners } from '../services/banners';
import { useAuth } from './AuthContext';

interface BannersContextValue {
  bannerImages: Record<string, string | undefined>;
  refreshBanners: () => Promise<void>;
}

const BannersContext = createContext<BannersContextValue>({
  bannerImages: {},
  refreshBanners: async () => {},
});

export function BannersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bannerImages, setBannerImages] = useState<Record<string, string | undefined>>({});

  const refreshBanners = useCallback(async () => {
    try {
      const all = await getAllBanners();
      const images: Record<string, string | undefined> = {};
      Object.entries(all).forEach(([id, data]) => {
        images[id] = data.imageURL;
      });
      setBannerImages(images);
    } catch {
      // silencioso — mantém estado anterior
    }
  }, []);

  // A coleção /banners exige autenticação. Carregar só na montagem falharia
  // silenciosamente no boot, quando o login ainda não terminou — os banners
  // só apareciam depois de um F5. Refaz a busca a cada mudança de sessão.
  useEffect(() => {
    if (!user) {
      setBannerImages({});
      return;
    }
    refreshBanners();
  }, [user?.uid, refreshBanners]);

  return (
    <BannersContext.Provider value={{ bannerImages, refreshBanners }}>
      {children}
    </BannersContext.Provider>
  );
}

export const useBanners = () => useContext(BannersContext);
