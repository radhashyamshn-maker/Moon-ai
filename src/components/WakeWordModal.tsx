import React, { useState, useEffect } from 'react';
import { WakeWordConfig } from '../types';
import {
  X,
  Radio,
  Mic,
  Volume2,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Ear,
  Sliders,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface WakeWordModalProps {
  config: WakeWordConfig;
  onUpdateConfig: (partial: Partial<WakeWordConfig>) => void;
  isListening: boolean;
  isSupported: boolean;
  onPlayTestChime: () => void;
  lastHeardTranscript?: string;
  lastMatchedWord?: string;
  onClose: () => void;
}

const PRESET_OPTIONS = [
  { phrase: 'Hey Moon', label: 'Hey Moon', tag: 'Default • English' },
  { phrase: 'Moon', label: 'Moon', tag: 'Single Word' },
  { phrase: 'Ok Moon', label: 'Ok Moon', tag: 'Conversational' },
  { phrase: 'Konnichiwa Moon', label: 'Konnichiwa Moon', tag: 'Japanese' },
  { phrase: 'Suno Moon', label: 'Suno Moon', tag: 'Hinglish / Hindi' },
  { phrase: 'Namaste Moon', label: 'Namaste Moon', tag: 'Hindi' },
  { phrase: 'Hi Moon', label: 'Hi Moon', tag: 'Casual' },
];

export const WakeWordModal: React.FC<WakeWordModalProps> = ({
  config,
  onUpdateConfig,
  isListening,
  isSupported,
  onPlayTestChime,
  lastHeardTranscript,
  lastMatchedWord,
  onClose,
}) => {
  const [newCustomWord, setNewCustomWord] = useState('');
  const [testActive, setTestActive] = useState(false);
  const [localTranscript, setLocalTranscript] = useState(lastHeardTranscript || '');

  useEffect(() => {
    if (lastHeardTranscript) {
      setLocalTranscript(lastHeardTranscript);
    }
  }, [lastHeardTranscript]);

  const handleAddCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCustomWord.trim();
    if (!clean) return;

    if (!config.customWakeWords.includes(clean)) {
      onUpdateConfig({
        customWakeWords: [...config.customWakeWords, clean],
        activeWakeWord: clean,
      });
    }
    setNewCustomWord('');
  };

  const handleRemoveCustomWord = (word: string) => {
    const updated = config.customWakeWords.filter((w) => w !== word);
    onUpdateConfig({
      customWakeWords: updated,
      activeWakeWord: config.activeWakeWord === word ? 'Hey Moon' : config.activeWakeWord,
    });
  };

  const toggleWakeWordIncluded = (word: string) => {
    const exists = config.wakeWords.includes(word);
    let updated: string[];
    if (exists) {
      // Don't remove if it's the only one left
      if (config.wakeWords.length <= 1) return;
      updated = config.wakeWords.filter((w) => w !== word);
    } else {
      updated = [...config.wakeWords, word];
    }
    onUpdateConfig({ wakeWords: updated });
  };

  return (
    <div
      id="wake-word-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-[#111116] border border-white/15 rounded-3xl max-w-lg w-full flex flex-col shadow-2xl relative max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Ear className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Wake Word Activation
              </h2>
              <span className="text-[11px] font-mono text-white/50">
                Hands-Free Voice Detection &amp; Custom Phrases
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Wake Word Modal"
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 font-mono">
          {/* Master Enable/Disable Card */}
          <div
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              config.enabled
                ? 'bg-gradient-to-r from-pink-950/40 via-violet-950/30 to-black border-pink-500/40'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Hands-Free Wake Word</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                    config.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      config.enabled && isListening
                        ? 'bg-emerald-400 animate-ping'
                        : 'bg-white/40'
                    }`}
                  />
                  {config.enabled ? (isListening ? 'Listening' : 'Enabled') : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Say &ldquo;{config.activeWakeWord}&rdquo; at any time to instantly awaken Moon and begin speaking hands-free.
              </p>
            </div>

            {/* Master Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={config.enabled}
              onClick={() => onUpdateConfig({ enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.enabled ? 'bg-pink-500' : 'bg-white/20'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {!isSupported && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Continuous background speech recognition is optimized for Chromium/Webkit browsers. You can still tap the central mic anytime to talk with Moon!
              </p>
            </div>
          )}

          {/* Primary Active Wake Word Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Primary Wake Word Phrase
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_OPTIONS.map((item) => {
                const isSelected = config.activeWakeWord.toLowerCase() === item.phrase.toLowerCase();
                const isIncluded = config.wakeWords.some(
                  (w) => w.toLowerCase() === item.phrase.toLowerCase()
                );

                return (
                  <button
                    key={item.phrase}
                    onClick={() => {
                      onUpdateConfig({
                        activeWakeWord: item.phrase,
                        wakeWords: isIncluded ? config.wakeWords : [...config.wakeWords, item.phrase],
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pink-500/20 border-pink-400 text-white shadow-md shadow-pink-900/20'
                        : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[10px] text-white/40 block">{item.tag}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-pink-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Wake Words Section */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-violet-400" />
              Add Custom Wake Word or Phrase
            </label>
            <p className="text-[11px] text-white/60">
              Create your own personal trigger word (e.g. &ldquo;Jarvis&rdquo;, &ldquo;Hey Assistant&rdquo;, &ldquo;Computer&rdquo;, &ldquo;Suno Moon&rdquo;):
            </p>

            <form onSubmit={handleAddCustomWord} className="flex gap-2">
              <input
                type="text"
                value={newCustomWord}
                onChange={(e) => setNewCustomWord(e.target.value)}
                placeholder="Type custom wake phrase..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newCustomWord.trim()}
                className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Custom Words Tag List */}
            {config.customWakeWords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {config.customWakeWords.map((word) => {
                  const isActive = config.activeWakeWord.toLowerCase() === word.toLowerCase();
                  return (
                    <div
                      key={word}
                      className={`px-2.5 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-pink-500/25 border-pink-400 text-pink-200'
                          : 'bg-white/5 border-white/10 text-white/80'
                      }`}
                    >
                      <button
                        onClick={() => onUpdateConfig({ activeWakeWord: word })}
                        className="cursor-pointer font-bold hover:underline"
                      >
                        {word}
                      </button>
                      <button
                        onClick={() => handleRemoveCustomWord(word)}
                        className="p-0.5 rounded text-white/40 hover:text-rose-400 cursor-pointer"
                        title="Delete word"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Wake Word Sensitivity & Sound Chime Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sensitivity */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Detection Sensitivity
              </label>
              <div className="flex gap-1">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => onUpdateConfig({ sensitivity: lvl })}
                    className={`flex-1 py-1.5 rounded-xl text-xs capitalize transition-all cursor-pointer font-bold ${
                      config.sensitivity === lvl
                        ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                        : 'bg-white/5 hover:bg-white/10 text-white/60 border border-transparent'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-white/40 block">
                {config.sensitivity === 'high'
                  ? 'Instant trigger with phonetic fuzzy matching.'
                  : config.sensitivity === 'medium'
                  ? 'Balanced detection with noise filter.'
                  : 'Strict exact phrase match.'}
              </span>
            </div>

            {/* Sound Chime */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                  Wake Shimmer Chime
                </label>
                <button
                  onClick={onPlayTestChime}
                  title="Play wake chime preview"
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-pink-300 hover:text-pink-200 cursor-pointer text-[10px] flex items-center gap-1 font-bold"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-white/60">Play chime on wake</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.playWakeChime}
                  onClick={() => onUpdateConfig({ playWakeChime: !config.playWakeChime })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.playWakeChime ? 'bg-pink-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.playWakeChime ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Wake Word Test Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/30 to-pink-950/30 border border-violet-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                Live Wake Word Test
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active Mic Feed
              </span>
            </div>
            <p className="text-[11px] text-white/70">
              Try saying &ldquo;<strong className="text-pink-300">{config.activeWakeWord}</strong>&rdquo; right now to test hands-free recognition!
            </p>

            {localTranscript && (
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 text-xs">
                <span className="text-white/60 italic truncate">&ldquo;{localTranscript}&rdquo;</span>
                {lastMatchedWord && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    WOKE: {lastMatchedWord}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="flex items-center gap-2 text-white/40 text-[11px]">
            <Ear className="w-3.5 h-3.5 text-pink-400" />
            <span>Wake Word: {config.enabled ? config.activeWakeWord : 'Off'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all cursor-pointer shadow-lg shadow-pink-900/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
