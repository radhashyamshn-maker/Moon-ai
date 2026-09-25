import React, { useEffect, useRef, useState } from 'react';
import { overlayService, OverlayConfig, BadgeType, BadgePosition } from '../services/OverlayService.android';
import { Sparkles, Flower2, Droplets, X, Settings2, ShieldCheck, Eye, EyeOff, Radio } from 'lucide-react';

interface CustomOverlayProps {
  hasOverlayPermission: boolean;
  onOpenPermissionModal?: () => void;
}

interface Particle {
  id: number;
  type: 'bubble' | 'flower' | 'petal';
  edge: 'left' | 'right';
  x: number;
  y: number;
  baseX: number;
  radius: number;
  speedY: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
  wobblePhase: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  flowerType: 'sakura' | 'lotus' | 'jasmine';
  bloomScale: number;
  bloomSpeed: number;
  colorScheme: {
    primary: string;
    secondary: string;
    center: string;
  };
}

export const CustomOverlay: React.FC<CustomOverlayProps> = ({
  hasOverlayPermission,
  onOpenPermissionModal,
}) => {
  const [config, setConfig] = useState<OverlayConfig>(() => overlayService.getConfig());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Subscribe to config changes
  useEffect(() => {
    const unsubscribe = overlayService.subscribe((newConfig) => {
      setConfig(newConfig);
    });
    return () => unsubscribe();
  }, []);

  const isVisible = overlayService.shouldRenderOverlay(hasOverlayPermission);

  // Particle simulation loop
  useEffect(() => {
    if (!isVisible) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Color palettes for blooming flowers
    const flowerPalettes = [
      {
        primary: 'rgba(244, 114, 182, 0.7)', // Pink Sakura
        secondary: 'rgba(251, 207, 232, 0.5)',
        center: 'rgba(253, 224, 71, 0.9)',
      },
      {
        primary: 'rgba(192, 132, 252, 0.7)', // Purple Lotus
        secondary: 'rgba(233, 213, 255, 0.5)',
        center: 'rgba(250, 204, 21, 0.9)',
      },
      {
        primary: 'rgba(251, 191, 36, 0.7)', // Golden Jasmine
        secondary: 'rgba(254, 240, 138, 0.5)',
        center: 'rgba(249, 115, 22, 0.9)',
      },
      {
        primary: 'rgba(56, 189, 248, 0.7)', // Cyan Ice Flower
        secondary: 'rgba(186, 230, 253, 0.5)',
        center: 'rgba(255, 255, 255, 0.95)',
      },
    ];

    const densityMultiplier = {
      low: 0.6,
      medium: 1.0,
      high: 1.6,
    };

    const targetBubbleCount = config.showBubbles
      ? Math.round(28 * densityMultiplier[config.bubbleDensity])
      : 0;
    const targetFlowerCount = config.showFlowers
      ? Math.round(18 * densityMultiplier[config.flowerDensity])
      : 0;
    const totalTarget = targetBubbleCount + targetFlowerCount;

    // Create a particle
    const createParticle = (type: 'bubble' | 'flower' | 'petal', edge?: 'left' | 'right'): Particle => {
      const chosenEdge = edge || (Math.random() > 0.5 ? 'left' : 'right');
      const edgeSpan = Math.min(config.edgeWidth, width * 0.2);
      
      const baseX =
        chosenEdge === 'left'
          ? Math.random() * edgeSpan + 8
          : width - (Math.random() * edgeSpan + 8);

      const palette = flowerPalettes[Math.floor(Math.random() * flowerPalettes.length)];
      const flowerTypes: ('sakura' | 'lotus' | 'jasmine')[] = ['sakura', 'lotus', 'jasmine'];

      return {
        id: Math.random(),
        type,
        edge: chosenEdge,
        x: baseX,
        y: height + Math.random() * 80 + 10,
        baseX,
        radius:
          type === 'bubble'
            ? Math.random() * 14 + 7 // 7px to 21px
            : Math.random() * 12 + 10, // 10px to 22px
        speedY: (Math.random() * 0.9 + 0.55) * config.speedMultiplier,
        wobbleSpeed: Math.random() * 0.03 + 0.015,
        wobbleAmplitude: Math.random() * 16 + 6,
        wobblePhase: Math.random() * Math.PI * 2,
        opacity: (Math.random() * 0.35 + 0.45) * config.transparency,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        flowerType: flowerTypes[Math.floor(Math.random() * flowerTypes.length)],
        bloomScale: 0.25, // starts blooming as it emerges
        bloomSpeed: Math.random() * 0.008 + 0.004,
        colorScheme: palette,
      };
    };

    // Initialize particles
    if (particlesRef.current.length === 0) {
      const initial: Particle[] = [];
      for (let i = 0; i < targetBubbleCount; i++) {
        const p = createParticle('bubble');
        p.y = Math.random() * height; // distribute vertically at start
        initial.push(p);
      }
      for (let i = 0; i < targetFlowerCount; i++) {
        const isPetal = Math.random() > 0.6;
        const p = createParticle(isPetal ? 'petal' : 'flower');
        p.y = Math.random() * height;
        p.bloomScale = Math.min(1.0, 0.4 + Math.random() * 0.6);
        initial.push(p);
      }
      particlesRef.current = initial;
    }

    // Helper: Draw a realistic translucent water bubble
    const drawBubble = (p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;

      // Outer rim
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

      // Radial gradient for 3D translucent depth
      const grad = ctx.createRadialGradient(
        p.x - p.radius * 0.3,
        p.y - p.radius * 0.3,
        p.radius * 0.1,
        p.x,
        p.y,
        p.radius
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(0.3, 'rgba(186, 230, 253, 0.25)'); // sky blue
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.15)'); // cyan
      grad.addColorStop(1, 'rgba(14, 165, 233, 0.45)'); // darker rim outline

      ctx.fillStyle = grad;
      ctx.fill();

      // Delicate bubble rim stroke
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Specular highlight crescent / glint
      ctx.beginPath();
      ctx.arc(
        p.x - p.radius * 0.35,
        p.y - p.radius * 0.35,
        p.radius * 0.28,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();

      // Secondary tiny bottom reflection
      ctx.beginPath();
      ctx.arc(
        p.x + p.radius * 0.3,
        p.y + p.radius * 0.3,
        p.radius * 0.15,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw blooming 5-petal Sakura / Flower
    const drawFlower = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.bloomScale, p.bloomScale);
      ctx.globalAlpha = p.opacity;

      const numPetals = 5;
      const petalDist = p.radius * 0.85;
      const petalR = p.radius * 0.55;

      // Petals
      for (let i = 0; i < numPetals; i++) {
        const angle = (i * Math.PI * 2) / numPetals;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();

        // Petal shape using bezier curves
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          -petalR * 0.8,
          -petalDist * 0.5,
          -petalR * 0.8,
          -petalDist,
          0,
          -petalDist * 1.15
        );
        ctx.bezierCurveTo(
          petalR * 0.8,
          -petalDist,
          petalR * 0.8,
          -petalDist * 0.5,
          0,
          0
        );

        const petalGrad = ctx.createLinearGradient(0, 0, 0, -petalDist);
        petalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        petalGrad.addColorStop(0.5, p.colorScheme.secondary);
        petalGrad.addColorStop(1, p.colorScheme.primary);

        ctx.fillStyle = petalGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
      }

      // Flower Center (Pollen Core)
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = p.colorScheme.center;
      ctx.shadowColor = p.colorScheme.center;
      ctx.shadowBlur = 6;
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw fluttering single petal
    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.bloomScale, p.bloomScale);
      ctx.globalAlpha = p.opacity;

      ctx.beginPath();
      ctx.moveTo(0, -p.radius);
      ctx.bezierCurveTo(
        p.radius * 0.8,
        -p.radius * 0.5,
        p.radius * 0.8,
        p.radius * 0.5,
        0,
        p.radius
      );
      ctx.bezierCurveTo(
        -p.radius * 0.6,
        p.radius * 0.5,
        -p.radius * 0.6,
        -p.radius * 0.5,
        0,
        -p.radius
      );

      const grad = ctx.createLinearGradient(0, -p.radius, 0, p.radius);
      grad.addColorStop(0, p.colorScheme.primary);
      grad.addColorStop(1, p.colorScheme.secondary);

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    };

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;

      // Adjust particle count if config changed
      if (particles.length < totalTarget) {
        const type =
          config.showFlowers && (!config.showBubbles || Math.random() > 0.6)
            ? Math.random() > 0.5
              ? 'flower'
              : 'petal'
            : 'bubble';
        particles.push(createParticle(type));
      } else if (particles.length > totalTarget && particles.length > 0) {
        particles.pop();
      }

      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move upwards
        p.y -= p.speedY;

        // Oscillate horizontally
        p.wobblePhase += p.wobbleSpeed;
        p.x = p.baseX + Math.sin(p.wobblePhase) * p.wobbleAmplitude;

        // Rotate
        p.rotation += p.rotationSpeed;

        // Bloom growth
        if (p.bloomScale < 1.0) {
          p.bloomScale = Math.min(1.0, p.bloomScale + p.bloomSpeed);
        }

        // Draw based on type
        if (p.type === 'bubble') {
          drawBubble(p);
        } else if (p.type === 'flower') {
          drawFlower(p);
        } else {
          drawPetal(p);
        }

        // Recycle particle if off-screen top
        if (p.y < -p.radius * 2) {
          const newType =
            config.showFlowers && (!config.showBubbles || Math.random() > 0.6)
              ? Math.random() > 0.5
                ? 'flower'
                : 'petal'
              : 'bubble';
          particles[i] = createParticle(newType, p.edge);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [
    isVisible,
    config.showBubbles,
    config.showFlowers,
    config.bubbleDensity,
    config.flowerDensity,
    config.speedMultiplier,
    config.transparency,
    config.edgeWidth,
  ]);

  if (!isVisible) return null;

  const isSimulated = config.isSimulatedBackground;

  return (
    <>
      {/* Simulated Background Wallpaper (visible when user enables Background Mode Simulation to test seeing through to Android desktop) */}
      {isSimulated && (
        <div
          id="simulated-android-bg"
          className="fixed inset-0 z-[8990] pointer-events-none transition-opacity duration-300 bg-cover bg-center"
          style={{
            backgroundImage: `radial-gradient(ellipse at center, rgba(15, 23, 42, 0.45), rgba(2, 6, 23, 0.85)), url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80')`,
          }}
        >
          {/* Mock Floating Android App Window behind the overlay to prove touch-through capability */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white/70 text-xs flex items-center gap-2 pointer-events-auto shadow-2xl">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Background Service Simulation Active • Apps below are interactive</span>
            <button
              onClick={() => overlayService.toggleSimulatedBackground()}
              className="ml-2 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] cursor-pointer"
            >
              Exit Sim
            </button>
          </div>
        </div>
      )}

      {/* Touch-Through Canvas for Edge Bubbles & Blooming Flowers */}
      <canvas
        ref={canvasRef}
        id="edge-bubble-floral-canvas"
        className="fixed inset-0 z-[9990] pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* Sleek Floating Status Badge at Top-Right or Top-Center */}
      <div
        id="overlay-status-badge-container"
        className={`fixed z-[9995] transition-all duration-300 ${
          config.badgePosition === 'top-center'
            ? 'top-2.5 left-1/2 -translate-x-1/2'
            : 'top-2.5 right-3'
        }`}
      >
        <button
          id="overlay-status-badge"
          onClick={() => setIsConfigOpen((prev) => !prev)}
          className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a0f1d]/85 hover:bg-[#0f172a] backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer pointer-events-auto"
          title="Edge Aura & Overlay Settings (क्लिक करके सेटिंग्स बदलें)"
        >
          {/* Animated Glowing Radar Pulse */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
          </span>

          {/* Badge Label */}
          <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-300 group-hover:text-cyan-200">
            {config.badgeType}
          </span>

          {/* Micro Icon */}
          <div className="flex items-center gap-0.5 text-pink-400">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <Flower2 className="w-3 h-3 text-pink-400" />
          </div>

          <Settings2 className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors ml-0.5" />
        </button>

        {/* Mini Quick Settings Popover */}
        {isConfigOpen && (
          <div
            id="overlay-quick-settings-menu"
            className="absolute top-10 right-0 w-72 p-4 rounded-2xl bg-[#0c101d]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl text-white font-mono text-xs space-y-3 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-300">Edge Aura Overlay</span>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badge Name Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">
                Active Badge Identifier
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['JARVIS Active', 'IRIS-X Active', 'MOON Active'] as BadgeType[]).map(
                  (name) => (
                    <button
                      key={name}
                      onClick={() => overlayService.setBadgeType(name)}
                      className={`py-1 px-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        config.badgeType === name
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {name}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Elements Toggle */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">
                Edge Particles (किनारों के एनीमेशन)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    overlayService.updateConfig({ showBubbles: !config.showBubbles })
                  }
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all ${
                    config.showBubbles
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Bubbles</span>
                </button>

                <button
                  onClick={() =>
                    overlayService.updateConfig({ showFlowers: !config.showFlowers })
                  }
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all ${
                    config.showFlowers
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  <Flower2 className="w-3.5 h-3.5" />
                  <span>Flowers</span>
                </button>
              </div>
            </div>

            {/* Session Trigger Mode */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/70">Session Trigger:</span>
                <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${config.sessionActiveOnly ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {config.sessionActiveOnly ? 'Voice Session Only' : 'Always On'}
                </span>
              </div>
              <button
                onClick={() =>
                  overlayService.updateConfig({ sessionActiveOnly: !config.sessionActiveOnly })
                }
                className="w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] text-center border border-white/5 cursor-pointer transition-colors"
              >
                {config.sessionActiveOnly ? 'Switch to: Always Visible' : 'Switch to: Session Active Only'}
              </button>
            </div>

            {/* Density & Speed */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/60">Flow Speed:</span>
                <span className="text-cyan-400 font-bold">{config.speedMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.speedMultiplier}
                onChange={(e) =>
                  overlayService.updateConfig({ speedMultiplier: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Simulated Background Mode Switcher */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => overlayService.toggleSimulatedBackground()}
                className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  config.isSimulatedBackground
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {config.isSimulatedBackground ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Stop Background Simulation</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test Background View (सिम्युलेट करें)</span>
                  </>
                )}
              </button>
              <p className="text-[9px] text-white/40 mt-1 text-center">
                100% Touch-through: Never blocks touches to underlying apps.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
