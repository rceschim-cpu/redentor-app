import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius } from '../theme';
import {
  isConfigured,
  getLiveAndUpcoming,
  getRecentCultos,
  getChannelPlaylists,
  getPlaylistVideos,
  YTVideo,
  YTPlaylist,
} from '../services/youtube';

const YOUTUBE_CHANNEL = 'https://www.youtube.com/channel/UC8d6h0wY6Y_OW4iaWoLNeiw';
const ACCENT = '#E7C530';

type Tab = 'live' | 'recent' | 'playlists';

// ─── VideoCard ────────────────────────────────────────────────────────────────
function VideoCard({ video, onPress }: { video: YTVideo; onPress: () => void }) {
  const isLive     = video.liveStatus === 'live';
  const isUpcoming = video.liveStatus === 'upcoming';
  const dateStr = isLive
    ? 'AO VIVO AGORA'
    : isUpcoming
    ? 'EM BREVE'
    : new Date(video.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: video.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        {(isLive || isUpcoming) && (
          <View style={[styles.liveBadge, isLive ? styles.badgeLive : styles.badgeUpcoming]}>
            <Text style={styles.liveBadgeText}>{isLive ? '● AO VIVO' : '⏰ EM BREVE'}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={[styles.cardDate, isLive && styles.cardDateLive]}>{dateStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── PlaylistCard ─────────────────────────────────────────────────────────────
function PlaylistCard({ playlist, onPress }: { playlist: YTPlaylist; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: playlist.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.playlistBadge}>
          <Text style={styles.playlistBadgeText}>▶ {playlist.itemCount} vídeos</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{playlist.title}</Text>
        {!!playlist.description && (
          <Text style={styles.cardDate} numberOfLines={1}>{playlist.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function CultosScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [live,      setLive]      = useState<YTVideo[]>([]);
  const [recent,    setRecent]    = useState<YTVideo[]>([]);
  const [playlists, setPlaylists] = useState<YTPlaylist[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Aba de playlist expandida
  const [openPlaylist,       setOpenPlaylist]       = useState<YTPlaylist | null>(null);
  const [playlistVideos,     setPlaylistVideos]     = useState<YTVideo[]>([]);
  const [loadingPlaylist,    setLoadingPlaylist]    = useState(false);

  const configured = isConfigured();

  useEffect(() => {
    if (!configured) { setLoading(false); return; }

    Promise.allSettled([
      getLiveAndUpcoming(),
      getRecentCultos(12),
      getChannelPlaylists(20),
    ]).then(([liveRes, recentRes, playlistsRes]) => {
      const liveData  = liveRes.status      === 'fulfilled' ? liveRes.value      : [];
      const liveIds   = new Set(liveData.map((v) => v.id));
      const recentData = recentRes.status   === 'fulfilled' ? recentRes.value    : [];
      setLive(liveData);
      setRecent(recentData.filter((v) => !liveIds.has(v.id)));
      setPlaylists(playlistsRes.status === 'fulfilled' ? playlistsRes.value : []);
    }).catch(() => Alert.alert('Erro', 'Não foi possível carregar os cultos.'))
      .finally(() => setLoading(false));
  }, []);

  const openVideo = (video: YTVideo) =>
    Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`);

  const openPlaylistDetail = useCallback(async (playlist: YTPlaylist) => {
    setOpenPlaylist(playlist);
    setLoadingPlaylist(true);
    try {
      const videos = await getPlaylistVideos(playlist.id, 20);
      setPlaylistVideos(videos);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os vídeos da playlist.');
    } finally {
      setLoadingPlaylist(false);
    }
  }, []);

  // ─── Sem configuração ────────────────────────────────────────────────────────
  if (!configured) {
    return (
      <View style={styles.center}>
        <Text style={styles.configIcon}>▶️</Text>
        <Text style={styles.configTitle}>Configuração necessária</Text>
        <Text style={styles.configText}>
          Adicione as variáveis{'\n'}
          <Text style={styles.configCode}>EXPO_PUBLIC_GOOGLE_API_KEY</Text>{'\n'}
          <Text style={styles.configCode}>EXPO_PUBLIC_YT_CHANNEL_ID</Text>{'\n'}
          no arquivo .env para exibir os cultos.
        </Text>
        <TouchableOpacity style={styles.channelBtn} onPress={() => Linking.openURL(YOUTUBE_CHANNEL)}>
          <Text style={styles.channelBtnText}>Abrir canal no YouTube</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Playlist aberta ─────────────────────────────────────────────────────────
  if (openPlaylist) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => setOpenPlaylist(null)}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel} numberOfLines={1}>{openPlaylist.title}</Text>
        </TouchableOpacity>

        {loadingPlaylist ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={playlistVideos}
            keyExtractor={(v) => v.id}
            contentContainerStyle={styles.content}
            renderItem={({ item }) => (
              <VideoCard video={item} onPress={() => openVideo(item)} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Nenhum vídeo encontrado.</Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: 30 }} />}
          />
        )}
      </View>
    );
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: 'live',      label: '📡 Ao Vivo' },
    { key: 'recent',    label: '🎬 Recentes' },
    { key: 'playlists', label: '📋 Playlists' },
  ];

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : activeTab === 'live' ? (
        <FlatList
          data={live}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <VideoCard video={item} onPress={() => openVideo(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyText}>Nenhuma transmissão ao vivo ou agendada no momento.</Text>
              <TouchableOpacity style={styles.channelBtn} onPress={() => Linking.openURL(YOUTUBE_CHANNEL)}>
                <Text style={styles.channelBtnText}>Ver canal no YouTube</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      ) : activeTab === 'recent' ? (
        <FlatList
          data={recent}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <VideoCard video={item} onPress={() => openVideo(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={styles.emptyText}>Nenhum culto recente encontrado.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <PlaylistCard playlist={item} onPress={() => openPlaylistDetail(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Nenhuma playlist encontrada.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: Spacing.md },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: ACCENT,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  thumbWrap: { position: 'relative' },
  thumb: { width: '100%', aspectRatio: 16 / 9 },

  liveBadge: {
    position: 'absolute',
    top: 8, left: 8,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLive:     { backgroundColor: '#E63946' },
  badgeUpcoming: { backgroundColor: Colors.primary },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  playlistBadge: {
    position: 'absolute',
    bottom: 8, right: 8,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  playlistBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  cardBody:     { padding: 12 },
  cardTitle:    { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  cardDate:     { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  cardDateLive: { color: '#E63946', fontWeight: '700' },

  // Playlist detalhe — voltar
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  backArrow: { fontSize: 20, color: Colors.primary },
  backLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  // Empty / config
  emptyWrap:   { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyIcon:   { fontSize: 40 },
  emptyText:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  channelBtn:  { marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary },
  channelBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  configIcon:  { fontSize: 48, marginBottom: 16 },
  configTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  configText:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  configCode:  { fontFamily: 'monospace', color: Colors.primary, fontSize: 12 },
});
