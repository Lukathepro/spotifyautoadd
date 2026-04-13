import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Filter, Search, X, Calendar, ArrowUpDown, User, Disc3,
    ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import { storageService } from '@/services/storage';
import type { FilterOptions, AddedSong } from '@/types';

interface SongFiltersProps {
    onFilterChange: (songs: AddedSong[]) => void;
}

const ALL = '__all__';
const toSel   = (v: string) => v === '' ? ALL : v;
const fromSel = (v: string) => v === ALL ? '' : v;

const DEFAULT_FILTERS: FilterOptions = {
    search: '', artist: '', album: '',
    dateFrom: '', dateTo: '',
    autoOnly: false, manualOnly: false,
    sortBy: 'date', sortOrder: 'desc',
};

export function SongFilters({ onFilterChange }: SongFiltersProps) {
    const [filters, setFilters] = useState<FilterOptions>(() => storageService.getFilters());
    const [artists, setArtists] = useState<string[]>([]);
    const [albums,  setAlbums]  = useState<string[]>([]);
    const [open, setOpen]       = useState(false);

    // Stable ref — never causes useEffect to re-run
    const onFilterChangeRef = useRef(onFilterChange);
    useEffect(() => { onFilterChangeRef.current = onFilterChange; }, [onFilterChange]);

    useEffect(() => {
        setArtists(storageService.getUniqueArtists());
        setAlbums(storageService.getUniqueAlbums());
    }, []);

    // Only depends on filters — never on the callback itself
    useEffect(() => {
        const filtered = storageService.getFilteredSongs(filters);
        storageService.setFilters(filters);
        onFilterChangeRef.current(filtered);
    }, [filters]);

    const set = useCallback(<K extends keyof FilterOptions>(k: K, v: FilterOptions[K]) => {
        setFilters(p => ({ ...p, [k]: v }));
    }, []);

    const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

    const activeCount = [
        filters.search, filters.artist, filters.album,
        filters.dateFrom, filters.dateTo, filters.autoOnly, filters.manualOnly,
    ].filter(Boolean).length;

    const hasActive = activeCount > 0;

    return (
        <div className="relative">
            {/* ── Trigger button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm transition-all"
                style={{
                    background: hasActive ? 'rgba(29,185,84,0.1)' : 'var(--surface-2)',
                    border: `1px solid ${hasActive ? 'rgba(29,185,84,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    color: hasActive ? 'var(--green)' : 'var(--text-secondary)',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                }}
            >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filteri
                {activeCount > 0 && (
                    <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                          style={{ background: 'var(--green)', color: '#000', fontSize: '0.6rem' }}>
            {activeCount}
          </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* ── Dropdown panel ── */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                    <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl p-4 space-y-4 animate-scale-in"
                         style={{
                             background: 'var(--surface-1)',
                             border: '1px solid rgba(255,255,255,0.08)',
                             boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                         }}>

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
                                <span className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Filteri
                </span>
                            </div>
                            {hasActive && (
                                <button onClick={clearFilters}
                                        className="text-xs flex items-center gap-1 transition-colors"
                                        style={{ color: '#f87171' }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                                    <X className="w-3 h-3" /> Očisti
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold flex items-center gap-1.5"
                                   style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                <Search className="w-3 h-3" /> Pretraga
                            </label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                                        style={{ color: 'var(--text-dim)' }} />
                                <Input
                                    placeholder="Pesma, izvođač, album..."
                                    value={filters.search}
                                    onChange={e => set('search', e.target.value)}
                                    className="pl-8 h-9 text-sm border-0"
                                    style={{ background: 'var(--surface-2)', color: 'var(--text-primary)',
                                        outline: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}
                                />
                            </div>
                        </div>

                        {/* Artist */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold flex items-center gap-1.5"
                                   style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                <User className="w-3 h-3" /> Izvođač
                            </label>
                            <Select value={toSel(filters.artist)} onValueChange={v => set('artist', fromSel(v))}>
                                <SelectTrigger className="h-9 text-sm border-0"
                                               style={{ background: 'var(--surface-2)', color: 'var(--text-primary)',
                                                   outline: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                                    <SelectValue placeholder="Svi izvođači" />
                                </SelectTrigger>
                                <SelectContent style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                                    <SelectItem value={ALL}>Svi izvođači</SelectItem>
                                    {artists.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Album */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold flex items-center gap-1.5"
                                   style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                <Disc3 className="w-3 h-3" /> Album
                            </label>
                            <Select value={toSel(filters.album)} onValueChange={v => set('album', fromSel(v))}>
                                <SelectTrigger className="h-9 text-sm border-0"
                                               style={{ background: 'var(--surface-2)', color: 'var(--text-primary)',
                                                   outline: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                                    <SelectValue placeholder="Svi albumi" />
                                </SelectTrigger>
                                <SelectContent style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                                    <SelectItem value={ALL}>Svi albumi</SelectItem>
                                    {albums.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date range */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold flex items-center gap-1.5"
                                   style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                <Calendar className="w-3 h-3" /> Period
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['dateFrom', 'dateTo'] as const).map((key, i) => (
                                    <Input key={key} type="date"
                                           value={filters[key]}
                                           onChange={e => set(key, e.target.value)}
                                           placeholder={i === 0 ? 'Od' : 'Do'}
                                           className="h-9 text-xs border-0"
                                           style={{ background: 'var(--surface-2)', color: 'var(--text-primary)',
                                               outline: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Type toggles */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold"
                                   style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Tip
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { key: 'autoOnly'   as const, label: 'Auto',  color: '#60a5fa', activeBg: 'rgba(96,165,250,0.12)',  activeBorder: 'rgba(96,165,250,0.3)'  },
                                    { key: 'manualOnly' as const, label: 'Ručno', color: '#c084fc', activeBg: 'rgba(192,132,252,0.12)', activeBorder: 'rgba(192,132,252,0.3)' },
                                ].map(({ key, label, color, activeBg, activeBorder }) => {
                                    const active = filters[key];
                                    return (
                                        <button key={key} onClick={() => set(key, !active)}
                                                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                                                style={{
                                                    fontFamily: 'Syne, sans-serif',
                                                    background: active ? activeBg : 'var(--surface-2)',
                                                    border: `1px solid ${active ? activeBorder : 'rgba(255,255,255,0.06)'}`,
                                                    color: active ? color : 'var(--text-secondary)',
                                                }}>
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold flex items-center gap-1.5"
                                   style={{ color: 'var(--text-dim)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                <ArrowUpDown className="w-3 h-3" /> Sortiranje
                            </label>
                            <div className="flex gap-2">
                                <Select value={filters.sortBy}
                                        onValueChange={(v: FilterOptions['sortBy']) => set('sortBy', v)}>
                                    <SelectTrigger className="flex-1 h-9 text-sm border-0"
                                                   style={{ background: 'var(--surface-2)', color: 'var(--text-primary)',
                                                       outline: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                                        <SelectItem value="date">Datum</SelectItem>
                                        <SelectItem value="name">Naziv</SelectItem>
                                        <SelectItem value="artist">Izvođač</SelectItem>
                                        <SelectItem value="album">Album</SelectItem>
                                    </SelectContent>
                                </Select>
                                <button
                                    onClick={() => set('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                    style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.06)',
                                        color: 'var(--text-secondary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}>
                                    <ArrowUpDown className={`w-3.5 h-3.5 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Apply */}
                        <button onClick={() => setOpen(false)}
                                className="btn-primary w-full py-2.5 text-sm rounded-xl"
                                style={{ fontFamily: 'Syne, sans-serif' }}>
                            Primeni filtere
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}