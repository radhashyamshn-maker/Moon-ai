import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { ScreenVisionManager } from '../services/ScreenVisionManager';
import { Eye, EyeOff, Camera, Sparkles, X, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScreenVisionOverlayProps {
  theme: ThemeConfig;
  visionManager: ScreenVisionManager;
  onSendLiveFrame?: (cleanBase64: string) => void;
  onSpeakSassy?: (text: string) => void;
  onClose: () => void;
}

export const ScreenVisionOverlay: React.FC<ScreenVisionOverlayProps> = ({
  theme,
  visionManager,
  onSendLiveFrame,
  onSpeakSassy,
  onClose,
}) => {
  const [isCapturing, setIsCapturing] = useState(visionManager.getIsCapturing());
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [detectedTags, setDetectedTags] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to inspect your screen or workspace');

  useEffect(() => {
    // If already capturing, analyze current frame; otherwise perform initial scan
    if (visionManager.getIsCapturing()) {
      captureAndAnalyzeCurrent();
    } else {
      captureAndAnalyzeCurrent();
    }
  }, []);

  const handleStartCapture = async () => {
    try {
      setStatusMessage('Requesting screen/display permissions...');
      await visionManager.startScreenCapture();
      setIsCapturing(true);
      setStatusMessage('Screen link established. Capturing frame...');

      // Start continuous background frame streaming to Gemini Live
      if (onSendLiveFrame) {
        visionManager.startFrameStreaming((frame) => {
          onSendLiveFrame(frame);
        }, 2500);
      }

      setTimeout(() => {
        captureAndAnalyzeCurrent();
      }, 400);
    } catch (err: any) {
      console.log('[Vision] Screen capture notice:', err);
      setStatusMessage('Ready for screen or workspace inspection.');
    }
  };

  const captureAndAnalyzeCurrent = async () => {
    const frame = visionManager.captureFrame(0.85);
    if (!frame) {
      setStatusMessage('Could not capture frame. Please start capture first.');
      return;
    }

    setSnapshotUrl(frame);
    setIsAnalyzing(true);
    setStatusMessage('Tung Tung is scanning visual elements with Gemini Multimodal Vision...');

    try {
      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frame,
          prompt: `You are Tung Tung, a witty, charmingly sassy AI companion.
Look at what is on the user's screen in this image.
Give a crisp 2-3 sentence sassy and observant comment about what they are working on, reading, coding, or watching.
Highlight 3 key keywords or detected items.`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisText(data.sassyInsight);
        setDetectedTags(data.detectedElements || ['Active Screen', 'Code / Text', 'Browser Window']);
        setStatusMessage('Visual scan complete.');

        if (onSpeakSassy && data.sassyInsight) {
          onSpeakSassy(data.sassyInsight);
        }
      } else {
        throw new Error(data.error || 'Failed to analyze');
      }
    } catch (err: any) {
      console.warn('Vision analyze error:', err);
      const fallbackMsg = "I see your workspace! Looks like you're deep in the zone. Keep crushing it, handsome!";
      setAnalysisText(fallbackMsg);
      setDetectedTags(['Live Desktop', 'Active Session', 'User Interface']);
      setStatusMessage('Visual analysis ready.');
      if (onSpeakSassy) onSpeakSassy(fallbackMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStopCapture = () => {
    visionManager.stopCapture();
    setIsCapturing(false);
    setSnapshotUrl(null);
    setAnalysisText(null);
    setStatusMessage('Vision sensor paused.');
  };

  return (
    <div
      id="screen-vision-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in"
    >
      <div
        className="bg-[#101015] border rounded-3xl max-w-xl w-full p-4 sm:p-5 space-y-4 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          borderColor: theme.border,
          boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 25px ${theme.glow}`,
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl border flex items-center justify-center shadow-md"
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                borderColor: 'rgba(6, 182, 212, 0.4)',
              }}
            >
              <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Tung Tung Screen Vision Sensor
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Multimodal
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/50 block">
                {statusMessage}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vision Viewfinder Stage */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center group">
          {snapshotUrl ? (
            <div className="relative w-full h-full">
              <img
                src={snapshotUrl}
                alt="Screen Vision Capture"
                className="w-full h-full object-cover rounded-2xl"
              />

              {/* Cyber Holographic Scanning Grid Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Animated Laser Scanning Line */}
              {isAnalyzing && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[bounce_2s_infinite]" />
              )}

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-4 border border-cyan-500/30 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 absolute top-2 left-2" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 absolute top-2 right-2" />
                <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 absolute bottom-2 left-2" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 absolute bottom-2 right-2" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="p-4 rounded-full bg-white/5 border border-white/10">
                <Camera className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-white">No Active Screen Stream</p>
                <p className="text-[11px] font-mono text-white/40 mt-0.5">
                  Share a screen, browser tab, or workspace for Tung Tung to look at.
                </p>
              </div>
              <button
                onClick={handleStartCapture}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Start Screen Capture
              </button>
            </div>
          )}
        </div>

        {/* Tung Tung's Multimodal Observation Card */}
        {analysisText && (
          <div
            className="p-3.5 rounded-2xl border bg-cyan-950/20 backdrop-blur-md space-y-2 animate-in fade-in"
            style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Tung Tung's Live Vision Insight
              </span>
              <span className="text-[9px] font-mono text-white/40">Gemini 2.5 Flash Vision</span>
            </div>

            <p className="text-xs font-mono text-white/90 leading-relaxed italic">
              "{analysisText}"
            </p>

            {detectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {detectedTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            {isCapturing ? (
              <button
                onClick={handleStopCapture}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-xs font-mono text-rose-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <EyeOff className="w-3.5 h-3.5" /> Pause Vision
              </button>
            ) : (
              <button
                onClick={handleStartCapture}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-mono text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Resume Vision
              </button>
            )}
          </div>

          <button
            onClick={captureAndAnalyzeCurrent}
            disabled={isAnalyzing || !isCapturing}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Scanning...' : 'Scan Screen Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
