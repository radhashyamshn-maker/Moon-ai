import React, { useState, useEffect, useRef } from 'react';
import { LiveState, ThemeConfig, CharacterAnimation } from '../types';
import { Sparkles, Heart, Mic, Volume2, HelpCircle, Smile, MessageCircle } from 'lucide-react';
import { ThreeAnimeCharacter } from './ThreeAnimeCharacter';

export type AvatarExpression = 'shy' | 'happy' | 'thinking' | 'attentive' | 'blushing' | 'sleeping';

interface AnimeAvatarProps {
  state: LiveState;
  theme: ThemeConfig;
  audioLevel: number; // 0.0 to 1.0
  activeDialogue?: string;
  isDialogueStreaming?: boolean;
  onAvatarClick?: () => void;
  onAvatarDoubleClick?: () => void;
  onTriggerVoice?: () => void;
  expressionOverride?: AvatarExpression | null;
  animation?: CharacterAnimation;
}

export const AnimeAvatar: React.FC<AnimeAvatarProps> = ({
  state,
  theme,
  audioLevel,
  activeDialogue,
  isDialogueStreaming = false,
  onAvatarClick,
  onAvatarDoubleClick,
  onTriggerVoice,
  expressionOverride,
  animation = 'idle',
}) => {
  // Headpat / click reaction
  const [isHeadpatted, setIsHeadpatted] = useState(false);
  const [headpatText, setHeadpatText] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  // Floating speech bubble dismissal/auto-timer
  const [displayedText, setDisplayedText] = useState<string>('');
  const lastTapRef = useRef<number>(0);

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking' || state === 'processing';
  const isConnected = state !== 'disconnected';

  // Determine current active expression
  let currentExpression: AvatarExpression = 'shy';
  if (expressionOverride) {
    currentExpression = expressionOverride;
  } else if (animation === 'sleepy') {
    currentExpression = 'sleeping';
  } else if (isHeadpatted) {
    currentExpression = 'blushing';
  } else if (isSpeaking) {
    currentExpression = 'happy';
  } else if (isThinking) {
    currentExpression = 'thinking';
  } else if (isListening) {
    currentExpression = 'attentive';
  }

  // Sync active dialogue typing animation
  useEffect(() => {
    if (!activeDialogue) {
      setDisplayedText('');
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      if (currentIndex < activeDialogue.length) {
        setDisplayedText(activeDialogue.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [activeDialogue]);

  // Interactive Avatar Click / Headpat reaction with Double-Tap detection
  const handleAvatarTouch = (e?: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    // Check for double tap (mobile or rapid click within 350ms)
    if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
      lastTapRef.current = 0;
      if (onAvatarDoubleClick) {
        onAvatarDoubleClick();
        return;
      }
    }
    lastTapRef.current = now;

    let x = 140;
    let y = 180;
    if (e && 'clientX' in e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const newHeart = { id: Date.now() + Math.random(), x, y };
    setHearts((prev) => [...prev.slice(-6), newHeart]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);

    setIsHeadpatted(true);
    const companionReactions = [
      'I am right here with you!',
      'Always happy to help you today.',
      'Listening closely to your voice ✨',
      'Your AI assistant is ready for your command.',
      'How can I assist you right now?',
    ];
    const picked = companionReactions[Math.floor(Math.random() * companionReactions.length)];
    setHeadpatText(picked);

    setTimeout(() => {
      setIsHeadpatted(false);
      setHeadpatText(null);
    }, 3200);

    if (onAvatarClick) {
      onAvatarClick();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (onAvatarDoubleClick) {
      onAvatarDoubleClick();
    }
  };

  return (
    <div
      id="anime-avatar-stage"
      className="relative flex flex-col items-center justify-center select-none w-full max-w-sm mx-auto"
    >
      {/* Floating Dialogue Speech Bubble */}
      {(displayedText || headpatText || isThinking) && (
        <div
          id="anime-speech-bubble"
          className="absolute -top-14 sm:-top-16 z-30 max-w-[280px] sm:max-w-xs px-4 py-2.5 rounded-2xl bg-[#181824]/90 backdrop-blur-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300 pointer-events-auto"
          style={{
            boxShadow: `0 10px 30px -10px ${theme.glow}`,
          }}
        >
          {/* Cute Little Avatar Pointer Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#181824] border-b border-r border-white/20 rotate-45" />

          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5 animate-spin" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[10px] font-mono font-bold text-pink-300 uppercase tracking-wider">
                  Moon • 3D
                </span>
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                    <Volume2 className="w-3 h-3 animate-pulse" /> Speaking
                  </span>
                )}
                {isThinking && (
                  <span className="text-[9px] font-mono text-amber-300 animate-pulse">
                    Thinking...
                  </span>
                )}
              </div>
              <p className="text-xs text-white/95 font-sans leading-snug break-words">
                {headpatText || displayedText || 'I am thinking about your response...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3D AVATAR STAGE: Completely INVISIBLE / TRANSPARENT BACKGROUND (No box, no photo boundaries) */}
      <div
        id="anime-character-card"
        onClick={handleAvatarTouch}
        onDoubleClick={handleDoubleClick}
        className="relative group cursor-pointer w-full h-[460px] sm:h-[520px] flex items-center justify-center transition-all duration-500"
        style={{
          background: 'transparent', // 100% invisible/transparent background
        }}
      >
        {/* Soft Ambient Aura Glow (Behind 3D Character) */}
        <div
          className="absolute inset-0 opacity-40 transition-opacity duration-700 pointer-events-none blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 45%, ${theme.glow} 0%, transparent 70%)`,
            opacity: isSpeaking ? 0.75 : currentExpression === 'sleeping' ? 0.2 : 0.4,
          }}
        />

        {/* Ambient Floating Particle Sparkles & Sleep Zzz Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {currentExpression === 'sleeping' ? (
            <>
              <span className="absolute top-16 right-16 text-indigo-300/80 text-sm font-mono animate-bounce">
                💤
              </span>
              <span className="absolute top-24 right-10 text-indigo-400/60 text-xs font-mono animate-pulse">
                z
              </span>
              <span className="absolute top-32 right-20 text-indigo-300/40 text-[10px] font-mono">
                z
              </span>
            </>
          ) : (
            <>
              <span className="absolute top-12 left-10 w-1.5 h-1.5 rounded-full bg-pink-300/60 animate-ping" />
              <span className="absolute bottom-20 right-10 w-2 h-2 rounded-full bg-purple-300/40 animate-pulse" />
              <span className="absolute top-24 right-8 text-pink-300/50 text-[10px] animate-bounce">
                ✨
              </span>
              <span className="absolute bottom-28 left-8 text-violet-300/40 text-xs animate-pulse">
                🌸
              </span>
            </>
          )}
        </div>

        {/* Floating Hearts Click Particles */}
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute z-40 pointer-events-none text-pink-400 animate-out fade-out slide-out-to-top-8 duration-1000"
            style={{ left: `${h.x - 10}px`, top: `${h.y - 10}px` }}
          >
            <Heart className="w-6 h-6 fill-pink-400 text-pink-300 drop-shadow-md" />
          </div>
        ))}

        {/* Real-time 3D Anime Character Canvas */}
        <ThreeAnimeCharacter
          state={state}
          theme={theme}
          audioLevel={audioLevel}
          expression={currentExpression}
          animation={animation}
          isHeadpatted={isHeadpatted}
          onPointerHit={() => handleAvatarTouch()}
        />

        {/* Sleeping Floating Badge */}
        {currentExpression === 'sleeping' && (
          <div className="absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-mono text-indigo-300 backdrop-blur-md animate-pulse shadow-lg">
            <span>🌙</span>
            <span>Sleeping... (Zzz)</span>
          </div>
        )}

        {/* Attentive Listening Floating Badge */}
        {isListening && currentExpression !== 'sleeping' && (
          <div className="absolute top-4 right-6 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 backdrop-blur-md animate-bounce shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Listening
          </div>
        )}

        {/* Thinking Floating Badge */}
        {isThinking && (
          <div className="absolute top-4 right-6 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 backdrop-blur-md animate-pulse shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            Thinking...
          </div>
        )}

        {/* Bottom Interactive Glass Capsule Badge */}
        <div className="absolute bottom-1 inset-x-6 z-20 flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[#12121e]/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/70 shadow-lg">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
              style={{
                color: currentExpression === 'sleeping'
                  ? '#818CF8'
                  : isSpeaking
                  ? theme.primary
                  : isListening
                  ? '#10B981'
                  : isThinking
                  ? '#F59E0B'
                  : 'rgba(255,255,255,0.4)',
                backgroundColor: 'currentColor',
              }}
            />
            <span className="font-semibold text-white/90">MOON 3D</span>
            <span className="text-[9px] text-white/40 capitalize">({currentExpression})</span>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-pink-300/90">
            {isConnected ? (
              <span className="text-white/70 hover:text-pink-300 transition-colors">
                Double-tap: <strong className="text-pink-300 font-bold">Sleep / Close 💤</strong>
              </span>
            ) : (
              <>
                <Heart className="w-2.5 h-2.5 fill-pink-400 text-pink-400 animate-pulse" />
                <span>Tap to react</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Voice / Audio Level Visualizer Wave Ribbon Underneath */}
      {isConnected && (
        <div className="mt-2 flex items-center justify-center gap-1 h-3 px-4 py-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          {Array.from({ length: 9 }).map((_, i) => {
            const heightMultiplier = Math.sin((i / 8) * Math.PI);
            const dynamicHeight = Math.max(
              3,
              isSpeaking
                ? heightMultiplier * audioLevel * 14
                : isListening
                ? heightMultiplier * audioLevel * 10
                : 3
            );
            return (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-100"
                style={{
                  height: `${dynamicHeight}px`,
                  backgroundColor: isSpeaking
                    ? theme.primary
                    : isListening
                    ? '#10B981'
                    : 'rgba(255,255,255,0.2)',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
