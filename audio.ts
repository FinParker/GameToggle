/**
 * SoundManager
 * Handles playback of game sounds using the Web Audio API.
 * Includes synthetic fallbacks if file loading fails.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private rhythmBgmAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }

    // Sokoban BGM
    this.bgmAudio = new Audio('/bgm.mp3');
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.3;

    // Rhythm BGM
    this.rhythmBgmAudio = new Audio('/bgm_rhythm.mp3');
    this.rhythmBgmAudio.loop = true;
    this.rhythmBgmAudio.volume = 0.3;
  }

  public resumeContext() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute) {
      this.bgmAudio?.pause();
      this.rhythmBgmAudio?.pause();
    }
  }

  // --- Music Controls ---

  public startSokobanMusic() {
    if (this.isMuted) return;
    this.stopAllMusic();
    this.bgmAudio?.play().catch(() => {});
  }

  public startRhythmMusic() {
    if (this.isMuted) return;
    this.stopAllMusic();
    this.rhythmBgmAudio?.play().catch(() => {});
  }

  public stopAllMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
    if (this.rhythmBgmAudio) {
      this.rhythmBgmAudio.pause();
      this.rhythmBgmAudio.currentTime = 0;
    }
  }

  // --- SFX Methods ---

  public playStep() {
    if (this.isMuted) return;
    this.resumeContext();
    const audio = new Audio('/step.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => this.playSynthStep());
  }

  public playPush() {
    if (this.isMuted) return;
    this.resumeContext();
    const audio = new Audio('/boxPush.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => this.playSynthPush());
  }

  public playSlither() {
    if (this.isMuted) return;
    this.resumeContext();
    const audio = new Audio('/slither.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => this.playSynthSlither());
  }

  public playWin() {
    if (this.isMuted) return;
    this.resumeContext();
    this.stopAllMusic();
    const audio = new Audio('/win.mp3');
    audio.play().catch(() => this.playSynthWin());
  }

  public playBite() {
    if (this.isMuted) return;
    this.resumeContext();
    const audio = new Audio('/bite.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => this.playSynthBite());
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.resumeContext();
    this.stopAllMusic();
    this.playSynthGameOver();
  }

  public playDrumHit() {
    if (this.isMuted) return;
    this.resumeContext();
    const audio = new Audio('/drum_hit.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => this.playSynthDrum(150));
  }

  public playDrumMiss() {
    // Requirements state no sound for missed/off-beat hits
    if (this.isMuted) return;
    this.resumeContext();
    // this.playSynthDrum(50); 
  }

  // --- Synthetic Fallbacks ---

  private playSynthStep() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    // Short high click
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  private playSynthSlither() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // White noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
  }

  private playSynthPush() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  private playSynthWin() {
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    let time = this.ctx.currentTime;
    notes.forEach((freq) => {
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

  private playSynthBite() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  private playSynthGameOver() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  private playSynthDrum(freq: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
}

export const soundManager = new SoundManager();