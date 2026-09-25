import React, { useState } from 'react';
import { CalendarEvent, ThemeConfig } from '../types';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2, Trash2, X, Sparkles } from 'lucide-react';

interface CalendarModalProps {
  events: CalendarEvent[];
  theme: ThemeConfig;
  onAddEvent: (title: string, time: string, category: CalendarEvent['category']) => void;
  onToggleComplete: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  events,
  theme,
  onAddEvent,
  onToggleComplete,
  onDeleteEvent,
  onClose,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState<CalendarEvent['category']>('work');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddEvent(newTitle.trim(), newTime || 'Today 4:00 PM', newCategory);
    setNewTitle('');
    setNewTime('');
  };

  return (
    <div
      id="calendar-modal"
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
            <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Calendar & Smart Planner
              </h3>
              <span className="text-[10px] font-mono text-white/40">
                Tung Tung schedules reminders & tracks daily agenda via voice
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

        {/* Quick Add Form */}
        <form onSubmit={handleSubmit} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
            Add New Event / Reminder:
          </span>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="e.g. Design review with Alex, Gym workout..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-violet-400"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Time (e.g. Tomorrow 3:00 PM)"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-violet-400"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none cursor-pointer"
              >
                <option value="work">💼 Work</option>
                <option value="personal">✨ Personal</option>
                <option value="date">❤️ Date</option>
                <option value="gym">⚡ Gym</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Event
          </button>
        </form>

        {/* Event List */}
        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-xs font-mono text-white/40 text-center py-4">
              No events scheduled. Say "Tung Tung add meeting tomorrow at 3 PM" anytime!
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  event.completed
                    ? 'bg-white/2 border-white/5 opacity-50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => onToggleComplete(event.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                      event.completed
                        ? 'bg-emerald-500 border-emerald-500 text-black'
                        : 'border-white/30 hover:border-white'
                    }`}
                  >
                    {event.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <span
                      className={`text-xs font-mono font-bold block truncate text-white ${
                        event.completed ? 'line-through text-white/40' : ''
                      }`}
                    >
                      {event.title}
                    </span>
                    <span className="text-[10px] font-mono text-white/50 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-violet-400" /> {event.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                      event.category === 'work'
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : event.category === 'date'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : event.category === 'gym'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-violet-500/10 text-violet-300 border-violet-500/30'
                    }`}
                  >
                    {event.category}
                  </span>
                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className="p-1 rounded-lg text-white/30 hover:text-rose-400 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
