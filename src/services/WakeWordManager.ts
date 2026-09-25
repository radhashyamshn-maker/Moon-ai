import { WakeWordConfig, WakeWordEvent } from '../types';

export interface WakeWordCallbacks {
  onWakeWordDetected: (event: WakeWordEvent) => void;
  onListeningStateChange: (isListening: boolean) => void;
  onTranscriptHeard?: (transcript: string, isMatch: boolean) => void;
  onError?: (err: any) => void;
}

const DEFAULT_PRESET_WAKE_WORDS = [
  'Hey Moon',
  'Moon',
  'Ok Moon',
  'Okay Moon',
  'Konnichiwa Moon',
  'Suno Moon',
  'Namaste Moon',
  'Hi Moon',
];

const DEFAULT_CONFIG: WakeWordConfig = {
  enabled: true,
  activeWakeWord: 'Hey Moon',
  wakeWords: DEFAULT_PRESET_WAKE_WORDS,
  customWakeWords: [],
  sensitivity: 'medium',
  playWakeChime: true,
};

export class WakeWordManager {
  private config: WakeWordConfig = DEFAULT_CONFIG;
  private callbacks: WakeWordCallbacks;
  private recognition: any = null;
  private isListening: boolean = false;
  private isPausedForSpeech: boolean = false;
  private isExplicitlyStopped: boolean = false;
  private isSupported: boolean = false;
  private restartTimeout: any = null;
  private lastTriggerTime: number = 0;

  constructor(callbacks: WakeWordCallbacks) {
    this.callbacks = callbacks;
    this.loadConfig();
    this.checkSupport();
  }

  private checkSupport(): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    this.isSupported = Boolean(SpeechRecognition);
    return this.isSupported;
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getConfig(): WakeWordConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<WakeWordConfig>) {
    this.config = { ...this.config, ...partial };
    this.saveConfig();

    if (!this.config.enabled) {
      this.stop();
    } else if (!this.isListening && !this.isPausedForSpeech && !this.isExplicitlyStopped) {
      this.start();
    }
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('MOON_WAKE_WORD_CONFIG');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          ...DEFAULT_CONFIG,
          ...parsed,
          wakeWords: parsed.wakeWords?.length ? parsed.wakeWords : DEFAULT_PRESET_WAKE_WORDS,
        };
      }
    } catch {
      this.config = DEFAULT_CONFIG;
    }
  }

  private saveConfig() {
    try {
      localStorage.setItem('MOON_WAKE_WORD_CONFIG', JSON.stringify(this.config));
    } catch {
      // ignore
    }
  }

  /**
   * Starts wake word continuous recognition
   */
  public start(): void {
    if (!this.checkSupport() || !this.config.enabled) return;
    this.isExplicitlyStopped = false;
    this.isPausedForSpeech = false;
    clearTimeout(this.restartTimeout);

    if (this.isListening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {}
        this.recognition = null;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onListeningStateChange(true);
      };

      this.recognition.onresult = (event: any) => {
        if (this.isPausedForSpeech || this.isExplicitlyStopped) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript?.trim();
          if (!transcript) continue;

          const matchResult = this.checkWakeWordMatch(transcript);

          if (this.callbacks.onTranscriptHeard) {
            this.callbacks.onTranscriptHeard(transcript, Boolean(matchResult));
          }

          if (matchResult) {
            const now = Date.now();
            // Debounce trigger to avoid double activations within 2.5 seconds
            if (now - this.lastTriggerTime > 2500) {
              this.lastTriggerTime = now;
              this.callbacks.onWakeWordDetected({
                wakeWord: matchResult.matchedWord,
                matchedWord: matchResult.matchedWord,
                rawTranscript: transcript,
                confidence: 0.95,
                query: matchResult.trailingQuery,
                timestamp: new Date().toLocaleTimeString(),
              });
            }
            break;
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('[WakeWordManager] Recognition notice:', event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onListeningStateChange(false);

        // Auto-restart ONLY if still enabled, not paused, and not explicitly stopped
        if (this.config.enabled && !this.isPausedForSpeech && !this.isExplicitlyStopped) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.config.enabled && !this.isPausedForSpeech && !this.isExplicitlyStopped && !this.isListening) {
              this.start();
            }
          }, 400);
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn('[WakeWordManager] Start error:', err);
      this.isListening = false;
      this.callbacks.onListeningStateChange(false);
    }
  }

  /**
   * Pauses wake-word listener (e.g. while session is active or AI is speaking)
   */
  public pause(): void {
    this.isPausedForSpeech = true;
    clearTimeout(this.restartTimeout);
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch {}
      this.isListening = false;
      this.callbacks.onListeningStateChange(false);
    }
  }

  /**
   * Resumes wake-word listener
   */
  public resume(): void {
    this.isPausedForSpeech = false;
    this.isExplicitlyStopped = false;
    if (this.config.enabled && !this.isListening) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = setTimeout(() => {
        if (!this.isPausedForSpeech && !this.isExplicitlyStopped) {
          this.start();
        }
      }, 400);
    }
  }

  /**
   * Stops recognition completely
   */
  public stop(): void {
    this.isExplicitlyStopped = true;
    this.isPausedForSpeech = false;
    clearTimeout(this.restartTimeout);
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.callbacks.onListeningStateChange(false);
  }

  /**
   * Checks if user speech contains any active wake word or phrase
   */
  private checkWakeWordMatch(
    text: string
  ): { matchedWord: string; trailingQuery?: string } | null {
    if (!text) return null;
    const clean = text.toLowerCase().replace(/[.,!?;:]/g, ' ').trim();

    // Collect all candidate wake words (active word, presets, custom words)
    const allWords = Array.from(
      new Set([
        this.config.activeWakeWord,
        ...this.config.wakeWords,
        ...this.config.customWakeWords,
      ])
    ).filter(Boolean);

    for (const phrase of allWords) {
      const phraseClean = phrase.toLowerCase().trim();
      if (!phraseClean) continue;

      // 1. Direct contains match or prefix match
      if (clean.includes(phraseClean)) {
        const regex = new RegExp(`\\b${this.escapeRegExp(phraseClean)}\\b`, 'i');
        const match = regex.exec(text);
        let trailingQuery = '';
        if (match) {
          const afterIndex = match.index + match[0].length;
          trailingQuery = text.slice(afterIndex).replace(/^[,:-\s]+/, '').trim();
        }
        return {
          matchedWord: phrase,
          trailingQuery: trailingQuery || undefined,
        };
      }

      // 2. High sensitivity fuzzy match
      if (this.config.sensitivity === 'high' || phraseClean === 'moon') {
        // e.g. "hey mun", "hay moon", "heymoon", "mooon"
        const moonVariants = ['moon', 'mon', 'mun', 'muun', 'moone'];
        for (const variant of moonVariants) {
          if (clean.includes(variant)) {
            const regex = new RegExp(`\\b(hey|ok|okay|hi|suno|namaste)?\\s*${variant}\\b`, 'i');
            const match = regex.exec(text);
            if (match) {
              const afterIndex = match.index + match[0].length;
              const trailingQuery = text.slice(afterIndex).replace(/^[,:-\s]+/, '').trim();
              return {
                matchedWord: phrase,
                trailingQuery: trailingQuery || undefined,
              };
            }
          }
        }
      }
    }

    return null;
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
