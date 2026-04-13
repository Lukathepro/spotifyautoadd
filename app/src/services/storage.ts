import type { TrackedArtist, AddedSong, FilterOptions } from '@/types';

const TRACKED_ARTISTS_KEY = 'tracked_artists';
const ADDED_SONGS_KEY = 'added_songs';
const AUTO_PLAYLIST_ID_KEY = 'auto_playlist_id';
const LAST_CHECK_KEY = 'last_check';
const FILTERS_KEY = 'filters';
const SETTINGS_KEY = 'app_settings';

interface AppSettings {
  darkMode: boolean;
  autoCheckInterval: number; // u minutima
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  defaultPlaylistId: string | null;
}

const defaultSettings: AppSettings = {
  darkMode: true,
  autoCheckInterval: 30,
  notificationsEnabled: true,
  soundEnabled: true,
  defaultPlaylistId: null,
};

class StorageService {
  // Tracked Artists
  getTrackedArtists(): TrackedArtist[] {
    const data = localStorage.getItem(TRACKED_ARTISTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  addTrackedArtist(artist: TrackedArtist): void {
    const artists = this.getTrackedArtists();
    if (!artists.find(a => a.id === artist.id)) {
      artists.push(artist);
      localStorage.setItem(TRACKED_ARTISTS_KEY, JSON.stringify(artists));
    }
  }

  removeTrackedArtist(artistId: string): void {
    const artists = this.getTrackedArtists().filter(a => a.id !== artistId);
    localStorage.setItem(TRACKED_ARTISTS_KEY, JSON.stringify(artists));
  }

  updateArtist(artistId: string, updates: Partial<TrackedArtist>): void {
    const artists = this.getTrackedArtists();
    const index = artists.findIndex(a => a.id === artistId);
    if (index !== -1) {
      artists[index] = { ...artists[index], ...updates };
      localStorage.setItem(TRACKED_ARTISTS_KEY, JSON.stringify(artists));
    }
  }

  updateArtistLastChecked(artistId: string): void {
    this.updateArtist(artistId, { lastChecked: new Date().toISOString() });
  }

  // Added Songs
  getAddedSongs(): AddedSong[] {
    const data = localStorage.getItem(ADDED_SONGS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getFilteredSongs(filters: FilterOptions): AddedSong[] {
    let songs = this.getAddedSongs();

    // Tekstualna pretraga
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      songs = songs.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.artistName.toLowerCase().includes(searchLower) ||
        s.albumName.toLowerCase().includes(searchLower)
      );
    }

    // Filter po izvođaču
    if (filters.artist) {
      songs = songs.filter(s => s.artistName === filters.artist);
    }

    // Filter po albumu
    if (filters.album) {
      songs = songs.filter(s => s.albumName === filters.album);
    }

    // Filter po datumu
    if (filters.dateFrom) {
      songs = songs.filter(s => new Date(s.addedAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      songs = songs.filter(s => new Date(s.addedAt) <= new Date(filters.dateTo));
    }

    // Filter po tipu dodavanja
    if (filters.autoOnly) {
      songs = songs.filter(s => s.addedAutomatically);
    }
    if (filters.manualOnly) {
      songs = songs.filter(s => !s.addedAutomatically);
    }

    // Sortiranje
    songs.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'artist':
          comparison = a.artistName.localeCompare(b.artistName);
          break;
        case 'album':
          comparison = a.albumName.localeCompare(b.albumName);
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return songs;
  }

  addSong(song: AddedSong): void {
    const songs = this.getAddedSongs();
    if (!songs.find(s => s.trackId === song.trackId)) {
      songs.unshift(song);
      localStorage.setItem(ADDED_SONGS_KEY, JSON.stringify(songs));
    }
  }

  removeSong(trackId: string): void {
    const songs = this.getAddedSongs().filter(s => s.trackId !== trackId);
    localStorage.setItem(ADDED_SONGS_KEY, JSON.stringify(songs));
  }

  clearAddedSongs(): void {
    localStorage.removeItem(ADDED_SONGS_KEY);
  }

  // Auto Playlist ID
  getAutoPlaylistId(): string | null {
    return localStorage.getItem(AUTO_PLAYLIST_ID_KEY);
  }

  setAutoPlaylistId(playlistId: string): void {
    localStorage.setItem(AUTO_PLAYLIST_ID_KEY, playlistId);
  }

  // Last Check Time
  getLastCheck(): string | null {
    return localStorage.getItem(LAST_CHECK_KEY);
  }

  setLastCheck(time: string): void {
    localStorage.setItem(LAST_CHECK_KEY, time);
  }

  // Filters
  getFilters(): FilterOptions {
    const data = localStorage.getItem(FILTERS_KEY);
    const defaultFilters: FilterOptions = {
      search: '',
      artist: '',
      album: '',
      dateFrom: '',
      dateTo: '',
      autoOnly: false,
      manualOnly: false,
      sortBy: 'date',
      sortOrder: 'desc',
    };
    return data ? { ...defaultFilters, ...JSON.parse(data) } : defaultFilters;
  }

  setFilters(filters: Partial<FilterOptions>): void {
    const current = this.getFilters();
    localStorage.setItem(FILTERS_KEY, JSON.stringify({ ...current, ...filters }));
  }

  // Settings
  getSettings(): AppSettings {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  }

  setSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  }

  // Get all unique artists from added songs
  getUniqueArtists(): string[] {
    const songs = this.getAddedSongs();
    return Array.from(new Set(songs.map(s => s.artistName))).sort();
  }

  // Get all unique albums from added songs
  getUniqueAlbums(): string[] {
    const songs = this.getAddedSongs();
    return Array.from(new Set(songs.map(s => s.albumName))).sort();
  }

  // Get songs by artist
  getSongsByArtist(artistName: string): AddedSong[] {
    return this.getAddedSongs().filter(s => s.artistName === artistName);
  }

  // Get songs count by artist
  getArtistSongCount(artistName: string): number {
    return this.getAddedSongs().filter(s => s.artistName === artistName).length;
  }

  // Clear all data
  clearAll(): void {
    localStorage.removeItem(TRACKED_ARTISTS_KEY);
    localStorage.removeItem(ADDED_SONGS_KEY);
    localStorage.removeItem(AUTO_PLAYLIST_ID_KEY);
    localStorage.removeItem(LAST_CHECK_KEY);
    localStorage.removeItem(FILTERS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }

  // Export all data
  exportAll(): object {
    return {
      trackedArtists: this.getTrackedArtists(),
      addedSongs: this.getAddedSongs(),
      playlistId: this.getAutoPlaylistId(),
      lastCheck: this.getLastCheck(),
      filters: this.getFilters(),
      settings: this.getSettings(),
    };
  }
}

export const storageService = new StorageService();
export type { AppSettings };
