import { useEffect, useState, useRef } from 'react';
import { Cpu, Database, HardDrive, Network, Shield, Thermometer, Wifi, Zap } from 'lucide-react';
import HoloPanel from './HoloPanel';

const DataGrid = () => {
  const [metrics, setMetrics] = useState({
    cpu: 23, mem: 47, net: 92, disk: 31,
    temp: 42, power: 98, latency: 12, uptime: 99.97,
    threats: 0, sessions: 7, bandwidth: 84, processes: 142,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 8)),
        mem: Math.max(30, Math.min(80, prev.mem + (Math.random() - 0.5) * 4)),
        net: Math.max(70, Math.min(100, prev.net + (Math.random() - 0.5) * 6)),
        disk: Math.max(20, Math.min(60, prev.disk + (Math.random() - 0.5) * 2)),
        temp: Math.max(35, Math.min(65, prev.temp + (Math.random() - 0.5) * 3)),
        power: Math.max(90, Math.min(100, prev.power + (Math.random() - 0.5) * 2)),
        latency: Math.max(5, Math.min(50, prev.latency + (Math.random() - 0.5) * 5)),
        uptime: 99.97,
        threats: Math.random() > 0.95 ? 1 : 0,
        sessions: Math.max(1, Math.min(20, Math.round(prev.sessions + (Math.random() - 0.5) * 2))),
        bandwidth: Math.max(50, Math.min(100, prev.bandwidth + (Math.random() - 0.5) * 8)),
        processes: Math.max(100, Math.min(200, Math.round(prev.processes + (Math.random() - 0.5) * 10))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /** Mini sparkline chart */
  const Sparkline = ({ value, color = 'cyan' }: { value: number; color?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const historyRef = useRef<number[]>([value]);

    useEffect(() => {
      const h = historyRef.current;
      h.push(value);
      if (h.length > 20) h.shift();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
      const w = canvas.offsetWidth, ht = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, ht);

      const colorMap: Record<string, string> = {
        cyan: '6,182,212', blue: '59,130,246', amber: '245,158,11', green: '16,185,129', red: '239,68,68',
      };
      const c = colorMap[color] || colorMap.cyan;

      // Fill gradient
      ctx.beginPath();
      ctx.moveTo(0, ht);
      h.forEach((v, i) => {
        const x = (i / (h.length - 1)) * w;
        const y = ht - (v / 100) * ht;
        if (i === 0) ctx.lineTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.lineTo(w, ht);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, ht);
      grad.addColorStop(0, `rgba(${c},0.15)`);
      grad.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      h.forEach((v, i) => {
        const x = (i / (h.length - 1)) * w;
        const y = ht - (v / 100) * ht;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = `rgba(${c},0.6)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // End dot
      const lastX = w;
      const lastY = ht - (h[h.length - 1] / 100) * ht;
      ctx.fillStyle = `rgba(${c},0.9)`;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
      ctx.fill();
    }, [value, color]);

    return <canvas ref={canvasRef} className="w-full h-5" />;
  };

  const MiniBar = ({ value, color = 'cyan' }: { value: number; color?: string }) => {
    const barColor = value > 80 ? 'bg-red-400' : value > 60 ? 'bg-amber-400' : `bg-${color}-400`;
    return (
      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    );
  };

  const MetricItem = ({ icon: Icon, label, value, unit, color = 'cyan', showSparkline = false }: {
    icon: any; label: string; value: number | string; unit?: string; color?: string; showSparkline?: boolean;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 text-${color}-400/60`} />
        <span className="text-[9px] text-cyan-400/50 font-mono uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-mono text-cyan-300 tabular-nums">{typeof value === 'number' ? Math.round(value) : value}</span>
        {unit && <span className="text-[9px] text-cyan-500/40 font-mono">{unit}</span>}
      </div>
      {typeof value === 'number' && showSparkline ? (
        <Sparkline value={value} color={color} />
      ) : typeof value === 'number' ? (
        <MiniBar value={value} color={color} />
      ) : null}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      <HoloPanel title="Processing" icon={<Cpu className="h-3 w-3" />} compact accentColor="cyan">
        <div className="grid grid-cols-2 gap-3">
          <MetricItem icon={Cpu} label="CPU" value={metrics.cpu} unit="%" showSparkline />
          <MetricItem icon={Database} label="MEM" value={metrics.mem} unit="%" showSparkline />
        </div>
      </HoloPanel>

      <HoloPanel title="Network" icon={<Wifi className="h-3 w-3" />} compact accentColor="blue">
        <div className="grid grid-cols-2 gap-3">
          <MetricItem icon={Network} label="NET" value={metrics.net} unit="%" color="blue" showSparkline />
          <MetricItem icon={Zap} label="PING" value={metrics.latency} unit="ms" color="blue" />
        </div>
      </HoloPanel>

      <HoloPanel title="Hardware" icon={<Thermometer className="h-3 w-3" />} compact accentColor="amber">
        <div className="grid grid-cols-2 gap-3">
          <MetricItem icon={Thermometer} label="TEMP" value={metrics.temp} unit="°C" color="amber" />
          <MetricItem icon={HardDrive} label="DISK" value={metrics.disk} unit="%" color="amber" />
        </div>
      </HoloPanel>

      <HoloPanel title="Security" icon={<Shield className="h-3 w-3" />} compact accentColor="green">
        <div className="grid grid-cols-2 gap-3">
          <MetricItem icon={Shield} label="THREAT" value={metrics.threats === 0 ? 'CLEAR' : 'ALERT'} color="green" />
          <MetricItem icon={Zap} label="UPTIME" value={`${metrics.uptime}`} unit="%" color="green" />
        </div>
      </HoloPanel>
    </div>
  );
};

export default DataGrid;
