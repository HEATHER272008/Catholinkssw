import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, PartyPopper, AlertTriangle,
  CalendarOff, Sparkles, Image as ImageIcon, Palette, Trash2, NotebookPen, Save,
  Sticker, Upload, X, Cake, Plus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import BirthdayCelebration from '@/components/BirthdayCelebration';

interface Birthday { id: string; name: string; md: string; /* MM-DD */ }

type EntryType = 'holiday' | 'suspended' | 'no_classes';

interface CalendarEntry {
  id: string;
  date: string;
  entry_type: EntryType;
  reason: string | null;
}

const typeMeta: Record<EntryType, { label: string; icon: any; dot: string }> = {
  holiday:    { label: 'Holiday',    icon: PartyPopper,   dot: 'bg-amber-500' },
  suspended:  { label: 'Suspended',  icon: AlertTriangle, dot: 'bg-red-500' },
  no_classes: { label: 'No Classes', icon: CalendarOff,   dot: 'bg-slate-500' },
};

type PresetKey = 'mocha' | 'rose' | 'sage' | 'ocean' | 'lavender' | 'noir' | 'sunset' | 'mint';

interface Preset { name: string; emoji: string; bg: string; paper: string; ink: string; accent: string; font: string; }

const PRESETS: Record<PresetKey, Preset> = {
  mocha:    { name: 'Mocha',    emoji: '🌿', bg: 'bg-[#c08660]', paper: 'bg-[#b07851]', ink: 'text-[#fdf6ec]', accent: 'text-[#fdf6ec]/90', font: "font-['Dancing_Script',cursive]" },
  rose:     { name: 'Rose',     emoji: '🌹', bg: 'bg-[#d98a8a]', paper: 'bg-[#c87575]', ink: 'text-[#fff5f5]', accent: 'text-[#fff5f5]/90', font: "font-['Dancing_Script',cursive]" },
  sage:     { name: 'Sage',     emoji: '🌱', bg: 'bg-[#8aa68a]', paper: 'bg-[#6f8c70]', ink: 'text-[#f4f8f1]', accent: 'text-[#f4f8f1]/90', font: "font-['Dancing_Script',cursive]" },
  ocean:    { name: 'Ocean',    emoji: '🌊', bg: 'bg-[#6f93b0]', paper: 'bg-[#5a7c98]', ink: 'text-[#eef6fb]', accent: 'text-[#eef6fb]/90', font: "font-['Dancing_Script',cursive]" },
  lavender: { name: 'Lavender', emoji: '💜', bg: 'bg-[#a48cb8]', paper: 'bg-[#8b73a3]', ink: 'text-[#f7f1fb]', accent: 'text-[#f7f1fb]/90', font: "font-['Dancing_Script',cursive]" },
  noir:     { name: 'Midnight', emoji: '🌙', bg: 'bg-[#1f2933]', paper: 'bg-[#2b3742]', ink: 'text-[#f1eee8]', accent: 'text-[#f1eee8]/85', font: "font-['Dancing_Script',cursive]" },
  sunset:   { name: 'Sunset',   emoji: '🌅', bg: 'bg-[#e09a5b]', paper: 'bg-[#c97f43]', ink: 'text-[#fff7ee]', accent: 'text-[#fff7ee]/90', font: "font-['Dancing_Script',cursive]" },
  mint:     { name: 'Mint',     emoji: '🍃', bg: 'bg-[#a3cdb8]', paper: 'bg-[#86b69e]', ink: 'text-[#f3fbf6]', accent: 'text-[#f3fbf6]/90', font: "font-['Dancing_Script',cursive]" },
};

const LS_THEME = 'catholink_cal_theme';
const LS_BG = 'catholink_cal_bgimage';
const LS_NOTES = 'catholink_cal_notes';
const LS_TINT = 'catholink_cal_tint';
const LS_STICKERS = 'catholink_cal_stickers';
const LS_LIB = 'catholink_cal_lib';
const LS_BDAYS = 'catholink_cal_birthdays';
const LS_BDAY_SHOWN = 'catholink_cal_bday_shown'; // YYYY-MM-DD last shown

const StudentCalendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const bgRef = useRef<HTMLInputElement>(null);
  const stickerRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [theme, setTheme] = useState<PresetKey>(() => (localStorage.getItem(LS_THEME) as PresetKey) || 'mocha');
  const [bgImage, setBgImage] = useState<string | null>(() => localStorage.getItem(LS_BG));
  const [tint, setTint] = useState<number>(() => parseInt(localStorage.getItem(LS_TINT) || '35', 10));
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_NOTES) || '{}'); } catch { return {}; }
  });
  // Stickers placed on dates: { iso: string[] of dataURLs }
  const [dayStickers, setDayStickers] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_STICKERS) || '{}'); } catch { return {}; }
  });
  // User's sticker library (data URLs)
  const [stickerLib, setStickerLib] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_LIB) || '[]'); } catch { return []; }
  });
  // Birthdays added by the student
  const [birthdays, setBirthdays] = useState<Birthday[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_BDAYS) || '[]'); } catch { return []; }
  });
  const [bdayDraftName, setBdayDraftName] = useState('');
  const [bdayDraftDate, setBdayDraftDate] = useState('');
  const [celebrateNames, setCelebrateNames] = useState<string[] | null>(null);

  const [activeSticker, setActiveSticker] = useState<string | null>(null);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [noteDay, setNoteDay] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => { localStorage.setItem(LS_THEME, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(LS_TINT, String(tint)); }, [tint]);
  useEffect(() => {
    if (bgImage) localStorage.setItem(LS_BG, bgImage); else localStorage.removeItem(LS_BG);
  }, [bgImage]);
  useEffect(() => { localStorage.setItem(LS_NOTES, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(LS_STICKERS, JSON.stringify(dayStickers)); }, [dayStickers]);
  useEffect(() => { localStorage.setItem(LS_LIB, JSON.stringify(stickerLib)); }, [stickerLib]);
  useEffect(() => { localStorage.setItem(LS_BDAYS, JSON.stringify(birthdays)); }, [birthdays]);

  // Build merged birthdays (user-added + own profile birthday)
  const allBirthdays: Birthday[] = useMemo(() => {
    const merged = [...birthdays];
    if (profile?.birthday) {
      const md = profile.birthday.slice(5); // YYYY-MM-DD -> MM-DD
      if (!merged.some((b) => b.name.toLowerCase() === profile.name.toLowerCase() && b.md === md)) {
        merged.push({ id: 'self', name: profile.name, md });
      }
    }
    return merged;
  }, [birthdays, profile?.birthday, profile?.name]);

  const birthdaysByMD = useMemo(() => {
    const m = new Map<string, Birthday[]>();
    allBirthdays.forEach((b) => {
      const arr = m.get(b.md) || [];
      arr.push(b);
      m.set(b.md, arr);
    });
    return m;
  }, [allBirthdays]);

  // Trigger celebration if today is someone's birthday (once per day)
  useEffect(() => {
    const today = new Date();
    const md = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const iso = today.toISOString().slice(0, 10);
    const todays = birthdaysByMD.get(md);
    if (todays && todays.length > 0 && localStorage.getItem(LS_BDAY_SHOWN) !== iso) {
      setCelebrateNames(todays.map((b) => b.name));
      localStorage.setItem(LS_BDAY_SHOWN, iso);
    }
  }, [birthdaysByMD]);

  const addBirthday = () => {
    if (!bdayDraftName.trim() || !bdayDraftDate) {
      toast({ title: 'Add a name and date', variant: 'destructive' });
      return;
    }
    const md = bdayDraftDate.length === 10 ? bdayDraftDate.slice(5) : bdayDraftDate;
    setBirthdays((prev) => [...prev, { id: `b-${Date.now()}`, name: bdayDraftName.trim(), md }]);
    setBdayDraftName(''); setBdayDraftDate('');
    toast({ title: 'Birthday added 🎂' });
  };

  const removeBirthday = (id: string) => setBirthdays((prev) => prev.filter((b) => b.id !== id));

  const previewCelebrate = () => {
    const names = allBirthdays.slice(0, 1).map((b) => b.name);
    setCelebrateNames(names.length ? names : [profile?.name || 'Friend']);
  };


  useEffect(() => {
    const load = async () => {
      const today = new Date();
      const start = new Date(today.getFullYear() - 1, 0, 1).toISOString().slice(0, 10);
      const end = new Date(today.getFullYear() + 1, 11, 31).toISOString().slice(0, 10);
      const { data } = await supabase
        .from('school_calendar').select('id, date, entry_type, reason')
        .gte('date', start).lte('date', end).order('date', { ascending: true });
      setEntries((data || []) as CalendarEntry[]);
      setLoading(false);
    };
    load();
  }, []);

  const entryByDate = useMemo(() => {
    const m = new Map<string, CalendarEntry>();
    entries.forEach((e) => m.set(e.date, e));
    return m;
  }, [entries]);

  const P = PRESETS[theme];
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: ({ day: number; iso: string } | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = cursor.toLocaleDateString(undefined, { month: 'long' });
  const upcoming = entries.filter((e) => e.date >= todayStr).slice(0, 6);

  const personalEvents = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return Object.entries(notes).filter(([k, v]) => k.startsWith(monthPrefix) && v.trim()).sort(([a], [b]) => a.localeCompare(b));
  }, [notes, year, month]);

  const fileToDataURL = (file: File, maxKB = 250) => new Promise<string>((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      img.onload = () => {
        const max = 256;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const w = img.width * ratio, h = img.height * ratio;
        const cvs = document.createElement('canvas');
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cvs.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('bad image'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  const handleBgUpload = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please pick something under 4 MB.', variant: 'destructive' });
      return;
    }
    const r = new FileReader();
    r.onload = () => setBgImage(r.result as string);
    r.readAsDataURL(file);
  };

  const handleStickerUpload = async (files: FileList | null) => {
    if (!files) return;
    if (stickerLib.length + files.length > 24) {
      toast({ title: 'Library full', description: 'Remove a few stickers first (max 24).', variant: 'destructive' });
      return;
    }
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      try { next.push(await fileToDataURL(f)); } catch { /* skip */ }
    }
    if (next.length) {
      setStickerLib((prev) => [...next, ...prev]);
      setActiveSticker(next[0]);
      toast({ title: `Added ${next.length} sticker${next.length > 1 ? 's' : ''}` });
    }
  };

  const removeStickerFromLib = (url: string) => {
    setStickerLib((prev) => prev.filter((u) => u !== url));
    if (activeSticker === url) setActiveSticker(null);
  };

  const tapDay = (iso: string) => {
    if (activeSticker) {
      setDayStickers((prev) => {
        const arr = prev[iso] || [];
        if (arr.length >= 3) { toast({ title: 'Max 3 stickers per day' }); return prev; }
        return { ...prev, [iso]: [...arr, activeSticker] };
      });
      return;
    }
    setNoteDay(iso);
    setNoteDraft(notes[iso] || '');
  };

  const clearDayStickers = (iso: string) => {
    setDayStickers((prev) => { const n = { ...prev }; delete n[iso]; return n; });
  };

  const saveNote = () => {
    if (!noteDay) return;
    setNotes((prev) => {
      const next = { ...prev };
      const v = noteDraft.trim();
      if (v) next[noteDay] = v.slice(0, 240); else delete next[noteDay];
      return next;
    });
    setNoteDay(null);
  };

  const wallpaperStyle: React.CSSProperties = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : {};

  return (
    <div className={`min-h-screen relative ${bgImage ? '' : P.bg} transition-colors`} style={wallpaperStyle}>
      {bgImage && <div className="fixed inset-0 pointer-events-none" style={{ background: `rgba(0,0,0,${tint / 100})` }} />}

      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CalendarDays className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight">My Calendar</h1>
            <p className="text-[11px] text-muted-foreground">Decorate with your own stickers</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCustomizeOpen(true)} className="h-9 gap-1">
            <Palette className="h-4 w-4" /> Customize
          </Button>
        </div>

        {/* Sticker tray */}
        <div className="px-3 pb-2 flex items-center gap-2 overflow-x-auto">
          <input ref={stickerRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { handleStickerUpload(e.target.files); e.target.value = ''; }} />
          <Button size="sm" variant="secondary" onClick={() => stickerRef.current?.click()} className="shrink-0 h-9 gap-1">
            <Upload className="h-3.5 w-3.5" /> Add sticker
          </Button>
          {activeSticker && (
            <Button size="sm" variant="ghost" onClick={() => setActiveSticker(null)} className="shrink-0 h-9 gap-1 text-xs">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
          <div className="flex items-center gap-1.5 pr-2">
            {stickerLib.length === 0 ? (
              <span className="text-[11px] text-muted-foreground italic px-2">Upload your own cute characters & photos</span>
            ) : stickerLib.map((s) => (
              <button key={s} onClick={() => setActiveSticker(activeSticker === s ? null : s)}
                onContextMenu={(e) => { e.preventDefault(); removeStickerFromLib(s); }}
                className={`relative shrink-0 h-10 w-10 rounded-lg overflow-hidden border-2 transition ${activeSticker === s ? 'border-primary ring-2 ring-primary/40 scale-110' : 'border-border'}`}
                title="Tap to select, long-press / right-click to remove">
                <img src={s} alt="" className="h-full w-full object-contain bg-white/50" />
              </button>
            ))}
          </div>
        </div>
        {activeSticker && (
          <div className="px-4 pb-2 -mt-1">
            <p className="text-[11px] text-primary font-medium flex items-center gap-1">
              <Sticker className="h-3 w-3" /> Tap any day to place this sticker
            </p>
          </div>
        )}
      </header>

      <main className="relative px-4 py-6 max-w-3xl mx-auto space-y-5">
        <div className={`${P.paper} ${P.ink} rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10`}>
          <div className="relative px-6 pt-6 pb-2">
            <div className="absolute right-2 top-2 text-6xl opacity-30 select-none pointer-events-none">{P.emoji}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className={`${P.ink} hover:bg-white/10 h-8 w-8`} onClick={() => setCursor(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className={`${P.font} text-4xl md:text-5xl tracking-wide`}>{monthName} {year}</h2>
              <Button variant="ghost" size="icon" className={`${P.ink} hover:bg-white/10 h-8 w-8 ml-auto`} onClick={() => setCursor(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="grid grid-cols-7 text-center mb-2">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className={`py-2 text-2xl font-bold ${P.ink}`}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((c, i) => {
                if (!c) return <div key={i} className="aspect-square" />;
                const entry = entryByDate.get(c.iso);
                const note = notes[c.iso];
                const stickers = dayStickers[c.iso] || [];
                const isToday = c.iso === todayStr;
                const md = c.iso.slice(5);
                const bdays = birthdaysByMD.get(md);
                return (
                  <button key={c.iso} onClick={() => tapDay(c.iso)}
                    onContextMenu={(e) => { if (stickers.length) { e.preventDefault(); clearDayStickers(c.iso); } }}
                    className={`aspect-square rounded-md border-2 border-dashed border-white/40 flex flex-col items-center justify-center relative transition hover:bg-white/10 active:scale-95 overflow-hidden
                      ${isToday ? 'bg-white/20 ring-2 ring-white/60' : ''}
                      ${bdays ? 'bg-pink-400/15' : ''}
                      ${activeSticker ? 'cursor-copy' : ''}
                    `}
                    title={bdays ? `🎂 ${bdays.map((b) => b.name).join(', ')}` : (entry?.reason || note || '')}>
                    <span className={`text-xl md:text-3xl font-bold ${P.ink} relative z-10`}>{c.day}</span>
                    {bdays && (
                      <span className="absolute top-0.5 right-0.5 text-sm md:text-base drop-shadow z-10" title={bdays.map((b) => b.name).join(', ')}>🎂</span>
                    )}
                    {/* stickers overlay */}
                    {stickers.length > 0 && (
                      <div className="absolute inset-0 flex flex-wrap items-end justify-center pointer-events-none">
                        {stickers.map((s, idx) => (
                          <img key={idx} src={s} alt=""
                            className="absolute object-contain drop-shadow-md"
                            style={{
                              width: '60%', height: '60%',
                              right: idx === 0 ? '-4%' : idx === 1 ? 'auto' : '40%',
                              left:  idx === 1 ? '-4%' : idx === 2 ? '30%' : 'auto',
                              bottom: idx === 2 ? '-4%' : '-4%',
                              transform: `rotate(${(idx - 1) * 8}deg)`,
                            }} />
                        ))}
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 z-10">
                      {entry && <span className={`h-1.5 w-1.5 rounded-full ${typeMeta[entry.entry_type].dot}`} />}
                      {note && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`flex flex-wrap items-center gap-3 text-[11px] ${P.accent} mt-4 pt-3 border-t border-white/20`}>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Holiday</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Suspended</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> No Classes</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white" /> My note</span>
              <span className="flex items-center gap-1">🎂 Birthday</span>
              <span className="ml-auto opacity-80">Tap day → note · Long-press → clear stickers</span>
            </div>
          </div>
        </div>

        {personalEvents.length > 0 && (
          <div className={`${P.paper} ${P.ink} rounded-2xl shadow-xl ring-1 ring-white/10 px-5 py-4`}>
            <h3 className={`${P.font} text-3xl mb-2`}>Notes</h3>
            <div className="space-y-1.5">
              {personalEvents.map(([iso, txt]) => (
                <div key={iso} className="flex items-start gap-2 text-sm">
                  <span className="font-semibold w-6 shrink-0">{parseInt(iso.slice(-2), 10)}</span>
                  <span className="opacity-90">- {txt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-background/85 backdrop-blur rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" /> Upcoming class events
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Classes are running as usual.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((entry) => {
                const meta = typeMeta[entry.entry_type];
                const Icon = meta.icon;
                const d = new Date(entry.date + 'T00:00:00');
                return (
                  <Card key={entry.id} className="p-3 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${meta.dot} flex flex-col items-center justify-center text-white`}>
                      <span className="text-[9px] uppercase font-bold leading-none">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="text-base font-bold leading-none">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{d.toLocaleDateString(undefined, { weekday: 'long' })}</p>
                        <Badge variant="outline" className="text-[10px]"><Icon className="h-3 w-3 mr-1" />{meta.label}</Badge>
                      </div>
                      {entry.reason && <p className="text-xs text-muted-foreground truncate">{entry.reason}</p>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Customize Calendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Theme</p>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
                  const pp = PRESETS[k];
                  const active = theme === k;
                  return (
                    <button key={k} onClick={() => setTheme(k)}
                      className={`relative rounded-lg p-2 border-2 ${active ? 'border-primary' : 'border-transparent'} ${pp.paper} text-white text-[10px] flex flex-col items-center justify-center h-16`}>
                      <span className="text-base">{pp.emoji}</span>
                      <span className="truncate w-full text-center">{pp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Background photo</p>
              <div className="flex items-center gap-2">
                <input ref={bgRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgUpload(f); }} />
                <Button variant="outline" size="sm" onClick={() => bgRef.current?.click()} className="gap-1">
                  <ImageIcon className="h-4 w-4" /> {bgImage ? 'Change' : 'Upload'}
                </Button>
                {bgImage && (
                  <Button variant="ghost" size="sm" onClick={() => setBgImage(null)} className="gap-1 text-destructive">
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
              {bgImage && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Photo darkness ({tint}%)</p>
                  <input type="range" min={0} max={80} step={5} value={tint}
                    onChange={(e) => setTint(parseInt(e.target.value, 10))} className="w-full accent-primary" />
                </div>
              )}
            </div>
            {stickerLib.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">My stickers ({stickerLib.length})</p>
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                  {stickerLib.map((s) => (
                    <div key={s} className="relative group">
                      <img src={s} alt="" className="h-12 w-12 object-contain border rounded bg-muted" />
                      <button onClick={() => removeStickerFromLib(s)}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Birthdays */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium flex items-center gap-1"><Cake className="h-4 w-4 text-pink-500" /> Birthdays</p>
                <Button size="sm" variant="ghost" onClick={previewCelebrate} className="h-7 text-[11px] gap-1">
                  <PartyPopper className="h-3 w-3" /> Preview
                </Button>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Name</label>
                  <input value={bdayDraftName} onChange={(e) => setBdayDraftName(e.target.value)}
                    placeholder="Celebrant name" className="w-full h-9 px-2 text-sm border rounded-md bg-background" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Date</label>
                  <input type="date" value={bdayDraftDate} onChange={(e) => setBdayDraftDate(e.target.value)}
                    className="h-9 px-2 text-sm border rounded-md bg-background" />
                </div>
                <Button size="sm" onClick={addBirthday} className="h-9 gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {allBirthdays.length > 0 && (
                <div className="mt-3 space-y-1 max-h-40 overflow-y-auto pr-1">
                  {allBirthdays.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
                      <span className="text-base">🎂</span>
                      <span className="flex-1 truncate">{b.name}</span>
                      <span className="text-xs text-muted-foreground">{b.md}</span>
                      {b.id !== 'self' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeBirthday(b.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCustomizeOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!noteDay} onOpenChange={(o) => !o && setNoteDay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-primary" />
              {noteDay && new Date(noteDay + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          {noteDay && entryByDate.get(noteDay) && (
            <div className="text-xs p-2 rounded bg-muted">
              <Badge variant="outline" className="mr-1">{typeMeta[entryByDate.get(noteDay)!.entry_type].label}</Badge>
              {entryByDate.get(noteDay)?.reason || ''}
            </div>
          )}
          <Textarea placeholder="Add a personal note for this day..." value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value.slice(0, 240))} rows={4} />
          <p className="text-[10px] text-muted-foreground -mt-2">{noteDraft.length}/240</p>
          <DialogFooter className="gap-2">
            {noteDay && notes[noteDay] && (
              <Button variant="ghost" className="text-destructive" onClick={() => { setNoteDraft(''); setNotes((p) => { const n = { ...p }; delete n[noteDay!]; return n; }); setNoteDay(null); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button onClick={saveNote} className="gap-1"><Save className="h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {celebrateNames && (
        <BirthdayCelebration names={celebrateNames} onClose={() => setCelebrateNames(null)} />
      )}
    </div>
  );
};

export default StudentCalendar;
