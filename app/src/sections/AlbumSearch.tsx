import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Disc3, Music2, Calendar,
  Plus, Check, Play, Pause, ExternalLink, X
} from 'lucide-react';
import { spotifyService } from '@/services/spotify';
import { autoAddService } from '@/services/autoAdd';
import { storageService } from '@/services/storage';
import { audioPlayerService } from '@/services/audioPlayer';
import { toast } from 'sonner';
import type { SpotifyAlbum, SpotifyTrack } from '@/types';

const fmt = (ms: number) =>
    `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

function splitArtists(track: SpotifyTrack, albumArtistIds: Set<string>) {
  const main = track.artists.filter(a => albumArtistIds.has(a.id));
  const feat = track.artists.filter(a => !albumArtistIds.has(a.id));
  return main.length === 0 ? { main: track.artists, feat: [] } : { main, feat };
}

export function AlbumSearch() {
  const [query, setQuery]               = useState('');
  const [albums, setAlbums]             = useState<SpotifyAlbum[]>([]);
  const [searching, setSearching]       = useState(false);
  const [selected, setSelected]         = useState<SpotifyAlbum | null>(null);
  const [tracks, setTracks]             = useState<SpotifyTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [addedIds, setAddedIds]         = useState<Set<string>>(new Set());
  const [addingId, setAddingId]         = useState<string | null>(null);
  const [playingId, setPlayingId]       = useState<string | null>(null);
  const [hoveredAlbum, setHoveredAlbum] = useState<string | null>(null);

  useEffect(() => {
    return audioPlayerService.subscribe(s =>
        setPlayingId(s.currentTrack && s.isPlaying ? s.currentTrack.id : null)
    );
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await spotifyService.search(query, 'album', 20);
      setAlbums(r.albums);
    } catch { toast.error('Greška pri pretrazi'); }
    finally { setSearching(false); }
  };

  const openAlbum = async (album: SpotifyAlbum) => {
    setSelected(album);
    setLoadingTracks(true);
    try {
      const t = await spotifyService.getAlbumTracks(album.id);
      setTracks(t);
      setAddedIds(new Set(storageService.getAddedSongs().map(s => s.trackId)));
    } catch { toast.error('Greška pri učitavanju'); }
    finally { setLoadingTracks(false); }
  };

  const addTrack = async (track: SpotifyTrack) => {
    setAddingId(track.id);
    try {
      await autoAddService.manualAddTrack(track.id);
      setAddedIds(p => new Set([...p, track.id]));
      toast.success(`"${track.name}" dodato!`);
    } catch (e: any) {
      if (e.message === 'Track already in playlist') {
        setAddedIds(p => new Set([...p, track.id]));
        toast.info('Već u plejlisti');
      } else if (e.message === 'No playlist selected') {
        toast.error('Izaberi plejlistu u podešavanjima');
      } else toast.error('Greška');
    } finally { setAddingId(null); }
  };

  const addAll = async () => {
    if (!selected) return;
    try {
      const added = await autoAddService.addAlbumTracks(selected.id);
      if (added.length) {
        setAddedIds(new Set([...addedIds, ...added.map(s => s.trackId)]));
        toast.success(`${added.length} pesama dodato!`);
      } else toast.info('Sve pesme su već u plejlisti');
    } catch (e: any) {
      toast.error(e.message === 'No playlist selected' ? 'Izaberi plejlistu u podešavanjima' : 'Greška');
    }
  };

  const playPreview = (track: SpotifyTrack) => {
    if (playingId === track.id) audioPlayerService.pause();
    else audioPlayerService.play(track.id, track.name, track.artists.map(a => a.name).join(', '), track.preview_url || null);
  };

  const albumArtistIds = new Set(selected?.artists.map(a => a.id) ?? []);

  return (
      <div className="space-y-5">
        {/* ── Search bar ── */}
        <div className="rounded-2xl p-5 animate-fade-up"
             style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4" style={{ color: 'var(--green)' }} />
            <h2 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              Pretraži albume
            </h2>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'var(--text-dim)' }} />
              <Input
                  placeholder="Ime albuma, izvođača, pesme..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  className="pl-10 h-11 text-sm border-0 rounded-xl"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)',
                    outline: '1px solid rgba(255,255,255,0.08)' }}
              />
              {query && (
                  <button onClick={() => { setQuery(''); setAlbums([]); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                          style={{ color: 'var(--text-dim)', background: 'var(--surface-3)' }}>
                    <X className="w-3 h-3" />
                  </button>
              )}
            </div>
            <button onClick={search} disabled={searching || !query.trim()}
                    className="btn-primary h-11 px-5 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
              {searching
                  ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <><Search className="w-4 h-4" /><span className="hidden sm:inline">Pretraži</span></>}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {albums.length === 0 && !searching && (
            <div className="rounded-2xl py-16 flex flex-col items-center gap-3"
                 style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
                   style={{ background: 'var(--surface-2)' }}>
                <Disc3 className="w-7 h-7" style={{ color: 'var(--text-dim)' }} />
              </div>
              <p className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                Pretraži albume
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Unesi ime albuma ili izvođača i pritisni Enter
              </p>
            </div>
        )}

        {albums.length > 0 && (
            <div className="rounded-2xl p-5 animate-fade-up"
                 style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Result count */}
              <p className="text-xs mb-4" style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif' }}>
                {albums.length} rezultata
              </p>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                {albums.map((album, i) => (
                    <div key={album.id} onClick={() => openAlbum(album)}
                         className="cursor-pointer animate-fade-up group"
                         style={{ animationDelay: `${i * 0.025}s` }}
                         onMouseEnter={() => setHoveredAlbum(album.id)}
                         onMouseLeave={() => setHoveredAlbum(null)}>

                      {/* Cover */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3"
                           style={{
                             background: 'var(--surface-3)',
                             boxShadow: hoveredAlbum === album.id
                                 ? '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(29,185,84,0.2)'
                                 : '0 4px 16px rgba(0,0,0,0.35)',
                             transform: hoveredAlbum === album.id ? 'translateY(-4px) scale(1.02)' : 'none',
                             transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                           }}>
                        {album.images[0]?.url
                            ? <img src={album.images[0].url} alt={album.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                              <Disc3 className="w-10 h-10" style={{ color: 'var(--text-dim)' }} />
                            </div>}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-end justify-between p-3 transition-opacity"
                             style={{ opacity: hoveredAlbum === album.id ? 1 : 0,
                               background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                               style={{ background: 'var(--green)', boxShadow: '0 4px 12px rgba(29,185,84,0.4)' }}>
                            <Play className="w-4 h-4 text-black ml-0.5" />
                          </div>
                          <span className="text-xs font-bold text-white"
                                style={{ fontFamily: 'Syne, sans-serif' }}>
                      {album.total_tracks} tr.
                    </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-sm font-bold text-white truncate leading-snug"
                           style={{ fontFamily: 'Syne, sans-serif' }}>
                          {album.name}
                        </p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {album.artists.map(a => a.name).join(', ')}
                        </p>
                        <p className="text-xs mt-1 tabular-nums"
                           style={{ color: 'var(--text-dim)' }}>
                          {album.release_date?.slice(0, 4)}
                        </p>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* ── Album dialog ── */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden"
                         style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
            {selected && (
                <>
                  {/* Blurred cover header */}
                  <div className="relative overflow-hidden"
                       style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* BG blur */}
                    {selected.images[0]?.url && (
                        <div className="absolute inset-0 pointer-events-none"
                             style={{
                               backgroundImage: `url(${selected.images[0].url})`,
                               backgroundSize: 'cover', backgroundPosition: 'center',
                               filter: 'blur(60px) saturate(1.5)',
                               transform: 'scale(1.4)',
                               opacity: 0.3,
                             }} />
                    )}
                    <div className="absolute inset-0 pointer-events-none"
                         style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), var(--surface-1))' }} />

                    <div className="relative p-6 flex gap-5">
                      {/* Cover */}
                      {selected.images[0]?.url
                          ? <img src={selected.images[0].url} alt={selected.name}
                                 className="w-32 h-32 rounded-2xl object-cover flex-shrink-0"
                                 style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }} />
                          : <div className="w-32 h-32 rounded-2xl flex-shrink-0 flex items-center justify-center"
                                 style={{ background: 'var(--surface-3)' }}>
                            <Disc3 className="w-14 h-14" style={{ color: 'var(--text-dim)' }} />
                          </div>}

                      {/* Meta */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1"
                             style={{ color: 'var(--green)', fontFamily: 'Syne, sans-serif' }}>
                            {selected.album_type === 'single'
                                ? 'Singl'
                                : selected.album_type === 'compilation'
                                    ? 'Compilation'
                                    : 'Album'}
                          </p>
                          <DialogTitle className="text-2xl font-black text-white mb-1 leading-tight"
                                       style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
                            {selected.name}
                          </DialogTitle>
                          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {selected.artists.map(a => a.name).join(', ')}
                          </p>
                          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-dim)' }}>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />{selected.release_date}
                        </span>
                            <span className="flex items-center gap-1.5">
                          <Music2 className="w-3.5 h-3.5" />{selected.total_tracks} pesama
                        </span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button onClick={addAll}
                                  className="btn-primary btn-shine flex items-center gap-2 px-5 py-2.5 text-xs rounded-full">
                            <Plus className="w-3.5 h-3.5" />Dodaj sve
                          </button>
                          <button onClick={() => window.open(`https://open.spotify.com/album/${selected.id}`, '_blank')}
                                  className="btn-ghost flex items-center gap-2 px-4 py-2.5 text-xs rounded-full">
                            <ExternalLink className="w-3.5 h-3.5" />Otvori
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Track list */}
                  <ScrollArea className="max-h-[48vh]">
                    <div className="p-3">
                      {loadingTracks ? (
                          <div className="space-y-2 p-1">
                            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
                          </div>
                      ) : (
                          <div className="space-y-px">
                            {tracks.map((track) => {
                              const { main, feat } = splitArtists(track, albumArtistIds);
                              const isPlaying = playingId === track.id;
                              const isAdded   = addedIds.has(track.id);
                              const isAdding  = addingId === track.id;

                              return (
                                  <div key={track.id}
                                       className="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                                       style={{
                                         background: isPlaying ? 'rgba(29,185,84,0.07)' : 'transparent',
                                         border: isPlaying ? '1px solid rgba(29,185,84,0.15)' : '1px solid transparent',
                                       }}
                                       onMouseEnter={e => { if (!isPlaying) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                       onMouseLeave={e => { if (!isPlaying) e.currentTarget.style.background = 'transparent'; }}>

                                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                                      <button onClick={() => playPreview(track)}
                                              className="w-7 h-7 rounded-full items-center justify-center transition-all flex"
                                              style={{ color: isPlaying ? 'var(--green)' : 'var(--text-dim)',
                                                background: isPlaying ? 'rgba(29,185,84,0.15)' : 'rgba(255,255,255,0.06)' }}>
                                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                      </button>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-semibold truncate ${isPlaying ? 'text-green-400' : 'text-white'}`}
                                         style={{ fontFamily: isPlaying ? 'Syne, sans-serif' : undefined }}>
                                        {track.name}
                                      </p>

                                      {/* Artists with feat */}
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-xs truncate max-w-[140px]"
                                      style={{ color: 'var(--text-secondary)' }}>
                                  {main.map(a => a.name).join(', ')}
                                </span>
                                        {feat.length > 0 && (
                                            <span className="flex items-center gap-1 flex-shrink-0">
                                    <span className="px-1.5 py-px rounded font-black"
                                          style={{
                                            fontSize: '0.58rem',
                                            fontFamily: 'Syne, sans-serif',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            background: 'rgba(192,132,252,0.15)',
                                            color: '#c084fc',
                                            border: '1px solid rgba(192,132,252,0.25)',
                                          }}>
                                      feat.
                                    </span>
                                    <span className="text-xs truncate max-w-[120px]"
                                          style={{ color: '#d8b4fe' }}>
                                      {feat.map(a => a.name).join(', ')}
                                    </span>
                                  </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Duration */}
                                    <span className="text-xs tabular-nums flex-shrink-0 hidden sm:block"
                                          style={{ color: 'var(--text-dim)' }}>
                              {fmt(track.duration_ms)}
                            </span>

                                    {/* Add button */}
                                    <button onClick={() => addTrack(track)} disabled={isAdded || isAdding}
                                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{
                                              background: isAdded ? 'rgba(29,185,84,0.15)' : 'var(--green)',
                                              color: isAdded ? 'var(--green)' : '#000',
                                              transform: isAdded ? 'scale(1)' : undefined,
                                            }}>
                                      {isAdding
                                          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                          : isAdded
                                              ? <Check className="w-3 h-3" />
                                              : <Plus className="w-3 h-3" />}
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