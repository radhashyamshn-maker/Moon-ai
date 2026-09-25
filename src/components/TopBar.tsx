import React from 'react';
import { LiveState, ThemeConfig, WakeWordConfig } from '../types';
import {
  Sparkles,
  Sliders,
  Settings,
  Palette,
  Zap,
  Eye,
  Music,
  PhoneCall,
  Bell,
  Cpu,
  Calendar,
  Users,
  ShieldCheck,
  LayoutGrid,
  MessageSquare,
  Clock,
  Key,
  Ear,
  Fingerprint,
  Lock,
  FolderOpen,
  Droplets,
  Flower2,
  Film,
} from 'lucide-react';

interface TopBarProps {
  state: LiveState;
  theme: ThemeConfig;
  unreadCount: number;
  isCallRinging: boolean;
  isVisionActive: boolean;
  activePermissionsCount: number;
  totalPermissionsCount: number;
  wakeWordConfig?: WakeWordConfig;
  isWakeWordListening?: boolean;
  isBiometricLocked?: boolean;
  onOpenWakeWord?: () => void;
  onQuickLock?: () => void;
  onOpenBiometrics?: () => void;
  onOpenSettings: () => void;
  onOpenThemes: () => void;
  onOpenPrompts: () => void;
  onOpenVision: () => void;
  onOpenMedia: () => void;
  onOpenCalls: () => void;
  onOpenNotifications: () => void;
  onOpenHardware: () => void;
  onOpenCalendar: () => void;
  onOpenContacts: () => void;
  onOpenPermissions: () => void;
  onOpenApps: () => void;
  onOpenSms: () => void;
  onOpenAlarms: () => void;
  onOpenFiles?: () => void;
  onToggleEdgeOverlay?: () => void;
  onOpenCinematicEditor?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  theme,
  unreadCount,
  isCallRinging,
  isVisionActive,
  activePermissionsCount,
  totalPermissionsCount,
  wakeWordConfig,
  isWakeWordListening,
  isBiometricLocked,
  onOpenWakeWord,
  onQuickLock,
  onOpenBiometrics,
  onOpenSettings,
  onOpenThemes,
  onOpenPrompts,
  onOpenVision,
  onOpenMedia,
  onOpenCalls,
  onOpenNotifications,
  onOpenHardware,
  onOpenCalendar,
  onOpenContacts,
  onOpenPermissions,
  onOpenApps,
  onOpenSms,
  onOpenAlarms,
  onOpenFiles,
  onToggleEdgeOverlay,
  onOpenCinematicEditor,
}) => {
  const isConnected = state !== 'disconnected';

  return (
    <header className="w-full px-3 sm:px-4 py-2.5 flex flex-col gap-2 z-30 select-none">
      {/* Upper Main Brand Row */}
      <div className="flex items-center justify-between">
        {/* Brand & Persona Label */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-lg cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, rgba(20,20,25,0.9) 100%)`,
              borderColor: theme.border,
              boxShadow: `0 0 15px ${theme.glow}`,
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold font-mono text-white tracking-widest uppercase">
                MOON
              </h1>
              <span
                className="text-[9px] font-mono px-1.5 py-0.2 rounded-full border uppercase tracking-wider font-semibold"
                style={{
                  backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                  borderColor: isConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)',
                  color: isConnected ? '#34D399' : 'rgba(255,255,255,0.5)',
                }}
              >
                {isConnected ? 'LIVE BIDI' : 'STANDBY'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/40 block">
              Phone Executive • Voice • Vision • Permissions
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Biometric Shield / Quick Lock Button */}
          {onQuickLock && (
            <button
              id="btn-topbar-quick-lock"
              onClick={onQuickLock}
              aria-label="Lock Assistant with Biometrics"
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono shadow-sm"
              title="Quick Lock (WebAuthn Biometrics)"
            >
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px] font-bold">Lock Shield</span>
            </button>
          )}

          {/* Hands-Free Wake Word Status Chip */}
          {onOpenWakeWord && (
            <button
              onClick={onOpenWakeWord}
              aria-label="Wake Word Settings"
              className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
                wakeWordConfig?.enabled
                  ? 'bg-pink-600/20 hover:bg-pink-600/30 border-pink-500/40 text-pink-300 shadow-sm shadow-pink-900/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
              }`}
              title="Hands-Free Wake Word Settings"
            >
              <Ear className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline text-[11px] font-bold">
                {wakeWordConfig?.enabled ? wakeWordConfig.activeWakeWord : 'Wake Word Off'}
              </span>
              {wakeWordConfig?.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              )}
            </button>
          )}

          {/* Permissions Hub Button */}
          <button
            onClick={onOpenPermissions}
            aria-label="Permissions Hub"
            className="px-2.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="System Phone Permissions"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-bold">
              {activePermissionsCount}/{totalPermissionsCount} Perms
            </span>
          </button>

          {/* Incoming Call Ringing Alert Trigger */}
          {isCallRinging && (
            <button
              onClick={onOpenCalls}
              className="px-2.5 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-mono font-bold text-xs flex items-center gap-1 animate-bounce cursor-pointer shadow-lg"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call!</span>
            </button>
          )}

          {/* Quick Talk Ideas */}
          <button
            onClick={onOpenPrompts}
            aria-label="Voice Ideas"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Talk Ideas</span>
          </button>

          {/* Theme Aura */}
          <button
            onClick={onOpenThemes}
            aria-label="Atmosphere Theme"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            title="Atmosphere Theme"
          >
            <Palette className="w-4 h-4 text-violet-400" />
          </button>

          {/* Settings & API Setup */}
          <button
            id="open-settings-topbar-btn"
            onClick={onOpenSettings}
            aria-label="Settings & API Setup"
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-white/80 hover:text-violet-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Settings & API Setup"
          >
            <Settings className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline font-bold">Settings</span>
          </button>
        </div>
      </div>

      {/* Autonomous Tool Execution Quick Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs font-mono">
        {/* Wake Word Hands-Free Button */}
        {onOpenWakeWord && (
          <button
            onClick={onOpenWakeWord}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              wakeWordConfig?.enabled
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <Ear className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-[11px] font-bold">
              {wakeWordConfig?.enabled ? `Wake: "${wakeWordConfig.activeWakeWord}"` : 'Wake Word'}
            </span>
          </button>
        )}

        {/* Apps Launcher */}
        <button
          onClick={onOpenApps}
          className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold">App Matrix</span>
        </button>

        {/* CapCut Cinematic Studio */}
        <button
          onClick={onOpenCinematicEditor}
          className="px-2.5 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/40 text-violet-300 hover:bg-violet-500/25 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm shadow-violet-500/20"
        >
          <Film className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-bold">CapCut Cinematic</span>
        </button>

        {/* SMS Messages */}
        <button
          onClick={onOpenSms}
          className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px]">SMS Messages</span>
        </button>

        {/* Clock & Alarms */}
        <button
          onClick={onOpenAlarms}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px]">Clock & Timer</span>
        </button>

        {/* Phone & Dialer */}
        <button
          onClick={onOpenCalls}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer relative"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">Phone & Dialer</span>
        </button>

        {/* Screen Vision Sensor */}
        <button
          onClick={onOpenVision}
          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            isVisionActive
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">Screen Vision</span>
        </button>

        {/* Media Music Player */}
        <button
          onClick={onOpenMedia}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Music className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px]">Media Player</span>
        </button>

        {/* Autonomous Notifications */}
        <button
          onClick={onOpenNotifications}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5 shrink-0 transition-all cursor-pointer relative"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px]">Alerts</span>
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        {/* Hardware Toggles */}
        <button
          onClick={onOpenHardware}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px]">Hardware</span>
        </button>

        {/* Calendar */}
        <button
          onClick={onOpenCalendar}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-[11px]">Planner</span>
        </button>

        {/* Contacts & WhatsApp */}
        <button
          onClick={onOpenContacts}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">Contacts</span>
        </button>

        {/* Files & Media Explorer */}
        {onOpenFiles && (
          <button
            onClick={onOpenFiles}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold">Files (फाइल्स)</span>
          </button>
        )}

        {/* Edge Aura & Background Bubbles / Blooming Flowers */}
        {onToggleEdgeOverlay && (
          <button
            onClick={onToggleEdgeOverlay}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title="Screen Edge Water Bubbles & Blooming Flowers Overlay"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <Flower2 className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-[11px] font-bold">Edge Aura (बबल्स/फूल)</span>
          </button>
        )}
      </div>
    </header>
  );
};
