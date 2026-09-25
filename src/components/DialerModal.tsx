import React, { useState } from 'react';
import { ContactItem, IncomingCall } from '../types';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  Delete,
  Clock,
  Sparkles,
  Shield,
  X,
  Volume2,
  Mic,
  MicOff,
} from 'lucide-react';

interface DialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactItem[];
  callLogs: IncomingCall[];
  onInitiateCall: (numberOrContact: string) => void;
  onSimulateIncomingCall: () => void;
}

export const DialerModal: React.FC<DialerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  callLogs,
  onInitiateCall,
  onSimulateIncomingCall,
}) => {
  const [dialedNumber, setDialedNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'keypad' | 'recent' | 'contacts'>('keypad');

  if (!isOpen) return null;

  const keypadNumbers = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '*', sub: '' },
    { num: '0', sub: '+' },
    { num: '#', sub: '' },
  ];

  const handleKeyPress = (char: string) => {
    if (dialedNumber.length < 15) {
      setDialedNumber((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = (num?: string) => {
    const target = num || dialedNumber;
    if (!target) return;
    onInitiateCall(target);
    setDialedNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="phone-dialer-call-modal"
        className="w-full max-w-sm max-h-[85vh] bg-[#121218]/95 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col font-mono text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Phone & Dialer</h2>
              <p className="text-[10px] text-white/50">Autonomous call routing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 py-2.5 border-b border-white/10 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('keypad')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'keypad'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            Keypad
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'recent'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            Contacts
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {activeTab === 'keypad' && (
            <div className="flex flex-col items-center space-y-3">
              {/* Dialed Display */}
              <div className="w-full h-12 flex items-center justify-center relative px-4">
                <span className="text-2xl font-bold tracking-widest text-emerald-300 truncate">
                  {dialedNumber || ' '}
                </span>
                {dialedNumber && (
                  <button
                    onClick={handleDelete}
                    className="absolute right-2 p-1.5 rounded-lg text-white/40 hover:text-white cursor-pointer"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Number Buttons */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
                {keypadNumbers.map((k) => (
                  <button
                    key={k.num}
                    onClick={() => handleKeyPress(k.num)}
                    className="h-13 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 flex flex-col items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="text-lg font-bold text-white leading-tight">{k.num}</span>
                    {k.sub && <span className="text-[8px] text-white/40 font-mono tracking-widest">{k.sub}</span>}
                  </button>
                ))}
              </div>

              {/* Call Trigger Button */}
              <div className="pt-1 flex items-center gap-3 w-full justify-center">
                <button
                  onClick={() => handleCall()}
                  disabled={!dialedNumber}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Phone className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-white/40 uppercase">Call History</span>
                <button
                  onClick={onSimulateIncomingCall}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Simulate Incoming
                </button>
              </div>

              {callLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{log.callerName}</div>
                    <div className="text-[10px] text-white/40 font-mono">{log.callerNumber}</div>
                    {log.status.includes('screened') && (
                      <span className="text-[9px] text-violet-300 bg-violet-500/20 px-1.5 py-0.2 rounded mt-1 inline-block">
                        Screened by Tung Tung
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCall(log.callerNumber)}
                    className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: c.avatarColor }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-white/40">{c.role} · {c.phone}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCall(c.phone)}
                    className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
