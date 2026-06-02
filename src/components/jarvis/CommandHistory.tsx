import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export interface CommandEntry {
  timestamp: Date;
  command: string;
  response: string;
  type: 'user' | 'system';
}

interface CommandHistoryProps {
  commands: CommandEntry[];
}

const CommandHistory = ({ commands }: CommandHistoryProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commands]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-cyan-500/20">
        <Terminal className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-mono text-cyan-400">COMMAND LOG</span>
        <span className="text-[10px] text-cyan-500/40 font-mono ml-auto">{commands.length} entries</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {commands.length === 0 ? (
          <div className="text-center py-8">
            <Terminal className="h-8 w-8 text-cyan-500/15 mx-auto mb-2" />
            <p className="text-cyan-500/30 text-xs font-mono">No commands executed</p>
            <p className="text-cyan-500/20 text-[10px] font-mono mt-1">Awaiting input...</p>
            <div className="mt-3 text-[9px] text-cyan-500/15 font-mono">
              <span className="animate-pulse">▌</span>
            </div>
          </div>
        ) : (
          commands.map((cmd, i) => (
            <div key={i} className={`border-l-2 pl-3 py-1 transition-all duration-300 ${
              cmd.type === 'user' ? 'border-cyan-500/30' : 'border-green-500/30'
            }`} style={{ animation: i === 0 ? 'fade-in 0.3s ease-out' : undefined }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-500/40 font-mono tabular-nums">
                  {cmd.timestamp.toLocaleTimeString()}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  cmd.type === 'user'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {cmd.type === 'user' ? 'CMD' : 'SYS'}
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5">{cmd.command}</p>
              <p className="text-[10px] text-cyan-500/50 font-mono mt-0.5">{cmd.response}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default CommandHistory;
