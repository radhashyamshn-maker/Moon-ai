// OverlayService.android.ts
// Background Overlay & Edge Water Bubble / Blooming Floral Particle Service
// Leverages Android Display Over Other Apps (SYSTEM_ALERT_WINDOW) & Foreground Service
import { nativeOverlayBridge } from './nativeOverlayBridge';

export type BadgeType = 'JARVIS Active' | 'IRIS-X Active' | 'MOON Active';
export type BadgePosition = 'top-center' | 'top-right';
export type DensityLevel = 'low' | 'medium' | 'high';

export interface OverlayConfig {
  enabled: boolean;
  badgeType: BadgeType;
  badgePosition: BadgePosition;
  showBubbles: boolean;
  showFlowers: boolean;
  edgeWidth: number; // in pixels, e.g., 65px
  bubbleDensity: DensityLevel;
  flowerDensity: DensityLevel;
  speedMultiplier: number;
  transparency: number; // 0.2 to 1.0 (opacity)
  isSimulatedBackground: boolean;
  runInForegroundToo: boolean;
  sessionActiveOnly: boolean; // Only visible when Voice/Assistant session is active
}

const DEFAULT_CONFIG: OverlayConfig = {
  enabled: true,
  badgeType: 'JARVIS Active',
  badgePosition: 'top-right',
  showBubbles: true,
  showFlowers: true,
  edgeWidth: 70,
  bubbleDensity: 'medium',
  flowerDensity: 'medium',
  speedMultiplier: 1.0,
  transparency: 0.75,
  isSimulatedBackground: false,
  runInForegroundToo: true,
  sessionActiveOnly: true,
};

const STORAGE_KEY = 'jarvis_edge_overlay_config';

class OverlayService {
  private config: OverlayConfig = DEFAULT_CONFIG;
  private listeners: Set<(config: OverlayConfig) => void> = new Set();
  private isDocumentHidden: boolean = false;
  private isSessionActive: boolean = false;

  constructor() {
    this.loadConfig();
    this.initVisibilityListener();
  }

  private loadConfig(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load overlay config from localStorage:', e);
    }
  }

  private saveConfig(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save overlay config to localStorage:', e);
    }
    this.notifyListeners();
  }

  private initVisibilityListener(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      this.isDocumentHidden = document.hidden;
      this.notifyListeners();
    });
  }

  public getConfig(): OverlayConfig {
    return { ...this.config };
  }

  public isBackgroundActive(): boolean {
    return this.config.isSimulatedBackground || this.isDocumentHidden;
  }

  /**
   * Called when live voice assistant session begins (connected, speaking, or listening)
   */
  public async notifySessionStart(hasOverlayPermission: boolean): Promise<boolean> {
    this.isSessionActive = true;
    this.notifyListeners();

    // If on native Android and permission is granted, start real WindowManager overlay
    if (nativeOverlayBridge.isNativeSupported()) {
      if (hasOverlayPermission) {
        await nativeOverlayBridge.startNativeOverlay(this.config.badgeType);
        return true;
      } else {
        // Automatically request permission (opens Android Settings)
        await nativeOverlayBridge.requestOverlayPermission();
        return false;
      }
    }
    return true;
  }

  /**
   * Called when live voice assistant session stops or disconnects
   */
  public async notifySessionStop(): Promise<void> {
    this.isSessionActive = false;
    this.notifyListeners();

    if (nativeOverlayBridge.isNativeSupported()) {
      await nativeOverlayBridge.stopNativeOverlay();
    }
  }

  public shouldRenderOverlay(hasOverlayPermission: boolean): boolean {
    if (!hasOverlayPermission || !this.config.enabled) return false;
    // Session-based trigger: only show when session is active, OR if user is explicitly testing background mode
    if (this.config.sessionActiveOnly && !this.isSessionActive && !this.config.isSimulatedBackground) {
      return false;
    }
    if (this.config.runInForegroundToo) return true;
    return this.isBackgroundActive();
  }

  public isSessionCurrentlyActive(): boolean {
    return this.isSessionActive;
  }

  public updateConfig(partial: Partial<OverlayConfig>): void {
    this.config = { ...this.config, ...partial };
    this.saveConfig();
  }

  public toggleEnabled(): boolean {
    const next = !this.config.enabled;
    this.updateConfig({ enabled: next });
    return next;
  }

  public setBadgeType(badgeType: BadgeType): void {
    this.updateConfig({ badgeType });
    if (this.isSessionActive && nativeOverlayBridge.isNativeSupported()) {
      nativeOverlayBridge.startNativeOverlay(badgeType);
    }
  }

  public setBadgePosition(badgePosition: BadgePosition): void {
    this.updateConfig({ badgePosition });
  }

  public toggleSimulatedBackground(): boolean {
    const next = !this.config.isSimulatedBackground;
    this.updateConfig({ isSimulatedBackground: next });
    return next;
  }

  public subscribe(listener: (config: OverlayConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.config);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const copy = this.getConfig();
    this.listeners.forEach((fn) => {
      try {
        fn(copy);
      } catch (err) {
        console.error('Error in overlay listener:', err);
      }
    });
  }
}

export const overlayService = new OverlayService();
