import React, { useState, useRef, useEffect } from 'react';
import { LiveState, ThemeConfig } from '../types';
import { Mic, Volume2, Eye, Play, Pause, PhoneCall, Bell, Sparkles, X, Maximize2, Settings, GripVertical } from 'lucide-react';

interface FloatingOverlayProps {
  state: LiveState;
  theme: ThemeConfig;
  audioLevel: number;
  onToggleSession: () => void;
  onTriggerVision: () => void;
  isVisionActive: boolean;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenIncomingCall: () => void;
  isCallRinging: boolean;
  onExpandToFull: () => void;
  onOpenSettings?: () => void;
}

export const FloatingOverlay: React.FC<FloatingOverlayProps> = ({
  state,
  theme,
  audioLevel,
  onToggleSession,
  onTriggerVision,
  isVisionActive,
  isPlayingMusic,
  onToggleMusic,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenIncomingCall,
  isCallRinging,
  onExpandToFull,
  onOpenSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isConnected = state !== 'disconnected';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking' || state === 'processing';

  // Draggable position coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('moon_floating_pos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return {
              x: Math.min(Math.max(10, parsed.x), window.innerWidth - 200),
              y: Math.min(Math.max(10, parsed.y), window.innerHeight - 80),
            };
          }
        }
      } catch {
        // ignore
      }
      return {
        x: Math.max(12, window.innerWidth - 210),
        y: Math.max(12, window.innerHeight - 90),
      };
    }
    return { x: 200, y: 500 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    hasMoved: false,
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  // Keep inside screen bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const pillWidth = pillRef.current?.offsetWidth || 190;
        const pillHeight = pillRef.current?.offsetHeight || 50;
        const maxX = Math.max(10, window.innerWidth - pillWidth - 10);
        const maxY = Math.max(10, window.innerHeight - pillHeight - 10);
        return {
          x: Math.min(Math.max(10, prev.x), maxX),
          y: Math.min(Math.max(10, prev.y), maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer drag start handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
      hasMoved: false,
    };

    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Pointer drag move handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.hasMoved = true;
    }

    const pillWidth = pillRef.current?.offsetWidth || 190;
    const pillHeight = pillRef.current?.offsetHeight || 50;
    const minX = 8;
    const maxX = Math.max(minX, window.innerWidth - pillWidth - 8);
    const minY = 8;
    const maxY = Math.max(minY, window.innerHeight - pillHeight - 8);

    const nextX = Math.min(Math.max(minX, dragRef.current.initX + dx), maxX);
    const nextY = Math.min(Math.max(minY, dragRef.current.initY + dy), maxY);

    setPosition({ x: nextX, y: nextY });
  };

  // Pointer drag end handler
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(false);

    if (dragRef.current.hasMoved) {
      try {
        localStorage.setItem('moon_floating_pos', JSON.stringify(position));
      } catch {
        // ignore
      }
    }
  };

  // Determine smart expansion layout direction based on current screen position
  const openDownward = position.y < 350;
  const alignLeft = position.x < 130;

  return (
    <div
      ref={overlayRef}
      id="moon-floating-overlay"
      className={`fixed z-50 flex ${
        openDownward ? 'flex-col' : 'flex-col-reverse'
      } ${alignLeft ? 'items-start' : 'items-end'} gap-2 select-none`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
    >
      {/* Floating Main Pill / Trigger (DRAGGABLE ANYWHERE) */}
      <div className="flex items-center gap-2">
        {/* Incoming Call Ringing Alert Trigger */}
        {isCallRinging && (
          <button
            onClick={(e) => {
              if (dragRef.current.hasMoved) return;
              onOpenIncomingCall();
            }}
            className="px-3 py-2 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white border border-rose-400 shadow-xl flex items-center gap-1.5 text-xs font-mono font-bold animate-bounce cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 animate-spin" />
            <span>Call Ringing!</span>
          </button>
        )}

        {/* The Floating Pill - Drag surface */}
        <div
          ref={pillRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Drag me anywhere on screen"
          className={`flex items-center gap-2 p-1.5 pr-3 pl-2 rounded-full bg-[#121217]/95 border backdrop-blur-xl shadow-2xl transition-shadow duration-300 touch-none ${
            isDragging ? 'cursor-grabbing scale-105 shadow-pink-500/30' : 'cursor-grab active:cursor-grabbing hover:brightness-110'
          }`}
          style={{
            borderColor: isDragging ? theme.primary : theme.border,
            boxShadow: isDragging
              ? `0 15px 35px rgba(0,0,0,0.8), 0 0 25px ${theme.glow}`
              : `0 10px 25px rgba(0,0,0,0.6), 0 0 15px ${theme.glow}`,
          }}
        >
          {/* Visual Grip Handle Dots */}
          <div className="text-white/30 hover:text-white/60 flex items-center -mr-0.5">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Main Voice Orb Button */}
          <button
            id="floating-mic-btn"
            onClick={(e) => {
              if (dragRef.current.hasMoved) {
                e.stopPropagation();
                return;
              }
              onToggleSession();
            }}
            title={isConnected ? 'Moon Speaking / Listening' : 'Start Voice Chat'}
            className="w-10 h-10 rounded-full flex items-center justify-center relative cursor-pointer active:scale-90 transition-transform shrink-0"
            style={{
              background: `radial-gradient(circle, ${theme.primary} 0%, rgba(20,20,28,0.9) 100%)`,
              boxShadow: isConnected ? `0 0 12px ${theme.glow}` : 'none',
              transform: `scale(${1 + audioLevel * 0.15})`,
            }}
          >
            {isSpeaking ? (
              <Volume2 className="w-4 h-4 text-white animate-pulse" />
            ) : isListening ? (
              <Mic className="w-4 h-4 text-emerald-300 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Quick Status and Drawer Toggle */}
          <button
            onClick={(e) => {
              if (dragRef.current.hasMoved) {
                e.stopPropagation();
                return;
              }
              setIsExpanded(!isExpanded);
            }}
            className="flex flex-col text-left cursor-pointer select-none"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                MOON
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isConnected ? '#10B981' : 'rgba(255,255,255,0.4)' }}
              />
            </div>
            <span className="text-[9px] font-mono text-white/50 uppercase tracking-tight">
              {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Moon 3D AI'}
            </span>
          </button>

          {/* Screen Vision Quick Eye Trigger */}
          <button
            onClick={(e) => {
              if (dragRef.current.hasMoved) {
                e.stopPropagation();
                return;
              }
              onTriggerVision();
            }}
            title="Screen Vision Eye"
            className={`p-1.5 rounded-full border transition-all cursor-pointer ml-1 ${
              isVisionActive
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-white/5 border-white/10 hover:bg-white/15 text-white/60 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Quick Deck Card */}
      {isExpanded && (
        <div
          className="p-3.5 rounded-3xl bg-[#101015]/95 border backdrop-blur-2xl shadow-2xl w-64 space-y-3 animate-in fade-in zoom-in-95 duration-200"
          style={{
            borderColor: theme.border,
            boxShadow: `0 20px 40px rgba(0,0,0,0.8), 0 0 20px ${theme.glow}`,
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                Moon Floating Arc
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onExpandToFull}
                title="Expand Full App"
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                title="Minimize Pill"
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Voice State */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center border shadow-md"
                style={{
                  background: `radial-gradient(circle, ${theme.primary} 0%, rgba(20,20,25,0.9) 100%)`,
                  borderColor: theme.border,
                }}
              >
                {isSpeaking ? (
                  <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                ) : isThinking ? (
                  <Sparkles className="w-3.5 h-3.5 text-violet-300 animate-spin" />
                ) : isListening ? (
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-white/70" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-mono text-white/50 uppercase block">Voice Link</span>
                <span className="text-xs font-mono font-bold text-white">
                  {isSpeaking ? 'Speaking...' : isThinking ? 'Thinking...' : isListening ? 'Listening' : isConnected ? 'Live' : 'Standby'}
                </span>
              </div>
            </div>

            <button
              onClick={onToggleSession}
              className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer shadow-md"
              style={{
                backgroundColor: isConnected ? 'rgba(239, 68, 68, 0.2)' : theme.primary,
                border: `1px solid ${isConnected ? 'rgba(239, 68, 68, 0.4)' : theme.border}`,
                color: '#ffffff',
              }}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
            {/* Screen Vision */}
            <button
              onClick={onTriggerVision}
              className={`p-2 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isVisionActive
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Vision</span>
            </button>

            {/* Media Music Player */}
            <button
              onClick={onToggleMusic}
              className={`p-2 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isPlayingMusic
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              {isPlayingMusic ? <Pause className="w-4 h-4 text-violet-400" /> : <Play className="w-4 h-4 text-violet-400" />}
              <span>{isPlayingMusic ? 'Pause' : 'Music'}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex flex-col items-center gap-1 transition-all cursor-pointer relative"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Alerts</span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            {/* Settings & API */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-violet-400" />
                <span>Config</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
