import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Music2,
  Disc3,
  User,
  Clock,
  RefreshCw,
  Zap,
  MousePointerClick,
  ExternalLink,
  Trash2,
  Play,
  Pause,
  TrendingUp,
} from 'lucide-react';
import { storageService } from '@/services/storage';
import { autoAddService } from '@/services/autoAdd';
import { audioPlayerService } from '@/services/audioPlayer';
import { SongFilters } from '@/components/SongFilters';
import { toast } from 'sonner';
import type { AddedSong } from '@/types';

interface DashboardProps {
  onRefresh?: () => void;
  filteredSongs?: AddedSong[];
  onFilterChange?: (songs: AddedSong[]) => void;
}

const STAT_CONFIG = [
  { key: 'totalSongs',    label: 'Ukupno pesama', icon: Music2,           color: '#1db954', bg: 'rgba(29,185,84,0.1)',   border: 'rgba(29,185,84,0.2)'  },
  { key: 'autoAdded',     label: 'Automatski',    icon: Zap,              color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)' },
  { key: 'manualAdded',   label: 'Ručno dodato',  icon: MousePointerClick, color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)'},
  { key: 'uniqueArtists', label: 'Izvođača',      icon: User,             color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)' },
] as const;

export function Dashboard({ onRefresh, filteredSongs: externalFilteredSongs, onFilterChange }: DashboardProps) {
  const [addedSongs, setAddedSongs] = useState<AddedSong[]>([]);
  const [displayedSongs, setDisplayedSongs] = useState<AddedSong[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const unsub = audioPlayerService.subscribe((state) => {
      setPlayingTrackId(state.currentTrack && state.isPlaying ? state.currentTrack.id : null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setDisplayedSongs(externalFilteredSongs ?? addedSongs);
  }, [externalFilteredSongs, addedSongs]);

  const loadData = () => {
    const songs = storageService.getAddedSongs();
    setAddedSongs(songs);
    setDisplayedSongs(songs);
    setLastCheck(storageService.getLastCheck());
    setPlaylistId(storageService.getAutoPlaylistId());
  };

  const handleFilterChange = (songs: AddedSong[]) => {
    setDisplayedSongs(songs);
    onFilterChange?.(songs);
  };

  const checkForNewReleases = async () => {
    setIsChecking(true);
    try {
      const newSongs = await autoAddService.checkForNewReleases();
      if (newSongs.length > 0) {
        toast.success(`Dodato ${newSongs.length} novih pesama!`);
        loadData();
        onRefresh?.();
      } else {
        toast.info('Nema novih pesama od praćenih izvođača');
      }
    } catch { toast.error('Greška pri proveri novih pesama'); }
    finally { setIsChecking(false); }
  };

  const clearHistory = () => {
    if (confirm('Da li si siguran da želiš obrisati celu istoriju?')) {
      storageService.clearAddedSongs();
      loadData();
      toast.success('Istorija obrisana');
    }
  };

  const playPreview = (song: AddedSong) => {
    if (playingTrackId === song.trackId) audioPlayerService.pause();
    else audioPlayerService.play(song.trackId, song.name, song.artistName, song.previewUrl || null);
  };

  const stats = {
    totalSongs: addedSongs.length,
    autoAdded: addedSongs.filter(s => s.addedAutomatically).length,
    manualAdded: addedSongs.filter(s => !s.addedAutomatically).length,
    uniqueArtists: new Set(addedSongs.map(s => s.artistName)).size,
  };

  const fmt = (ms?: number) => {
    if (!ms) return '--:--';
    return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
  };

  return (
      <div className="space-y-5">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg, border }, i) => (
              <div
                  key={key}
                  className={`stat-card p-4 animate-fade-up stagger-${i + 1}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
                </div>
                <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {stats[key]}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              </div>
          ))}
        </div>

        {/* ── Actions bar ── */}
        <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-2xl"
            style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
              onClick={checkForNewReleases}
              disabled={isChecking}
              className="btn-primary btn-shine flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          >
            {isChecking
                ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <RefreshCw className="w-4 h-4" />}
            Proveri nova izdanja
          </button>

          {playlistId && (
              <button
                  onClick={() => window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank')}
                  className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Otvori plejlistu
              </button>
          )}

          {addedSongs.length > 0 && (
              <button
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-full transition-colors"
                  style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 className="w-4 h-4" />
                Obriši istoriju
              </button>
          )}

          <div className="flex-1" />
          <SongFilters onFilterChange={handleFilterChange} />

          {lastCheck && (
              <span className="text-xs hidden lg:block" style={{ color: 'var(--text-dim)' }}>
            Poslednja provera: {new Date(lastCheck).toLocaleString('sr-RS')}
          </span>
          )}
        </div>

        {/* ── Song list ── */}
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Header */}
          <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <Disc3 className="w-4 h-4" style={{ color: 'var(--green)' }} />
              <span className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              Dodate pesme
            </span>
              {displayedSongs.length !== addedSongs.length && (
                  <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                  >
                {displayedSongs.length} / {addedSongs.length}
              </span>
              )}
            </div>
          </div>

          {displayedSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--surface-2)' }}
                >
                  <Music2 className="w-7 h-7" style={{ color: 'var(--text-dim)' }} />
                </div>
                <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {addedSongs.length === 0 ? 'Nema dodatih pesama' : 'Nema rezultata'}
                </p>
                <p className="text-xs text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                  {addedSongs.length === 0
                      ? 'Dodaj izvođače za praćenje ili pretraži albume ručno'
                      : 'Pokušaj sa drugačijim filterima'}
                </p>
              </div>
          ) : (
              <ScrollArea className="h-[440px]">
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {displayedSongs.map((song) => (
                      <div
                          key={song.id}
                          className={`track-row flex items-center gap-3 px-4 py-3 ${playingTrackId === song.trackId ? 'playing' : ''}`}
                      >
                        {/* Play btn */}
                        <button
                            onClick={() => playPreview(song)}
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              color: playingTrackId === song.trackId ? 'var(--green)' : 'var(--text-dim)',
                              background: playingTrackId === song.trackId ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.06)',
                            }}
                        >
                          {playingTrackId === song.trackId
                              ? <Pause className="w-3.5 h-3.5" />
                              : <Play className="w-3.5 h-3.5 ml-0.5" />}
                        </button>

                        {/* Artwork */}
                        {song.albumImage
                            ? <img src={song.albumImage} alt={song.albumName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            : <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
                              <Music2 className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                            </div>
                        }

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{song.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {song.artistName}{song.albumName && song.albumName !== song.name ? ` · ${song.albumName}` : ''}
                          </p>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {song.durationMs && (
                              <span className="text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
                        {fmt(song.durationMs)}
                      </span>
                          )}
                          <span className={song.addedAutomatically ? 'badge-auto' : 'badge-manual'}>
                      {song.addedAutomatically ? 'Auto' : 'Ručno'}
                    </span>
                          <span className="text-xs items-center gap-1 hidden sm:flex" style={{ color: 'var(--text-dim)' }}>
                      <Clock className="w-3 h-3" />
                            {new Date(song.addedAt).toLocaleDateString('sr-RS')}
                    </span>
                        </div>
                      </div>
                  ))}
                </div>
              </ScrollArea>
          )}
        </div>
      </div>
  );
}