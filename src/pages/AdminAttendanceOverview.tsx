import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Sun, Moon as MoonIcon, CheckCircle, XCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import PageTransition from '@/components/PageTransition';

interface AttendanceRecord {
  id: string;
  student_name: string;
  section: string;
  scanned_at: string;
  status: string;
}

interface SectionStats {
  section: string;
  morningPresent: number;
  morningLate: number;
  morningAbsent: number;
  afternoonPresent: number;
  afternoonLate: number;
  afternoonAbsent: number;
  totalStudents: Set<string>;
}

const getTimeType = (scannedAt: string): 'morning' | 'afternoon' => {
  const hour = new Date(scannedAt).getHours();
  return hour < 12 ? 'morning' : 'afternoon';
};

const AdminAttendanceOverview = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM-dd');
  });

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [y, m, d] = selectedDate.split('-').map(Number);
      const start = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
      const end = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('scanned_at', start.toISOString())
        .lte('scanned_at', end.toISOString())
        .order('scanned_at', { ascending: false });

      if (!error && data) {
        setRecords(data);
      }
      setLoading(false);
    };

    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('attendance-overview')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, (payload) => {
        const newRecord = payload.new as AttendanceRecord;
        const recordDate = format(new Date(newRecord.scanned_at), 'yyyy-MM-dd');
        if (recordDate === selectedDate) {
          setRecords(prev => [newRecord, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedDate]);

  // Compute section stats
  const sectionMap = new Map<string, SectionStats>();
  records.forEach((r) => {
    if (!sectionMap.has(r.section)) {
      sectionMap.set(r.section, {
        section: r.section,
        morningPresent: 0, morningLate: 0, morningAbsent: 0,
        afternoonPresent: 0, afternoonLate: 0, afternoonAbsent: 0,
        totalStudents: new Set(),
      });
    }
    const stats = sectionMap.get(r.section)!;
    stats.totalStudents.add(r.student_name);
    const period = getTimeType(r.scanned_at);

    if (period === 'morning') {
      if (r.status === 'present') stats.morningPresent++;
      else if (r.status === 'late') stats.morningLate++;
      else if (r.status === 'absent') stats.morningAbsent++;
    } else {
      if (r.status === 'present') stats.afternoonPresent++;
      else if (r.status === 'late') stats.afternoonLate++;
      else if (r.status === 'absent') stats.afternoonAbsent++;
    }
  });

  const sections = Array.from(sectionMap.values()).sort((a, b) => a.section.localeCompare(b.section));

  // Global totals
  const globalMorningPresent = sections.reduce((s, sec) => s + sec.morningPresent + sec.morningLate, 0);
  const globalAfternoonPresent = sections.reduce((s, sec) => s + sec.afternoonPresent + sec.afternoonLate, 0);
  const globalMorningAbsent = sections.reduce((s, sec) => s + sec.morningAbsent, 0);
  const globalAfternoonAbsent = sections.reduce((s, sec) => s + sec.afternoonAbsent, 0);
  const uniqueStudents = new Set(records.map(r => r.student_name)).size;

  if (userRole && userRole !== 'admin') return null;

  return (
    <PageTransition>
      <div className="min-h-screen gradient-bg p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="outline" className="mb-6" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center mb-6">
            <CrossLogo size={60} />
            <h1 className="text-2xl font-bold mt-3">Attendance Overview</h1>
            <p className="text-sm text-muted-foreground">Section-based attendance summary</p>
          </div>

          {/* Date Picker */}
          <div className="flex justify-center mb-6">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-border bg-card text-foreground shadow-sm text-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading overview...</p>
            </div>
          ) : (
            <>
              {/* Global Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <Card className="shadow-sm col-span-2 md:col-span-1">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{uniqueStudents}</p>
                    <p className="text-xs text-muted-foreground">Total Students</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{globalMorningPresent}</p>
                    <p className="text-xs text-muted-foreground">Morning Present</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <MoonIcon className="h-4 w-4 text-indigo-500" />
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{globalAfternoonPresent}</p>
                    <p className="text-xs text-muted-foreground">Afternoon Present</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{globalMorningAbsent}</p>
                    <p className="text-xs text-muted-foreground">Morning Absent</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <MoonIcon className="h-4 w-4 text-indigo-500" />
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{globalAfternoonAbsent}</p>
                    <p className="text-xs text-muted-foreground">Afternoon Absent</p>
                  </CardContent>
                </Card>
              </div>

              {/* Section Breakdown */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Section Breakdown</CardTitle>
                  <CardDescription>{format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {sections.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No attendance records for this date</p>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {sections.map((sec) => (
                        <AccordionItem key={sec.section} value={sec.section} className="border rounded-xl mb-3 px-4 bg-muted/20">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="text-left">
                                <p className="font-bold text-lg text-primary">{sec.section}</p>
                                <p className="text-xs text-muted-foreground">{sec.totalStudents.size} student{sec.totalStudents.size !== 1 ? 's' : ''} scanned</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
                              {/* Morning Stats */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sun className="h-4 w-4 text-amber-500" />
                                  <span className="text-sm font-semibold">Morning</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-green-500/10 rounded-lg">
                                  <span className="text-xs text-muted-foreground">Present</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">{sec.morningPresent}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-orange-500/10 rounded-lg">
                                  <span className="text-xs text-muted-foreground">Late</span>
                                  <span className="font-bold text-orange-600 dark:text-orange-400">{sec.morningLate}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-red-500/10 rounded-lg">
                                  <span className="text-xs text-muted-foreground">Absent</span>
                                  <span className="font-bold text-red-600 dark:text-red-400">{sec.morningAbsent}</span>
                                </div>
                              </div>
                              {/* Afternoon Stats */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <MoonIcon className="h-4 w-4 text-indigo-500" />
                                  <span className="text-sm font-semibold">Afternoon</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-green-500/10 rounded-lg">
                                  <span className="text-xs text-muted-foreground">Present</span>
                                  <span className="font-bold text-green-600 dark:text-green-400">{sec.afternoonPresent}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-orange-500/10 rounded-lg">
                                  <span className="text-xs text-muted-foreground">Late</span>
                                  <span className="font-bold text-orange-600 dark:text-orange-400">{sec.afternoonLate}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-red-500/10 rounded-lg">
                                  <span className="text-xs text-muted-foreground">Absent</span>
                                  <span className="font-bold text-red-600 dark:text-red-400">{sec.afternoonAbsent}</span>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminAttendanceOverview;
