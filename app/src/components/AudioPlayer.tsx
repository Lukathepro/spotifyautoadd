import { toast } from 'sonner';

interface AudioState {
  isPlaying: boolean;
  currentTrack: { id: string; name: string; artist: string; previewUrl: string | null } | null;
  volume: number;
  progress: number;
  duration: number;
}

class AudioPlayerService {
  private state: AudioState = {
    isPlaying: false,
    currentTrack: null,
    volume: 0.5,
    progress: 0,
    duration: 30,
  };
  private listeners: ((state: AudioState) => void)[] = [];
  private embedContainer: HTMLDivElement | null = null;
  private embedIframe: HTMLIFrameElement | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private progressStart: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.createEmbedContainer();
    }
  }

  private createEmbedContainer() {
    this.embedContainer = document.createElement('div');
    this.embedContainer.id = 'spotify-embed-container';
    Object.assign(this.embedContainer.style, {
      position: 'fixed',
      bottom: '-500px',
      left: '-500px',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
    });
    document.body.appendChild(this.embedContainer);
  }

  private notifyListeners() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  private startProgressTracking() {
    this.stopProgressTracking();
    this.progressStart = Date.now() - this.state.progress * 1000;
    this.progressInterval = setInterval(() => {
      const elapsed = (Date.now() - this.progressStart) / 1000;
      this.state.progress = Math.min(elapsed, this.state.duration);
      if (this.state.progress >= this.state.duration) {
        this.state.isPlaying = false;
        this.state.progress = 0;
        this.stopProgressTracking();
      }
      this.notifyListeners();
    }, 500);
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

  async play(trackId: string, name: string, artist: string, _previewUrl?: string | null): Promise<void> {
    // Ista pesma — toggle
    if (this.state.currentTrack?.id === trackId) {
      if (this.state.isPlaying) {
        this.pause();
      } else {
        this.resume();
      }
      return;
    }

    // Nova pesma — učitaj Spotify embed
    this.state.currentTrack = { id: trackId, name, artist, previewUrl: null };
    this.state.isPlaying = true;
    this.state.progress = 0;
    this.state.duration = 30;
    this.notifyListeners();

    if (this.embedContainer) {
      this.embedContainer.style.display = 'block';
      this.embedContainer.innerHTML = '';

      this.embedIframe = document.createElement('iframe');
      this.embedIframe.src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1`;
      this.embedIframe.width = '100%';
      this.embedIframe.height = '80';
      this.embedIframe.frameBorder = '0';
      this.embedIframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      this.embedIframe.loading = 'eager';
      Object.assign(this.embedIframe.style, { borderRadius: '12px' });

      this.embedContainer.appendChild(this.embedIframe);
      this.startProgressTracking();
    }
  }

  pause(): void {
    if (this.embedIframe && this.state.currentTrack) {
      // Reload bez autoplay efektivno pauzira
      this.embedIframe.src = `https://open.spotify.com/embed/track/${this.state.currentTrack.id}?utm_source=generator&theme=0`;
    }
    this.state.isPlaying = false;
    this.stopProgressTracking();
    this.notifyListeners();
  }

  resume(): void {
    if (!this.state.currentTrack || !this.embedIframe) return;
    this.embedIframe.src = `https://open.spotify.com/embed/track/${this.state.currentTrack.id}?utm_source=generator&theme=0&autoplay=1`;
    this.state.isPlaying = true;
    this.startProgressTracking();
    this.notifyListeners();
  }

  stop(): void {
    if (this.embedContainer) {
      this.embedContainer.style.display = 'none';
      this.embedContainer.innerHTML = '';
    }
    this.embedIframe = null;
    this.state.isPlaying = false;
    this.state.currentTrack = null;
    this.state.progress = 0;
    this.stopProgressTracking();
    this.notifyListeners();
  }

  seek(_time: number): void {
    // Spotify embed ne podržava seek programski
  }

  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
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