import { useEffect, useState } from 'react';
import zebraAsset from '@/assets/zebra-shield.png.asset.json';

export type Frame = {
  key: string;
  name: string;
  ring: string;
  emoji?: string;
  image?: string;
  gradient?: string;
};

export const FRAMES: Frame[] = [
  { key: 'none',      name: 'None',       ring: 'ring-2 ring-white/30' },
  { key: 'gold',      name: 'Gold',       ring: 'ring-4 ring-amber-400 shadow-[0_0_28px_-4px_rgba(251,191,36,0.7)]', emoji: '👑' },
  { key: 'rose',      name: 'Rose',       ring: 'ring-4 ring-rose-400 shadow-[0_0_28px_-4px_rgba(244,114,182,0.7)]', emoji: '🌹' },
  { key: 'ocean',     name: 'Ocean',      ring: 'ring-4 ring-sky-400 shadow-[0_0_28px_-4px_rgba(56,189,248,0.7)]', emoji: '🌊' },
  { key: 'forest',    name: 'Forest',     ring: 'ring-4 ring-emerald-400 shadow-[0_0_28px_-4px_rgba(52,211,153,0.7)]', emoji: '🌿' },
  { key: 'galaxy',    name: 'Galaxy',     ring: 'ring-4 ring-violet-400 shadow-[0_0_28px_-4px_rgba(167,139,250,0.8)]', emoji: '✨' },
  { key: 'zebra',     name: 'Zebra',      ring: 'ring-4 ring-slate-800 shadow-[0_0_24px_-4px_rgba(15,23,42,0.7)]', image: zebraAsset.url },
  { key: 'fire',      name: 'Fire',       ring: 'ring-4 ring-orange-500 shadow-[0_0_30px_-2px_rgba(249,115,22,0.85)]', emoji: '🔥' },
  { key: 'ice',       name: 'Frost',      ring: 'ring-4 ring-cyan-300 shadow-[0_0_28px_-4px_rgba(103,232,249,0.8)]', emoji: '❄️' },
  { key: 'thunder',   name: 'Thunder',    ring: 'ring-4 ring-yellow-300 shadow-[0_0_30px_-2px_rgba(253,224,71,0.9)]', emoji: '⚡' },
  { key: 'love',      name: 'Lovely',     ring: 'ring-4 ring-pink-400 shadow-[0_0_28px_-4px_rgba(244,114,182,0.8)]', emoji: '💖' },
  { key: 'star',      name: 'Star',       ring: 'ring-4 ring-amber-300 shadow-[0_0_28px_-4px_rgba(252,211,77,0.85)]', emoji: '⭐' },
  { key: 'butterfly', name: 'Butterfly',  ring: 'ring-4 ring-fuchsia-400 shadow-[0_0_28px_-4px_rgba(232,121,249,0.8)]', emoji: '🦋' },
  { key: 'music',     name: 'Melody',     ring: 'ring-4 ring-indigo-400 shadow-[0_0_28px_-4px_rgba(129,140,248,0.8)]', emoji: '🎵' },
  { key: 'gamer',     name: 'Gamer',      ring: 'ring-4 ring-lime-400 shadow-[0_0_28px_-4px_rgba(163,230,53,0.85)]', emoji: '🎮' },
  { key: 'sun',       name: 'Sunshine',   ring: 'ring-4 ring-yellow-400 shadow-[0_0_30px_-2px_rgba(250,204,21,0.9)]', emoji: '☀️' },
  { key: 'moon',      name: 'Moonlight',  ring: 'ring-4 ring-indigo-300 shadow-[0_0_28px_-4px_rgba(165,180,252,0.7)]', emoji: '🌙' },
  { key: 'cherry',    name: 'Sakura',     ring: 'ring-4 ring-pink-300 shadow-[0_0_28px_-4px_rgba(249,168,212,0.8)]', emoji: '🌸' },
  { key: 'crown',     name: 'Royal',      ring: 'ring-[5px] ring-amber-500 shadow-[0_0_36px_-4px_rgba(245,158,11,0.95)]', emoji: '👑', gradient: 'conic-gradient(from 0deg, #f59e0b, #facc15, #fbbf24, #f59e0b)' },
  { key: 'rainbow',   name: 'Rainbow',    ring: 'ring-[5px] ring-transparent shadow-[0_0_28px_-4px_rgba(236,72,153,0.7)]', emoji: '🌈', gradient: 'conic-gradient(from 0deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f87171)' },
];

export const LS_FRAME_PREFIX = 'catholink_profile_frame:';

export function useUserFrame(userId?: string) {
  const [frameKey, setFrameKey] = useState<string>('none');
  useEffect(() => {
    if (!userId) return;
    const sync = () => setFrameKey(localStorage.getItem(LS_FRAME_PREFIX + userId) || 'none');
    sync();
    const onStorage = (e: StorageEvent) => { if (e.key === LS_FRAME_PREFIX + userId) sync(); };
    window.addEventListener('storage', onStorage);
    const id = window.setInterval(sync, 1500);
    return () => { window.removeEventListener('storage', onStorage); window.clearInterval(id); };
  }, [userId]);
  return FRAMES.find(f => f.key === frameKey) || FRAMES[0];
}

type Props = {
  userId?: string;
  imageUrl?: string | null;
  name: string;
  size?: number;
  showBadge?: boolean;
  className?: string;
};

export const FramedAvatar = ({ userId, imageUrl, name, size = 64, showBadge = true, className = '' }: Props) => {
  const F = useUserFrame(userId);
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const inner = (
    <div className="rounded-full overflow-hidden h-full w-full bg-card">
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-primary/15 flex items-center justify-center font-semibold text-primary" style={{ fontSize: size * 0.32 }}>
          {initials}
        </div>
      )}
    </div>
  );

  const badgeSize = Math.max(20, Math.round(size * 0.32));

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {F.gradient ? (
        <div className="rounded-full p-[3px] animate-spin-slow h-full w-full" style={{ background: F.gradient, animationDuration: '6s' }}>
          <div className="rounded-full bg-background p-[2px] h-full w-full">
            {inner}
          </div>
        </div>
      ) : (
        <div className={`rounded-full overflow-hidden h-full w-full ${F.ring}`}>
          {inner}
        </div>
      )}
      {showBadge && (F.image || F.emoji) && F.key !== 'none' && (
        <div
          className="absolute -top-1 -right-1 rounded-full bg-card border-2 border-background flex items-center justify-center shadow overflow-hidden"
          style={{ height: badgeSize, width: badgeSize }}
        >
          {F.image ? (
            <img src={F.image} alt="" className="object-contain" style={{ height: badgeSize * 0.75, width: badgeSize * 0.75 }} />
          ) : (
            <span style={{ fontSize: badgeSize * 0.6 }}>{F.emoji}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default FramedAvatar;
