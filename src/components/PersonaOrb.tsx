import React, { useEffect, useState } from 'react';
import { LiveState, ThemeConfig } from '../types';
import { Sparkles } from 'lucide-react';

interface PersonaOrbProps {
  state: LiveState;
  theme: ThemeConfig;
  audioLevel: number; // 0.0 to 1.0
  onOrbClick?: () => void;
}

export const PersonaOrb: React.FC<PersonaOrbProps> = ({
  state,
  theme,
  audioLevel,
  onOrbClick,
}) => {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    // Dynamically modulate scale based on real-time audio volume
    const baseScale = state === 'speaking' ? 1.08 : state === 'listening' ? 1.04 : 1.0;
    const targetScale = baseScale + audioLevel * 0.28;
    setPulseScale(targetScale);
  }, [audioLevel, state]);

  // Status-dependent core animation classes
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing' || state === 'thinking';
  const isConnected = state !== 'disconnected';

  return (
    <div
      id="persona-orb-container"
      onClick={onOrbClick}
      className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 select-none cursor-pointer transition-transform duration-300"
      style={{
        transform: `scale(${pulseScale})`,
      }}
    >
      {/* Outer Atmospheric Glow Aura */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-60 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
          transform: `scale(${1 + audioLevel * 0.4})`,
        }}
      />

      {/* Outer Rotating Cyber Arc Ring */}
      <div
        className={`absolute inset-[-12px] rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? 'animate-spin border-opacity-70'
            : isListening
            ? 'animate-pulse border-opacity-40'
            : 'border-opacity-20'
        }`}
        style={{
          borderColor: theme.primary,
          animationDuration: isSpeaking ? '4s' : '12s',
        }}
      />

      {/* Second Counter-Rotating Thin Ring */}
      <div
        className="absolute inset-[-4px] rounded-full border border-dotted border-white/20 transition-all duration-500 pointer-events-none"
        style={{
          transform: isSpeaking ? 'rotate(-45deg) scale(1.05)' : 'rotate(0deg)',
          borderColor: isSpeaking ? theme.primary : 'rgba(255,255,255,0.15)',
        }}
      />

      {/* Ripple Wave Emitter (Active when speaking or listening) */}
      {isConnected && (
        <>
          <div
            className="absolute inset-0 rounded-full animate-ping pointer-events-none opacity-20"
            style={{
              borderColor: theme.primary,
              borderWidth: '2px',
              animationDuration: isSpeaking ? '1.5s' : '3s',
            }}
          />
          {isSpeaking && (
            <div
              className="absolute inset-[-20px] rounded-full animate-pulse pointer-events-none opacity-30"
              style={{
                borderColor: theme.primary,
                borderWidth: '1px',
                animationDuration: '0.8s',
              }}
            />
          )}
        </>
      )}

      {/* Holographic Orb Sphere Body */}
      <div
        className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-500 border border-white/20"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${theme.orbGradient[0]} 0%, ${theme.orbGradient[1]} 50%, ${theme.orbGradient[2]} 100%)`,
          boxShadow: `0 0 50px ${theme.glow}, inset 0 0 30px rgba(255, 255, 255, 0.3)`,
        }}
      >
        {/* Internal Liquid Core / Shimmering Swirls */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transition-opacity duration-300 ${
            isSpeaking ? 'animate-pulse opacity-90' : isListening ? 'opacity-50' : 'opacity-20'
          }`}
        />

        {/* Dynamic Iris Core Flare */}
        <div
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/15 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center shadow-inner transition-all duration-300"
          style={{
            transform: `scale(${0.9 + audioLevel * 0.35})`,
            boxShadow: `0 0 25px ${theme.primary}`,
          }}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'white', borderTopColor: 'transparent' }}
              />
              <span className="text-[9px] font-mono text-white/90 uppercase tracking-widest mt-1">
                Thinking...
              </span>
            </div>
          ) : isSpeaking ? (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <div className="w-1.5 h-7 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
            </div>
          ) : isListening ? (
            <div className="flex flex-col items-center">
              <div
                className="w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-75 mb-1"
              />
              <span className="text-[9px] font-mono text-emerald-300 uppercase tracking-widest font-semibold">
                Hearing You
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-white/80">
              <Sparkles className="w-6 h-6 animate-pulse text-white/90" />
              <span className="text-[9px] font-mono text-white/70 tracking-widest mt-0.5 uppercase">
                ROXY
              </span>
            </div>
          )}
        </div>

        {/* Orbiting Specular Highlights */}
        <div className="absolute top-4 left-6 w-10 h-6 bg-white/40 rounded-full rotate-[-30deg] blur-[2px] pointer-events-none" />
      </div>

      {/* Orbiting Satellite Node for Extra Sci-Fi Flair */}
      <div
        className="absolute w-full h-full rounded-full pointer-events-none animate-spin"
        style={{ animationDuration: '8s' }}
      >
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg"
          style={{
            boxShadow: `0 0 10px ${theme.primary}, 0 0 20px #ffffff`,
          }}
        />
      </div>
    </div>
  );
};
