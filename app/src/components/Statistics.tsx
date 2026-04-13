import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  Music2, User, Disc3, Clock, TrendingUp,
  Calendar, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import { statisticsService } from '@/services/statistics';
import type { StatsData } from '@/types';

const PALETTE = ['#1db954', '#4ade80', '#86efac', '#22d3ee', '#818cf8', '#c084fc'];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface-2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--text-secondary)' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

const AXIS_PROPS = { stroke: 'var(--text-dim)', fontSize: 11, tickLine: false, axisLine: false };

export function Statistics() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tab, setTab]     = useState('overview');

  useEffect(() => { setStats(statisticsService.getStats()); }, []);

  const activityData = useMemo(() => statisticsService.getActivityHeatmap(), []);

  if (!stats) return null;

  const STAT_CARDS = [
    { label: 'Pesama',   value: stats.totalSongs,   icon: Music2, color: '#1db954', bg: 'rgba(29,185,84,0.1)',   border: 'rgba(29,185,84,0.2)'   },
    { label: 'Izvođača', value: stats.uniqueArtists, icon: User,   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
    { label: 'Albuma',   value: stats.uniqueAlbums,  icon: Disc3,  color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)' },
    { label: 'Vreme',    value: statisticsService.formatDuration(stats.totalDuration), icon: Clock, color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
  ];

  return (
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="sp-tabs-list w-auto h-auto gap-0.5">
            {[
              { value: 'overview', label: 'Pregled',    icon: BarChart3 },
              { value: 'charts',   label: 'Grafikoni',  icon: PieIcon   },
              { value: 'activity', label: 'Aktivnost',  icon: Calendar  },
            ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}
                             className="sp-tab-trigger flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />{label}
                </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="mt-4 space-y-4 animate-fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, border }, i) => (
                  <div key={label} className={`stat-card p-4 animate-fade-up stagger-${i + 1}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                           style={{ background: bg, border: `1px solid ${border}` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <TrendingUp className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />
                    </div>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  </div>
              ))}
            </div>

            {stats.totalSongs > 0 && (
                <div className="rounded-2xl p-5"
                     style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--green)' }} />
                    <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                      Dodavanje po mesecima
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={stats.songsByMonth}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#1db954" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1db954" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" {...AXIS_PROPS} angle={-35} textAnchor="end" height={50} />
                      <YAxis {...AXIS_PROPS} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="count" stroke="#1db954" strokeWidth={2}
                            fill="url(#areaGrad)" dot={{ fill: '#1db954', r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            )}
          </TabsContent>

          {/* ── Charts ── */}
          <TabsContent value="charts" className="mt-4 animate-fade-up">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Top izvođači */}
              <div className="rounded-2xl p-5"
                   style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Top Izvođači
                </h3>
                {stats.topArtists.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={stats.topArtists.slice(0, 6)} cx="50%" cy="50%"
                               innerRadius={55} outerRadius={75} paddingAngle={4}
                               dataKey="count" nameKey="name">
                            {stats.topArtists.slice(0, 6).map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip {...TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-3">
                        {stats.topArtists.slice(0, 6).map((a, i) => (
                            <div key={a.name}
                                 className="flex items-center justify-between px-3 py-2 rounded-xl"
                                 style={{ background: 'var(--surface-2)' }}>
                              <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: PALETTE[i % PALETTE.length] }} />
                                <span className="text-xs text-white">{a.name}</span>
                              </div>
                              <span className="text-xs font-bold" style={{ color: PALETTE[i % PALETTE.length], fontFamily: 'Syne, sans-serif' }}>
                          {a.count}
                        </span>
                            </div>
                        ))}
                      </div>
                    </>
                ) : (
                    <EmptyChart />
                )}
              </div>

              {/* Top žanrovi */}
              <div className="rounded-2xl p-5"
                   style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Top Žanrovi
                </h3>
                {stats.topGenres.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={stats.topGenres.slice(0, 6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" {...AXIS_PROPS} />
                        <YAxis dataKey="name" type="category" {...AXIS_PROPS} width={90} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {stats.topGenres.slice(0, 6).map((_, i) => (
                              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart label="Nema podataka o žanrovima" />
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Activity ── */}
          <TabsContent value="activity" className="mt-4 animate-fade-up">
            <div className="rounded-2xl p-5"
                 style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" style={{ color: 'var(--green)' }} />
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Aktivnost — poslednjih 365 dana
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={activityData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#1db954" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" {...AXIS_PROPS}
                         tickFormatter={v => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                  <YAxis {...AXIS_PROPS} />
                  <Tooltip {...TOOLTIP_STYLE}
                           labelFormatter={v => new Date(v).toLocaleDateString('sr-RS')} />
                  <Line type="monotone" dataKey="count"
                        stroke="url(#lineGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#1db954' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}

function EmptyChart({ label = 'Nema podataka' }: { label?: string }) {
  return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <BarChart3 className="w-8 h-8" style={{ color: 'var(--text-dim)' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      </div>
  );
}