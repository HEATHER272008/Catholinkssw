import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CheckCircle, XCircle, Sun, Moon as MoonIcon, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import PageTransition from '@/components/PageTransition';
import { useTranslation } from '@/hooks/useTranslation';

type TimeType = 'Morning' | 'Afternoon';

interface SummaryRecord {
  id: string;
  date: string;
  status: string;
  timeType: TimeType;
  time: string;
}

const getTimeType = (scannedAt: string): TimeType => {
  const hour = new Date(scannedAt).getHours();
  return hour < 12 ? 'Morning' : 'Afternoon';
};

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('scanned_at', { ascending: false });

      if (!error && data) {
        setRecords(
          data.map((r: any) => ({
            id: r.id,
            date: format(new Date(r.scanned_at), 'MMM d, yyyy'),
            status: r.status || 'present',
            timeType: getTimeType(r.scanned_at),
            time: format(new Date(r.scanned_at), 'h:mm a'),
          }))
        );
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [user]);

  const totalPresent = records.filter(r => r.status === 'present').length;
  const totalLate = records.filter(r => r.status === 'late').length;
  const totalAbsent = records.filter(r => r.status === 'absent').length;
  const totalHalfDay = records.filter(r => r.status === 'half_day').length;
  const morningPresent = records.filter(r => r.timeType === 'Morning' && (r.status === 'present' || r.status === 'late')).length;
  const afternoonPresent = records.filter(r => r.timeType === 'Afternoon' && (r.status === 'present' || r.status === 'late')).length;

  const summaryCards = [
    { label: 'Present', count: totalPresent, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { label: 'Late', count: totalLate, icon: BarChart3, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Absent', count: totalAbsent, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
    { label: 'Half Day', count: totalHalfDay, icon: BarChart3, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  const statusColor: Record<string, string> = {
    present: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    late: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    absent: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    half_day: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  };

  return (
    <PageTransition>
      <div className="min-h-screen gradient-bg p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" className="mb-6" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back_to_dashboard')}
          </Button>

          <div className="text-center mb-6">
            <CrossLogo size={60} />
            <h1 className="text-2xl font-bold mt-3">{t('attendance.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('attendance.subtitle')}</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {summaryCards.map((card) => (
                  <Card key={card.label} className="shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-full ${card.bg} flex items-center justify-center mb-2`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <p className="text-2xl font-bold">{card.count}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Morning / Afternoon Breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{morningPresent}</p>
                      <p className="text-xs text-muted-foreground">{t('attendance.morning_attended')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <MoonIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{afternoonPresent}</p>
                      <p className="text-xs text-muted-foreground">{t('attendance.afternoon_attended')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Table */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{t('attendance.history')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {records.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('common.no_records')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">{t('attendance.date')}</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">{t('attendance.time')}</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">{t('attendance.period')}</th>
                            <th className="text-center py-3 px-2 font-medium text-muted-foreground">{t('attendance.status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r) => (
                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-2 font-medium">{r.date}</td>
                              <td className="py-3 px-2 text-muted-foreground">{r.time}</td>
                              <td className="py-3 px-2 text-center">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                  r.timeType === 'Morning'
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                }`}>
                                  {r.timeType === 'Morning' ? <Sun className="h-3 w-3" /> : <MoonIcon className="h-3 w-3" />}
                                  {r.timeType}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[r.status] || ''}`}>
                                  {r.status === 'half_day' ? t('attendance.half_day') : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

export default StudentAttendance;