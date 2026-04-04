import React, { useEffect, useState } from 'react';
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
import { getLiveAndUpcoming, getRecentCultos, YTVideo } from '../services/youtube';

const YOUTUBE_CHANNEL = 'https://www.youtube.com/c/ComunidadedoRedentor';

function VideoCard({ video, onPress }: { video: YTVideo; onPress: () => void }) {
  const isLive = video.liveStatus === 'live';
  const isUpcoming = video.liveStatus === 'upcoming';
  const dateStr = isLive
    ? 'AO VIVO AGORA'
    : isUpcoming
    ? 'EM BREVE'
    : new Date(video.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: video.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        {(isLive || isUpcoming) && (
          <View style={[styles.liveBadge, isLive ? styles.liveBadgeLive : styles.liveBadgeUpcoming]}>
            <Text style={styles.liveBadgeText}>{isLive ? '● AO VIVO' : '⏰ EM BREVE'}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={[styles.cardDate, isLive && styles.cardDateLive]}>{dateStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CultosScreen() {
  const [live, setLive] = useState<YTVideo[]>([]);
  const [recent, setRecent] = useState<YTVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    const key = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    const channel = process.env.EXPO_PUBLIC_YT_CHANNEL_ID;
    if (!key || !channel) {
      setConfigured(false);
      setLoading(false);
      return;
    }

    Promise.all([getLiveAndUpcoming(), getRecentCultos(8)])
      .then(([liveData, recentData]) => {
        setLive(liveData);
        // Filter out from recent those already in live
        const liveIds = new Set(liveData.map((v) => v.id));
        setRecent(recentData.filter((v) => !liveIds.has(v.id)));
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar os cultos.'))
      .finally(() => setLoading(false));
  }, []);

  const openVideo = (video: YTVideo) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`);
  };

  const openChannel = () => {
    Linking.openURL(YOUTUBE_CHANNEL);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!configured) {
    return (
      <View style={styles.center}>
        <Text style={styles.configIcon}>▶️</Text>
        <Text style={styles.configTitle}>Configuração necessária</Text>
        <Text style={styles.configText}>
          Adicione as variáveis{'\n'}
          <Text style={styles.configCode}>EXPO_PUBLIC_GOOGLE_API_KEY</Text>
          {'\n'}
          <Text style={styles.configCode}>EXPO_PUBLIC_YT_CHANNEL_ID</Text>
          {'\n'}no arquivo .env para exibir os cultos.
        </Text>
        <TouchableOpacity style={styles.channelBtn} onPress={openChannel}>
          <Text style={styles.channelBtnText}>Abrir canal no YouTube</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={recent}
      keyExtractor={(v) => v.id}
      ListHeaderComponent={
        <>
          {live.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AO VIVO / EM BREVE</Text>
              {live.map((v) => (
                <VideoCard key={v.id} video={v} onPress={() => openVideo(v)} />
              ))}
            </View>
          )}
          {recent.length > 0 && (
            <Text style={[styles.sectionTitle, { marginTop: live.length > 0 ? 16 : 0 }]}>
              CULTOS RECENTES
            </Text>
          )}
        </>
      }
      renderItem={({ item }) => <VideoCard video={item} onPress={() => openVideo(item)} />}
      ListEmptyComponent={
        !live.length ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>▶️</Text>
            <Text style={styles.emptyText}>Nenhum culto encontrado.</Text>
            <TouchableOpacity style={styles.channelBtn} onPress={openChannel}>
              <Text style={styles.channelBtnText}>Ver canal no YouTube</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
      ListFooterComponent={<View style={{ height: 30 }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  section: { marginBottom: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
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
    top: 8,
    left: 8,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveBadgeLive: { backgroundColor: '#E63946' },
  liveBadgeUpcoming: { backgroundColor: Colors.primary },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  cardDateLive: { color: '#E63946', fontWeight: '700' },
  emptyWrap: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  channelBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  channelBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  configIcon: { fontSize: 48, marginBottom: 16 },
  configTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  configText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  configCode: { fontFamily: 'monospace', color: Colors.primary, fontSize: 12 },
});
