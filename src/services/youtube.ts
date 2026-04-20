const CHANNEL_ID = process.env.EXPO_PUBLIC_YT_CHANNEL_ID ?? '';
const API_KEY    = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? '';

export const isConfigured = () => !!(CHANNEL_ID && API_KEY);

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface YTVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  liveStatus: 'live' | 'upcoming' | 'none';
}

export interface YTPlaylist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────
async function ytGet(endpoint: string, params: Record<string, string>) {
  if (!CHANNEL_ID || !API_KEY) return null;
  const qs = new URLSearchParams({ key: API_KEY, ...params }).toString();
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${qs}`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  return res.json();
}

async function searchVideos(params: Record<string, string>): Promise<YTVideo[]> {
  const json = await ytGet('search', {
    part: 'snippet',
    channelId: CHANNEL_ID,
    type: 'video',
    ...params,
  });
  if (!json) return [];
  return (json.items ?? []).map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url,
    publishedAt: item.snippet.publishedAt,
    liveStatus: item.snippet.liveBroadcastContent as 'live' | 'upcoming' | 'none',
  }));
}

// ─── API pública ──────────────────────────────────────────────────────────────
export async function getLiveAndUpcoming(): Promise<YTVideo[]> {
  const [live, upcoming] = await Promise.allSettled([
    searchVideos({ eventType: 'live',     maxResults: '3' }),
    searchVideos({ eventType: 'upcoming', maxResults: '5' }),
  ]);
  return [
    ...(live.status     === 'fulfilled' ? live.value     : []),
    ...(upcoming.status === 'fulfilled' ? upcoming.value : []),
  ];
}

export async function getRecentCultos(maxResults = 10): Promise<YTVideo[]> {
  // Exclui transmissões ao vivo — traz só vídeos normais publicados
  return searchVideos({ order: 'date', maxResults: String(maxResults) });
}

export async function getChannelPlaylists(maxResults = 20): Promise<YTPlaylist[]> {
  const json = await ytGet('playlists', {
    part: 'snippet,contentDetails',
    channelId: CHANNEL_ID,
    maxResults: String(maxResults),
  });
  if (!json) return [];
  return (json.items ?? []).map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url,
    itemCount: item.contentDetails?.itemCount ?? 0,
  }));
}

export async function getPlaylistVideos(playlistId: string, maxResults = 20): Promise<YTVideo[]> {
  const json = await ytGet('playlistItems', {
    part: 'snippet',
    playlistId,
    maxResults: String(maxResults),
  });
  if (!json) return [];
  return (json.items ?? [])
    .filter((item: any) => item.snippet.resourceId?.videoId)
    .map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      liveStatus: 'none' as const,
    }));
}
