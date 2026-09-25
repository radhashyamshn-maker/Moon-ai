import React from 'react';
import {
  X,
  Sparkles,
  Eye,
  PhoneCall,
  Music,
  Cpu,
  MessageSquare,
  Calendar,
  ShieldCheck,
  LayoutGrid,
  Clock,
  Heart,
} from 'lucide-react';

interface PromptsDrawerProps {
  onClose: () => void;
}

const PROMPT_CATEGORIES = [
  {
    title: 'Phone OS Controls & System Settings',
    icon: <Cpu className="w-3.5 h-3.5 text-blue-400" />,
    items: [
      '"Turn on flashlight and enable Wi-Fi"',
      '"Set Do Not Disturb mode on"',
      '"Increase media volume to 80%"',
      '"Check battery power and enable battery saver"',
      '"Turn on GPS location"',
    ],
  },
  {
    title: 'App Ecosystem & Launching',
    icon: <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />,
    items: [
      '"Open WhatsApp and launch chat"',
      '"Launch Camera and take a shot"',
      '"Open Google Maps for navigation"',
      '"Launch Spotify and play chill tracks"',
      '"Open Calculator for quick math"',
    ],
  },
  {
    title: 'Alarms, Timers & Clock',
    icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    items: [
      '"Set an alarm for 7:30 AM tomorrow"',
      '"Start a 5 minute pasta timer"',
      '"Set a reminder for gym workout at 7 PM"',
    ],
  },
  {
    title: 'SMS & Direct Messaging',
    icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
    items: [
      '"Send an SMS to Alex saying I will arrive in 10 minutes"',
      '"Check all unread SMS text messages"',
      '"Draft an auto-reply for incoming messages"',
    ],
  },
  {
    title: 'Autonomous Call Screening & Phone',
    icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />,
    items: [
      '"Moon, screen this incoming call for me!"',
      '"Reject the call and send a witty SMS reply."',
      '"Call Sarah on speaker phone."',
    ],
  },
  {
    title: 'Screen Vision & Multimodal Observation',
    icon: <Eye className="w-3.5 h-3.5 text-cyan-400" />,
    items: [
      '"Moon, look at my screen and tell me what you see!"',
      '"Can you inspect this code error on my display?"',
      '"What do you think of this design layout on my screen?"',
    ],
  },
  {
    title: 'Permissions & Security Authorities',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />,
    items: [
      '"Check my active phone permissions"',
      '"Grant all phone permissions for autonomous execution"',
      '"Open Settings and configure Gemini API"',
      '"Show phone permissions hub"',
    ],
  },
  {
    title: 'Flirty & Sassy Banter',
    icon: <Heart className="w-3.5 h-3.5 text-rose-400" />,
    items: [
      '"Are you always this sassy, or am I just special?"',
      '"What is your idea of a fun weekend date?"',
      '"Tell me a bold one-liner about my coding skills."',
    ],
  },
];

export const PromptsDrawer: React.FC<PromptsDrawerProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121216] border border-white/15 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar font-mono text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Things to Say to Moon
              </h3>
              <span className="text-[10px] text-white/40">
                Full phone OS control, voice commands, vision, hardware & apps
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {PROMPT_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wider">
                {cat.icon}
                <span>{cat.title}</span>
              </div>
              <div className="space-y-1.5">
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 hover:text-white hover:border-white/20 transition-all flex items-center justify-between font-sans"
                  >
                    <span>{item}</span>
                    <span className="text-[9px] font-mono text-white/30 uppercase shrink-0 ml-2">Voice</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-[10px] text-violet-300 text-center leading-relaxed font-sans">
          ✨ Speak naturally in English or Hindi/Hinglish. Moon answers with real-time audio and executes device controls, alarms, SMS, calls, apps, and vision with full permission gating.
        </div>
      </div>
    </div>
  );
};
