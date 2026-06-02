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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Edit, UserCheck, Power } from 'lucide-react';

interface SubPlan {
  id: string;
  title: string;
  instructions: string;
  activities: string | null;
  section: string;
  is_active: boolean;
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

const AdminSubstitutePlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubPlan | null>(null);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [activities, setActivities] = useState('');
  const [section, setSection] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('substitute_plans').select('*').order('created_at', { ascending: false });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setPlans((data as SubPlan[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const resetForm = () => { setTitle(''); setInstructions(''); setActivities(''); setSection(''); setEditingPlan(null); };

  const handleSubmit = async () => {
    if (!title || !instructions || !section) { toast({ title: 'Error', description: 'Title, instructions, and section required', variant: 'destructive' }); return; }
    const payload = { title, instructions, activities: activities || null, section, created_by: user!.id };

    if (editingPlan) {
      const { error } = await supabase.from('substitute_plans').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingPlan.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Plan updated' });
    } else {
      const { error } = await supabase.from('substitute_plans').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Plan created' });
    }
    resetForm();
    setDialogOpen(false);
    fetchPlans();
  };

  const toggleActive = async (plan: SubPlan) => {
    const { error } = await supabase.from('substitute_plans').update({ is_active: !plan.is_active, updated_at: new Date().toISOString() }).eq('id', plan.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: plan.is_active ? 'Plan deactivated' : 'Plan activated' });
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('substitute_plans').delete().eq('id', id);
    toast({ title: 'Plan deleted' });
    fetchPlans();
  };

  const openEdit = (p: SubPlan) => {
    setEditingPlan(p);
    setTitle(p.title);
    setInstructions(p.instructions);
    setActivities(p.activities || '');
    setSection(p.section);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-lg font-bold text-foreground">Substitute Teacher Mode</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Plan</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Substitute Plan'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Plan title" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="Instructions for the substitute teacher" rows={5} value={instructions} onChange={e => setInstructions(e.target.value)} />
                <Textarea placeholder="Activities / tasks for students (optional)" rows={3} value={activities} onChange={e => setActivities(e.target.value)} />
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button className="w-full" onClick={handleSubmit}>{editingPlan ? 'Update' : 'Create'} Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-4 py-4">
        {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : plans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No substitute plans yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(p => (
              <Card key={p.id} className={`border ${p.is_active ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{p.title}</h3>
                        {p.is_active && <Badge className="text-xs bg-green-600">Active</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">{p.instructions}</p>
                      {p.activities && <p className="text-sm text-muted-foreground mt-2 italic">Activities: {p.activities}</p>}
                      <Badge variant="secondary" className="text-xs mt-2">{p.section}</Badge>
                    </div>
                    <div className="flex flex-col gap-1 items-center">
                      <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminSubstitutePlan;
