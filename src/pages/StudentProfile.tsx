import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Upload, Mail, Phone, GraduationCap, UserCheck, Users, Cake,
  Pencil, LogOut, Check, X, Shield, Crown, Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PageTransition from '@/components/PageTransition';
import zebraAsset from '@/assets/zebra-shield.png.asset.json';

type Frame = {
  key: string;
  name: string;
  ring: string;     // tailwind ring + shadow classes
  emoji?: string;
  image?: string;   // url image badge (shield style)
  gradient?: string;// css gradient for animated ring background
};

const FRAMES: Frame[] = [
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

const LS_FRAME_PREFIX = 'catholink_profile_frame:';
const LS_STATUS_PREFIX = 'catholink_status_msg:';

const StudentProfile = () => {
  const navigate = useNavigate();
  const { profile, userRole, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const uid = profile?.user_id || '';
  const LS_FRAME = LS_FRAME_PREFIX + uid;
  const LS_STATUS = LS_STATUS_PREFIX + uid;
  const [frame, setFrame] = useState<string>('none');
  const [status, setStatus] = useState<string>('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');

  // Load per-user values when uid becomes available
  useEffect(() => {
    if (!uid) return;
    setFrame(localStorage.getItem(LS_FRAME_PREFIX + uid) || 'none');
    setStatus(localStorage.getItem(LS_STATUS_PREFIX + uid) || '');
  }, [uid]);

  useEffect(() => { if (uid) localStorage.setItem(LS_FRAME_PREFIX + uid, frame); }, [frame, uid]);
  useEffect(() => { if (uid) localStorage.setItem(LS_STATUS_PREFIX + uid, status); }, [status, uid]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('No file');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile?.user_id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('profile-pictures').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('profiles').update({ profile_picture_url: data.publicUrl }).eq('user_id', profile?.user_id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: 'Profile photo updated' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const savePhone = async () => {
    if (!profile?.user_id) return;
    setSavingPhone(true);
    const { error } = await supabase.from('profiles').update({ phone: phoneDraft.trim() || null }).eq('user_id', profile.user_id);
    setSavingPhone(false);
    if (error) { toast({ title: 'Could not save', description: error.message, variant: 'destructive' }); return; }
    await refreshProfile();
    setEditingPhone(false);
    toast({ title: 'Phone number updated' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!profile) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <CrossLogo size={120} clickable={false} />
          <p className="mt-4 text-lg text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const F = FRAMES.find((f) => f.key === frame) || FRAMES[0];
  const initials = profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  // Avatar render with optional animated gradient frame
  const renderAvatar = (size: number, withBadge: boolean) => {
    const inner = (
      <div className="rounded-full bg-card overflow-hidden h-full w-full">
        {profile.profile_picture_url ? (
          <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/15 flex items-center justify-center text-3xl font-bold text-primary">
            {initials}
          </div>
        )}
      </div>
    );

    return (
      <div className="relative" style={{ width: size, height: size }}>
        {F.gradient ? (
          <div className="rounded-full p-[5px] animate-spin-slow" style={{ background: F.gradient, animationDuration: '6s' }}>
            <div className="rounded-full bg-background p-[3px]">
              <div className={`rounded-full overflow-hidden`} style={{ width: size - 16, height: size - 16 }}>
                {inner}
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-full overflow-hidden ${F.ring} transition-all h-full w-full`}>
            {inner}
          </div>
        )}

        {/* Frame badge top-right */}
        {withBadge && (F.image || F.emoji) && (
          <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-card border-2 border-background flex items-center justify-center shadow overflow-hidden">
            {F.image ? (
              <img src={F.image} alt="" className="h-7 w-7 object-contain" />
            ) : (
              <span className="text-xl">{F.emoji}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-primary/15 via-background to-background pb-12">
        {/* Hero header */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground pb-28 pt-4 overflow-hidden rounded-b-[2.5rem]">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_85%_70%,white,transparent_40%)]" />
          <div className="relative max-w-2xl mx-auto px-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/15" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/15" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" /> Log out
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-20 relative">
          {/* Avatar + identity */}
          <div className="flex flex-col items-center text-center">
            {renderAvatar(140, true)}

            {/* Upload button */}
            <Label htmlFor="picture" className="cursor-pointer -mt-9 z-10">
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center shadow-lg hover:scale-110 transition">
                <Upload className="h-4 w-4" />
              </div>
            </Label>
            <Input id="picture" type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />

            <h1 className="mt-3 text-2xl font-bold">{profile.name}</h1>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap justify-center">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {profile.section || '—'}
              </span>
              {userRole === 'super_admin' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold inline-flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Super Admin
                </span>
              )}
              {userRole === 'admin' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>

            {/* Status line */}
            <div className="mt-3 w-full max-w-sm">
              {editingStatus ? (
                <div className="flex items-center gap-1">
                  <Input value={statusDraft} maxLength={80} placeholder="What's on your mind?"
                    onChange={(e) => setStatusDraft(e.target.value)} className="h-8 text-sm" autoFocus />
                  <Button size="icon" className="h-8 w-8" onClick={() => { setStatus(statusDraft); setEditingStatus(false); }}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingStatus(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button onClick={() => { setStatusDraft(status); setEditingStatus(true); }}
                  className="text-sm text-muted-foreground italic hover:text-foreground transition">
                  {status ? `"${status}"` : '+ Add a status'}
                </button>
              )}
            </div>
          </div>

          {/* Frame picker — bigger and more beautiful */}
          <Card className="p-5 mt-6 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Profile Frame
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{F.name}</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
              {FRAMES.map((f) => {
                const active = frame === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFrame(f.key)}
                    className={`group relative flex flex-col items-center gap-1 transition ${active ? 'scale-110' : 'hover:scale-105 opacity-90'}`}
                    title={f.name}
                  >
                    <div className="relative h-12 w-12">
                      {f.gradient ? (
                        <div className="rounded-full p-[3px] h-full w-full animate-spin-slow" style={{ background: f.gradient, animationDuration: '6s' }}>
                          <div className="rounded-full bg-card h-full w-full flex items-center justify-center">
                            {f.image ? <img src={f.image} className="h-6 w-6 object-contain" alt="" /> : <span className="text-base">{f.emoji}</span>}
                          </div>
                        </div>
                      ) : (
                        <div className={`rounded-full bg-muted h-full w-full ${f.ring} flex items-center justify-center overflow-hidden`}>
                          {f.image ? <img src={f.image} className="h-7 w-7 object-contain" alt="" /> : f.emoji ? <span className="text-lg">{f.emoji}</span> : null}
                        </div>
                      )}
                      {active && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] truncate w-full text-center ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{f.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Info grid */}
          <Card className="mt-4 divide-y overflow-hidden">
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow icon={Phone} label="Phone" value={
              editingPhone ? (
                <div className="flex items-center gap-1 -my-1">
                  <Input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)}
                    placeholder="09xx xxx xxxx" className="h-8 text-sm" autoFocus />
                  <Button size="icon" className="h-8 w-8" onClick={savePhone} disabled={savingPhone}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingPhone(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : profile.phone || 'Not provided'
            } actionIcon={!editingPhone ? Pencil : undefined}
              onAction={() => { setPhoneDraft(profile.phone || ''); setEditingPhone(true); }} />
            <InfoRow icon={GraduationCap} label="Section" value={profile.section || '—'} />
            <InfoRow icon={UserCheck} label="Adviser" value={profile.adviser_name || 'Not assigned'} />
            <InfoRow icon={Users} label="Parent / Guardian" value={profile.parent_guardian_name || 'Not provided'} />
            <InfoRow icon={Phone} label="Parent contact" value={profile.parent_number || 'Not provided'} />
            {profile.birthday && (
              <InfoRow icon={Cake} label="Birthday" value={new Date(profile.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} />
            )}
          </Card>

          <Button variant="outline" className="w-full mt-4 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Log out
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
        html.reduce-motion .animate-spin-slow { animation: none !important; }
      `}</style>
    </PageTransition>
  );
};

const InfoRow = ({ icon: Icon, label, value, actionIcon: ActionIcon, onAction }: {
  icon: any; label: string; value: React.ReactNode; actionIcon?: any; onAction?: () => void;
}) => (
  <div className="flex items-center gap-3 p-4">
    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
    {ActionIcon && (
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onAction}>
        <ActionIcon className="h-4 w-4" />
      </Button>
    )}
  </div>
);

export default StudentProfile;
