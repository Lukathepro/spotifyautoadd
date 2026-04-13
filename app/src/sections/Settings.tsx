import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Settings2, Plus, Music2, Check, ExternalLink,
  RefreshCw, Trash2, LogOut, User, Globe, Star,
  Clock, Zap, Bell, BellOff,
} from 'lucide-react';
import { spotifyService } from '@/services/spotify';
import { storageService } from '@/services/storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { SpotifyPlaylist, SpotifyUser } from '@/types';
import type { AppSettings } from '@/services/storage';

interface SettingsProps { user: SpotifyUser | null; }

function getImg(p: SpotifyPlaylist): string | null {
  return p.images?.[0]?.url ?? null;
}

const INTERVAL_OPTIONS = [
  { value: 15,  label: '15 min',  desc: 'Agresivno — može kočiti' },
  { value: 30,  label: '30 min',  desc: 'Default' },
  { value: 60,  label: '1 sat',   desc: 'Preporučeno' },
  { value: 120, label: '2 sata',  desc: 'Lagano' },
  { value: 360, label: '6 sati',  desc: 'Minimalno' },
];

export function Settings({ user }: SettingsProps) {
  const { logout } = useAuth();
  const [playlists, setPlaylists]           = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating]         = useState(false);
  const [showDialog, setShowDialog]         = useState(false);
  const [settings, setSettings]             = useState<AppSettings>(() => storageService.getSettings());

  useEffect(() => {
    loadPlaylists();
    setSelectedPlaylistId(storageService.getAutoPlaylistId());
  }, []);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try { setPlaylists(await spotifyService.getUserPlaylists(50)); }
    catch { toast.error('Greška pri učitavanju plejlisti'); }
    finally { setIsLoading(false); }
  };

  const selectPlaylist = (id: string) => {
    storageService.setAutoPlaylistId(id);
    setSelectedPlaylistId(id);
    setShowDialog(false);
    toast.success('Plejlista izabrana');
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;
    setIsCreating(true);
    try {
      const pl = await spotifyService.createPlaylist(user.id, newPlaylistName, 'Auto-Playlist', true);
      storageService.setAutoPlaylistId(pl.id);
      setSelectedPlaylistId(pl.id);
      setNewPlaylistName('');
      await loadPlaylists();
      toast.success('Plejlista kreirana');
    } catch { toast.error('Greška pri kreiranju'); }
    finally { setIsCreating(false); }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    storageService.setSettings({ [key]: value });
  };

  const clearAllData = () => {
    if (confirm('Da li si siguran? Ovo će obrisati sve praćene izvođače i istoriju.')) {
      storageService.clearAll();
      toast.success('Svi podaci obrisani');
      window.location.reload();
    }
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const userFields = [
    { icon: User,  label: 'Email',  value: user?.email },
    { icon: Globe, label: 'Zemlja', value: user?.country },
    { icon: Star,  label: 'Plan',   value: user?.product },
  ];

  const currentInterval = INTERVAL_OPTIONS.find(o => o.value === settings.autoCheckInterval)
      ?? INTERVAL_OPTIONS[1];

  return (
      <div className="space-y-4 w-full">

        {/* ── User card ── */}
        <div className="rounded-2xl p-5 animate-fade-up"
             style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, var(--green), #4ade80)', color: '#000',
                   fontFamily: 'Syne, sans-serif', boxShadow: '0 4px 16px rgba(29,185,84,0.3)' }}>
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-white text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                {user?.display_name}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Spotify nalog</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {userFields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl p-3"
                     style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif' }}>{label}</span>
                  </div>
                  <p className="text-sm font-medium text-white capitalize truncate">{value || '—'}</p>
                </div>
            ))}
          </div>

          <button onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
                  style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <LogOut className="w-4 h-4" />Odjavi se
          </button>
        </div>

        {/* ── Auto-check interval ── */}
        <div className="rounded-2xl p-5 space-y-4 animate-fade-up stagger-1"
             style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--green)' }} />
              <h2 className="font-bold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                Interval auto-provere
              </h2>
            </div>
            {/* Current interval badge */}
            <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(29,185,84,0.12)', color: 'var(--green)',
                    border: '1px solid rgba(29,185,84,0.2)', fontFamily: 'Syne, sans-serif' }}>
            Trenutno: {currentInterval.label}
          </span>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Koliko često app automatski proverava nova izdanja praćenih izvođača.
            Kraći interval = više API poziva = može kočiti app.
          </p>

          {/* Interval options */}
          <div className="grid grid-cols-5 gap-2">
            {INTERVAL_OPTIONS.map(opt => {
              const active = settings.autoCheckInterval === opt.value;
              return (
                  <button key={opt.value}
                          onClick={() => updateSetting('autoCheckInterval', opt.value)}
                          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all"
                          style={{
                            background: active ? 'rgba(29,185,84,0.12)' : 'var(--surface-2)',
                            border: `1px solid ${active ? 'rgba(29,185,84,0.35)' : 'rgba(255,255,255,0.06)'}`,
                            color: active ? 'var(--green)' : 'var(--text-secondary)',
                          }}>
                <span className="text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {opt.label}
                </span>
                    <span className="text-xs text-center leading-tight" style={{ color: active ? 'rgba(29,185,84,0.7)' : 'var(--text-dim)', fontSize: '0.6rem' }}>
                  {opt.desc}
                </span>
                  </button>
              );
            })}
          </div>

          {/* Warning for short interval */}
          {settings.autoCheckInterval <= 30 && (
              <div className="flex gap-2 p-3 rounded-xl text-xs"
                   style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <Zap className="w-4 h-4 flex-shrink-0" style={{ color: '#fbbf24' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
              Kratak interval može usporiti app ako pratiš mnogo izvođača. Preporučujemo 60+ minuta.
            </span>
              </div>
          )}

          {/* Notifications toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl"
               style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              {settings.notificationsEnabled
                  ? <Bell className="w-4 h-4" style={{ color: 'var(--green)' }} />
                  : <BellOff className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />}
              <div>
                <p className="text-sm font-semibold text-white">Notifikacije u app-u</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Prikazuj obaveštenja kada se dodaju pesme
                </p>
              </div>
            </div>
            <button
                onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                className="w-10 h-6 rounded-full transition-all flex-shrink-0 relative"
                style={{ background: settings.notificationsEnabled ? 'var(--green)' : 'var(--surface-4)' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                   style={{ left: settings.notificationsEnabled ? '20px' : '2px' }} />
            </button>
          </div>
        </div>

        {/* ── Playlist settings ── */}
        <div className="rounded-2xl p-5 space-y-4 animate-fade-up stagger-2"
             style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" style={{ color: 'var(--green)' }} />
            <h2 className="font-bold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
              Aktivna plejlista
            </h2>
          </div>

          {selectedPlaylist ? (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                   style={{ background: 'var(--surface-2)', border: '1px solid rgba(29,185,84,0.15)' }}>
                {getImg(selectedPlaylist)
                    ? <img src={getImg(selectedPlaylist)!} alt={selectedPlaylist.name}
                           className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                           style={{ background: 'var(--surface-3)' }}>
                      <Music2 className="w-5 h-5" style={{ color: 'var(--text-dim)' }} />
                    </div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{selectedPlaylist.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {selectedPlaylist.tracks?.total ?? 0} pesama
                  </p>
                </div>
                <button
                    onClick={() => window.open(`https://open.spotify.com/playlist/${selectedPlaylist.id}`, '_blank')}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{ color: 'var(--text-dim)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)'; }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
          ) : (
              <div className="p-4 rounded-xl text-center"
                   style={{ background: 'var(--surface-2)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Music2 className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--text-dim)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nije izabrana plejlista</p>
              </div>
          )}

          <button onClick={() => setShowDialog(true)}
                  className="btn-primary btn-shine w-full py-2.5 text-sm flex items-center justify-center gap-2">
            <Music2 className="w-4 h-4" />
            {selectedPlaylist ? 'Promeni plejlistu' : 'Izaberi plejlistu'}
          </button>

          <div>
            <Label className="text-xs mb-2 block"
                   style={{ color: 'var(--text-secondary)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Ili kreiraj novu
            </Label>
            <div className="flex gap-2">
              <Input
                  placeholder="Ime plejliste..."
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                  className="text-sm"
                  style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}
              />
              <button onClick={createPlaylist}
                      disabled={!newPlaylistName.trim() || isCreating}
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-all"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-4)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-3)')}>
                {isCreating
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="rounded-2xl p-5 animate-fade-up stagger-3"
             style={{ background: 'var(--surface-1)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-4 h-4 text-red-400" />
            <h2 className="font-bold text-red-400 text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
              Opasna zona
            </h2>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Briše sve praćene izvođače i celu istoriju. Nepovratno.
          </p>
          <button onClick={clearAllData}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', fontFamily: 'Syne, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Trash2 className="w-4 h-4 inline mr-2" />Obriši sve podatke
          </button>
        </div>

        {/* ── Playlist picker dialog ── */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-sm p-0 overflow-hidden"
                         style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px' }}>
            <DialogHeader className="px-5 py-4 flex-row items-center justify-between"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <DialogTitle className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                Izaberi plejlistu
              </DialogTitle>
              <button onClick={loadPlaylists} disabled={isLoading}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                      style={{ color: 'var(--text-dim)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[55vh] p-3">
              {isLoading ? (
                  <div className="space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
                  </div>
              ) : playlists.length === 0 ? (
                  <div className="text-center py-10">
                    <Music2 className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-dim)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nema plejlisti</p>
                  </div>
              ) : (
                  <div className="space-y-1">
                    {playlists.map(pl => (
                        <div key={pl.id} onClick={() => selectPlaylist(pl.id)}
                             className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                             style={{ border: selectedPlaylistId === pl.id ? '1px solid rgba(29,185,84,0.3)' : '1px solid transparent',
                               background: selectedPlaylistId === pl.id ? 'rgba(29,185,84,0.05)' : 'transparent' }}
                             onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                             onMouseLeave={e => (e.currentTarget.style.background = selectedPlaylistId === pl.id ? 'rgba(29,185,84,0.05)' : 'transparent')}>
                          {getImg(pl)
                              ? <img src={getImg(pl)!} alt={pl.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                              : <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                                     style={{ background: 'var(--surface-3)' }}>
                                <Music2 className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                              </div>}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{pl.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {pl.tracks?.total ?? 0} pesama
                            </p>
                          </div>
                          {selectedPlaylistId === pl.id && (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                   style={{ background: 'var(--green)' }}>
                                <Check className="w-3 h-3 text-black" />
                              </div>
                          )}
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}