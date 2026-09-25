import React from 'react';
import { ToolExecutionEvent, ThemeConfig } from '../types';
import { ExternalLink, Search, Palette, Zap, CheckCircle2 } from 'lucide-react';

interface ActionToastProps {
  events: ToolExecutionEvent[];
  theme: ThemeConfig;
  onClear: () => void;
}

export const ActionToast: React.FC<ActionToastProps> = ({ events, theme, onClear }) => {
  if (events.length === 0) return null;

  const latestEvent = events[events.length - 1];

  const getIcon = (type: ToolExecutionEvent['type']) => {
    switch (type) {
      case 'website':
        return <ExternalLink className="w-4 h-4 text-cyan-400" />;
      case 'search':
        return <Search className="w-4 h-4 text-emerald-400" />;
      case 'theme':
        return <Palette className="w-4 h-4 text-violet-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className="p-3.5 rounded-2xl bg-[#111116]/95 border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs font-mono"
        style={{
          borderColor: theme.border,
          boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 15px ${theme.glow}`,
        }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
            {getIcon(latestEvent.type)}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                TOOL EXECUTED • {latestEvent.name}
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-white font-medium truncate text-xs">
              {latestEvent.result}
            </span>
          </div>
        </div>

        <button
          onClick={onClear}
          className="text-[10px] text-white/40 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 shrink-0 cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
