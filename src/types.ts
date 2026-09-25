export type LiveState = 'disconnected' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'processing';

export type CharacterAnimation = 
  | 'idle' 
  | 'wave' 
  | 'dance' 
  | 'cheer' 
  | 'heart' 
  | 'bow' 
  | 'twirl' 
  | 'think' 
  | 'shy' 
  | 'sleepy';

export type AtmosphereTheme = 
  | 'electric-violet' 
  | 'neon-rose' 
  | 'emerald-matrix' 
  | 'solar-flare' 
  | 'cyber-cyan' 
  | 'midnight-onyx';

export interface ThemeConfig {
  id: AtmosphereTheme;
  name: string;
  primary: string;
  glow: string;
  border: string;
  bgGradient: string;
  orbGradient: [string, string, string];
  accentText: string;
  particleColor: string;
}

export interface ToolCallPayload {
  functionCalls?: Array<{
    id: string;
    name: string;
    args: Record<string, any>;
  }>;
}

export interface ToolExecutionEvent {
  id: string;
  name: string;
  args: Record<string, any>;
  result: string;
  timestamp: string;
  type: 'website' | 'search' | 'theme' | 'action' | 'vision' | 'media' | 'hardware' | 'call' | 'notification' | 'calendar' | 'whatsapp';
}

export interface VoiceOption {
  id: string;
  name: string;
  tone: string;
  description: string;
}

export interface IncomingCall {
  id: string;
  callerName: string;
  callerNumber: string;
  callerAvatar?: string;
  status: 'ringing' | 'screened_by_tung_tung' | 'screened_by_roxy' | 'answered' | 'rejected';
  transcribedDialogue?: string;
  autoRejectionSms?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  app: 'WhatsApp' | 'Instagram' | 'Slack' | 'Messages' | 'Telegram';
  sender: string;
  message: string;
  time: string;
  autoReplied: boolean;
  replyText?: string;
}

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number; // in seconds
  audioUrl?: string; // synth or audio url
  coverGradient: [string, string];
}

export interface HardwareState {
  flashlight: boolean;
  vibrating: boolean;
  battery: number;
  isCharging: boolean;
  wifi: boolean;
  bluetooth: boolean;
  brightness: number;
  volume: number;
  ringtoneVolume: number;
  dnd: boolean;
  airplaneMode: boolean;
  hotspot: boolean;
  location: boolean;
  darkMode: boolean;
}

export type PermissionKey =
  | 'biometric_auth'
  | 'wake_word'
  | 'microphone'
  | 'camera_screen'
  | 'phone_calls'
  | 'sms_messaging'
  | 'notifications'
  | 'contacts'
  | 'device_settings'
  | 'location'
  | 'accessibility'
  | 'display_over_apps'
  | 'background_activity'
  | 'storage_files';

export interface PhoneFileItem {
  id: string;
  name: string;
  category: 'documents' | 'images' | 'audio' | 'downloads' | 'system';
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  lastModified: string;
  path: string;
  previewUrl?: string;
  textContent?: string;
  tags?: string[];
  starred?: boolean;
}

export interface PermissionDefinition {
  key: PermissionKey;
  title: string;
  category: 'Critical' | 'Media & Vision' | 'System Controls' | 'Communication';
  description: string;
  granted: boolean;
  iconName: string;
  dangerLevel: 'low' | 'medium' | 'high';
}

export interface AppLauncherItem {
  id: string;
  name: string;
  packageName: string;
  category: 'system' | 'social' | 'media' | 'productivity' | 'utilities';
  icon: string;
  color: string;
  deepLink: string;
  installed: boolean;
}

export interface AlarmItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  days: string[];
  type: 'alarm' | 'timer' | 'stopwatch';
  timerSecondsRemaining?: number;
}

export interface SmsMessage {
  id: string;
  sender: 'user' | 'contact' | 'tung_tung';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface SmsConversation {
  id: string;
  contactName: string;
  phoneNumber: string;
  avatarColor: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
  messages: SmsMessage[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  category: 'work' | 'personal' | 'date' | 'gym';
  completed: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatarColor: string;
  favorite: boolean;
}

export interface ScreenVisionState {
  isStreaming: boolean;
  lastCapturedFrameUrl: string | null;
  lastAnalysis: string | null;
  analyzing: boolean;
}

export interface WakeWordConfig {
  enabled: boolean;
  activeWakeWord: string;
  wakeWords: string[];
  customWakeWords: string[];
  sensitivity: 'low' | 'medium' | 'high';
  playWakeChime: boolean;
  autoStartSession?: boolean;
  hapticFeedback?: boolean;
}

export interface WakeWordEvent {
  wakeWord: string;
  matchedWord?: string;
  rawTranscript?: string;
  confidence?: number;
  query?: string;
  timestamp: string | number;
}

export interface BiometricAuthConfig {
  enabledOnLaunch: boolean;
  protectSensitiveControls: boolean;
  autoLockTimeoutMinutes: number; // 0 = immediate, 1, 5, 15, -1 = disabled
  hasRegisteredPasskey: boolean;
  passkeyCredentialId?: string;
  registeredDate?: string;
  biometricType?: 'platform' | 'face_id' | 'touch_id' | 'fingerprint' | 'windows_hello' | 'passkey' | 'pin_fallback';
  customPin: string; // 4-digit code (default '1234')
  lastAuthenticatedTimestamp: number;
}

export interface BiometricAuthResult {
  success: boolean;
  method: 'webauthn_biometric' | 'pin_code' | 'bypass';
  error?: string;
}

