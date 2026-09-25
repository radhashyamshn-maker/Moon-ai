/**
 * AudioSynthPlayer - Real-time synthesized music and audio engine
 * Provides interactive lo-fi beats, synthwave chords, and ambient tracks.
 */

export class AudioSynthPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentInterval: any = null;
  private gainNode: GainNode | null = null;
  private volume: number = 0.7; // 0 to 1

  private readonly scales: Record<string, number[]> = {
    lofi: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // C Major Pentatonic
    cyberpunk: [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0], // A Minor
    synthwave: [196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0], // G Major
    midnight: [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj7
  };

  private currentTrackGenre: string = 'lofi';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTrack(genre: string = 'lofi') {
    this.initContext();
    this.currentTrackGenre = genre;
    this.stopTrack();

    this.isPlaying = true;
    let step = 0;
    const notes = this.scales[genre] || this.scales.lofi;

    this.currentInterval = setInterval(() => {
      if (!this.ctx || !this.gainNode) return;

      const baseFreq = notes[step % notes.length];
      const octaveMultiplier = Math.random() > 0.6 ? 2 : 1;
      const freq = baseFreq * octaveMultiplier;

      // Play soft pleasant FM synth chime
      this.playChime(freq, 0.4);

      // Play subtle bass note on downbeat
      if (step % 4 === 0) {
        this.playBass(notes[0] / 2, 0.8);
      }

      step++;
    }, 450);
  }

  private playChime(freq: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;

    try {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = this.currentTrackGenre === 'cyberpunk' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      noteGain.gain.setValueAtTime(0, this.ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  private playBass(freq: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;

    try {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      noteGain.gain.setValueAtTime(0, this.ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  public pauseTrack() {
    this.stopTrack();
    this.isPlaying = false;
  }

  public stopTrack() {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
