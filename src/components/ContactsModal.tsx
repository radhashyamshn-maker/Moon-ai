import React, { useState } from 'react';
import { ContactItem, ThemeConfig } from '../types';
import { Users, Phone, MessageSquare, Send, Search, Star, X, Sparkles } from 'lucide-react';

interface ContactsModalProps {
  contacts: ContactItem[];
  theme: ThemeConfig;
  onCallContact: (contact: ContactItem) => void;
  onWhatsAppContact: (contact: ContactItem, customMsg?: string) => void;
  onClose: () => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  contacts,
  theme,
  onCallContact,
  onWhatsAppContact,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactForMsg, setSelectedContactForMsg] = useState<ContactItem | null>(null);
  const [draftMessage, setDraftMessage] = useState('');

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendCustomMsg = () => {
    if (!selectedContactForMsg) return;
    onWhatsAppContact(selectedContactForMsg, draftMessage || 'Hey! Tung Tung sent this for me ✨');
    setSelectedContactForMsg(null);
    setDraftMessage('');
  };

  return (
    <div
      id="contacts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        className="bg-[#121217] border rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        style={{
          borderColor: theme.border,
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 25px ${theme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Contacts & Direct Dispatch
              </h3>
              <span className="text-[10px] font-mono text-white/40">
                Direct WhatsApp, Phone Calls & AI Voice Dispatch
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contacts by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Custom Message Composer Drawer */}
        {selectedContactForMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-emerald-300">
                Message to {selectedContactForMsg.name}
              </span>
              <button
                onClick={() => setSelectedContactForMsg(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="Type message or click send for Tung Tung's auto-draft..."
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={handleSendCustomMsg}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" /> Launch WhatsApp Web
            </button>
          </div>
        )}

        {/* Contact List */}
        <div className="space-y-2">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-white text-sm shrink-0 border border-white/10"
                  style={{ backgroundColor: contact.avatarColor }}
                >
                  {contact.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs font-mono font-bold text-white truncate">
                      {contact.name}
                    </h5>
                    {contact.favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </div>
                  <span className="text-[10px] font-mono text-white/50 block truncate">
                    {contact.role} • {contact.phone}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setSelectedContactForMsg(contact)}
                  title="WhatsApp Message"
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-pointer transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onCallContact(contact)}
                  title="Call Contact"
                  className="p-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 cursor-pointer transition-all"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
