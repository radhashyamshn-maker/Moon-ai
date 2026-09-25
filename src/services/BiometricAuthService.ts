/**
 * BiometricAuthService.ts
 * Web Authentication API (WebAuthn) & Security Layer for Moon Anime AI Assistant
 * Provides hardware-backed biometric authentication (Touch ID, Face ID, Fingerprint, Windows Hello)
 * with robust security PIN fallback and sensitive control protection.
 */

import { BiometricAuthConfig, BiometricAuthResult } from '../types';

const STORAGE_KEY_CONFIG = 'MOON_BIOMETRIC_CONFIG_V1';
const STORAGE_KEY_CRED_ID = 'MOON_WEBAUTHN_CREDENTIAL_ID';

export class BiometricAuthService {
  private config: BiometricAuthConfig;
  private isPlatformAuthenticatorAvailable: boolean = false;
  private isCheckingSupport: boolean = true;
  private isAuthenticated: boolean = false;
  private lastActiveTimestamp: number = Date.now();

  constructor() {
    this.config = this.loadConfig();
    this.checkPlatformSupport();
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): BiometricAuthConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[BiometricAuth] Failed to load config from storage:', e);
    }

    return {
      enabledOnLaunch: true,
      protectSensitiveControls: true,
      autoLockTimeoutMinutes: 5,
      hasRegisteredPasskey: false,
      customPin: '1234',
      lastAuthenticatedTimestamp: 0,
    };
  }

  /**
   * Save configuration to localStorage
   */
  public saveConfig(newConfig: Partial<BiometricAuthConfig>): BiometricAuthConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.error('[BiometricAuth] Failed to save config:', e);
    }
    return this.config;
  }

  public getConfig(): BiometricAuthConfig {
    return { ...this.config };
  }

  /**
   * Checks if Web Authentication API & Platform Authenticator (Touch ID, Face ID, Fingerprint, Windows Hello) are available
   */
  public async checkPlatformSupport(): Promise<boolean> {
    this.isCheckingSupport = true;
    try {
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        this.isPlatformAuthenticatorAvailable = Boolean(available);
      } else {
        this.isPlatformAuthenticatorAvailable = false;
      }
    } catch (err) {
      console.warn('[BiometricAuth] Platform authenticator check failed:', err);
      this.isPlatformAuthenticatorAvailable = false;
    } finally {
      this.isCheckingSupport = false;
    }
    return this.isPlatformAuthenticatorAvailable;
  }

  public isSupported(): boolean {
    return this.isPlatformAuthenticatorAvailable;
  }

  public isAppLocked(): boolean {
    if (!this.config.enabledOnLaunch) return false;
    return !this.isAuthValid();
  }

  public isAuthValid(): boolean {
    if (!this.isAuthenticated) return false;
    if (this.config.autoLockTimeoutMinutes <= 0) return this.isAuthenticated;

    const elapsedMs = Date.now() - this.lastActiveTimestamp;
    const timeoutMs = this.config.autoLockTimeoutMinutes * 60 * 1000;
    if (elapsedMs > timeoutMs) {
      this.isAuthenticated = false;
      return false;
    }
    return true;
  }

  public setAuthenticated(state: boolean): void {
    this.isAuthenticated = state;
    if (state) {
      this.lastActiveTimestamp = Date.now();
      this.saveConfig({ lastAuthenticatedTimestamp: Date.now() });
    }
  }

  public lock(): void {
    this.isAuthenticated = false;
  }

  public refreshActivity(): void {
    if (this.isAuthenticated) {
      this.lastActiveTimestamp = Date.now();
    }
  }

  /**
   * Helper: Convert ArrayBuffer to Base64URL string
   */
  private bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Helper: Convert Base64URL string to Uint8Array
   */
  private base64UrlToBuffer(base64Url: string): Uint8Array {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Register a new Biometric / Passkey Credential using Web Authentication API
   */
  public async registerBiometrics(): Promise<BiometricAuthResult> {
    try {
      if (!window.PublicKeyCredential || !navigator.credentials) {
        return {
          success: false,
          method: 'webauthn_biometric',
          error: 'Web Authentication API is not supported on this device/browser.',
        };
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const rpId = window.location.hostname || 'localhost';

      const createOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Moon Anime AI Assistant',
          id: rpId.includes(':') ? rpId.split(':')[0] : rpId,
        },
        user: {
          id: userId,
          name: 'owner@moon.assistant',
          displayName: 'Moon Device Owner',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256 (ECDSA w/ SHA-256)
          { alg: -257, type: 'public-key' }, // RS256 (RSA w/ SHA-256)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Touch ID / Face ID / Windows Hello / Android Biometric
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey: createOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        return {
          success: false,
          method: 'webauthn_biometric',
          error: 'Biometric registration was cancelled or not completed.',
        };
      }

      const rawIdBase64 = this.bufferToBase64Url(credential.rawId);

      // Save credential ID
      try {
        localStorage.setItem(STORAGE_KEY_CRED_ID, rawIdBase64);
      } catch {}

      this.saveConfig({
        hasRegisteredPasskey: true,
        passkeyCredentialId: rawIdBase64,
        registeredDate: new Date().toLocaleDateString(),
        biometricType: 'platform',
      });

      this.setAuthenticated(true);

      return {
        success: true,
        method: 'webauthn_biometric',
      };
    } catch (err: any) {
      console.warn('[BiometricAuth] Registration error:', err);
      let errorMsg = err.message || 'Biometric registration failed.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Biometric prompt was cancelled or timed out.';
      } else if (err.name === 'SecurityError') {
        errorMsg = 'Security restriction: Origin is not secure or iframe domain constraint.';
      }
      return {
        success: false,
        method: 'webauthn_biometric',
        error: errorMsg,
      };
    }
  }

  /**
   * Authenticate using Web Authentication API (Touch ID, Face ID, Android Biometric, Windows Hello)
   */
  public async authenticateBiometric(): Promise<BiometricAuthResult> {
    try {
      if (!window.PublicKeyCredential || !navigator.credentials) {
        return {
          success: false,
          method: 'webauthn_biometric',
          error: 'Web Authentication API is not supported in this browser.',
        };
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const rpId = window.location.hostname || 'localhost';
      const cleanRpId = rpId.includes(':') ? rpId.split(':')[0] : rpId;

      let savedCredId: string | null = null;
      try {
        savedCredId = localStorage.getItem(STORAGE_KEY_CRED_ID) || this.config.passkeyCredentialId || null;
      } catch {}

      const getOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: cleanRpId,
        userVerification: 'required',
        timeout: 60000,
      };

      if (savedCredId) {
        try {
          const credBuffer = this.base64UrlToBuffer(savedCredId);
          getOptions.allowCredentials = [
            {
              id: credBuffer,
              type: 'public-key',
              transports: ['internal'],
            },
          ];
        } catch (e) {
          // fallback to general discovery
        }
      }

      const assertion = (await navigator.credentials.get({
        publicKey: getOptions,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        return {
          success: false,
          method: 'webauthn_biometric',
          error: 'Biometric verification cancelled.',
        };
      }

      this.setAuthenticated(true);
      return {
        success: true,
        method: 'webauthn_biometric',
      };
    } catch (err: any) {
      console.warn('[BiometricAuth] Biometric assertion error:', err);
      let errorMsg = err.message || 'Biometric authentication failed.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Biometric scan was cancelled or failed verification.';
      } else if (err.name === 'InvalidStateError') {
        errorMsg = 'Authenticator is in an invalid state or not registered.';
      }
      return {
        success: false,
        method: 'webauthn_biometric',
        error: errorMsg,
      };
    }
  }

  /**
   * Verify backup Security PIN
   */
  public verifyPin(inputPin: string): BiometricAuthResult {
    const cleanInput = inputPin.trim();
    const targetPin = this.config.customPin || '1234';

    if (cleanInput === targetPin || (cleanInput === '1234' && !this.config.customPin)) {
      this.setAuthenticated(true);
      return {
        success: true,
        method: 'pin_code',
      };
    }

    return {
      success: false,
      method: 'pin_code',
      error: 'Incorrect Security PIN. Please try again.',
    };
  }

  /**
   * Update security PIN
   */
  public updatePin(currentPin: string, newPin: string): { success: boolean; error?: string } {
    const targetPin = this.config.customPin || '1234';
    if (currentPin !== targetPin) {
      return { success: false, error: 'Current PIN is incorrect.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, error: 'New PIN must be at least 4 digits.' };
    }

    this.saveConfig({ customPin: newPin });
    return { success: true };
  }
}

export const biometricAuthInstance = new BiometricAuthService();
