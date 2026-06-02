import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CrossLogo } from '@/components/CrossLogo';
import { FramedAvatar } from '@/components/FramedAvatar';
import { useAuth } from '@/hooks/useAuth';
import { Moon, Sun, LogOut, QrCode, Calendar, User, Star, Home, HelpCircle, Sparkles, X, BarChart3, WifiOff, ListTodo, BookOpen, Music, CalendarDays, FileWarning } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import TutorialGuide, { useTutorial } from '@/components/TutorialGuide';
import NoticeModal, { useNoticeModal } from '@/components/NoticeModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DigitalClock from '@/components/DigitalClock';
import SettingsDialog from '@/components/SettingsDialog';
import NoClassBanner from '@/components/NoClassBanner';
import { useTranslation } from '@/hooks/useTranslation';
import { usePresenceTracker } from '@/hooks/usePresence';

const motivationalQuotes = [
  { quote: "Education is the passport to the future.", author: "Malcolm X" },
  { quote: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { quote: "Your attitude determines your direction.", author: "Unknown" },
  { quote: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { quote: "Every day is a chance to be better.", author: "Unknown" },
  { quote: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { quote: "With God, all things are possible.", author: "Matthew 19:26" },
  { quote: "Faith is taking the first step even when you can't see the whole staircase.", author: "Martin Luther King Jr." },
];

// Character profession designs
type ProfessionType = 'priest' | 'engineer' | 'pilot' | 'doctor' | 'teacher' | 'chef';

const professions: { type: ProfessionType; name: string }[] = [
  { type: 'priest', name: 'Father' },
  { type: 'engineer', name: 'Engineer' },
  { type: 'pilot', name: 'Captain' },
  { type: 'doctor', name: 'Doctor' },
  { type: 'teacher', name: 'Teacher' },
  { type: 'chef', name: 'Chef' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const { showTutorial, openTutorial, closeTutorial } = useTutorial();
  const [tutorialHasClosed, setTutorialHasClosed] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  const [showQuote, setShowQuote] = useState(false);
  const [currentProfession, setCurrentProfession] = useState<ProfessionType>('priest');

  // Broadcast online presence so teachers can see active students
  usePresenceTracker(user && profile ? {
    user_id: user.id,
    name: profile.name,
    role: 'student',
    section: profile.section,
    online_at: new Date().toISOString(),
  } : null);

  // Show notice modal only once per login session (not every dashboard visit)
  useEffect(() => {
    if (profile && !showTutorial) {
      const hasSeenNoticeThisSession = sessionStorage.getItem('catholink_notice_shown');
      if (!hasSeenNoticeThisSession) {
        const timer = setTimeout(() => {
          setShowNotice(true);
          sessionStorage.setItem('catholink_notice_shown', 'true');
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [profile, showTutorial]);

  // Track when tutorial closes and show notice for new users
  const handleTutorialClose = () => {
    closeTutorial();
    setTutorialHasClosed(true);
    // Show notice after tutorial closes for new users (only if not shown yet)
    const hasSeenNoticeThisSession = sessionStorage.getItem('catholink_notice_shown');
    if (!hasSeenNoticeThisSession) {
      setTimeout(() => {
        setShowNotice(true);
        sessionStorage.setItem('catholink_notice_shown', 'true');
      }, 500);
    }
  };

  const closeNotice = () => setShowNotice(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  // Show random quote and profession after a delay
  useEffect(() => {
    const showInitialQuote = setTimeout(() => {
      const randomQuoteIndex = Math.floor(Math.random() * motivationalQuotes.length);
      const randomProfessionIndex = Math.floor(Math.random() * professions.length);
      setCurrentQuote(motivationalQuotes[randomQuoteIndex]);
      setCurrentProfession(professions[randomProfessionIndex].type);
      setShowQuote(true);
    }, 1500);

    return () => clearTimeout(showInitialQuote);
  }, []);

  // Auto-hide quote after 8 seconds
  useEffect(() => {
    if (showQuote) {
      const hideQuote = setTimeout(() => {
        setShowQuote(false);
      }, 8000);
      return () => clearTimeout(hideQuote);
    }
  }, [showQuote]);

  const showNewQuote = useCallback(() => {
    const randomQuoteIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const randomProfessionIndex = Math.floor(Math.random() * professions.length);
    setCurrentQuote(motivationalQuotes[randomQuoteIndex]);
    setCurrentProfession(professions[randomProfessionIndex].type);
    setShowQuote(true);
  }, []);

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
      icon: QrCode,
      label: t('menu.qr_code'),
      description: t('menu.qr_code_desc'),
      path: '/student/qr-code',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Calendar,
      label: t('menu.attendance'),
      description: t('menu.attendance_desc'),
      path: '/student/attendance',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      icon: BarChart3,
      label: t('menu.summary'),
      description: t('menu.summary_desc'),
      path: '/student/attendance-summary',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: WifiOff,
      label: t('menu.offline_qr'),
      description: t('menu.offline_qr_desc'),
      path: '/student/offline-qr',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      icon: ListTodo,
      label: 'My Tasks',
      description: 'View assigned tasks',
      path: '/student/tasks',
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    },
    {
      icon: BookOpen,
      label: 'Lesson Materials',
      description: 'Access shared files',
      path: '/student/materials',
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      icon: User,
      label: t('menu.profile'),
      description: t('menu.profile_desc'),
      path: '/student/profile',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      icon: Music,
      label: 'Music Map',
      description: 'Pin a song you love',
      path: '/music-map',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      icon: CalendarDays,
      label: 'Class Calendar',
      description: 'Holidays & suspensions',
      path: '/student/calendar',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      icon: FileWarning,
      label: 'Excuses',
      description: 'Submit absence reason',
      path: '/student/excuses',
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      icon: Star,
      label: t('menu.rate_app'),
      description: t('menu.rate_app_desc'),
      path: '/ratings',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  const bottomNavItems = [
    { icon: Home, label: t('nav.home'), path: '/dashboard' },
    { icon: QrCode, label: t('nav.qr_code'), path: '/student/qr-code' },
    { icon: Calendar, label: t('nav.attendance'), path: '/student/attendance' },
    { icon: User, label: t('nav.profile'), path: '/student/profile' },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <CrossLogo size={120} />
          <p className="mt-4 text-lg text-muted-foreground">Loading your profile...</p>
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
      {/* Tutorial */}
      <TutorialGuide isOpen={showTutorial} onClose={handleTutorialClose} />
      
      {/* Notice Modal - shows after tutorial */}
      <NoticeModal isOpen={showNotice} onClose={closeNotice} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <CrossLogo size={36} />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-primary leading-tight">CathoLink</h1>
              <p className="text-[10px] text-muted-foreground">{t('app.student_portal')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <DigitalClock />
            <SettingsDialog />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={openTutorial} 
              className="h-8 w-8"
              title="View Tutorial"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
        {/* No-class banner (holiday / suspended / no_classes / weekend) */}
        <NoClassBanner />

        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-5 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <FramedAvatar userId={profile.user_id} imageUrl={profile.profile_picture_url} name={profile.name} size={64} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{t('dashboard.welcome')}</p>
              <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{t('attendance.section')}: {profile.section}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Title */}
        <div className="mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-foreground">{t('dashboard.quick_actions')}</h3>
          <p className="text-sm text-muted-foreground">{t('dashboard.what_to_do')}</p>
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
        <div className="mt-8 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
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

      {/* Peeking Character with Quote */}
      {showQuote && (
        <div className="fixed bottom-20 right-0 z-40 flex items-end pointer-events-none">
          {/* Speech Bubble */}
          <div className="relative bg-card border border-border rounded-2xl rounded-br-none p-3 shadow-lg max-w-[180px] mb-8 mr-2 pointer-events-auto animate-fade-in">
            <button 
              onClick={() => setShowQuote(false)}
              className="absolute -top-2 -left-2 bg-card border border-border rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-xs text-foreground italic leading-relaxed">"{currentQuote.quote}"</p>
            <p className="text-[10px] text-muted-foreground mt-1">— {currentQuote.author}</p>
          </div>
          
          {/* Peeking Character - Half body visible from right edge */}
          <div 
            className="relative w-24 h-28 cursor-pointer pointer-events-auto translate-x-8 hover:translate-x-4 transition-transform duration-300" 
            onClick={showNewQuote}
            title="Click for a new quote!"
          >
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
              {/* Character peeking from right - only left half visible */}
              <defs>
                <clipPath id="peekClip">
                  <rect x="0" y="0" width="70" height="120" />
                </clipPath>
              </defs>
              
              <g clipPath="url(#peekClip)">
                {/* Body/Outfit based on profession */}
                {currentProfession === 'priest' && (
                  <>
                    {/* Priest Cassock */}
                    <path d="M20 55 Q15 80 18 115 L70 115 Q73 80 68 55 Z" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="1"/>
                    <circle cx="44" cy="65" r="1.5" fill="#2a2a2a"/>
                    <circle cx="44" cy="75" r="1.5" fill="#2a2a2a"/>
                    <circle cx="44" cy="85" r="1.5" fill="#2a2a2a"/>
                    {/* Roman Collar */}
                    <rect x="32" y="50" width="24" height="6" rx="2" fill="white"/>
                    {/* Cross necklace */}
                    <line x1="44" y1="56" x2="44" y2="62" stroke="#c9a227" strokeWidth="2"/>
                    <line x1="41" y1="59" x2="47" y2="59" stroke="#c9a227" strokeWidth="2"/>
                  </>
                )}
                
                {currentProfession === 'engineer' && (
                  <>
                    {/* Engineer vest */}
                    <path d="M20 55 Q15 80 18 115 L70 115 Q73 80 68 55 Z" fill="#ff6b00" stroke="#e55a00" strokeWidth="1"/>
                    <path d="M25 55 L25 115" stroke="#ffff00" strokeWidth="3"/>
                    <path d="M35 55 L35 115" stroke="#ffff00" strokeWidth="3"/>
                    {/* Hard hat */}
                    <ellipse cx="44" cy="12" rx="26" ry="8" fill="#ffcc00" stroke="#e5b800" strokeWidth="1"/>
                    <path d="M20 12 Q20 0 44 0 Q68 0 68 12" fill="#ffcc00" stroke="#e5b800" strokeWidth="1"/>
                  </>
                )}
                
                {currentProfession === 'pilot' && (
                  <>
                    {/* Pilot uniform */}
                    <path d="M20 55 Q15 80 18 115 L70 115 Q73 80 68 55 Z" fill="#1e3a5f" stroke="#152a45" strokeWidth="1"/>
                    {/* Epaulettes */}
                    <rect x="22" y="52" width="12" height="5" rx="1" fill="#c9a227"/>
                    <rect x="54" y="52" width="12" height="5" rx="1" fill="#c9a227"/>
                    {/* Wings badge */}
                    <ellipse cx="44" cy="70" rx="10" ry="4" fill="#c9a227"/>
                    {/* Pilot cap */}
                    <ellipse cx="44" cy="18" rx="24" ry="6" fill="#1e3a5f"/>
                    <rect x="22" y="10" width="44" height="10" rx="2" fill="#1e3a5f"/>
                    <rect x="35" y="8" width="18" height="6" rx="1" fill="#c9a227"/>
                  </>
                )}
                
                {currentProfession === 'doctor' && (
                  <>
                    {/* Doctor white coat */}
                    <path d="M20 55 Q15 80 18 115 L70 115 Q73 80 68 55 Z" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                    <path d="M20 55 L20 115" stroke="#e0e0e0" strokeWidth="1"/>
                    {/* Stethoscope */}
                    <path d="M38 55 Q30 65 32 75" fill="none" stroke="#333" strokeWidth="2"/>
                    <circle cx="32" cy="78" r="4" fill="#333"/>
                    {/* Pocket */}
                    <rect x="50" y="65" width="12" height="15" rx="1" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                    <rect x="52" y="67" width="3" height="8" fill="#2196f3"/>
                  </>
                )}
                
                {currentProfession === 'teacher' && (
                  <>
                    {/* Teacher cardigan */}
                    <path d="M20 55 Q15 80 18 115 L70 115 Q73 80 68 55 Z" fill="#8b4513" stroke="#6b3410" strokeWidth="1"/>
                    {/* Shirt underneath */}
                    <path d="M35 55 L35 80 L53 80 L53 55" fill="#f5f5dc"/>
                    {/* Glasses */}
                    <circle cx="35" cy="35" r="8" fill="none" stroke="#333" strokeWidth="2"/>
                    <circle cx="53" cy="35" r="8" fill="none" stroke="#333" strokeWidth="2"/>
                    <line x1="43" y1="35" x2="45" y2="35" stroke="#333" strokeWidth="2"/>
                    {/* Book */}
                    <rect x="55" y="75" width="10" height="14" rx="1" fill="#8b0000"/>
                  </>
                )}
                
                {currentProfession === 'chef' && (
                  <>
                    {/* Chef jacket */}
                    <path d="M20 55 Q15 80 18 115 L70 115 Q73 80 68 55 Z" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                    {/* Double buttons */}
                    <circle cx="38" cy="65" r="2" fill="#333"/>
                    <circle cx="50" cy="65" r="2" fill="#333"/>
                    <circle cx="38" cy="78" r="2" fill="#333"/>
                    <circle cx="50" cy="78" r="2" fill="#333"/>
                    {/* Chef hat (toque) */}
                    <ellipse cx="44" cy="18" rx="22" ry="6" fill="white" stroke="#e0e0e0"/>
                    <path d="M24 18 Q22 -5 44 -8 Q66 -5 64 18" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                  </>
                )}
                
                {/* Head - Same for all professions */}
                {currentProfession !== 'teacher' && (
                  <>
                    <ellipse cx="44" cy="32" rx="20" ry="22" fill="#fcd5b8" stroke="#e8b89a" strokeWidth="1"/>
                    {/* Ear */}
                    <ellipse cx="24" cy="34" rx="4" ry="6" fill="#fcd5b8" stroke="#e8b89a" strokeWidth="1"/>
                    {/* Hair */}
                    {currentProfession === 'priest' && (
                      <path d="M26 22 Q30 12 44 10 Q58 12 62 22 Q64 16 58 12 Q48 6 44 6 Q40 6 30 12 Q24 16 26 22" fill="#a0a0a0"/>
                    )}
                    {(currentProfession === 'doctor' || currentProfession === 'pilot') && (
                      <path d="M26 22 Q30 12 44 10 Q58 12 62 22 Q64 16 58 12 Q48 6 44 6 Q40 6 30 12 Q24 16 26 22" fill="#3a2a1a"/>
                    )}
                    {currentProfession === 'chef' && (
                      <path d="M26 24 Q30 18 44 16" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
                    )}
                  </>
                )}
                
                {currentProfession === 'teacher' && (
                  <>
                    <ellipse cx="44" cy="32" rx="20" ry="22" fill="#fcd5b8" stroke="#e8b89a" strokeWidth="1"/>
                    <ellipse cx="24" cy="34" rx="4" ry="6" fill="#fcd5b8" stroke="#e8b89a" strokeWidth="1"/>
                    {/* Bun hairstyle */}
                    <path d="M26 22 Q30 12 44 10 Q58 12 62 22" fill="#4a3728"/>
                    <circle cx="44" cy="8" r="8" fill="#4a3728"/>
                  </>
                )}
                
                {/* Eyes for all */}
                {currentProfession !== 'teacher' && (
                  <>
                    <ellipse cx="36" cy="32" rx="5" ry="6" fill="white" stroke="#333" strokeWidth="0.5"/>
                    <ellipse cx="52" cy="32" rx="5" ry="6" fill="white" stroke="#333" strokeWidth="0.5"/>
                    <ellipse cx="37" cy="33" rx="2.5" ry="3" fill="#2a1810">
                      <animate attributeName="cx" dur="3s" repeatCount="indefinite" values="37;37;35;37;37"/>
                    </ellipse>
                    <ellipse cx="53" cy="33" rx="2.5" ry="3" fill="#2a1810">
                      <animate attributeName="cx" dur="3s" repeatCount="indefinite" values="53;53;51;53;53"/>
                    </ellipse>
                    <circle cx="38" cy="31" r="1" fill="white"/>
                    <circle cx="54" cy="31" r="1" fill="white"/>
                    {/* Blink */}
                    <ellipse cx="36" cy="32" rx="5" ry="6" fill="#fcd5b8">
                      <animate attributeName="ry" dur="4s" repeatCount="indefinite" values="0;0;0;6;0;0;0;0;0;0"/>
                    </ellipse>
                    <ellipse cx="52" cy="32" rx="5" ry="6" fill="#fcd5b8">
                      <animate attributeName="ry" dur="4s" repeatCount="indefinite" values="0;0;0;6;0;0;0;0;0;0"/>
                    </ellipse>
                  </>
                )}
                
                {currentProfession === 'teacher' && (
                  <>
                    {/* Eyes behind glasses */}
                    <ellipse cx="35" cy="35" rx="4" ry="5" fill="white"/>
                    <ellipse cx="53" cy="35" rx="4" ry="5" fill="white"/>
                    <ellipse cx="36" cy="36" rx="2" ry="2.5" fill="#2a1810"/>
                    <ellipse cx="54" cy="36" rx="2" ry="2.5" fill="#2a1810"/>
                  </>
                )}
                
                {/* Nose and Smile - all */}
                <ellipse cx="44" cy="40" rx="3" ry="2.5" fill="#eac4a8"/>
                <path d="M36 47 Q44 53 52 47" fill="none" stroke="#8b4513" strokeWidth="1.5" strokeLinecap="round"/>
                
                {/* Rosy cheeks */}
                <ellipse cx="28" cy="42" rx="4" ry="2.5" fill="#ffb6c1" opacity="0.4"/>
                <ellipse cx="60" cy="42" rx="4" ry="2.5" fill="#ffb6c1" opacity="0.4"/>
                
                {/* Waving hand */}
                <g>
                  <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 15 60;20 15 60;0 15 60;-10 15 60;0 15 60"/>
                  <path d="M20 55 Q10 50 5 42" fill={currentProfession === 'priest' ? '#1a1a1a' : currentProfession === 'engineer' ? '#ff6b00' : currentProfession === 'pilot' ? '#1e3a5f' : 'white'} stroke="none"/>
                  <ellipse cx="5" cy="40" rx="6" ry="7" fill="#fcd5b8" stroke="#e8b89a" strokeWidth="1"/>
                  <ellipse cx="0" cy="42" rx="2.5" ry="3.5" fill="#fcd5b8"/>
                </g>
              </g>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
