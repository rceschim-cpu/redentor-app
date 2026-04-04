const CHANNEL_ID = process.env.EXPO_PUBLIC_YT_CHANNEL_ID ?? '';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? '';

export interface YTVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  liveStatus: 'live' | 'upcoming' | 'none';
}

async function searchVideos(params: Record<string, string>): Promise<YTVideo[]> {
  if (!CHANNEL_ID || !API_KEY) return [];
  const qs = new URLSearchParams({
    part: 'snippet',
    channelId: CHANNEL_ID,
    type: 'video',
    key: API_KEY,
    ...params,
  }).toString();

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${qs}`);
  if (!res.ok) throw new Error('YouTube API error');
  const json = await res.json();

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

export async function getLiveAndUpcoming(): Promise<YTVideo[]> {
  const [live, upcoming] = await Promise.allSettled([
    searchVideos({ eventType: 'live', maxResults: '3' }),
    searchVideos({ eventType: 'upcoming', maxResults: '5' }),
  ]);
  return [
    ...(live.status === 'fulfilled' ? live.value : []),
    ...(upcoming.status === 'fulfilled' ? upcoming.value : []),
  ];
}

export async function getRecentCultos(maxResults = 8): Promise<YTVideo[]> {
  return searchVideos({ order: 'date', maxResults: String(maxResults) });
}
