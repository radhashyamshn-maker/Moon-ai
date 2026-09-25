import React, { useState, useEffect, useRef } from 'react';
import {
  Fingerprint,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { BiometricAuthConfig, ThemeConfig } from '../types';
import { biometricAuthInstance } from '../services/BiometricAuthService';

interface BiometricAuthModalProps {
  isOpen: boolean;
  mode: 'launch_lock' | 'sensitive_guard' | 'enroll';
  targetFeatureName?: string;
  theme: ThemeConfig;
  onAuthenticated: () => void;
  onCancel?: () => void;
  onPlayChime?: (type: 'connect' | 'disconnect' | 'wake' | 'tap') => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  mode,
  targetFeatureName = 'Sensitive Controls',
  theme,
  onAuthenticated,
  onCancel,
  onPlayChime,
}) => {
  const [authMethod, setAuthMethod] = useState<'biometric' | 'pin'>('biometric');
  const [pinCode, setPinCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isPlatformSupported, setIsPlatformSupported] = useState<boolean>(false);
  const [hasPasskey, setHasPasskey] = useState<boolean>(false);
  const [config, setConfig] = useState<BiometricAuthConfig>(biometricAuthInstance.getConfig());
  const [showPinHelp, setShowPinHelp] = useState<boolean>(false);
  const isAutoTriggered = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = biometricAuthInstance.getConfig();
      setConfig(cfg);
      setHasPasskey(cfg.hasRegisteredPasskey);
      setPinCode('');
      setErrorMessage(null);
      setIsSuccess(false);

      biometricAuthInstance.checkPlatformSupport().then((supported) => {
        setIsPlatformSupported(supported);
        // Auto-trigger biometric prompt on open if supported
        if (supported && !isAutoTriggered.current && mode !== 'enroll') {
          isAutoTriggered.current = true;
          triggerBiometricScan();
        }
      });
    } else {
      isAutoTriggered.current = false;
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const triggerBiometricScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const result = await biometricAuthInstance.authenticateBiometric();
      setIsScanning(false);

      if (result.success) {
        handleSuccess();
      } else {
        setErrorMessage(result.error || 'Biometric scan was cancelled.');
        if (onPlayChime) onPlayChime('disconnect');
      }
    } catch (err: any) {
      setIsScanning(false);
      setErrorMessage(err.message || 'Authentication error.');
    }
  };

  const triggerRegistration = async () => {
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const result = await biometricAuthInstance.registerBiometrics();
      setIsScanning(false);

      if (result.success) {
        setHasPasskey(true);
        setConfig(biometricAuthInstance.getConfig());
        handleSuccess();
      } else {
        setErrorMessage(result.error || 'Biometric enrollment was cancelled.');
      }
    } catch (err: any) {
      setIsScanning(false);
      setErrorMessage(err.message || 'Enrollment error.');
    }
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    if (onPlayChime) onPlayChime('connect');
    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }
    setTimeout(() => {
      onAuthenticated();
    }, 600);
  };

  const handlePinDigit = (digit: string) => {
    if (pinCode.length >= 6) return;
    const newPin = pinCode + digit;
    setPinCode(newPin);
    setErrorMessage(null);

    // Auto-verify if 4 digits
    if (newPin.length === 4) {
      const result = biometricAuthInstance.verifyPin(newPin);
      if (result.success) {
        handleSuccess();
      } else {
        setErrorMessage(result.error || 'Invalid PIN code');
        if (onPlayChime) onPlayChime('disconnect');
        if (navigator.vibrate) {
          try {
            navigator.vibrate([150, 50, 150]);
          } catch {}
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handlePinClear = () => {
    setPinCode('');
    setErrorMessage(null);
  };

  const isFullLaunchLock = mode === 'launch_lock';

  return (
    <div
      id="biometric-auth-overlay"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl ${
        isFullLaunchLock
          ? 'bg-black/90'
          : 'bg-black/80 animate-in fade-in duration-300'
      }`}
      style={{
        background: isFullLaunchLock
          ? 'radial-gradient(circle at 50% 30%, rgba(30, 20, 50, 0.95) 0%, rgba(5, 5, 10, 0.98) 100%)'
          : undefined,
      }}
    >
      <div
        id="biometric-auth-card"
        className="w-full max-w-md rounded-3xl bg-[#121218]/95 border border-white/10 p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        style={{
          boxShadow: `0 0 40px ${theme.glow}, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ background: theme.primary }}
        />

        {/* Close Button (only for sensitive controls guard, not full launch lock) */}
        {!isFullLaunchLock && onCancel && (
          <button
            id="btn-close-biometric"
            onClick={onCancel}
            aria-label="Cancel Authentication"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon & Shield Header */}
        <div className="relative my-2">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center border transition-all duration-500 shadow-xl ${
              isSuccess
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 scale-110'
                : isScanning
                ? 'bg-violet-500/20 border-violet-400 text-violet-300 animate-pulse scale-105'
                : 'bg-white/5 border-white/15 text-pink-300'
            }`}
            style={{
              borderColor: isSuccess ? '#34D399' : theme.border,
              boxShadow: isSuccess
                ? '0 0 25px rgba(52, 211, 153, 0.5)'
                : `0 0 20px ${theme.glow}`,
            }}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
            ) : authMethod === 'biometric' ? (
              <Fingerprint className="w-10 h-10 transition-transform hover:scale-110" />
            ) : (
              <KeyRound className="w-10 h-10 text-pink-400" />
            )}
          </div>

          {/* Corner Security Badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black/90 border border-white/20 flex items-center justify-center shadow">
            {isSuccess ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-pink-400" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="mt-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>WebAuthn Biometric Shield</span>
          </div>
          <h2 className="text-xl font-bold font-mono text-white tracking-wide">
            {isSuccess
              ? 'Access Granted'
              : mode === 'launch_lock'
              ? 'Unlock Moon Assistant'
              : mode === 'enroll'
              ? 'Register Biometrics'
              : `Authorize ${targetFeatureName}`}
          </h2>
          <p className="text-xs font-mono text-white/50 max-w-xs mx-auto">
            {isSuccess
              ? 'Identity verified successfully! Opening...'
              : mode === 'launch_lock'
              ? 'Authenticate with Touch ID, Face ID, Fingerprint, or Security PIN to proceed.'
              : `Biometric verification required to access ${targetFeatureName}.`}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mt-4 w-full p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2 text-left animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Authentication View Switcher (Biometric vs PIN) */}
        <div className="w-full mt-5">
          {authMethod === 'biometric' ? (
            <div className="space-y-4">
              {/* Biometric Scan Prompt Box */}
              <div
                onClick={() => {
                  if (hasPasskey || isPlatformSupported) {
                    triggerBiometricScan();
                  } else {
                    triggerRegistration();
                  }
                }}
                className={`w-full p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative overflow-hidden group ${
                  isScanning
                    ? 'bg-violet-950/40 border-violet-500 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-violet-500/50'
                }`}
              >
                {/* Laser Scanning Line Animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-0 animate-[bounce_1.5s_infinite]" />
                )}

                <div className="relative">
                  <Fingerprint
                    className={`w-14 h-14 transition-all duration-300 ${
                      isScanning
                        ? 'text-cyan-300 scale-110 animate-pulse'
                        : 'text-violet-300 group-hover:text-pink-300 group-hover:scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping pointer-events-none opacity-40" />
                </div>

                <div className="text-center">
                  <span className="text-sm font-mono font-bold text-white block">
                    {isScanning
                      ? 'Scanning Biometric Sensor...'
                      : hasPasskey
                      ? 'Tap to Scan Fingerprint / Face ID'
                      : isPlatformSupported
                      ? 'Tap to Verify with Device Passkey'
                      : 'Enroll Device Biometric / Passkey'}
                  </span>
                  <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                    Hardware-backed via Web Authentication API
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 w-full">
                <button
                  id="btn-trigger-scan"
                  onClick={() => {
                    if (hasPasskey || isPlatformSupported) {
                      triggerBiometricScan();
                    } else {
                      triggerRegistration();
                    }
                  }}
                  disabled={isScanning || isSuccess}
                  className="w-full py-3 rounded-xl font-mono text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary} 0%, #4F46E5 100%)`,
                    borderColor: theme.border,
                  }}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Biometric Sensor...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>{hasPasskey ? 'Scan Fingerprint / Face' : 'Verify Identity'}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-switch-to-pin"
                  type="button"
                  onClick={() => setAuthMethod('pin')}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-pink-300" />
                  <span>Use Security PIN Fallback</span>
                </button>
              </div>
            </div>
          ) : (
            /* PIN Code Entry View */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* PIN Code Dots Display */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 my-2">
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = pinCode.length > index;
                    return (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                          isFilled
                            ? 'bg-pink-400 border-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.8)] scale-110'
                            : 'bg-white/10 border-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-mono text-white/40">
                  Enter 4-digit Security Passcode (Default: 1234)
                </span>
              </div>

              {/* Digital Numpad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinDigit(digit)}
                    className="h-12 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/20 border border-white/10 text-white font-mono text-lg font-bold transition-all flex items-center justify-center cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handlePinClear}
                  className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 font-mono text-xs font-semibold transition-all flex items-center justify-center cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => handlePinDigit('0')}
                  className="h-12 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/20 border border-white/10 text-white font-mono text-lg font-bold transition-all flex items-center justify-center cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handlePinDelete}
                  className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 font-mono text-xs font-semibold transition-all flex items-center justify-center cursor-pointer"
                >
                  ⌫
                </button>
              </div>

              {/* Switch back to Biometric */}
              <button
                id="btn-switch-to-biometric"
                type="button"
                onClick={() => setAuthMethod('biometric')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Fingerprint className="w-3.5 h-3.5 text-cyan-300" />
                <span>Return to Biometric Scan</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Details */}
        <div className="mt-5 pt-3 border-t border-white/5 w-full flex items-center justify-between text-[10px] font-mono text-white/40">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>FIDO2 / WebAuthn Level 3</span>
          </div>
          <button
            onClick={() => setShowPinHelp(!showPinHelp)}
            className="text-pink-300/80 hover:text-pink-300 underline cursor-pointer"
          >
            {showPinHelp ? 'Hide PIN Hint' : 'Forgot PIN?'}
          </button>
        </div>

        {showPinHelp && (
          <div className="mt-2 w-full p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[11px] font-mono text-pink-300 text-center animate-in fade-in">
            Default Master Passcode is <strong className="text-white font-bold">1234</strong>. You can change it anytime in Settings &gt; Biometrics.
          </div>
        )}
      </div>
    </div>
  );
};
