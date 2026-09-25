import React from 'react';
import { LiveState, ThemeConfig } from '../types';
import { Mic, MicOff, Power, Radio, Volume2, Sparkles } from 'lucide-react';

interface CentralPowerButtonProps {
  state: LiveState;
  theme: ThemeConfig;
  onToggle: () => void;
  audioLevel: number;
}

export const CentralPowerButton: React.FC<CentralPowerButtonProps> = ({
  state,
  theme,
  onToggle,
  audioLevel,
}) => {
  const isConnected = state !== 'disconnected';
  const isConnecting = state === 'connecting';
  const isThinking = state === 'thinking' || state === 'processing';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Central Button Shell */}
      <div className="relative group">
        {/* Ambient Ring Expansion */}
        <div
          className={`absolute -inset-2 rounded-full blur-md transition-all duration-300 pointer-events-none ${
            isConnected ? 'opacity-80' : 'opacity-20 group-hover:opacity-40'
          }`}
          style={{
            background: isConnected
              ? `radial-gradient(circle, ${theme.primary} 0%, transparent 70%)`
              : 'rgba(255,255,255,0.1)',
            transform: `scale(${1 + audioLevel * 0.25})`,
          }}
        />

        {/* Pulsing Ripple if Connected */}
        {isConnected && (
          <div
            className="absolute -inset-3 rounded-full border border-white/20 animate-ping pointer-events-none opacity-40"
            style={{
              borderColor: theme.primary,
              animationDuration: isSpeaking ? '1.2s' : '2.5s',
            }}
          />
        )}

        {/* Interactive Main Button */}
        <button
          id="central-mic-power-btn"
          onClick={onToggle}
          disabled={isConnecting}
          aria-label={isConnected ? 'Disconnect Voice Session' : 'Start Voice Session'}
          className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer active:scale-95 border ${
            isConnected
              ? 'bg-[#15121F] border-white/30 text-white hover:border-white/60'
              : 'bg-[#141416] border-white/10 text-white/80 hover:border-white/30 hover:text-white'
          }`}
          style={{
            boxShadow: isConnected ? `0 0 35px ${theme.glow}` : '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {isConnecting ? (
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}
            />
          ) : isThinking ? (
            <div className="relative flex items-center justify-center">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}
              />
            </div>
          ) : isSpeaking ? (
            <div className="relative flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-white animate-pulse" />
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping"
              />
            </div>
          ) : isListening ? (
            <div className="relative flex items-center justify-center">
              <Mic className="w-8 h-8 text-emerald-400" />
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"
              />
            </div>
          ) : (
            <Power className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
          )}
        </button>
      </div>

      {/* Dynamic Status Text Indicator */}
      <div className="flex flex-col items-center text-center">
        <button
          onClick={onToggle}
          className="text-xs sm:text-sm font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          style={{ color: isConnected ? '#ffffff' : 'rgba(255,255,255,0.6)' }}
        >
          {isConnecting ? (
            <span className="flex items-center gap-1 text-violet-300 animate-pulse">
              <Radio className="w-3.5 h-3.5 animate-spin" /> Synchronizing Neural Link...
            </span>
          ) : isThinking ? (
            <span className="flex items-center gap-1.5 text-violet-300 animate-pulse">
              <Radio className="w-3.5 h-3.5 animate-spin" /> Moon Thinking...
            </span>
          ) : isSpeaking ? (
            <span className="flex items-center gap-1.5 text-violet-300">
              <Volume2 className="w-3.5 h-3.5" /> Moon Speaking (Tap to Interrupt)
            </span>
          ) : isListening ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Mic className="w-3.5 h-3.5" /> Listening Live (Say anything...)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-white/70 hover:text-white">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Tap to Connect with Moon
            </span>
          )}
        </button>

        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
          {isConnected ? 'Audio-to-Audio PCM 16/24kHz' : 'Gemini 3.1 Live Audio'}
        </span>
      </div>
    </div>
  );
};
