import { useState } from 'react';
import { Music2, Zap, ListMusic, Headphones } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [hovered, setHovered] = useState(false);

  return (
      <div className="login-bg min-h-screen flex items-center justify-center p-4">
        {/* Decorative rings */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-green-500/5 animate-spin-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-green-500/8" style={{ animationDuration: '12s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-green-500/10" />
        </div>

        <div className="login-card w-full max-w-[420px] p-8 animate-fade-up relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse-glow">
                <Music2 className="w-8 h-8 text-black" strokeWidth={2.5} />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-green-500/20 blur-lg -z-10" />
            </div>
            <h1
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}
            >
              Auto-Playlist
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Automatski prati i dodaje nova izdanja
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              {
                icon: Zap,
                color: 'text-yellow-400',
                bg: 'bg-yellow-400/10',
                title: 'Automatsko dodavanje',
                desc: 'Nove pesme praćenih izvođača idu direktno u plejlistu',
              },
              {
                icon: ListMusic,
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
                title: 'Pametni filteri',
                desc: 'Sortiraj i filtriraj po izvođaču, datumu, albumu',
              },
              {
                icon: Headphones,
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
                title: 'Preview pesama',
                desc: 'Slušaj preview pre dodavanja u plejlistu',
              },
            ].map(({ icon: Icon, color, bg, title, desc }, i) => (
                <div
                    key={title}
                    className={`flex items-start gap-3 p-3.5 rounded-xl animate-fade-up stagger-${i + 1}`}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                  </div>
                </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
              onClick={onLogin}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="btn-primary btn-shine w-full py-3.5 flex items-center justify-center gap-3 text-base"
              style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${hovered ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Poveži Spotify nalog
          </button>

          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-dim)' }}>
            Koristi Spotify OAuth — tvoji podaci ostaju bezbedni
          </p>
        </div>
      </div>
  );
}