import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  const displaySeconds = seconds.toString().padStart(2, '0');

  const today = time.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      {/* Mini Clock Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 bg-foreground/5 dark:bg-foreground/10 rounded-lg px-2 py-1 hover:bg-foreground/10 dark:hover:bg-foreground/15 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm font-mono font-bold text-foreground tabular-nums tracking-tight">
            {displayHours}
          </span>
          <span className="text-sm font-mono font-bold text-foreground animate-pulse">:</span>
          <span className="text-sm font-mono font-bold text-foreground tabular-nums tracking-tight">
            {displayMinutes}
          </span>
        </div>
        <span className="text-[9px] font-medium text-muted-foreground ml-0.5">
          {isPM ? 'PM' : 'AM'}
        </span>
      </button>

      {/* Full Clock Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none overflow-hidden bg-transparent shadow-none [&>button]:hidden">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 animate-scale-in shadow-2xl border border-slate-700/50">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-2xl" />

            {/* Close button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Clock Display */}
            <div className="flex flex-col items-center justify-center relative z-10">
              {/* AM/PM indicator with glow */}
              <div className="self-start mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-emerald-400 text-sm font-bold tracking-widest drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                  {isPM ? 'PM' : 'AM'}
                </span>
              </div>

              {/* Main Time Display - LED Style */}
              <div className="flex items-center justify-center">
                <div className="flex items-baseline">
                  {/* Hours */}
                  <span className="text-7xl sm:text-8xl font-mono font-black text-white tabular-nums tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-fade-in" style={{ animationDelay: '0.1s', textShadow: '0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.2)' }}>
                    {displayHours.toString().padStart(2, '0')}
                  </span>
                  {/* Colon with glow */}
                  <span className="text-7xl sm:text-8xl font-mono font-black text-primary mx-2 animate-pulse" style={{ textShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary))' }}>
                    :
                  </span>
                  {/* Minutes */}
                  <span className="text-7xl sm:text-8xl font-mono font-black text-white tabular-nums tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-fade-in" style={{ animationDelay: '0.2s', textShadow: '0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.2)' }}>
                    {displayMinutes}
                  </span>
                </div>
                {/* Seconds with subtle glow */}
                <span className="text-3xl sm:text-4xl font-mono font-bold text-primary/80 tabular-nums self-end mb-3 ml-2 animate-fade-in" style={{ animationDelay: '0.3s', textShadow: '0 0 15px hsl(var(--primary) / 0.5)' }}>
                  {displaySeconds}
                </span>
              </div>

              {/* Date Display with line accents */}
              <div className="mt-6 flex items-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-500" />
                <span className="text-slate-400 text-sm font-medium tracking-wide">
                  {today}
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-500" />
              </div>
            </div>

            {/* Background glow effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-primary/10 pointer-events-none rounded-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DigitalClock;
