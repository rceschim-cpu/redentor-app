import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAllBanners } from '../services/banners';

interface BannersContextValue {
  bannerImages: Record<string, string | undefined>;
  refreshBanners: () => Promise<void>;
}

const BannersContext = createContext<BannersContextValue>({
  bannerImages: {},
  refreshBanners: async () => {},
});

export function BannersProvider({ children }: { children: React.ReactNode }) {
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

  // Carrega na inicialização
  useEffect(() => { refreshBanners(); }, [refreshBanners]);

  return (
    <BannersContext.Provider value={{ bannerImages, refreshBanners }}>
      {children}
    </BannersContext.Provider>
  );
}

export const useBanners = () => useContext(BannersContext);
