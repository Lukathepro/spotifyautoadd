import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Login } from '@/sections/Login';
import { Dashboard } from '@/sections/Dashboard';
import { ArtistManager } from '@/sections/ArtistManager';
import { AlbumSearch } from '@/sections/AlbumSearch';
import { Settings } from '@/sections/Settings';
import { Statistics } from '@/components/Statistics';
import { Notifications } from '@/components/Notifications';
import { NewReleases } from '@/components/NewReleases';
import { DataTransfer } from '@/components/DataTransfer';
import { HowItWorks } from '@/components/HowItWorks';
import { spotifyService } from '@/services/spotify';
import { autoAddService } from '@/services/autoAdd';
import { storageService } from '@/services/storage';
import {
  LayoutDashboard, Users, Search, Settings2, Music2,
  Sparkles, BarChart3, Disc3, Database, HelpCircle,
} from 'lucide-react';
import type { SpotifyUser, AddedSong } from '@/types';
import './App.css';

function CallbackHandler({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    const search = window.location.search;
    if (search.includes('code=')) {
      handledRef.current = true;
      spotifyService.handleAuthCallback(search).then((success) => {
        if (success) {
          window.history.replaceState({}, document.title, window.location.pathname);
          onAuthSuccess();
        }
      });
    }
  }, [onAuthSuccess]);

  return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(29,185,84,0.2)' }} />
            <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--green)' }} />
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: 'rgba(29,185,84,0.1)' }}>
              <Music2 className="w-5 h-5" style={{ color: 'var(--green)' }} />
            </div>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'Syne, sans-serif' }}>
            Povezivanje sa Spotify...
          </p>
        </div>
      </div>
  );
}

const TABS = [
  { value: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { value: 'statistics',   label: 'Statistika',   icon: BarChart3       },
  { value: 'new-releases', label: 'Nova izdanja',  icon: Disc3           },
  { value: 'artists',      label: 'Izvođači',      icon: Users           },
  { value: 'search',       label: 'Pretraga',      icon: Search          },
  { value: 'data',         label: 'Podaci',        icon: Database        },
  { value: 'settings',     label: 'Podešavanja',   icon: Settings2       },
  { value: 'help',         label: 'Vodič',         icon: HelpCircle      },
];

function AppContent() {
  const { isAuthenticated, isLoading, login, checkAuth, user: authUser } = useAuth();
  const [user, setUser]           = useState<SpotifyUser | null>(null);
  const [isCallback]              = useState(() => window.location.search.includes('code='));
  const [newSongsCount, setNewSongsCount] = useState(0);
  const [filteredSongs, setFilteredSongs] = useState<AddedSong[]>([]);

  useEffect(() => {
    if (isAuthenticated && authUser) setUser(authUser);
  }, [isAuthenticated, authUser]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanup = autoAddService.startPeriodicCheck((songs) => {
      setNewSongsCount(p => p + songs.length);
      toast.success(`Dodato ${songs.length} novih pesama!`, { description: 'Proveri dashboard.' });
    });
    return cleanup;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setFilteredSongs(storageService.getFilteredSongs(storageService.getFilters()));
  }, [isAuthenticated]);

  const handleAuthSuccess = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  const handleRefresh = useCallback(() => {
    setNewSongsCount(0);
    setFilteredSongs(storageService.getFilteredSongs(storageService.getFilters()));
  }, []);

  const handleFilterChange = useCallback((songs: AddedSong[]) => {
    setFilteredSongs(songs);
  }, []);

  if (isLoading) return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(29,185,84,0.2)' }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--green)' }} />
        </div>
      </div>
  );

  if (isCallback) return <CallbackHandler onAuthSuccess={handleAuthSuccess} />;
  if (!isAuthenticated) return <Login onLogin={login} />;

  return (
      <div className="min-h-screen pb-28" style={{ background: 'var(--surface-0)' }}>
        <Toaster position="top-right" richColors theme="dark" />

        {/* Header */}
        <header className="sp-header sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                     style={{ background: 'var(--green)', boxShadow: '0 4px 12px rgba(29,185,84,0.3)' }}>
                  <Music2 className="w-4 h-4 text-black" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-white text-base hidden sm:block"
                      style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
                Auto-Playlist
              </span>
                {user?.display_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full hidden sm:block"
                          style={{ background: 'rgba(29,185,84,0.1)', color: 'var(--green)', border: '1px solid rgba(29,185,84,0.2)' }}>
                  {user.display_name}
                </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {newSongsCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold animate-pulse-green"
                         style={{ background: 'rgba(29,185,84,0.12)', color: 'var(--green-bright)',
                           border: '1px solid rgba(29,185,84,0.25)', fontFamily: 'Syne, sans-serif' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      {newSongsCount} novih
                    </div>
                )}
                <Notifications />
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="sp-tabs-list w-full justify-start overflow-x-auto flex-nowrap h-auto gap-0.5">
              {TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger key={value} value={value}
                               className="sp-tab-trigger flex items-center gap-1.5 whitespace-nowrap">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.split(' ')[0]}</span>
                  </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard"    className="mt-0 animate-fade-up">
              <Dashboard onRefresh={handleRefresh} filteredSongs={filteredSongs} onFilterChange={handleFilterChange} />
            </TabsContent>
            <TabsContent value="statistics"   className="mt-0 animate-fade-up"><Statistics /></TabsContent>
            <TabsContent value="new-releases" className="mt-0 animate-fade-up"><NewReleases /></TabsContent>
            <TabsContent value="artists"      className="mt-0 animate-fade-up"><ArtistManager /></TabsContent>
            <TabsContent value="search"       className="mt-0 animate-fade-up"><AlbumSearch /></TabsContent>
            <TabsContent value="data"         className="mt-0 animate-fade-up"><DataTransfer /></TabsContent>
            <TabsContent value="settings"     className="mt-0 animate-fade-up"><Settings user={user} /></TabsContent>
            <TabsContent value="help"         className="mt-0 animate-fade-up"><HowItWorks /></TabsContent>
          </Tabs>
        </main>


      </div>
  );
}

function App() {
  return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
  );
}

export default App;