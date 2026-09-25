// permissionRouting.ts
// Direct routing and feature resolution for Android & AI Permissions
import { nativeOverlayBridge } from './nativeOverlayBridge';

export interface PermissionTargetRoute {
  key: string;
  featureTitle: string;
  featureSubtitle: string;
  featureBadge: string;
  iconName: string;
  description: string;
  category: 'Critical' | 'Communication' | 'System Controls' | 'Media & Vision' | 'System';
}

export const PERMISSION_ROUTES: Record<string, PermissionTargetRoute> = {
  biometric_auth: {
    key: 'biometric_auth',
    featureTitle: 'Fingerprint & App Lock (फिंगरप्रिंट लॉक)',
    featureSubtitle: 'बायोमेट्रिक प्रमाणीकरण व ऑटो-लॉक सुरक्षा',
    featureBadge: 'Biometric Hub',
    iconName: 'Fingerprint',
    description: 'फिंगरप्रिंट और फेस रिकग्निशन से फोन और ऐप को सुरक्षित रखने के लिए।',
    category: 'Critical',
  },
  wake_word: {
    key: 'wake_word',
    featureTitle: 'Wake Word "Hey Moon" & "JARVIS"',
    featureSubtitle: 'Hands-free hotword voice wake-up',
    featureBadge: 'Voice Wake',
    iconName: 'Ear',
    description: 'Listen locally for wake phrase and activate Moon hands-free.',
    category: 'Critical',
  },
  background_activity: {
    key: 'background_activity',
    featureTitle: 'Microphone & Background Activity (बैकग्राउंड एक्टिविटी)',
    featureSubtitle: 'हमेशा आवाज सुनने (Hotword/Wake word) और बैटरी सेवर से बंद न होने के लिए',
    featureBadge: 'Background & Wake Word',
    iconName: 'Zap',
    description: 'हमेशा आवाज सुनने (Hotword/Wake word) और बैटरी सेवर से बंद न होने के लिए। Keeps Moon alive 24/7 in background.',
    category: 'Critical',
  },
  display_over_apps: {
    key: 'display_over_apps',
    featureTitle: 'Display Over Other Apps (डिस्प्ले ओवर अदर ऐप्स व एज ऑरा)',
    featureSubtitle: 'स्क्रीन के किनारों पर वाटर बबल्स, खिलते फूल व JARVIS/IRIS-X एक्टिव बैज दिखाने के लिए',
    featureBadge: 'Edge Aura & HUD',
    iconName: 'Layers',
    description: 'स्क्रीन के दोनों किनारों (left & right edges) पर तैरते वाटर बबल्स, खिलते फूल, फ्लोटिंग माइक और JARVIS/IRIS-X स्टेटस बैज दिखाने के लिए। 100% Touch-through non-intrusive overlay.',
    category: 'System Controls',
  },
  microphone: {
    key: 'microphone',
    featureTitle: 'Live Voice Stream & Mic',
    featureSubtitle: 'Bidirectional low-latency audio stream',
    featureBadge: 'Live Voice',
    iconName: 'Mic',
    description: 'Allows Moon to stream two-way real-time audio with Gemini.',
    category: 'Critical',
  },
  camera_screen: {
    key: 'camera_screen',
    featureTitle: 'Screen & Camera Vision',
    featureSubtitle: 'Live canvas capture and visual inspector',
    featureBadge: 'Vision Hub',
    iconName: 'Eye',
    description: 'Inspects your screen, webcam feeds, and analyzes visual elements.',
    category: 'Media & Vision',
  },
  phone_calls: {
    key: 'phone_calls',
    featureTitle: 'Phone & Telephony (फोन परमिशन)',
    featureSubtitle: 'सीधे कॉल लगाने और AI कॉल स्क्रीनिंग के लिए',
    featureBadge: 'Dialer',
    iconName: 'PhoneCall',
    description: 'सीधे कॉल लगाने, इनकमिंग कॉल रिसीव करने और AI से कॉल स्क्रीन करने के लिए।',
    category: 'Communication',
  },
  sms_messaging: {
    key: 'sms_messaging',
    featureTitle: 'SMS & Messaging (SMS परमिशन)',
    featureSubtitle: 'सीधे मैसेज भेजने और ऑटो-रिप्लाई करने के लिए',
    featureBadge: 'SMS Hub',
    iconName: 'MessageSquare',
    description: 'सीधे मैसेज और WhatsApp भेजने, पढ़ने और ऑटो-रिप्लाई करने के लिए।',
    category: 'Communication',
  },
  notifications: {
    key: 'notifications',
    featureTitle: 'Notification Access (डिवाइस व ऐप नोटिफिकेशन)',
    featureSubtitle: 'आने वाले मैसेज और अलर्ट्स पढ़ने व उनका ऑटो-रिप्लाई करने के लिए',
    featureBadge: 'Alerts',
    iconName: 'Bell',
    description: 'आने वाले मैसेज और अलर्ट्स पढ़ने व उनका ऑटो-रिप्लाई करने के लिए। Monitors push notifications and auto-replies.',
    category: 'System Controls',
  },
  contacts: {
    key: 'contacts',
    featureTitle: 'Contacts & Address Book (कॉन्टैक्ट्स एक्सेस)',
    featureSubtitle: 'सीधे कॉल लगाने और मैसेज भेजने के लिए कॉन्टैक्ट्स',
    featureBadge: 'Address Book',
    iconName: 'Users',
    description: 'कॉन्टैक्ट्स ढूँढने, सीधे कॉल लगाने और नाम से मैसेज भेजने के लिए। Access contacts list for direct calling and messaging.',
    category: 'Communication',
  },
  device_settings: {
    key: 'device_settings',
    featureTitle: 'Hardware & System Controls',
    featureSubtitle: 'Flashlight, vibration, volume, and connectivity',
    featureBadge: 'Hardware Panel',
    iconName: 'Cpu',
    description: 'Direct control over flashlight, vibration, Wi-Fi, Bluetooth, DND, and brightness.',
    category: 'System Controls',
  },
  location: {
    key: 'location',
    featureTitle: 'GPS Navigation & Maps',
    featureSubtitle: 'Live location coordinate services',
    featureBadge: 'GPS Map',
    iconName: 'Navigation',
    description: 'Provides live coordinates for navigation, route mapping, and local searches.',
    category: 'Media & Vision',
  },
  accessibility: {
    key: 'accessibility',
    featureTitle: 'Accessibility Service (एक्सेसिबिलिटी सर्विस)',
    featureSubtitle: 'स्क्रीन को पढ़ने, खुद बटन दबाने और ऐप्स को नेविगेट करने के लिए',
    featureBadge: 'Accessibility & Automation',
    iconName: 'LayoutGrid',
    description: 'स्क्रीन को पढ़ने, खुद बटन दबाने और ऐप्स को नेविगेट करने के लिए। UI automation, screen reader, and gesture clicker.',
    category: 'System Controls',
  },
  storage_files: {
    key: 'storage_files',
    featureTitle: 'Files & Media Access (फाइल और मीडिया एक्सेस)',
    featureSubtitle: 'फोन की फाइल्स ढूँढने और खोलने के लिए',
    featureBadge: 'Files Explorer',
    iconName: 'FolderOpen',
    description: 'फोन की फाइल्स ढूँढने और खोलने के लिए। Deep storage access to browse, search, and open documents, images, audio, and downloads.',
    category: 'Media & Vision',
  },
};

export function getPermissionRouteInfo(key: string): PermissionTargetRoute {
  return (
    PERMISSION_ROUTES[key] || {
      key,
      featureTitle: 'Target Feature',
      featureSubtitle: 'Authorized device module',
      featureBadge: 'Module',
      iconName: 'Shield',
      description: 'System capability authorized for Moon AI.',
      category: 'System',
    }
  );
}

/**
 * Directly prompts Android System Overlay Settings if on native Android
 */
export async function triggerNativePermissionRequest(key: string): Promise<boolean> {
  if (key === 'display_over_apps') {
    const res = await nativeOverlayBridge.requestOverlayPermission();
    return res.alreadyGranted || res.openedSettings;
  }
  return true;
}
