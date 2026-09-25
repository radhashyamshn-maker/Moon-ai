import React, { useState, useEffect } from 'react';
import { AlarmItem } from '../types';
import {
  Clock,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Bell,
  X,
  CheckCircle2,
  Flame,
} from 'lucide-react';

interface AlarmClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarms: AlarmItem[];
  onAddAlarm: (alarm: Omit<AlarmItem, 'id'>) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
}

export const AlarmClockModal: React.FC<AlarmClockModalProps> = ({
  isOpen,
  onClose,
  alarms,
  onAddAlarm,
  onToggleAlarm,
  onDeleteAlarm,
}) => {
  const [activeTab, setActiveTab] = useState<'alarm' | 'timer' | 'stopwatch'>('alarm');

  // New Alarm Input
  const [newTime, setNewTime] = useState('07:30');
  const [newLabel, setNewLabel] = useState('Morning Wake Up');

  // Timer State
  const [timerDurationSeconds, setTimerDurationSeconds] = useState(300); // 5 min
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Stopwatch State
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  // Stopwatch interval
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  if (!isOpen) return null;

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) return;
    onAddAlarm({
      time: newTime,
      label: newLabel || 'Alarm',
      enabled: true,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      type: 'alarm',
    });
    setNewLabel('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="alarm-clock-hub-modal"
        className="w-full max-w-lg max-h-[85vh] bg-[#121218]/95 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col font-mono text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">
                Clock, Alarms & Timers
              </h2>
              <p className="text-[11px] text-white/50">
                Voice managed by Tung Tung ("Set alarm for 7 AM", "Set 5 min timer")
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

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 py-3 border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('alarm')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'alarm'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alarms</span>
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'timer'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Timer</span>
          </button>
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'stopwatch'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Stopwatch</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {activeTab === 'alarm' && (
            <div className="space-y-4">
              {/* Add Alarm Form */}
              <form onSubmit={handleCreateAlarm} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-lg font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Alarm label..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400 font-sans"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Alarms List */}
              <div className="space-y-2">
                {alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      alarm.enabled
                        ? 'bg-white/5 border-amber-500/30'
                        : 'bg-white/[0.02] border-white/10 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
                        <span>{alarm.time}</span>
                        <span className="text-[10px] text-amber-300 font-sans px-2 py-0.5 rounded-full bg-amber-500/20">
                          {alarm.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                        {alarm.days?.join(' · ') || 'Everyday'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleAlarm(alarm.id)}
                        className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                          alarm.enabled ? 'bg-amber-500' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                            alarm.enabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => onDeleteAlarm(alarm.id)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              {/* Countdown Big Display */}
              <div className="w-48 h-48 rounded-full border-4 border-amber-500/30 flex flex-col items-center justify-center bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative">
                <div className="text-4xl font-bold tracking-widest text-amber-300 font-mono">
                  {formatTimer(timerSecondsLeft)}
                </div>
                <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                  {isTimerRunning ? 'Running' : timerSecondsLeft === 0 ? 'Completed!' : 'Ready'}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                {[60, 180, 300, 600, 900].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setTimerDurationSeconds(s);
                      setTimerSecondsLeft(s);
                      setIsTimerRunning(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timerDurationSeconds === s
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    {s < 60 ? `${s}s` : `${s / 60}m`}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${
                    isTimerRunning
                      ? 'bg-amber-600 text-white shadow-amber-600/40'
                      : 'bg-amber-500 text-black shadow-amber-500/40 font-bold'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSecondsLeft(timerDurationSeconds);
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stopwatch' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-5">
              <div className="text-4xl font-bold tracking-widest text-cyan-300 font-mono">
                {formatStopwatch(stopwatchTime)}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${
                    isStopwatchRunning
                      ? 'bg-cyan-600 text-white shadow-cyan-600/40'
                      : 'bg-cyan-500 text-black shadow-cyan-500/40'
                  }`}
                >
                  {isStopwatchRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => {
                    if (isStopwatchRunning) {
                      setLaps([stopwatchTime, ...laps]);
                    } else {
                      setStopwatchTime(0);
                      setLaps([]);
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs font-bold"
                >
                  {isStopwatchRunning ? 'Lap' : <RotateCcw className="w-4 h-4" />}
                </button>
              </div>

              {/* Laps */}
              {laps.length > 0 && (
                <div className="w-full max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {laps.map((lap, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs font-mono"
                    >
                      <span className="text-white/50">Lap {laps.length - i}</span>
                      <span className="text-cyan-300 font-bold">{formatStopwatch(lap)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
