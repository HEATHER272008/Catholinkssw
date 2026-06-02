import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Using native scrolling here for maximum reliability across devices.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LateRecord {
  id: string;
  student_name: string;
  section: string;
  scanned_at: string;
  period: 'morning' | 'afternoon';
}

interface SectionLateStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  records: LateRecord[];
}

interface DailyStats {
  date: Date;
  morningCount: number;
  afternoonCount: number;
  total: number;
}

const SectionLateStatsModal = ({ isOpen, onClose, section, records }: SectionLateStatsModalProps) => {
  // Filter records for the selected section
  const sectionRecords = useMemo(() => {
    return records.filter((r) => r.section === section);
  }, [records, section]);

  // Calculate daily statistics for the current month
  const dailyStats = useMemo((): DailyStats[] => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return daysInMonth.map((day) => {
      const dayRecords = sectionRecords.filter((r) => 
        isSameDay(new Date(r.scanned_at), day)
      );

      const morningCount = dayRecords.filter((r) => r.period === 'morning').length;
      const afternoonCount = dayRecords.filter((r) => r.period === 'afternoon').length;

      return {
        date: day,
        morningCount,
        afternoonCount,
        total: morningCount + afternoonCount,
      };
    }).filter((stat) => stat.total > 0); // Only show days with late records
  }, [sectionRecords]);

  // Chart data - include all days for a smooth line
  const chartData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const today = now > endOfMonth(now) ? endOfMonth(now) : now;
    const daysToShow = eachDayOfInterval({ start: monthStart, end: today });

    return daysToShow.map((day) => {
      const dayRecords = sectionRecords.filter((r) => 
        isSameDay(new Date(r.scanned_at), day)
      );

      return {
        date: format(day, 'MMM dd'),
        day: format(day, 'd'),
        morning: dayRecords.filter((r) => r.period === 'morning').length,
        afternoon: dayRecords.filter((r) => r.period === 'afternoon').length,
        total: dayRecords.length,
      };
    });
  }, [sectionRecords]);

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const morningTotal = sectionRecords.filter((r) => r.period === 'morning').length;
    const afternoonTotal = sectionRecords.filter((r) => r.period === 'afternoon').length;
    return {
      morning: morningTotal,
      afternoon: afternoonTotal,
      total: morningTotal + afternoonTotal,
    };
  }, [sectionRecords]);

  const currentMonth = format(new Date(), 'MMMM yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] min-h-0 flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Late Statistics
          </DialogTitle>
          <Badge variant="outline" className="w-fit text-sm">
            {section}
          </Badge>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-4 pb-4">
            {/* Monthly Summary */}
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{currentMonth} Summary</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Morning</p>
                    <p className="text-xl font-bold text-orange-600">{monthlyTotals.morning}</p>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Afternoon</p>
                    <p className="text-xl font-bold text-purple-600">{monthlyTotals.afternoon}</p>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-xl font-bold text-destructive">{monthlyTotals.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            {chartData.some(d => d.total > 0) && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Daily Trend</span>
                  </div>
                  <div className="h-56 w-full rounded-lg bg-gradient-to-b from-muted/30 to-background p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 15, left: -15, bottom: 5 }}>
                        <defs>
                          <linearGradient id="morningGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.4}/>
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.05}/>
                          </linearGradient>
                          <linearGradient id="afternoonGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          horizontal={true}
                          vertical={false}
                          stroke="hsl(var(--border))" 
                          strokeOpacity={0.6}
                        />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} 
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                          dy={8}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = chartData.find(d => d.day === label);
                              return (
                                <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-xl">
                                  <p className="text-sm font-semibold mb-2 text-foreground">{data?.date}</p>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                                        <span className="text-xs text-muted-foreground">Morning</span>
                                      </div>
                                      <span className="text-sm font-bold text-orange-600">{payload[0]?.value}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm" />
                                        <span className="text-xs text-muted-foreground">Afternoon</span>
                                      </div>
                                      <span className="text-sm font-bold text-violet-600">{payload[1]?.value}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="natural" 
                          dataKey="morning" 
                          stroke="#f97316" 
                          strokeWidth={3}
                          fill="url(#morningGradient)"
                          dot={{ r: 4, fill: '#fff', stroke: '#f97316', strokeWidth: 2.5 }}
                          activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 3 }}
                        />
                        <Area 
                          type="natural" 
                          dataKey="afternoon" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          fill="url(#afternoonGradient)"
                          dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2.5 }}
                          activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-orange-500 rounded" />
                      <span className="text-muted-foreground">Morning</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-purple-500 rounded" />
                      <span className="text-muted-foreground">Afternoon</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-destructive rounded" />
                      <span className="text-muted-foreground">Total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Breakdown Table */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Daily Breakdown</span>
              </div>
              
              {dailyStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No late records this month
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-center text-xs">AM</TableHead>
                      <TableHead className="text-center text-xs">PM</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.map((stat) => (
                      <TableRow key={stat.date.toISOString()}>
                        <TableCell className="text-sm py-2">
                          {format(stat.date, 'MMM dd (EEE)')}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {stat.morningCount > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {stat.morningCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {stat.afternoonCount > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {stat.afternoonCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant="destructive" className="text-xs">
                            {stat.total}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SectionLateStatsModal;
