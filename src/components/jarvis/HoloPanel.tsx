import { ReactNode, useEffect, useState } from 'react';

interface HoloPanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  accentColor?: string;
  compact?: boolean;
}

const HoloPanel = ({ title, icon, children, className = '', accentColor = 'cyan', compact = false }: HoloPanelProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const colors: Record<string, { border: string; bg: string; text: string; glow: string; line: string }> = {
    cyan: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', text: 'text-cyan-400', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.06)]', line: 'via-cyan-500/20' },
    blue: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.06)]', line: 'via-blue-500/20' },
    green: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.06)]', line: 'via-emerald-500/20' },
    amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.06)]', line: 'via-amber-500/20' },
    purple: { border: 'border-purple-500/20', bg: 'bg-purple-500/5', text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.06)]', line: 'via-purple-500/20' },
  };

  const c = colors[accentColor] || colors.cyan;

  return (
    <div className={`relative border ${c.border} ${c.glow} rounded-lg bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${className}`}>
      {/* Animated scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute w-full h-px bg-gradient-to-r from-transparent ${c.line} to-transparent`}
          style={{ top: '30%', animation: 'pulse 3s ease-in-out infinite' }} />
      </div>

      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l ${c.border} rounded-tl-lg opacity-60`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r ${c.border} rounded-tr-lg opacity-60`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l ${c.border} rounded-bl-lg opacity-60`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r ${c.border} rounded-br-lg opacity-60`} />

      {/* Header */}
      <div className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} border-b ${c.border} ${c.bg}`}>
        {icon && <span className={c.text}>{icon}</span>}
        <span className={`text-[10px] font-mono ${c.text} tracking-widest uppercase`}>{title}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[8px] text-green-400/50 font-mono">LIVE</span>
        </div>
      </div>

      {/* Content */}
      <div className={compact ? 'p-2' : 'p-3'}>
        {children}
      </div>
    </div>
  );
};

export default HoloPanel;
