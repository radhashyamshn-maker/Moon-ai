import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LiveState, ThemeConfig, CharacterAnimation } from '../types';
import { AvatarExpression } from './AnimeAvatar';

interface ThreeAnimeCharacterProps {
  state: LiveState;
  theme: ThemeConfig;
  audioLevel: number;
  expression: AvatarExpression;
  animation?: CharacterAnimation;
  isHeadpatted: boolean;
  onPointerHit?: () => void;
}

export const ThreeAnimeCharacter: React.FC<ThreeAnimeCharacterProps> = ({
  state,
  theme,
  audioLevel,
  expression,
  animation = 'idle',
  isHeadpatted,
  onPointerHit,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const hairGroupRef = useRef<THREE.Group | null>(null);
  const torsoGroupRef = useRef<THREE.Group | null>(null);
  const chestBowRef = useRef<THREE.Group | null>(null);
  const leftEyeMeshRef = useRef<THREE.Mesh | null>(null);
  const rightEyeMeshRef = useRef<THREE.Mesh | null>(null);
  const mouthMeshRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const leftForearmRef = useRef<THREE.Group | null>(null);
  const rightForearmRef = useRef<THREE.Group | null>(null);
  const leftHandRef = useRef<THREE.Group | null>(null);
  const rightHandRef = useRef<THREE.Group | null>(null);
  const skirtRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const petalsRef = useRef<THREE.InstancedMesh | null>(null);
  const sparklesRef = useRef<THREE.InstancedMesh | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);

  // Dynamic state refs for animation loop
  const targetLookAt = useRef({ x: 0, y: 0 });
  const currentLookAt = useRef({ x: 0, y: 0 });
  const audioLevelRef = useRef(audioLevel);
  const stateRef = useRef(state);
  const expressionRef = useRef(expression);
  const animationRef = useRef(animation);
  const isHeadpattedRef = useRef(isHeadpatted);
  const themeRef = useRef(theme);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
    stateRef.current = state;
    expressionRef.current = expression;
    animationRef.current = animation;
    isHeadpattedRef.current = isHeadpatted;
    themeRef.current = theme;
  }, [audioLevel, state, expression, animation, isHeadpatted, theme]);

  // Pointer move handler for 3D gaze tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    targetLookAt.current = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  };

  const handlePointerLeave = () => {
    targetLookAt.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 420;

    // 1. Three.js Scene, Camera, and WebGL Renderer with Alpha Transparency
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.46, 3.85);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Completely transparent canvas
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Beautiful Anime Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfff0f6, 1.35);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    mainKeyLight.position.set(2, 4, 3);
    scene.add(mainKeyLight);

    // Front Fill Light (Ensures hands, face, and front body are brightly illuminated)
    const frontFillLight = new THREE.DirectionalLight(0xfff5f8, 1.3);
    frontFillLight.position.set(0, 0.5, 4.0);
    scene.add(frontFillLight);

    const softFillLight = new THREE.DirectionalLight(0xe0e7ff, 0.9);
    softFillLight.position.set(-2, 1, 2);
    scene.add(softFillLight);

    const rimLight = new THREE.PointLight(0xec4899, 2.5, 8);
    rimLight.position.set(0, 1.5, -1.8);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // 3. Rich Expressive Textures Generation Helper
    const createEyeTexture = (
      eyeType: 'normal' | 'happy' | 'blinking' | 'heart' | 'star' | 'wink' | 'sleepy' | 'thinking' = 'normal',
      isLeft = true
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      // Sclera background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(128, 128, 105, 115, 0, 0, Math.PI * 2);
      ctx.fill();

      if (eyeType === 'blinking' || (eyeType === 'wink' && isLeft)) {
        // Closed eye curve with cute lashes
        ctx.strokeStyle = '#2d1537';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(128, 115, 75, 0.18 * Math.PI, 0.82 * Math.PI);
        ctx.stroke();

        // Eyelashes
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(55, 120);
        ctx.lineTo(40, 110);
        ctx.moveTo(200, 120);
        ctx.lineTo(215, 110);
        ctx.stroke();
        return new THREE.CanvasTexture(canvas);
      }

      if (eyeType === 'sleepy') {
        // Half-closed relaxed drowsy eye
        ctx.fillStyle = '#260933';
        ctx.beginPath();
        ctx.ellipse(128, 145, 80, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(128, 160, 30, 0, Math.PI);
        ctx.fill();

        // Drooping upper lid line
        ctx.strokeStyle = '#2b0f38';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(128, 115, 85, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        return new THREE.CanvasTexture(canvas);
      }

      if (eyeType === 'happy') {
        // Joyful arc eyes (^^)
        ctx.strokeStyle = '#3b1845';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(128, 155, 75, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.stroke();

        // Cute upper double lash
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(128, 140, 85, 1.25 * Math.PI, 1.75 * Math.PI);
        ctx.stroke();
        return new THREE.CanvasTexture(canvas);
      }

      // Large Glowing Anime Iris (Violet / Magenta gradient)
      const grad = ctx.createLinearGradient(128, 40, 128, 220);
      grad.addColorStop(0, '#260933');
      grad.addColorStop(0.3, '#6b21a8');
      grad.addColorStop(0.65, '#c026d3');
      grad.addColorStop(1, '#f472b6');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(128, 134, 85, 96, 0, 0, Math.PI * 2);
      ctx.fill();

      if (eyeType === 'heart') {
        // Glowing Pink Heart Pupil
        ctx.fillStyle = '#ff2e93';
        ctx.beginPath();
        const hx = 128;
        const hy = 135;
        const s = 34;
        ctx.moveTo(hx, hy + s * 0.7);
        ctx.bezierCurveTo(hx + s, hy, hx + s * 1.3, hy - s * 0.9, hx, hy - s * 0.3);
        ctx.bezierCurveTo(hx - s * 1.3, hy - s * 0.9, hx - s, hy, hx, hy + s * 0.7);
        ctx.fill();

        // Heart highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(114, 115, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(142, 115, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyeType === 'star') {
        // Glowing 4-point Golden Star Pupil
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        const sx = 128;
        const sy = 134;
        const r1 = 44;
        const r2 = 14;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4 - Math.PI / 2;
          const r = i % 2 === 0 ? r1 : r2;
          const px = sx + Math.cos(angle) * r;
          const py = sy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner white diamond
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(128, 134, 12, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standard Glowing Inner Pupil
        ctx.fillStyle = '#170420';
        ctx.beginPath();
        const pupilOffsetY = eyeType === 'thinking' ? -12 : 0;
        const pupilOffsetX = eyeType === 'thinking' ? (isLeft ? -10 : -8) : 0;
        ctx.ellipse(128 + pupilOffsetX, 134 + pupilOffsetY, 42, 54, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lower iris crescent glowing reflection
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(128, 172, 46, 0.12 * Math.PI, 0.88 * Math.PI);
        ctx.fill();

        // Star Catchlight 1 (Top Left)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(96, 92, 26, 32, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle Catchlight 2 (Bottom Right)
        ctx.beginPath();
        ctx.arc(160, 175, 15, 0, Math.PI * 2);
        ctx.fill();

        // Tiny sparkle 3
        ctx.beginPath();
        ctx.arc(102, 168, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Upper Eyelash line (Thick anime contour)
      ctx.strokeStyle = '#2b0f38';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(128, 126, 108, 1.18 * Math.PI, 1.82 * Math.PI);
      ctx.stroke();

      // Double Eyelid Crease
      ctx.strokeStyle = '#701a75';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 116, 118, 1.25 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();

      return new THREE.CanvasTexture(canvas);
    };

    const createEyebrowTexture = (isLeft = true) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Crisp, beautiful arched anime eyebrow (Deep Lilac / Purple tone)
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (isLeft) {
        ctx.moveTo(35, 78);
        ctx.quadraticCurveTo(120, 36, 225, 62);
      } else {
        ctx.moveTo(31, 62);
        ctx.quadraticCurveTo(136, 36, 221, 78);
      }
      ctx.stroke();
      return new THREE.CanvasTexture(canvas);
    };

    const createMouthTexture = (
      mouthType: 'normal' | 'talking' | 'cat' | 'open_cheer' | 'pout' | 'sing' = 'normal',
      openRatio = 0
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      if (mouthType === 'cat') {
        // Cute Anime Cat Mouth (:3 / ω)
        ctx.strokeStyle = '#9d174d';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Left loop
        ctx.arc(52, 54, 14, 0.15 * Math.PI, 0.95 * Math.PI);
        ctx.stroke();
        // Right loop
        ctx.beginPath();
        ctx.arc(76, 54, 14, 0.05 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        return new THREE.CanvasTexture(canvas);
      }

      if (mouthType === 'pout') {
        // Small cute pouty wave
        ctx.strokeStyle = '#9d174d';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(46, 58);
        ctx.quadraticCurveTo(64, 52, 82, 58);
        ctx.stroke();
        return new THREE.CanvasTexture(canvas);
      }

      if (mouthType === 'open_cheer' || mouthType === 'sing') {
        // Big joyful anime cheer mouth
        const h = mouthType === 'sing' ? 38 : 46;
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.ellipse(64, 54, 26, h * 0.6, 0, 0, Math.PI);
        ctx.fill();

        // Tongue
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(64, 54 + h * 0.25, 18, h * 0.35, 0, 0, Math.PI);
        ctx.fill();

        // Upper teeth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(45, 54 - 3, 38, 5);
        return new THREE.CanvasTexture(canvas);
      }

      if (openRatio <= 0.08) {
        // Small gentle smile curve
        ctx.strokeStyle = '#9d174d';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(64, 42, 30, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Lower lip pink accent
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(64, 56, 14, 0.25 * Math.PI, 0.75 * Math.PI);
        ctx.stroke();
      } else {
        // Open cute anime talking mouth (D-shape)
        const h = Math.min(55, openRatio * 60 + 12);
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.ellipse(64, 55, 28, h, 0, 0, Math.PI);
        ctx.fill();

        // Cute pink tongue
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(64, 55 + h * 0.4, 20, h * 0.5, 0, 0, Math.PI);
        ctx.fill();

        // Upper tooth line
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(44, 55 - 4, 40, 6);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const createBlushTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, 'rgba(244, 114, 182, 0.85)');
      grad.addColorStop(0.5, 'rgba(251, 146, 60, 0.35)');
      grad.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);

      // Cute diagonal blush marks (///)
      ctx.strokeStyle = 'rgba(219, 39, 119, 0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(35, 45);
      ctx.lineTo(50, 75);
      ctx.moveTo(55, 45);
      ctx.lineTo(70, 75);
      ctx.moveTo(75, 45);
      ctx.lineTo(90, 75);
      ctx.stroke();

      return new THREE.CanvasTexture(canvas);
    };

    // 4. Stylized Materials
    const skinMat = new THREE.MeshToonMaterial({
      color: 0xfff0ea,
    });

    const hairMat = new THREE.MeshToonMaterial({
      color: 0xfba5cb, // Cute soft pastel pink hair
    });

    const hairHighlightMat = new THREE.MeshToonMaterial({
      color: 0xfde2ee,
    });

    const ribbonMat = new THREE.MeshToonMaterial({
      color: 0x181822, // Black side hair ribbon ties
    });

    const uniformBlueMat = new THREE.MeshToonMaterial({
      color: 0x6e78b7, // Periwinkle sailor blue
    });

    const uniformWhiteMat = new THREE.MeshToonMaterial({
      color: 0xf8fafc,
    });

    const chestBowMat = new THREE.MeshToonMaterial({
      color: 0x5b64a8, // Chest ribbon bow
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.75,
    });

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.85,
    });

    const darkTrimMat = new THREE.MeshToonMaterial({
      color: 0x1e1b4b,
    });

    const shoeSoleMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
    });

    // 5. Build 3D Character Mesh Hierarchy
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, -0.62, 0);
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // --- A. HEAD & ANIME FACE ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, 0);
    characterGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Sculpted Anime Head (Smooth tapered jaw & chin)
    const headGeo = new THREE.SphereGeometry(0.38, 32, 32);
    // Taper chin
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);
      if (y < 0) {
        const factor = 1 - Math.abs(y) * 0.65;
        pos.setX(i, x * factor);
        pos.setZ(i, z * Math.max(0.7, factor));
      }
    }
    headGeo.computeVertexNormals();
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // Delicate Stylized Nose (Distinct button nose & bridge highlight)
    const noseGeo = new THREE.ConeGeometry(0.016, 0.045, 16);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, -0.04, 0.392);
    noseMesh.rotation.x = Math.PI * 0.42;
    headGroup.add(noseMesh);

    const noseHighlightGeo = new THREE.SphereGeometry(0.012, 12, 12);
    const noseHighlight = new THREE.Mesh(
      noseHighlightGeo,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
    );
    noseHighlight.position.set(0, -0.03, 0.395);
    headGroup.add(noseHighlight);

    // Eyebrows (Left & Right - Crisp curved arches clearly above eyes)
    const eyebrowGeo = new THREE.PlaneGeometry(0.18, 0.09);
    const leftBrowMat = new THREE.MeshBasicMaterial({
      map: createEyebrowTexture(true),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const leftEyebrow = new THREE.Mesh(eyebrowGeo, leftBrowMat);
    leftEyebrow.position.set(-0.135, 0.175, 0.382);
    leftEyebrow.rotation.y = -0.14;
    leftEyebrow.renderOrder = 6;
    headGroup.add(leftEyebrow);

    const rightBrowMat = new THREE.MeshBasicMaterial({
      map: createEyebrowTexture(false),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const rightEyebrow = new THREE.Mesh(eyebrowGeo, rightBrowMat);
    rightEyebrow.position.set(0.135, 0.175, 0.382);
    rightEyebrow.rotation.y = 0.14;
    rightEyebrow.renderOrder = 6;
    headGroup.add(rightEyebrow);

    // Eyes (Left & Right - Crystal Violet Eyes)
    const eyeGeo = new THREE.PlaneGeometry(0.19, 0.21);
    const leftEyeMat = new THREE.MeshBasicMaterial({
      map: createEyeTexture('normal', true),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const leftEye = new THREE.Mesh(eyeGeo, leftEyeMat);
    leftEye.position.set(-0.135, 0.045, 0.38);
    leftEye.rotation.y = -0.14;
    leftEye.renderOrder = 5;
    headGroup.add(leftEye);
    leftEyeMeshRef.current = leftEye;

    const rightEyeMat = new THREE.MeshBasicMaterial({
      map: createEyeTexture('normal', false),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const rightEye = new THREE.Mesh(eyeGeo, rightEyeMat);
    rightEye.position.set(0.135, 0.045, 0.38);
    rightEye.rotation.y = 0.14;
    rightEye.renderOrder = 5;
    headGroup.add(rightEye);
    rightEyeMeshRef.current = rightEye;

    // Cheeks Blush
    const blushGeo = new THREE.PlaneGeometry(0.15, 0.15);
    const blushMat = new THREE.MeshBasicMaterial({
      map: createBlushTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.88,
    });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.195, -0.055, 0.365);
    leftBlush.rotation.y = -0.28;
    leftBlush.renderOrder = 4;
    headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.195, -0.055, 0.365);
    rightBlush.rotation.y = 0.28;
    rightBlush.renderOrder = 4;
    headGroup.add(rightBlush);

    // Animated Mouth (talking lipsync reactive)
    const mouthGeo = new THREE.PlaneGeometry(0.11, 0.11);
    const mouthMat = new THREE.MeshBasicMaterial({
      map: createMouthTexture('normal', 0),
      transparent: true,
      depthWrite: false,
    });
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.position.set(0, -0.155, 0.388);
    mouthMesh.renderOrder = 6;
    headGroup.add(mouthMesh);
    mouthMeshRef.current = mouthMesh;

    // --- B. CUTE SHORT ANIME BOB HAIRSTYLE (NEAT, COMPACT & OFF THE BODY) ---
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);
    hairGroupRef.current = hairGroup;

    // 1. Top & Crown Scalp Volume (Neat spherical anime bob cap)
    const hairTopGeo = new THREE.SphereGeometry(0.40, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 0.06, -0.06);
    hairGroup.add(hairTop);

    // Anime Hair Gloss Highlight (Subtle shine ring across crown)
    const hairGlintGeo = new THREE.TorusGeometry(0.38, 0.018, 8, 28, Math.PI * 0.85);
    const hairGlint = new THREE.Mesh(hairGlintGeo, hairHighlightMat);
    hairGlint.position.set(0, 0.22, 0.06);
    hairGlint.rotation.set(-0.4, 0, -0.15);
    hairGroup.add(hairGlint);

    // 2. Neat Feathered Forehead Bangs (Short, framing above the eyebrows)
    const hairlineBangs = [
      { x: -0.14, y: 0.30, z: 0.23, rx: 0.08, ry: 0.35, scale: 0.65 },
      { x: -0.07, y: 0.32, z: 0.26, rx: 0.05, ry: 0.18, scale: 0.6 },
      { x: 0, y: 0.33, z: 0.27, rx: 0.02, ry: 0, scale: 0.55 },
      { x: 0.07, y: 0.32, z: 0.26, rx: 0.05, ry: -0.18, scale: 0.6 },
      { x: 0.14, y: 0.30, z: 0.23, rx: 0.08, ry: -0.35, scale: 0.65 },
    ];
    hairlineBangs.forEach((bp) => {
      const bangGeo = new THREE.ConeGeometry(0.038 * bp.scale, 0.11 * bp.scale, 16);
      const bang = new THREE.Mesh(bangGeo, hairMat);
      bang.position.set(bp.x, bp.y, bp.z);
      bang.rotation.set(Math.PI + bp.rx, bp.ry, 0);
      hairGroup.add(bang);
    });

    // 3. Cute Short Side Locks (Framing cheeks and jawline, stopping above collar)
    const createShortSideLock = (isLeft = true) => {
      const lockGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      lockGroup.position.set(sign * 0.34, 0.06, -0.04);

      // Upper cheek lock
      const upperGeo = new THREE.CylinderGeometry(0.04, 0.048, 0.22, 16);
      const upper = new THREE.Mesh(upperGeo, hairMat);
      upper.position.y = -0.1;
      upper.rotation.z = sign * -0.08;
      upper.rotation.x = -0.05;
      lockGroup.add(upper);

      // Tapered cute tip (curving gently towards the chin)
      const tipGeo = new THREE.ConeGeometry(0.046, 0.18, 16);
      const tip = new THREE.Mesh(tipGeo, hairMat);
      tip.position.set(sign * -0.02, -0.28, 0.02);
      tip.rotation.set(Math.PI, 0, sign * -0.15);
      lockGroup.add(tip);

      return lockGroup;
    };
    hairGroup.add(createShortSideLock(true));
    hairGroup.add(createShortSideLock(false));

    // 4. Short Rounded Back Bob (Hugs the nape of the neck, ending above shoulders)
    const backHairGeo = new THREE.CylinderGeometry(0.38, 0.33, 0.36, 24, 4, true, 0, Math.PI);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.position.set(0, -0.14, -0.10); // Close to head/nape, does not drop below neck
    backHair.rotation.y = -Math.PI * 0.5;
    hairGroup.add(backHair);

    // Back bottom curve closure
    const backBottomGeo = new THREE.SphereGeometry(0.33, 20, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.4);
    const backBottom = new THREE.Mesh(backBottomGeo, hairMat);
    backBottom.position.set(0, -0.28, -0.10);
    hairGroup.add(backBottom);

    // 5. Dainty Black Hair Clips / Ribbon Bows (Compact side accessories)
    const createRibbonBow = (isLeft = true) => {
      const bowGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      bowGroup.position.set(sign * 0.32, 0.18, -0.02);
      bowGroup.rotation.y = sign * 0.5;

      // Center Knot
      const knotGeo = new THREE.SphereGeometry(0.028, 16, 16);
      const knot = new THREE.Mesh(knotGeo, ribbonMat);
      bowGroup.add(knot);

      // Wings (Left & Right loops)
      const wingGeo = new THREE.TorusGeometry(0.048, 0.018, 12, 20);
      const leftWing = new THREE.Mesh(wingGeo, ribbonMat);
      leftWing.position.set(-0.045, 0.02, 0);
      leftWing.rotation.set(0.2, 0.4, 0.5);
      bowGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, ribbonMat);
      rightWing.position.set(0.045, 0.02, 0);
      rightWing.rotation.set(-0.2, -0.4, -0.5);
      bowGroup.add(rightWing);

      // Short ribbon tails
      const tailGeo = new THREE.PlaneGeometry(0.035, 0.14);
      const tailMat = new THREE.MeshBasicMaterial({ color: 0x181822, side: THREE.DoubleSide });
      const tail1 = new THREE.Mesh(tailGeo, tailMat);
      tail1.position.set(-0.02, -0.07, 0.01);
      tail1.rotation.z = 0.2;
      bowGroup.add(tail1);

      const tail2 = new THREE.Mesh(tailGeo, tailMat);
      tail2.position.set(0.02, -0.07, 0.01);
      tail2.rotation.z = -0.2;
      bowGroup.add(tail2);

      return bowGroup;
    };
    hairGroup.add(createRibbonBow(true));
    hairGroup.add(createRibbonBow(false));

    // --- C. TORSO, WAIST & SAILOR UNIFORM BLOUSE ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.92, 0);
    characterGroup.add(torsoGroup);
    torsoGroupRef.current = torsoGroup;

    // Delicate Neck
    const neckGeo = new THREE.CylinderGeometry(0.085, 0.105, 0.2, 20);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.38;
    torsoGroup.add(neck);

    // Cropped Sailor Blouse (Tailored periwinkle navy blue)
    const blouseGeo = new THREE.CylinderGeometry(0.23, 0.19, 0.42, 24);
    const blouse = new THREE.Mesh(blouseGeo, uniformBlueMat);
    blouse.position.y = 0.16;
    torsoGroup.add(blouse);

    // White Trim Band at bottom of blouse
    const blouseTrimGeo = new THREE.TorusGeometry(0.192, 0.012, 12, 32);
    const blouseTrim = new THREE.Mesh(blouseTrimGeo, uniformWhiteMat);
    blouseTrim.position.y = -0.05;
    blouseTrim.rotation.x = Math.PI * 0.5;
    torsoGroup.add(blouseTrim);

    // Sailor Collar (Navy flap with double white stripes)
    const collarGroup = new THREE.Group();
    collarGroup.position.set(0, 0.34, 0.02);
    torsoGroup.add(collarGroup);

    // Back Collar flap
    const collarBackGeo = new THREE.BoxGeometry(0.44, 0.26, 0.03);
    const collarBack = new THREE.Mesh(collarBackGeo, uniformBlueMat);
    collarBack.position.set(0, -0.02, -0.18);
    collarGroup.add(collarBack);

    // White stripes on back collar
    const stripe1Geo = new THREE.BoxGeometry(0.42, 0.016, 0.035);
    const stripe1 = new THREE.Mesh(stripe1Geo, uniformWhiteMat);
    stripe1.position.set(0, -0.1, -0.18);
    collarGroup.add(stripe1);

    const stripe2 = new THREE.Mesh(stripe1Geo, uniformWhiteMat);
    stripe2.position.set(0, -0.06, -0.18);
    collarGroup.add(stripe2);

    // Front Sailor Lapels
    const lapelGeo = new THREE.BoxGeometry(0.13, 0.3, 0.02);
    const leftLapel = new THREE.Mesh(lapelGeo, uniformBlueMat);
    leftLapel.position.set(-0.11, -0.08, 0.16);
    leftLapel.rotation.set(-0.25, 0.3, -0.3);
    collarGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, uniformBlueMat);
    rightLapel.position.set(0.11, -0.08, 0.16);
    rightLapel.rotation.set(-0.25, -0.3, 0.3);
    collarGroup.add(rightLapel);

    // Chest Ribbon Bow (Periwinkle blue)
    const chestBowGroup = new THREE.Group();
    chestBowGroup.position.set(0, 0.22, 0.22);
    torsoGroup.add(chestBowGroup);
    chestBowRef.current = chestBowGroup;

    const chestKnot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), chestBowMat);
    chestBowGroup.add(chestKnot);

    const bowLoopGeo = new THREE.TorusGeometry(0.075, 0.028, 12, 24);
    const leftBowLoop = new THREE.Mesh(bowLoopGeo, chestBowMat);
    leftBowLoop.position.set(-0.085, 0.02, 0);
    leftBowLoop.rotation.set(0.2, 0.4, 0.5);
    chestBowGroup.add(leftBowLoop);

    const rightBowLoop = new THREE.Mesh(bowLoopGeo, chestBowMat);
    rightBowLoop.position.set(0.085, 0.02, 0);
    rightBowLoop.rotation.set(-0.2, -0.4, -0.5);
    chestBowGroup.add(rightBowLoop);

    // Bow Ribbon Tails
    const chestTailGeo = new THREE.PlaneGeometry(0.06, 0.26);
    const chestTailMat = new THREE.MeshBasicMaterial({ color: 0x5b64a8, side: THREE.DoubleSide });
    const cTail1 = new THREE.Mesh(chestTailGeo, chestTailMat);
    cTail1.position.set(-0.04, -0.14, 0.02);
    cTail1.rotation.z = 0.2;
    chestBowGroup.add(cTail1);

    const cTail2 = new THREE.Mesh(chestTailGeo, chestTailMat);
    cTail2.position.set(0.04, -0.14, 0.02);
    cTail2.rotation.z = -0.2;
    chestBowGroup.add(cTail2);

    // --- D. PUFFY SLEEVES & FULLY ARTICULATED 3D ARMS & HANDS ---
    const createArm = (isLeft = true) => {
      const armGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      armGroup.position.set(sign * 0.31, 0.28, 0.04);

      // 1. Puffy Shoulder Sleeve
      const puffGeo = new THREE.SphereGeometry(0.12, 20, 20);
      const puff = new THREE.Mesh(puffGeo, uniformBlueMat);
      armGroup.add(puff);

      // White Sleeve Trim Cuffs
      const cuffGeo = new THREE.TorusGeometry(0.078, 0.014, 12, 24);
      const cuff1 = new THREE.Mesh(cuffGeo, uniformWhiteMat);
      cuff1.position.y = -0.09;
      cuff1.rotation.x = Math.PI * 0.5;
      armGroup.add(cuff1);

      // 2. Upper Arm (Bicep)
      const bicepGeo = new THREE.CylinderGeometry(0.046, 0.040, 0.22, 16);
      const bicep = new THREE.Mesh(bicepGeo, skinMat);
      bicep.position.y = -0.18;
      armGroup.add(bicep);

      // 3. Articulated Elbow Joint & Forearm (Angled Forward towards Camera)
      const forearmGroup = new THREE.Group();
      forearmGroup.position.set(0, -0.27, 0.02);
      armGroup.add(forearmGroup);

      if (isLeft) {
        leftForearmRef.current = forearmGroup;
      } else {
        rightForearmRef.current = forearmGroup;
      }

      // Smooth Elbow Spherical Joint
      const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), skinMat);
      forearmGroup.add(elbowJoint);

      // Slender Forearm (Smooth taper from elbow to wrist)
      const forearmGeo = new THREE.CylinderGeometry(0.040, 0.034, 0.24, 16);
      const forearm = new THREE.Mesh(forearmGeo, skinMat);
      forearm.position.y = -0.12;
      forearmGroup.add(forearm);

      // Wrist Cuff Ring
      const wristCuffGeo = new THREE.TorusGeometry(0.038, 0.010, 10, 20);
      const wristCuff = new THREE.Mesh(wristCuffGeo, uniformWhiteMat);
      wristCuff.position.y = -0.23;
      wristCuff.rotation.x = Math.PI * 0.5;
      forearmGroup.add(wristCuff);

      // Left Wrist Accessory: Cute Pastel Pink Ribbon Bracelet
      if (isLeft) {
        const scrunchieGeo = new THREE.TorusGeometry(0.042, 0.012, 10, 20);
        const scrunchieMat = new THREE.MeshToonMaterial({ color: 0xf472b6 });
        const scrunchie = new THREE.Mesh(scrunchieGeo, scrunchieMat);
        scrunchie.position.y = -0.21;
        scrunchie.rotation.x = Math.PI * 0.5;
        forearmGroup.add(scrunchie);
      }

      // 4. Prominently Sculpted 3D Anime Hand (Palm, 4 Fingers, Thumb)
      const handGroup = new THREE.Group();
      handGroup.position.set(0, -0.26, 0);
      forearmGroup.add(handGroup);

      if (isLeft) {
        leftHandRef.current = handGroup;
      } else {
        rightHandRef.current = handGroup;
      }

      // Palm (Soft rounded anime palm)
      const palmGeo = new THREE.BoxGeometry(0.054, 0.062, 0.026);
      const palm = new THREE.Mesh(palmGeo, skinMat);
      palm.position.y = -0.025;
      handGroup.add(palm);

      // 4 Articulated Anime Fingers (Curved naturally in front)
      const fingerLengths = [0.048, 0.058, 0.054, 0.044]; // Index, Middle, Ring, Pinky
      for (let f = 0; f < 4; f++) {
        const fingerX = -0.018 + f * 0.012;
        const fLen = fingerLengths[f];
        
        // Upper finger segment
        const fingerSeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.006, fLen * 0.6, 8), skinMat);
        fingerSeg1.position.set(fingerX, -0.055 - fLen * 0.3, 0.006);
        fingerSeg1.rotation.x = 0.22; // Gentle forward curve
        handGroup.add(fingerSeg1);

        // Finger tip segment
        const fingerSeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, fLen * 0.45, 8), skinMat);
        fingerSeg2.position.set(fingerX, -0.055 - fLen * 0.75, 0.018);
        fingerSeg2.rotation.x = 0.45; // Soft inward curl
        handGroup.add(fingerSeg2);
      }

      // Opposable Sculpted Thumb
      const thumbGroup = new THREE.Group();
      thumbGroup.position.set(sign * 0.026, -0.03, 0.01);
      handGroup.add(thumbGroup);

      const thumb1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.032, 8), skinMat);
      thumb1.position.set(0, -0.015, 0);
      thumb1.rotation.set(0.25, 0, sign * -0.45);
      thumbGroup.add(thumb1);

      const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), skinMat);
      thumbTip.position.set(sign * 0.012, -0.032, 0.008);
      thumbGroup.add(thumbTip);

      // Default Natural Stance for Forearms (Brought forward in front of body)
      if (isLeft) {
        // Left arm bent cutely forward across waist/chest
        forearmGroup.rotation.set(0.55, 0.25, 0.22);
      } else {
        // Right arm bent gently forward beside waist/hip
        forearmGroup.rotation.set(0.48, -0.22, -0.18);
      }

      return armGroup;
    };

    const leftArm = createArm(true);
    leftArm.rotation.z = -0.12; // Angled down and slightly out from shoulder
    leftArm.rotation.x = 0.25;  // Angled forward
    torsoGroup.add(leftArm);
    leftArmRef.current = leftArm;

    const rightArm = createArm(false);
    rightArm.rotation.z = 0.12;
    rightArm.rotation.x = 0.22;
    torsoGroup.add(rightArm);
    rightArmRef.current = rightArm;

    // --- E. KAMAR (WAIST, MIDRIFF & FLARED PLEATED SKIRT) ---
    const waistGroup = new THREE.Group();
    waistGroup.position.set(0, 0.72, 0);
    characterGroup.add(waistGroup);

    // Slender Midriff / Waist (Bare skin section below cropped top)
    const midriffGeo = new THREE.CylinderGeometry(0.18, 0.195, 0.12, 20);
    const midriff = new THREE.Mesh(midriffGeo, skinMat);
    midriff.position.y = 0.12;
    waistGroup.add(midriff);

    // Sailor Belt / Waistband (Navy band with shiny metallic golden buckle)
    const beltGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.045, 24);
    const belt = new THREE.Mesh(beltGeo, uniformBlueMat);
    belt.position.y = 0.04;
    waistGroup.add(belt);

    // Golden Waist Buckle (Front Center of Waist)
    const buckleGeo = new THREE.BoxGeometry(0.05, 0.042, 0.02);
    const buckle = new THREE.Mesh(buckleGeo, goldMat);
    buckle.position.set(0, 0.04, 0.205);
    waistGroup.add(buckle);

    const buckleInnerGeo = new THREE.BoxGeometry(0.03, 0.024, 0.022);
    const buckleInner = new THREE.Mesh(buckleInnerGeo, darkTrimMat);
    buckleInner.position.set(0, 0.04, 0.205);
    waistGroup.add(buckleInner);

    // Flared Pleated Mini-Skirt
    const skirtGroup = new THREE.Group();
    skirtGroup.position.set(0, 0, 0);
    waistGroup.add(skirtGroup);
    skirtRef.current = skirtGroup;

    // Flared Pleated Skirt (Accordion radial faceted geometry)
    const skirtGeo = new THREE.CylinderGeometry(0.20, 0.38, 0.34, 32, 1, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, uniformBlueMat);
    skirtMesh.position.y = -0.15;
    skirtGroup.add(skirtMesh);

    // Double White Stripes along skirt hem
    const skirtStripe1Geo = new THREE.TorusGeometry(0.36, 0.011, 12, 36);
    const skirtStripe1 = new THREE.Mesh(skirtStripe1Geo, uniformWhiteMat);
    skirtStripe1.position.y = -0.30;
    skirtStripe1.rotation.x = Math.PI * 0.5;
    skirtGroup.add(skirtStripe1);

    const skirtStripe2 = new THREE.Mesh(skirtStripe1Geo, uniformWhiteMat);
    skirtStripe2.position.y = -0.25;
    skirtStripe2.rotation.x = Math.PI * 0.5;
    skirtGroup.add(skirtStripe2);

    // --- F. PAIR (LEGS, THIGHS, THIGH-HIGH STOCKINGS & SHOES) ---
    const legsGroup = new THREE.Group();
    legsGroup.position.set(0, 0.42, 0);
    characterGroup.add(legsGroup);

    const createLeg = (isLeft = true) => {
      const legGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      legGroup.position.set(sign * 0.12, 0, 0);

      // Upper thigh (smooth bare skin peeking above stockings - Zettai Ryouiki)
      const thighGeo = new THREE.CylinderGeometry(0.082, 0.076, 0.2, 16);
      const thigh = new THREE.Mesh(thighGeo, skinMat);
      thigh.position.y = -0.06;
      legGroup.add(thigh);

      // Dark Elastic Band at top of stocking
      const topBandGeo = new THREE.TorusGeometry(0.076, 0.008, 10, 24);
      const topBand = new THREE.Mesh(topBandGeo, darkTrimMat);
      topBand.position.y = -0.15;
      topBand.rotation.x = Math.PI * 0.5;
      legGroup.add(topBand);

      // White Thigh-High Stockings (Thigh to ankle)
      const sockGeo = new THREE.CylinderGeometry(0.075, 0.058, 0.68, 16);
      const sock = new THREE.Mesh(sockGeo, uniformWhiteMat);
      sock.position.y = -0.48;
      legGroup.add(sock);

      // Knee contour highlight
      const kneeGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const knee = new THREE.Mesh(kneeGeo, uniformWhiteMat);
      knee.position.set(0, -0.32, 0.035);
      knee.scale.set(1, 1.2, 0.6);
      legGroup.add(knee);

      // Dainty Japanese School Loafer (Shoes with platform sole, heel, and silver buckle)
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -0.83, 0.03);
      legGroup.add(shoeGroup);

      // Upper Leather Shoe
      const shoeUpperGeo = new THREE.BoxGeometry(0.084, 0.065, 0.15);
      const shoeUpper = new THREE.Mesh(shoeUpperGeo, uniformBlueMat);
      shoeGroup.add(shoeUpper);

      // Platform Sole
      const soleGeo = new THREE.BoxGeometry(0.088, 0.02, 0.16);
      const sole = new THREE.Mesh(soleGeo, shoeSoleMat);
      sole.position.y = -0.038;
      shoeGroup.add(sole);

      // Heel block
      const heelGeo = new THREE.BoxGeometry(0.086, 0.025, 0.05);
      const heel = new THREE.Mesh(heelGeo, shoeSoleMat);
      heel.position.set(0, -0.055, -0.045);
      shoeGroup.add(heel);

      // Metallic Silver Buckle on shoe strap
      const shoeBuckleGeo = new THREE.BoxGeometry(0.03, 0.016, 0.015);
      const shoeBuckle = new THREE.Mesh(shoeBuckleGeo, silverMat);
      shoeBuckle.position.set(sign * 0.035, 0.025, 0.02);
      shoeGroup.add(shoeBuckle);

      return legGroup;
    };

    const leftLeg = createLeg(true);
    legsGroup.add(leftLeg);
    leftLegRef.current = leftLeg;

    const rightLeg = createLeg(false);
    legsGroup.add(rightLeg);
    rightLegRef.current = rightLeg;

    // --- G. FLOATING 3D SAKURA PETALS & MAGICAL SPARKLES ---
    const petalCount = 28;
    const petalGeo = new THREE.PlaneGeometry(0.06, 0.08);
    const petalMat = new THREE.MeshBasicMaterial({
      color: 0xfbcfe8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const petalsInstanced = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
    const dummy = new THREE.Object3D();
    const petalData: { x: number; y: number; z: number; rx: number; ry: number; speed: number }[] = [];

    for (let i = 0; i < petalCount; i++) {
      const p = {
        x: (Math.random() - 0.5) * 3.5,
        y: Math.random() * 3.5 - 1.0,
        z: (Math.random() - 0.5) * 2.2 + 0.5,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        speed: 0.008 + Math.random() * 0.012,
      };
      petalData.push(p);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, 0);
      dummy.updateMatrix();
      petalsInstanced.setMatrixAt(i, dummy.matrix);
    }
    petalsInstanced.instanceMatrix.needsUpdate = true;
    scene.add(petalsInstanced);
    petalsRef.current = petalsInstanced;

    // Floating 3D Star Sparkles
    const sparkleCount = 20;
    const sparkleShape = new THREE.Shape();
    const sOuter = 0.04;
    const sInner = 0.015;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? sOuter : sInner;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) sparkleShape.moveTo(sx, sy);
      else sparkleShape.lineTo(sx, sy);
    }
    sparkleShape.closePath();
    const sparkleGeo = new THREE.ShapeGeometry(sparkleShape);
    const sparkleMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const sparklesInstanced = new THREE.InstancedMesh(sparkleGeo, sparkleMat, sparkleCount);
    const sparkleData: { x: number; y: number; z: number; orbitAngle: number; orbitRadius: number; orbitSpeed: number; yOffset: number }[] = [];
    for (let i = 0; i < sparkleCount; i++) {
      const s = {
        orbitAngle: Math.random() * Math.PI * 2,
        orbitRadius: 0.6 + Math.random() * 1.2,
        orbitSpeed: (0.4 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1),
        yOffset: 0.2 + Math.random() * 1.5,
        x: 0,
        y: 0,
        z: 0,
      };
      sparkleData.push(s);
    }
    sparklesInstanced.instanceMatrix.needsUpdate = true;
    scene.add(sparklesInstanced);
    sparklesRef.current = sparklesInstanced;

    // --- 6. REAL-TIME 60FPS FULL MULTI-ANIMATION ENGINE ---
    let animFrameId: number;
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let isBlinking = false;
    let lastMouthUpdate = 0;
    let twirlRotation = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth gaze tracking interpolation (LERP)
      currentLookAt.current.x += (targetLookAt.current.x - currentLookAt.current.x) * 0.08;
      currentLookAt.current.y += (targetLookAt.current.y - currentLookAt.current.y) * 0.08;

      const lookX = currentLookAt.current.x;
      const lookY = currentLookAt.current.y;
      const curAudio = audioLevelRef.current;
      const curState = stateRef.current;
      const curHeadpatted = isHeadpattedRef.current;
      const curExpr = expressionRef.current;
      const curAnim = animationRef.current || 'idle';

      // 1. Whole-Body Kinematics & Twirl Handling
      if (characterGroupRef.current) {
        if (curAnim === 'twirl') {
          twirlRotation += 0.07;
          characterGroupRef.current.rotation.y = twirlRotation;
          characterGroupRef.current.position.y = -0.60 + Math.sin(elapsed * 12) * 0.04;
        } else {
          // Smoothly reset rotation toward front
          twirlRotation = 0;
          characterGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            characterGroupRef.current.rotation.y,
            lookX * 0.12,
            0.1
          );

          if (curAnim === 'dance') {
            const danceBounce = Math.abs(Math.sin(elapsed * 6)) * 0.08;
            characterGroupRef.current.position.y = -0.62 + danceBounce;
            characterGroupRef.current.position.x = Math.sin(elapsed * 3) * 0.1;
          } else if (curAnim === 'cheer') {
            const cheerHop = Math.abs(Math.sin(elapsed * 8)) * 0.12;
            characterGroupRef.current.position.y = -0.62 + cheerHop;
            characterGroupRef.current.position.x = 0;
          } else {
            const breathHop = Math.sin(elapsed * 2.4) * 0.02;
            characterGroupRef.current.position.y = -0.62 + breathHop * 0.35;
            characterGroupRef.current.position.x = 0;
          }
        }
      }

      // 2. Torso, Spine & Breathing Kinematics
      const breath = Math.sin(elapsed * 2.4) * 0.02;
      if (torsoGroupRef.current) {
        if (curAnim === 'bow') {
          // Polite Japanese Bow
          const bowCycle = (Math.sin(elapsed * 1.8) + 1) * 0.5; // 0 to 1
          torsoGroupRef.current.rotation.x = THREE.MathUtils.lerp(torsoGroupRef.current.rotation.x, 0.45 * bowCycle, 0.12);
          torsoGroupRef.current.position.y = 0.92 - 0.08 * bowCycle;
        } else if (curAnim === 'dance') {
          torsoGroupRef.current.rotation.z = Math.sin(elapsed * 6) * 0.08;
          torsoGroupRef.current.rotation.x = Math.cos(elapsed * 6) * 0.04;
          torsoGroupRef.current.position.y = 0.92 + breath * 0.5;
        } else if (curAnim === 'shy') {
          torsoGroupRef.current.rotation.x = 0.08;
          torsoGroupRef.current.rotation.z = Math.sin(elapsed * 2) * 0.02;
          torsoGroupRef.current.position.y = 0.90;
        } else if (curAnim === 'sleepy') {
          torsoGroupRef.current.rotation.x = 0.06 + Math.sin(elapsed * 1.2) * 0.03;
          torsoGroupRef.current.position.y = 0.90 + breath * 0.8;
        } else {
          torsoGroupRef.current.rotation.x = THREE.MathUtils.lerp(torsoGroupRef.current.rotation.x, 0, 0.1);
          torsoGroupRef.current.rotation.z = THREE.MathUtils.lerp(torsoGroupRef.current.rotation.z, 0, 0.1);
          torsoGroupRef.current.position.y = 0.92 + breath * 0.5;
          torsoGroupRef.current.scale.set(1 + breath * 0.4, 1 + breath * 0.6, 1 + breath * 0.4);
        }
      }

      // 3. Head & Gaze Dynamics
      if (headGroupRef.current) {
        let targetHeadY = lookX * 0.42;
        let targetHeadX = -lookY * 0.3;
        let targetHeadZ = -lookX * 0.12;

        if (curHeadpatted) {
          targetHeadY = -0.15;
          targetHeadX = -0.1;
          targetHeadZ = 0.12 + Math.sin(elapsed * 4) * 0.03;
        } else if (curAnim === 'wave') {
          targetHeadZ = -0.14 + Math.sin(elapsed * 4) * 0.04;
          targetHeadY = lookX * 0.3;
        } else if (curAnim === 'dance') {
          targetHeadZ = Math.sin(elapsed * 6) * 0.12;
          targetHeadX = Math.abs(Math.cos(elapsed * 6)) * 0.1;
        } else if (curAnim === 'cheer') {
          targetHeadX = -0.22 + Math.sin(elapsed * 8) * 0.05;
        } else if (curAnim === 'heart') {
          targetHeadZ = 0.15;
          targetHeadX = -0.05;
        } else if (curAnim === 'think') {
          targetHeadY = -0.32;
          targetHeadX = -0.25;
          targetHeadZ = 0.08;
        } else if (curAnim === 'shy') {
          targetHeadX = 0.18;
          targetHeadZ = Math.sin(elapsed * 2) * 0.06;
        } else if (curAnim === 'sleepy') {
          targetHeadX = 0.22 + Math.sin(elapsed * 1.2) * 0.08;
          targetHeadZ = 0.1;
        } else if (curAnim === 'bow') {
          targetHeadX = 0.2;
        } else if (curAnim === 'sleepy' || curExpr === 'sleeping') {
          targetHeadX = 0.16; // Gentle drooping sleepy head
          targetHeadY = Math.sin(elapsed * 0.8) * 0.04;
          targetHeadZ = 0.08;
        }

        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetHeadY, 0.12);
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetHeadX, 0.12);
        headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, targetHeadZ, 0.12);
      }

      // 4. Flowing Hair Sway Physics
      if (hairGroupRef.current) {
        const hairSway = Math.sin(elapsed * 2.8) * 0.04 - lookX * 0.08 + (curAnim === 'dance' ? Math.sin(elapsed * 6) * 0.08 : 0);
        hairGroupRef.current.rotation.z = hairSway;
        hairGroupRef.current.rotation.x = Math.cos(elapsed * 2.0) * 0.025;
      }

      // 5. Full Articulated Arm & Hand Gestures
      if (leftArmRef.current && rightArmRef.current) {
        if (curHeadpatted) {
          // Shy / bashful hands brought up near chest
          leftArmRef.current.rotation.set(0.55 + Math.sin(elapsed * 3) * 0.04, 0, 0.28);
          rightArmRef.current.rotation.set(0.55 + Math.cos(elapsed * 3) * 0.04, 0, -0.28);
        } else if (curAnim === 'wave') {
          // Right arm raised high waving vigorously
          const waveHand = Math.sin(elapsed * 7) * 0.35;
          rightArmRef.current.rotation.set(-1.35, 0.2, 0.65 + waveHand * 0.5);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.2, waveHand, -0.4);
          
          // Left arm on hip
          leftArmRef.current.rotation.set(0.35, 0.1, -0.32);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.9, 0.4, 0.3);
        } else if (curAnim === 'cheer') {
          // Both arms pumped high in victory/cheer
          const cheerPump = Math.sin(elapsed * 8) * 0.2;
          leftArmRef.current.rotation.set(-1.4 + cheerPump, -0.1, -0.55);
          rightArmRef.current.rotation.set(-1.4 - cheerPump, 0.1, 0.55);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.3, 0, 0.2);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.3, 0, -0.2);
        } else if (curAnim === 'dance') {
          // Playful swinging anime idol dance arms
          const swing = Math.sin(elapsed * 6);
          leftArmRef.current.rotation.set(0.4 + swing * 0.4, 0.2, -0.25 - swing * 0.25);
          rightArmRef.current.rotation.set(0.4 - swing * 0.4, -0.2, 0.25 - swing * 0.25);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.6 + swing * 0.3, 0.2, 0.2);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.6 - swing * 0.3, -0.2, -0.2);
        } else if (curAnim === 'heart') {
          // Hands brought together in center creating heart
          leftArmRef.current.rotation.set(0.72, 0.45, 0.32);
          rightArmRef.current.rotation.set(0.72, -0.45, -0.32);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.85, 0.4, 0.4);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.85, -0.4, -0.4);
        } else if (curAnim === 'think') {
          // Right hand on chin / cheek, left arm crossed under
          rightArmRef.current.rotation.set(0.85, -0.35, -0.15);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(1.4, -0.4, -0.3);
          leftArmRef.current.rotation.set(0.6, 0.3, 0.2);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.75, 0.5, 0.2);
        } else if (curAnim === 'shy') {
          // Hands fidgeting bashfully in front of midriff
          const fid = Math.sin(elapsed * 4) * 0.05;
          leftArmRef.current.rotation.set(0.5 + fid, 0.3, 0.2);
          rightArmRef.current.rotation.set(0.5 - fid, -0.3, -0.2);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.7, 0.5, 0.3);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.7, -0.5, -0.3);
        } else if (curAnim === 'sleepy' || curExpr === 'sleeping') {
          // Drooping relaxed arms
          leftArmRef.current.rotation.set(0.18 + Math.sin(elapsed * 1.5) * 0.02, 0, -0.06);
          rightArmRef.current.rotation.set(0.18 + Math.cos(elapsed * 1.5) * 0.02, 0, 0.06);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.25, 0, 0.1);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.25, 0, -0.1);
        } else if (curAnim === 'twirl') {
          // Ballerina arms extended outward
          leftArmRef.current.rotation.set(0.2, 0, -0.75);
          rightArmRef.current.rotation.set(0.2, 0, 0.75);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.2, 0, 0.1);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.2, 0, -0.1);
        } else if (curAnim === 'bow') {
          // Hands flat against thighs in traditional bow
          leftArmRef.current.rotation.set(0.15, 0.1, -0.05);
          rightArmRef.current.rotation.set(0.15, -0.1, 0.05);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.1, 0, 0.05);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.1, 0, -0.05);
        } else if (curState === 'speaking') {
          // Expressive talking hand gestures (floating & gesturing naturally)
          leftArmRef.current.rotation.x = 0.35 + curAudio * 0.45 + Math.sin(elapsed * 3.5) * 0.08;
          leftArmRef.current.rotation.z = -0.10 + curAudio * 0.15;
          rightArmRef.current.rotation.x = 0.28 + Math.cos(elapsed * 2.8) * 0.06;
          rightArmRef.current.rotation.z = 0.12 - Math.sin(elapsed * 2.2) * 0.06;
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.55 + curAudio * 0.3, 0.25, 0.22);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.48 + curAudio * 0.2, -0.22, -0.18);
        } else if (curState === 'listening') {
          // Attentive listening stance
          leftArmRef.current.rotation.set(0.32 + Math.sin(elapsed * 1.8) * 0.03, 0, -0.08);
          rightArmRef.current.rotation.set(0.26 + Math.cos(elapsed * 1.8) * 0.03, 0, 0.10);
        } else {
          // Default natural idle stance
          leftArmRef.current.rotation.set(0.28 + Math.sin(elapsed * 1.5) * 0.03, 0, -0.10);
          rightArmRef.current.rotation.set(0.24 + Math.cos(elapsed * 1.5) * 0.03, 0, 0.10);
          if (leftForearmRef.current) leftForearmRef.current.rotation.set(0.55, 0.25, 0.22);
          if (rightForearmRef.current) rightForearmRef.current.rotation.set(0.48, -0.22, -0.18);
        }
      }

      // 6. Skirt Flare & Physics
      if (skirtRef.current) {
        if (curAnim === 'twirl') {
          skirtRef.current.scale.set(1.22, 0.92, 1.22);
          skirtRef.current.rotation.z = Math.sin(elapsed * 10) * 0.04;
        } else {
          skirtRef.current.scale.set(1, 1, 1);
          const skirtSway = Math.sin(elapsed * 2.0) * 0.02 + (curAnim === 'dance' ? Math.sin(elapsed * 6) * 0.05 : 0);
          skirtRef.current.rotation.z = skirtSway;
        }
      }

      // 7. Leg Stance & Stepping Dynamics
      if (leftLegRef.current && rightLegRef.current) {
        if (curAnim === 'shy') {
          // Pigeon-toed knees inward
          leftLegRef.current.rotation.z = 0.08;
          rightLegRef.current.rotation.z = -0.08;
          leftLegRef.current.rotation.y = 0.12;
          rightLegRef.current.rotation.y = -0.12;
        } else if (curAnim === 'dance') {
          // Stepping side to side
          leftLegRef.current.rotation.x = Math.sin(elapsed * 6) * 0.14;
          rightLegRef.current.rotation.x = -Math.sin(elapsed * 6) * 0.14;
          leftLegRef.current.rotation.z = 0;
          rightLegRef.current.rotation.z = 0;
        } else if (curAnim === 'cheer') {
          // Bouncy feet
          leftLegRef.current.rotation.x = Math.sin(elapsed * 8) * 0.08;
          rightLegRef.current.rotation.x = Math.sin(elapsed * 8) * 0.08;
        } else {
          leftLegRef.current.rotation.z = 0;
          rightLegRef.current.rotation.z = 0;
          leftLegRef.current.rotation.y = 0;
          rightLegRef.current.rotation.y = 0;
          leftLegRef.current.rotation.x = Math.sin(elapsed * 1.6) * 0.015;
          rightLegRef.current.rotation.x = -Math.sin(elapsed * 1.6) * 0.015;
        }
      }

      // 8. Random Blinking & Expression Morphing
      blinkTimer += 0.016;
      if (blinkTimer > 3.2 + Math.sin(elapsed) * 1.2) {
        isBlinking = true;
        if (blinkTimer > 3.4 + Math.sin(elapsed) * 1.2) {
          isBlinking = false;
          blinkTimer = 0;
        }
      }

      let eyeStyle: 'normal' | 'happy' | 'blinking' | 'heart' | 'star' | 'wink' | 'sleepy' | 'thinking' = 'normal';
      if (isBlinking) {
        eyeStyle = 'blinking';
      } else if (curAnim === 'heart' || curExpr === 'love') {
        eyeStyle = 'heart';
      } else if (curAnim === 'cheer' || curExpr === 'excited') {
        eyeStyle = 'star';
      } else if (curAnim === 'sleepy' || curExpr === 'sleeping') {
        eyeStyle = 'sleepy';
      } else if (curAnim === 'think' || curExpr === 'thinking') {
        eyeStyle = 'thinking';
      } else if (curAnim === 'wave') {
        eyeStyle = Math.sin(elapsed * 3) > 0.6 ? 'wink' : 'happy';
      } else if (curExpr === 'happy' || curHeadpatted || (curState === 'speaking' && curAudio > 0.45)) {
        eyeStyle = 'happy';
      }

      if (leftEyeMeshRef.current && rightEyeMeshRef.current) {
        const leftEyeTex = createEyeTexture(eyeStyle, true);
        const rightEyeTex = createEyeTexture(eyeStyle, false);
        (leftEyeMeshRef.current.material as THREE.MeshBasicMaterial).map = leftEyeTex;
        (rightEyeMeshRef.current.material as THREE.MeshBasicMaterial).map = rightEyeTex;
        (leftEyeMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
        (rightEyeMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }

      // 9. Real-time Talking & Mouth Shape Animation
      if (mouthMeshRef.current && Date.now() - lastMouthUpdate > 60) {
        let mouthStyle: 'normal' | 'talking' | 'cat' | 'open_cheer' | 'pout' | 'sing' = 'normal';
        let mouthOpen = 0;

        if (curState === 'speaking') {
          mouthStyle = 'talking';
          mouthOpen = Math.max(0.12, curAudio * 1.3);
        } else if (curAnim === 'cheer') {
          mouthStyle = 'open_cheer';
        } else if (curAnim === 'dance') {
          mouthStyle = 'sing';
        } else if (curAnim === 'think') {
          mouthStyle = 'cat';
        } else if (curAnim === 'shy') {
          mouthStyle = 'pout';
        }

        const mouthTex = createMouthTexture(mouthStyle, mouthOpen);
        (mouthMeshRef.current.material as THREE.MeshBasicMaterial).map = mouthTex;
        (mouthMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
        lastMouthUpdate = Date.now();
      }

      // 10. Audio-reactive Dynamic Rim Lighting
      if (rimLightRef.current) {
        const themeColorHex = themeRef.current.primary || '#ec4899';
        rimLightRef.current.color.set(themeColorHex);
        rimLightRef.current.intensity = 2.0 + curAudio * 4.5 + (curAnim === 'cheer' || curAnim === 'dance' ? 1.5 : 0);
      }

      // 11. Sakura Blossom Falling & Swirling Physics
      if (petalsRef.current) {
        for (let i = 0; i < petalCount; i++) {
          const p = petalData[i];
          p.y -= p.speed * (curAnim === 'twirl' ? 1.8 : 1);
          p.x += Math.sin(elapsed * 1.5 + i) * 0.003;
          p.rx += 0.015;
          p.ry += 0.02;

          if (curAnim === 'twirl') {
            p.x += Math.cos(elapsed * 4 + i) * 0.02;
          }

          if (p.y < -1.6) {
            p.y = 2.2;
            p.x = (Math.random() - 0.5) * 3.5;
          }

          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(p.rx, p.ry, 0);
          dummy.updateMatrix();
          petalsRef.current.setMatrixAt(i, dummy.matrix);
        }
        petalsRef.current.instanceMatrix.needsUpdate = true;
      }

      // 12. Floating Magical Sparkle Orbit Dynamics
      if (sparklesRef.current) {
        for (let i = 0; i < sparkleCount; i++) {
          const s = sparkleData[i];
          s.orbitAngle += s.orbitSpeed * 0.02;
          const sx = Math.cos(s.orbitAngle) * s.orbitRadius;
          const sz = Math.sin(s.orbitAngle) * s.orbitRadius * 0.7 + 0.3;
          const sy = s.yOffset + Math.sin(elapsed * 2 + i) * 0.15;

          const scale = 0.8 + Math.sin(elapsed * 4 + i) * 0.4;
          dummy.position.set(sx, sy, sz);
          dummy.rotation.set(0, 0, elapsed * 2 + i);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          sparklesRef.current.setMatrixAt(i, dummy.matrix);
        }
        sparklesRef.current.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      id="three-anime-canvas-container"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onPointerHit}
      className="relative w-full h-[460px] sm:h-[520px] flex items-center justify-center cursor-pointer select-none touch-none overflow-hidden"
    />
  );
};
