import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; color: string;
  type: 'dot' | 'data' | 'energy';
  life: number; maxLife: number;
}

const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const particles: Particle[] = [];
    const COLORS = ['rgba(6,182,212,', 'rgba(59,130,246,', 'rgba(16,185,129,'];

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Standard particles
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        type: 'dot',
        life: 0, maxLife: Infinity,
      });
    }

    // Data nodes (larger, brighter, pulsing)
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 3 + 2,
        alpha: 0.6,
        color: COLORS[0],
        type: 'data',
        life: 0, maxLife: Infinity,
      });
    }

    let tick = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick++;

      // Spawn occasional energy particles
      if (tick % 60 === 0 && particles.length < 120) {
        const edge = Math.floor(Math.random() * 4);
        let sx = 0, sy = 0, svx = 0, svy = 0;
        if (edge === 0) { sx = 0; sy = Math.random() * canvas.height; svx = 1 + Math.random(); svy = (Math.random() - 0.5) * 0.5; }
        else if (edge === 1) { sx = canvas.width; sy = Math.random() * canvas.height; svx = -(1 + Math.random()); svy = (Math.random() - 0.5) * 0.5; }
        else if (edge === 2) { sx = Math.random() * canvas.width; sy = 0; svx = (Math.random() - 0.5) * 0.5; svy = 1 + Math.random(); }
        else { sx = Math.random() * canvas.width; sy = canvas.height; svx = (Math.random() - 0.5) * 0.5; svy = -(1 + Math.random()); }
        particles.push({
          x: sx, y: sy, vx: svx, vy: svy, size: 1.5, alpha: 0.7,
          color: 'rgba(6,182,212,', type: 'energy', life: 0, maxLife: 200,
        });
      }

      // Draw connections (only between nearby dots)
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].type === 'energy') continue;
        for (let j = i + 1; j < particles.length; j++) {
          if (particles[j].type === 'energy') continue;
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6,182,212,${0.06 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life++;

        if (p.type === 'energy') {
          if (p.life > p.maxLife) { particles.splice(i, 1); continue; }
          const fade = 1 - p.life / p.maxLife;
          // Energy trail
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${0.8 * fade})`;
          ctx.shadowColor = `${p.color}0.5)`;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
          // Trail
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8);
          ctx.strokeStyle = `${p.color}${0.3 * fade})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          continue;
        }

        // Wrap at edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        if (p.type === 'data') {
          // Pulsing data node
          const dataPulse = Math.sin(tick * 0.04 + i) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * dataPulse, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * dataPulse})`;
          ctx.fill();
          // Outer ring
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = `${p.color}${0.15 * dataPulse})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          // Glow
          const dg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          dg.addColorStop(0, `${p.color}${p.alpha * 0.2 * dataPulse})`);
          dg.addColorStop(1, `${p.color}0)`);
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.fill();
          // Glow
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          g.addColorStop(0, `${p.color}${p.alpha * 0.25})`);
          g.addColorStop(1, `${p.color}0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default ParticleField;
