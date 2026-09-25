import React from 'react';
import { AtmosphereTheme, ThemeConfig } from '../types';
import { THEME_PRESETS } from './ThemePresets';
import { X, Check } from 'lucide-react';

interface ThemeModalProps {
  currentTheme: AtmosphereTheme;
  onSelectTheme: (theme: AtmosphereTheme) => void;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121216] border border-white/15 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Atmosphere Aura
            </h3>
            <span className="text-[10px] font-mono text-white/40">
              Customize holographic glow and visual mood
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="grid grid-cols-2 gap-2.5">
          {Object.values(THEME_PRESETS).map((t) => {
            const isSelected = t.id === currentTheme;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTheme(t.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 border-white/40 shadow-lg'
                    : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-5 h-5 rounded-full shadow-md"
                    style={{
                      backgroundColor: t.primary,
                      boxShadow: `0 0 10px ${t.glow}`,
                    }}
                  />
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-xs font-mono font-medium text-white">
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-[10px] font-mono text-white/50 text-center">
          Tip: You can also say "Tung Tung, change the aura to neon rose" anytime!
        </div>
      </div>
    </div>
  );
};
