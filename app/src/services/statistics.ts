import { storageService } from './storage';
import type { StatsData, AddedSong, TrackedArtist } from '@/types';

class StatisticsService {
  getStats(): StatsData {
    const songs = storageService.getAddedSongs();
    const artists = storageService.getTrackedArtists();

    // Osnovne statistike
    const totalSongs = songs.length;
    const autoAdded = songs.filter(s => s.addedAutomatically).length;
    const manualAdded = songs.filter(s => !s.addedAutomatically).length;
    const uniqueArtists = new Set(songs.map(s => s.artistName)).size;
    const uniqueAlbums = new Set(songs.map(s => s.albumName)).size;
    const totalDuration = songs.reduce((sum, s) => sum + (s.durationMs || 0), 0);

    // Pesme po mesecima
    const songsByMonth = this.getSongsByMonth(songs);

    // Top izvođači
    const topArtists = this.getTopArtists(songs);

    // Top žanrovi (iz praćenih izvođača)
    const topGenres = this.getTopGenres(artists);

    return {
      totalSongs,
      autoAdded,
      manualAdded,
      uniqueArtists,
      uniqueAlbums,
      totalDuration,
      songsByMonth,
      topArtists,
      topGenres,
    };
  }

  private getSongsByMonth(songs: AddedSong[]): { month: string; count: number }[] {
    const grouped = new Map<string, number>();
    
    // Poslednjih 12 meseci
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped.set(key, 0);
    }

    songs.forEach(song => {
      const date = new Date(song.addedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (grouped.has(key)) {
        grouped.set(key, (grouped.get(key) || 0) + 1);
      }
    });

    return Array.from(grouped.entries()).map(([month, count]) => ({
      month: this.formatMonth(month),
      count,
    }));
  }

  private formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  private getTopArtists(songs: AddedSong[]): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    songs.forEach(song => {
      counts.set(song.artistName, (counts.get(song.artistName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  private getTopGenres(artists: TrackedArtist[]): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    artists.forEach(artist => {
      artist.genres?.forEach(genre => {
        counts.set(genre, (counts.get(genre) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getActivityHeatmap(): { date: string; count: number }[] {
    const songs = storageService.getAddedSongs();
    const counts = new Map<string, number>();

    // Poslednjih 365 dana
    for (let i = 364; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      counts.set(key, 0);
    }

    songs.forEach(song => {
      const key = new Date(song.addedAt).toISOString().split('T')[0];
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const statisticsService = new StatisticsService();
