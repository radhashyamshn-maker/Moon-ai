import React, { useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';

interface WaveformVisualizerProps {
  theme: ThemeConfig;
  getVisualizerData: () => Uint8Array;
  isActive: boolean;
  isSpeaking: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  theme,
  getVisualizerData,
  isActive,
  isSpeaking,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const freqData = getVisualizerData();
      const centerY = height / 2;

      // Draw subtle background center baseline
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!isActive) {
        // Idle gentle breathing wave
        phase += 0.02;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * 0.015 + phase) * 4 * Math.sin(x / width * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        phase += isSpeaking ? 0.08 : 0.04;

        // Multi-layered cyber harmonic waves
        const layers = [
          { alpha: 0.8, widthMult: 2.5, speed: 1.0, color: theme.primary },
          { alpha: 0.4, widthMult: 1.5, speed: -0.7, color: theme.particleColor },
          { alpha: 0.2, widthMult: 1.0, speed: 1.4, color: '#ffffff' },
        ];

        const barCount = 48;
        const step = width / barCount;

        layers.forEach((layer, layerIdx) => {
          ctx.beginPath();
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.5, layer.color);
          gradient.addColorStop(1, 'transparent');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = layer.widthMult;

          for (let i = 0; i <= barCount; i++) {
            const x = i * step;
            const freqIndex = Math.floor((i / barCount) * (freqData.length * 0.5));
            const rawVal = freqData[freqIndex] || 0;
            const normalized = (rawVal / 255) * (isSpeaking ? 38 : 22);

            const envelope = Math.sin((i / barCount) * Math.PI);
            const wave = Math.sin(i * 0.25 + phase * layer.speed + layerIdx) * (normalized * 0.8 + 2);
            const y = centerY + wave * envelope;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        // Vertical equalizer accent bars in the middle
        const midBars = 16;
        const barWidth = 3;
        const startX = width / 2 - (midBars * 6) / 2;

        for (let b = 0; b < midBars; b++) {
          const bx = startX + b * 6;
          const sample = freqData[b * 2] || 0;
          const h = Math.max(3, (sample / 255) * (isSpeaking ? 32 : 18));

          ctx.fillStyle = theme.primary;
          ctx.fillRect(bx, centerY - h / 2, barWidth, h);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, isActive, isSpeaking, getVisualizerData]);

  return (
    <div className="w-full max-w-md h-16 relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={420}
        height={64}
        className="w-full h-full pointer-events-none"
      />
    </div>
  );
};
