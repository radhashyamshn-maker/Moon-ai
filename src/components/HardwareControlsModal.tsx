import React from 'react';
import { HardwareState, ThemeConfig } from '../types';
import {
  Flashlight,
  Battery,
  Wifi,
  Bluetooth,
  Vibrate,
  Sun,
  X,
  Zap,
  Volume2,
  Bell,
  BellOff,
  Plane,
  Radio,
  MapPin,
  Moon,
  Sparkles,
  Shield,
} from 'lucide-react';

interface HardwareControlsModalProps {
  hardware: HardwareState;
  theme: ThemeConfig;
  onToggleFlashlight: () => void;
  onToggleVibrate: () => void;
  onToggleWifi: () => void;
  onToggleBluetooth: () => void;
  onToggleDnd: () => void;
  onToggleAirplane: () => void;
  onToggleHotspot: () => void;
  onToggleLocation: () => void;
  onToggleDarkMode: () => void;
  onChangeBrightness: (val: number) => void;
  onChangeVolume: (val: number) => void;
  onChangeRingtoneVolume: (val: number) => void;
  onClose: () => void;
}

export const HardwareControlsModal: React.FC<HardwareControlsModalProps> = ({
  hardware,
  theme,
  onToggleFlashlight,
  onToggleVibrate,
  onToggleWifi,
  onToggleBluetooth,
  onToggleDnd,
  onToggleAirplane,
  onToggleHotspot,
  onToggleLocation,
  onToggleDarkMode,
  onChangeBrightness,
  onChangeVolume,
  onChangeRingtoneVolume,
  onClose,
}) => {
  return (
    <div
      id="hardware-controls-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        className="bg-[#121217] border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar font-mono text-white"
        style={{
          borderColor: theme.border,
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 25px ${theme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Phone Quick Settings</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                Autonomous Control
              </span>
            </h3>
            <span className="text-[10px] text-white/40">
              Voice controllable system toggles & device hardware
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Battery Status Card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white">
                Battery Level: {hardware.battery}%
              </span>
              <span className="text-[10px] text-emerald-400 block flex items-center gap-1">
                <Zap className="w-3 h-3" /> {hardware.isCharging ? 'Fast Charging (98% Health)' : 'Optimal Battery Condition'}
              </span>
            </div>
          </div>
          <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${hardware.battery}%` }}
            />
          </div>
        </div>

        {/* 3x3 Phone Quick Settings Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Flashlight */}
          <button
            onClick={onToggleFlashlight}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.flashlight
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <Flashlight className={`w-5 h-5 ${hardware.flashlight ? 'text-amber-400 animate-pulse' : ''}`} />
            <div className="text-[10px] font-bold">Torch</div>
          </button>

          {/* Wi-Fi */}
          <button
            onClick={onToggleWifi}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.wifi
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <Wifi className={`w-5 h-5 ${hardware.wifi ? 'text-cyan-400' : ''}`} />
            <div className="text-[10px] font-bold">Wi-Fi 6E</div>
          </button>

          {/* Bluetooth */}
          <button
            onClick={onToggleBluetooth}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.bluetooth
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <Bluetooth className={`w-5 h-5 ${hardware.bluetooth ? 'text-blue-400' : ''}`} />
            <div className="text-[10px] font-bold">Bluetooth</div>
          </button>

          {/* Do Not Disturb */}
          <button
            onClick={onToggleDnd}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.dnd
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            {hardware.dnd ? <BellOff className="w-5 h-5 text-rose-400" /> : <Bell className="w-5 h-5" />}
            <div className="text-[10px] font-bold">DND Silent</div>
          </button>

          {/* Airplane Mode */}
          <button
            onClick={onToggleAirplane}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.airplaneMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <Plane className={`w-5 h-5 ${hardware.airplaneMode ? 'text-amber-400' : ''}`} />
            <div className="text-[10px] font-bold">Airplane</div>
          </button>

          {/* Hotspot */}
          <button
            onClick={onToggleHotspot}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.hotspot
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <Radio className={`w-5 h-5 ${hardware.hotspot ? 'text-purple-400' : ''}`} />
            <div className="text-[10px] font-bold">Hotspot</div>
          </button>

          {/* Location GPS */}
          <button
            onClick={onToggleLocation}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.location
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <MapPin className={`w-5 h-5 ${hardware.location ? 'text-emerald-400' : ''}`} />
            <div className="text-[10px] font-bold">GPS Location</div>
          </button>

          {/* Haptics */}
          <button
            onClick={onToggleVibrate}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.vibrating
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <Vibrate className={`w-5 h-5 ${hardware.vibrating ? 'text-violet-400 animate-bounce' : ''}`} />
            <div className="text-[10px] font-bold">Haptics</div>
          </button>

          {/* Dark Mode */}
          <button
            onClick={onToggleDarkMode}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
              hardware.darkMode
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-md'
                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
            }`}
          >
            <Moon className={`w-5 h-5 ${hardware.darkMode ? 'text-indigo-400' : ''}`} />
            <div className="text-[10px] font-bold">Dark Mode</div>
          </button>
        </div>

        {/* Sliders: Brightness, Media Volume, Ringtone Volume */}
        <div className="space-y-3 pt-2">
          {/* Screen Brightness Slider */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" /> Screen Brightness
              </span>
              <span className="text-white font-bold">{hardware.brightness}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={hardware.brightness}
              onChange={(e) => onChangeBrightness(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Media Volume Slider */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Media Volume
              </span>
              <span className="text-white font-bold">{hardware.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={hardware.volume}
              onChange={(e) => onChangeVolume(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Ringtone Volume Slider */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-violet-400" /> Ringtone Volume
              </span>
              <span className="text-white font-bold">{hardware.ringtoneVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={hardware.ringtoneVolume}
              onChange={(e) => onChangeRingtoneVolume(parseInt(e.target.value))}
              className="w-full accent-violet-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
