import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CrossLogo } from '@/components/CrossLogo';
import { FramedAvatar } from '@/components/FramedAvatar';
import { useAuth } from '@/hooks/useAuth';
import { Moon, Sun, LogOut, ScanLine, ClipboardList, Clock, Star, Users, Home, ShieldCheck, QrCode, BarChart3, ListTodo, Bell, HandMetal, UsersRound, TrendingUp, BookOpen, UserCheck, CalendarDays, FileCheck2, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdminRequestsManager } from '@/components/AdminRequestsManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import DigitalClock from '@/components/DigitalClock';
import SettingsDialog from '@/components/SettingsDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { usePresenceTracker } from '@/hooks/usePresence';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();

  usePresenceTracker(user && profile ? {
    user_id: user.id,
    name: profile.name,
    role: 'admin',
    section: profile.section,
    online_at: new Date().toISOString(),
  } : null);

  const [darkMode, setDarkMode] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
    
    // Fetch pending admin requests count
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('admin_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (!error && count !== null) {
        setPendingRequestsCount(count);
      }
    };
    
    fetchPendingCount();
  }, [requestsDialogOpen]);

  const toggleDarkMode = () => {
    setIsThemeTransitioning(true);
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsThemeTransitioning(false);
    }, 200);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const menuItems = [
    {
      icon: ScanLine,
      label: t('menu.scan_qr'),
      description: t('menu.scan_qr_desc'),
      path: '/admin/scanner',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: ClipboardList,
      label: t('menu.attendance'),
      description: t('menu.attendance_admin_desc'),
      path: '/admin/attendance',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      icon: BarChart3,
      label: t('menu.overview'),
      description: t('menu.overview_desc'),
      path: '/admin/attendance-overview',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: Clock,
      label: t('menu.late_comers'),
      description: t('menu.late_comers_desc'),
      path: '/admin/late-comers',
      color: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    {
      icon: Users,
      label: t('menu.students'),
      description: t('menu.students_desc'),
      path: '/admin/students',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      icon: Star,
      label: t('menu.ratings'),
      description: t('menu.ratings_desc'),
      path: '/admin/ratings',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      icon: QrCode,
      label: t('menu.qr_generator'),
      description: t('menu.qr_generator_desc'),
      path: '/admin/qr-generator',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      icon: ListTodo,
      label: 'Task Manager',
      description: 'Assign tasks & activities',
      path: '/admin/tasks',
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    },
    {
      icon: Bell,
      label: 'Reminder System',
      description: 'Schedule reminders',
      path: '/admin/reminders',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      icon: HandMetal,
      label: 'Participation',
      description: 'Track class participation',
      path: '/admin/participation',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      icon: UsersRound,
      label: 'Group Organizer',
      description: 'Create student groups',
      path: '/admin/groups',
      color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
    {
      icon: TrendingUp,
      label: 'Performance',
      description: 'Student analytics',
      path: '/admin/performance',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: BookOpen,
      label: 'Lesson Materials',
      description: 'Share files & documents',
      path: '/admin/materials',
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      icon: UserCheck,
      label: 'Substitute Mode',
      description: 'Leave plans for subs',
      path: '/admin/substitute',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      icon: CalendarDays,
      label: 'School Calendar',
      description: 'Holidays & no-class days',
      path: '/admin/calendar',
      color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    },
    {
      icon: FileCheck2,
      label: 'Excuse Requests',
      description: 'Review absence reasons',
      path: '/admin/excuses',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      icon: Activity,
      label: "Who's Online",
      description: 'See active users live',
      path: '/admin/online',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const bottomNavItems = [
    { icon: Home, label: t('nav.home'), path: '/admin' },
    { icon: ScanLine, label: t('nav.scan'), path: '/admin/scanner' },
    { icon: ClipboardList, label: t('nav.logs'), path: '/admin/attendance' },
    { icon: Users, label: t('nav.students'), path: '/admin/students' },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <CrossLogo size={120} />
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <CrossLogo size={36} />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-primary leading-tight">CathoLink</h1>
              <p className="text-[10px] text-muted-foreground">{t('app.admin_portal')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            <DigitalClock />
            {/* Admin Requests Button */}
            <Dialog open={requestsDialogOpen} onOpenChange={setRequestsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 relative"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {pendingRequestsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {t('admin.requests')}
                  </DialogTitle>
                </DialogHeader>
                <AdminRequestsManager />
              </DialogContent>
            </Dialog>
            
            <SettingsDialog />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-5 mb-6 text-primary-foreground animate-fade-in-up">
          <div className="flex items-center gap-4">
            <FramedAvatar userId={profile.user_id} imageUrl={profile.profile_picture_url} name={profile.name} size={64} />
            <div className="flex-1">
              <p className="text-sm text-primary-foreground/80">{t('dashboard.welcome')}</p>
              <h2 className="text-xl font-bold">Admin {profile.name}</h2>
              <p className="text-sm text-primary-foreground/80">{t('dashboard.manage_attendance')}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Title */}
        <div className="mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-foreground">{t('dashboard.quick_actions')}</h3>
          <p className="text-sm text-muted-foreground">{t('dashboard.manage_school')}</p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 active:scale-95 opacity-0 animate-fade-in-scale group"
              style={{ animationDelay: `${0.15 + index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center mb-3 group-hover:animate-bounce-subtle transition-transform`}>
                <item.icon className="h-7 w-7" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground text-center mt-1">{item.description}</span>
            </button>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-50 animate-slide-in-bottom">
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'text-primary bg-primary/10 scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform ${isActive ? 'text-primary animate-bounce-subtle' : ''}`} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminDashboard;
