export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  expires_at?: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string; height: number; width: number }[];
  country: string;
  product: string;
  followers?: { total: number };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  popularity: number;
  uri: string;
  followers?: { total: number };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  artists: SpotifyArtist[];
  images: { url: string; height: number; width: number }[];
  release_date: string;
  total_tracks: number;
  uri: string;
  label?: string;
  copyrights?: { text: string; type: string }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  duration_ms: number;
  explicit: boolean;
  preview_url: string | null;
  track_number: number;
  uri: string;
  popularity?: number;
  disc_number?: number;
}

export interface TrackedArtist {
  id: string;
  name: string;
  image?: string;
  genres?: string[];
  popularity?: number;
  addedAt: string;
  lastChecked?: string;
  totalTracks?: number;
}

export interface AddedSong {
  id: string;
  trackId: string;
  name: string;
  artistName: string;
  albumName: string;
  albumImage?: string;
  addedAt: string;
  addedAutomatically: boolean;
  releaseDate: string;
  previewUrl?: string | null;
  durationMs?: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
    items?: SpotifyPlaylistTrack[];
  };
  uri: string;
  public?: boolean;
  collaborative?: boolean;
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack;
  added_by?: {
    id: string;
  };
}

export interface SearchResult {
  albums: SpotifyAlbum[];
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
}

export interface NewRelease {
  album: SpotifyAlbum;
  artistName: string;
  isFromTrackedArtist: boolean;
  added: boolean;
}

export interface StatsData {
  totalSongs: number;
  autoAdded: number;
  manualAdded: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  totalDuration: number;
  songsByMonth: { month: string; count: number }[];
  topArtists: { name: string; count: number }[];
  topGenres: { name: string; count: number }[];
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface FilterOptions {
  search: string;
  artist: string;
  album: string;
  dateFrom: string;
  dateTo: string;
  autoOnly: boolean;
  manualOnly: boolean;
  sortBy: 'date' | 'name' | 'artist' | 'album';
  sortOrder: 'asc' | 'desc';
}
