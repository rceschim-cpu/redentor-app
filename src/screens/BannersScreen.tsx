import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import { Card } from '../components';
import { showAlert } from '../utils/alert';
import { useAuth } from '../context/AuthContext';
import { getAllBanners, updateBannerImage, deleteBannerImage, BannerData } from '../services/banners';
import { useBanners } from '../context/BannersContext';
import { uploadToCloudinary } from '../services/cloudinary';

const BANNER_META = [
  { id: '1', label: 'Banner 1', color: '#C0392B', colorName: 'Vermelho' },
  { id: '2', label: 'Banner 2', color: '#4A90C4', colorName: 'Azul' },
  { id: '3', label: 'Banner 3', color: '#B8960C', colorName: 'Dourado' },
  { id: '4', label: 'Banner 4', color: '#5BA56A', colorName: 'Verde' },
];

type BannerState = {
  data: BannerData;
  pendingFile: File | null;
  pendingURL: string | null;
  uploading: boolean;
  saving: boolean;
};

export default function BannersScreen() {
  const { appUser } = useAuth();
  const { refreshBanners } = useBanners();
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Record<string, BannerState>>({});

  useEffect(() => {
    (async () => {
      const all = await getAllBanners().catch(() => ({} as Record<string, any>));
      const state: Record<string, BannerState> = {};
      BANNER_META.forEach(({ id }) => {
        state[id] = {
          data: all[id] ?? {},
          pendingFile: null,
          pendingURL: null,
          uploading: false,
          saving: false,
        };
      });
      setBanners(state);
      setLoading(false);
    })();
  }, []);

  const update = (id: string, patch: Partial<BannerState>) =>
    setBanners((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const pickFile = (id: string) => {
    if (Platform.OS !== 'web') {
      showAlert('Atenção', 'O upload de imagens está disponível apenas pelo app web.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file: File | undefined = e.target?.files?.[0];
      if (!file) return;

      update(id, { uploading: true, pendingFile: null, pendingURL: null });
      try {
        const { url } = await uploadToCloudinary(file);
        update(id, { pendingFile: file, pendingURL: url, uploading: false });
      } catch (err: any) {
        update(id, { uploading: false });
        showAlert('Erro no upload', err?.message ?? 'Não foi possível enviar a imagem.');
      }
    };
    input.click();
  };

  const saveBanner = async (id: string) => {
    const banner = banners[id];
    if (!banner?.pendingURL || !appUser) return;
    update(id, { saving: true });
    try {
      await updateBannerImage(id, banner.pendingURL, appUser.uid);
      update(id, {
        data: { ...banner.data, imageURL: banner.pendingURL, updatedAt: new Date().toISOString() },
        pendingFile: null,
        pendingURL: null,
        saving: false,
      });
      await refreshBanners();
      showAlert('Atualizado!', 'O banner foi atualizado com sucesso.');
    } catch {
      update(id, { saving: false });
      showAlert('Erro', 'Não foi possível salvar o banner.');
    }
  };

  const cancelPending = (id: string) =>
    update(id, { pendingFile: null, pendingURL: null });

  const removeBanner = async (id: string) => {
    update(id, { saving: true });
    try {
      await deleteBannerImage(id);
      update(id, {
        data: { ...banners[id].data, imageURL: undefined },
        saving: false,
      });
      await refreshBanners();
    } catch {
      update(id, { saving: false });
      showAlert('Erro', 'Não foi possível remover a imagem.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageDesc}>
        Faça upload de uma imagem para substituir o banner. A imagem aparece no carrossel da tela inicial.
      </Text>

      {BANNER_META.map(({ id, label, color, colorName }) => {
        const banner = banners[id];
        if (!banner) return null;
        const currentURL = banner.data.imageURL;
        const previewURL = banner.pendingURL ?? currentURL;

        return (
          <Card key={id} style={styles.bannerCard}>
            {/* Header colorido */}
            <View style={[styles.bannerHeader, { backgroundColor: color }]}>
              <Text style={styles.bannerLabel}>{label}</Text>
              <View style={styles.colorPill}>
                <Text style={styles.colorPillText}>{colorName}</Text>
              </View>
            </View>

            {/* Preview da imagem */}
            {previewURL ? (
              <View style={styles.previewWrap}>
                <Image
                  source={{ uri: previewURL }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                {banner.pendingURL && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Prévia — ainda não salvo</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyIcon}>🖼️</Text>
                <Text style={styles.emptyText}>Nenhuma imagem definida</Text>
              </View>
            )}

            {/* Ações */}
            <View style={styles.actions}>
              {banner.uploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.uploadingText}>Enviando imagem...</Text>
                </View>
              ) : banner.pendingURL ? (
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.btnSave}
                    onPress={() => saveBanner(id)}
                    disabled={banner.saving}
                  >
                    <Text style={styles.btnSaveText}>
                      {banner.saving ? 'Salvando...' : '✓ Atualizar banner'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => cancelPending(id)}
                    disabled={banner.saving}
                  >
                    <Text style={styles.btnCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    style={styles.btnUpload}
                    onPress={() => pickFile(id)}
                    disabled={banner.saving}
                  >
                    <Text style={styles.btnUploadText}>
                      {currentURL ? '🔄  Trocar imagem' : '＋  Adicionar imagem'}
                    </Text>
                  </TouchableOpacity>
                  {currentURL && (
                    <TouchableOpacity
                      style={styles.btnRemove}
                      onPress={() => removeBanner(id)}
                      disabled={banner.saving}
                    >
                      <Text style={styles.btnRemoveText}>
                        {banner.saving ? 'Removendo...' : '✕  Remover imagem'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </Card>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  bannerCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  colorPill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  colorPillText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  previewWrap: { position: 'relative' },
  previewImage: { width: '100%', height: 140 },
  pendingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  emptyPreview: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 6,
  },
  emptyIcon: { fontSize: 28 },
  emptyText: { fontSize: 12, color: Colors.textMuted },
  actions: { padding: 12 },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 6 },
  uploadingText: { fontSize: 13, color: Colors.textSecondary },
  pendingActions: { gap: 8 },
  btnSave: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnCancel: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnCancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  btnUpload: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnUploadText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  btnRemove: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnRemoveText: { color: Colors.danger, fontWeight: '600', fontSize: 13 },
});
