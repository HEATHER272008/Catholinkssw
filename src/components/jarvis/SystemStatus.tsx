import { useEffect, useState } from 'react';
import { Activity, Clock, Globe, Lock, Server, Users, Wifi, Zap } from 'lucide-react';

const SystemStatus = () => {
  const [time, setTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const statusItems = [
    { icon: Wifi, label: 'Network', status: 'Connected', ok: true, color: 'text-cyan-400' },
    { icon: Activity, label: 'System', status: 'Operational', ok: true, color: 'text-green-400' },
    { icon: Clock, label: 'Uptime', status: formatUptime(uptime), ok: true, color: 'text-blue-400' },
    { icon: Server, label: 'Server', status: 'Online', ok: true, color: 'text-emerald-400' },
    { icon: Lock, label: 'Security', status: 'Secured', ok: true, color: 'text-amber-400' },
    { icon: Globe, label: 'Region', status: 'US-EAST', ok: true, color: 'text-purple-400' },
    { icon: Users, label: 'Sessions', status: `${Math.floor(3 + Math.sin(uptime * 0.1) * 5 + 5)}`, ok: true, color: 'text-cyan-400' },
    { icon: Zap, label: 'Latency', status: `${Math.floor(8 + Math.sin(uptime * 0.3) * 4)}ms`, ok: true, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-1">
      {/* Live clock */}
      <div className="text-center py-1 mb-1 border-b border-cyan-500/10">
        <div className="text-base font-mono text-cyan-400/80 tabular-nums tracking-wider">
          {time.toLocaleTimeString()}
        </div>
        <div className="text-[8px] font-mono text-cyan-500/30">
          {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {statusItems.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-0.5 border-b border-cyan-500/5 last:border-0 group">
          <div className="flex items-center gap-1.5">
            <item.icon className={`h-2.5 w-2.5 ${item.color} opacity-50 group-hover:opacity-80 transition-opacity`} />
            <span className="text-[9px] text-cyan-400/50 font-mono">{item.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-1 h-1 rounded-full ${item.ok ? 'bg-green-400' : 'bg-red-400'} ${item.ok ? '' : 'animate-pulse'}`} />
            <span className="text-[9px] text-cyan-300/70 font-mono tabular-nums">{item.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SystemStatus;
