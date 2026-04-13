import { storageService } from './storage';
import { toast } from 'sonner';

interface ExportData {
  version: string;
  exportedAt: string;
  trackedArtists: ReturnType<typeof storageService.getTrackedArtists>;
  addedSongs: ReturnType<typeof storageService.getAddedSongs>;
  playlistId: ReturnType<typeof storageService.getAutoPlaylistId>;
}

class DataTransferService {
  exportData(): string {
    const data: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      trackedArtists: storageService.getTrackedArtists(),
      addedSongs: storageService.getAddedSongs(),
      playlistId: storageService.getAutoPlaylistId(),
    };

    return JSON.stringify(data, null, 2);
  }

  downloadExport(): void {
    const data = this.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spotify-auto-playlist-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Podaci izvezeni uspešno');
  }

  importData(jsonString: string): boolean {
    try {
      const data: Partial<ExportData> = JSON.parse(jsonString);

      // Validacija
      if (!data.version) {
        toast.error('Nevažeći format fajla');
        return false;
      }

      // Uvoz praćenih izvođača
      if (data.trackedArtists && Array.isArray(data.trackedArtists)) {
        const existing = storageService.getTrackedArtists();
        const merged = [...existing];
        
        data.trackedArtists.forEach(artist => {
          if (!merged.find(a => a.id === artist.id)) {
            merged.push(artist);
          }
        });
        
        localStorage.setItem('tracked_artists', JSON.stringify(merged));
      }

      // Uvoz dodatih pesama
      if (data.addedSongs && Array.isArray(data.addedSongs)) {
        const existing = storageService.getAddedSongs();
        const merged = [...existing];
        
        data.addedSongs.forEach(song => {
          if (!merged.find(s => s.trackId === song.trackId)) {
            merged.push(song);
          }
        });
        
        // Sortiraj po datumu dodavanja
        merged.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        localStorage.setItem('added_songs', JSON.stringify(merged));
      }

      // Uvoz playlist ID
      if (data.playlistId) {
        storageService.setAutoPlaylistId(data.playlistId);
      }

      toast.success('Podaci uvezeni uspešno');
      return true;
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Greška pri uvozu podataka');
      return false;
    }
  }

  async importFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(this.importData(content));
      };
      reader.onerror = () => {
        toast.error('Greška pri čitanju fajla');
        resolve(false);
      };
      reader.readAsText(file);
    });
  }

  // Deljenje podataka (generiše link koji može da se kopira)
  generateShareLink(): string {
    const data = this.exportData();
    const compressed = btoa(encodeURIComponent(data));
    return `${window.location.origin}/import?data=${compressed}`;
  }

  // Učitaj podatke iz share linka
  loadFromShareLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const data = urlObj.searchParams.get('data');
      if (data) {
        const jsonString = decodeURIComponent(atob(data));
        return this.importData(jsonString);
      }
      return false;
    } catch (error) {
      console.error('Share link error:', error);
      return false;
    }
  }
}

export const dataTransferService = new DataTransferService();
