/**
 * SoundManager
 * Handles playback of game sounds using the Web Audio API.
 * Includes synthetic fallbacks if file loading fails (or files don't exist).
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Initialize AudioContext on user interaction usually, but here we prep it
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }

    // Initialize BGM
    this.bgmAudio = new Audio('/bgm.mp3');
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.3;
  }

  public resumeContext() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playPush() {
    if (this.isMuted) return;
    this.resumeContext();

    // Try to play from file, fallback to synth
    const audio = new Audio('/boxPush.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => this.playSynthPush());
  }

  public playWin() {
    if (this.isMuted) return;
    this.resumeContext();

    // Fade out BGM
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }

    const audio = new Audio('/win.mp3');
    audio.play().catch(() => this.playSynthWin());
  }

  public startMusic() {
    if (this.isMuted || !this.bgmAudio) return;
    this.bgmAudio.play().catch(() => {
        // BGM file likely missing, ignoring to keep console clean
    });
  }

  public stopMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  // --- Synthetic Fallbacks (Web Audio API) ---

  private playSynthPush() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Low thud sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  private playSynthWin() {
    if (!this.ctx) return;
    
    // Simple Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    let time = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

      osc.start(time);
      osc.stop(time + 0.4);
      
      time += 0.1;
    });
  }
}

export const soundManager = new SoundManager();