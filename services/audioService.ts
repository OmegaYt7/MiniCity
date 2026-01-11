class AudioService {
  private muted: boolean = false;
  private musicPlaying: boolean = false;
  
  // Synthesized sounds using Web Audio API to avoid external asset dependencies for this demo
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.audioCtx) {
      this.audioCtx.suspend();
    } else if (this.audioCtx) {
      this.audioCtx.resume();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playClick() {
    if (this.muted || !this.audioCtx) return;
    this.playSound(600, 'sine', 0.1);
  }

  playPlace() {
    if (this.muted || !this.audioCtx) return;
    this.playSound(300, 'square', 0.15);
    setTimeout(() => this.playSound(400, 'square', 0.1), 100);
  }

  playError() {
    if (this.muted || !this.audioCtx) return;
    this.playSound(150, 'sawtooth', 0.2);
  }

  playUpgrade() {
    if (this.muted || !this.audioCtx) return;
    this.playSound(400, 'sine', 0.1);
    setTimeout(() => this.playSound(600, 'sine', 0.1), 100);
    setTimeout(() => this.playSound(800, 'sine', 0.1), 200);
  }

  private playSound(freq: number, type: OscillatorType, duration: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  startMusic() {
    // Placeholder for music logic - would ideally play a looped buffer
    // For now, we keep it silent to respect user browser policies requiring interaction
    this.musicPlaying = true;
  }
}

export const audioService = new AudioService();
