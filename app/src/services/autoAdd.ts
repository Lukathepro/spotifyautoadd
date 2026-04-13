import { spotifyService } from './spotify';
import { storageService } from './storage';
import { notificationService } from './notifications';
import type { AddedSong } from '@/types';

// Check if release is from 2026 or later
function isFrom2026OrLater(releaseDate: string): boolean {
  const release = new Date(releaseDate);
  const cutoff = new Date('2026-01-01');
  return release >= cutoff;
}

class AutoAddService {
  private isRunning = false;
  private cleanupFn: (() => void) | null = null;

  async checkForNewReleases(): Promise<AddedSong[]> {
    if (this.isRunning) {
      console.log('Already checking for new releases...');
      return [];
    }

    this.isRunning = true;
    const addedSongs: AddedSong[] = [];

    try {
      const trackedArtists = storageService.getTrackedArtists();
      const playlistId = storageService.getAutoPlaylistId();

      if (!playlistId) {
        console.log('No auto playlist set');
        notificationService.warning('Provera preskočena', 'Nije izabrana plejlista za automatsko dodavanje');
        return [];
      }

      if (trackedArtists.length === 0) {
        console.log('No tracked artists');
        return [];
      }

      for (const artist of trackedArtists) {
        try {
          // Get artist's albums
          const albums = await spotifyService.getArtistAlbums(artist.id, 50);
          
          // Filter albums from 2026 or later
          const newReleases = albums.filter(album => 
            isFrom2026OrLater(album.release_date)
          );

          for (const album of newReleases) {
            // Get album tracks
            const tracks = await spotifyService.getAlbumTracks(album.id);
            
            for (const track of tracks) {
              // Check if already added
              const existingSongs = storageService.getAddedSongs();
              if (existingSongs.find(s => s.trackId === track.id)) {
                continue;
              }

              // Check if track is by tracked artist (main or featured)
              const isByTrackedArtist = track.artists.some(a => 
                trackedArtists.some(ta => ta.id === a.id)
              );

              if (isByTrackedArtist) {
                // Add to playlist
                await spotifyService.addTracksToPlaylist(playlistId, [track.uri]);

                // Record the added song
                const addedSong: AddedSong = {
                  id: `${Date.now()}-${track.id}`,
                  trackId: track.id,
                  name: track.name,
                  artistName: track.artists.map(a => a.name).join(', '),
                  albumName: album.name,
                  albumImage: album.images[0]?.url,
                  addedAt: new Date().toISOString(),
                  addedAutomatically: true,
                  releaseDate: album.release_date,
                  previewUrl: track.preview_url,
                  durationMs: track.duration_ms,
                };

                storageService.addSong(addedSong);
                addedSongs.push(addedSong);

                // Notifikacija za svaku dodatu pesmu
                notificationService.success(
                  'Nova pesma dodata!',
                  `"${track.name}" od ${track.artists.map(a => a.name).join(', ')}`
                );
              }
            }
          }

          // Update last checked time
          storageService.updateArtistLastChecked(artist.id);
        } catch (error) {
          console.error(`Error checking artist ${artist.name}:`, error);
        }
      }

      storageService.setLastCheck(new Date().toISOString());

      if (addedSongs.length > 0) {
        notificationService.success(
          'Provera završena',
          `Dodato ${addedSongs.length} novih pesama od praćenih izvođača`
        );
      }

      return addedSongs;
    } finally {
      this.isRunning = false;
    }
  }

  async manualAddTrack(trackId: string, playlistId?: string): Promise<AddedSong | null> {
    const targetPlaylistId = playlistId || storageService.getAutoPlaylistId();
    if (!targetPlaylistId) {
      throw new Error('No playlist selected');
    }

    // Check if already added
    const existingSongs = storageService.getAddedSongs();
    if (existingSongs.find(s => s.trackId === trackId)) {
      throw new Error('Track already in playlist');
    }

    // Get track details
    const track = await spotifyService.getTrack(trackId);
    const album = await spotifyService.getAlbum(track.album.id);

    // Add to playlist
    await spotifyService.addTracksToPlaylist(targetPlaylistId, [track.uri]);

    // Record the added song
    const addedSong: AddedSong = {
      id: `${Date.now()}-${track.id}`,
      trackId: track.id,
      name: track.name,
      artistName: track.artists.map(a => a.name).join(', '),
      albumName: album.name,
      albumImage: album.images[0]?.url,
      addedAt: new Date().toISOString(),
      addedAutomatically: false,
      releaseDate: album.release_date,
      previewUrl: track.preview_url,
      durationMs: track.duration_ms,
    };

    storageService.addSong(addedSong);

    notificationService.success(
      'Pesma dodata',
      `"${track.name}" je dodata u plejlistu`
    );

    return addedSong;
  }

  async addAlbumTracks(albumId: string, playlistId?: string): Promise<AddedSong[]> {
    const targetPlaylistId = playlistId || storageService.getAutoPlaylistId();
    if (!targetPlaylistId) {
      throw new Error('No playlist selected');
    }

    const album = await spotifyService.getAlbum(albumId);
    const tracks = await spotifyService.getAlbumTracks(albumId);
    const addedSongs: AddedSong[] = [];

    for (const track of tracks) {
      try {
        // Check if already added
        const existingSongs = storageService.getAddedSongs();
        if (existingSongs.find(s => s.trackId === track.id)) {
          continue;
        }

        // Add to playlist
        await spotifyService.addTracksToPlaylist(targetPlaylistId, [track.uri]);

        // Record the added song
        const addedSong: AddedSong = {
          id: `${Date.now()}-${track.id}`,
          trackId: track.id,
          name: track.name,
          artistName: track.artists.map(a => a.name).join(', '),
          albumName: album.name,
          albumImage: album.images[0]?.url,
          addedAt: new Date().toISOString(),
          addedAutomatically: false,
          releaseDate: album.release_date,
          previewUrl: track.preview_url,
          durationMs: track.duration_ms,
        };

        storageService.addSong(addedSong);
        addedSongs.push(addedSong);
      } catch (error) {
        console.error(`Error adding track ${track.name}:`, error);
      }
    }

    if (addedSongs.length > 0) {
      notificationService.success(
        'Album dodat',
        `${addedSongs.length} pesama iz albuma "${album.name}" je dodato`
      );
    }

    return addedSongs;
  }

  // Dodaj sve pesme od izvođača
  async addAllTracksFromArtist(artistId: string, playlistId?: string): Promise<AddedSong[]> {
    const targetPlaylistId = playlistId || storageService.getAutoPlaylistId();
    if (!targetPlaylistId) {
      throw new Error('No playlist selected');
    }

    const albums = await spotifyService.getArtistAlbums(artistId, 50);
    const addedSongs: AddedSong[] = [];

    for (const album of albums) {
      try {
        const songs = await this.addAlbumTracks(album.id, targetPlaylistId);
        addedSongs.push(...songs);
      } catch (error) {
        console.error(`Error adding album ${album.name}:`, error);
      }
    }

    return addedSongs;
  }

  // Start periodic checking
  startPeriodicCheck(callback?: (songs: AddedSong[]) => void): () => void {
    // Clean up existing interval
    if (this.cleanupFn) {
      this.cleanupFn();
    }

    const settings = storageService.getSettings();
    const intervalMs = settings.autoCheckInterval * 60 * 1000;

    // Check immediately
    this.checkForNewReleases().then(songs => {
      if (songs.length > 0 && callback) {
        callback(songs);
      }
    });

    // Set up interval
    const intervalId = setInterval(() => {
      this.checkForNewReleases().then(songs => {
        if (songs.length > 0 && callback) {
          callback(songs);
        }
      });
    }, intervalMs);

    // Return cleanup function
    this.cleanupFn = () => clearInterval(intervalId);
    return this.cleanupFn;
  }

  // Stop periodic checking
  stopPeriodicCheck(): void {
    if (this.cleanupFn) {
      this.cleanupFn();
      this.cleanupFn = null;
    }
  }

  // Check if running
  isChecking(): boolean {
    return this.isRunning;
  }
}

export const autoAddService = new AutoAddService();
