import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Play,
  Pause,
  Sparkles,
  Trash2,
  CheckCircle2,
  Music,
  Sliders,
  Volume2,
  X,
  Download,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Clock,
  Video,
  Layers,
  Wand2,
  RotateCcw,
  Maximize2,
  AlertTriangle,
  FileCheck,
  Send,
  Zap,
  Mic,
} from 'lucide-react';

export interface VideoProjectConfig {
  photos: { id: string; name: string; url: string }[];
  mood: 'Cinematic' | 'Romantic' | 'Action' | 'Sad' | 'Vlog' | 'Old money / Vintage' | 'Luxury' | string;
  customMoodText?: string;
  clipDuration: number; // in seconds
  timingMode: 'fast' | 'default' | 'slow' | 'custom';
  aspectRatio: '9:16' | '16:9' | '1:1';
  resolution: '1080p' | '4K' | '720p';
  fps: 30 | 60;
  transition: 'zoom' | 'fade' | 'slide' | 'shake' | 'ken_burns';
  kenBurnsZoom: boolean;
  musicTrack: string;
  musicVolume: number; // percentage
  beatCutSync: boolean;
  audioFade: boolean;
  textOverlay: string;
  textPosition: 'top' | 'center' | 'bottom';
  addStickers: boolean;
  deleteSourcePhotosAfterExport: boolean;
}

interface CinematicVideoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePhotos: { id: string; name: string; url: string }[];
  initialCommand?: string;
}

const PRESET_MOODS = [
  {
    name: 'Cinematic',
    desc: 'Dark tones, teal-orange grade, slow zoom, film grain',
    filterStyle: 'contrast(120%) saturate(125%) hue-rotate(5deg) brightness(90%)',
    musicName: 'Cinematic Teaser & Bass Drop',
    recommendedRatio: '9:16' as const,
    duration: 3,
    transition: 'zoom' as const,
  },
  {
    name: 'Romantic',
    desc: 'Soft warm tones, slow fades, romantic acoustic piano',
    filterStyle: 'sepia(25%) saturate(110%) brightness(105%) contrast(95%)',
    musicName: 'Warm Romantic Acoustic Melody',
    recommendedRatio: '9:16' as const,
    duration: 4,
    transition: 'fade' as const,
  },
  {
    name: 'Action',
    desc: 'Fast cuts, shake effect, bass-heavy energetic music',
    filterStyle: 'contrast(140%) saturate(140%) brightness(100%)',
    musicName: 'Heavy 808 Trap & Fast Percussion',
    recommendedRatio: '9:16' as const,
    duration: 1.2,
    transition: 'shake' as const,
  },
  {
    name: 'Sad',
    desc: 'Desaturated, slow motion, emotional piano music',
    filterStyle: 'grayscale(75%) contrast(110%) brightness(85%)',
    musicName: 'Melancholic Cinematic Piano Solo',
    recommendedRatio: '9:16' as const,
    duration: 5,
    transition: 'fade' as const,
  },
  {
    name: 'Vlog',
    desc: 'Bright, jump cuts, upbeat vibrant music',
    filterStyle: 'saturate(135%) brightness(115%) contrast(105%)',
    musicName: 'Upbeat Sunshine Pop Synth',
    recommendedRatio: '16:9' as const,
    duration: 2,
    transition: 'slide' as const,
  },
  {
    name: 'Old money / Vintage',
    desc: 'Film filter, sepia, slow pan, vintage scratches',
    filterStyle: 'sepia(55%) contrast(115%) brightness(92%) saturate(85%)',
    musicName: 'Vintage Noir Vinyl & Gramophone',
    recommendedRatio: '9:16' as const,
    duration: 4,
    transition: 'ken_burns' as const,
  },
  {
    name: 'Luxury',
    desc: 'Gold tones, smooth transitions, elegant lounge music',
    filterStyle: 'contrast(115%) brightness(95%) saturate(115%) sepia(15%)',
    musicName: 'Elegance & Deep Midnight Lounge',
    recommendedRatio: '9:16' as const,
    duration: 3.5,
    transition: 'zoom' as const,
  },
];

export const CinematicVideoEditorModal: React.FC<CinematicVideoEditorModalProps> = ({
  isOpen,
  onClose,
  availablePhotos,
  initialCommand = '',
}) => {
  // Step navigation: 'welcome' -> 'select_photos' -> 'mood_style' -> 'editing' -> 'preview' -> 'exporting' -> 'delete_confirmation'
  const [step, setStep] = useState<
    'welcome' | 'select_photos' | 'mood_style' | 'editing' | 'preview' | 'exporting' | 'delete_confirmation'
  >('welcome');

  // Command bar for Jarvis voice / text commands
  const [commandInput, setCommandInput] = useState(initialCommand);
  const [jarvisStatusLog, setJarvisStatusLog] = useState<string[]>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // Video configuration state
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(() =>
    availablePhotos.map((p) => p.id)
  );
  const [photoOrderMode, setPhotoOrderMode] = useState<'normal' | 'reverse' | 'random'>('normal');

  const [currentMood, setCurrentMood] = useState<string>('Cinematic');
  const [customMoodInput, setCustomMoodInput] = useState<string>('');
  const [oneLineMoodConfirmation, setOneLineMoodConfirmation] = useState<string>('');

  const [clipDuration, setClipDuration] = useState<number>(3);
  const [timingMode, setTimingMode] = useState<'fast' | 'default' | 'slow' | 'custom'>('default');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [resolution, setResolution] = useState<'1080p' | '4K' | '720p'>('1080p');
  const [fps, setFps] = useState<30 | 60>(60);
  const [transition, setTransition] = useState<'zoom' | 'fade' | 'slide' | 'shake' | 'ken_burns'>('zoom');
  const [kenBurnsActive, setKenBurnsActive] = useState<boolean>(true);

  // Audio settings
  const [musicTrack, setMusicTrack] = useState<string>('Sad Melancholic Piano');
  const [musicVolume, setMusicVolume] = useState<number>(65);
  const [beatCutSync, setBeatCutSync] = useState<boolean>(false);
  const [audioFade, setAudioFade] = useState<boolean>(true);

  // Text overlay & stickers
  const [textOverlay, setTextOverlay] = useState<string>('Cinematic Memories');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [stickersActive, setStickersActive] = useState<boolean>(false);

  // Export & preview state
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isExported, setIsExported] = useState<boolean>(false);
  const [exportedFilePath, setExportedFilePath] = useState<string>('');
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(true);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [deleteConfirmState, setDeleteConfirmState] = useState<'idle' | 'deleted' | 'kept'>('idle');

  // Preview timer
  useEffect(() => {
    if (step !== 'preview' || !previewPlaying || selectedPhotoIds.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPreviewIndex((prev) => (prev + 1) % selectedPhotoIds.length);
    }, clipDuration * 1000);
    return () => clearInterval(interval);
  }, [step, previewPlaying, clipDuration, selectedPhotoIds]);

  // Log helper to simulate Jarvis's concise step status reports
  const addJarvisLog = (message: string) => {
    setJarvisStatusLog((prev) => [...prev.slice(-4), `⚡ Jarvis: ${message}`]);
  };

  // Command parser for Hindi / English prompts:
  // e.g.: "Jarvis, meri gallery se ye 10 photos lo. Ekdum cinematic banao. Slow zoom, teal-orange look, sad piano music, 9:16 me export karo, Reels ke liye. Photos delete kar dena baad me."
  const handleExecuteVoiceCommand = (commandToParse: string) => {
    const text = commandToParse.toLowerCase().trim();
    if (!text) return;

    setIsProcessingCommand(true);
    addJarvisLog('Command received! Active ho gaya hoon. Analyzing parameters...');

    setTimeout(() => {
      // 1. Mood detection
      if (text.includes('cinematic')) {
        setCurrentMood('Cinematic');
        setTransition('zoom');
        setKenBurnsActive(true);
        setMusicTrack('Cinematic Teaser & Bass Drop');
        addJarvisLog('Style set to "Cinematic" (teal-orange grade, slow zoom, film grain).');
      } else if (text.includes('romantic')) {
        setCurrentMood('Romantic');
        setTransition('fade');
        setMusicTrack('Warm Romantic Acoustic Melody');
        addJarvisLog('Style set to "Romantic" (soft warm tones, slow fades, romantic melody).');
      } else if (text.includes('action')) {
        setCurrentMood('Action');
        setTransition('shake');
        setClipDuration(1.2);
        setTimingMode('fast');
        setMusicTrack('Heavy 808 Trap & Fast Percussion');
        addJarvisLog('Style set to "Action" (fast cuts, shake effect, bass-heavy music).');
      } else if (text.includes('sad')) {
        setCurrentMood('Sad');
        setTransition('fade');
        setMusicTrack('Melancholic Cinematic Piano Solo');
        addJarvisLog('Style set to "Sad" (desaturated, slow motion, piano music).');
      } else if (text.includes('vlog')) {
        setCurrentMood('Vlog');
        setTransition('slide');
        setClipDuration(2);
        setMusicTrack('Upbeat Sunshine Pop Synth');
        addJarvisLog('Style set to "Vlog" (bright, jump cuts, upbeat music).');
      } else if (text.includes('vintage') || text.includes('old money')) {
        setCurrentMood('Old money / Vintage');
        setTransition('ken_burns');
        setMusicTrack('Vintage Noir Vinyl & Gramophone');
        addJarvisLog('Style set to "Old money / Vintage" (film filter, sepia, slow pan).');
      } else if (text.includes('luxury')) {
        setCurrentMood('Luxury');
        setTransition('zoom');
        setMusicTrack('Elegance & Deep Midnight Lounge');
        addJarvisLog('Style set to "Luxury" (gold tones, smooth transitions, elegant music).');
      }

      // 2. Aspect ratio detection
      if (text.includes('9:16') || text.includes('reels') || text.includes('shorts') || text.includes('story')) {
        setAspectRatio('9:16');
        addJarvisLog('Aspect ratio locked to 9:16 (Vertical Reels/Shorts).');
      } else if (text.includes('16:9') || text.includes('youtube') || text.includes('widescreen')) {
        setAspectRatio('16:9');
        addJarvisLog('Aspect ratio locked to 16:9 (YouTube Widescreen).');
      } else if (text.includes('1:1') || text.includes('post') || text.includes('square')) {
        setAspectRatio('1:1');
        addJarvisLog('Aspect ratio locked to 1:1 (Square Post).');
      }

      // 3. Timing / Duration detection
      if (text.includes('fast') || text.includes('tez') || text.includes('jaldi')) {
        setTimingMode('fast');
        setClipDuration(1.2);
        addJarvisLog('Clip speed set to Fast (1.2s per photo).');
      } else if (text.includes('slow') || text.includes('dhire') || text.includes('aaram se')) {
        setTimingMode('slow');
        setClipDuration(5.0);
        addJarvisLog('Clip speed set to Slow (5.0s per photo).');
      }

      // 4. Music & Beat detection
      if (text.includes('piano') || text.includes('sad piano')) {
        setMusicTrack('Melancholic Cinematic Piano Solo');
        addJarvisLog('Music attached: Sad Melancholic Piano Solo.');
      }
      if (text.includes('beat') || text.includes('beat pe cut')) {
        setBeatCutSync(true);
        addJarvisLog('Beat-sync cut enabled: Audio waveform markers synced.');
      }

      // 5. Resolution & FPS
      if (text.includes('4k')) {
        setResolution('4K');
      } else if (text.includes('720p')) {
        setResolution('720p');
      } else {
        setResolution('1080p');
      }
      if (text.includes('60fps') || text.includes('60 fps')) {
        setFps(60);
      } else if (text.includes('30fps') || text.includes('30 fps')) {
        setFps(30);
      }

      // 6. Delete photo flag mentioned in prompt
      if (text.includes('delete kar dena') || text.includes('delete kar do')) {
        addJarvisLog('Noted: Photo cleanup requested after export (Will ask confirmation first).');
      }

      setIsProcessingCommand(false);
      setStep('editing');
      addJarvisLog('All parameters applied! Opening timeline editor.');
    }, 600);
  };

  // Start export rendering
  const handleStartExport = () => {
    setStep('exporting');
    setExportProgress(0);
    setIsExported(false);

    const filename = `Jarvis_Cinematic_${currentMood.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.mp4`;
    const fullPath = `/DCIM/CapCut/${filename}`;
    setExportedFilePath(fullPath);

    addJarvisLog(`Rendering 1080p 60fps video to ${fullPath}...`);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExported(true);
          addJarvisLog(`Export complete! Video saved: ${fullPath}`);
          return 100;
        }
        return prev + 25;
      });
    }, 450);
  };

  // Step 6: Confirmation prompt before deleting source photos
  const handleConfirmPhotoDeletion = (shouldDelete: boolean) => {
    if (shouldDelete) {
      setDeleteConfirmState('deleted');
      addJarvisLog(`${selectedPhotoIds.length} source photos deleted from gallery safely.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setDeleteConfirmState('kept');
      addJarvisLog('Photos safe and preserved in gallery. No files deleted.');
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  // Find current mood configuration
  const activeMoodConfig =
    PRESET_MOODS.find((m) => m.name.toLowerCase() === currentMood.toLowerCase()) || {
      name: currentMood,
      desc: customMoodInput || 'Custom atmospheric grade created by Jarvis',
      filterStyle: 'contrast(115%) saturate(120%) brightness(100%)',
      musicName: musicTrack,
      recommendedRatio: aspectRatio,
      duration: clipDuration,
      transition: transition,
    };

  const selectedPhotos = availablePhotos.filter((p) => selectedPhotoIds.includes(p.id));
  const currentPreviewPhoto = selectedPhotos[currentPreviewIndex] || selectedPhotos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0e0e11] border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-violet-950/80 via-[#141419] to-[#0e0e11] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/60 flex items-center justify-center text-violet-300 shadow-md shadow-violet-600/30">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-antonio tracking-wide text-white">
                  Jarvis Cinematic Studio
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/25 border border-violet-500/40 text-violet-300 font-mono">
                  PRO EDITOR
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-outfit">
                "Jaisa main bolun — waisa hi. Ekdum mast. Ekdum cinematic."
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                step === 'preview'
                  ? 'bg-violet-600 text-white shadow'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Jarvis Realtime Command Input Bar */}
        <div className="px-5 py-2.5 bg-[#121218] border-b border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Wand2 className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteVoiceCommand(commandInput)}
              placeholder="Jarvis, video banao: 'Meri gallery se 5 photos lo. Cinematic teal-orange look, sad piano music, 9:16 reels...'"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/70"
            />
            <button
              onClick={() => handleExecuteVoiceCommand(commandInput)}
              disabled={isProcessingCommand}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0 cursor-pointer shadow-sm shadow-violet-600/30"
            >
              <Send className="w-3 h-3" /> Bolo Jarvis
            </button>
          </div>

          {/* Quick preset command chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[10px]">
            <span className="text-gray-400 shrink-0 font-mono">Quick:</span>
            <button
              onClick={() => {
                const cmd = "Jarvis, cinematic video banao, teal-orange, slow zoom, sad piano music, 9:16 reels";
                setCommandInput(cmd);
                handleExecuteVoiceCommand(cmd);
              }}
              className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-violet-300 hover:bg-violet-500/20 shrink-0"
            >
              🎬 Reels Cinematic (9:16)
            </button>
            <button
              onClick={() => {
                const cmd = "Jarvis, action style fast cuts shake effect bass music 9:16";
                setCommandInput(cmd);
                handleExecuteVoiceCommand(cmd);
              }}
              className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-violet-300 hover:bg-violet-500/20 shrink-0"
            >
              ⚡ Fast Action Cut
            </button>
            <button
              onClick={() => {
                const cmd = "Jarvis, old money vintage film look sepia slow pan 16:9";
                setCommandInput(cmd);
                handleExecuteVoiceCommand(cmd);
              }}
              className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-violet-300 hover:bg-violet-500/20 shrink-0"
            >
              🎞️ Vintage Film
            </button>
            <button
              onClick={() => {
                const cmd = "Jarvis, romantic soft warm tones acoustic piano music";
                setCommandInput(cmd);
                handleExecuteVoiceCommand(cmd);
              }}
              className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-violet-300 hover:bg-violet-500/20 shrink-0"
            >
              🌹 Romantic Mood
            </button>
          </div>

          {/* Jarvis Status Log HUD */}
          {jarvisStatusLog.length > 0 && (
            <div className="p-2 bg-black/50 border border-violet-500/20 rounded-lg text-[11px] font-mono text-violet-300 space-y-0.5">
              {jarvisStatusLog.map((log, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="text-emerald-400">●</span> {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step Navigation Bar */}
        <div className="flex border-b border-white/10 bg-[#0e0e11] px-4 py-2 gap-2 text-xs font-outfit overflow-x-auto no-scrollbar">
          {[
            { id: 'select_photos', label: '1. Photos', count: selectedPhotoIds.length },
            { id: 'mood_style', label: '2. Style & Mood', activeValue: currentMood },
            { id: 'editing', label: '3. Timeline & Cuts', activeValue: `${clipDuration}s` },
            { id: 'preview', label: '4. Live Canvas Preview' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl border transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                step === tab.id
                  ? 'bg-violet-600/30 border-violet-500 text-white font-semibold'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-violet-500/40 text-[10px] text-violet-200">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleStartExport}
            className="ml-auto px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-violet-600/40 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> 5. Export {resolution}
          </button>
        </div>

        {/* Main Interactive Body */}
        <div className="flex-1 overflow-y-auto p-5 font-outfit text-sm">
          
          {/* STEP 1: PHOTOS IMPORT */}
          {step === 'select_photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-antonio">
                    📸 Step 1: Photos Import & Order
                  </h3>
                  <p className="text-xs text-gray-400">
                    CapCut project initialized. Jarvis has imported {selectedPhotoIds.length} photos.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      if (photoOrderMode === 'normal') {
                        setPhotoOrderMode('reverse');
                        setSelectedPhotoIds([...selectedPhotoIds].reverse());
                        addJarvisLog('Order changed: Reverse chronological order.');
                      } else if (photoOrderMode === 'reverse') {
                        setPhotoOrderMode('random');
                        setSelectedPhotoIds([...selectedPhotoIds].sort(() => Math.random() - 0.5));
                        addJarvisLog('Order changed: Random shuffle order applied.');
                      } else {
                        setPhotoOrderMode('normal');
                        setSelectedPhotoIds(availablePhotos.map((p) => p.id));
                        addJarvisLog('Order reset to original gallery sequence.');
                      }
                    }}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 border border-white/10 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Order: {photoOrderMode}
                  </button>
                  <button
                    onClick={() => setSelectedPhotoIds(availablePhotos.map((p) => p.id))}
                    className="text-violet-400 hover:underline"
                  >
                    Select All
                  </button>
                </div>
              </div>

              {/* Photo Grid with selection and order indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availablePhotos.map((photo, index) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  const orderNum = selectedPhotoIds.indexOf(photo.id) + 1;

                  return (
                    <div
                      key={photo.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPhotoIds(selectedPhotoIds.filter((id) => id !== photo.id));
                        } else {
                          setSelectedPhotoIds([...selectedPhotoIds, photo.id]);
                        }
                      }}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition group ${
                        isSelected
                          ? 'border-violet-500 shadow-lg shadow-violet-500/30'
                          : 'border-white/10 opacity-50 hover:opacity-80'
                      }`}
                    >
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                      {isSelected ? (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-violet-600 border border-white text-white font-mono text-xs flex items-center justify-center font-bold shadow">
                          {orderNum}
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 border border-white/30 text-gray-400 text-xs flex items-center justify-center">
                          +
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[11px] text-white truncate">
                        {photo.name}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-violet-950/20 border border-violet-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-300">
                  Total clips: <strong className="text-violet-300">{selectedPhotoIds.length}</strong> | Est. Video Duration:{' '}
                  <strong className="text-white">{selectedPhotoIds.length * clipDuration} seconds</strong>
                </span>
                <button
                  onClick={() => setStep('mood_style')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold flex items-center gap-1.5 transition"
                >
                  Next: Choose Mood <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: STYLE / MOOD */}
          {step === 'mood_style' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-antonio">
                  🎨 Step 2: Cinematic Style & Mood
                </h3>
                <p className="text-xs text-gray-400">
                  Select a predefined cinematic aesthetic or type any custom mood.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_MOODS.map((preset) => {
                  const isSelected = currentMood.toLowerCase() === preset.name.toLowerCase();

                  return (
                    <div
                      key={preset.name}
                      onClick={() => {
                        setCurrentMood(preset.name);
                        setTransition(preset.transition);
                        setClipDuration(preset.duration);
                        setMusicTrack(preset.musicName);
                        addJarvisLog(`Mood set to "${preset.name}". ${preset.desc}`);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500 shadow-md shadow-violet-500/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm font-antonio tracking-wide">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-violet-500 text-[10px] text-white font-mono">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">{preset.desc}</p>
                      <div className="flex items-center gap-2 text-[10px] text-violet-300 font-mono">
                        <span>🎵 {preset.musicName.split(' ')[0]}</span>
                        <span>•</span>
                        <span>⏱️ {preset.duration}s/clip</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom mood input */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <label className="text-xs font-semibold text-gray-200 flex items-center justify-between">
                  <span>✨ Or Custom Mood (Jo list me nahi hai)</span>
                  <span className="text-[10px] text-gray-400">Jarvis will confirm in one line</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMoodInput}
                    onChange={(e) => setCustomMoodInput(e.target.value)}
                    placeholder="e.g. Cyberpunk Tokyo 2077, Sunset Aesthetic, Dramatic Noir..."
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={() => {
                      if (!customMoodInput.trim()) return;
                      setCurrentMood(customMoodInput);
                      const confirmation = `Understood. Applying custom mood "${customMoodInput}" with tailored tone curves.`;
                      setOneLineMoodConfirmation(confirmation);
                      addJarvisLog(confirmation);
                    }}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Apply Mood
                  </button>
                </div>
                {oneLineMoodConfirmation && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    ⚡ {oneLineMoodConfirmation}
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep('select_photos')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('editing')}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  Configure Timeline <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: EDITING TIMELINE */}
          {step === 'editing' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-antonio">
                  ✂️ Step 3: Editing, Timing & Audio Controls
                </h3>
                <p className="text-xs text-gray-400">
                  Custom speed, Ken Burns slow zoom, beat-matching, audio levels, and aspect ratio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Duration / Timing */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-200">
                      Clip Duration: <span className="text-violet-300 font-bold">{clipDuration}s</span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Total: ~{selectedPhotoIds.length * clipDuration}s
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        setTimingMode('fast');
                        setClipDuration(1.2);
                        addJarvisLog('Speed: Fast mode (1.2s per photo) for dynamic tempo.');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                        timingMode === 'fast'
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      ⚡ Fast (1.2s)
                    </button>
                    <button
                      onClick={() => {
                        setTimingMode('default');
                        setClipDuration(3.0);
                        addJarvisLog('Speed: Standard cinematic (3.0s per photo).');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                        timingMode === 'default'
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      🎬 Normal (3s)
                    </button>
                    <button
                      onClick={() => {
                        setTimingMode('slow');
                        setClipDuration(5.5);
                        addJarvisLog('Speed: Slow motion aesthetic (5.5s per photo).');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                        timingMode === 'slow'
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      🕊️ Slow (5.5s)
                    </button>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={clipDuration}
                    onChange={(e) => {
                      setClipDuration(Number(e.target.value));
                      setTimingMode('custom');
                    }}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>

                {/* Aspect Ratio */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <label className="text-xs font-semibold text-gray-200 block">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        setAspectRatio('9:16');
                        addJarvisLog('Aspect ratio: 9:16 for Reels/Shorts.');
                      }}
                      className={`py-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-0.5 ${
                        aspectRatio === '9:16'
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      <span>9:16</span>
                      <span className="text-[9px] opacity-75">Reels / Shorts</span>
                    </button>
                    <button
                      onClick={() => {
                        setAspectRatio('16:9');
                        addJarvisLog('Aspect ratio: 16:9 for YouTube.');
                      }}
                      className={`py-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-0.5 ${
                        aspectRatio === '16:9'
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      <span>16:9</span>
                      <span className="text-[9px] opacity-75">YouTube</span>
                    </button>
                    <button
                      onClick={() => {
                        setAspectRatio('1:1');
                        addJarvisLog('Aspect ratio: 1:1 for Feed Post.');
                      }}
                      className={`py-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-0.5 ${
                        aspectRatio === '1:1'
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      <span>1:1</span>
                      <span className="text-[9px] opacity-75">Feed Post</span>
                    </button>
                  </div>
                </div>

                {/* Transitions & Ken Burns */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <label className="text-xs font-semibold text-gray-200 block">
                    Cinematic Camera Motion
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setKenBurnsActive(!kenBurnsActive)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                        kenBurnsActive
                          ? 'bg-violet-600/30 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      <span>Ken Burns Zoom</span>
                      <span className="text-[10px]">{kenBurnsActive ? 'ON' : 'OFF'}</span>
                    </button>
                    <button
                      onClick={() => setBeatCutSync(!beatCutSync)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                        beatCutSync
                          ? 'bg-violet-600/30 border-violet-500 text-white'
                          : 'bg-black/30 border-white/10 text-gray-400'
                      }`}
                    >
                      <span>Beat-Sync Cut</span>
                      <span className="text-[10px]">{beatCutSync ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>

                {/* Music & Volume */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-violet-400" /> Music Volume: {musicVolume}%
                    </label>
                    <span className="text-[10px] text-gray-400">Fade In/Out: ON</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>Background (65%)</span>
                    <span>Voice Priority (100%)</span>
                  </div>
                </div>
              </div>

              {/* Text Overlay & Title */}
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <label className="text-xs font-semibold text-gray-200 flex items-center justify-between">
                  <span>📝 Text Overlay & Typography</span>
                  <div className="flex gap-1">
                    {(['top', 'center', 'bottom'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setTextPosition(pos)}
                        className={`px-2 py-0.5 text-[10px] rounded border uppercase font-mono ${
                          textPosition === pos
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'bg-black/30 border-white/10 text-gray-400'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </label>
                <input
                  type="text"
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Enter video title or cinematic subtitles..."
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep('mood_style')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  Live Preview <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LIVE CANVAS PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-antonio">
                    🎬 Step 4: Live Canvas Video Preview
                  </h3>
                  <p className="text-xs text-gray-400">
                    Aspect ratio: {aspectRatio} • Mood: {currentMood} • Clip {currentPreviewIndex + 1} of {selectedPhotos.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewPlaying(!previewPlaying)}
                    className="p-2 bg-violet-600/30 border border-violet-500/50 rounded-xl text-violet-300 hover:bg-violet-600/50 text-xs flex items-center gap-1"
                  >
                    {previewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{previewPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                </div>
              </div>

              {/* Viewport Frame with chosen aspect ratio */}
              <div className="flex justify-center bg-black/70 rounded-2xl p-4 border border-white/10">
                <div
                  className={`relative overflow-hidden rounded-2xl bg-black border-2 border-violet-500/40 shadow-2xl transition-all duration-300 ${
                    aspectRatio === '9:16'
                      ? 'w-[220px] h-[390px]'
                      : aspectRatio === '16:9'
                      ? 'w-[420px] h-[236px]'
                      : 'w-[280px] h-[280px]'
                  }`}
                >
                  {/* Photo with active filter and Ken Burns motion */}
                  {currentPreviewPhoto ? (
                    <div className="w-full h-full relative overflow-hidden">
                      <img
                        src={currentPreviewPhoto.url}
                        alt="Preview"
                        style={{
                          filter: activeMoodConfig.filterStyle,
                          transform: kenBurnsActive ? (currentPreviewIndex % 2 === 0 ? 'scale(1.12)' : 'scale(1.02)') : 'none',
                          transition: `transform ${clipDuration}s ease-in-out, opacity 0.5s ease`,
                        }}
                        className="w-full h-full object-cover"
                      />

                      {/* Film Grain & Vignette Overlay */}
                      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/70 pointer-events-none" />

                      {/* Text Overlay */}
                      {textOverlay && (
                        <div
                          className={`absolute inset-x-0 p-4 text-center pointer-events-none ${
                            textPosition === 'top'
                              ? 'top-4'
                              : textPosition === 'center'
                              ? 'top-1/2 -translate-y-1/2'
                              : 'bottom-4'
                          }`}
                        >
                          <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white font-bold font-antonio tracking-wider text-xs border border-white/20 shadow-lg inline-block">
                            {textOverlay}
                          </span>
                        </div>
                      )}

                      {/* Top status indicator in preview */}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        REC {resolution}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                      No photos selected
                    </div>
                  )}
                </div>
              </div>

              {/* Clip navigation dots */}
              <div className="flex justify-center gap-1.5">
                {selectedPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPreviewIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition ${
                      currentPreviewIndex === idx ? 'bg-violet-500 w-6' : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep('editing')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300"
                >
                  Edit Timeline
                </button>
                <button
                  onClick={handleStartExport}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/30"
                >
                  <Download className="w-4 h-4" /> Export {resolution} {fps}fps
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: EXPORTING ENGINE */}
          {step === 'exporting' && (
            <div className="text-center py-10 space-y-5">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                <span className="text-2xl font-bold font-antonio text-white">{exportProgress}%</span>
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-lg font-bold text-white font-antonio tracking-wide">
                  {isExported ? 'Rendering Complete! 🎥' : 'Jarvis Rendering Engine Working...'}
                </h4>
                <p className="text-xs text-gray-400">
                  {isExported
                    ? `Video rendered at ${resolution}, ${fps}fps (${aspectRatio}). Saved in your CapCut project folder.`
                    : `Applying ${currentMood} color curves, Ken Burns pan-zoom, and syncing audio track.`}
                </p>
              </div>

              {isExported && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl max-w-md mx-auto text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <FileCheck className="w-4 h-4" /> Export Destination:
                  </div>
                  <div className="text-xs font-mono text-white bg-black/60 p-2 rounded-lg break-all">
                    {exportedFilePath}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Specs: {resolution} • {fps} FPS • H.264 MP4 • {aspectRatio}
                  </div>
                </div>
              )}

              {isExported && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      alert(`📥 Saved to: ${exportedFilePath}\nReady for Instagram Reels, YouTube Shorts, or TikTok.`);
                    }}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30"
                  >
                    <Download className="w-4 h-4" /> Download Video (.mp4)
                  </button>
                  <button
                    onClick={() => setStep('delete_confirmation')}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" /> Clean Up Photos (Safety Check)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: CLEANUP & STRICT SAFETY FIRST CONFIRMATION */}
          {step === 'delete_confirmation' && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold font-antonio tracking-wide text-white">
                  Confirmation Ke Bina Kuch Delete Mat Karo
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed font-outfit">
                  "Confirmation ke bina koi photo delete mat karna. Safety first."
                </p>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono">
                  "{selectedPhotoIds.length} photos delete karun? Haan/Nahi"
                </div>
              </div>

              {deleteConfirmState === 'idle' ? (
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleConfirmPhotoDeletion(false)}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-gray-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Nahi (Rehne Do)
                  </button>
                  <button
                    onClick={() => handleConfirmPhotoDeletion(true)}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Haan (Delete Karo)
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  {deleteConfirmState === 'deleted'
                    ? `✓ ${selectedPhotoIds.length} photos safely removed from gallery.`
                    : '✓ Photos preserved. Returning to dashboard.'}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
