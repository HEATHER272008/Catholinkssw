import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shuffle, Save, Users, Trash2 } from 'lucide-react';

interface GroupActivity {
  id: string;
  title: string;
  section: string;
  groups_data: { name: string; members: string[] }[];
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

const AdminGroupOrganizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const [numGroups, setNumGroups] = useState(2);
  const [activityTitle, setActivityTitle] = useState('');
  const [groups, setGroups] = useState<{ name: string; members: string[] }[]>([]);
  const [savedActivities, setSavedActivities] = useState<GroupActivity[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await supabase.from('group_activities').select('*').order('created_at', { ascending: false });
      setSavedActivities((data as any[] || []).map(d => ({ ...d, groups_data: d.groups_data as any })));
    };
    fetchActivities();
  }, []);

  const fetchStudents = async () => {
    if (!section) return;
    setLoading(true);
    const { data } = await supabase.from('profiles').select('name').eq('section', section);
    setStudents((data || []).map((p: any) => p.name));
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [section]);

  const generateGroups = () => {
    if (students.length === 0) { toast({ title: 'No students found', variant: 'destructive' }); return; }
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const result: { name: string; members: string[] }[] = Array.from({ length: numGroups }, (_, i) => ({ name: `Group ${i + 1}`, members: [] }));
    shuffled.forEach((s, i) => result[i % numGroups].members.push(s));
    setGroups(result);
  };

  const saveActivity = async () => {
    if (!activityTitle || !section || groups.length === 0) { toast({ title: 'Fill in title, section, and generate groups', variant: 'destructive' }); return; }
    const { error } = await supabase.from('group_activities').insert({
      title: activityTitle,
      section,
      groups_data: groups as any,
      created_by: user!.id,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Groups saved!' });
    setActivityTitle('');
    setGroups([]);
    setDialogOpen(false);
    // Refresh saved
    const { data } = await supabase.from('group_activities').select('*').order('created_at', { ascending: false });
    setSavedActivities((data as any[] || []).map(d => ({ ...d, groups_data: d.groups_data as any })));
  };

  const deleteActivity = async (id: string) => {
    await supabase.from('group_activities').delete().eq('id', id);
    setSavedActivities(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Activity deleted' });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold text-foreground">Group Activity Organizer</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Generate New Groups</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Number of groups</label>
                <Input type="number" min={2} max={20} value={numGroups} onChange={e => setNumGroups(parseInt(e.target.value) || 2)} />
              </div>
              <Button onClick={generateGroups} disabled={loading || !section}>
                <Shuffle className="h-4 w-4 mr-1" /> Generate
              </Button>
            </div>
            {students.length > 0 && <p className="text-sm text-muted-foreground">{students.length} students found</p>}
          </CardContent>
        </Card>

        {groups.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Generated Groups</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={generateGroups}><Shuffle className="h-4 w-4 mr-1" /> Regenerate</Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Save className="h-4 w-4 mr-1" /> Save</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Save Group Activity</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Activity title" value={activityTitle} onChange={e => setActivityTitle(e.target.value)} />
                      <Button className="w-full" onClick={saveActivity}>Save Activity</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groups.map((g, i) => (
                <Card key={i} className="border">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> {g.name}
                    </h4>
                    <div className="space-y-1">
                      {g.members.map((m, j) => <p key={j} className="text-sm text-muted-foreground">• {m}</p>)}
                    </div>
                    <Badge variant="secondary" className="mt-2 text-xs">{g.members.length} members</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {savedActivities.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Saved Activities</h3>
            <div className="space-y-3">
              {savedActivities.map(a => (
                <Card key={a.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{a.title}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{a.section}</Badge>
                          <Badge variant="outline" className="text-xs">{a.groups_data.length} groups</Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          {a.groups_data.map((g, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{g.name}: {g.members.join(', ')}</p>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteActivity(a.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminGroupOrganizer;
