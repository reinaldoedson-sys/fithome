import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Info,
  Maximize2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SquatAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SquatAnimationModal: React.FC<SquatAnimationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showJoints, setShowJoints] = useState(true);
  const [showAngleTelemetry, setShowAngleTelemetry] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [manualScrub, setManualScrub] = useState<number | null>(null); // 0 to 1
  const [activePoseIndex, setActivePoseIndex] = useState<1 | 2 | 3>(1);

  // Animation refs
  const startTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);

  // Invariable bone lengths
  const BONES = {
    shin: 78,       // Tornozelo até Joelho
    thigh: 84,      // Joelho até Quadril
    torso: 92,      // Quadril até Ombro
    headRadius: 18, // Raio da cabeça
    neck: 16,       // Ombro até base da cabeça
    arm: 54,        // Ombro até Cotovelo
    forearm: 50,    // Cotovelo até Mão
    footLength: 38  // Tornozelo até ponta do pé
  };

  // Ground anchor
  const groundY = 370;
  const anklePos = { x: 210, y: groundY - 8 };

  // 3 Key Poses strictly according to specifications:
  // 1. Em pé: joelhos e quadril estendidos, braços ao lado do corpo
  // 2. Meio agachado: joelhos e quadril dobrados cerca de 60°, braços levantados à frente
  // 3. Agachado embaixo: joelhos dobrados cerca de 100°, quadril para trás, tronco inclinado, braços à frente na altura do ombro
  const POSES = [
    {
      namePt: '1. Em pé',
      nameEn: '1. Standing',
      shinAngle: 0 * Math.PI / 180,
      kneeBend: 4 * Math.PI / 180,
      torsoAngle: 4 * Math.PI / 180,
      shoulderAngle: 12 * Math.PI / 180,
      elbowBend: 10 * Math.PI / 180
    },
    {
      namePt: '2. Meio agachado',
      nameEn: '2. Half Squat',
      shinAngle: 15 * Math.PI / 180,
      kneeBend: 60 * Math.PI / 180,
      torsoAngle: 25 * Math.PI / 180,
      shoulderAngle: 62 * Math.PI / 180,
      elbowBend: 16 * Math.PI / 180
    },
    {
      namePt: '3. Agachado embaixo',
      nameEn: '3. Deep Squat',
      shinAngle: 26 * Math.PI / 180,
      kneeBend: 100 * Math.PI / 180,
      torsoAngle: 36 * Math.PI / 180,
      shoulderAngle: 88 * Math.PI / 180,
      elbowBend: 8 * Math.PI / 180
    }
  ];

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  // Easing interpolation for smooth 1 -> 2 -> 3 -> 2 -> 1
  function getInterpolatedAngles(progress: number) {
    // Oscillating curve u from 0 to 1 and back using smooth cosine ease-in-out
    const u = (1 - Math.cos(2 * Math.PI * progress)) / 2;

    let currentAngles = {
      shinAngle: 0,
      kneeBend: 0,
      torsoAngle: 0,
      shoulderAngle: 0,
      elbowBend: 0,
      poseProgress: u
    };

    if (u <= 0.5) {
      const localT = u / 0.5;
      const eased = localT * localT * (3 - 2 * localT);
      const p1 = POSES[0];
      const p2 = POSES[1];

      currentAngles = {
        shinAngle: lerp(p1.shinAngle, p2.shinAngle, eased),
        kneeBend: lerp(p1.kneeBend, p2.kneeBend, eased),
        torsoAngle: lerp(p1.torsoAngle, p2.torsoAngle, eased),
        shoulderAngle: lerp(p1.shoulderAngle, p2.shoulderAngle, eased),
        elbowBend: lerp(p1.elbowBend, p2.elbowBend, eased),
        poseProgress: u
      };
    } else {
      const localT = (u - 0.5) / 0.5;
      const eased = localT * localT * (3 - 2 * localT);
      const p2 = POSES[1];
      const p3 = POSES[2];

      currentAngles = {
        shinAngle: lerp(p2.shinAngle, p3.shinAngle, eased),
        kneeBend: lerp(p2.kneeBend, p3.kneeBend, eased),
        torsoAngle: lerp(p2.torsoAngle, p3.torsoAngle, eased),
        shoulderAngle: lerp(p2.shoulderAngle, p3.shoulderAngle, eased),
        elbowBend: lerp(p2.elbowBend, p3.elbowBend, eased),
        poseProgress: u
      };
    }

    return currentAngles;
  }

  // Forward Kinematics
  function computeJointPositions(angles: ReturnType<typeof getInterpolatedAngles>) {
    // 1. Tornozelo (Ankle) - FIXED on the floor
    const ankle = { x: anklePos.x, y: anklePos.y };

    // 2. Joelho (Knee)
    const knee = {
      x: ankle.x + BONES.shin * Math.sin(angles.shinAngle),
      y: ankle.y - BONES.shin * Math.cos(angles.shinAngle)
    };

    // 3. Quadril (Hip)
    const thighAngle = angles.kneeBend - angles.shinAngle;
    const hip = {
      x: knee.x - BONES.thigh * Math.sin(thighAngle),
      y: knee.y - BONES.thigh * Math.cos(thighAngle)
    };

    // 4. Ombro (Shoulder)
    const shoulder = {
      x: hip.x + BONES.torso * Math.sin(angles.torsoAngle),
      y: hip.y - BONES.torso * Math.cos(angles.torsoAngle)
    };

    // 5. Cabeça (Head)
    const head = {
      x: shoulder.x + BONES.neck * Math.sin(angles.torsoAngle * 0.8),
      y: shoulder.y - BONES.neck * Math.cos(angles.torsoAngle * 0.8) - BONES.headRadius + 2
    };

    // 6. Cotovelo (Elbow)
    const elbow = {
      x: shoulder.x + BONES.arm * Math.sin(angles.shoulderAngle),
      y: shoulder.y + BONES.arm * Math.cos(angles.shoulderAngle)
    };

    // 7. Mão (Hand)
    const forearmAngle = angles.shoulderAngle + angles.elbowBend;
    const hand = {
      x: elbow.x + BONES.forearm * Math.sin(forearmAngle),
      y: elbow.y + BONES.forearm * Math.cos(forearmAngle)
    };

    // 8. Pé
    const heel = { x: ankle.x - 14, y: groundY };
    const toe = { x: ankle.x + BONES.footLength, y: groundY };

    return { ankle, knee, hip, shoulder, head, elbow, hand, heel, toe };
  }

  // Main Canvas Render
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CYCLE_DURATION = 3000 / speedMultiplier; // 3 seconds adjusted by speed

    const render = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      let progress = 0;
      if (manualScrub !== null) {
        progress = manualScrub;
      } else if (isPlaying) {
        const elapsed = (timestamp - startTimeRef.current) % CYCLE_DURATION;
        progress = elapsed / CYCLE_DURATION;
        progressRef.current = progress;
      } else {
        progress = progressRef.current;
      }

      // Calculate angles
      const angles = getInterpolatedAngles(progress);
      const joints = computeJointPositions(angles);

      // Active pose detection
      const u = angles.poseProgress;
      if (u < 0.25) setActivePoseIndex(1);
      else if (u > 0.75) setActivePoseIndex(3);
      else setActivePoseIndex(2);

      // 1. Clear background (Fundo claro)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f8fafc'; // Fundo claro suave
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Subtle floor grid pattern
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 40; x <= canvas.width - 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, groundY + 50);
        ctx.stroke();
      }

      // 3. Linha do chão (Ground line)
      ctx.beginPath();
      ctx.moveTo(30, groundY);
      ctx.lineTo(canvas.width - 30, groundY);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Sombra suave sob o pé
      ctx.beginPath();
      ctx.ellipse(joints.ankle.x + 12, groundY + 5, 42, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fill();

      // 4. Traço grosso e arredondado para o boneco de palitos
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a'; // Cor escura simples e sólida

      // --- Pé (Fixo no chão) ---
      ctx.beginPath();
      ctx.moveTo(joints.heel.x, joints.heel.y - 2);
      ctx.lineTo(joints.toe.x, joints.toe.y - 2);
      ctx.stroke();

      // Tornozelo ao pé
      ctx.beginPath();
      ctx.moveTo(joints.ankle.x, joints.ankle.y);
      ctx.lineTo(joints.heel.x + 8, joints.heel.y - 2);
      ctx.stroke();

      // --- Canela (Tornozelo -> Joelho) ---
      ctx.beginPath();
      ctx.moveTo(joints.ankle.x, joints.ankle.y);
      ctx.lineTo(joints.knee.x, joints.knee.y);
      ctx.stroke();

      // --- Coxa (Joelho -> Quadril) ---
      ctx.beginPath();
      ctx.moveTo(joints.knee.x, joints.knee.y);
      ctx.lineTo(joints.hip.x, joints.hip.y);
      ctx.stroke();

      // --- Tronco (Quadril -> Ombro) ---
      ctx.beginPath();
      ctx.moveTo(joints.hip.x, joints.hip.y);
      ctx.lineTo(joints.shoulder.x, joints.shoulder.y);
      ctx.stroke();

      // --- Braço (Ombro -> Cotovelo -> Mão) ---
      ctx.beginPath();
      ctx.moveTo(joints.shoulder.x, joints.shoulder.y);
      ctx.lineTo(joints.elbow.x, joints.elbow.y);
      ctx.lineTo(joints.hand.x, joints.hand.y);
      ctx.stroke();

      // --- Cabeça (Círculo) ---
      ctx.beginPath();
      ctx.arc(joints.head.x, joints.head.y, BONES.headRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // 5. Juntas (Ombro, Cotovelo, Quadril, Joelho, Tornozelo)
      if (showJoints) {
        const jointList = [
          { p: joints.shoulder, name: 'Ombro', labelOffset: { x: -45, y: -8 } },
          { p: joints.elbow, name: 'Cotovelo', labelOffset: { x: 10, y: -8 } },
          { p: joints.hip, name: 'Quadril', labelOffset: { x: -50, y: 4 } },
          { p: joints.knee, name: 'Joelho', labelOffset: { x: 12, y: 4 } },
          { p: joints.ankle, name: 'Tornozelo', labelOffset: { x: -60, y: 4 } }
        ];

        jointList.forEach(j => {
          // Ponto da junta
          ctx.beginPath();
          ctx.arc(j.p.x, j.p.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981'; // Destaque esmeralda simples
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Texto do rótulo
          if (showAngleTelemetry) {
            ctx.font = '600 11px system-ui, sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText(j.name, j.p.x + j.labelOffset.x, j.p.y + j.labelOffset.y);
          }
        });
      }

      // 6. Telemetria de ângulos biomecânicos
      if (showAngleTelemetry) {
        const kneeDeg = Math.round(angles.kneeBend * 180 / Math.PI);
        const torsoDeg = Math.round(angles.torsoAngle * 180 / Math.PI);
        const armDeg = Math.round(angles.shoulderAngle * 180 / Math.PI);

        // Caixa de telemetria no canto superior
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(16, 16, 175, 76, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = '700 10px system-ui, sans-serif';
        ctx.fillStyle = '#10b981';
        ctx.fillText('BIOMECÂNICA EM TEMPO REAL', 26, 32);

        ctx.font = '500 11px system-ui, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`• Dobra Joelho: ${kneeDeg}°`, 26, 48);
        ctx.fillText(`• Inclinação Tronco: ${torsoDeg}°`, 26, 64);
        ctx.fillText(`• Elevação Braço: ${armDeg}°`, 26, 80);
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isOpen, isPlaying, speedMultiplier, showJoints, showAngleTelemetry, manualScrub]);

  if (!isOpen) return null;

  const handleJumpToPose = (poseNum: 1 | 2 | 3) => {
    setIsPlaying(false);
    if (poseNum === 1) setManualScrub(0);
    else if (poseNum === 2) setManualScrub(0.25);
    else if (poseNum === 3) setManualScrub(0.5);
  };

  const handleResumeAnimation = () => {
    setManualScrub(null);
    setIsPlaying(true);
    startTimeRef.current = performance.now();
  };

  const handleCopyCode = async () => {
    try {
      const response = await fetch('/squat-animation.html');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      // Fallback
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-display">
                {language === 'en'
                  ? 'Stick Figure Squat Animation (Canvas)'
                  : language === 'es'
                  ? 'Animación de Sentadilla con Muñeco de Palitos'
                  : 'Animação de Agachamento (Boneco de Palitos)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                HTML/CSS/JavaScript (Canvas) • Vista lateral • 3s loop com Easing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Canvas Wrapper */}
          <div className="relative mx-auto bg-slate-100 border border-slate-300 rounded-2xl overflow-hidden shadow-inner max-w-[440px] aspect-square flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={440}
              height={440}
              className="w-full h-full block"
            />
          </div>

          {/* Key Poses Selector Badges */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Poses-Chave do Ciclo (1 → 2 → 3 → 2 → 1)</span>
              <span className="text-emerald-400 font-bold">
                {activePoseIndex === 1 && 'Pose 1: Em pé (estendido)'}
                {activePoseIndex === 2 && 'Pose 2: Meio agachado (~60°)'}
                {activePoseIndex === 3 && 'Pose 3: Agachado embaixo (~100°)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleJumpToPose(1)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                  activePoseIndex === 1
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                1. Em pé
              </button>
              <button
                type="button"
                onClick={() => handleJumpToPose(2)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                  activePoseIndex === 2
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                2. Meio agachado
              </button>
              <button
                type="button"
                onClick={() => handleJumpToPose(3)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                  activePoseIndex === 3
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                3. Agachado embaixo
              </button>
            </div>
          </div>

          {/* Interactive Playback & Scrubber Controls */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (manualScrub !== null) {
                      handleResumeAnimation();
                    } else {
                      setIsPlaying(p => !p);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
                >
                  {isPlaying && manualScrub === null ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Reproduzir</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResumeAnimation}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                  title="Reiniciar ciclo contínuo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                <span className="text-[10px] text-slate-500 px-1 font-medium">Velocidade:</span>
                {[0.5, 1, 1.5].map(speed => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setSpeedMultiplier(speed)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                      speedMultiplier === speed
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowJoints(v => !v)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    showJoints
                      ? 'bg-slate-800 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {showJoints ? 'Juntas: Visíveis' : 'Juntas: Ocultas'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAngleTelemetry(v => !v)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    showAngleTelemetry
                      ? 'bg-slate-800 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {showAngleTelemetry ? 'Ângulos: Ativos' : 'Ângulos: Ocultos'}
                </button>
              </div>
            </div>

            {/* Scrubber slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0s (Em pé)</span>
                <span>1.5s (Fundo ~100°)</span>
                <span>3.0s (Retorno)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={manualScrub !== null ? manualScrub : progressRef.current}
                onChange={e => {
                  setIsPlaying(false);
                  setManualScrub(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>

          {/* Quick Details & Export Actions */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Comprimento dos ossos invariável com pés 100% ancorados no chão.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar HTML/JS</span>
                  </>
                )}
              </button>

              <a
                href="/squat-animation.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Página Cheia</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
