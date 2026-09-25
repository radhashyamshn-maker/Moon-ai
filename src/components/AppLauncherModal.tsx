import React, { useState } from 'react';
import { AppLauncherItem } from '../types';
import {
  ExternalLink,
  Search,
  X,
  MessageSquare,
  Camera,
  MapPin,
  Music,
  Youtube,
  Settings,
  Clock,
  Calendar,
  Compass,
  Phone,
  Calculator,
  FileText,
  Folder,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  MousePointerClick,
  ScanLine,
  ArrowLeft,
  Home,
  ChevronDown,
  Terminal,
  ShieldCheck,
  Play,
  RotateCcw,
} from 'lucide-react';

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (app: AppLauncherItem) => void;
  apps?: AppLauncherItem[];
}

export const defaultApps: AppLauncherItem[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    category: 'social',
    icon: 'MessageSquare',
    color: '#25D366',
    deepLink: 'https://wa.me/',
    installed: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    category: 'media',
    icon: 'Youtube',
    color: '#FF0000',
    deepLink: 'https://youtube.com',
    installed: true,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    packageName: 'com.spotify.music',
    category: 'media',
    icon: 'Music',
    color: '#1DB954',
    deepLink: 'https://open.spotify.com',
    installed: true,
  },
  {
    id: 'maps',
    name: 'Google Maps',
    packageName: 'com.google.android.apps.maps',
    category: 'utilities',
    icon: 'MapPin',
    color: '#4285F4',
    deepLink: 'https://maps.google.com',
    installed: true,
  },
  {
    id: 'camera',
    name: 'Camera',
    packageName: 'com.android.camera',
    category: 'system',
    icon: 'Camera',
    color: '#8B5CF6',
    deepLink: 'camera://open',
    installed: true,
  },
  {
    id: 'phone',
    name: 'Phone Dialer',
    packageName: 'com.android.dialer',
    category: 'system',
    icon: 'Phone',
    color: '#10B981',
    deepLink: 'tel:',
    installed: true,
  },
  {
    id: 'messages',
    name: 'Messages',
    packageName: 'com.google.android.apps.messaging',
    category: 'social',
    icon: 'MessageSquare',
    color: '#3B82F6',
    deepLink: 'sms:',
    installed: true,
  },
  {
    id: 'clock',
    name: 'Clock & Alarms',
    packageName: 'com.google.android.deskclock',
    category: 'productivity',
    icon: 'Clock',
    color: '#F59E0B',
    deepLink: 'clock://alarms',
    installed: true,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    packageName: 'com.google.android.calendar',
    category: 'productivity',
    icon: 'Calendar',
    color: '#EC4899',
    deepLink: 'https://calendar.google.com',
    installed: true,
  },
  {
    id: 'chrome',
    name: 'Chrome Browser',
    packageName: 'com.android.chrome',
    category: 'utilities',
    icon: 'Compass',
    color: '#EA4335',
    deepLink: 'https://google.com',
    installed: true,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    packageName: 'com.google.android.calculator',
    category: 'utilities',
    icon: 'Calculator',
    color: '#6366F1',
    deepLink: 'calc://',
    installed: true,
  },
  {
    id: 'notes',
    name: 'Notes & Keep',
    packageName: 'com.google.android.keep',
    category: 'productivity',
    icon: 'FileText',
    color: '#FBBF24',
    deepLink: 'https://keep.google.com',
    installed: true,
  },
  {
    id: 'gallery',
    name: 'Photos & Gallery',
    packageName: 'com.google.android.apps.photos',
    category: 'media',
    icon: 'ImageIcon',
    color: '#06B6D4',
    deepLink: 'https://photos.google.com',
    installed: true,
  },
  {
    id: 'files',
    name: 'Files Manager',
    packageName: 'com.google.android.apps.nbu.files',
    category: 'system',
    icon: 'Folder',
    color: '#3B82F6',
    deepLink: 'files://',
    installed: true,
  },
  {
    id: 'settings',
    name: 'Phone Settings',
    packageName: 'com.android.settings',
    category: 'system',
    icon: 'Settings',
    color: '#94A3B8',
    deepLink: 'settings://',
    installed: true,
  },
];

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  isOpen = true,
  onClose,
  onLaunchApp,
  apps = defaultApps,
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'accessibility'>('apps');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [screenReadStatus, setScreenReadStatus] = useState<string | null>(null);
  const [gestureLogs, setGestureLogs] = useState<Array<{ id: string; time: string; action: string; target: string; status: string }>>([
    {
      id: 'log_1',
      time: '16:48:10',
      action: 'Read Screen Hierarchy',
      target: 'WhatsApp Foreground Window (com.whatsapp)',
      status: 'Extracted 14 UI elements, 2 action buttons',
    },
    {
      id: 'log_2',
      time: '16:48:12',
      action: 'Autonomous Tap',
      target: 'Button "Send" at (X: 340, Y: 720)',
      status: 'Touch event dispatched successfully',
    },
  ]);

  if (!isOpen) return null;

  const categories = ['all', 'social', 'media', 'productivity', 'system', 'utilities'];
  const appList = apps && apps.length > 0 ? apps : defaultApps;

  const filteredApps = appList.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSimulateGesture = (actionName: string, targetName: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog = {
      id: `log_${Date.now()}`,
      time: timeStr,
      action: actionName,
      target: targetName,
      status: 'Dispatched via Android Accessibility Service',
    };
    setGestureLogs((prev) => [newLog, ...prev.slice(0, 9)]);
  };

  const handleReadScreen = () => {
    setScreenReadStatus('Scanning active screen view hierarchy and OCR text...');
    setTimeout(() => {
      setScreenReadStatus(
        'Screen Read Complete: Found active chat window. 3 unread messages from "Radha Shyam", input box empty, "Send" button at coordinate (340, 720).'
      );
      handleSimulateGesture('Screen Reader OCR', 'Active Screen Foreground (All elements transcribed)');
    }, 600);
  };

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare':
        return <MessageSquare className="w-6 h-6" />;
      case 'Youtube':
        return <Youtube className="w-6 h-6" />;
      case 'Music':
        return <Music className="w-6 h-6" />;
      case 'MapPin':
        return <MapPin className="w-6 h-6" />;
      case 'Camera':
        return <Camera className="w-6 h-6" />;
      case 'Phone':
        return <Phone className="w-6 h-6" />;
      case 'Clock':
        return <Clock className="w-6 h-6" />;
      case 'Calendar':
        return <Calendar className="w-6 h-6" />;
      case 'Compass':
        return <Compass className="w-6 h-6" />;
      case 'Calculator':
        return <Calculator className="w-6 h-6" />;
      case 'FileText':
        return <FileText className="w-6 h-6" />;
      case 'Folder':
        return <Folder className="w-6 h-6" />;
      case 'ImageIcon':
        return <ImageIcon className="w-6 h-6" />;
      case 'Settings':
      default:
        return <Settings className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="app-launcher-modal"
        className="w-full max-w-xl max-h-[88vh] bg-[#121218]/95 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col font-mono text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              {activeTab === 'apps' ? (
                <Sparkles className="w-5 h-5 text-cyan-400" />
              ) : (
                <ScanLine className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
                <span>{activeTab === 'apps' ? 'App Ecosystem & Matrix' : 'Accessibility Service & UI Automation'}</span>
              </h2>
              <p className="text-[11px] text-white/50">
                {activeTab === 'apps'
                  ? 'Launch apps or ask Moon ("Open WhatsApp", "Launch Camera")'
                  : 'स्क्रीन को पढ़ने, खुद बटन दबाने और ऐप्स को नेविगेट करने के लिए'}
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

        {/* Top Mode Tabs: Apps vs Accessibility */}
        <div className="grid grid-cols-2 gap-2 my-3 p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('apps')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'apps'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Installed Apps ({defaultApps.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'accessibility'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accessibility (एक्सेसिबिलिटी)</span>
          </button>
        </div>

        {/* Tab 1: Apps Matrix */}
        {activeTab === 'apps' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Filter Bar */}
            <div className="py-2 space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search apps or package name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full capitalize whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Apps Grid */}
            <div className="flex-1 overflow-y-auto pr-1 py-2 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => onLaunchApp(app)}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.08] active:scale-[0.97] transition-all flex flex-col items-start text-left group cursor-pointer"
                  >
                    <div className="w-full flex items-center justify-between mb-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: `${app.color}20`,
                          borderColor: `${app.color}50`,
                          borderWidth: 1,
                          color: app.color,
                        }}
                      >
                        {getAppIcon(app.icon)}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-cyan-400 transition-colors" />
                    </div>

                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {app.name}
                    </div>
                    <div className="text-[9px] text-white/40 truncate w-full font-mono mt-0.5">
                      {app.packageName}
                    </div>
                  </button>
                ))}
              </div>

              {filteredApps.length === 0 && (
                <div className="text-center py-10 text-white/40 text-xs">
                  No matching applications found
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 shrink-0">
              <span>{defaultApps.length} Apps registered in OS subsystem</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Voice-Launch Ready
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Accessibility Service & Automation */}
        {activeTab === 'accessibility' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1 custom-scrollbar text-xs">
            {/* Status Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300 text-xs">
                    Accessibility Service: ENABLED & ACTIVE
                  </div>
                  <div className="text-[10px] text-emerald-200/70">
                    स्क्रीन पढ़ने, खुद बटन दबाने और ऐप्स नेविगेट करने की पूरी अनुमति सक्रिय है।
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 shrink-0">
                Live Hook
              </span>
            </div>

            {/* 1. Screen Reader (स्क्रीन को पढ़ना) */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs">
                    1. Screen Reader & Inspector (स्क्रीन को पढ़ना)
                  </span>
                </div>
                <button
                  onClick={handleReadScreen}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>Read Screen Now</span>
                </button>
              </div>

              <p className="text-[11px] text-white/50">
                Moon analyzes foreground window hierarchy, extracts text, and detects buttons automatically.
              </p>

              {screenReadStatus && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px] font-mono animate-in fade-in">
                  {screenReadStatus}
                </div>
              )}

              {/* On-Screen Elements Tree */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] space-y-1 text-white/60">
                <div className="text-white/40 uppercase tracking-wider text-[9px]">
                  Detected Screen Nodes (Active Hierarchy):
                </div>
                <div className="text-emerald-400">➔ [Button] "Send Message" (ID: #btn_send, X: 340, Y: 720)</div>
                <div className="text-cyan-400">➔ [Input] "Type a message..." (ID: #input_msg, X: 110, Y: 720)</div>
                <div className="text-amber-400">➔ [Button] "Confirm Order / Pay" (ID: #btn_pay, X: 220, Y: 540)</div>
                <div className="text-purple-400">➔ [TextView] "Alex: Are we meeting at 5?" (Length: 26 chars)</div>
              </div>
            </div>

            {/* 2. Autonomous Button Tapper & Navigation (खुद बटन दबाना व नेविगेशन) */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs">
                  2. Autonomous Tap & Gesture Simulator (खुद बटन दबाना)
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                Tap buttons directly or dispatch autonomous navigation gestures without touching the screen:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleSimulateGesture('Auto-Tap Button', 'Button "Send" (X: 340, Y: 720)')}
                  className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>Auto-Tap "Send"</span>
                </button>

                <button
                  onClick={() => handleSimulateGesture('Auto-Tap Button', 'Button "Confirm Payment" (X: 220, Y: 540)')}
                  className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>Tap "Confirm"</span>
                </button>

                <button
                  onClick={() => handleSimulateGesture('Navigation Gesture', 'GLOBAL_ACTION_BACK (पीछे जाएं)')}
                  className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back (पीछे)</span>
                </button>

                <button
                  onClick={() => handleSimulateGesture('Navigation Gesture', 'GLOBAL_ACTION_HOME (होम स्क्रीन)')}
                  className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home (होम)</span>
                </button>

                <button
                  onClick={() => handleSimulateGesture('Scroll Gesture', 'Scroll Down 400px (नीचे स्क्रॉल)')}
                  className="p-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Scroll Down</span>
                </button>

                <button
                  onClick={() => handleSimulateGesture('Text Injection', 'Input field #input_msg ➔ "Auto-reply sent by Moon"')}
                  className="p-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Auto-Fill Text</span>
                </button>
              </div>
            </div>

            {/* 3. Dispatched Action Logs */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-violet-400" />
                  <span className="font-bold text-white text-xs">
                    Autonomous Dispatch Logs (लाइव ऑटोमेशन लॉग)
                  </span>
                </div>
                <button
                  onClick={() => setGestureLogs([])}
                  className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                {gestureLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between text-white/50 text-[9px]">
                      <span className="text-emerald-400 font-bold">{log.action}</span>
                      <span>{log.time}</span>
                    </div>
                    <div className="text-white/90 truncate font-semibold">{log.target}</div>
                    <div className="text-white/40 text-[9px]">{log.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
