
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

    // Rhythm BGM (Backing Track)
    this.rhythmBgmAudio = new Audio('/bgm_rhythm.mp3');
    this.rhythmBgmAudio.loop = true;
    this.rhythmBgmAudio.volume = 0.4;
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

  public startBackingTrack() {
    if (this.isMuted) return;
    // Don't stop all music, just ensure this one plays
    this.rhythmBgmAudio?.play().catch(() => {});
  }

  public stopBackingTrack() {
    this.rhythmBgmAudio?.pause();
    if (this.rhythmBgmAudio) this.rhythmBgmAudio.currentTime = 0;
  }

  public stopAllMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
    this.stopBackingTrack();
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

  // --- Drum Kit Sounds (Simulator) ---

  // 1. Kick Drum
  public playKick() {
    this.playDrumSample('/kick.mp3', 1.0, () => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.5);
    });
  }

  // 2. Snare Drum
  public playSnare() {
    this.playDrumSample('/snare.mp3', 0.9, () => {
      if (!this.ctx) return;
      // Tone
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      oscGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);

      // Noise (Snares)
      const noise = this.createWhiteNoiseBuffer();
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noise;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseSource.start();
    });
  }

  // 3. High Tom
  public playHighTom() {
    this.playTom(200, 0.8);
  }

  // 4. Mid Tom
  public playMidTom() {
    this.playTom(150, 0.8);
  }

  // 5. Floor Tom
  public playLowTom() {
    this.playTom(100, 0.9);
  }

  // 6. Closed Hi-Hat
  public playClosedHiHat() {
    this.playHiHatSample('/hihat-closed.mp3', 0.6, 0.05);
  }

  // 7. Open Hi-Hat
  public playOpenHiHat() {
    this.playHiHatSample('/hihat-open.mp3', 0.7, 0.3);
  }

  // 8. Crash Cymbal
  public playCrash() {
    this.playCymbalSample('/crash.mp3', 0.8, 1.5);
  }

  // 9. Ride Cymbal
  public playRide() {
    this.playCymbalSample('/ride.mp3', 0.7, 1.0, true);
  }

  // --- Helpers ---

  private playDrumSample(file: string, vol: number, fallback: () => void) {
    if (this.isMuted) return;
    this.resumeContext();
    const audio = new Audio(file);
    audio.volume = vol;
    audio.play().catch(fallback);
  }

  private playTom(freq: number, vol: number) {
    if (this.isMuted) return;
    this.resumeContext();
    // Use fallback directly for toms if no files provided, 
    // or wrap in playDrumSample if files existed.
    // For this update, assuming simulators use synths largely:
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  private playHiHatSample(file: string, vol: number, decay: number) {
    if (this.isMuted) return;
    this.resumeContext();
    // Fallback Synth for HiHats
    const synth = () => {
        if (!this.ctx) return;
        const buffer = this.createWhiteNoiseBuffer();
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + decay);
        
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
    };
    
    const audio = new Audio(file);
    audio.volume = vol;
    audio.play().catch(synth);
  }

  private playCymbalSample(file: string, vol: number, decay: number, isRide = false) {
    if (this.isMuted) return;
    this.resumeContext();
    const synth = () => {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * decay;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        // Metallic filter simulation (Bandpass)
        const filter = this.ctx.createBiquadFilter();
        filter.type = isRide ? 'bandpass' : 'highpass';
        filter.frequency.value = isRide ? 5000 : 3000;
        if(isRide) filter.Q.value = 5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + decay);

        // Mix in some oscillators for metallic ring
        if (isRide) {
            const osc = this.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 350; // Ring freq
            const oscGain = this.ctx.createGain();
            oscGain.gain.value = 0.1;
            osc.connect(oscGain);
            oscGain.connect(gain);
            osc.start();
            osc.stop(this.ctx.currentTime + decay);
        }

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
    };

    const audio = new Audio(file);
    audio.volume = vol;
    audio.play().catch(synth);
  }

  // Common Buffer Generator
  private createWhiteNoiseBuffer() {
      if (!this.ctx) return this.ctx!.createBuffer(1, 1, 44100);
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      return buffer;
  }

  // --- Other Fallbacks ---
  private playSynthStep() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
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
    const buffer = this.createWhiteNoiseBuffer();
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
}

export const soundManager = new SoundManager();
