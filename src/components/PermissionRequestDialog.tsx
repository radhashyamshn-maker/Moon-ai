import React from 'react';
import { PermissionDefinition } from '../types';
import { getPermissionRouteInfo } from '../services/permissionRouting';
import {
  Shield,
  ShieldAlert,
  Check,
  X,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Fingerprint,
  Ear,
  Mic,
  Eye,
  PhoneCall,
  MessageSquare,
  Bell,
  Users,
  Cpu,
  Navigation,
  LayoutGrid,
} from 'lucide-react';

interface PermissionRequestDialogProps {
  permission: PermissionDefinition | null;
  onGrant: (key: string, redirect?: boolean) => void;
  onDeny: (key: string) => void;
}

export const PermissionRequestDialog: React.FC<PermissionRequestDialogProps> = ({
  permission,
  onGrant,
  onDeny,
}) => {
  if (!permission) return null;

  const routeInfo = getPermissionRouteInfo(permission.key);

  const getTargetIcon = () => {
    switch (permission.key) {
      case 'biometric_auth':
        return <Fingerprint className="w-5 h-5 text-cyan-300" />;
      case 'wake_word':
        return <Ear className="w-5 h-5 text-pink-300" />;
      case 'microphone':
        return <Mic className="w-5 h-5 text-emerald-300" />;
      case 'camera_screen':
        return <Eye className="w-5 h-5 text-cyan-300" />;
      case 'phone_calls':
        return <PhoneCall className="w-5 h-5 text-emerald-300" />;
      case 'sms_messaging':
        return <MessageSquare className="w-5 h-5 text-pink-300" />;
      case 'notifications':
        return <Bell className="w-5 h-5 text-amber-300" />;
      case 'contacts':
        return <Users className="w-5 h-5 text-violet-300" />;
      case 'device_settings':
        return <Cpu className="w-5 h-5 text-cyan-300" />;
      case 'location':
        return <Navigation className="w-5 h-5 text-emerald-300" />;
      case 'accessibility':
        return <LayoutGrid className="w-5 h-5 text-violet-300" />;
      default:
        return <Shield className="w-5 h-5 text-violet-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div
        id="native-permission-dialog"
        className="w-full max-w-md bg-[#13131a] border border-violet-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(139,92,246,0.25)] text-white space-y-4 animate-in zoom-in-95 duration-200"
      >
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-inner">
              {permission.dangerLevel === 'high' ? (
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
              ) : (
                <Shield className="w-6 h-6 text-violet-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Permission Required
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase font-bold">
                  {permission.category}
                </span>
              </div>
              <span className="text-[11px] text-white/50 block mt-0.5">
                Moon AI Executive Phone Controller
              </span>
            </div>
          </div>

          <button
            onClick={() => onDeny(permission.key)}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Feature Redirection Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-950/50 via-fuchsia-950/30 to-black/60 border border-violet-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              {getTargetIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-violet-300 font-bold uppercase tracking-wider">
                  Target Destination
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-200">
                  {routeInfo.featureBadge}
                </span>
              </div>
              <span className="text-xs font-bold text-white block truncate">
                {routeInfo.featureTitle}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[11px] text-violet-300 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20">
            <span>Auto-Redirect</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Message Content */}
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Allow access to {permission.title}?</span>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed font-sans">
            {permission.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Primary Action: Grant & Immediately Redirect */}
          <button
            id="btn-grant-and-redirect"
            onClick={() => onGrant(permission.key, true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/40 transition-all cursor-pointer border border-violet-400/30"
          >
            <Check className="w-4 h-4" />
            <span>Grant & Open {routeInfo.featureBadge}</span>
            <ArrowUpRight className="w-4 h-4 ml-0.5" />
          </button>

          {/* Secondary Action: Grant without redirect */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onGrant(permission.key, false)}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Grant Only</span>
            </button>
            <button
              onClick={() => onDeny(permission.key)}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/5"
            >
              <X className="w-3 h-3 text-rose-400" />
              <span>Deny</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
