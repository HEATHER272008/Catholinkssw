import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, RotateCcw, Trophy, Users } from 'lucide-react';

interface StudentProfile {
  user_id: string;
  name: string;
  section: string | null;
}

interface ParticipationRecord {
  student_id: string;
  total_points: number;
}

const SECTIONS = [
  'Grade 7 - St. Augustine', 'Grade 7 - St. Benedict', 'Grade 7 - St. Catherine',
  'Grade 8 - St. Dominic', 'Grade 8 - St. Elizabeth', 'Grade 8 - St. Francis',
  'Grade 9 - St. Gregory', 'Grade 9 - St. Helena', 'Grade 9 - St. Ignatius',
  'Grade 10 - St. Jerome', 'Grade 10 - St. Kevin', 'Grade 10 - St. Lawrence',
  'Grade 11 - STEM', 'Grade 11 - ABM', 'Grade 11 - HUMSS', 'Grade 11 - GAS',
  'Grade 12 - STEM', 'Grade 12 - ABM', 'Grade 12 - HUMSS', 'Grade 12 - GAS',
];

const AdminParticipationTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [participationMap, setParticipationMap] = useState<Record<string, number>>({});
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!section) return;
    setLoading(true);

    // Fetch students in section
    const { data: studentData } = await supabase.from('profiles').select('user_id, name, section').eq('section', section);
    setStudents((studentData as StudentProfile[]) || []);

    // Fetch participation counts
    const { data: partData } = await supabase.from('participation').select('student_id, points').eq('section', section);
    const map: Record<string, number> = {};
    (partData || []).forEach((p: any) => {
      map[p.student_id] = (map[p.student_id] || 0) + p.points;
    });
    setParticipationMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [section]);

  const addParticipation = async (studentId: string, studentName: string) => {
    const { error } = await supabase.from('participation').insert({
      student_id: studentId,
      student_name: studentName,
      section,
      points: 1,
      recorded_by: user!.id,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setParticipationMap(prev => ({ ...prev, [studentId]: (prev[studentId] || 0) + 1 }));
    toast({ title: `+1 point for ${studentName}` });
  };

  const resetParticipation = async (studentId: string) => {
    const { error } = await supabase.from('participation').delete().eq('student_id', studentId).eq('section', section);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setParticipationMap(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    toast({ title: 'Participation reset' });
  };

  const sortedStudents = [...students].sort((a, b) => (participationMap[b.user_id] || 0) - (participationMap[a.user_id] || 0));

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold text-foreground">Participation Tracker</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="mb-4"><SelectValue placeholder="Select a section" /></SelectTrigger>
          <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>

        {!section ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a section to track participation</p>
          </div>
        ) : loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : students.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No students found in this section.</p>
        ) : (
          <div className="space-y-2">
            {sortedStudents.map((s, idx) => {
              const pts = participationMap[s.user_id] || 0;
              return (
                <Card key={s.user_id} className="border">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {idx < 3 && pts > 0 && <Trophy className={`h-5 w-5 flex-shrink-0 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} />}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{s.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="text-sm font-bold">{pts} pts</Badge>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => addParticipation(s.user_id, s.name)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => resetParticipation(s.user_id)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
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

export default AdminParticipationTracker;
