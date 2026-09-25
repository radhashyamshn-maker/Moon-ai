import React, { useState, useRef, useEffect } from 'react';
import { LiveState, ThemeConfig, CharacterAnimation, WakeWordConfig } from '../types';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  Smile,
  Heart,
  HelpCircle,
  Phone,
  Sliders,
  ChevronUp,
  Activity,
  Ear,
} from 'lucide-react';
import { AvatarExpression } from './AnimeAvatar';

interface AvatarControlDockProps {
  state: LiveState;
  theme: ThemeConfig;
  audioLevel: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleVoice: () => void;
  onSendText: (text: string) => void;
  onTriggerVision: () => void;
  onSetExpressionOverride: (exp: AvatarExpression | null) => void;
  currentExpressionOverride: AvatarExpression | null;
  currentAnimation?: CharacterAnimation;
  onSetAnimation?: (anim: CharacterAnimation) => void;
  onOpenSettings: () => void;
  onOpenPrompts: () => void;
  wakeWordConfig?: WakeWordConfig;
  onOpenWakeWord?: () => void;
}

export const AvatarControlDock: React.FC<AvatarControlDockProps> = ({
  state,
  theme,
  audioLevel,
  isMuted,
  onToggleMute,
  onToggleVoice,
  onSendText,
  onTriggerVision,
  onSetExpressionOverride,
  currentExpressionOverride,
  currentAnimation = 'idle',
  onSetAnimation,
  onOpenSettings,
  onOpenPrompts,
  wakeWordConfig,
  onOpenWakeWord,
}) => {
  const [inputText, setInputText] = useState('');
  const [showPicker, setShowPicker] = useState<'none' | 'expressions' | 'animations'>('none');
  const inputRef = useRef<HTMLInputElement>(null);

  const isConnected = state !== 'disconnected';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendText(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    wakeWordConfig?.enabled ? `🎙️ Say "${wakeWordConfig.activeWakeWord}" hands-free` : '🎙️ Tap mic to start voice chat',
    'Say something sweet to cheer me up! 🌸',
    'Look at my screen and tell me what you see! 👁️',
    'Play some cozy music for studying 🎵',
    'How does my schedule look today? 📅',
  ];

  const expressions: { key: AvatarExpression; label: string; icon: string }[] = [
    { key: 'shy', label: 'Shy', icon: '🌸' },
    { key: 'happy', label: 'Happy', icon: '✨' },
    { key: 'attentive', label: 'Attentive', icon: '👀' },
    { key: 'thinking', label: 'Thinking', icon: '💭' },
    { key: 'blushing', label: 'Blush', icon: '💖' },
  ];

  const animations: { key: CharacterAnimation; label: string; icon: string }[] = [
    { key: 'idle', label: 'Idle', icon: '✨' },
    { key: 'wave', label: 'Wave', icon: '👋' },
    { key: 'dance', label: 'Dance', icon: '💃' },
    { key: 'cheer', label: 'Cheer', icon: '🎉' },
    { key: 'heart', label: 'Heart', icon: '💖' },
    { key: 'bow', label: 'Bow', icon: '🙇‍♀️' },
    { key: 'twirl', label: 'Twirl', icon: '💫' },
    { key: 'think', label: 'Think', icon: '🤔' },
    { key: 'shy', label: 'Shy', icon: '🫣' },
    { key: 'sleepy', label: 'Sleepy', icon: '😴' },
  ];

  return (
    <div
      id="avatar-control-dock"
      className="w-full max-w-lg mx-auto flex flex-col items-center gap-2 select-none"
    >
      {/* Quick Interactive Prompt Chips Carousel */}
      <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 px-1 py-1">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendText(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-sans text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap active:scale-95"
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Emote & Expression Selector Popup */}
      {showPicker === 'expressions' && (
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#181824]/90 backdrop-blur-xl border border-white/15 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {expressions.map((exp) => (
            <button
              key={exp.key}
              onClick={() => {
                onSetExpressionOverride(
                  currentExpressionOverride === exp.key ? null : exp.key
                );
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                currentExpressionOverride === exp.key
                  ? 'bg-pink-500/30 border border-pink-400/50 text-pink-200'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-transparent'
              }`}
            >
              <span>{exp.icon}</span>
              <span>{exp.label}</span>
            </button>
          ))}
          <button
            onClick={() => onSetExpressionOverride(null)}
            className="px-2 py-1 rounded-xl text-[10px] font-mono text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          >
            Auto
          </button>
        </div>
      )}

      {/* Full 3D Animation Selector Carousel */}
      {showPicker === 'animations' && (
        <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#181824]/90 backdrop-blur-xl border border-white/15 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {animations.map((anim) => (
            <button
              key={anim.key}
              onClick={() => {
                if (onSetAnimation) {
                  onSetAnimation(anim.key);
                }
              }}
              className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                currentAnimation === anim.key
                  ? 'bg-purple-500/40 border border-purple-400/60 text-purple-200 shadow-md scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-transparent'
              }`}
            >
              <span>{anim.icon}</span>
              <span>{anim.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Glassmorphism Floating Control Dock Card */}
      <div
        className="w-full rounded-3xl p-2 sm:p-2.5 bg-[#12121c]/80 backdrop-blur-2xl border border-white/15 shadow-2xl flex flex-col gap-2 relative"
        style={{
          boxShadow: `0 15px 35px -10px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {/* Top Dock Bar: Text Input Field & Voice Controls */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 w-full">
          {/* Quick Emote / Mood Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPicker(showPicker === 'expressions' ? 'none' : 'expressions')}
            title="Character Expressions"
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
              showPicker === 'expressions'
                ? 'bg-pink-500/30 border-pink-400 text-pink-200'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-pink-300 hover:text-pink-200'
            }`}
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Full Animation Mode Button */}
          <button
            type="button"
            onClick={() => setShowPicker(showPicker === 'animations' ? 'none' : 'animations')}
            title="Full 3D Character Animations"
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
              showPicker === 'animations'
                ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                : 'bg-white/5 hover:bg-purple-500/20 border-white/10 hover:border-purple-500/40 text-purple-300'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Screen Vision Quick Button */}
          <button
            type="button"
            onClick={onTriggerVision}
            title="Inspect My Screen / Camera"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-cyan-300 transition-all cursor-pointer shrink-0"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Wake Word Fast Button */}
          {onOpenWakeWord && (
            <button
              type="button"
              onClick={onOpenWakeWord}
              title={wakeWordConfig?.enabled ? `Wake Word Active: "${wakeWordConfig.activeWakeWord}" (Tap to configure)` : 'Enable Hands-Free Wake Word'}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                wakeWordConfig?.enabled
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/40 text-pink-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/50 hover:text-white'
              }`}
            >
              <Ear className="w-4 h-4" />
            </button>
          )}

          {/* Text Input */}
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask or tell Moon anything..."
              className="w-full py-2 px-3.5 pr-9 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-400/50 focus:bg-white/10 transition-all font-sans"
            />
            {inputText.trim() && (
              <button
                type="submit"
                className="absolute right-1.5 p-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Speaker / Audio Mute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Moon' : 'Mute Moon'}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Central Voice Mic Button */}
          <button
            type="button"
            id="dock-mic-toggle-btn"
            onClick={onToggleVoice}
            title={isConnected ? 'Tap to disconnect Voice' : 'Tap to Start Voice Chat'}
            className="p-2.5 sm:px-4 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-lg active:scale-95"
            style={{
              background: isConnected
                ? isSpeaking
                  ? 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
              border: `1px solid ${isConnected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
              color: '#ffffff',
            }}
          >
            {isConnected ? (
              <>
                <Mic className="w-4 h-4 animate-pulse" />
                <span className="hidden sm:inline">
                  {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Live'}
                </span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-white/60" />
                <span className="hidden sm:inline">Voice</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
