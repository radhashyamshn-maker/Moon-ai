import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LiveState,
  AtmosphereTheme,
  CharacterAnimation,
  ToolExecutionEvent,
  IncomingCall,
  NotificationItem,
  MediaTrack,
  HardwareState,
  CalendarEvent,
  ContactItem,
  PermissionDefinition,
  AppLauncherItem,
  AlarmItem,
  SmsConversation,
  WakeWordConfig,
  WakeWordEvent,
  PhoneFileItem,
} from './types';
import { THEME_PRESETS } from './components/ThemePresets';
import { AudioStreamer } from './services/AudioStreamer';
import { LiveSession } from './services/LiveSession';
import { ScreenVisionManager } from './services/ScreenVisionManager';
import { AudioSynthPlayer } from './services/AudioSynthPlayer';
import { WakeWordManager } from './services/WakeWordManager';

// Visual Components
import { AnimeAvatar, AvatarExpression } from './components/AnimeAvatar';
import { AvatarControlDock } from './components/AvatarControlDock';
import { PersonaOrb } from './components/PersonaOrb';
import { CentralPowerButton } from './components/CentralPowerButton';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { TopBar } from './components/TopBar';
import { ActionToast } from './components/ActionToast';
import { ThemeModal } from './components/ThemeModal';
import { SettingsModal } from './components/SettingsModal';
import { PromptsDrawer } from './components/PromptsDrawer';
import { FloatingOverlay } from './components/FloatingOverlay';
import { ScreenVisionOverlay } from './components/ScreenVisionOverlay';
import { IncomingCallModal } from './components/IncomingCallModal';
import { NotificationInterceptorModal } from './components/NotificationInterceptorModal';
import { MediaPlaybackWidget } from './components/MediaPlaybackWidget';
import { HardwareControlsModal } from './components/HardwareControlsModal';
import { CalendarModal } from './components/CalendarModal';
import { ContactsModal } from './components/ContactsModal';
import { WakeWordModal } from './components/WakeWordModal';
import { BiometricAuthModal } from './components/BiometricAuthModal';
import { biometricAuthInstance } from './services/BiometricAuthService';
import { FileManagerModal, INITIAL_PHONE_FILES } from './components/FileManagerModal';
import { CinematicVideoEditorModal } from './components/CinematicVideoEditorModal';
import { CustomOverlay } from './components/CustomOverlay';
import { overlayService } from './services/OverlayService.android';

// Phone Control Suite Components
import { PermissionsModal } from './components/PermissionsModal';
import { PermissionRequestDialog } from './components/PermissionRequestDialog';
import { AppLauncherModal } from './components/AppLauncherModal';
import { AlarmClockModal } from './components/AlarmClockModal';
import { SmsMessagesModal } from './components/SmsMessagesModal';
import { DialerModal } from './components/DialerModal';
import { getPermissionRouteInfo, triggerNativePermissionRequest } from './services/permissionRouting';
import { nativeOverlayBridge } from './services/nativeOverlayBridge';

import { Radio, Mic, Volume2, ShieldCheck, Zap, Eye, Music, PhoneCall, Bell, Cpu, Calendar, Users, Layers, MessageSquare, Clock, LayoutGrid, Ear, Fingerprint, Lock, FolderOpen } from 'lucide-react';

const INITIAL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'accessibility',
    title: 'Accessibility Service (एक्सेसिबिलिटी सर्विस)',
    description: 'स्क्रीन को पढ़ने, खुद बटन दबाने और ऐप्स को नेविगेट करने के लिए। (Screen hierarchy inspection, auto-click buttons, and autonomous navigation)',
    category: 'System Controls',
    granted: true,
    iconName: 'LayoutGrid',
    dangerLevel: 'high',
  },
  {
    key: 'notifications',
    title: 'Notification Access (डिवाइस व ऐप नोटिफिकेशन एक्सेस)',
    description: 'आने वाले मैसेज और अलर्ट्स पढ़ने व उनका ऑटो-रिप्लाई करने के लिए। (Intercept incoming alerts, preview messages, and trigger AI auto-replies)',
    category: 'System Controls',
    granted: true,
    iconName: 'Bell',
    dangerLevel: 'high',
  },
  {
    key: 'display_over_apps',
    title: 'Display Over Other Apps (डिस्प्ले ओवर अदर ऐप्स व एज ऑरा)',
    description: 'स्क्रीन के दोनों किनारों पर वाटर बबल्स, खिलते फूल व JARVIS/IRIS-X एक्टिव बैज दिखाने के लिए। (Renders floating edge bubbles, blooming petals, JARVIS/IRIS-X badge, and floating mic HUD above all apps)',
    category: 'System Controls',
    granted: true,
    iconName: 'Layers',
    dangerLevel: 'high',
  },
  {
    key: 'background_activity',
    title: 'Microphone & Background Activity (बैकग्राउंड एक्टिविटी)',
    description: 'हमेशा आवाज सुनने (Hotword/Wake word) और बैटरी सेवर से बंद न होने के लिए। (Continuous wake-word radar, prevents OS sleep & battery kill)',
    category: 'Critical',
    granted: true,
    iconName: 'Zap',
    dangerLevel: 'high',
  },
  {
    key: 'phone_calls',
    title: 'Phone Calls & Telephony (फोन परमिशन)',
    description: 'सीधे कॉल लगाने, इनकमिंग कॉल रिसीव करने और AI से कॉल स्क्रीन करने के लिए। (Direct dialer, call screener, and voice telephony)',
    category: 'Communication',
    granted: true,
    iconName: 'PhoneCall',
    dangerLevel: 'high',
  },
  {
    key: 'contacts',
    title: 'Contacts & Address Book (कॉन्टैक्ट्स एक्सेस)',
    description: 'सीधे कॉल लगाने और नाम से मैसेज भेजने के लिए कॉन्टैक्ट्स। (Directory access for 1-tap dial, caller identification, and WhatsApp lookup)',
    category: 'Communication',
    granted: true,
    iconName: 'Users',
    dangerLevel: 'medium',
  },
  {
    key: 'sms_messaging',
    title: 'SMS & WhatsApp Messages (SMS परमिशन)',
    description: 'सीधे मैसेज भेजने, पढ़ने और ऑटो-रिप्लाई करने के लिए। (Direct text messaging, threaded chat views, and autonomous AI replies)',
    category: 'Communication',
    granted: true,
    iconName: 'MessageSquare',
    dangerLevel: 'high',
  },
  {
    key: 'storage_files',
    title: 'Files & Media Access (फाइल और मीडिया एक्सेस)',
    description: 'फोन की फाइल्स ढूँढने और खोलने के लिए। (Internal storage inspection, documents, photos, audio, downloads, and AI file analysis)',
    category: 'Media & Vision',
    granted: true,
    iconName: 'FolderOpen',
    dangerLevel: 'medium',
  },
  {
    key: 'biometric_auth',
    title: 'Biometric Sensor & FIDO2 Security',
    description: 'Hardware authentication layer using WebAuthn (Touch ID, Face ID, Windows Hello) and passkeys to protect assistant launch and phone controls.',
    category: 'Critical',
    granted: true,
    iconName: 'Fingerprint',
    dangerLevel: 'high',
  },
  {
    key: 'wake_word',
    title: 'Hands-Free Wake Word Radar',
    description: 'Allows Moon to continuously detect hands-free wake phrases like "Hey Moon" to instantly activate assistant.',
    category: 'Critical',
    granted: true,
    iconName: 'Ear',
    dangerLevel: 'medium',
  },
  {
    key: 'microphone',
    title: 'Microphone & Voice Streaming',
    description: 'Allows Moon to hear and engage in real-time bilingual voice chat with ultra-low latency.',
    category: 'Critical',
    granted: true,
    iconName: 'Mic',
    dangerLevel: 'high',
  },
  {
    key: 'camera_screen',
    title: 'Camera & Screen Vision',
    description: 'Enables Moon to inspect your screen, analyze workspace code, and recognize visuals.',
    category: 'Media & Vision',
    granted: true,
    iconName: 'Eye',
    dangerLevel: 'high',
  },
  {
    key: 'device_settings',
    title: 'Hardware & System Settings',
    description: 'Controls flashlight, vibration, volume, Wi-Fi, Bluetooth, DND, and alarms.',
    category: 'System Controls',
    granted: true,
    iconName: 'Cpu',
    dangerLevel: 'medium',
  },
  {
    key: 'location',
    title: 'Precise GPS Location',
    description: 'Provides live location coordinates for Google Maps navigation and area searches.',
    category: 'Media & Vision',
    granted: true,
    iconName: 'Navigation',
    dangerLevel: 'medium',
  },
];

const INITIAL_APPS: AppLauncherItem[] = [
  {
    id: 'app_wa',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    category: 'social',
    icon: 'MessageSquare',
    color: '#25D366',
    deepLink: 'https://web.whatsapp.com',
    installed: true,
  },
  {
    id: 'app_yt',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    category: 'media',
    icon: 'Youtube',
    color: '#FF0000',
    deepLink: 'https://youtube.com',
    installed: true,
  },
  {
    id: 'app_sp',
    name: 'Spotify',
    packageName: 'com.spotify.music',
    category: 'media',
    icon: 'Music',
    color: '#1DB954',
    deepLink: 'https://open.spotify.com',
    installed: true,
  },
  {
    id: 'app_maps',
    name: 'Google Maps',
    packageName: 'com.google.android.apps.maps',
    category: 'utilities',
    icon: 'Navigation',
    color: '#4285F4',
    deepLink: 'https://maps.google.com',
    installed: true,
  },
  {
    id: 'app_cam',
    name: 'Camera & Vision',
    packageName: 'com.android.camera',
    category: 'media',
    icon: 'Camera',
    color: '#8B5CF6',
    deepLink: '',
    installed: true,
  },
  {
    id: 'app_clock',
    name: 'Clock & Alarms',
    packageName: 'com.google.android.deskclock',
    category: 'utilities',
    icon: 'Clock',
    color: '#F59E0B',
    deepLink: '',
    installed: true,
  },
  {
    id: 'app_cal',
    name: 'Calendar & Agenda',
    packageName: 'com.google.android.calendar',
    category: 'productivity',
    icon: 'Calendar',
    color: '#EC4899',
    deepLink: '',
    installed: true,
  },
  {
    id: 'app_set',
    name: 'Phone Settings',
    packageName: 'com.android.settings',
    category: 'system',
    icon: 'Settings',
    color: '#6B7280',
    deepLink: '',
    installed: true,
  },
  {
    id: 'app_notes',
    name: 'Quick Notes',
    packageName: 'com.google.android.keep',
    category: 'productivity',
    icon: 'FileText',
    color: '#10B981',
    deepLink: '',
    installed: true,
  },
  {
    id: 'app_calc',
    name: 'Calculator',
    packageName: 'com.google.android.calculator',
    category: 'utilities',
    icon: 'Calculator',
    color: '#3B82F6',
    deepLink: 'https://www.google.com/search?q=calculator',
    installed: true,
  },
  {
    id: 'app_gallery',
    name: 'Photos & Gallery',
    packageName: 'com.google.android.apps.photos',
    category: 'media',
    icon: 'Image',
    color: '#F43F5E',
    deepLink: '',
    installed: true,
  },
  {
    id: 'app_chrome',
    name: 'Web Browser',
    packageName: 'com.android.chrome',
    category: 'utilities',
    icon: 'Globe',
    color: '#EA4335',
    deepLink: 'https://google.com',
    installed: true,
  },
];

const INITIAL_ALARMS: AlarmItem[] = [
  {
    id: 'a1',
    time: '07:00 AM',
    label: 'Morning Rise & Workout',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    enabled: true,
    type: 'alarm',
  },
  {
    id: 'a2',
    time: '08:30 AM',
    label: 'Standup Sync with Team',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    enabled: true,
    type: 'alarm',
  },
  {
    id: 'a3',
    time: '10:00 PM',
    label: 'Evening Meditation & Wind Down',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    enabled: false,
    type: 'alarm',
  },
];

const INITIAL_SMS_CONVERSATIONS: SmsConversation[] = [
  {
    id: 'sms1',
    contactName: 'Alex Rivera',
    phoneNumber: '+1 (555) 349-8821',
    avatarColor: '#8B5CF6',
    lastMessage: 'Awesome, see you there!',
    lastTime: '10:16 AM',
    unread: true,
    messages: [
      {
        id: 'm1',
        sender: 'contact',
        text: 'Hey! Are you still joining the design review at 3 PM?',
        timestamp: '10:14 AM',
        status: 'read',
      },
      {
        id: 'm2',
        sender: 'user',
        text: 'Yes! Tung Tung just set a reminder on my calendar.',
        timestamp: '10:15 AM',
        status: 'delivered',
      },
      {
        id: 'm3',
        sender: 'contact',
        text: 'Awesome, see you there!',
        timestamp: '10:16 AM',
        status: 'delivered',
      },
    ],
  },
  {
    id: 'sms2',
    contactName: 'Sarah Chen',
    phoneNumber: '+1 (555) 892-1204',
    avatarColor: '#EC4899',
    lastMessage: 'The new live voice response latency is incredible!',
    lastTime: 'Yesterday',
    unread: false,
    messages: [
      {
        id: 'm4',
        sender: 'contact',
        text: 'The new live voice response latency is incredible!',
        timestamp: 'Yesterday',
        status: 'read',
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'Thanks Sarah! Antigravity pipeline is super smooth.',
        timestamp: 'Yesterday',
        status: 'read',
      },
    ],
  },
  {
    id: 'sms3',
    contactName: 'Elena Vance',
    phoneNumber: '+1 (555) 431-7782',
    avatarColor: '#06B6D4',
    lastMessage: 'Can you send the presentation link when ready?',
    lastTime: '2 days ago',
    unread: false,
    messages: [
      {
        id: 'm6',
        sender: 'contact',
        text: 'Can you send the presentation link when ready?',
        timestamp: '2 days ago',
        status: 'read',
      },
    ],
  },
];

const INITIAL_PLAYLIST: MediaTrack[] = [
  {
    id: 't1',
    title: 'Neon Cyber Drift',
    artist: 'Tung Tung Synth Labs',
    genre: 'cyberpunk',
    duration: 180,
    coverGradient: ['#8b5cf6', '#ec4899'],
  },
  {
    id: 't2',
    title: 'Late Night Lo-Fi Focus',
    artist: 'Aura Collective',
    genre: 'lofi',
    duration: 210,
    coverGradient: ['#06b6d4', '#3b82f6'],
  },
  {
    id: 't3',
    title: 'Solar Flare Synthwave',
    artist: 'Retro Horizon',
    genre: 'synthwave',
    duration: 195,
    coverGradient: ['#f59e0b', '#ef4444'],
  },
  {
    id: 't4',
    title: 'Midnight Velvet Club',
    artist: 'Noir Soundscape',
    genre: 'midnight',
    duration: 240,
    coverGradient: ['#10b981', '#06b6d4'],
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    app: 'WhatsApp',
    sender: 'Alex Rivera',
    message: 'Hey! Are we still syncing on the AI architecture today at 3?',
    time: '2m ago',
    autoReplied: false,
  },
  {
    id: 'n2',
    app: 'Slack',
    sender: 'Dev Ops Team',
    message: 'Production container build green. Ingress routing is stable.',
    time: '15m ago',
    autoReplied: true,
    replyText: 'Awesome work team! Telemetry looks pristine.',
  },
  {
    id: 'n3',
    app: 'Instagram',
    sender: 'Elena Vance',
    message: 'Loved your new live demo! Send me the link when free.',
    time: '1h ago',
    autoReplied: false,
  },
];

const INITIAL_CALENDAR: CalendarEvent[] = [
  {
    id: 'c1',
    title: 'Quantum Architecture Sync',
    time: 'Today 3:00 PM',
    category: 'work',
    completed: false,
  },
  {
    id: 'c2',
    title: 'Evening HIIT Workout',
    time: 'Today 6:30 PM',
    category: 'gym',
    completed: false,
  },
  {
    id: 'c3',
    title: 'Dinner with Sarah @ Bistro',
    time: 'Tonight 8:30 PM',
    category: 'date',
    completed: false,
  },
];

const INITIAL_CONTACTS: ContactItem[] = [
  {
    id: 'ct1',
    name: 'Alex Rivera',
    role: 'Lead Architect',
    phone: '+1 (555) 349-8821',
    avatarColor: '#8b5cf6',
    favorite: true,
  },
  {
    id: 'ct2',
    name: 'Sarah Chen',
    role: 'Product Lead',
    phone: '+1 (555) 892-1204',
    avatarColor: '#ec4899',
    favorite: true,
  },
  {
    id: 'ct3',
    name: 'Elena Vance',
    role: 'Design Director',
    phone: '+1 (555) 431-7782',
    avatarColor: '#06b6d4',
    favorite: false,
  },
  {
    id: 'ct4',
    name: 'Mom',
    role: 'Family',
    phone: '+1 (555) 902-3341',
    avatarColor: '#f59e0b',
    favorite: true,
  },
];

export function App() {
  // Atmosphere Theme State
  const [currentThemeId, setCurrentThemeId] = useState<AtmosphereTheme>('electric-violet');
  const theme = THEME_PRESETS[currentThemeId] || THEME_PRESETS['electric-violet'];

  // Live Session Voice State
  const [state, setState] = useState<LiveState>('disconnected');
  const [selectedVoice, setSelectedVoice] = useState<string>('Aoede');
  const [toolEvents, setToolEvents] = useState<ToolExecutionEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // System Permissions State
  const [permissions, setPermissions] = useState<PermissionDefinition[]>(INITIAL_PERMISSIONS);
  const [pendingPermissionKey, setPendingPermissionKey] = useState<string | null>(null);

  // Modals & Screen Overlays
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isAlarmsModalOpen, setIsAlarmsModalOpen] = useState(false);
  const [isDialerModalOpen, setIsDialerModalOpen] = useState(false);
  const [isWakeWordModalOpen, setIsWakeWordModalOpen] = useState(false);
  const [isCinematicEditorOpen, setIsCinematicEditorOpen] = useState(false);
  const [cinematicInitialCommand, setCinematicInitialCommand] = useState<string>('');

  // Hands-Free Wake Word State
  const [wakeWordConfig, setWakeWordConfig] = useState<WakeWordConfig>(() => {
    const saved = localStorage.getItem('moon_wakeword_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      enabled: false,
      activeWakeWord: 'Hey Moon',
      wakeWords: ['Hey Moon', 'Moon', 'Ok Moon', 'Konnichiwa Moon', 'Suno Moon', 'Namaste Moon', 'Hi Moon'],
      customWakeWords: [],
      sensitivity: 'medium',
      autoStartSession: true,
      playWakeChime: true,
      hapticFeedback: true,
    };
  });
  const [isWakeWordListening, setIsWakeWordListening] = useState<boolean>(false);
  const [lastWakeEvent, setLastWakeEvent] = useState<WakeWordEvent | null>(null);

  const wakeWordConfigRef = useRef(wakeWordConfig);
  wakeWordConfigRef.current = wakeWordConfig;
  const stateRef = useRef(state);
  stateRef.current = state;

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPromptsDrawerOpen, setIsPromptsDrawerOpen] = useState(false);
  const [isVisionOverlayOpen, setIsVisionOverlayOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [phoneFiles, setPhoneFiles] = useState<PhoneFileItem[]>(INITIAL_PHONE_FILES);

  // Biometric & WebAuthn Security State
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => biometricAuthInstance.isAppLocked());
  const [sensitiveAuthAction, setSensitiveAuthAction] = useState<{
    title?: string;
    reason: string;
    onAuthorized: () => void;
  } | null>(null);

  const guardSensitiveAction = useCallback((reason: string, action: () => void, title?: string) => {
    const cfg = biometricAuthInstance.getConfig();
    if (cfg.protectSensitiveControls) {
      setSensitiveAuthAction({ title, reason, onAuthorized: action });
    } else {
      action();
    }
  }, []);

  const handleQuickLock = useCallback(() => {
    setIsAppLocked(true);
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
      setState('disconnected');
    }
  }, []);

  // Audio & Visualization Levels
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [activeDialogue, setActiveDialogue] = useState<string>('Konnichiwa! I am Moon, your anime AI assistant avatar! ✨');
  const [expressionOverride, setExpressionOverride] = useState<AvatarExpression | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<CharacterAnimation>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Media Playback State
  const [playlist] = useState<MediaTrack[]>(INITIAL_PLAYLIST);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.7);

  // Autonomous Calls & Notifications State
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Phone Control State Collections
  const [apps] = useState<AppLauncherItem[]>(INITIAL_APPS);
  const [alarms, setAlarms] = useState<AlarmItem[]>(INITIAL_ALARMS);
  const [smsConversations, setSmsConversations] = useState<SmsConversation[]>(INITIAL_SMS_CONVERSATIONS);

  // Hardware State
  const [hardware, setHardware] = useState<HardwareState>({
    flashlight: false,
    vibrating: false,
    battery: 88,
    isCharging: true,
    wifi: true,
    bluetooth: true,
    brightness: 85,
    volume: 75,
    ringtoneVolume: 80,
    dnd: false,
    airplaneMode: false,
    hotspot: false,
    location: true,
    darkMode: true,
  });

  // Calendar & Contacts State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR);
  const [contacts, setContacts] = useState<ContactItem[]>(INITIAL_CONTACTS);

  // Services
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const visionManagerRef = useRef<ScreenVisionManager>(new ScreenVisionManager());
  const synthPlayerRef = useRef<AudioSynthPlayer>(new AudioSynthPlayer());
  const wakeWordManagerRef = useRef<WakeWordManager | null>(null);

  // Permission Checks & Updaters
  const checkPermission = useCallback((key: string): boolean => {
    const perm = permissions.find((p) => p.key === key);
    return perm ? perm.granted : false;
  }, [permissions]);

  const handleTogglePermission = useCallback((key: string, granted: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => (p.key === key ? { ...p, granted } : p))
    );
  }, []);

  const handleGrantAllPermissions = useCallback(() => {
    setPermissions((prev) => prev.map((p) => ({ ...p, granted: true })));
  }, []);

  const handleResetPermissions = useCallback(() => {
    setPermissions(INITIAL_PERMISSIONS);
  }, []);

  // Direct Redirection to Feature Associated with a Permission
  const handleRedirectToPermissionFeature = useCallback(
    (key: string) => {
      // Close permission inspection surfaces
      setIsPermissionsModalOpen(false);
      setIsSettingsModalOpen(false);
      setPendingPermissionKey(null);

      switch (key) {
        case 'biometric_auth':
          setIsSettingsModalOpen(true);
          break;
        case 'wake_word':
          setIsWakeWordModalOpen(true);
          break;
        case 'microphone':
          if (state === 'disconnected') {
            if (liveSessionRef.current) {
              liveSessionRef.current.connect().catch((err) => {
                console.error('Mic auto-connect error:', err);
              });
            }
          } else {
            setIsSettingsModalOpen(true);
          }
          break;
        case 'camera_screen':
          setIsVisionOverlayOpen(true);
          break;
        case 'phone_calls':
          guardSensitiveAction(
            'Authenticate with Biometrics to access Dialer & Telephony',
            () => setIsDialerModalOpen(true),
            'Phone Dialer Access'
          );
          break;
        case 'sms_messaging':
          guardSensitiveAction(
            'Authenticate with Biometrics to view SMS & WhatsApp Conversations',
            () => setIsSmsModalOpen(true),
            'SMS Messages Access'
          );
          break;
        case 'notifications':
          setIsNotificationModalOpen(true);
          break;
        case 'contacts':
          guardSensitiveAction(
            'Authenticate with Biometrics to view Phone Contacts & Address Book',
            () => setIsContactsModalOpen(true),
            'Contacts Access'
          );
          break;
        case 'device_settings':
          guardSensitiveAction(
            'Authenticate with Biometrics to access Device Hardware Controls',
            () => setIsHardwareModalOpen(true),
            'Hardware Controls Access'
          );
          break;
        case 'location':
          guardSensitiveAction(
            'Authenticate with Biometrics to access GPS Navigation Controls',
            () => setIsHardwareModalOpen(true),
            'GPS Controls Access'
          );
          break;
        case 'accessibility':
          guardSensitiveAction(
            'Authenticate with Biometrics to open Application Matrix & Accessibility Automation',
            () => setIsAppsModalOpen(true),
            'Accessibility Service Access'
          );
          break;
        case 'storage_files':
          guardSensitiveAction(
            'Authenticate with Biometrics to view Phone Files and Internal Storage',
            () => setIsFileManagerOpen(true),
            'File System Access'
          );
          break;
        case 'display_over_apps':
          triggerNativePermissionRequest('display_over_apps');
          overlayService.toggleSimulatedBackground();
          setActiveDialogue('✨ Display Over Other Apps & Edge Aura: Screen borders are now animating translucent water bubbles & blooming floral petals with JARVIS/IRIS-X active badge.');
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          break;
        case 'background_activity':
          setIsWakeWordModalOpen(true);
          break;
        default:
          break;
      }
    },
    [state, guardSensitiveAction]
  );

  // Grant Permission and Auto-Redirect to the Requesting/Target Feature
  const handleGrantPermissionAndRedirect = useCallback(
    (key: string, redirect: boolean = true) => {
      handleTogglePermission(key, true);
      setPendingPermissionKey(null);

      const routeInfo = getPermissionRouteInfo(key);
      setActiveDialogue(
        `✨ ${routeInfo.featureTitle} permission granted! ${redirect ? 'Opening ' + routeInfo.featureBadge + '...' : ''}`
      );

      setToolEvents((prev) => [
        {
          toolName: 'permission_granted',
          category: 'telephony',
          summary: `Granted "${routeInfo.featureTitle}" authority${redirect ? ' ➔ Redirected to ' + routeInfo.featureBadge : ''}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'completed',
          data: { permissionKey: key, targetBadge: routeInfo.featureBadge },
        },
        ...prev.slice(0, 15),
      ]);

      if (redirect) {
        setTimeout(() => {
          handleRedirectToPermissionFeature(key);
        }, 120);
      }
    },
    [handleTogglePermission, handleRedirectToPermissionFeature]
  );

  // Music Playback Handlers
  const handleToggleMusic = useCallback(() => {
    if (isPlayingMusic) {
      synthPlayerRef.current.pauseTrack();
      setIsPlayingMusic(false);
    } else {
      const track = playlist[currentTrackIndex];
      synthPlayerRef.current.playTrack(track.genre);
      setIsPlayingMusic(true);
    }
  }, [isPlayingMusic, currentTrackIndex, playlist]);

  const handleNextMusic = useCallback(() => {
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlayingMusic) {
      synthPlayerRef.current.playTrack(playlist[nextIdx].genre);
    }
  }, [currentTrackIndex, playlist, isPlayingMusic]);

  const handlePrevMusic = useCallback(() => {
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrackIndex(prevIdx);
    if (isPlayingMusic) {
      synthPlayerRef.current.playTrack(playlist[prevIdx].genre);
    }
  }, [currentTrackIndex, playlist, isPlayingMusic]);

  const handleSelectTrack = useCallback((track: MediaTrack) => {
    const idx = playlist.findIndex((t) => t.id === track.id);
    if (idx >= 0) {
      setCurrentTrackIndex(idx);
      synthPlayerRef.current.playTrack(track.genre);
      setIsPlayingMusic(true);
    }
  }, [playlist]);

  const handleVolumeChange = useCallback((vol: number) => {
    setMusicVolume(vol);
    synthPlayerRef.current.setVolume(vol);
  }, []);

  // Hardware Actions
  const handleToggleFlashlight = useCallback(() => {
    setHardware((prev) => ({ ...prev, flashlight: !prev.flashlight }));
  }, []);

  const handleToggleVibrate = useCallback(() => {
    setHardware((prev) => ({ ...prev, vibrating: true }));
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    setTimeout(() => {
      setHardware((prev) => ({ ...prev, vibrating: false }));
    }, 800);
  }, []);

  // App Launcher Handler
  const handleLaunchApp = useCallback((app: AppLauncherItem) => {
    if (app.deepLink) {
      window.open(app.deepLink, '_blank', 'noopener,noreferrer');
    } else if (app.name.toLowerCase().includes('camera')) {
      setIsVisionOverlayOpen(true);
    } else if (app.name.toLowerCase().includes('clock')) {
      setIsAlarmsModalOpen(true);
    } else if (app.name.toLowerCase().includes('calendar')) {
      setIsCalendarModalOpen(true);
    } else if (app.name.toLowerCase().includes('setting')) {
      setIsHardwareModalOpen(true);
    } else if (app.name.toLowerCase().includes('calculator')) {
      window.open('https://www.google.com/search?q=calculator', '_blank');
    }
  }, []);

  // Call Handlers
  const handleTriggerTestCall = useCallback((callerName = 'Engineering Lead', callerNumber = '+1 (555) 492-0199') => {
    const newCall: IncomingCall = {
      id: `${Date.now()}`,
      callerName,
      callerNumber,
      status: 'ringing',
      timestamp: new Date().toLocaleTimeString(),
    };
    setActiveCall(newCall);
    setIsCallModalOpen(true);
  }, []);

  const handleAnswerCall = useCallback((callId: string) => {
    setActiveCall((prev) => (prev && prev.id === callId ? { ...prev, status: 'answered' } : prev));
  }, []);

  const handleRejectCall = useCallback((callId: string, sms?: string) => {
    setActiveCall((prev) =>
      prev && prev.id === callId ? { ...prev, status: 'rejected', autoRejectionSms: sms } : prev
    );
  }, []);

  const handleRoxyScreenCall = useCallback((callId: string) => {
    setActiveCall((prev) =>
      prev && prev.id === callId ? { ...prev, status: 'screened_by_tung_tung' } : prev
    );
  }, []);

  // SMS Handler
  const handleSendSms = useCallback((conversationId: string, text: string) => {
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered' as const,
    };
    setSmsConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: text,
              lastTime: 'Just now',
              messages: [...c.messages, newMessage],
            }
          : c
      )
    );
  }, []);

  // Auto-closure / Sleep Mode Handler
  const handleCloseSession = useCallback((reason = 'auto_closure', farewellMessage?: string) => {
    const farewell = farewellMessage || '😴 Oyasuminasai! Moon is going to sleep... Bye bye! 💤✨';
    setActiveDialogue(farewell);
    setCurrentAnimation('sleepy');
    setExpressionOverride('sleeping');
    
    // Play gentle soothing sleep chime
    if (audioStreamerRef.current) {
      audioStreamerRef.current.playChime('disconnect');
    }

    if (navigator.vibrate) {
      try {
        navigator.vibrate([100, 60, 100]);
      } catch (e) {}
    }

    setToolEvents((prev) => [
      {
        id: `${Date.now()}`,
        name: 'closeSession',
        args: { reason, farewellMessage: farewell },
        result: `Auto-Closure: Moon is sleeping (${reason})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'action',
      },
      ...prev.slice(0, 19),
    ]);

    // Disconnect live session
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
    }
  }, []);

  const handleAvatarDoubleClick = useCallback(() => {
    if (stateRef.current !== 'disconnected') {
      handleCloseSession('3D Character Double-Click');
    } else {
      setCurrentAnimation('sleepy');
      setExpressionOverride('sleeping');
      setActiveDialogue('😴 Moon is resting peacefully! Tap microphone or say "Hey Moon" to wake me up! 🌸✨');
      setTimeout(() => {
        setExpressionOverride(null);
        setCurrentAnimation('idle');
      }, 3500);
    }
  }, [handleCloseSession]);

  // Initialize Services Once
  useEffect(() => {
    const streamer = new AudioStreamer();
    audioStreamerRef.current = streamer;

    const session = new LiveSession(streamer, {
      onStateChange: (newState) => {
        setState(newState);
      },
      onToolExecuted: (event) => {
        setToolEvents((prev) => [...prev.slice(-4), event]);
      },
      onError: (err) => {
        setErrorMessage(err);
        setTimeout(() => setErrorMessage(null), 5000);
      },
      onThemeChange: (newTheme) => {
        if (newTheme in THEME_PRESETS) {
          setCurrentThemeId(newTheme as AtmosphereTheme);
        }
      },
      onScreenAnalyzeRequested: () => {
        setIsVisionOverlayOpen(true);
      },
      onDialogueUpdate: (msg) => {
        setActiveDialogue(msg);
      },
      onPermissionCheck: (permKey: string) => {
        return checkPermission(permKey);
      },
      onPermissionRequested: (permKey: string) => {
        setPendingPermissionKey(permKey);
      },
      onMediaAction: (action, trackName, vol) => {
        if (action === 'play' || action === 'toggle') {
          const track = playlist[0];
          synthPlayerRef.current.playTrack(track.genre);
          setIsPlayingMusic(true);
        } else if (action === 'pause') {
          synthPlayerRef.current.pauseTrack();
          setIsPlayingMusic(false);
        } else if (action === 'next') {
          handleNextMusic();
        }
        if (vol !== undefined) {
          handleVolumeChange(vol / 100);
        }
      },
      onHardwareAction: (feature, actionState, value) => {
        if (feature === 'flashlight') {
          setHardware((prev) => ({ ...prev, flashlight: actionState === 'on' ? true : actionState === 'off' ? false : !prev.flashlight }));
        } else if (feature === 'haptics') {
          handleToggleVibrate();
        } else if (feature === 'wifi') {
          setHardware((prev) => ({ ...prev, wifi: actionState === 'on' }));
        } else if (feature === 'bluetooth') {
          setHardware((prev) => ({ ...prev, bluetooth: actionState === 'on' }));
        } else if (feature === 'dnd') {
          setHardware((prev) => ({ ...prev, dnd: actionState === 'on' }));
        } else if (feature === 'airplane_mode') {
          setHardware((prev) => ({ ...prev, airplaneMode: actionState === 'on' }));
        } else if (feature === 'hotspot') {
          setHardware((prev) => ({ ...prev, hotspot: actionState === 'on' }));
        } else if (feature === 'location') {
          setHardware((prev) => ({ ...prev, location: actionState === 'on' }));
        } else if (feature === 'dark_mode') {
          setHardware((prev) => ({ ...prev, darkMode: actionState === 'on' }));
        } else if (feature === 'volume' && value !== undefined) {
          setHardware((prev) => ({ ...prev, volume: value }));
        } else if (feature === 'brightness' && value !== undefined) {
          setHardware((prev) => ({ ...prev, brightness: value }));
        }
      },
      onSmsAction: (recipient, message) => {
        // Send SMS to recipient
        const targetConv = smsConversations.find(
          (c) => c.contactName.toLowerCase().includes(recipient.toLowerCase()) || c.phoneNumber.includes(recipient)
        );
        if (targetConv) {
          handleSendSms(targetConv.id, message);
        } else {
          // create new thread
          const newThread: SmsConversation = {
            id: `sms_${Date.now()}`,
            contactName: recipient,
            phoneNumber: '+1 (555) 000-0000',
            avatarColor: '#8B5CF6',
            lastMessage: message,
            lastTime: 'Just now',
            unread: false,
            messages: [
              {
                id: `msg_${Date.now()}`,
                sender: 'user',
                text: message,
                timestamp: 'Just now',
                status: 'delivered',
              },
            ],
          };
          setSmsConversations((prev) => [newThread, ...prev]);
        }
        setIsSmsModalOpen(true);
      },
      onAppLaunch: (appName) => {
        const app = apps.find((a) => a.name.toLowerCase().includes(appName.toLowerCase()));
        if (app) {
          handleLaunchApp(app);
        } else {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(appName)}`, '_blank');
        }
      },
      onAlarmAction: (action, time, label) => {
        if (action === 'set_alarm' || action === 'set_timer') {
          const newAlarm: AlarmItem = {
            id: `alarm_${Date.now()}`,
            time: time || '07:30 AM',
            label: label || 'Tung Tung Alert',
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            enabled: true,
            type: action === 'set_timer' ? 'timer' : 'alarm',
          };
          setAlarms((prev) => [newAlarm, ...prev]);
        }
        setIsAlarmsModalOpen(true);
      },
      onNotificationAction: (action, replyText) => {
        if (action === 'clear_all') {
          setNotifications([]);
        } else if (action === 'auto_reply') {
          setNotifications((prev) =>
            prev.map((n) => ({
              ...n,
              autoReplied: true,
              replyText: replyText || 'Tung Tung handled this notification seamlessly ✨',
            }))
          );
        }
        setIsNotificationModalOpen(true);
      },
      onWhatsAppAction: (name, phone, msg) => {
        const waUrl = phone
          ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
          : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      },
      onCallAction: (action, contactName, rejectionSms) => {
        if (action === 'screen_call') {
          if (activeCall) {
            handleRoxyScreenCall(activeCall.id);
          } else {
            handleTriggerTestCall(contactName || 'Caller');
          }
        } else if (action === 'answer' && activeCall) {
          handleAnswerCall(activeCall.id);
        } else if (action === 'reject_with_sms' && activeCall) {
          handleRejectCall(activeCall.id, rejectionSms);
        } else if (action === 'dial_contact') {
          handleTriggerTestCall(contactName || 'Alex Rivera');
        }
      },
      onCalendarAction: (action, title, time) => {
        if (action === 'add_event' && title) {
          setCalendarEvents((prev) => [
            ...prev,
            {
              id: `${Date.now()}`,
              title,
              time: time || 'Tomorrow 3:00 PM',
              category: 'work',
              completed: false,
            },
          ]);
        }
        setIsCalendarModalOpen(true);
      },
      onContactsAction: (action, name) => {
        setIsContactsModalOpen(true);
      },
      onCloseSession: (farewellMessage) => {
        handleCloseSession('Voice command (so jao / band ho jao / sleep)', farewellMessage);
      },
      onVideoEditorAction: (options) => {
        setIsCinematicEditorOpen(true);
        if (options?.command) {
          setCinematicInitialCommand(options.command);
        } else if (options?.mood) {
          setCinematicInitialCommand(`Jarvis, ${options.mood} video banao, aspect ratio ${options.aspectRatio || '9:16'}`);
        }
      },
    });

    liveSessionRef.current = session;

    return () => {
      session.disconnect();
      synthPlayerRef.current.stopTrack();
    };
  }, [playlist, activeCall, apps, checkPermission, handleAnswerCall, handleNextMusic, handleRejectCall, handleRoxyScreenCall, handleSendSms, handleLaunchApp, handleToggleVibrate, handleTriggerTestCall, handleVolumeChange, smsConversations, handleCloseSession]);

  // Update Voice Profile in Session
  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.setVoice(selectedVoice);
    }
  }, [selectedVoice]);

  // 60fps Audio Metrics & Live Session State Sync with Overlay Service
  useEffect(() => {
    let animFrameId: number;

    // Trigger overlay appearance on session start, and removal on session stop
    const hasOverlayPerm = checkPermission('display_over_apps');
    if (state !== 'disconnected') {
      overlayService.notifySessionStart(hasOverlayPerm).catch((e) => {
        console.warn('Error starting overlay session:', e);
      });
    } else {
      overlayService.notifySessionStop().catch((e) => {
        console.warn('Error stopping overlay session:', e);
      });
    }

    const updateAudioMetrics = () => {
      if (audioStreamerRef.current && state !== 'disconnected') {
        const inVol = audioStreamerRef.current.getInputVolume();
        const outVol = audioStreamerRef.current.getOutputVolume();
        const currentLevel = state === 'speaking' ? outVol : inVol;
        setAudioLevel(currentLevel);
      } else {
        setAudioLevel(0);
      }
      animFrameId = requestAnimationFrame(updateAudioMetrics);
    };

    animFrameId = requestAnimationFrame(updateAudioMetrics);
    return () => cancelAnimationFrame(animFrameId);
  }, [state, checkPermission]);

  // Toggle Live Session
  const handleToggleSession = useCallback(async () => {
    if (!liveSessionRef.current) return;

    if (state === 'disconnected') {
      if (!checkPermission('microphone')) {
        setPendingPermissionKey('microphone');
        return;
      }
      // Check display_over_apps permission before session start
      if (!checkPermission('display_over_apps')) {
        triggerNativePermissionRequest('display_over_apps');
        setPendingPermissionKey('display_over_apps');
      }
      try {
        await liveSessionRef.current.connect();
      } catch (err: any) {
        console.error('Failed to start session:', err);
      }
    } else {
      liveSessionRef.current.disconnect();
    }
  }, [state, checkPermission]);

  // Handle direct text prompt submission
  const handleSendText = useCallback((text: string) => {
    if (!text.trim()) return;
    setActiveDialogue(text);
    liveSessionRef.current?.sendTextMessage(text);
  }, []);

  // Handle speaker audio mute toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && liveSessionRef.current) {
        liveSessionRef.current.clearTtsQueue();
      }
      return next;
    });
  }, []);

  // Audio Visualizer getter
  const getVisualizerData = useCallback(() => {
    if (!audioStreamerRef.current) return new Uint8Array(64);
    return audioStreamerRef.current.getVisualizerData('combined');
  }, []);

  // Play test wake chime
  const handlePlayWakeChime = useCallback(() => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.playChime('wake');
    }
  }, []);

  // Update Wake Word Configuration
  const handleUpdateWakeWordConfig = useCallback((updates: Partial<WakeWordConfig>) => {
    setWakeWordConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('moon_wakeword_config', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Wake Word Detected Handler
  const handleWakeWordDetected = useCallback(
    (event: WakeWordEvent) => {
      const cfg = wakeWordConfigRef.current;
      setLastWakeEvent(event);

      // 1. Play magical chime if enabled
      if (cfg.playWakeChime && audioStreamerRef.current) {
        audioStreamerRef.current.playChime('wake');
      }

      // 2. Trigger Haptic Vibration if enabled
      if (cfg.hapticFeedback && navigator.vibrate) {
        try {
          navigator.vibrate([100, 60, 100]);
        } catch {
          // ignore
        }
      }

      const word = event.matchedWord || event.wakeWord;

      // 3. Interactive avatar visual reaction
      setActiveDialogue(`✨ Wake phrase "${word}" heard! I'm here! ✨`);
      setExpressionOverride('surprised');
      setTimeout(() => {
        setExpressionOverride('happy');
        setTimeout(() => setExpressionOverride(null), 3000);
      }, 1200);

      // 4. Action Toast event
      setToolEvents((prev) => [
        {
          toolName: 'wake_word_detected',
          category: 'telephony',
          summary: `Wake Word "${word}" activated hands-free!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'completed',
          data: { matchedWord: word, rawTranscript: event.rawTranscript || word },
        },
        ...prev.slice(0, 15),
      ]);

      // 5. Connect voice session automatically if disconnected
      if (cfg.autoStartSession && liveSessionRef.current && stateRef.current === 'disconnected') {
        if (!checkPermission('display_over_apps')) {
          triggerNativePermissionRequest('display_over_apps');
          setPendingPermissionKey('display_over_apps');
        }
        liveSessionRef.current.connect().catch((err) => {
          console.error('Hands-free auto-connect error:', err);
        });
      }
    },
    [checkPermission]
  );

  const handleWakeWordDetectedCallbackRef = useRef(handleWakeWordDetected);
  handleWakeWordDetectedCallbackRef.current = handleWakeWordDetected;

  // Initialize WakeWordManager once on mount
  useEffect(() => {
    const manager = new WakeWordManager({
      onWakeWordDetected: (event) => {
        if (handleWakeWordDetectedCallbackRef.current) {
          handleWakeWordDetectedCallbackRef.current(event);
        }
      },
      onListeningStateChange: (listening) => {
        setIsWakeWordListening(listening);
      },
      onError: (err) => {
        console.warn('WakeWordManager notice:', err);
      },
    });

    wakeWordManagerRef.current = manager;

    return () => {
      manager.stop();
      wakeWordManagerRef.current = null;
    };
  }, []);

  // Synchronize wake-word lifecycle with session state and user configuration
  // CRITICAL: When live session is active (state !== 'disconnected'), WakeWordManager is 100% STOPPED
  // so that the microphone belongs entirely to Gemini Live AudioStreamer with ZERO on/off interruptions.
  useEffect(() => {
    const manager = wakeWordManagerRef.current;
    if (!manager) return;

    manager.updateConfig(wakeWordConfig);

    if (state !== 'disconnected') {
      // Live voice session is actively running: STOP wake-word listener completely to prevent mic hardware contention
      manager.stop();
      setIsWakeWordListening(false);
    } else {
      // Disconnected / Standby: run wake word if explicitly enabled and permitted
      if (wakeWordConfig.enabled && checkPermission('wake_word') && checkPermission('microphone')) {
        manager.start();
      } else {
        manager.stop();
        setIsWakeWordListening(false);
      }
    }
  }, [state, wakeWordConfig, checkPermission]);

  const isConnected = state !== 'disconnected';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const unreadCount = notifications.filter((n) => !n.autoReplied).length;
  const activePermissionsCount = permissions.filter((p) => p.granted).length;

  const pendingPermission = permissions.find((p) => p.key === pendingPermissionKey);

  return (
    <div
      id="app-root-container"
      className="min-h-screen w-full flex flex-col items-center justify-between relative overflow-x-hidden bg-[#0A0A0E] text-white select-none transition-colors duration-700 font-sans"
      style={{
        background: theme.bgGradient,
        filter: `brightness(${hardware.brightness}%)`,
      }}
    >
      {/* Full-Screen High-Beam Torch Illumination Overlay when Flashlight is ON */}
      {hardware.flashlight && (
        <div
          id="hardware-flashlight-torch-beam"
          className="fixed inset-0 z-40 bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-black animate-in fade-in duration-300"
        >
          <div className="text-center space-y-4 max-w-xs">
            <div className="w-20 h-20 rounded-full bg-amber-400 mx-auto flex items-center justify-center shadow-[0_0_80px_#f59e0b] animate-pulse">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-mono font-bold uppercase tracking-wider">
              Torch High-Beam Active
            </h2>
            <p className="text-xs font-mono text-black/70">
              Screen is providing maximum lumen output. Tap below to toggle off.
            </p>
            <button
              onClick={handleToggleFlashlight}
              className="px-6 py-2.5 rounded-full bg-black text-white font-mono font-bold text-xs uppercase tracking-wider shadow-2xl cursor-pointer"
            >
              Turn Off Flashlight
            </button>
          </div>
        </div>
      )}

      {/* Ambient Particle Mesh & Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.glow} 0%, transparent 60%)`,
        }}
      />

      {/* Cyber Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Mobile/Desktop Shell */}
      <div className="w-full max-w-lg min-h-screen flex flex-col justify-between relative z-10 px-3 sm:px-4 py-3 sm:py-4">
        {/* Top Header & Autonomous Tool Strip */}
        <TopBar
          state={state}
          theme={theme}
          unreadCount={unreadCount}
          isCallRinging={Boolean(activeCall && activeCall.status === 'ringing')}
          isVisionActive={visionManagerRef.current.getIsCapturing()}
          activePermissionsCount={activePermissionsCount}
          totalPermissionsCount={permissions.length}
          wakeWordConfig={wakeWordConfig}
          isWakeWordListening={isWakeWordListening}
          isBiometricLocked={isAppLocked}
          onQuickLock={handleQuickLock}
          onOpenBiometrics={() => setIsSettingsModalOpen(true)}
          onOpenWakeWord={() => {
            if (!checkPermission('wake_word')) {
              setPendingPermissionKey('wake_word');
            } else {
              setIsWakeWordModalOpen(true);
            }
          }}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenThemes={() => setIsThemeModalOpen(true)}
          onOpenPrompts={() => setIsPromptsDrawerOpen(true)}
          onOpenVision={() => {
            if (!checkPermission('camera_screen')) {
              setPendingPermissionKey('camera_screen');
            } else {
              setIsVisionOverlayOpen(true);
            }
          }}
          onOpenMedia={() => setIsMediaModalOpen(true)}
          onOpenCalls={() => {
            if (!checkPermission('phone_calls')) {
              setPendingPermissionKey('phone_calls');
            } else {
              guardSensitiveAction(
                'Authenticate with Biometrics to access Dialer & Telephony',
                () => setIsDialerModalOpen(true),
                'Phone Dialer Access'
              );
            }
          }}
          onOpenNotifications={() => {
            if (!checkPermission('notifications')) {
              setPendingPermissionKey('notifications');
            } else {
              setIsNotificationModalOpen(true);
            }
          }}
          onOpenHardware={() => {
            if (!checkPermission('device_settings')) {
              setPendingPermissionKey('device_settings');
            } else {
              guardSensitiveAction(
                'Authenticate with Biometrics to access Device Hardware Controls',
                () => setIsHardwareModalOpen(true),
                'Hardware Controls Access'
              );
            }
          }}
          onOpenCalendar={() => setIsCalendarModalOpen(true)}
          onOpenContacts={() => {
            if (!checkPermission('contacts')) {
              setPendingPermissionKey('contacts');
            } else {
              guardSensitiveAction(
                'Authenticate with Biometrics to view Phone Contacts & Address Book',
                () => setIsContactsModalOpen(true),
                'Contacts Access'
              );
            }
          }}
          onOpenCinematicEditor={() => setIsCinematicEditorOpen(true)}
          onOpenPermissions={() => setIsPermissionsModalOpen(true)}
          onOpenApps={() => {
            if (!checkPermission('accessibility')) {
              setPendingPermissionKey('accessibility');
            } else {
              guardSensitiveAction(
                'Authenticate with Biometrics to open Application Matrix',
                () => setIsAppsModalOpen(true),
                'App Matrix Access'
              );
            }
          }}
          onOpenSms={() => {
            if (!checkPermission('sms_messaging')) {
              setPendingPermissionKey('sms_messaging');
            } else {
              guardSensitiveAction(
                'Authenticate with Biometrics to view SMS & WhatsApp Conversations',
                () => setIsSmsModalOpen(true),
                'SMS Messages Access'
              );
            }
          }}
          onOpenAlarms={() => setIsAlarmsModalOpen(true)}
          onOpenFiles={() => {
            if (!checkPermission('storage_files')) {
              setPendingPermissionKey('storage_files');
            } else {
              guardSensitiveAction(
                'Authenticate with Biometrics to access Phone Files & Storage',
                () => setIsFileManagerOpen(true),
                'File Manager Access'
              );
            }
          }}
          onToggleEdgeOverlay={() => {
            const isSim = overlayService.toggleSimulatedBackground();
            setActiveDialogue(
              isSim
                ? '🌸 Edge Aura Background Simulation ACTIVE: Ascending water bubbles & blooming petals running with JARVIS/IRIS-X badge.'
                : '🌸 Edge Aura Active: Ascending bubbles and blooming floral petals running over screen edges.'
            );
          }}
        />

        {/* Real-time Tool Execution Toasts */}
        <ActionToast
          events={toolEvents}
          theme={theme}
          onClear={() => setToolEvents([])}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-auto my-2 px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between gap-2 max-w-sm animate-in fade-in">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-white/60 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Center Stage: Interactive Anime Avatar */}
        <main className="flex-1 flex flex-col items-center justify-center my-2 relative">
          {/* Subtle Persona Badge */}
          <div className="mb-2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: isSpeaking
                  ? theme.primary
                  : isListening
                  ? '#10B981'
                  : state === 'thinking'
                  ? '#F59E0B'
                  : 'rgba(255,255,255,0.4)',
              }}
            />
            <span className="text-[10px] font-mono tracking-widest text-white/90 uppercase font-semibold">
              {isSpeaking
                ? 'MOON • SPEAKING'
                : isListening
                ? 'MOON • LISTENING TO YOU'
                : state === 'thinking'
                ? 'MOON • THINKING'
                : state === 'processing'
                ? 'MOON • EXECUTING ACTION'
                : state === 'connecting'
                ? 'MOON • CONNECTING'
                : 'MOON • STANDBY'}
            </span>
          </div>

          {/* Interactive Expressive Anime Character Avatar */}
          <AnimeAvatar
            state={state}
            theme={theme}
            audioLevel={audioLevel}
            activeDialogue={activeDialogue}
            onAvatarClick={() => {
              if (!isConnected) {
                handleToggleSession();
              }
            }}
            onAvatarDoubleClick={handleAvatarDoubleClick}
            onTriggerVoice={handleToggleSession}
            expressionOverride={expressionOverride}
            animation={currentAnimation}
          />
        </main>

        {/* Bottom Control Deck: Mic, Text Input, Mute, Emotes, and Vision */}
        <footer className="w-full pb-2 flex flex-col items-center space-y-2 mt-1">
          <AvatarControlDock
            state={state}
            theme={theme}
            audioLevel={audioLevel}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onToggleVoice={handleToggleSession}
            onSendText={handleSendText}
            onTriggerVision={() => setIsVisionOverlayOpen(true)}
            onSetExpressionOverride={setExpressionOverride}
            currentExpressionOverride={expressionOverride}
            currentAnimation={currentAnimation}
            onSetAnimation={setCurrentAnimation}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenPrompts={() => setIsPromptsDrawerOpen(true)}
            wakeWordConfig={wakeWordConfig}
            onOpenWakeWord={() => setIsWakeWordModalOpen(true)}
          />

          {/* Bottom Telemetry Bar */}
          <div className="flex items-center justify-between w-full max-w-xs px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-white/40">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-pink-400" /> Live Audio 24kHz
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> {activePermissionsCount}/{permissions.length} Perms Active
            </span>
          </div>
        </footer>
      </div>

      {/* Edge Water Bubbles, Blooming Floral Petals & JARVIS/IRIS-X Background Overlay */}
      <CustomOverlay
        hasOverlayPermission={checkPermission('display_over_apps')}
        onOpenPermissionModal={() => setIsPermissionsModalOpen(true)}
      />

      {/* Persistent Floating Overlay HUD (Floating Island / Mini Arc) */}
      <FloatingOverlay
        state={state}
        theme={theme}
        audioLevel={audioLevel}
        onToggleSession={handleToggleSession}
        onTriggerVision={() => setIsVisionOverlayOpen(true)}
        isVisionActive={visionManagerRef.current.getIsCapturing()}
        isPlayingMusic={isPlayingMusic}
        onToggleMusic={handleToggleMusic}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenIncomingCall={() => setIsCallModalOpen(true)}
        isCallRinging={Boolean(activeCall && activeCall.status === 'ringing')}
        onExpandToFull={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* File & Media Manager Modal */}
      {isFileManagerOpen && (
        <FileManagerModal
          files={phoneFiles}
          theme={theme}
          onOpenFile={(file) => {
            setActiveDialogue(`📂 Opened file: ${file.name} (${file.sizeFormatted})`);
          }}
          onAnalyzeWithAi={(file) => {
            const prompt = `Please inspect this phone file: ${file.name} (${file.path}). Content preview: "${file.textContent || 'Media/binary item'}"`;
            handleSendText(prompt);
            setIsFileManagerOpen(false);
          }}
          onShareFile={(file) => {
            if (navigator.share) {
              navigator.share({ title: file.name, text: file.textContent || file.name }).catch(() => {});
            } else {
              setActiveDialogue(`🔗 File link copied for: ${file.name}`);
            }
          }}
          onDeleteFile={(id) => {
            setPhoneFiles((prev) => prev.filter((f) => f.id !== id));
          }}
          onAddFile={(newFile) => {
            setPhoneFiles((prev) => [
              {
                id: `file_${Date.now()}`,
                name: newFile.name || 'New_Document.txt',
                category: newFile.category || 'documents',
                extension: newFile.extension || 'txt',
                sizeBytes: 1024,
                sizeFormatted: '1.0 KB',
                lastModified: 'Just now',
                path: `/storage/emulated/0/Documents/${newFile.name || 'New_Document.txt'}`,
                textContent: newFile.textContent || '',
              },
              ...prev,
            ]);
          }}
          onClose={() => setIsFileManagerOpen(false)}
        />
      )}

      {/* App Launcher & Accessibility Automation Modal */}
      {isAppsModalOpen && (
        <AppLauncherModal
          isOpen={isAppsModalOpen}
          apps={apps}
          onLaunchApp={handleLaunchApp}
          onClose={() => setIsAppsModalOpen(false)}
        />
      )}

      {/* SMS Messages Modal */}
      {isSmsModalOpen && (
        <SmsMessagesModal
          conversations={smsConversations}
          onSendMessage={handleSendSms}
          onTungTungAutoReply={(convId) => {
            const replies = [
              'Hey! Tung Tung here on voice standby — I noted this and updated the schedule! ✨',
              'Tung Tung AI auto-reply: got your message, syncing context right now.',
              'Received! Handling this on phone executive mode 🚀',
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            handleSendSms(convId, randomReply);
          }}
          onClose={() => setIsSmsModalOpen(false)}
        />
      )}

      {/* Alarm & Clock Modal */}
      {isAlarmsModalOpen && (
        <AlarmClockModal
          alarms={alarms}
          onToggleAlarm={(id, enabled) => {
            setAlarms((prev) =>
              prev.map((a) => (a.id === id ? { ...a, enabled } : a))
            );
          }}
          onAddAlarm={(time, label, days) => {
            const newAlarm: AlarmItem = {
              id: `alarm_${Date.now()}`,
              time,
              label,
              days,
              enabled: true,
              type: 'alarm',
            };
            setAlarms((prev) => [newAlarm, ...prev]);
          }}
          onDeleteAlarm={(id) => {
            setAlarms((prev) => prev.filter((a) => a.id !== id));
          }}
          onClose={() => setIsAlarmsModalOpen(false)}
        />
      )}

      {/* Phone Dialer Modal */}
      {isDialerModalOpen && (
        <DialerModal
          contacts={contacts}
          onInitiateCall={(number, name) => {
            setIsDialerModalOpen(false);
            handleTriggerTestCall(name || 'Direct Dial', number);
          }}
          onClose={() => setIsDialerModalOpen(false)}
        />
      )}

      {/* Screen Vision Modal */}
      {isVisionOverlayOpen && (
        <ScreenVisionOverlay
          theme={theme}
          visionManager={visionManagerRef.current}
          onSendLiveFrame={(frame) => liveSessionRef.current?.sendVideoFrame(frame)}
          onSpeakSassy={(text) => liveSessionRef.current?.speakSassyText(text)}
          onClose={() => setIsVisionOverlayOpen(false)}
        />
      )}

      {/* Incoming Calls Modal */}
      {isCallModalOpen && (
        <IncomingCallModal
          call={activeCall}
          theme={theme}
          onAnswer={handleAnswerCall}
          onReject={handleRejectCall}
          onRoxyScreen={handleRoxyScreenCall}
          onTriggerTestCall={handleTriggerTestCall}
          onClose={() => setIsCallModalOpen(false)}
        />
      )}

      {/* Notifications Interceptor Modal */}
      {isNotificationModalOpen && (
        <NotificationInterceptorModal
          notifications={notifications}
          theme={theme}
          onAutoReply={(notifId, replyText) => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === notifId ? { ...n, autoReplied: true, replyText } : n))
            );
          }}
          onSendToWhatsApp={(sender, text) => {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          }}
          onAddSimulatedNotification={(app, sender, message) => {
            setNotifications((prev) => [
              {
                id: `${Date.now()}`,
                app,
                sender,
                message,
                time: 'Just now',
                autoReplied: false,
              },
              ...prev,
            ]);
          }}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      )}

      {/* Media Playback Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative">
            <button
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
            >
              ✕
            </button>
            <MediaPlaybackWidget
              currentTrack={playlist[currentTrackIndex]}
              isPlaying={isPlayingMusic}
              volume={musicVolume}
              playlist={playlist}
              theme={theme}
              onTogglePlay={handleToggleMusic}
              onNextTrack={handleNextMusic}
              onPrevTrack={handlePrevMusic}
              onSelectTrack={handleSelectTrack}
              onVolumeChange={handleVolumeChange}
            />
          </div>
        </div>
      )}

      {/* Hardware Controls Modal */}
      {isHardwareModalOpen && (
        <HardwareControlsModal
          hardware={hardware}
          theme={theme}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleVibrate={handleToggleVibrate}
          onToggleWifi={() => setHardware((p) => ({ ...p, wifi: !p.wifi }))}
          onToggleBluetooth={() => setHardware((p) => ({ ...p, bluetooth: !p.bluetooth }))}
          onToggleDnd={() => setHardware((p) => ({ ...p, dnd: !p.dnd }))}
          onToggleAirplaneMode={() => setHardware((p) => ({ ...p, airplaneMode: !p.airplaneMode }))}
          onToggleHotspot={() => setHardware((p) => ({ ...p, hotspot: !p.hotspot }))}
          onToggleLocation={() => setHardware((p) => ({ ...p, location: !p.location }))}
          onToggleDarkMode={() => setHardware((p) => ({ ...p, darkMode: !p.darkMode }))}
          onChangeBrightness={(val) => setHardware((p) => ({ ...p, brightness: val }))}
          onChangeVolume={(val) => setHardware((p) => ({ ...p, volume: val }))}
          onChangeRingtoneVolume={(val) => setHardware((p) => ({ ...p, ringtoneVolume: val }))}
          onClose={() => setIsHardwareModalOpen(false)}
        />
      )}

      {/* Calendar Planner Modal */}
      {isCalendarModalOpen && (
        <CalendarModal
          events={calendarEvents}
          theme={theme}
          onAddEvent={(title, time, category) => {
            setCalendarEvents((prev) => [
              ...prev,
              {
                id: `${Date.now()}`,
                title,
                time,
                category,
                completed: false,
              },
            ]);
          }}
          onToggleComplete={(id) => {
            setCalendarEvents((prev) =>
              prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
            );
          }}
          onDeleteEvent={(id) => {
            setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
          }}
          onClose={() => setIsCalendarModalOpen(false)}
        />
      )}

      {/* Contacts Modal */}
      {isContactsModalOpen && (
        <ContactsModal
          contacts={contacts}
          theme={theme}
          onCallContact={(contact) => {
            handleTriggerTestCall(contact.name);
          }}
          onWhatsAppContact={(contact, customMsg) => {
            const cleanPhone = contact.phone.replace(/\D/g, '');
            const msg = customMsg || 'Hey! Tung Tung sent this for me ✨';
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
          }}
          onClose={() => setIsContactsModalOpen(false)}
        />
      )}

      {/* Settings Modal (API Setup & Permissions & Wake Word) */}
      {isSettingsModalOpen && (
        <SettingsModal
          currentVoice={selectedVoice}
          onSelectVoice={(v) => setSelectedVoice(v)}
          permissions={permissions}
          onTogglePermission={handleTogglePermission}
          onGrantAllPermissions={handleGrantAllPermissions}
          onResetPermissions={handleResetPermissions}
          onRedirectToFeature={handleRedirectToPermissionFeature}
          wakeWordConfig={wakeWordConfig}
          onUpdateWakeWordConfig={handleUpdateWakeWordConfig}
          isWakeWordListening={isWakeWordListening}
          isWakeWordSupported={wakeWordManagerRef.current ? wakeWordManagerRef.current.getIsSupported() : true}
          onPlayTestChime={handlePlayWakeChime}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* Dedicated Phone Permissions Hub Modal */}
      {isPermissionsModalOpen && (
        <PermissionsModal
          permissions={permissions}
          onTogglePermission={handleTogglePermission}
          onGrantAll={handleGrantAllPermissions}
          onResetPermissions={handleResetPermissions}
          onRedirectToFeature={handleRedirectToPermissionFeature}
          onClose={() => setIsPermissionsModalOpen(false)}
        />
      )}

      {/* Interactive Permission Request & Feature Redirect Dialog */}
      {pendingPermissionKey && (
        <PermissionRequestDialog
          permission={permissions.find((p) => p.key === pendingPermissionKey) || null}
          onGrant={(key, redirect) => handleGrantPermissionAndRedirect(key, redirect !== false)}
          onDeny={() => setPendingPermissionKey(null)}
        />
      )}

      {/* Dedicated Hands-Free Wake Word Modal */}
      {isWakeWordModalOpen && (
        <WakeWordModal
          config={wakeWordConfig}
          onUpdateConfig={handleUpdateWakeWordConfig}
          isListening={isWakeWordListening}
          isSupported={wakeWordManagerRef.current ? wakeWordManagerRef.current.getIsSupported() : true}
          lastDetectedWord={lastWakeEvent?.matchedWord}
          onPlayTestChime={handlePlayWakeChime}
          onSimulateWakeWord={(phrase) => {
            handleWakeWordDetected({
              matchedWord: phrase,
              rawTranscript: phrase,
              timestamp: Date.now(),
              confidence: 0.98,
            });
          }}
          onClose={() => setIsWakeWordModalOpen(false)}
        />
      )}

      {/* Atmosphere Aura Theme Modal */}
      {isThemeModalOpen && (
        <ThemeModal
          currentTheme={currentThemeId}
          onSelectTheme={(t) => setCurrentThemeId(t)}
          onClose={() => setIsThemeModalOpen(false)}
        />
      )}

      {/* Voice Prompts Drawer */}
      {isPromptsDrawerOpen && (
        <PromptsDrawer onClose={() => setIsPromptsDrawerOpen(false)} />
      )}

      {/* Sensitive Phone Control Biometric Challenge Overlay Modal */}
      {sensitiveAuthAction && (
        <BiometricAuthModal
          isLaunchLock={false}
          title={sensitiveAuthAction.title || 'Biometric Security Challenge'}
          subtitle={sensitiveAuthAction.reason}
          onAuthenticated={() => {
            const action = sensitiveAuthAction.onAuthorized;
            setSensitiveAuthAction(null);
            action();
          }}
          onClose={() => setSensitiveAuthAction(null)}
        />
      )}

      {/* Full-Screen Biometric Launch Lock Shield */}
      {isAppLocked && (
        <BiometricAuthModal
          isLaunchLock={true}
          title="Moon Assistant Security"
          subtitle="Biometric authentication is required to access your AI Assistant and Phone Executive."
          onAuthenticated={() => {
            setIsAppLocked(false);
          }}
        />
      )}

      {/* CapCut Cinematic Video Editor Studio Modal */}
      {isCinematicEditorOpen && (
        <CinematicVideoEditorModal
          isOpen={isCinematicEditorOpen}
          onClose={() => setIsCinematicEditorOpen(false)}
          initialCommand={cinematicInitialCommand}
          availablePhotos={[
            { id: 'p1', name: 'Cinematic Avatar Base', url: '/avatar_base.jpg' },
            { id: 'p2', name: 'Happy Expression Shoot', url: '/avatar_happy.jpg' },
            { id: 'p3', name: 'Thinking Deep Portrait', url: '/avatar_thinking.jpg' },
            { id: 'p4', name: 'Cosmic Cyber Banner', url: '/banner.png' },
            { id: 'p5', name: 'Neon Studio Emblem', url: '/logo.png' },
            { id: 'p6', name: 'Golden Hour Sunset View', url: '/avatar_happy.jpg' },
            { id: 'p7', name: 'Tokyo Cityscape Night', url: '/avatar_base.jpg' },
            { id: 'p8', name: 'Aesthetic Noir Frame', url: '/avatar_thinking.jpg' },
          ]}
        />
      )}
    </div>
  );
}

export default App;
