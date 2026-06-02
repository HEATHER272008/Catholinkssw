import { useEffect, useRef } from 'react';

interface JarvisRingProps {
  size?: number;
  className?: string;
}

const JarvisRing = ({ size = 200, className = '' }: JarvisRingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    let tick = 0;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2, cy = size / 2;
      tick++;
      const pulse = Math.sin(tick * 0.03) * 0.15 + 0.85;
      const fastPulse = Math.sin(tick * 0.08) * 0.2 + 0.8;

      // ── Outermost ring: faint dashed, slow ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tick * 0.002);
      ctx.strokeStyle = `rgba(6,182,212,${0.15 * pulse})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ── Ring 1: segmented arcs, counter-spin ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-tick * 0.004);
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        const glow = Math.sin(tick * 0.05 + i * 0.7) * 0.2 + 0.5;
        ctx.strokeStyle = `rgba(6,182,212,${glow})`;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.44, a, a + Math.PI / 7);
        ctx.stroke();
      }
      ctx.restore();

      // ── Main thick ring with tick marks ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tick * 0.002);
      const r = size * 0.38;
      // Ring glow
      ctx.shadowColor = 'rgba(6,182,212,0.3)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = `rgba(6,182,212,${0.5 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tick marks
      for (let i = 0; i < 72; i++) {
        const a = (Math.PI * 2 / 72) * i;
        const isMajor = i % 9 === 0;
        const inner = isMajor ? r - 12 : r - 5;
        ctx.strokeStyle = isMajor ? `rgba(6,182,212,${0.8 * pulse})` : 'rgba(6,182,212,0.2)';
        ctx.lineWidth = isMajor ? 2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * (r + 2), Math.sin(a) * (r + 2));
        ctx.stroke();
      }
      ctx.restore();

      // ── Inner ring segments: fast spin ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-tick * 0.008);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i;
        const alpha = Math.sin(tick * 0.06 + i) * 0.15 + 0.35;
        ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.30, a, a + Math.PI / 4.5);
        ctx.stroke();
      }
      ctx.restore();

      // ── Second inner ring: fast counter ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tick * 0.012);
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 / 12) * i;
        ctx.strokeStyle = `rgba(6,182,212,${0.18 * fastPulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.24, a, a + Math.PI / 10);
        ctx.stroke();
      }
      ctx.restore();

      // ── Holographic triangle (Iron Man style) ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tick * 0.006);
      const triR = size * 0.18;
      ctx.strokeStyle = `rgba(6,182,212,${0.4 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(6,182,212,0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](Math.cos(a) * triR, Math.sin(a) * triR);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Triangle inner
      ctx.strokeStyle = `rgba(6,182,212,${0.2 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const triR2 = triR * 0.6;
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i + Math.PI / 6;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * triR2, Math.sin(a) * triR2);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // ── Energy arcs (random spark effect) ──
      if (tick % 30 < 3) {
        ctx.save();
        ctx.translate(cx, cy);
        const arcAngle = (tick * 0.1) % (Math.PI * 2);
        const arcR = size * 0.36;
        ctx.strokeStyle = `rgba(6,182,212,${0.7 * fastPulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(6,182,212,0.6)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, arcR, arcAngle, arcAngle + Math.PI / 8);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── Core glow ──
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.22);
      grd.addColorStop(0, `rgba(6,182,212,${0.18 * pulse})`);
      grd.addColorStop(0.4, `rgba(6,182,212,${0.06 * pulse})`);
      grd.addColorStop(1, 'rgba(6,182,212,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, size, size);

      // Core center dot
      ctx.fillStyle = `rgba(6,182,212,${0.6 * fastPulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // ── Accent dots orbiting ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tick * 0.004);
      const dotR = size * 0.44;
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 2 / 4) * i;
        const glow = Math.sin(tick * 0.05 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(250,204,21,${0.7 * glow})`;
        ctx.shadowColor = 'rgba(250,204,21,0.4)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * dotR, Math.sin(a) * dotR, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

      // ── Data text labels orbiting ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = `rgba(6,182,212,${0.3 * pulse})`;
      ctx.font = `${Math.max(7, size * 0.032)}px monospace`;
      ctx.textAlign = 'center';
      const labels = ['SYS.OK', 'NET.ON', 'SEC.LV5', 'AI.RDY', 'CAM.HD', 'SCN.ACT', 'MEM.47%', 'CPU.23%'];
      labels.forEach((label, i) => {
        const a = (Math.PI * 2 / labels.length) * i - Math.PI / 2 + tick * 0.001;
        const lr = size * 0.42;
        ctx.save();
        ctx.translate(Math.cos(a) * lr, Math.sin(a) * lr);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`pointer-events-none ${className}`}
    />
  );
};

export default JarvisRing;
