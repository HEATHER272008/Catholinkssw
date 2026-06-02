import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Edit, CheckCircle, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  section: string;
  created_by: string;
  created_at: string;
  completions_count?: number;
}

const SECTIONS = [
  'Grade 7 - St. Augustine', 'Grade 7 - St. Benedict', 'Grade 7 - St. Catherine',
  'Grade 8 - St. Dominic', 'Grade 8 - St. Elizabeth', 'Grade 8 - St. Francis',
  'Grade 9 - St. Gregory', 'Grade 9 - St. Helena', 'Grade 9 - St. Ignatius',
  'Grade 10 - St. Jerome', 'Grade 10 - St. Kevin', 'Grade 10 - St. Lawrence',
  'Grade 11 - STEM', 'Grade 11 - ABM', 'Grade 11 - HUMSS', 'Grade 11 - GAS',
  'Grade 12 - STEM', 'Grade 12 - ABM', 'Grade 12 - HUMSS', 'Grade 12 - GAS',
];

const AdminTaskManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [section, setSection] = useState('');
  const [filterSection, setFilterSection] = useState<string>('all');

  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase.from('classroom_tasks').select('*').order('created_at', { ascending: false });
    if (filterSection !== 'all') query = query.eq('section', filterSection);
    const { data, error } = await query;
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else setTasks((data as Task[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [filterSection]);

  const resetForm = () => { setTitle(''); setDescription(''); setDueDate(''); setSection(''); setEditingTask(null); };

  const handleSubmit = async () => {
    if (!title || !section) { toast({ title: 'Error', description: 'Title and section are required', variant: 'destructive' }); return; }
    const payload = { title, description: description || null, due_date: dueDate ? new Date(dueDate).toISOString() : null, section, created_by: user!.id };

    if (editingTask) {
      const { error } = await supabase.from('classroom_tasks').update({ title: payload.title, description: payload.description, due_date: payload.due_date, section: payload.section, updated_at: new Date().toISOString() }).eq('id', editingTask.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Task updated' });
    } else {
      const { error } = await supabase.from('classroom_tasks').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Task created' });
    }
    resetForm();
    setDialogOpen(false);
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('classroom_tasks').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Task deleted' });
    fetchTasks();
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '');
    setSection(task.section);
    setDialogOpen(true);
  };

  const isOverdue = (dueDate: string | null) => dueDate && new Date(dueDate) < new Date();

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-lg font-bold text-foreground">Classroom Task Manager</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Task</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="Description / instructions" value={description} onChange={e => setDescription(e.target.value)} />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Due Date</label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue placeholder="Assign to section" /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button className="w-full" onClick={handleSubmit}>{editingTask ? 'Update Task' : 'Create Task'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-4 py-4">
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="mb-4"><SelectValue placeholder="Filter by section" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {loading ? <p className="text-center text-muted-foreground py-8">Loading tasks...</p> : tasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No tasks found. Create one!</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <Card key={task.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{task.title}</h3>
                      {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{task.section}</Badge>
                        {task.due_date && (
                          <Badge variant={isOverdue(task.due_date) ? 'destructive' : 'outline'} className="text-xs">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {format(new Date(task.due_date), 'MMM d, yyyy h:mm a')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(task.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminTaskManager;
