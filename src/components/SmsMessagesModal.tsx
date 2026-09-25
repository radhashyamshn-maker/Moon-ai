import React, { useState } from 'react';
import { SmsConversation, SmsMessage } from '../types';
import {
  MessageSquare,
  Send,
  Sparkles,
  Check,
  CheckCheck,
  X,
  User,
  Clock,
  ArrowLeft,
  Bot,
} from 'lucide-react';

interface SmsMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: SmsConversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  onAutoReplyWithTungTung: (conversationId: string) => void;
}

export const SmsMessagesModal: React.FC<SmsMessagesModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onSendMessage,
  onAutoReplyWithTungTung,
}) => {
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const activeConvo = conversations.find((c) => c.id === selectedConvoId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvoId) return;
    onSendMessage(selectedConvoId, inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="sms-messaging-hub-modal"
        className="w-full max-w-xl h-[85vh] bg-[#121218]/95 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col font-mono text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {selectedConvoId ? (
              <button
                onClick={() => setSelectedConvoId(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold tracking-wide">
                {activeConvo ? activeConvo.contactName : 'SMS & Direct Messaging'}
              </h2>
              <p className="text-[11px] text-white/50">
                {activeConvo ? activeConvo.phoneNumber : 'AI Autonomous SMS Relay Subsystem'}
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

        {/* Body: Threads or Active Chat */}
        {!activeConvo ? (
          <div className="flex-1 overflow-y-auto py-2 space-y-2 custom-scrollbar">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConvoId(convo.id)}
                className="w-full p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: convo.avatarColor }}
                  >
                    {convo.contactName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        {convo.contactName}
                      </span>
                      {convo.unread && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 truncate font-sans mt-0.5">
                      {convo.lastMessage}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-white/40 shrink-0 ml-2 font-mono">
                  {convo.lastTime}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 pt-2">
            {/* Quick Autonomous Reply Banner */}
            <div className="p-2.5 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-between gap-2 shrink-0 mb-2">
              <div className="flex items-center gap-2 text-[11px] text-violet-300">
                <Bot className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Let Tung Tung draft an intelligent reply</span>
              </div>
              <button
                onClick={() => onAutoReplyWithTungTung(activeConvo.id)}
                className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Draft</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scrollbar">
              {activeConvo.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user'
                      ? 'items-end'
                      : msg.sender === 'tung_tung'
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs font-sans leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : msg.sender === 'tung_tung'
                        ? 'bg-violet-600/90 text-white rounded-br-none border border-violet-400/40 shadow-sm'
                        : 'bg-white/10 text-white/90 rounded-bl-none border border-white/10'
                    }`}
                  >
                    {msg.sender === 'tung_tung' && (
                      <div className="flex items-center gap-1 text-[9px] text-violet-200 font-mono mb-1">
                        <Sparkles className="w-2.5 h-2.5" /> Dispatched via Tung Tung AI
                      </div>
                    )}
                    <p>{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-white/40 mt-1 font-mono px-1">
                    <span>{msg.timestamp}</span>
                    {msg.sender !== 'contact' && (
                      <CheckCheck className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="pt-2 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type SMS message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500/60 font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
