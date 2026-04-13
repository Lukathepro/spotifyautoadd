import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, X, User, Disc3, Music2 } from 'lucide-react';
import { spotifyService } from '@/services/spotify';
import { storageService } from '@/services/storage';
import type { SpotifyArtist, TrackedArtist } from '@/types';
import { toast } from 'sonner';

export function ArtistManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trackedArtists, setTrackedArtists] = useState<TrackedArtist[]>([]);

  useEffect(() => { loadTrackedArtists(); }, []);

  const loadTrackedArtists = () => {
    setTrackedArtists(storageService.getTrackedArtists());
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await spotifyService.search(searchQuery, 'artist', 10);
      setSearchResults(results.artists);
    } catch { toast.error('Greška pri pretrazi'); }
    finally { setIsSearching(false); }
  };

  const addArtist = (artist: SpotifyArtist) => {
    storageService.addTrackedArtist({
      id: artist.id,
      name: artist.name,
      image: artist.images[0]?.url,
      addedAt: new Date().toISOString(),
    });
    loadTrackedArtists();
    setSearchResults([]);
    setSearchQuery('');
    toast.success(`${artist.name} dodat za praćenje`);
  };

  const removeArtist = (artistId: string) => {
    storageService.removeTrackedArtist(artistId);
    loadTrackedArtists();
  };

  const isTracked = (id: string) => trackedArtists.some(a => a.id === id);

  return (
      <div className="space-y-4">
        {/* Search card */}
        <div
            className="rounded-2xl p-5 space-y-4 animate-fade-up"
            style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4" style={{ color: 'var(--green)' }} />
            <h2 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              Pretraži izvođače
            </h2>
          </div>

          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
              <Input
                  placeholder="Ime izvođača..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 text-sm"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-primary)',
                  }}
              />
            </div>
            <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching
                  ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <Search className="w-4 h-4" />}
            </button>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif' }}>
                  Rezultati
                </p>
                {searchResults.map((artist) => (
                    <div
                        key={artist.id}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors"
                        style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-11 h-11 rounded-xl">
                          <AvatarImage src={artist.images[0]?.url} className="rounded-xl" />
                          <AvatarFallback className="rounded-xl" style={{ background: 'var(--surface-3)' }}>
                            <User className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white">{artist.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {artist.genres.slice(0, 2).join(', ') || 'Nema žanrova'}
                          </p>
                        </div>
                      </div>
                      <button
                          onClick={() => !isTracked(artist.id) && addArtist(artist)}
                          disabled={isTracked(artist.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: isTracked(artist.id) ? 'rgba(29,185,84,0.15)' : 'var(--green)',
                            color: isTracked(artist.id) ? 'var(--green)' : '#000',
                          }}
                      >
                        {isTracked(artist.id)
                            ? <Disc3 className="w-3.5 h-3.5" />
                            : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* Tracked artists */}
        <div
            className="rounded-2xl overflow-hidden animate-fade-up stagger-1"
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
              Praćeni izvođači
            </span>
            </div>
            <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(29,185,84,0.12)', color: 'var(--green)', fontFamily: 'Syne, sans-serif' }}
            >
            {trackedArtists.length}
          </span>
          </div>

          {trackedArtists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <Music2 className="w-5 h-5" style={{ color: 'var(--text-dim)' }} />
                </div>
                <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Nema praćenih izvođača</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pretraži i dodaj izvođače iznad</p>
              </div>
          ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {trackedArtists.map((artist, i) => (
                    <div
                        key={artist.id}
                        className={`flex items-center justify-between px-5 py-3.5 transition-colors animate-fade-up`}
                        style={{ animationDelay: `${i * 0.04}s` }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-xl">
                          <AvatarImage src={artist.image} className="rounded-xl" />
                          <AvatarFallback className="rounded-xl" style={{ background: 'var(--surface-3)' }}>
                            <User className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-white">{artist.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                            od {new Date(artist.addedAt).toLocaleDateString('sr-RS')}
                          </p>
                        </div>
                      </div>
                      <button
                          onClick={() => removeArtist(artist.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-40 hover:opacity-100"
                          style={{ color: '#f87171' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}