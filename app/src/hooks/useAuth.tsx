import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { spotifyService } from '@/services/spotify';
import type { SpotifyUser } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent calls
    if (isFetchingRef.current) return false;

    const auth = spotifyService.isAuthenticated();

    if (auth) {
      isFetchingRef.current = true;
      try {
        const userData = await spotifyService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error('Failed to get user:', error);
        spotifyService.logout();
        setIsAuthenticated(false);
        setUser(null);
        return false;
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    }

    setIsAuthenticated(false);
    setIsLoading(false);
    return false;
  }, []); // stable — no deps that change

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async () => {
    const authUrl = await spotifyService.getAuthUrl();
    window.location.href = authUrl;
  }, []);

  const logout = useCallback(() => {
    spotifyService.logout();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  }, []);

  return (
      <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, checkAuth }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}