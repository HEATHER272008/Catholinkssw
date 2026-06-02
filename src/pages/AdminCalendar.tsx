import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

type EntryType = 'holiday' | 'suspended' | 'no_classes';

interface CalendarEntry {
  id: string;
  date: string;
  entry_type: EntryType;
  reason: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<EntryType, { label: string; cls: string }> = {
  holiday:    { label: 'Holiday',     cls: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  suspended:  { label: 'Suspended',   cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  no_classes: { label: 'No Classes',  cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' },
};

const AdminCalendar = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('holiday');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (userRole && userRole !== 'admin') navigate('/dashboard');
  }, [userRole, navigate]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('school_calendar')
      .select('*')
      .order('date', { ascending: false });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setEntries((data as CalendarEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleAdd = async () => {
    if (!date) {
      toast({ title: 'Date required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('school_calendar').insert({
      date,
      entry_type: entryType,
      reason: reason || null,
      created_by: user!.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Date added to calendar' });
    setDate(''); setReason(''); setEntryType('holiday'); setOpen(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('school_calendar').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Removed' });
    fetchEntries();
  };

  if (userRole && userRole !== 'admin') return null;

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = entries.filter(e => new Date(e.date) >= today);
  const past = entries.filter(e => new Date(e.date) < today);

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">School Calendar</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Date</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark a no-class day</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Date</label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Type</label>
                  <Select value={entryType} onValueChange={(v) => setEntryType(v as EntryType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="suspended">Class Suspended</SelectItem>
                      <SelectItem value="no_classes">No Classes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Reason (optional)</label>
                  <Input placeholder="e.g. Typhoon, National Holiday" value={reason} onChange={e => setReason(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleAdd}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        <Card className="border bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              On these dates, the QR scanner will warn you that classes are not in session, and the
              <strong className="text-foreground"> daily auto-absent job (4:31 PM)</strong> will be skipped.
              Weekends are skipped automatically.
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="font-semibold text-foreground mb-2">Upcoming</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming no-class dates.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(e => (
                <Card key={e.id} className="border">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{format(new Date(e.date + 'T00:00:00'), 'EEE, MMM d, yyyy')}</span>
                        <Badge variant="outline" className={TYPE_LABELS[e.entry_type].cls}>{TYPE_LABELS[e.entry_type].label}</Badge>
                      </div>
                      {e.reason && <p className="text-sm text-muted-foreground mt-1">{e.reason}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-2">Past</h2>
            <div className="space-y-2 opacity-70">
              {past.map(e => (
                <Card key={e.id} className="border">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{format(new Date(e.date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                        <Badge variant="outline" className={TYPE_LABELS[e.entry_type].cls}>{TYPE_LABELS[e.entry_type].label}</Badge>
                      </div>
                      {e.reason && <p className="text-sm text-muted-foreground mt-1">{e.reason}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminCalendar;
