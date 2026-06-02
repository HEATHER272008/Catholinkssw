import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Circle, CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  section: string;
  created_at: string;
}

const StudentTasks = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !profile?.section) return;
      setLoading(true);

      const { data: taskData } = await supabase.from('classroom_tasks').select('*').eq('section', profile.section).order('due_date', { ascending: true });
      setTasks((taskData as Task[]) || []);

      const { data: compData } = await supabase.from('task_completions').select('task_id').eq('student_id', user.id);
      setCompletedIds(new Set((compData || []).map((c: any) => c.task_id)));
      setLoading(false);
    };
    fetchData();
  }, [user, profile]);

  const toggleComplete = async (taskId: string) => {
    if (completedIds.has(taskId)) {
      await supabase.from('task_completions').delete().eq('task_id', taskId).eq('student_id', user!.id);
      setCompletedIds(prev => { const n = new Set(prev); n.delete(taskId); return n; });
      toast({ title: 'Marked as incomplete' });
    } else {
      await supabase.from('task_completions').insert({ task_id: taskId, student_id: user!.id });
      setCompletedIds(prev => new Set(prev).add(taskId));
      toast({ title: 'Task completed! ✅' });
    }
  };

  const isOverdue = (d: string | null) => d && new Date(d) < new Date();
  const isUpcoming = (d: string | null) => { if (!d) return false; const diff = new Date(d).getTime() - Date.now(); return diff > 0 && diff < 86400000 * 2; };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold text-foreground">My Tasks</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        {loading ? <p className="text-center text-muted-foreground py-8">Loading tasks...</p> : tasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No tasks assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const completed = completedIds.has(task.id);
              return (
                <Card key={task.id} className={`border transition-all ${completed ? 'opacity-60 bg-muted/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleComplete(task.id)} className="mt-0.5 flex-shrink-0">
                        {completed ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-foreground ${completed ? 'line-through' : ''}`}>{task.title}</h3>
                        {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                        {task.due_date && (
                          <div className="flex items-center gap-1 mt-2">
                            {isOverdue(task.due_date) && !completed ? (
                              <Badge variant="destructive" className="text-xs"><Clock className="h-3 w-3 mr-1" /> Overdue - {format(new Date(task.due_date), 'MMM d, h:mm a')}</Badge>
                            ) : isUpcoming(task.due_date) && !completed ? (
                              <Badge className="text-xs bg-amber-500"><CalendarIcon className="h-3 w-3 mr-1" /> Due soon - {format(new Date(task.due_date), 'MMM d, h:mm a')}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs"><CalendarIcon className="h-3 w-3 mr-1" /> {format(new Date(task.due_date), 'MMM d, h:mm a')}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentTasks;
