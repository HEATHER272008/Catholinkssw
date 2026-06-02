import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HardDrive, Download, Trash, RotateCcw, Database, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PageTransition from '@/components/PageTransition';

const SettingsStorage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ ls: 0, sessionsCount: 0, stickers: 0 });

  useEffect(() => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      total += (k.length + (localStorage.getItem(k)?.length || 0)) * 2; // utf-16
    }
    const stickers = JSON.parse(localStorage.getItem('catholink_cal_lib') || '[]').length;
    setStats({ ls: total, sessionsCount: localStorage.length, stickers });
  }, []);

  const exportData = async () => {
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
    if (!confirm('Clear cache and reload?')) return;
    const preserve = ['catholink_language', 'catholink_dark'];
    const saved: Record<string, string> = {};
    preserve.forEach((k) => { const v = localStorage.getItem(k); if (v) saved[k] = v; });
    localStorage.clear(); sessionStorage.clear();
    Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
    if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
    toast({ title: 'Cache cleared' });
    setTimeout(() => window.location.reload(), 600);
  };

  const resetStickers = () => {
    if (!confirm('Remove all calendar stickers and decorations?')) return;
    localStorage.removeItem('catholink_cal_lib');
    localStorage.removeItem('catholink_cal_stickers');
    localStorage.removeItem('catholink_cal_bgimage');
    toast({ title: 'Calendar decorations cleared' });
    setStats((s) => ({ ...s, stickers: 0 }));
  };

  const usedMB = stats.ls / (1024 * 1024);
  const pct = Math.min(100, (usedMB / 5) * 100);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-12">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <HardDrive className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold">Data & Storage</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Local storage</p>
              <p className="text-xs text-muted-foreground">{usedMB.toFixed(2)} MB / 5 MB</p>
            </div>
            <Progress value={pct} />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Stat label="Saved keys" value={String(stats.sessionsCount)} />
              <Stat label="Calendar stickers" value={String(stats.stickers)} />
            </div>
          </Card>

          <Card className="divide-y">
            <Action icon={Download} label="Download my data" desc="Profile, attendance, excuses, tasks (JSON)" onClick={exportData} />
            <Action icon={ImageIcon} label="Reset calendar decorations" desc="Removes uploaded stickers & wallpaper" onClick={resetStickers} danger />
            <Action icon={Trash} label="Clear app cache" desc="Frees up storage and reloads" onClick={clearCache} danger />
            <Action icon={RotateCcw} label="Reset all settings" desc="Restores defaults — your data stays safe" onClick={() => {
              if (!confirm('Reset all settings?')) return;
              Object.keys(localStorage).filter((k) => k.startsWith('catholink_')).forEach((k) => localStorage.removeItem(k));
              toast({ title: 'Settings reset' });
              setTimeout(() => window.location.reload(), 400);
            }} danger />
          </Card>
        </main>
      </div>
    </PageTransition>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-lg bg-muted/50 text-center">
    <p className="text-lg font-bold">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

const Action = ({ icon: Icon, label, desc, onClick, danger }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition ${danger ? 'text-destructive' : ''}`}>
    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-destructive/10' : 'bg-primary/10 text-primary'}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
    </div>
  </button>
);

export default SettingsStorage;
