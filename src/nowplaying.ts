/* CLI Portfolio — Last.fm "now playing" widget.
 *
 * Polls Last.fm `user.getRecentTracks` and surfaces whatever the
 * portfolio owner is currently scrobbling (e.g. via Spotify ↔ Last.fm).
 * The Last.fm read API is treated as public (the key only rate-limits),
 * which is why we can call it directly from the browser. */

const LASTFM_ENDPOINT = "https://ws.audioscrobbler.com/2.0/";

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY ?? "";
const USERNAME = import.meta.env.VITE_LASTFM_USERNAME ?? "";

/** Shape we render. Either a track is playing, or the widget is hidden. */
export type NowPlaying =
  | {
      isPlaying: true;
      title: string;
      artist: string;
      album: string;
      url: string;
    }
  | { isPlaying: false };

interface LastFmTrack {
  name?: string;
  url?: string;
  "@attr"?: { nowplaying?: string };
  artist?: { "#text"?: string; name?: string } | string;
  album?: { "#text"?: string; name?: string } | string;
}

interface LastFmResponse {
  recenttracks?: { track?: LastFmTrack[] | LastFmTrack };
  error?: number;
  message?: string;
}

function readField(
  field: LastFmTrack["artist"] | LastFmTrack["album"],
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field["#text"] ?? field.name ?? "";
}

/** Fetch the latest track. Returns isPlaying:false on any error or
 *  when nothing is currently playing. */
export async function fetchNowPlaying(
  signal?: AbortSignal,
): Promise<NowPlaying> {
  if (!API_KEY || !USERNAME) return { isPlaying: false };

  const params = new URLSearchParams({
    method: "user.getrecenttracks",
    user: USERNAME,
    api_key: API_KEY,
    format: "json",
    limit: "1",
    extended: "0",
  });

  let resp: Response;
  try {
    resp = await fetch(`${LASTFM_ENDPOINT}?${params.toString()}`, { signal });
  } catch {
    return { isPlaying: false };
  }
  if (!resp.ok) return { isPlaying: false };

  let data: LastFmResponse;
  try {
    data = (await resp.json()) as LastFmResponse;
  } catch {
    return { isPlaying: false };
  }
  if (data.error) return { isPlaying: false };

  let tracks = data.recenttracks?.track;
  if (!tracks) return { isPlaying: false };
  if (!Array.isArray(tracks)) tracks = [tracks];
  const track = tracks[0];
  if (!track) return { isPlaying: false };

  const isPlaying =
    String(track["@attr"]?.nowplaying ?? "").toLowerCase() === "true";
  if (!isPlaying) return { isPlaying: false };

  return {
    isPlaying: true,
    title: track.name ?? "",
    artist: readField(track.artist),
    album: readField(track.album),
    url: track.url ?? "",
  };
}

export function isConfigured(): boolean {
  return Boolean(API_KEY && USERNAME);
}

export function getUsername(): string {
  return USERNAME;
}
