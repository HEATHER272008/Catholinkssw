import { useEffect, useState } from 'react';
import { Cake, X, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BirthdayCelebrationProps {
  names: string[];
  onClose: () => void;
}

const YT_VIDEO_ID = '9Tjhzkaj5jQ';

const BirthdayCelebration = ({ names, onClose }: BirthdayCelebrationProps) => {
  const [confetti] = useState(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 3,
      color: ['#f472b6', '#fbbf24', '#60a5fa', '#34d399', '#a78bfa', '#f87171'][i % 6],
      size: 6 + Math.random() * 8,
    }))
  );

  useEffect(() => {
    const t = setTimeout(() => onClose(), 60_000); // auto-close after 1 min
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute -top-4 rounded-sm"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.6,
              background: c.color,
              animation: `confetti-fall ${c.duration}s linear ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-pink-100 via-amber-50 to-rose-100 dark:from-pink-950/70 dark:via-amber-950/40 dark:to-rose-950/70 ring-1 ring-white/40 animate-in zoom-in-95 duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-10 rounded-full bg-white/70 hover:bg-white text-gray-800 h-9 w-9 shadow"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="px-6 pt-8 pb-6 text-center">
          <div className="relative inline-block">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-bounce">✨</span>
            <div className="text-8xl drop-shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
              🎂
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-pink-600 dark:text-pink-300 font-semibold uppercase tracking-widest text-xs">
            <PartyPopper className="h-4 w-4" /> Happy Birthday <PartyPopper className="h-4 w-4" />
          </div>

          <h2
            className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            {names.length === 1 ? names[0] : names.join(' & ')}!
          </h2>

          <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
            Wishing you a day full of joy, laughter, and cake! 🎉🎈
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-4xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎈</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎁</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🎊</span>
            <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>🎂</span>
            <span className="animate-bounce" style={{ animationDelay: '0.8s' }}>🥳</span>
          </div>

          <Button
            onClick={onClose}
            className="mt-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full px-6 shadow-lg"
          >
            <Cake className="h-4 w-4 mr-1.5" /> Thank you!
          </Button>
        </div>

        {/* Hidden YouTube audio autoplay */}
        <iframe
          title="Birthday song"
          width="1"
          height="1"
          src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&controls=0&modestbranding=1&playsinline=1`}
          allow="autoplay"
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 1, height: 1 }}
        />
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default BirthdayCelebration;
