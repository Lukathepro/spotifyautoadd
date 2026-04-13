import { useState } from 'react';
import {
    Music2, Zap, Search, ListMusic, BarChart3,
    Settings2, Play, ChevronDown, ChevronRight,
    UserPlus, Disc3, Clock, Mic2, AlertCircle,
    CheckCircle2, Info, RefreshCw, Database,
} from 'lucide-react';
import { storageService } from '@/services/storage';

function Note({ type = 'info', children }: { type?: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
    const s = {
        info:    { icon: Info,         color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
        warning: { icon: AlertCircle,  color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)'  },
        success: { icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)'  },
    }[type];
    return (
        <div className="flex gap-2.5 p-3 rounded-xl text-xs leading-relaxed"
             style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{children}</span>
        </div>
    );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
    return (
        <div className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black"
                 style={{ background: 'var(--green)', color: '#000', fontFamily: 'Syne, sans-serif', fontSize: '0.6rem' }}>
                {n}
            </div>
            <div>
                <p className="text-xs font-semibold text-white">{title}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
        </div>
    );
}

const SECTIONS = [
    {
        id: 'overview', icon: Music2, color: '#1db954',
        bg: 'rgba(29,185,84,0.1)', border: 'rgba(29,185,84,0.2)',
        title: 'Kako funkcioniše',
        content: () => (
            <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    App automatski prati izvođače i dodaje njihova nova izdanja (od 2026. nadalje) direktno u Spotify plejlistu.
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: UserPlus, label: 'Dodaj izvođače', color: '#1db954' },
                        { icon: Zap,      label: 'Auto detekcija',  color: '#fbbf24' },
                        { icon: ListMusic,label: 'Ide u plejlistu', color: '#60a5fa' },
                    ].map(({ icon: Icon, label, color }) => (
                        <div key={label} className="rounded-xl p-3 text-center"
                             style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center"
                                 style={{ background: `${color}18` }}>
                                <Icon className="w-3.5 h-3.5" style={{ color }} />
                            </div>
                            <p className="text-xs font-bold text-white" style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.7rem' }}>{label}</p>
                        </div>
                    ))}
                </div>
                <Note type="success">Prati samo albume od <strong>1. januara 2026.</strong> Starija izdanja se ignorišu.</Note>
            </div>
        ),
    },
    {
        id: 'auto', icon: Zap, color: '#fbbf24',
        bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)',
        title: 'Automatsko dodavanje i interval',
        content: () => {
            const settings = storageService.getSettings();
            const intervalLabel = settings.autoCheckInterval >= 60
                ? `${settings.autoCheckInterval / 60}h`
                : `${settings.autoCheckInterval} min`;
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl"
                         style={{ background: 'var(--surface-2)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <Clock className="w-5 h-5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                        <div>
                            <p className="text-xs font-bold text-white">Trenutni interval: <span style={{ color: '#fbbf24' }}>{intervalLabel}</span></p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Promeni u Podešavanjima → Interval auto-provere
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Step n={1} title="Provera izvođača" desc="Za svakog praćenog izvođača dohvata se lista albuma." />
                        <Step n={2} title="Filtriranje po datumu" desc="Uzimaju se samo albumi od 1. januara 2026." />
                        <Step n={3} title="Provera pesama" desc="Svaki album se prolazi — pesme koje već postoje se preskakuju." />
                        <Step n={4} title="Dodavanje" desc="Nove pesme idu automatski u izabranu Spotify plejlistu." />
                    </div>
                    <Note type="warning">Radi samo dok je browser tab otvoren. Zatvaranjem app-a provera staje.</Note>
                    <Note type="info">Detektuje i featured (gost) izvođače — ne samo glavne.</Note>
                </div>
            );
        },
    },
    {
        id: 'setup', icon: Settings2, color: '#60a5fa',
        bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)',
        title: 'Početno podešavanje (2 koraka)',
        content: () => (
            <div className="space-y-3">
                <div className="space-y-2">
                    <Step n={1} title='Izaberi plejlistu → tab "Podešavanja"'
                          desc='Klikni "Izaberi plejlistu" i izaberi postojeću, ili kreiraj novu direktno iz app-a.' />
                    <Step n={2} title='Dodaj izvođače → tab "Izvođači"'
                          desc='Pretraži izvođača po imenu i klikni + dugme. Dodaj koliko god hoćeš.' />
                </div>
                <Note type="warning">Bez izabrane plejliste automatsko dodavanje ne radi.</Note>
            </div>
        ),
    },
    {
        id: 'tabs', icon: ListMusic, color: '#c084fc',
        bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)',
        title: 'Šta radi koji tab',
        content: () => (
            <div className="space-y-1.5">
                {[
                    { icon: BarChart3,  label: 'Dashboard',     color: '#1db954', desc: 'Sve dodate pesme, statistike, ručna provera, filteri.' },
                    { icon: BarChart3,  label: 'Statistika',    color: '#60a5fa', desc: 'Grafikoni po mesecima, top izvođači, žanrovi.' },
                    { icon: Disc3,      label: 'Nova izdanja',  color: '#fbbf24', desc: 'Browsuj nova izdanja sa Spotify-a. Praćeni su označeni.' },
                    { icon: UserPlus,   label: 'Izvođači',      color: '#c084fc', desc: 'Dodaj/ukloni praćene izvođače.' },
                    { icon: Search,     label: 'Pretraga',      color: '#fb923c', desc: 'Ručna pretraga albuma, prikaz feat. izvođača, dodavanje.' },
                    { icon: Database,   label: 'Podaci',        color: '#34d399', desc: 'Export/import podataka za backup.' },
                    { icon: Settings2,  label: 'Podešavanja',   color: '#94a3b8', desc: 'Plejlista, interval provere, notifikacije.' },
                ].map(({ icon: Icon, label, color, desc }) => (
                    <div key={label} className="flex gap-2.5 p-2.5 rounded-xl"
                         style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                             style={{ background: `${color}18` }}>
                            <Icon className="w-3 h-3" style={{ color }} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{label}</p>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: 'player', icon: Play, color: '#34d399',
        bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)',
        title: 'Audio player (30s preview)',
        content: () => (
            <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Klikni play dugme uz bilo koju pesmu da čuješ Spotify 30-sekundni preview direktno u app-u.
                    Mini player se pojavi na dnu ekrana sa progress barom i kontrolama.
                </p>
                <Note type="warning">
                    Spotify ne daje preview za sve pesme (zavisi od regiona i ugovora).
                    Sivo play dugme = preview nije dostupan.
                </Note>
            </div>
        ),
    },
    {
        id: 'feat', icon: Mic2, color: '#c084fc',
        bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)',
        title: 'Featured izvođači',
        content: () => (
            <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Gost izvođači su prikazani posebno od glavnih — ljubičastim feat. badge-om.
                </p>
                <div className="p-3 rounded-xl flex items-center gap-2 flex-wrap"
                     style={{ background: 'var(--surface-2)' }}>
                    <span className="text-xs text-white font-medium">Drake</span>
                    <span className="px-1.5 py-px rounded font-black"
                          style={{ fontSize: '0.58rem', fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em',
                              textTransform: 'uppercase', background: 'rgba(192,132,252,0.15)', color: '#c084fc',
                              border: '1px solid rgba(192,132,252,0.25)' }}>feat.</span>
                    <span className="text-xs" style={{ color: '#d8b4fe' }}>21 Savage</span>
                </div>
                <Note type="info">
                    Ako pratiš izvođača koji je <em>featured</em> na nečijoj pesmi, ta pesma se dodaje automatski.
                </Note>
            </div>
        ),
    },
    {
        id: 'perf', icon: Clock, color: '#fb923c',
        bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)',
        title: 'Kočenje — uzroci i rešenja',
        content: () => (
            <div className="space-y-3">
                <div className="space-y-1.5">
                    {[
                        { title: 'Kratak interval (15-30 min)', desc: 'Previše API poziva. Idi u Podešavanja → povećaj na 60+ min.' },
                        { title: 'Mnogo praćenih izvođača', desc: 'Svaki izvođač = više API poziva. 20+ izvođača može biti sporo.' },
                        { title: 'Inicijalni load', desc: 'Odmah po loginu app proverava sve — normalno je malo čekanje.' },
                    ].map(({ title, desc }) => (
                        <div key={title} className="flex gap-2 p-2.5 rounded-xl"
                             style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fb923c' }} />
                            <div>
                                <p className="text-xs font-bold text-white">{title}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Note type="success">
                    <strong>Brzo rešenje:</strong> Podešavanja → postavi interval na 60 minuta ili više.
                </Note>
            </div>
        ),
    },
];

export function HowItWorks() {
    const [expanded, setExpanded] = useState<string>('overview');

    return (
        <div className="space-y-2 animate-fade-up">
            {/* Header */}
            <div className="rounded-2xl p-5 mb-1"
                 style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                         style={{ background: 'rgba(29,185,84,0.12)', border: '1px solid rgba(29,185,84,0.2)' }}>
                        <RefreshCw className="w-4 h-4" style={{ color: 'var(--green)' }} />
                    </div>
                    <div>
                        <h1 className="font-black text-white text-base"
                            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
                            Vodič kroz Auto-Playlist
                        </h1>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Klikni na sekciju da proširíš
                        </p>
                    </div>
                </div>
            </div>

            {/* Accordion */}
            {SECTIONS.map(({ id, icon: Icon, color, bg, border, title, content: Content }) => {
                const isOpen = expanded === id;
                return (
                    <div key={id} className="rounded-2xl overflow-hidden transition-all"
                         style={{ background: 'var(--surface-1)',
                             border: `1px solid ${isOpen ? border : 'rgba(255,255,255,0.06)'}` }}>
                        <button
                            onClick={() => setExpanded(isOpen ? '' : id)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                            style={{ background: isOpen ? `${color}08` : 'transparent' }}>
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                                 style={{ background: bg, border: `1px solid ${border}` }}>
                                <Icon className="w-3.5 h-3.5" style={{ color }} />
                            </div>
                            <span className="flex-1 text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                {title}
              </span>
                            {isOpen
                                ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
                                : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-dim)' }} />}
                        </button>
                        {isOpen && (
                            <div className="px-4 pb-4 pt-1 animate-fade-up"
                                 style={{ borderTop: `1px solid ${border}30` }}>
                                <Content />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}