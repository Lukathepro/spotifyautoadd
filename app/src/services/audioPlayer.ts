import { toast } from 'sonner';

interface AudioState {
  isPlaying: boolean;
  currentTrack: { id: string; name: string; artist: string; previewUrl: string | null } | null;
  volume: number;
  progress: number;
  duration: number;
}

class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private state: AudioState = {
    isPlaying: false,
    currentTrack: null,
    volume: 0.5,
    progress: 0,
    duration: 30, // Preview traje 30 sekundi
  };
  private listeners: ((state: AudioState) => void)[] = [];
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.volume = this.state.volume;
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('ended', () => {
      this.state.isPlaying = false;
      this.state.progress = 0;
      this.notifyListeners();
      this.stopProgressTracking();
    });

    this.audio.addEventListener('error', () => {
      this.state.isPlaying = false;
      this.notifyListeners();
      toast.error('Greška pri reprodukciji');
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        this.state.duration = this.audio.duration || 30;
        this.notifyListeners();
      }
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  private startProgressTracking() {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (this.audio) {
        this.state.progress = this.audio.currentTime;
        this.notifyListeners();
      }
    }, 100);
  }

  private stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  subscribe(listener: (state: AudioState) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async play(trackId: string, name: string, artist: string, previewUrl: string | null | undefined): Promise<void> {
    if (!this.audio) return;

    if (!previewUrl) {
      toast.info('Preview nije dostupan za ovu pesmu');
      return;
    }

    // Ako je ista pesma, samo toggle play/pause
    if (this.state.currentTrack?.id === trackId) {
      if (this.state.isPlaying) {
        this.pause();
      } else {
        this.resume();
      }
      return;
    }

    // Zaustavi prethodnu pesmu pre nego što učitamo novu
    this.stopProgressTracking();
    this.audio.pause();

    // Nova pesma
    this.audio.src = previewUrl;
    this.audio.load();
    this.state.currentTrack = { id: trackId, name, artist, previewUrl };
    this.state.progress = 0;
    this.state.isPlaying = false;
    this.notifyListeners();

    try {
      await this.audio.play();
      this.state.isPlaying = true;
      this.notifyListeners();
      this.startProgressTracking();
    } catch (error: any) {
      // NotAllowedError = browser blokirao autoplay
      if (error?.name === 'NotAllowedError') {
        toast.error('Browser blokira autoplay — klikni negde na stranicu i pokušaj ponovo');
      } else {
        toast.error('Greška pri pokretanju reprodukcije');
      }
      this.state.isPlaying = false;
      this.state.currentTrack = null;
      this.notifyListeners();
      console.error('Play error:', error);
    }
  }

  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.state.isPlaying = false;
    this.notifyListeners();
    this.stopProgressTracking();
  }

  resume(): void {
    if (!this.audio) return;
    this.audio.play().then(() => {
      this.state.isPlaying = true;
      this.notifyListeners();
      this.startProgressTracking();
    });
  }

  stop(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.state.isPlaying = false;
    this.state.progress = 0;
    this.notifyListeners();
    this.stopProgressTracking();
  }

  seek(time: number): void {
    if (!this.audio) return;
    this.audio.currentTime = time;
    this.state.progress = time;
    this.notifyListeners();
  }

  setVolume(volume: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume));
    this.state.volume = volume;
    this.notifyListeners();
  }

  getState(): AudioState {
    return { ...this.state };
  }

  isPlayingTrack(trackId: string): boolean {
    return this.state.currentTrack?.id === trackId && this.state.isPlaying;
  }
}

export const audioPlayerService = new AudioPlayerService();