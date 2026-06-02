import { useState, useEffect, useRef } from 'react';
import {
  Settings, Moon, Sun, Globe, Bell, BellOff, Volume2, VolumeX, Info, ChevronRight,
  ExternalLink, LogOut, Vibrate, Type, Wand2, Download, Trash, RefreshCw, MessageCircle,
  Star, FileText, Bug, HelpCircle, Layout, ImageIcon, Zap, Eye, EyeOff, BatteryCharging,
  RotateCcw, Pin, Smile, Cloud, MailQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation, languageNames, type Language } from '@/hooks/useTranslation';
import { CrossLogo } from '@/components/CrossLogo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ---- LocalStorage keys ----
const K = {
  sound: 'catholink_sound',
  vibrate: 'catholink_vibrate',
  font: 'catholink_font_scale',
  motion: 'catholink_reduced_motion',
  compact: 'catholink_compact_view',
  autosave: 'catholink_autosave_drafts',
  floating: 'catholink_floating_btn',
  swipe: 'catholink_swipe_gestures',
  autorefresh: 'catholink_autorefresh',
  refreshrate: 'catholink_refresh_rate',
  daily: 'catholink_daily_reminder',
  birthday: 'catholink_birthday_reminder',
  battery: 'catholink_battery_saver',
  hidead: 'catholink_hide_ads',
  sensitive: 'catholink_sensitive_warn',
  defaultpage: 'catholink_default_page',
  hidden: 'catholink_hidden_mode',
};

const VERSION = '1.4.0';
const CHANGELOG = [
  { v: '1.4.0', notes: ['Customizable calendar with stickers', 'Profile frames', 'Greatly expanded settings'] },
  { v: '1.3.0', notes: ['Absence excuse system', 'Music Map enhancements'] },
  { v: '1.2.0', notes: ['Offline QR codes', 'Section late stats'] },
];

const useLS = (key: string, def: string) => {
  const [v, setV] = useState<string>(() => localStorage.getItem(key) ?? def);
  useEffect(() => { localStorage.setItem(key, v); }, [key, v]);
  return [v, setV] as const;
};
const useLSBool = (key: string, def: boolean) => {
  const [v, setV] = useState<boolean>(() => {
    const raw = localStorage.getItem(key);
    return raw === null ? def : raw === 'true';
  });
  useEffect(() => { localStorage.setItem(key, String(v)); }, [key, v]);
  return [v, setV] as const;
};

const SettingsDialog = () => {
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'main' | 'languages' | 'changelog' | 'faq'>('main');

  // theme + push (live state)
  const [darkMode, setDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // persisted toggles
  const [sound, setSound] = useLSBool(K.sound, true);
  const [vibrate, setVibrate] = useLSBool(K.vibrate, true);
  const [font, setFont] = useLS(K.font, '1');
  const [motion, setMotion] = useLSBool(K.motion, false);
  const [compact, setCompact] = useLSBool(K.compact, false);
  const [autosave, setAutosave] = useLSBool(K.autosave, true);
  const [floating, setFloating] = useLSBool(K.floating, true);
  const [swipe, setSwipe] = useLSBool(K.swipe, true);
  const [autorefresh, setAutorefresh] = useLSBool(K.autorefresh, false);
  const [refreshrate, setRefreshrate] = useLS(K.refreshrate, '60');
  const [daily, setDaily] = useLSBool(K.daily, false);
  const [birthday, setBirthday] = useLSBool(K.birthday, true);
  const [battery, setBattery] = useLSBool(K.battery, false);
  const [hidead, setHidead] = useLSBool(K.hidead, false);
  const [sensitive, setSensitive] = useLSBool(K.sensitive, true);
  const [defaultPage, setDefaultPage] = useLS(K.defaultpage, '/dashboard');
  const [hidden, setHidden] = useLSBool(K.hidden, false);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
    setPushEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  }, [open]);

  // Apply visual settings live
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${parseFloat(font) * 16}px`;
    return () => { root.style.fontSize = ''; };
  }, [font]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', motion);
  }, [motion]);

  useEffect(() => {
    document.documentElement.classList.toggle('compact', compact);
  }, [compact]);

  useEffect(() => {
    document.documentElement.classList.toggle('battery-saver', battery);
  }, [battery]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(document.documentElement.classList.contains('dark'));
  };

  const togglePush = async () => {
    if (!pushEnabled && typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setPushEnabled(perm === 'granted');
    } else setPushEnabled(!pushEnabled);
  };

  const buzz = () => { if (vibrate && navigator.vibrate) navigator.vibrate(30); };

  const exportData = async () => {
    buzz();
    const data: any = { profile, exportedAt: new Date().toISOString() };
    if (user) {
      const [att, ex, tasks] = await Promise.all([
        supabase.from('attendance').select('*').eq('student_id', user.id),
        supabase.from('absence_excuses').select('*').eq('student_id', user.id),
        supabase.from('task_completions').select('*').eq('student_id', user.id),
      ]);
      data.attendance = att.data || [];
      data.excuses = ex.data || [];
      data.task_completions = tasks.data || [];
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `catholink-data-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data downloaded' });
  };

  const clearCache = async () => {
    buzz();
    const preserve = ['catholink_language', 'catholink_dark'];
    const saved: Record<string, string> = {};
    preserve.forEach((k) => { const v = localStorage.getItem(k); if (v) saved[k] = v; });
    // wipe local + session
    localStorage.clear(); sessionStorage.clear();
    Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    toast({ title: 'Cache cleared', description: 'Reloading…' });
    setTimeout(() => window.location.reload(), 600);
  };

  const resetSettings = () => {
    if (!confirm('Reset all settings to defaults? Your data is safe.')) return;
    Object.values(K).forEach((k) => localStorage.removeItem(k));
    toast({ title: 'Settings reset' });
    setTimeout(() => window.location.reload(), 400);
  };

  const checkUpdate = async () => {
    buzz();
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update()));
    }
    toast({ title: `You're on v${VERSION}`, description: 'Up to date.' });
  };

  const handleLogout = async () => {
    if (!confirm('Log out of CathoLink?')) return;
    await signOut();
    setOpen(false);
    navigate('/');
  };

  const invite = async () => {
    buzz();
    const text = `Join me on CathoLink! ${window.location.origin}`;
    if (navigator.share) { try { await navigator.share({ text }); return; } catch {} }
    await navigator.clipboard.writeText(text);
    toast({ title: 'Invite link copied' });
  };

  const reportProblem = () => {
    const email = 'support@catholink.app';
    window.location.href = `mailto:${email}?subject=CathoLink%20Problem%20Report&body=Describe%20your%20issue%3A%0A%0A%0A--%0AVersion%3A%20${VERSION}%0AUser%3A%20${encodeURIComponent(profile?.email || '')}`;
  };

  const languages = Object.entries(languageNames) as [Language, string][];

  // ---- Sub-views ----
  if (view === 'languages') {
    return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setView('main'); }}>
        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><Settings className="h-4 w-4" /></Button></DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView('main')} className="h-8 px-2">← Back</Button>
              <Globe className="h-5 w-5 text-primary" /> Language
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-2">
            <div className="grid grid-cols-1 gap-1.5">
              {languages.map(([code, name]) => (
                <button key={code} onClick={() => { setLanguage(code); setView('main'); }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${language === code ? 'bg-primary/10 border-2 border-primary text-primary font-semibold' : 'bg-card border border-border hover:bg-muted/50'}`}>
                  <span className="text-sm">{name}</span>
                  <span className="text-xs text-muted-foreground uppercase">{code}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  if (view === 'changelog' || view === 'faq') {
    return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setView('main'); }}>
        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><Settings className="h-4 w-4" /></Button></DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView('main')} className="h-8 px-2">← Back</Button>
              {view === 'changelog' ? <><FileText className="h-5 w-5 text-primary" /> What's new</> : <><HelpCircle className="h-5 w-5 text-primary" /> FAQ</>}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-2">
            {view === 'changelog' ? (
              <div className="space-y-4">
                {CHANGELOG.map((c) => (
                  <div key={c.v} className="border-l-2 border-primary pl-3">
                    <p className="font-semibold text-sm">v{c.v}</p>
                    <ul className="text-xs text-muted-foreground list-disc ml-4 mt-1 space-y-0.5">
                      {c.notes.map((n) => <li key={n}>{n}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  ['How do I scan my QR?', 'Open the dashboard and tap "My QR Code" — show it to your teacher\'s scanner.'],
                  ['What if I\'m offline?', 'Use "Offline QR" — it generates a weekly secure code that works without internet.'],
                  ['How do excuses work?', 'Submit a reason from the Excuses page; your teacher reviews and approves.'],
                  ['Can I change my email?', 'Email changes require admin assistance. Contact support below.'],
                  ['Why isn\'t my dark mode saving?', 'Make sure you allow cookies / local storage for the app.'],
                ].map(([q, a]) => (
                  <div key={q} className="p-3 rounded-lg bg-muted/40 border">
                    <p className="font-semibold">{q}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // ---- Main view ----
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setView('main'); }}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><Settings className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[88vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-5 grid grid-cols-4 h-9">
            <TabsTrigger value="general" className="text-[11px]">General</TabsTrigger>
            <TabsTrigger value="display" className="text-[11px]">Display</TabsTrigger>
            <TabsTrigger value="privacy" className="text-[11px]">Privacy</TabsTrigger>
            <TabsTrigger value="about" className="text-[11px]">About</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-5 py-3 max-h-[60vh]">
            {/* GENERAL */}
            <TabsContent value="general" className="mt-0 space-y-3">
              <Section title="Appearance">
                <Row icon={darkMode ? Moon : Sun} label="Dark mode" desc="Easier on the eyes">
                  <Switch checked={darkMode} onCheckedChange={toggleDark} />
                </Row>
                <Row icon={Globe} label="Language" desc={languageNames[language]} onClick={() => setView('languages')} chevron />
                <Row icon={Type} label="Text size">
                  <select value={font} onChange={(e) => setFont(e.target.value)} className="text-xs bg-background border rounded px-2 py-1">
                    <option value="0.875">Small</option><option value="1">Normal</option>
                    <option value="1.125">Large</option><option value="1.25">Extra Large</option>
                  </select>
                </Row>
                <Row icon={Layout} label="Compact view" desc="Tighter spacing">
                  <Switch checked={compact} onCheckedChange={setCompact} />
                </Row>
                <Row icon={Wand2} label="Reduced motion" desc="Disable animations">
                  <Switch checked={motion} onCheckedChange={setMotion} />
                </Row>
              </Section>

              <Section title="Notifications & Sound">
                <Row icon={pushEnabled ? Bell : BellOff} label="Push notifications" desc="Class alerts & reminders">
                  <Switch checked={pushEnabled} onCheckedChange={togglePush} />
                </Row>
                <Row icon={sound ? Volume2 : VolumeX} label="Sound effects" desc="Scan & button sounds">
                  <Switch checked={sound} onCheckedChange={setSound} />
                </Row>
                <Row icon={Vibrate} label="Vibration" desc="Haptic feedback">
                  <Switch checked={vibrate} onCheckedChange={setVibrate} />
                </Row>
                <Row icon={Bell} label="Daily reminder" desc="Morning attendance nudge">
                  <Switch checked={daily} onCheckedChange={setDaily} />
                </Row>
                <Row icon={Smile} label="Birthday reminders" desc="Classmates' birthdays">
                  <Switch checked={birthday} onCheckedChange={setBirthday} />
                </Row>
              </Section>

              <Section title="Behavior">
                <Row icon={Pin} label="Floating action button">
                  <Switch checked={floating} onCheckedChange={setFloating} />
                </Row>
                <Row icon={Zap} label="Swipe gestures">
                  <Switch checked={swipe} onCheckedChange={setSwipe} />
                </Row>
                <Row icon={RefreshCw} label="Auto-refresh" desc={autorefresh ? `every ${refreshrate}s` : 'off'}>
                  <Switch checked={autorefresh} onCheckedChange={setAutorefresh} />
                </Row>
                {autorefresh && (
                  <Row icon={RefreshCw} label="Refresh rate">
                    <select value={refreshrate} onChange={(e) => setRefreshrate(e.target.value)} className="text-xs bg-background border rounded px-2 py-1">
                      <option value="30">30 s</option><option value="60">1 min</option><option value="300">5 min</option>
                    </select>
                  </Row>
                )}
                <Row icon={FileText} label="Auto-save drafts" desc="Excuses, notes">
                  <Switch checked={autosave} onCheckedChange={setAutosave} />
                </Row>
                <Row icon={Layout} label="Default landing page">
                  <select value={defaultPage} onChange={(e) => setDefaultPage(e.target.value)} className="text-xs bg-background border rounded px-2 py-1">
                    <option value="/dashboard">Dashboard</option>
                    <option value="/student/qr-code">My QR</option>
                    <option value="/student/calendar">Calendar</option>
                    <option value="/music-map">Music Map</option>
                  </select>
                </Row>
              </Section>
            </TabsContent>

            {/* DISPLAY (visual cleanup) */}
            <TabsContent value="display" className="mt-0 space-y-3">
              <Section title="Visual">
                <Row icon={BatteryCharging} label="Battery saver" desc="Reduces effects & animations">
                  <Switch checked={battery} onCheckedChange={setBattery} />
                </Row>
                <Row icon={EyeOff} label="Hide promotions" desc="Hide non-essential banners">
                  <Switch checked={hidead} onCheckedChange={setHidead} />
                </Row>
                <Row icon={Eye} label="Sensitive content warning" desc="Blur before reveal">
                  <Switch checked={sensitive} onCheckedChange={setSensitive} />
                </Row>
                <Row icon={ImageIcon} label="Customize calendar" desc="Themes, stickers, photos" onClick={() => { setOpen(false); navigate('/student/calendar'); }} chevron />
                <Row icon={Cloud} label="Customize profile frame" onClick={() => { setOpen(false); navigate('/student/profile'); }} chevron />
              </Section>
            </TabsContent>

            {/* PRIVACY / DATA */}
            <TabsContent value="privacy" className="mt-0 space-y-3">
              <Section title="Account">
                <Row icon={Settings} label="Account & sign-in" desc="Email, phone, password, auto-login" onClick={() => { setOpen(false); navigate('/settings/account'); }} chevron />
                <Row icon={Settings} label="Edit profile & frame" onClick={() => { setOpen(false); navigate('/student/profile'); }} chevron />
                <Row icon={EyeOff} label="Hidden mode" desc="Hide profile from peers">
                  <Switch checked={hidden} onCheckedChange={setHidden} />
                </Row>
              </Section>

              <Section title="Data & Storage">
                <Row icon={Download} label="Data & storage" desc="Export, clear cache, reset" onClick={() => { setOpen(false); navigate('/settings/storage'); }} chevron />
                <Row icon={Download} label="Quick export (JSON)" onClick={exportData} chevron />
                <Row icon={Trash} label="Clear cache" onClick={clearCache} chevron />
                <Row icon={RotateCcw} label="Reset all settings" onClick={resetSettings} chevron />
              </Section>

              <Section title="Session">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 hover:bg-destructive/15 transition">
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-semibold">Log out</span>
                </button>
              </Section>
            </TabsContent>

            {/* ABOUT */}
            <TabsContent value="about" className="mt-0 space-y-3">
              <div className="bg-card rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <CrossLogo size={40} />
                  <div>
                    <p className="text-sm font-bold">CathoLink</p>
                    <p className="text-xs text-muted-foreground">Version {VERSION}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  QR-based attendance for Catholic schools, with class tools, music map, calendar customization & more.
                </p>
              </div>

              <Section title="Updates & Help">
                <Row icon={HelpCircle} label="Help & Support center" desc="FAQ + contact" onClick={() => { setOpen(false); navigate('/settings/help'); }} chevron />
                <Row icon={RefreshCw} label="Check for updates" onClick={checkUpdate} chevron />
                <Row icon={FileText} label="What's new" onClick={() => setView('changelog')} chevron />
                <Row icon={HelpCircle} label="Quick FAQ" onClick={() => setView('faq')} chevron />
                <Row icon={Bug} label="Report a problem" onClick={reportProblem} chevron />
                <Row icon={MessageCircle} label="Contact support" onClick={reportProblem} chevron />
                <Row icon={Star} label="Rate the app" onClick={() => { setOpen(false); navigate('/ratings'); }} chevron />
                <Row icon={ExternalLink} label="Invite friends" onClick={invite} chevron />
              </Section>

              <Section title="Legal">
                <Row icon={ExternalLink} label="Terms & Conditions" onClick={() => { setOpen(false); navigate('/terms'); }} chevron />
                <Row icon={Info} label="About app" onClick={() => { setOpen(false); navigate('/about'); }} chevron />
              </Section>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{title}</h4>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row = ({
  icon: Icon, label, desc, children, onClick, chevron,
}: {
  icon: any; label: string; desc?: string; children?: React.ReactNode;
  onClick?: () => void; chevron?: boolean;
}) => {
  const inner = (
    <>
      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {desc && <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>}
      </div>
      {children}
      {chevron && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition">
        {inner}
      </button>
    );
  }
  return <div className="flex items-center gap-3 p-2.5 rounded-lg">{inner}</div>;
};

export default SettingsDialog;
