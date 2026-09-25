import React from 'react';
import { PermissionDefinition } from '../types';
import { getPermissionRouteInfo, triggerNativePermissionRequest } from '../services/permissionRouting';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mic,
  Camera,
  Phone,
  MessageSquare,
  Bell,
  Users,
  Settings,
  MapPin,
  Sparkles,
  CheckCircle2,
  X,
  RotateCcw,
  ArrowUpRight,
  Fingerprint,
  Ear,
  LayoutGrid,
} from 'lucide-react';

interface PermissionsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  permissions: PermissionDefinition[];
  onTogglePermission: (key: string, granted: boolean) => void;
  onGrantAll: () => void;
  onResetPermissions: () => void;
  onRedirectToFeature?: (key: string) => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen = true,
  onClose,
  permissions,
  onTogglePermission,
  onGrantAll,
  onResetPermissions,
  onRedirectToFeature,
}) => {
  if (!isOpen) return null;

  const grantedCount = permissions.filter((p) => p.granted).length;
  const allGranted = grantedCount === permissions.length;

  const getIcon = (key: string) => {
    switch (key) {
      case 'biometric_auth':
        return <Fingerprint className="w-4 h-4 text-cyan-400" />;
      case 'wake_word':
        return <Ear className="w-4 h-4 text-pink-400" />;
      case 'microphone':
        return <Mic className="w-4 h-4 text-emerald-400" />;
      case 'camera_screen':
        return <Camera className="w-4 h-4 text-cyan-400" />;
      case 'phone_calls':
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'sms_messaging':
        return <MessageSquare className="w-4 h-4 text-pink-400" />;
      case 'notifications':
        return <Bell className="w-4 h-4 text-amber-400" />;
      case 'contacts':
        return <Users className="w-4 h-4 text-violet-400" />;
      case 'device_settings':
        return <Settings className="w-4 h-4 text-cyan-400" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-emerald-400" />;
      case 'accessibility':
        return <LayoutGrid className="w-4 h-4 text-violet-400" />;
      default:
        return <Shield className="w-4 h-4 text-violet-400" />;
    }
  };

  const categories = ['Critical', 'Media & Vision', 'Communication', 'System Controls'] as const;

  const handleGrantAndOpen = (key: string) => {
    if (key === 'display_over_apps') {
      triggerNativePermissionRequest('display_over_apps');
    }
    onTogglePermission(key, true);
    if (onRedirectToFeature) {
      onRedirectToFeature(key);
    }
  };

  const handleToggleClick = (key: string, currentGranted: boolean) => {
    if (!currentGranted && key === 'display_over_apps') {
      triggerNativePermissionRequest('display_over_apps');
    }
    onTogglePermission(key, !currentGranted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="phone-permissions-hub-modal"
        className="w-full max-w-2xl max-h-[90vh] bg-[#121218]/95 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col font-mono text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
                <span>Phone Permissions Hub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                  {grantedCount}/{permissions.length} Active
                </span>
              </h2>
              <p className="text-[11px] text-white/50">
                Granular OS controls authorized for Moon AI & direct feature routing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Action Bar */}
        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-white/5">
          <div className="text-[11px] text-white/60">
            {allGranted ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Autonomous Phone Authority Granted
              </span>
            ) : (
              <span className="text-amber-300/80 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> {permissions.length - grantedCount} Permissions Restricted
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onResetPermissions}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={onGrantAll}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/30 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grant All</span>
            </button>
          </div>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-3 custom-scrollbar">
          {categories.map((category) => {
            const catPerms = permissions.filter((p) => p.category === category);
            if (catPerms.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider flex items-center gap-2">
                  <span>{category} Authorities</span>
                  <div className="flex-1 h-[1px] bg-white/5" />
                </div>

                <div className="space-y-2.5">
                  {catPerms.map((perm) => {
                    const route = getPermissionRouteInfo(perm.key);
                    return (
                      <div
                        key={perm.key}
                        id={`perm-hub-row-${perm.key}`}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          perm.granted
                            ? 'bg-white/5 border-emerald-500/30 hover:border-emerald-500/50'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Info Left */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5 border ${
                              perm.granted
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-white/5 text-white/40 border-white/10'
                            }`}
                          >
                            {getIcon(perm.key)}
                          </div>

                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">
                                {perm.title}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                                {route.featureBadge}
                              </span>
                              {perm.dangerLevel === 'high' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                  Executive
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                              {perm.description}
                            </p>
                          </div>
                        </div>

                        {/* Action Controls Right */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                          {/* Dedicated Redirect / Open Feature Button */}
                          {onRedirectToFeature && (
                            <button
                              id={`btn-open-feature-${perm.key}`}
                              onClick={() => {
                                if (!perm.granted) {
                                  handleGrantAndOpen(perm.key);
                                } else {
                                  onRedirectToFeature(perm.key);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                perm.granted
                                  ? 'bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 shadow-sm'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                              }`}
                              title={
                                perm.granted
                                  ? `Open ${route.featureTitle}`
                                  : `Grant and redirect to ${route.featureTitle}`
                              }
                            >
                              {perm.granted ? (
                                <>
                                  <span>Open {route.featureBadge}</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Grant & Open</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}

                          {/* Switch Button */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={perm.granted}
                            onClick={() => handleToggleClick(perm.key, perm.granted)}
                            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                              perm.granted ? 'bg-emerald-500' : 'bg-white/20'
                            }`}
                            title={perm.granted ? 'Revoke Permission' : 'Grant Permission'}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                                perm.granted ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 shrink-0">
          <span>Clicking "Grant & Open" instantly authorizes and redirects to the target screen.</span>
          <span className="text-violet-400 font-bold">Moon AI OS</span>
        </div>
      </div>
    </div>
  );
};
