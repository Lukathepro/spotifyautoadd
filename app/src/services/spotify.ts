import axios from 'axios';
import type {
  SpotifyToken,
  SpotifyUser,
  SpotifyArtist,
  SpotifyAlbum,
  SpotifyTrack,
  SpotifyPlaylist,
  SearchResult,
} from '@/types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const CLIENT_ID = '03d2ac4cdd154f79bd23c87900bf5183';
const REDIRECT_URI = 'https://joyful-platypus-1a37a2.netlify.app/callback';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
  'user-library-read',
];

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

class SpotifyService {
  private token: SpotifyToken | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken() {
    const saved = localStorage.getItem('spotify_token');
    if (saved) {
      this.token = JSON.parse(saved);
    }
  }

  private saveToken(token: SpotifyToken) {
    token.expires_at = Date.now() + token.expires_in * 1000;
    this.token = token;
    localStorage.setItem('spotify_token', JSON.stringify(token));
  }

  async getAuthUrl(): Promise<string> {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem('spotify_code_verifier', verifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(' '),
      code_challenge_method: 'S256',
      code_challenge: challenge,
      show_dialog: 'true',
    });
    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  async handleAuthCallback(search: string): Promise<boolean> {
    const params = new URLSearchParams(search);
    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) return false;

    const verifier = localStorage.getItem('spotify_code_verifier');
    if (!verifier) return false;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    });

    const response = await axios.post(SPOTIFY_TOKEN_URL, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    localStorage.removeItem('spotify_code_verifier');
    this.saveToken(response.data);
    return true;
  }

  async refreshToken(): Promise<boolean> {
    if (!this.token?.refresh_token) return false;

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.token.refresh_token,
      client_id: CLIENT_ID,
    });

    try {
      const response = await axios.post(SPOTIFY_TOKEN_URL, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      this.saveToken({ ...response.data, refresh_token: this.token.refresh_token });
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  isAuthenticated(): boolean {
    if (!this.token) return false;
    if (this.token.expires_at && Date.now() > this.token.expires_at) {
      // Don't auto-logout — let caller decide (may want to refresh)
      return false;
    }
    return true;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_code_verifier');
  }

  private getHeaders() {
    if (!this.token) throw new Error('Not authenticated');
    return {
      Authorization: `${this.token.token_type} ${this.token.access_token}`,
    };
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async search(query: string, type: string = 'album,artist,track', limit: number = 20): Promise<SearchResult> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
      headers: this.getHeaders(),
      params: { q: query, type, limit },
    });
    return {
      albums: response.data.albums?.items || [],
      artists: response.data.artists?.items || [],
      tracks: response.data.tracks?.items || [],
    };
  }

  async getArtist(artistId: string): Promise<SpotifyArtist> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/artists/${artistId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getArtistAlbums(artistId: string, limit: number = 50): Promise<SpotifyAlbum[]> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/artists/${artistId}/albums`, {
      headers: this.getHeaders(),
      params: { limit, include_groups: 'album,single' },
    });
    return response.data.items;
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/albums/${albumId}/tracks`, {
      headers: this.getHeaders(),
      params: { limit: 50 },
    });
    return response.data.items;
  }

  async getTrack(trackId: string): Promise<SpotifyTrack> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getAlbum(albumId: string): Promise<SpotifyAlbum> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/albums/${albumId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async getNewReleases(limit: number = 50, country: string = 'US'): Promise<SpotifyAlbum[]> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/browse/new-releases`, {
      headers: this.getHeaders(),
      params: { limit, country },
    });
    return response.data.albums.items;
  }

  async getUserPlaylists(limit: number = 50): Promise<SpotifyPlaylist[]> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me/playlists`, {
      headers: this.getHeaders(),
      params: { limit },
    });
    return response.data.items;
  }

  async createPlaylist(userId: string, name: string, description: string = '', isPublic: boolean = true): Promise<SpotifyPlaylist> {
    const response = await axios.post(
        `${SPOTIFY_API_BASE}/users/${userId}/playlists`,
        { name, description, public: isPublic },
        { headers: this.getHeaders() }
    );
    return response.data;
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    const chunkSize = 100;
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);
      await axios.post(
          `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
          { uris: chunk },
          { headers: this.getHeaders() }
      );
    }
  }

  async getPlaylistTracks(playlistId: string, limit: number = 100, offset: number = 0): Promise<{ items: any[]; total: number }> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
      headers: this.getHeaders(),
      params: { limit, offset },
    });
    return response.data;
  }

  async checkTracksInPlaylist(playlistId: string, trackIds: string[]): Promise<boolean[]> {
    const response = await axios.get(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
      headers: this.getHeaders(),
      params: { fields: 'items(track(id))', limit: 100 },
    });

    const existingTrackIds = new Set(
        response.data.items.map((item: any) => item.track?.id)
    );

    return trackIds.map(id => existingTrackIds.has(id));
  }
}

export const spotifyService = new SpotifyService();