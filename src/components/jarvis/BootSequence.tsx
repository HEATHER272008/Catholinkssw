import { useState, useEffect, useRef } from 'react';

// Boot sequence is purely cosmetic — keep it short so the JARVIS page
// feels snappy. Delays were halved (and a few lines removed) so the full
// animation now finishes in ~2s instead of 4.5s.
const BOOT_LINES = [
  { text: 'JARVIS KERNEL v3.7.1 — INITIALIZING...', delay: 0, type: 'system' },
  { text: 'Quantum encryption layer: ACTIVE', delay: 150, type: 'info' },
  { text: 'Establishing secure uplink... ✓', delay: 300, type: 'success' },
  { text: 'Biometric verification: AUTHORIZED', delay: 450, type: 'success' },
  { text: 'AI Core neural mesh: 2.4B parameters loaded', delay: 600, type: 'info' },
  { text: 'Threat analysis engine: ONLINE', delay: 800, type: 'success' },
  { text: 'Camera array: HD 1080p READY', delay: 950, type: 'success' },
  { text: 'All systems nominal. Welcome back, Sir.', delay: 1150, type: 'final' },
];

const TOTAL_DURATION = 1900;

interface Props { onComplete: () => void; }

const BootSequence = ({ onComplete }: Props) => {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [fading, setFading] = useState(false);
  const [glitchFlash, setGlitchFlash] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix rain background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const chars = 'JARVIS01アイウエオカキクケコ⟨⟩◇◈⬡⬢'.split('');
    const columns = Math.floor(canvas.width / 14);
    const drops = Array(columns).fill(0).map(() => Math.random() * -100);
    let raf: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(5,8,16,0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '12px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const brightness = Math.random();
        if (brightness > 0.7) {
          ctx.fillStyle = `rgba(6,182,212,${0.6 + brightness * 0.4})`;
        } else {
          ctx.fillStyle = `rgba(6,182,212,${0.1 + brightness * 0.2})`;
        }
        ctx.fillText(char, i * 14, drops[i] * 14);
        if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.5 + Math.random() * 0.5;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // Boot sequence timing
  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(prev => [...prev, i]), line.delay)
    );
    // Glitch flash effects (timings rescaled to short boot)
    const g1 = setTimeout(() => { setGlitchFlash(true); setTimeout(() => setGlitchFlash(false), 80); }, 350);
    const g2 = setTimeout(() => { setGlitchFlash(true); setTimeout(() => setGlitchFlash(false), 60); }, 750);
    const g3 = setTimeout(() => { setGlitchFlash(true); setTimeout(() => setGlitchFlash(false), 100); }, 1200);
    const fadeTimer = setTimeout(() => setFading(true), TOTAL_DURATION - 800);
    const doneTimer = setTimeout(onComplete, TOTAL_DURATION);
    return () => { timers.forEach(clearTimeout); clearTimeout(fadeTimer); clearTimeout(doneTimer); clearTimeout(g1); clearTimeout(g2); clearTimeout(g3); };
  }, [onComplete]);

  const progress = (visibleLines.length / BOOT_LINES.length) * 100;
  const isReady = progress >= 100;

  const getLineColor = (type: string) => {
    switch (type) {
      case 'system': return 'text-cyan-400';
      case 'success': return 'text-green-400';
      case 'final': return 'text-amber-300 font-bold';
      default: return 'text-cyan-300/70';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${fading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      style={{ transition: 'opacity 700ms, transform 700ms' }}>
      {/* Matrix rain canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Skip button — lets the user bypass the cinematic intro instantly */}
      <button
        onClick={() => { setFading(true); setTimeout(onComplete, 250); }}
        className="absolute top-4 right-4 z-40 text-[10px] font-mono tracking-widest text-cyan-400/60 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/60 rounded px-3 py-1.5 bg-slate-900/60 backdrop-blur transition-all"
      >
        SKIP ▸
      </button>

      {/* Glitch flash overlay */}
      {glitchFlash && (
        <div className="absolute inset-0 z-10 bg-cyan-400/10 mix-blend-screen" />
      )}

      {/* Scan line overlay */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(6,182,212,0.03)_2px,rgba(6,182,212,0.03)_4px)] pointer-events-none z-20" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_60%)] z-20 pointer-events-none" />

      <div className="relative z-30 w-full max-w-lg px-6 space-y-6">
        {/* Logo with glow */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            {/* Outer glow ring */}
            <div className={`absolute -inset-8 rounded-full transition-all duration-1000 ${isReady ? 'opacity-100' : 'opacity-40'}`}
              style={{
                background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            <div className="text-4xl font-bold tracking-[0.5em] text-cyan-400 font-mono relative"
              style={{
                textShadow: '0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(6,182,212,0.2), 0 0 80px rgba(6,182,212,0.1)',
              }}>
              J.A.R.V.I.S.
            </div>
            <div className="text-[10px] text-cyan-500/50 tracking-[0.3em] mt-2 font-mono">
              COMMAND & CONTROL INTERFACE v3.7
            </div>
            {/* Decorative line */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-pulse" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-500/40" />
            </div>
          </div>
        </div>

        {/* Boot log */}
        <div className="bg-slate-900/70 border border-cyan-500/15 rounded-lg p-4 font-mono text-xs space-y-1 min-h-[260px] backdrop-blur-sm relative overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-cyan-500/10">
            <div className="w-2 h-2 rounded-full bg-green-400/80 animate-pulse" />
            <span className="text-[9px] text-cyan-500/50 tracking-widest">SYSTEM DIAGNOSTICS</span>
            <span className="ml-auto text-[9px] text-cyan-500/30">{new Date().toLocaleTimeString()}</span>
          </div>

          {BOOT_LINES.map((line, i) => (
            <div
              key={i}
              className={`transition-all duration-300 flex items-start gap-2 ${visibleLines.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
            >
              <span className="text-cyan-500/30 shrink-0">[{String(i).padStart(2, '0')}]</span>
              <span className={`${getLineColor(line.type)} ${line.type === 'success' ? '' : ''}`}>
                {line.type === 'success' && <span className="text-green-400 mr-1">✓</span>}
                {line.text}
              </span>
            </div>
          ))}

          {/* Blinking cursor at end */}
          {!isReady && (
            <div className="mt-1">
              <span className="text-cyan-400 animate-pulse">▌</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-500 relative"
              style={{
                width: `${progress}%`,
                background: isReady
                  ? 'linear-gradient(90deg, #06b6d4, #22c55e)'
                  : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between text-[9px] font-mono">
            <span className={isReady ? 'text-green-400/80' : 'text-cyan-500/40'}>
              {isReady ? '● SYSTEM READY' : 'BOOT SEQUENCE'}
            </span>
            <span className={isReady ? 'text-green-400/80' : 'text-cyan-500/40'}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Security clearance badge */}
        <div className={`text-center transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono text-amber-400/80 tracking-widest">CLEARANCE LEVEL 5 — SUPER ADMIN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BootSequence;
