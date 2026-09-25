import React, { useState, useEffect } from 'react';
import { VoiceOption, PermissionDefinition, WakeWordConfig, BiometricAuthConfig } from '../types';
import { biometricAuthInstance } from '../services/BiometricAuthService';
import { getPermissionRouteInfo } from '../services/permissionRouting';
import {
  X,
  Key,
  ShieldCheck,
  Volume2,
  Check,
  Sliders,
  Sparkles,
  Server,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Mic,
  PhoneCall,
  MessageSquare,
  Bell,
  Users,
  Navigation,
  LayoutGrid,
  Radio,
  ExternalLink,
  Shield,
  ShieldAlert,
  Ear,
  Plus,
  Trash2,
  Play,
  Fingerprint,
  Lock,
  Unlock,
  KeyRound,
  ArrowUpRight,
} from 'lucide-react';

interface SettingsModalProps {
  currentVoice: string;
  onSelectVoice: (voiceId: string) => void;
  permissions: PermissionDefinition[];
  onTogglePermission: (key: string, granted: boolean) => void;
  onGrantAllPermissions: () => void;
  onResetPermissions: () => void;
  onClose: () => void;
  onRedirectToFeature?: (key: string) => void;
  initialTab?: 'api' | 'permissions' | 'biometrics' | 'voice' | 'wakeword';
  wakeWordConfig?: WakeWordConfig;
  onUpdateWakeWordConfig?: (partial: Partial<WakeWordConfig>) => void;
  isWakeWordListening?: boolean;
  isWakeWordSupported?: boolean;
  onPlayTestChime?: () => void;
}

const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Aoede',
    name: 'Aoede (Default)',
    tone: 'Sassy, Confident & Witty',
    description: 'Youthful, flirtatious, clear, and expressive female voice.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    tone: 'Playful & Warm',
    description: 'Energetic, charming, and casual modern cadence.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    tone: 'Breezy & Sophisticated',
    description: 'Fast-paced, witty, and smooth banter profile.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    tone: 'Bold & Cheeky',
    description: 'Edgy, cheeky, and high-energy personality style.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    tone: 'Deep & Composed',
    description: 'Calm, authoritative, and analytical executive tone.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    tone: 'Dynamic & Crisp',
    description: 'Sharp, modern, and rapid conversational delivery.',
  },
];

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tag: 'Recommended • Live Voice & Vision',
    description: 'Latest flagship multimodal model with ultra-fast latency, thinking capabilities, and phone tool execution.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    tag: 'Ultra-Fast Streaming',
    description: 'High-speed conversational audio engine for rapid voice turns.',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    tag: 'Deep Reasoning',
    description: 'Complex problem-solving and long-context multimodal analysis.',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentVoice,
  onSelectVoice,
  permissions,
  onTogglePermission,
  onGrantAllPermissions,
  onResetPermissions,
  onClose,
  onRedirectToFeature,
  initialTab = 'api',
  wakeWordConfig,
  onUpdateWakeWordConfig,
  isWakeWordListening = false,
  isWakeWordSupported = true,
  onPlayTestChime,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'permissions' | 'voice' | 'wakeword'>(initialTab);
  const [customWakeInput, setCustomWakeInput] = useState('');

  // API Setup State
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.7-flash');
  const [apiTestStatus, setApiTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ loading: false });

  // Biometrics & Security State
  const [biometricConfig, setBiometricConfig] = useState<BiometricAuthConfig>(biometricAuthInstance.getConfig());
  const [isPlatformBiometricSupported, setIsPlatformBiometricSupported] = useState<boolean>(false);
  const [isEnrollingBiometric, setIsEnrollingBiometric] = useState<boolean>(false);
  const [biometricActionMessage, setBiometricActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);

  const [hasSavedCustomKey, setHasSavedCustomKey] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<{
    connected: boolean;
    hasServerKey: boolean;
    model: string;
  }>({
    connected: true,
    hasServerKey: true,
    model: 'gemini-3.7-flash',
  });

  // Load custom key from localStorage and check WebAuthn
  useEffect(() => {
    biometricAuthInstance.checkPlatformSupport().then((supported) => {
      setIsPlatformBiometricSupported(supported);
    });
    setBiometricConfig(biometricAuthInstance.getConfig());
    try {
      const savedKey = localStorage.getItem('MOON_CUSTOM_API_KEY') || localStorage.getItem('TUNG_TUNG_CUSTOM_API_KEY');
      if (savedKey) {
        setCustomApiKey(savedKey);
        setHasSavedCustomKey(true);
      }
      const savedModel = localStorage.getItem('MOON_SELECTED_MODEL') || localStorage.getItem('TUNG_TUNG_SELECTED_MODEL');
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    } catch {
      // ignore localStorage errors
    }

    // Ping health endpoint
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerStatus({
          connected: data.status === 'ok',
          hasServerKey: Boolean(data.hasApiKey),
          model: data.model || 'gemini-3.7-flash',
        });
      })
      .catch(() => {
        setServerStatus((prev) => ({ ...prev, connected: false }));
      });
  }, []);

  const handleSaveApiKey = () => {
    try {
      if (customApiKey.trim()) {
        localStorage.setItem('MOON_CUSTOM_API_KEY', customApiKey.trim());
        setHasSavedCustomKey(true);
      } else {
        localStorage.removeItem('MOON_CUSTOM_API_KEY');
        localStorage.removeItem('TUNG_TUNG_CUSTOM_API_KEY');
        setHasSavedCustomKey(false);
      }
    } catch {
      // ignore
    }
  };

  const handleClearApiKey = () => {
    setCustomApiKey('');
    try {
      localStorage.removeItem('MOON_CUSTOM_API_KEY');
      localStorage.removeItem('TUNG_TUNG_CUSTOM_API_KEY');
      setHasSavedCustomKey(false);
    } catch {
      // ignore
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    try {
      localStorage.setItem('MOON_SELECTED_MODEL', modelId);
    } catch {
      // ignore
    }
  };

  const handleTestConnection = async () => {
    setApiTestStatus({ loading: true });
    const startTime = Date.now();

    try {
      const response = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: customApiKey.trim() || undefined,
          model: selectedModel,
        }),
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        setApiTestStatus({
          loading: false,
          success: true,
          message: data.message || 'API connection verified and ready!',
          latencyMs,
        });
      } else {
        setApiTestStatus({
          loading: false,
          success: false,
          message: data.error || 'Connection failed. Please check API Key.',
          latencyMs,
        });
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      setApiTestStatus({
        loading: false,
        success: false,
        message: err?.message || 'Server request error.',
        latencyMs,
      });
    }
  };

  const grantedCount = permissions.filter((p) => p.granted).length;
  const totalCount = permissions.length;

  const getPermissionIcon = (key: string) => {
    switch (key) {
      case 'microphone':
        return <Mic className="w-4 h-4 text-emerald-400" />;
      case 'camera_screen':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      case 'phone_calls':
        return <PhoneCall className="w-4 h-4 text-purple-400" />;
      case 'sms_messaging':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'notifications':
        return <Bell className="w-4 h-4 text-amber-400" />;
      case 'contacts':
        return <Users className="w-4 h-4 text-pink-400" />;
      case 'device_settings':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'location':
        return <Navigation className="w-4 h-4 text-emerald-400" />;
      case 'accessibility':
        return <LayoutGrid className="w-4 h-4 text-orange-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div
      id="moon-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-[#111116] border border-white/15 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl relative max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Settings & Configuration
              </h2>
              <span className="text-[11px] font-mono text-white/50">
                Moon AI Phone Executive Control Center
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/30 px-3 pt-2 gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {/* Tab 1: API Setup (First) */}
          <button
            id="tab-api-setup"
            onClick={() => setActiveTab('api')}
            className={`px-3.5 py-2 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'api'
                ? 'bg-[#181820] text-violet-300 border-violet-500 shadow-sm'
                : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-violet-400" />
            <span>1. API Setup</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Tab 2: System Permissions */}
          <button
            id="tab-permissions"
            onClick={() => setActiveTab('permissions')}
            className={`px-3.5 py-2 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-[#181820] text-violet-300 border-violet-500 shadow-sm'
                : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Permissions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
              {grantedCount}/{totalCount}
            </span>
          </button>

          {/* Tab 3: Biometrics & Security */}
          <button
            id="tab-biometrics"
            onClick={() => setActiveTab('biometrics')}
            className={`px-3.5 py-2 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'biometrics'
                ? 'bg-[#181820] text-cyan-300 border-cyan-500 shadow-sm'
                : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. Biometrics</span>
            {biometricConfig.enabledOnLaunch && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>

          {/* Tab 4: Voice & Persona */}
          <button
            id="tab-voice"
            onClick={() => setActiveTab('voice')}
            className={`px-3.5 py-2 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-[#181820] text-violet-300 border-violet-500 shadow-sm'
                : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            <span>4. Voice Profile</span>
          </button>

          {/* Tab 5: Wake Word Hands-Free */}
          <button
            id="tab-wakeword"
            onClick={() => setActiveTab('wakeword')}
            className={`px-3.5 py-2 rounded-t-xl font-mono text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'wakeword'
                ? 'bg-[#181820] text-pink-300 border-pink-500 shadow-sm'
                : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Ear className="w-3.5 h-3.5 text-pink-400" />
            <span>5. Wake Word</span>
            {wakeWordConfig?.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* ======================================================== */}
          {/* TAB 1: API SETUP & CONNECTION                            */}
          {/* ======================================================== */}
          {activeTab === 'api' && (
            <div className="space-y-4 font-mono animate-in fade-in">
              {/* Server & Live Gateway Status Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-black border border-violet-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                    <Server className="w-4 h-4 text-violet-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Gemini Live Gateway</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        ONLINE
                      </span>
                    </div>
                    <span className="text-[10px] text-white/50 block mt-0.5">
                      WebSocket Endpoint: <code className="text-violet-300">/live-ws</code> (16kHz PCM In / 24kHz Out)
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={apiTestStatus.loading}
                  className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${apiTestStatus.loading ? 'animate-spin' : ''}`} />
                  <span>{apiTestStatus.loading ? 'Testing...' : 'Ping Test'}</span>
                </button>
              </div>

              {/* API Key Configuration Section */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Gemini API Key Setup
                  </label>
                  <span className="text-[10px] text-white/40">
                    {hasSavedCustomKey ? 'Custom Key Active' : 'Default Server Key Active'}
                  </span>
                </div>

                <p className="text-[11px] text-white/60 leading-relaxed">
                  The backend automatically uses the cloud environment&apos;s secured{' '}
                  <code className="text-violet-300">GEMINI_API_KEY</code>. You can also provide a custom Gemini API Key below for private usage.
                </p>

                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key (AIzaSy...)"
                    className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs font-mono focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 cursor-pointer"
                      title={showApiKey ? 'Hide Key' : 'Show Key'}
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveApiKey}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Key</span>
                  </button>

                  {customApiKey && (
                    <button
                      onClick={handleClearApiKey}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs transition-all cursor-pointer"
                    >
                      Clear / Reset to Server
                    </button>
                  )}

                  <button
                    onClick={handleTestConnection}
                    disabled={apiTestStatus.loading}
                    className="ml-auto px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Test Key & Stream</span>
                  </button>
                </div>

                {/* API Test Result Feedback Box */}
                {apiTestStatus.message && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                      apiTestStatus.success
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    {apiTestStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-bold">
                        <span>{apiTestStatus.success ? 'API Check Succeeded' : 'API Connection Error'}</span>
                        {apiTestStatus.latencyMs !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-normal">
                            {apiTestStatus.latencyMs}ms latency
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-85 leading-relaxed">{apiTestStatus.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Model Selection Deck */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Select Model Architecture
                </label>

                <div className="space-y-2">
                  {AVAILABLE_MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleSelectModel(model.id)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-500/15 border-violet-500/50 shadow-lg shadow-violet-900/20'
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{model.name}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                              {model.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed">{model.description}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-violet-400 shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Streaming Pipeline Specs */}
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                  Audio & Vision Streaming Pipeline
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white/5 flex flex-col gap-0.5">
                    <span className="text-white/40 text-[9px]">MICROPHONE PCM</span>
                    <span className="text-emerald-400 font-bold">16.0 kHz Mono</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 flex flex-col gap-0.5">
                    <span className="text-white/40 text-[9px]">VOICE PLAYBACK</span>
                    <span className="text-violet-400 font-bold">24.0 kHz Stereo</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 flex flex-col gap-0.5">
                    <span className="text-white/40 text-[9px]">FRAME VISION</span>
                    <span className="text-cyan-400 font-bold">JPEG Base64</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SYSTEM PERMISSIONS & GRANTS                       */}
          {/* ======================================================== */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 font-mono animate-in fade-in">
              {/* Permission Master Control Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-black border border-emerald-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      OS Phone Permissions Hub
                    </h3>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      Grant Moon authorization to execute phone controls, dial calls, and automate tasks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="grant-all-permissions-btn"
                      onClick={onGrantAllPermissions}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Grant All ({totalCount})</span>
                    </button>
                    <button
                      onClick={onResetPermissions}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/60 font-bold">
                    <span>Active Authorizations</span>
                    <span className="text-emerald-400">{grantedCount} / {totalCount} Granted</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                      style={{ width: `${(grantedCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Permission List Items */}
              <div className="space-y-2.5">
                {permissions.map((perm) => {
                  const route = getPermissionRouteInfo(perm.key);
                  return (
                    <div
                      key={perm.key}
                      id={`perm-card-${perm.key}`}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        perm.granted
                          ? 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-white/5 border-white/5 hover:border-white/15 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                            perm.granted
                              ? 'bg-emerald-500/20 border-emerald-500/40'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          {getPermissionIcon(perm.key)}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{perm.title}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              {route.featureBadge}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
                                perm.dangerLevel === 'high'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : perm.dangerLevel === 'medium'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {perm.category}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                perm.granted
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {perm.granted ? 'GRANTED' : 'DENIED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed font-sans">{perm.description}</p>
                        </div>
                      </div>

                      {/* Action buttons & Toggle */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                        {onRedirectToFeature && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!perm.granted) {
                                onTogglePermission(perm.key, true);
                              }
                              onRedirectToFeature(perm.key);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              perm.granted
                                ? 'bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                            }`}
                            title={
                              perm.granted
                                ? `Open ${route.featureTitle}`
                                : `Grant and redirect to ${route.featureTitle}`
                            }
                          >
                            <span>{perm.granted ? `Open ${route.featureBadge}` : 'Grant & Open'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={perm.granted}
                          onClick={() => onTogglePermission(perm.key, !perm.granted)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            perm.granted ? 'bg-emerald-500' : 'bg-white/20'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
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
          )}

          {/* ======================================================== */}
          {/* TAB 3: BIOMETRIC AUTHENTICATION & WEBAUTHN               */}
          {/* ======================================================== */}
          {activeTab === 'biometrics' && (
            <div className="space-y-4 font-mono animate-in fade-in">
              {/* Hardware Security Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-black border border-cyan-500/30 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Fingerprint className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        Web Authentication API (FIDO2)
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          isPlatformBiometricSupported
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPlatformBiometricSupported ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                          }`}
                        />
                        {isPlatformBiometricSupported ? 'HARDWARE DETECTED' : 'PIN EMULATION READY'}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      Secures assistant launch, sensitive dialer calls, SMS logs, contacts, and phone hardware switches using Touch ID, Face ID, Windows Hello, or Android Biometrics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Message Alert */}
              {biometricActionMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    biometricActionMessage.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/30 text-red-300'
                  }`}
                >
                  {biometricActionMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{biometricActionMessage.text}</span>
                </div>
              )}

              {/* Toggles Group */}
              <div className="space-y-2.5">
                {/* Toggle 1: Lock on App Launch */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-violet-300" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Lock on App Launch</span>
                      <span className="text-[11px] text-white/50 block mt-0.5">
                        Require biometric / PIN verification when opening Moon Assistant.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={biometricConfig.enabledOnLaunch}
                    onClick={() => {
                      const updated = biometricAuthInstance.saveConfig({
                        enabledOnLaunch: !biometricConfig.enabledOnLaunch,
                      });
                      setBiometricConfig(updated);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      biometricConfig.enabledOnLaunch ? 'bg-cyan-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        biometricConfig.enabledOnLaunch ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Guard Sensitive Phone Controls */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-pink-300" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Guard Sensitive Phone Controls</span>
                      <span className="text-[11px] text-white/50 block mt-0.5">
                        Prompt biometric verification for SMS, Contacts, Calls, and Hardware.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={biometricConfig.protectSensitiveControls}
                    onClick={() => {
                      const updated = biometricAuthInstance.saveConfig({
                        protectSensitiveControls: !biometricConfig.protectSensitiveControls,
                      });
                      setBiometricConfig(updated);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      biometricConfig.protectSensitiveControls ? 'bg-pink-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        biometricConfig.protectSensitiveControls ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Passkey Enrollment & Testing Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Biometric Passkey Credential</span>
                  </div>
                  <span className="text-[10px] text-white/40">
                    {biometricConfig.hasRegisteredPasskey
                      ? `Enrolled ${biometricConfig.registeredDate || ''}`
                      : 'Not Enrolled'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    id="btn-register-passkey"
                    onClick={async () => {
                      setIsEnrollingBiometric(true);
                      setBiometricActionMessage(null);
                      const res = await biometricAuthInstance.registerBiometrics();
                      setIsEnrollingBiometric(false);
                      if (res.success) {
                        setBiometricConfig(biometricAuthInstance.getConfig());
                        setBiometricActionMessage({
                          text: 'Biometric passkey enrolled successfully!',
                          type: 'success',
                        });
                      } else {
                        setBiometricActionMessage({
                          text: res.error || 'Enrollment failed.',
                          type: 'error',
                        });
                      }
                    }}
                    disabled={isEnrollingBiometric}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-950/40"
                  >
                    {isEnrollingBiometric ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Prompting Sensor...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span>{biometricConfig.hasRegisteredPasskey ? 'Re-enroll Biometric Passkey' : 'Enroll Biometric Passkey'}</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-test-biometric"
                    onClick={async () => {
                      setBiometricActionMessage(null);
                      const res = await biometricAuthInstance.authenticateBiometric();
                      if (res.success) {
                        setBiometricActionMessage({
                          text: 'Biometric scan verified successfully!',
                          type: 'success',
                        });
                      } else {
                        setBiometricActionMessage({
                          text: res.error || 'Biometric scan failed or cancelled.',
                          type: 'error',
                        });
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Scan</span>
                  </button>
                </div>
              </div>

              {/* Master Security PIN Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold text-white">Backup Security PIN</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsChangingPin(!isChangingPin);
                      setPinChangeError(null);
                    }}
                    className="text-xs text-pink-300 hover:text-pink-200 underline cursor-pointer"
                  >
                    {isChangingPin ? 'Cancel' : 'Change PIN'}
                  </button>
                </div>

                {!isChangingPin ? (
                  <div className="text-[11px] text-white/50 flex items-center justify-between">
                    <span>Active PIN Code: <strong className="text-white font-mono">•••• (4 Digits)</strong></span>
                    <span className="text-[10px] text-white/30">Default: 1234</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">Current PIN</label>
                        <input
                          type="password"
                          maxLength={6}
                          value={currentPinInput}
                          onChange={(e) => setCurrentPinInput(e.target.value)}
                          placeholder="Current PIN"
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">New 4-Digit PIN</label>
                        <input
                          type="password"
                          maxLength={6}
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          placeholder="New PIN"
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    {pinChangeError && (
                      <span className="text-[11px] text-red-400 block">{pinChangeError}</span>
                    )}

                    <button
                      onClick={() => {
                        const res = biometricAuthInstance.updatePin(currentPinInput, newPinInput);
                        if (res.success) {
                          setBiometricConfig(biometricAuthInstance.getConfig());
                          setIsChangingPin(false);
                          setCurrentPinInput('');
                          setNewPinInput('');
                          setBiometricActionMessage({
                            text: 'Security PIN updated successfully!',
                            type: 'success',
                          });
                        } else {
                          setPinChangeError(res.error || 'Failed to update PIN.');
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Save New Security PIN
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: VOICE & PERSONA                                   */}
          {/* ======================================================== */}
          {activeTab === 'voice' && (
            <div className="space-y-4 font-mono animate-in fade-in">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-violet-400" /> Voice Timbre & Accent
                </label>

                <div className="space-y-2">
                  {AVAILABLE_VOICES.map((v) => {
                    const isSelected = v.id === currentVoice;
                    return (
                      <button
                        key={v.id}
                        onClick={() => onSelectVoice(v.id)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-500/15 border-violet-500/50 shadow-md'
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{v.name}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                              {v.tone}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed">{v.description}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-violet-400 shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Function Tools summary */}
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-1.5 text-[11px] text-white/70">
                <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" /> Autonomous Function Capabilities
                </div>
                <ul className="list-disc list-inside space-y-1 text-white/60 text-[10px]">
                  <li><strong className="text-white/80">Telephony:</strong> Screening calls, dialing contacts, SMS auto-replies</li>
                  <li><strong className="text-white/80">Hardware:</strong> Flashlight, vibration, volume, Wi-Fi, Bluetooth, DND</li>
                  <li><strong className="text-white/80">App Matrix:</strong> Launching WhatsApp, YouTube, Maps, Spotify, Clock</li>
                  <li><strong className="text-white/80">Multimodal:</strong> Visual screen inspection and UI automation</li>
                </ul>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: WAKE WORD & HANDS-FREE ACTIVATION                 */}
          {/* ======================================================== */}
          {activeTab === 'wakeword' && wakeWordConfig && onUpdateWakeWordConfig && (
            <div className="space-y-4 font-mono animate-in fade-in">
              {/* Master Hands-Free Toggle */}
              <div
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  wakeWordConfig.enabled
                    ? 'bg-gradient-to-r from-pink-950/40 via-violet-950/30 to-black border-pink-500/40'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Hands-Free Wake Word</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                        wakeWordConfig.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          wakeWordConfig.enabled && isWakeWordListening
                            ? 'bg-emerald-400 animate-ping'
                            : 'bg-white/40'
                        }`}
                      />
                      {wakeWordConfig.enabled ? (isWakeWordListening ? 'Listening' : 'Enabled') : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Say &ldquo;{wakeWordConfig.activeWakeWord}&rdquo; at any time to wake Moon without touching the screen.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={wakeWordConfig.enabled}
                  onClick={() => onUpdateWakeWordConfig({ enabled: !wakeWordConfig.enabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    wakeWordConfig.enabled ? 'bg-pink-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      wakeWordConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {!isWakeWordSupported && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Background voice wake recognition is supported on modern WebKit/Chromium browsers.
                  </p>
                </div>
              )}

              {/* Preset Wake Words */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Choose Primary Wake Word
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { phrase: 'Hey Moon', label: 'Hey Moon', tag: 'Default • English' },
                    { phrase: 'Moon', label: 'Moon', tag: 'Single Word' },
                    { phrase: 'Ok Moon', label: 'Ok Moon', tag: 'Conversational' },
                    { phrase: 'Konnichiwa Moon', label: 'Konnichiwa Moon', tag: 'Japanese' },
                    { phrase: 'Suno Moon', label: 'Suno Moon', tag: 'Hinglish / Hindi' },
                    { phrase: 'Namaste Moon', label: 'Namaste Moon', tag: 'Hindi' },
                    { phrase: 'Hi Moon', label: 'Hi Moon', tag: 'Casual' },
                  ].map((item) => {
                    const isSelected = wakeWordConfig.activeWakeWord.toLowerCase() === item.phrase.toLowerCase();
                    return (
                      <button
                        key={item.phrase}
                        onClick={() => {
                          onUpdateWakeWordConfig({
                            activeWakeWord: item.phrase,
                            wakeWords: wakeWordConfig.wakeWords.includes(item.phrase)
                              ? wakeWordConfig.wakeWords
                              : [...wakeWordConfig.wakeWords, item.phrase],
                          });
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-pink-500/20 border-pink-400 text-white shadow-md shadow-pink-900/20'
                            : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold block">{item.label}</span>
                          <span className="text-[10px] text-white/40 block">{item.tag}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-pink-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Wake Words */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-violet-400" />
                  Custom Trigger Phrases
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customWakeInput}
                    onChange={(e) => setCustomWakeInput(e.target.value)}
                    placeholder="Enter custom phrase (e.g. Jarvis, Computer)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = customWakeInput.trim();
                      if (clean && !wakeWordConfig.customWakeWords.includes(clean)) {
                        onUpdateWakeWordConfig({
                          customWakeWords: [...wakeWordConfig.customWakeWords, clean],
                          activeWakeWord: clean,
                        });
                        setCustomWakeInput('');
                      }
                    }}
                    disabled={!customWakeInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {wakeWordConfig.customWakeWords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {wakeWordConfig.customWakeWords.map((word) => {
                      const isActive = wakeWordConfig.activeWakeWord.toLowerCase() === word.toLowerCase();
                      return (
                        <div
                          key={word}
                          className={`px-2.5 py-1 rounded-xl border text-xs flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-pink-500/25 border-pink-400 text-pink-200'
                              : 'bg-white/5 border-white/10 text-white/80'
                          }`}
                        >
                          <button
                            onClick={() => onUpdateWakeWordConfig({ activeWakeWord: word })}
                            className="cursor-pointer font-bold hover:underline"
                          >
                            {word}
                          </button>
                          <button
                            onClick={() => {
                              onUpdateWakeWordConfig({
                                customWakeWords: wakeWordConfig.customWakeWords.filter((w) => w !== word),
                                activeWakeWord: wakeWordConfig.activeWakeWord === word ? 'Hey Moon' : wakeWordConfig.activeWakeWord,
                              });
                            }}
                            className="p-0.5 rounded text-white/40 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sensitivity & Audio Chime */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Sensitivity
                  </label>
                  <div className="flex gap-1">
                    {(['low', 'medium', 'high'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => onUpdateWakeWordConfig({ sensitivity: lvl })}
                        className={`flex-1 py-1.5 rounded-xl text-xs capitalize transition-all cursor-pointer font-bold ${
                          wakeWordConfig.sensitivity === lvl
                            ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                            : 'bg-white/5 hover:bg-white/10 text-white/60 border border-transparent'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                      Wake Chime
                    </label>
                    {onPlayTestChime && (
                      <button
                        onClick={onPlayTestChime}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-pink-300 cursor-pointer text-[10px] flex items-center gap-1 font-bold"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Test Chime</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-white/60">Play chime on wake</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wakeWordConfig.playWakeChime}
                      onClick={() => onUpdateWakeWordConfig({ playWakeChime: !wakeWordConfig.playWakeChime })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        wakeWordConfig.playWakeChime ? 'bg-pink-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          wakeWordConfig.playWakeChime ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="flex items-center gap-2 text-white/40 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Moon AI Agent</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all cursor-pointer shadow-lg shadow-violet-900/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
