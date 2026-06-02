import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Users } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StudentStats {
  user_id: string;
  name: string;
  section: string | null;
  total_attendance: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  participation_points: number;
  attendance_rate: number;
}

const SECTIONS = [
  'Grade 7 - St. Augustine', 'Grade 7 - St. Benedict', 'Grade 7 - St. Catherine',
  'Grade 8 - St. Dominic', 'Grade 8 - St. Elizabeth', 'Grade 8 - St. Francis',
  'Grade 9 - St. Gregory', 'Grade 9 - St. Helena', 'Grade 9 - St. Ignatius',
  'Grade 10 - St. Jerome', 'Grade 10 - St. Kevin', 'Grade 10 - St. Lawrence',
  'Grade 11 - STEM', 'Grade 11 - ABM', 'Grade 11 - HUMSS', 'Grade 11 - GAS',
  'Grade 12 - STEM', 'Grade 12 - ABM', 'Grade 12 - HUMSS', 'Grade 12 - GAS',
];

const COLORS = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#ef4444'];

const AdminPerformanceAnalytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [section, setSection] = useState('');
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);

  const fetchAnalytics = async () => {
    if (!section) return;
    setLoading(true);

    // Fetch students
    const { data: profiles } = await supabase.from('profiles').select('user_id, name, section').eq('section', section);
    if (!profiles || profiles.length === 0) { setStudentStats([]); setLoading(false); return; }

    // Fetch attendance for section
    const { data: attendance } = await supabase.from('attendance').select('student_id, status').eq('section', section);

    // Fetch participation
    const { data: participation } = await supabase.from('participation').select('student_id, points').eq('section', section);

    const stats: StudentStats[] = (profiles as any[]).map(p => {
      const att = (attendance || []).filter((a: any) => a.student_id === p.user_id);
      const present = att.filter((a: any) => a.status === 'present').length;
      const late = att.filter((a: any) => a.status === 'late').length;
      const absent = att.filter((a: any) => a.status === 'absent').length;
      const partPts = (participation || []).filter((pp: any) => pp.student_id === p.user_id).reduce((sum: number, pp: any) => sum + pp.points, 0);

      return {
        user_id: p.user_id,
        name: p.name,
        section: p.section,
        total_attendance: att.length,
        present_count: present,
        late_count: late,
        absent_count: absent,
        participation_points: partPts,
        attendance_rate: att.length > 0 ? Math.round(((present + late) / att.length) * 100) : 0,
      };
    });

    setStudentStats(stats.sort((a, b) => b.attendance_rate - a.attendance_rate));
    setLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, [section]);

  const highPerformers = studentStats.filter(s => s.attendance_rate >= 90);
  const struggling = studentStats.filter(s => s.attendance_rate < 70 && s.total_attendance > 0);

  const overallChart = studentStats.length > 0 ? [
    { name: 'Present', value: studentStats.reduce((s, st) => s + st.present_count, 0) },
    { name: 'Late', value: studentStats.reduce((s, st) => s + st.late_count, 0) },
    { name: 'Absent', value: studentStats.reduce((s, st) => s + st.absent_count, 0) },
  ] : [];

  const participationChart = studentStats.filter(s => s.participation_points > 0).slice(0, 10).map(s => ({
    name: s.name.split(' ')[0],
    points: s.participation_points,
  }));

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold text-foreground">Performance Analytics</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        <Select value={section} onValueChange={s => { setSection(s); setSelectedStudent(null); }}>
          <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
          <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>

        {!section ? (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a section to view analytics</p>
          </div>
        ) : loading ? <p className="text-center text-muted-foreground py-8">Loading analytics...</p> : studentStats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No data found for this section.</p>
        ) : selectedStudent ? (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>← Back to Overview</Button>
            <Card>
              <CardHeader><CardTitle>{selectedStudent.name}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-600">{selectedStudent.present_count}</p><p className="text-xs text-muted-foreground">Present</p></div>
                  <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-amber-600">{selectedStudent.late_count}</p><p className="text-xs text-muted-foreground">Late</p></div>
                  <div className="bg-red-500/10 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-red-600">{selectedStudent.absent_count}</p><p className="text-xs text-muted-foreground">Absent</p></div>
                  <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-primary">{selectedStudent.participation_points}</p><p className="text-xs text-muted-foreground">Participation</p></div>
                </div>
                <div className="bg-muted rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{selectedStudent.attendance_rate}%</p>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{studentStats.length}</p><p className="text-xs text-muted-foreground">Students</p></CardContent></Card>
              <Card className="border border-green-500/30"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{highPerformers.length}</p><p className="text-xs text-muted-foreground">High Perf.</p></CardContent></Card>
              <Card className="border border-red-500/30"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-red-600">{struggling.length}</p><p className="text-xs text-muted-foreground">Struggling</p></CardContent></Card>
            </div>

            {/* Attendance Pie Chart */}
            {overallChart.some(c => c.value > 0) && (
              <Card>
                <CardHeader><CardTitle className="text-base">Attendance Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={{ present: { label: 'Present', color: '#22c55e' }, late: { label: 'Late', color: '#f59e0b' }, absent: { label: 'Absent', color: '#ef4444' } }} className="h-[200px]">
                    <PieChart>
                      <Pie data={overallChart} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {overallChart.map((_, i) => <Cell key={i} fill={['#22c55e', '#f59e0b', '#ef4444'][i]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Participation Bar Chart */}
            {participationChart.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Top Participation</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={{ points: { label: 'Points', color: 'hsl(var(--primary))' } }} className="h-[200px]">
                    <BarChart data={participationChart}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Bar dataKey="points" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Student List */}
            <h3 className="font-semibold text-foreground">All Students</h3>
            <div className="space-y-2">
              {studentStats.map(s => (
                <Card key={s.user_id} className="border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedStudent(s)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {s.attendance_rate >= 90 ? <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" /> : s.attendance_rate < 70 && s.total_attendance > 0 ? <TrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" /> : null}
                      <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={s.attendance_rate >= 90 ? 'default' : s.attendance_rate >= 70 ? 'secondary' : 'destructive'} className="text-xs">
                        {s.attendance_rate}%
                      </Badge>
                      {s.participation_points > 0 && <Badge variant="outline" className="text-xs">{s.participation_points}pts</Badge>}
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

export default AdminPerformanceAnalytics;
