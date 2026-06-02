import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarOff, PartyPopper, AlertTriangle } from 'lucide-react';

type EntryType = 'holiday' | 'suspended' | 'no_classes';

interface CalendarEntry {
  date: string;
  entry_type: EntryType;
  reason: string | null;
}

// Compute "today" in Manila timezone (UTC+8) as YYYY-MM-DD
const getManilaToday = (): { dateStr: string; dow: number } => {
  const now = new Date();
  const manila = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = manila.getUTCFullYear();
  const m = String(manila.getUTCMonth() + 1).padStart(2, '0');
  const d = String(manila.getUTCDate()).padStart(2, '0');
  return { dateStr: `${y}-${m}-${d}`, dow: manila.getUTCDay() };
};

const STYLES: Record<EntryType, { icon: typeof CalendarOff; cls: string; label: string }> = {
  holiday:    { icon: PartyPopper,   cls: 'from-red-500/15 to-red-500/5 border-red-500/30 text-red-600 dark:text-red-400',       label: 'Holiday' },
  suspended:  { icon: AlertTriangle, cls: 'from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-600 dark:text-amber-400', label: 'Classes Suspended' },
  no_classes: { icon: CalendarOff,   cls: 'from-slate-500/15 to-slate-500/5 border-slate-500/30 text-slate-700 dark:text-slate-300', label: 'No Classes' },
};

const NoClassBanner = () => {
  const [entry, setEntry] = useState<CalendarEntry | null>(null);
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { dateStr, dow } = getManilaToday();
      if (dow === 0 || dow === 6) {
        if (!cancelled) { setIsWeekend(true); setEntry(null); }
        return;
      }
      setIsWeekend(false);
      const { data } = await supabase
        .from('school_calendar')
        .select('date, entry_type, reason')
        .eq('date', dateStr)
        .maybeSingle();
      if (!cancelled) setEntry((data as CalendarEntry) || null);
    };
    check();
    // Re-check when tab regains focus
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); };
  }, []);

  if (isWeekend) {
    return (
      <div className="mb-4 rounded-2xl border bg-gradient-to-r from-slate-500/15 to-slate-500/5 border-slate-500/30 p-4 flex items-start gap-3 animate-fade-in-up">
        <CalendarOff className="h-5 w-5 mt-0.5 text-slate-700 dark:text-slate-300" />
        <div>
          <p className="font-semibold text-foreground">No classes today — Weekend</p>
          <p className="text-sm text-muted-foreground">Enjoy your day off! Attendance is not required.</p>
        </div>
      </div>
    );
  }

  if (!entry) return null;

  const cfg = STYLES[entry.entry_type];
  const Icon = cfg.icon;
  return (
    <div className={`mb-4 rounded-2xl border bg-gradient-to-r ${cfg.cls} p-4 flex items-start gap-3 animate-fade-in-up`}>
      <Icon className="h-5 w-5 mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold text-foreground">No classes today — {cfg.label}</p>
        <p className="text-sm text-muted-foreground">
          {entry.reason ? entry.reason : 'Classes are not in session today. You will not be marked absent.'}
        </p>
      </div>
    </div>
  );
};

export default NoClassBanner;
