import React, { useState, useEffect } from 'react';
import { IncomingCall, ThemeConfig } from '../types';
import { Phone, PhoneOff, PhoneCall, Bot, MessageSquare, User, Sparkles, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface IncomingCallModalProps {
  call: IncomingCall | null;
  theme: ThemeConfig;
  onAnswer: (callId: string) => void;
  onReject: (callId: string, sms?: string) => void;
  onRoxyScreen: (callId: string) => void;
  onTriggerTestCall: (callerName?: string) => void;
  onClose: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  theme,
  onAnswer,
  onReject,
  onRoxyScreen,
  onTriggerTestCall,
  onClose,
}) => {
  const [screeningStep, setScreeningStep] = useState<number>(0);
  const [customSms, setCustomSms] = useState('');

  // Handle autonomous screening simulation progression
  useEffect(() => {
    if (call?.status === 'screened_by_roxy') {
      const timer1 = setTimeout(() => setScreeningStep(1), 800);
      const timer2 = setTimeout(() => setScreeningStep(2), 2200);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setScreeningStep(0);
    }
  }, [call?.status]);

  if (!call) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-[#121217] border border-white/15 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative text-center">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Autonomous Call Interceptor
            </h3>
            <button onClick={onClose} className="text-white/40 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <PhoneCall className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-mono text-white font-bold">No Active Call</p>
            <p className="text-[10px] font-mono text-white/50">
              Moon intercepts and screens unknown callers, takes messages, or drafts witty replies.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
              Simulate Incoming Calls:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onTriggerTestCall('Engineering Lead')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white cursor-pointer transition-all"
              >
                👔 Lead Dev
              </button>
              <button
                onClick={() => onTriggerTestCall('Spam Robocaller')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white cursor-pointer transition-all"
              >
                🚨 Robocall
              </button>
              <button
                onClick={() => onTriggerTestCall('Mom')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white cursor-pointer transition-all"
              >
                ❤️ Mom
              </button>
              <button
                onClick={() => onTriggerTestCall('Sarah (Product)')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white cursor-pointer transition-all"
              >
                ✨ Sarah
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isRinging = call.status === 'ringing';
  const isScreened = call.status === 'screened_by_tung_tung' || call.status === 'screened_by_roxy';
  const isAnswered = call.status === 'answered';
  const isRejected = call.status === 'rejected';

  return (
    <div
      id="incoming-call-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in"
    >
      <div
        className="bg-[#101016] border rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative overflow-hidden"
        style={{
          borderColor: theme.border,
          boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 30px ${theme.glow}`,
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: isRinging ? '#10B981' : isScreened ? '#8B5CF6' : '#EF4444' }}
            />
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
              {isRinging
                ? 'INCOMING CALL • INTERCEPTED'
                : isScreened
                ? 'TUNG TUNG AUTONOMOUS SCREENING'
                : isAnswered
                ? 'CALL CONNECTED'
                : 'CALL TERMINATED'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Caller Avatar & ID Card */}
        <div className="flex flex-col items-center justify-center text-center py-3 space-y-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-xl relative"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: theme.primary,
            }}
          >
            <User className="w-8 h-8 text-white/80" />
            {isRinging && (
              <span className="absolute -inset-1 rounded-full border border-emerald-400 animate-ping opacity-75" />
            )}
          </div>

          <div>
            <h4 className="text-base font-mono font-bold text-white tracking-wide">
              {call.callerName}
            </h4>
            <span className="text-xs font-mono text-white/50">{call.callerNumber}</span>
          </div>
        </div>

        {/* Autonomous Screening Live Dialogue Box */}
        {isScreened && (
          <div className="p-3.5 rounded-2xl bg-violet-950/20 border border-violet-500/30 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-violet-300 uppercase flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-violet-400" /> Live AI Autonomous Transcript
              </span>
              <span className="text-[9px] font-mono text-emerald-400 animate-pulse">● Screening</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-200">
                <strong className="text-[10px] text-violet-400 uppercase block mb-0.5">Tung Tung to Caller:</strong>
                "Hey! I'm Tung Tung, screening calls. My human is in deep focus mode right now. What's this regarding?"
              </div>

              {screeningStep >= 1 && (
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/90 animate-in fade-in">
                  <strong className="text-[10px] text-white/50 uppercase block mb-0.5">Caller Response:</strong>
                  "{call.callerName === 'Spam Robocaller'
                    ? 'Important message regarding your vehicle warranty renewal...'
                    : `Hey, it's ${call.callerName}. Just wanted to check in on the project deliverable status!`}"
                </div>
              )}

              {screeningStep >= 2 && (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 animate-in fade-in flex items-center justify-between">
                  <span className="text-[11px]">
                    {call.callerName === 'Spam Robocaller'
                      ? '⚠️ Detected spam robocall. Recommended: Auto-Reject.'
                      : '✅ Verified contact message captured. Ready to connect or text.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completed Call Status */}
        {isAnswered && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Live Call Connected (Audio Bridge Active)
          </div>
        )}

        {isRejected && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-bold">
              <PhoneOff className="w-4 h-4" /> Call Dismissed
            </div>
            {call.autoRejectionSms && (
              <p className="text-[10px] text-white/60 italic">
                Sent SMS: "{call.autoRejectionSms}"
              </p>
            )}
          </div>
        )}

        {/* Action Button Deck */}
        {isRinging && (
          <div className="space-y-2 pt-2">
            {/* Moon Screen Autonomous Button */}
            <button
              onClick={() => onRoxyScreen(call.id)}
              className="w-full py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" /> Have Moon Screen Autonomously
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAnswer(call.id)}
                className="py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Phone className="w-4 h-4" /> Answer
              </button>
              <button
                onClick={() =>
                  onReject(
                    call.id,
                    "Hey! Can't talk right now, Moon will ping you shortly!"
                  )
                }
                className="py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <PhoneOff className="w-4 h-4" /> Reject + SMS
              </button>
            </div>
          </div>
        )}

        {isScreened && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => onAnswer(call.id)}
              className="py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Phone className="w-4 h-4" /> Take Over Call
            </button>
            <button
              onClick={() =>
                onReject(
                  call.id,
                  "Moon recorded your message! I'll get back to you as soon as I finish this session."
                )
              }
              className="py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-violet-400" /> Send AI Reply & Hang Up
            </button>
          </div>
        )}

        {(isAnswered || isRejected) && (
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            Close Call Overlay
          </button>
        )}
      </div>
    </div>
  );
};
