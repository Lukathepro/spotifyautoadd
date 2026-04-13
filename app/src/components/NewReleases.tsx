import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles, Disc3, Music2, Calendar,
  Plus, Check, ExternalLink, RefreshCw, Play, Pause
} from 'lucide-react';
import { spotifyService } from '@/services/spotify';
import { autoAddService } from '@/services/autoAdd';
import { storageService } from '@/services/storage';
import { audioPlayerService } from '@/services/audioPlayer';
import { toast } from 'sonner';
import type { SpotifyAlbum, SpotifyTrack } from '@/types';

interface NewReleaseItem {
  album: SpotifyAlbum;
  isFromTrackedArtist: boolean;
}

const fmt = (ms: number) =>
    `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

function splitArtists(track: SpotifyTrack, albumArtistIds: Set<string>) {
  const main = track.artists.filter(a => albumArtistIds.has(a.id));
  const feat = track.artists.filter(a => !albumArtistIds.has(a.id));
  return main.length === 0 ? { main: track.artists, feat: [] } : { main, feat };
}

export function NewReleases() {
  const [releases, setReleases]           = useState<NewReleaseItem[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [tracks, setTracks]               = useState<SpotifyTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(new Set());
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // subscribe to audio player
  useState(() => {
    const unsub = audioPlayerService.subscribe(s =>
        setPlayingTrackId(s.currentTrack && s.isPlaying ? s.currentTrack.id : null)
    );
    return unsub;
  });

  const loadNewReleases = async () => {
    setIsLoading(true);
    try {
      const trackedIds = new Set(storageService.getTrackedArtists().map(a => a.id));
      const list = await spotifyService.getNewReleases(50);
      setReleases(list.map(album => ({
        album,
        isFromTrackedArtist: album.artists.some(a => trackedIds.has(a.id)),
      })));
    } catch { toast.error('Greška pri učitavanju novih izdanja'); }
    finally { setIsLoading(false); }
  };

  const openAlbum = async (album: SpotifyAlbum) => {
    setSelectedAlbum(album);
    setIsLoadingTracks(true);
    try {
      const t = await spotifyService.getAlbumTracks(album.id);
      setTracks(t);
      setAddedTrackIds(new Set(storageService.getAddedSongs().map(s => s.trackId)));
    } catch { toast.error('Greška pri učitavanju pesama'); }
    finally { setIsLoadingTracks(false); }
  };

  const addTrack = async (track: SpotifyTrack) => {
    setAddingTrackId(track.id);
    try {
      await autoAddService.manualAddTrack(track.id);
      setAddedTrackIds(p => new Set([...p, track.id]));
      toast.success(`"${track.name}" dodato!`);
    } catch (e: any) {
      if (e.message === 'Track already in playlist') {
        setAddedTrackIds(p => new Set([...p, track.id]));
        toast.info('Već u plejlisti');
      } else toast.error('Greška');
    } finally { setAddingTrackId(null); }
  };

  const addAll = async () => {
    if (!selectedAlbum) return;
    try {
      const added = await autoAddService.addAlbumTracks(selectedAlbum.id);
      if (added.length) {
        setAddedTrackIds(new Set([...addedTrackIds, ...added.map(s => s.trackId)]));
        toast.success(`${added.length} pesama dodato!`);
      } else toast.info('Sve pesme su već u plejlisti');
    } catch { toast.error('Greška'); }
  };

  const playPreview = (track: SpotifyTrack) => {
    if (playingTrackId === track.id) audioPlayerService.pause();
    else audioPlayerService.play(track.id, track.name, track.artists.map(a => a.name).join(', '), track.preview_url);
  };

  const albumArtistIds = new Set(selectedAlbum?.artists.map(a => a.id) ?? []);

  // Sort: tracked first
  const sorted = [...releases].sort((a, b) =>
      Number(b.isFromTrackedArtist) - Number(a.isFromTrackedArtist)
  );

  return (
      <div className="space-y-4">
        {/* ── Header bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--green)' }} />
            <h2 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              Nova izdanja
            </h2>
            {releases.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(29,185,84,0.1)', color: 'var(--green)', border: '1px solid rgba(29,185,84,0.2)' }}>
              {releases.length}
            </span>
            )}
          </div>
          <button onClick={loadNewReleases} disabled={isLoading}
                  className="btn-primary btn-shine flex items-center gap-2 px-4 py-2 text-xs rounded-full disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Osveži
          </button>
        </div>

        {/* ── Empty state ── */}
        {releases.length === 0 && (
            <div className="rounded-2xl py-16 flex flex-col items-center gap-3"
                 style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-float"
                   style={{ background: 'var(--surface-2)' }}>
                <Disc3 className="w-6 h-6" style={{ color: 'var(--text-dim)' }} />
              </div>
              <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                Nema učitanih izdanja
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Klikni "Osveži" da vidiš nova izdanja sa Spotify-a
              </p>
            </div>
        )}

        {/* ── Grid ── */}
        {sorted.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sorted.map((item, i) => (
                  <div key={item.album.id} onClick={() => openAlbum(item.album)}
                       className="group cursor-pointer animate-fade-up"
                       style={{ animationDelay: `${i * 0.02}s` }}>

                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5"
                         style={{ background: 'var(--surface-3)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                           transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s' }}
                         onMouseEnter={e => {
                           (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.03)';
                           (e.currentTarget as HTMLElement).style.boxShadow = item.isFromTrackedArtist
                               ? '0 12px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(29,185,84,0.35)'
                               : '0 12px 32px rgba(0,0,0,0.5)';
                         }}
                         onMouseLeave={e => {
                           (e.currentTarget as HTMLElement).style.transform = '';
                           (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
                         }}>

                      {item.album.images[0]?.url
                          ? <img src={item.album.images[0].url} alt={item.album.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                            <Disc3 className="w-10 h-10" style={{ color: 'var(--text-dim)' }} />
                          </div>}

                      {/* Hover play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                           style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                             style={{ background: 'var(--green)' }}>
                          <Play className="w-4 h-4 text-black ml-0.5" />
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {item.isFromTrackedArtist && (
                            <span className="badge-tracked">Praćen</span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-white truncate leading-snug">{item.album.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {item.album.artists.map(a => a.name).join(', ')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{item.album.release_date}</p>
                  </div>
              ))}
            </div>
        )}

        {/* ── Dialog ── */}
        <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
          <DialogContent className="max-w-2xl max-h-[88vh] p-0 overflow-hidden"
                         style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
            {selectedAlbum && (
                <>
                  {/* Header */}
                  <div className="relative p-6 pb-5"
                       style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {selectedAlbum.images[0]?.url && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                             style={{ backgroundImage: `url(${selectedAlbum.images[0].url})`,
                               backgroundSize: 'cover', backgroundPosition: 'center',
                               filter: 'blur(48px)', transform: 'scale(1.3)' }} />
                    )}
                    <div className="relative flex gap-4">
                      {selectedAlbum.images[0]?.url
                          ? <img src={selectedAlbum.images[0].url} alt={selectedAlbum.name}
                                 className="w-28 h-28 rounded-2xl object-cover flex-shrink-0"
                                 style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} />
                          : <div className="w-28 h-28 rounded-2xl flex-shrink-0 flex items-center justify-center"
                                 style={{ background: 'var(--surface-3)' }}>
                            <Disc3 className="w-12 h-12" style={{ color: 'var(--text-dim)' }} />
                          </div>}
                      <div className="flex-1 min-w-0">
                        <DialogTitle className="text-xl font-bold text-white mb-1 truncate"
                                     style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
                          {selectedAlbum.name}
                        </DialogTitle>
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--green)' }}>
                          {selectedAlbum.artists.map(a => a.name).join(', ')}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{selectedAlbum.release_date}</span>
                          <span className="flex items-center gap-1"><Music2 className="w-3.5 h-3.5" />{selectedAlbum.total_tracks} pesama</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={addAll}
                                  className="btn-primary btn-shine flex items-center gap-2 px-4 py-2 text-xs rounded-full">
                            <Plus className="w-3.5 h-3.5" />Dodaj sve
                          </button>
                          <button onClick={() => window.open(`https://open.spotify.com/album/${selectedAlbum.id}`, '_blank')}
                                  className="btn-ghost flex items-center gap-2 px-4 py-2 text-xs rounded-full">
                            <ExternalLink className="w-3.5 h-3.5" />Spotify
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tracks */}
                  <ScrollArea className="max-h-[50vh]">
                    <div className="p-3">
                      {isLoadingTracks ? (
                          <div className="space-y-2 p-2">
                            {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
                          </div>
                      ) : (
                          <div className="space-y-0.5">
                            {tracks.map(track => {
                              const { main, feat } = splitArtists(track, albumArtistIds);
                              const isPlaying = playingTrackId === track.id;
                              const isAdded   = addedTrackIds.has(track.id);
                              const isAdding  = addingTrackId === track.id;

                              return (
                                  <div key={track.id}
                                       className={`track-row flex items-center gap-3 px-3 py-2.5 rounded-xl ${isPlaying ? 'playing' : ''}`}>
                                    <button onClick={() => playPreview(track)} disabled={!track.preview_url}
                                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{ color: isPlaying ? 'var(--green)' : 'var(--text-dim)',
                                              background: isPlaying ? 'rgba(29,185,84,0.12)' : 'transparent' }}>
                                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                    </button>

                                    <span className="w-5 text-xs text-center tabular-nums flex-shrink-0"
                                          style={{ color: isPlaying ? 'var(--green)' : 'var(--text-dim)' }}>
                              {track.track_number}
                            </span>

                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${isPlaying ? 'text-green-400' : 'text-white'}`}>
                                        {track.name}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                  {main.map(a => a.name).join(', ')}
                                </span>
                                        {feat.length > 0 && (
                                            <>
                                    <span className="text-xs px-1.5 py-0.5 rounded-md font-bold flex-shrink-0"
                                          style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc',
                                            border: '1px solid rgba(192,132,252,0.2)', fontSize: '0.6rem',
                                            fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                      feat.
                                    </span>
                                              <span className="text-xs" style={{ color: '#c084fc' }}>
                                      {feat.map(a => a.name).join(', ')}
                                    </span>
                                            </>
                                        )}
                                      </div>
                                    </div>

                                    <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
                              {fmt(track.duration_ms)}
                            </span>

                                    <button onClick={() => addTrack(track)} disabled={isAdded || isAdding}
                                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{ background: isAdded ? 'rgba(29,185,84,0.15)' : 'var(--green)',
                                              color: isAdded ? 'var(--green)' : '#000' }}>
                                      {isAdding
                                          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                          : isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    </button>
                                  </div>
                              );
                            })}
                          </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}