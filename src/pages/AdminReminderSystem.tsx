import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Edit, Bell, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  section: string;
  created_by: string;
  created_at: string;
}

const SECTIONS = [
  'Grade 7 - St. Augustine', 'Grade 7 - St. Benedict', 'Grade 7 - St. Catherine',
  'Grade 8 - St. Dominic', 'Grade 8 - St. Elizabeth', 'Grade 8 - St. Francis',
  'Grade 9 - St. Gregory', 'Grade 9 - St. Helena', 'Grade 9 - St. Ignatius',
  'Grade 10 - St. Jerome', 'Grade 10 - St. Kevin', 'Grade 10 - St. Lawrence',
  'Grade 11 - STEM', 'Grade 11 - ABM', 'Grade 11 - HUMSS', 'Grade 11 - GAS',
  'Grade 12 - STEM', 'Grade 12 - ABM', 'Grade 12 - HUMSS', 'Grade 12 - GAS',
];

const AdminReminderSystem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [section, setSection] = useState('');

  const fetchReminders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reminders').select('*').order('reminder_date', { ascending: true });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setReminders((data as Reminder[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReminders(); }, []);

  const resetForm = () => { setTitle(''); setDescription(''); setReminderDate(''); setSection(''); setEditingReminder(null); };

  const handleSubmit = async () => {
    if (!title || !reminderDate || !section) { toast({ title: 'Error', description: 'Title, date, and section are required', variant: 'destructive' }); return; }
    const payload = { title, description: description || null, reminder_date: new Date(reminderDate).toISOString(), section, created_by: user!.id };

    if (editingReminder) {
      const { error } = await supabase.from('reminders').update(payload).eq('id', editingReminder.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Reminder updated' });
    } else {
      const { error } = await supabase.from('reminders').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Reminder created' });
    }
    resetForm();
    setDialogOpen(false);
    fetchReminders();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Reminder deleted' });
    fetchReminders();
  };

  const openEdit = (r: Reminder) => {
    setEditingReminder(r);
    setTitle(r.title);
    setDescription(r.description || '');
    setReminderDate(format(new Date(r.reminder_date), "yyyy-MM-dd'T'HH:mm"));
    setSection(r.section);
    setDialogOpen(true);
  };

  const isPast = (date: string) => new Date(date) < new Date();
  const isUpcoming = (date: string) => { const d = new Date(date); const now = new Date(); const diff = d.getTime() - now.getTime(); return diff > 0 && diff < 86400000; };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-lg font-bold text-foreground">Reminder System</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Reminder</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingReminder ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Reminder title" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Reminder Date & Time</label>
                  <Input type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
                </div>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue placeholder="Assign to section" /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button className="w-full" onClick={handleSubmit}>{editingReminder ? 'Update' : 'Create'} Reminder</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-4 py-4">
        {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : reminders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No reminders yet.</p>
        ) : (
          <div className="space-y-3">
            {reminders.map(r => (
              <Card key={r.id} className={`border ${isUpcoming(r.reminder_date) ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Bell className={`h-4 w-4 ${isUpcoming(r.reminder_date) ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
                        <h3 className="font-semibold text-foreground">{r.title}</h3>
                      </div>
                      {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{r.section}</Badge>
                        <Badge variant={isPast(r.reminder_date) ? 'destructive' : isUpcoming(r.reminder_date) ? 'default' : 'outline'} className="text-xs">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(new Date(r.reminder_date), 'MMM d, yyyy h:mm a')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminReminderSystem;
