/**
 * AudioStreamer - Manages 16kHz PCM audio capture from microphone
 * and 24kHz PCM audio playback from Gemini Live API with precise timing, jitter buffering, and interruption control.
 */

export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private inputSourceNode: MediaStreamAudioSourceNode | null = null;
  
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private masterGainNode: GainNode | null = null;

  private nextScheduledTime: number = 0;
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  private isCapturing: boolean = false;
  private isPlaying: boolean = false;
  private isTurnActive: boolean = false;
  private playbackEndTimer: any = null;

  private onChunkCallback: ((base64Chunk: string) => void) | null = null;
  private onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;
  private onUserBargeIn: (() => void) | null = null;

  constructor() {}

  /**
   * Initializes or resumes Web Audio Contexts
   */
  public async initAudioContexts(): Promise<void> {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.8;

      this.masterGainNode = this.outputAudioCtx.createGain();
      this.masterGainNode.gain.setValueAtTime(1.0, this.outputAudioCtx.currentTime);

      this.masterGainNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioCtx.destination);
    }

    if (this.outputAudioCtx.state === 'suspended') {
      await this.outputAudioCtx.resume();
    }
  }

  /**
   * Starts capturing microphone audio at 16,000 Hz PCM
   */
  public async startMicrophoneCapture(onChunk: (base64Chunk: string) => void): Promise<void> {
    this.onChunkCallback = onChunk;

    await this.initAudioContexts();

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });

    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }

    this.inputAnalyser = this.inputAudioCtx.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    this.inputAnalyser.smoothingTimeConstant = 0.7;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[AudioStreamer] getUserMedia is not supported in this browser environment.');
      const err = new Error('Microphone access is not supported in this browser environment.');
      (err as any).name = 'NotSupportedError';
      throw err;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.inputSourceNode = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
      this.inputSourceNode.connect(this.inputAnalyser);

      // Using ScriptProcessorNode with bufferSize 2048 for low-latency streaming chunks
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        
        // Measure input energy / volume for echo cancellation & barge-in detection
        let sumSquares = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sumSquares += inputChannelData[i] * inputChannelData[i];
        }
        const rms = Math.sqrt(sumSquares / inputChannelData.length);

        // Acoustic Echo Gate:
        // While the assistant is actively speaking, room speakers bleed into the microphone.
        // If volume is below the intentional speech threshold (0.35), do NOT send to server
        // so Gemini Live VAD does not falsely self-interrupt mid-sentence.
        if (this.isPlaying) {
          if (rms > 0.35) {
            // Intentional user barge-in detected!
            console.log('[AudioStreamer] User barge-in detected, stopping assistant speech.');
            this.stopPlayback();
            if (this.onUserBargeIn) {
              this.onUserBargeIn();
            }
          } else {
            // Suppress speaker feedback / echo from being sent to Gemini Live VAD
            return;
          }
        }

        const pcm16Data = this.floatTo16BitPCM(inputChannelData);
        const base64Chunk = this.arrayBufferToBase64(pcm16Data.buffer);

        if (this.onChunkCallback && base64Chunk) {
          this.onChunkCallback(base64Chunk);
        }
      };

      this.inputSourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioCtx.destination);

      this.isCapturing = true;
    } catch (err: any) {
      this.isCapturing = false;
      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.toLowerCase().includes('permission denied');

      if (isPermissionDenied) {
        console.warn('[AudioStreamer] Microphone permission was denied or blocked by browser.');
      } else {
        console.error('[AudioStreamer] Error accessing microphone:', err);
      }
      throw err;
    }
  }

  /**
   * Stops microphone capture
   */
  public stopMicrophoneCapture(): void {
    this.isCapturing = false;

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    if (this.inputSourceNode) {
      this.inputSourceNode.disconnect();
      this.inputSourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
  }

  /**
   * Schedules incoming 24kHz PCM base64 chunk for seamless contiguous playback
   */
  public queueAudioChunk(base64Data: string): void {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      return;
    }

    try {
      if (this.playbackEndTimer) {
        clearTimeout(this.playbackEndTimer);
        this.playbackEndTimer = null;
      }

      this.isTurnActive = true;

      const arrayBuffer = this.base64ToArrayBuffer(base64Data);
      const int16Array = new Int16Array(arrayBuffer);
      const float32Array = new Float32Array(int16Array.length);

      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;

      if (this.masterGainNode) {
        sourceNode.connect(this.masterGainNode);
      } else {
        sourceNode.connect(this.outputAudioCtx.destination);
      }

      const currentTime = this.outputAudioCtx.currentTime;
      
      // Jitter lookahead buffer:
      // When starting a new speech turn or recovering from an underrun, schedule with a comfortable 60ms lead time.
      // For consecutive chunks in the same turn, concatenate seamlessly at nextScheduledTime.
      let startTime: number;
      if (this.nextScheduledTime <= currentTime) {
        startTime = currentTime + 0.06;
      } else {
        startTime = this.nextScheduledTime;
      }

      sourceNode.start(startTime);
      this.nextScheduledTime = startTime + audioBuffer.duration;
      this.activeSourceNodes.push(sourceNode);

      if (!this.isPlaying) {
        this.isPlaying = true;
        if (this.onPlaybackStateChange) {
          this.onPlaybackStateChange(true);
        }
      }

      sourceNode.onended = () => {
        const index = this.activeSourceNodes.indexOf(sourceNode);
        if (index > -1) {
          this.activeSourceNodes.splice(index, 1);
        }

        // Check if turn is complete and all scheduled nodes have finished
        this.checkPlaybackCompletion();
      };
    } catch (err) {
      console.error('[AudioStreamer] Error decoding audio chunk:', err);
    }
  }

  /**
   * Signals that the server has finished sending audio chunks for the current turn.
   */
  public endTurn(): void {
    this.isTurnActive = false;
    this.checkPlaybackCompletion();
  }

  /**
   * Verifies if all scheduled audio nodes have fully rendered before declaring playback finished.
   */
  private checkPlaybackCompletion(): void {
    if (!this.outputAudioCtx) return;

    if (!this.isTurnActive && this.activeSourceNodes.length === 0) {
      const remainingTime = Math.max(0, (this.nextScheduledTime - this.outputAudioCtx.currentTime) * 1000);
      
      if (this.playbackEndTimer) {
        clearTimeout(this.playbackEndTimer);
      }

      this.playbackEndTimer = setTimeout(() => {
        if (this.activeSourceNodes.length === 0 && !this.isTurnActive) {
          this.isPlaying = false;
          this.nextScheduledTime = 0;
          if (this.onPlaybackStateChange) {
            this.onPlaybackStateChange(false);
          }
        }
      }, remainingTime + 80);
    }
  }

  /**
   * Stops playback immediately on user interruption
   */
  public stopPlayback(): void {
    if (this.playbackEndTimer) {
      clearTimeout(this.playbackEndTimer);
      this.playbackEndTimer = null;
    }

    this.isTurnActive = false;

    for (const sourceNode of this.activeSourceNodes) {
      try {
        sourceNode.stop();
        sourceNode.disconnect();
      } catch (e) {}
    }
    this.activeSourceNodes = [];

    if (this.outputAudioCtx) {
      this.nextScheduledTime = this.outputAudioCtx.currentTime;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.onPlaybackStateChange) {
        this.onPlaybackStateChange(false);
      }
    }
  }

  /**
   * Registers callback for when playback starts or stops
   */
  public setPlaybackStateCallback(cb: (isPlaying: boolean) => void): void {
    this.onPlaybackStateChange = cb;
  }

  /**
   * Registers callback for user barge-in detection
   */
  public setBargeInCallback(cb: () => void): void {
    this.onUserBargeIn = cb;
  }

  /**
   * Returns normalized input (mic) audio volume between 0.0 and 1.0
   */
  public getInputVolume(): number {
    if (!this.inputAnalyser) return 0;
    const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    this.inputAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.min(1.0, (avg / 128.0) * 1.5);
  }

  /**
   * Returns normalized output (AI speech) audio volume between 0.0 and 1.0
   */
  public getOutputVolume(): number {
    if (!this.outputAnalyser || !this.isPlaying) return 0;
    const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
    this.outputAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.min(1.0, (avg / 128.0) * 1.4);
  }

  /**
   * Returns raw frequency byte array for visualizer
   */
  public getVisualizerData(type: 'input' | 'output' | 'combined'): Uint8Array {
    const analyser = (type === 'output' || (type === 'combined' && this.isPlaying)) 
      ? this.outputAnalyser 
      : this.inputAnalyser;

    if (!analyser) return new Uint8Array(64);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Plays soft sci-fi chimes for connection and interaction feedback
   */
  public playChime(type: 'connect' | 'disconnect' | 'tool' | 'sassy' | 'wake'): void {
    if (!this.outputAudioCtx) return;
    try {
      const ctx = this.outputAudioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'wake') {
        // Magical anime wake shimmer arpeggio (C5 -> E5 -> G5 -> C6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        osc.frequency.setValueAtTime(1046.50, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'connect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'disconnect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'tool') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'sassy') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {}
  }

  // --- Helper Conversion Utilities ---

  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

