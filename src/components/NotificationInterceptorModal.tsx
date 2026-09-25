import React, { useState } from 'react';
import { NotificationItem, ThemeConfig } from '../types';
import { Bell, Bot, Send, Sparkles, X, CheckCircle2, MessageSquare, Plus } from 'lucide-react';

interface NotificationInterceptorModalProps {
  notifications: NotificationItem[];
  theme: ThemeConfig;
  onAutoReply: (notifId: string, replyText: string) => void;
  onSendToWhatsApp: (sender: string, text: string) => void;
  onAddSimulatedNotification: (app: NotificationItem['app'], sender: string, message: string) => void;
  onClose: () => void;
}

export const NotificationInterceptorModal: React.FC<NotificationInterceptorModalProps> = ({
  notifications,
  theme,
  onAutoReply,
  onSendToWhatsApp,
  onAddSimulatedNotification,
  onClose,
}) => {
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(
    notifications[0] || null
  );

  const generateSassyReply = (sender: string, msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('coffee') || lower.includes('lunch') || lower.includes('meet')) {
      return `Count me in! Just let me know the time and place ☕✨`;
    }
    if (lower.includes('code') || lower.includes('review') || lower.includes('pr')) {
      return `Checking it right now, expect clean comments shortly! 💻🚀`;
    }
    if (lower.includes('urgent') || lower.includes('asap')) {
      return `Got it! On it immediately, stand by.`;
    }
    return `Hey ${sender}! Moon is managing my notifications. Will ping you right after this session! ✨`;
  };

  return (
    <div
      id="notifications-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        className="bg-[#121217] border rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative max-h-[88vh] overflow-y-auto"
        style={{
          borderColor: theme.border,
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 25px ${theme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Autonomous Notifications Interceptor
              </h3>
              <span className="text-[10px] font-mono text-white/40">
                Moon auto-processes chats & prepares smart contextual responses
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Simulation Trigger Buttons */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
            Simulate Incoming App Message:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() =>
                onAddSimulatedNotification(
                  'WhatsApp',
                  'Alex Rivera',
                  'Are you free for coffee and quick design sprint this afternoon?'
                )
              }
              className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 transition-all cursor-pointer"
            >
              💬 WhatsApp: Alex
            </button>
            <button
              onClick={() =>
                onAddSimulatedNotification(
                  'Slack',
                  'Engineering Team',
                  'Production deploy finished. Can you verify telemetry logs?'
                )
              }
              className="px-2.5 py-1 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-[11px] font-mono text-violet-300 transition-all cursor-pointer"
            >
              💼 Slack: Team
            </button>
            <button
              onClick={() =>
                onAddSimulatedNotification(
                  'Instagram',
                  'Elena Vance',
                  'Loved your new project build! When is the demo dropping?'
                )
              }
              className="px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-[11px] font-mono text-pink-300 transition-all cursor-pointer"
            >
              📸 Instagram: Elena
            </button>
          </div>
        </div>

        {/* Notification Stream Feed */}
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const isAutoReplied = n.autoReplied;
            const suggestedReply = n.replyText || generateSassyReply(n.sender, n.message);

            return (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${
                        n.app === 'WhatsApp'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : n.app === 'Slack'
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                          : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                      }`}
                    >
                      {n.app}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{n.sender}</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">{n.time}</span>
                </div>

                <p className="text-xs font-mono text-white/80 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                  "{n.message}"
                </p>

                {/* Tung Tung Auto-Reply Area */}
                <div className="p-2.5 rounded-xl bg-violet-950/20 border border-violet-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-violet-300 uppercase flex items-center gap-1">
                      <Bot className="w-3 h-3 text-violet-400" /> Tung Tung Autonomous Draft
                    </span>
                    {isAutoReplied && (
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Auto-Replied
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-mono text-white/90 italic">
                    "{suggestedReply}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!isAutoReplied && (
                      <button
                        onClick={() => onAutoReply(n.id, suggestedReply)}
                        className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Bot className="w-3 h-3" /> Auto-Reply
                      </button>
                    )}

                    <button
                      onClick={() => onSendToWhatsApp(n.sender, suggestedReply)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" /> WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
