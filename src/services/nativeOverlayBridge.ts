// nativeOverlayBridge.ts
// Interfaces with Capacitor SystemOverlay plugin to control native Android WindowManager overlay

export interface NativeOverlayBridge {
  checkOverlayPermission: () => Promise<boolean>;
  requestOverlayPermission: () => Promise<{ openedSettings: boolean; alreadyGranted?: boolean }>;
  startNativeOverlay: (badgeText?: string) => Promise<boolean>;
  stopNativeOverlay: () => Promise<boolean>;
  isNativeSupported: () => boolean;
}

class NativeOverlayBridgeImpl implements NativeOverlayBridge {
  private getPlugin(): any {
    if (typeof window === 'undefined') return null;
    const cap = (window as any).Capacitor;
    if (cap && cap.Plugins && cap.Plugins.SystemOverlay) {
      return cap.Plugins.SystemOverlay;
    }
    return null;
  }

  public isNativeSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const cap = (window as any).Capacitor;
    return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  }

  public async checkOverlayPermission(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) {
      // In web preview fallback, assume permission is granted if stored locally
      const stored = localStorage.getItem('moon_overlay_permission_granted');
      return stored !== 'false';
    }
    try {
      const res = await plugin.checkOverlayPermission();
      return !!res?.granted;
    } catch (e) {
      console.warn('Native checkOverlayPermission failed:', e);
      return false;
    }
  }

  public async requestOverlayPermission(): Promise<{ openedSettings: boolean; alreadyGranted?: boolean }> {
    const plugin = this.getPlugin();
    if (!plugin) {
      // In web preview, mark as granted
      localStorage.setItem('moon_overlay_permission_granted', 'true');
      return { openedSettings: false, alreadyGranted: true };
    }
    try {
      const res = await plugin.requestOverlayPermission();
      return { openedSettings: !!res?.openedSettings, alreadyGranted: !!res?.alreadyGranted };
    } catch (e) {
      console.warn('Native requestOverlayPermission failed:', e);
      return { openedSettings: false, alreadyGranted: false };
    }
  }

  public async startNativeOverlay(badgeText: string = 'JARVIS Active'): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return false; // will fallback to DOM overlay
    }
    try {
      const res = await plugin.startOverlay({ badgeText });
      return res?.status === 'started';
    } catch (e) {
      console.warn('Failed to start native overlay:', e);
      return false;
    }
  }

  public async stopNativeOverlay(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return false;
    }
    try {
      const res = await plugin.stopOverlay();
      return res?.status === 'stopped';
    } catch (e) {
      console.warn('Failed to stop native overlay:', e);
      return false;
    }
  }
}

export const nativeOverlayBridge = new NativeOverlayBridgeImpl();
