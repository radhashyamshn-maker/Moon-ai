import React from 'react';
import { MediaTrack, ThemeConfig } from '../types';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Sparkles, Disc } from 'lucide-react';

interface MediaPlaybackWidgetProps {
  currentTrack: MediaTrack;
  isPlaying: boolean;
  volume: number;
  playlist: MediaTrack[];
  theme: ThemeConfig;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSelectTrack: (track: MediaTrack) => void;
  onVolumeChange: (vol: number) => void;
  onClose?: () => void;
}

export const MediaPlaybackWidget: React.FC<MediaPlaybackWidgetProps> = ({
  currentTrack,
  isPlaying,
  volume,
  playlist,
  theme,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSelectTrack,
  onVolumeChange,
}) => {
  return (
    <div
      id="media-playback-deck"
      className="p-4 rounded-3xl bg-[#111116]/95 border backdrop-blur-2xl shadow-2xl space-y-3.5 w-full max-w-sm"
      style={{
        borderColor: theme.border,
        boxShadow: `0 15px 35px rgba(0,0,0,0.8), 0 0 20px ${theme.glow}`,
      }}
    >
      {/* Track Header & Album Artwork Art */}
      <div className="flex items-center gap-3">
        {/* Animated Vinyl Disc Art */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg relative overflow-hidden shrink-0 ${
            isPlaying ? 'animate-spin' : ''
          }`}
          style={{
            animationDuration: '6s',
            background: `linear-gradient(135deg, ${currentTrack.coverGradient[0]} 0%, ${currentTrack.coverGradient[1]} 100%)`,
            borderColor: theme.border,
          }}
        >
          <Disc className="w-7 h-7 text-white/90" />
          <div className="w-3 h-3 rounded-full bg-black/80 border border-white/30 absolute" />
        </div>

        {/* Track Title & Artist */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase">
              {currentTrack.genre}
            </span>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                PLAYING
              </span>
            )}
          </div>
          <h4 className="text-sm font-mono font-bold text-white truncate mt-1">
            {currentTrack.title}
          </h4>
          <span className="text-[11px] font-mono text-white/50 truncate block">
            {currentTrack.artist}
          </span>
        </div>
      </div>

      {/* Real-time Audio Spectrum Equalizer */}
      <div className="flex items-center justify-between gap-1 h-5 px-1">
        {Array.from({ length: 24 }).map((_, idx) => {
          const heightPercent = isPlaying
            ? Math.floor(Math.sin((idx + Date.now() / 200) * 0.8) * 40 + 50)
            : 15;

          return (
            <div
              key={idx}
              className="flex-1 rounded-full transition-all duration-150"
              style={{
                height: `${heightPercent}%`,
                backgroundColor: isPlaying ? theme.primary : 'rgba(255,255,255,0.1)',
              }}
            />
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onPrevTrack}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: `radial-gradient(circle, ${theme.primary} 0%, rgba(20,20,30,0.9) 100%)`,
            boxShadow: `0 0 15px ${theme.glow}`,
          }}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          onClick={onNextTrack}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Volume Control Bar */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[10px] font-mono text-white/50">
        <Volume2 className="w-3.5 h-3.5 shrink-0" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-violet-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
        />
        <span className="w-7 text-right">{Math.round(volume * 100)}%</span>
      </div>

      {/* Track Selection Pills */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {playlist.map((track) => {
          const isSelected = track.id === currentTrack.id;
          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`p-2 rounded-xl border text-left flex flex-col transition-all cursor-pointer text-[10px] font-mono ${
                isSelected
                  ? 'bg-white/10 border-white/30 text-white font-bold'
                  : 'bg-white/5 border-white/5 hover:border-white/15 text-white/60 hover:text-white'
              }`}
            >
              <span className="truncate">{track.title}</span>
              <span className="text-[8px] text-white/40 uppercase">{track.genre}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
