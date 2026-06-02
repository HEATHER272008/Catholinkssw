import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossLogo } from '@/components/CrossLogo';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, EyeOff, ShieldAlert, Clock } from 'lucide-react';
const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const payload = {
      to_email: email,
      to_name: name,
      student_name: name,
      status: 'welcome',
      time: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    };

    console.log('[EMAIL] invoking send-email (welcome) with:', payload);
    const { data, error } = await supabase.functions.invoke('send-email', { body: payload });

    if (error) {
      console.error('[EMAIL] welcome email failed:', error);
      return;
    }

    console.log('[EMAIL] welcome email response:', data);
  } catch (error) {
    console.error('[EMAIL] unexpected error sending welcome email:', error);
  }
};

const SECTIONS = [
  '12 ABM JOY', '12 STEM COUNSEL', '12 STEM TEMPERANCE', '12 STEM INTEGRITY',
  '12 HUMSS PEACE', '12 HUMSS CHARITY', '12 HUMSS HUMILITY', '12 HUMSS FAITH',
  '12 TVL BP', '12 TVL ICT',
  '11 DILIGENCE', '11 WISDOM', '11 KNOWLEDGE', '11 PRUDENCE',
  '11 PIETY', '11 HOPE', '11 FORTITUDE'
];

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string) => {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
};

const provisionAccount = async () => {
  // Get the current session to ensure we have a valid token
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    console.warn('[Auth] No session available for provisioning, skipping');
    return;
  }
  
  const { error } = await withTimeout(
    supabase.functions.invoke('provision-user', {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    }),
    8000,
    'Account setup'
  );
  if (error) {
    console.error('[Auth] Provision error:', error);
    // Don't throw - allow login to continue even if provisioning fails
    // The useAuth hook will retry provisioning
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentGuardianName, setParentGuardianName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [section, setSection] = useState('');
  const [adviserName, setAdviserName] = useState('');
  const [parentNumber, setParentNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [informedConsentAccepted, setInformedConsentAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminRequestDialogOpen, setAdminRequestDialogOpen] = useState(false);
  const [adminRequestSubmitted, setAdminRequestSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Detect offline immediately
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast({
        variant: 'destructive',
        title: 'No internet connection',
        description: 'Please check your Wi-Fi or mobile data and try again.',
      });
      setLoading(false);
      return;
    }

    const maxRetries = 4; // up to 5 attempts total
    let lastError: any = null;

    const isTransient = (err: any) => {
      const msg = (err?.message || '').toLowerCase();
      const status = err?.status;
      return (
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('timed out') ||
        msg.includes('load failed') ||
        msg.includes('fetch') ||
        status === 0 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        status === 408 ||
        status === 429
      );
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          15000,
          'Sign in'
        );

        if (error) throw error;

        // Ensure the user has matching profile + role records (background, non-blocking)
        provisionAccount().catch((err) => console.warn('[Auth] Provision after login failed (non-blocking):', err));

        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
          duration: 3000,
        });

        navigate('/dashboard');
        return;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Auth] Login attempt ${attempt + 1} failed:`, error?.message);

        if (isTransient(error) && attempt < maxRetries) {
          // Exponential backoff with jitter: ~0.8s, 1.6s, 3.2s, 5s
          const delay = Math.min(5000, 800 * Math.pow(2, attempt)) + Math.random() * 300;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        break;
      }
    }

    const transient = isTransient(lastError);
    toast({
      variant: 'destructive',
      title: transient ? 'Connection problem' : 'Login failed',
      description: transient
        ? 'We had trouble reaching the server. Please check your internet and try again in a moment.'
        : lastError?.message || 'An unexpected error occurred.',
    });
    setLoading(false);
  };

  const handleAdminRequest = async () => {
    setLoading(true);
    try {
      // Validate required fields for admin request
      if (!name || !email || !password || !phone || !birthday) {
        throw new Error('Please fill in all required fields.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      if (!termsAccepted || !informedConsentAccepted) {
        throw new Error('Please accept the Terms & Conditions and Informed Consent.');
      }

      // Submit admin request (store password temporarily for account creation upon approval)
      const { error } = await supabase.from('admin_requests').insert({
        email,
        name,
        phone,
        birthday,
        temp_password_hash: password, // Will be used to create account when approved
      });

      if (error) {
        if (error.message.includes('duplicate')) {
          throw new Error('An admin request with this email already exists.');
        }
        throw error;
      }

      setAdminRequestSubmitted(true);
      setAdminRequestDialogOpen(false);
      
      toast({
        title: 'Admin Request Submitted!',
        description: 'Your request has been sent to the administrators for approval. You will be able to login once approved.',
      });

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setBirthday('');
      setRole('student');
      setTermsAccepted(false);
      setInformedConsentAccepted(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If admin role selected, show confirmation dialog instead of direct signup
    if (role === 'admin') {
      // First validate all fields
      if (!name || !email || !password || !phone || !birthday) {
        toast({
          variant: 'destructive',
          title: 'Missing fields',
          description: 'Please fill in all required fields.',
        });
        return;
      }

      if (password !== confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'Password mismatch',
          description: 'Passwords do not match.',
        });
        return;
      }

      if (!termsAccepted || !informedConsentAccepted) {
        toast({
          variant: 'destructive',
          title: 'Consent required',
          description: 'Please accept the Terms & Conditions and Informed Consent.',
        });
        return;
      }

      setAdminRequestDialogOpen(true);
      return;
    }
    
    setLoading(true);

    try {
      // Validate required fields
      if (!name || !email || !password || !phone || !birthday) {
        throw new Error('Please fill in all required fields.');
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      // Validate student-specific fields only for students
      if (role === 'student' && (!section || !parentNumber || !parentGuardianName || !adviserName)) {
        throw new Error('Please fill in all required fields for students.');
      }

      // Validate terms acceptance
      if (!termsAccepted) {
        throw new Error('Please accept the Terms & Conditions to continue.');
      }

      // Validate informed consent
      if (!informedConsentAccepted) {
        throw new Error('Please accept the Informed Consent to continue.');
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            phone,
            parent_guardian_name: parentGuardianName,
            birthday,
            role,
            adviser_name: adviserName,
            terms_accepted: termsAccepted,
            section: role === 'student' ? section : null,
            parent_number: role === 'student' ? parentNumber : null,
          },
        },
      });

      if (error) throw error;

      // Some auth configurations may not immediately create a session on sign up.
      // If that happens, sign in once so we can finish account provisioning.
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      // Create/repair profile + role records
      await provisionAccount();

      // Send welcome email (don't block signup UI on external email latency)
      sendWelcomeEmail(email, name);

      toast({
        title: 'Account created!',
        description: 'Welcome to CathoLink. A welcome email has been sent to you.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(isLogin ? 'login' : 'signup');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(value as 'login' | 'signup');
      setIsLogin(value === 'login');
      setIsAnimating(false);
    }, 150);
  };

  const scrollToInput = (e: React.FocusEvent<HTMLInputElement>) => {
    // On mobile, scroll the input into view when keyboard appears
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col overflow-y-auto relative">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Main container - scrollable on mobile for keyboard */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 sm:justify-center sm:pt-0 p-4 pb-8 z-10">
        <div className="relative w-full max-w-md">
          {/* Logo and branding - compact on mobile, larger on desktop */}
          <div className="text-center mb-3 sm:mb-8 animate-fade-in">
            <div className="flex justify-center mb-1 sm:mb-4">
              <div className="p-1.5 sm:p-4 bg-card rounded-xl sm:rounded-2xl shadow-lg border border-border/50">
                <CrossLogo size={36} className="sm:hidden" />
                <CrossLogo size={70} className="hidden sm:block" />
              </div>
            </div>
            <h1 className="text-lg sm:text-3xl font-bold text-foreground">CathoLink</h1>
            <p className="text-muted-foreground text-[10px] sm:text-base mt-0.5 sm:mt-1">Faith. Attendance. Connection.</p>
          </div>

          {/* Tab switcher - compact */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-muted/50 backdrop-blur-sm p-0.5 sm:p-1 rounded-full inline-flex gap-0.5 sm:gap-1 border border-border/30">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'login'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'signup'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Card container */}
          <Card className={`shadow-xl border-border/50 backdrop-blur-sm bg-card/95 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            <CardContent className="p-4 sm:p-8">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</Label>
                  <div className="relative">
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={scrollToInput}
                      required
                      className="h-12 rounded-xl bg-muted/30 border-border/50 focus:border-primary pl-4 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={scrollToInput}
                      required
                      className="h-12 rounded-xl bg-muted/30 border-border/50 focus:border-primary pl-4 pr-12 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300" 
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            ) : (
              <ScrollArea className="h-[55vh] sm:h-[60vh] pr-3 -mr-3">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary pr-12 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary pr-12 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone/Contact Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="text-sm font-medium text-foreground">Birthday (MM/DD/YYYY)</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      required
                      className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-foreground">Role</Label>
                    <Select value={role} onValueChange={(v: 'student' | 'admin') => setRole(v)}>
                      <SelectTrigger id="role" className="h-11 rounded-xl bg-muted/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin role warning */}
                  {role === 'admin' && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                      <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <strong className="block mb-1">Admin Approval Required</strong>
                        Admin accounts require approval from an existing administrator. Your request will be reviewed before you can access the system.
                      </div>
                    </div>
                  )}
                  
                  {role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="parent-guardian" className="text-sm font-medium text-foreground">Parent/Guardian Name</Label>
                        <Input
                          id="parent-guardian"
                          type="text"
                          placeholder="Parent/Guardian full name"
                          value={parentGuardianName}
                          onChange={(e) => setParentGuardianName(e.target.value)}
                          required
                          className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary transition-all"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="section" className="text-sm font-medium text-foreground">Section</Label>
                        <Select value={section} onValueChange={setSection}>
                          <SelectTrigger id="section" className="h-11 rounded-xl bg-muted/30 border-border/50">
                            <SelectValue placeholder="Select your section" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border shadow-lg z-50">
                            {SECTIONS.map((sec) => (
                              <SelectItem key={sec} value={sec}>
                                {sec}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="adviser-name" className="text-sm font-medium text-foreground">Adviser Name</Label>
                        <Input
                          id="adviser-name"
                          type="text"
                          placeholder="Your adviser's name"
                          value={adviserName}
                          onChange={(e) => setAdviserName(e.target.value)}
                          required
                          className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary transition-all"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parent-number" className="text-sm font-medium text-foreground">Parent's Phone Number</Label>
                        <Input
                          id="parent-number"
                          type="tel"
                          placeholder="Enter parent's phone number"
                          value={parentNumber}
                          onChange={(e) => setParentNumber(e.target.value)}
                          required
                          className="h-11 rounded-xl bg-muted/30 border-border/50 focus:border-primary transition-all"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Consent checkboxes */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-start space-x-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                      <input
                        type="checkbox"
                        id="informed-consent"
                        checked={informedConsentAccepted}
                        onChange={(e) => setInformedConsentAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded"
                        required
                      />
                      <Label htmlFor="informed-consent" className="text-xs cursor-pointer leading-relaxed">
                        I agree to the{' '}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button type="button" className="text-primary underline hover:text-primary/80 font-medium">
                              Informed Consent
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Informed Consent</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-[60vh] pr-4">
                              <div className="space-y-6 text-muted-foreground">
                                <p className="leading-relaxed">
                                  <strong>Greetings of love and peace!</strong>
                                </p>
                                
                                <p className="leading-relaxed">
                                  We, the undersigned Grade 12 students of Binmaley Catholic School, Inc., currently enrolled in the 
                                  subject Inquiries, Investigation, and Immersion are presently working on our research paper entitled: 
                                  <em className="font-medium text-foreground"> "Development of IoT-Based Student Monitoring App for Enhanced 
                                  Security in the Senior High School Department of Binmaley Catholic School, Inc."</em>
                                </p>
                                
                                <p className="leading-relaxed">
                                  In this connection, may we request your voluntary participation in our study as we believe that your 
                                  insights, perspectives, and other relevant information are deemed relevant and significant in the success 
                                  of our investigation. Please be informed that your participation is voluntary in nature and you may 
                                  withdraw anytime when you feel your rights are at risk. Nevertheless, we assure you that all data shared 
                                  in this study will be kept confidential and data privacy regulations mandated by law are strongly upheld.
                                </p>
                                
                                <p className="leading-relaxed">
                                  By agreeing to this informed consent, you are signifying an intention to participate in the data gathering 
                                  process. For any information you may be needing, kindly reach us through these contact details: 
                                  cellphone no: <strong>0956-7456-492</strong> or email: <strong>lopezmarkemman@gmail.com</strong>.
                                </p>
                                
                                <p className="leading-relaxed">
                                  Thank you and more power!
                                </p>
                                
                                <section className="pt-4 border-t">
                                  <p className="font-medium text-foreground mb-2">Sincerely,</p>
                                  <ul className="space-y-1 text-sm">
                                    <li>Jermaine Summer A. Segundo</li>
                                    <li>Mark Emman A. Lopez</li>
                                    <li>Edrian Rheine C. Baugan</li>
                                    <li>Samuel Jr. C. De Guzman</li>
                                    <li>Jake Raizain E. Bambao</li>
                                  </ul>
                                </section>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded"
                        required
                      />
                      <Label htmlFor="terms" className="text-xs cursor-pointer leading-relaxed">
                        I accept the{' '}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button type="button" className="text-primary underline hover:text-primary/80 font-medium">
                              Terms & Conditions
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Data Privacy Consent & Terms</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-[60vh] pr-4">
                              <div className="space-y-6 text-muted-foreground">
                                <section>
                                  <h2 className="text-lg font-semibold text-foreground mb-3">Informed Consent for Data Collection</h2>
                                  <p className="leading-relaxed">
                                    In accordance with the <strong>Data Privacy Act of 2012</strong> and its Implementing Rules and Regulations, 
                                    I voluntarily authorize <strong>12-Counsel Group #1</strong> to collect, process, and use my personal 
                                    information for the research entitled <em>"Development of an IoT-Based Student Monitoring Application 
                                    for Enhanced Security in the Senior High School Department of Binmaley Catholic School, Inc."</em>
                                  </p>
                                </section>

                                <section>
                                  <h2 className="text-lg font-semibold text-foreground mb-3">Voluntary Participation</h2>
                                  <p className="leading-relaxed">
                                    I understand that my participation is entirely voluntary and that I may withdraw from the study 
                                    at any point without any form of penalty or adverse consequence.
                                  </p>
                                </section>

                                <section>
                                  <h2 className="text-lg font-semibold text-foreground mb-3">Confidentiality & Data Protection</h2>
                                  <p className="leading-relaxed">
                                    All information I provide will be treated with strict confidentiality and will be used exclusively 
                                    for academic research purposes. I further acknowledge that the Research Team will apply appropriate 
                                    data protection measures to ensure the security of my personal information.
                                  </p>
                                </section>

                                <section className="pt-4 border-t">
                                  <p className="text-sm italic">
                                    By checking the terms acceptance box during signup, you confirm that you have read, understood, 
                                    and agree to the above terms.
                                  </p>
                                </section>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </Label>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 mt-2" 
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : role === 'admin' ? 'Request Admin Access' : 'Sign Up'}
                  </Button>
                </form>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Admin Request Confirmation Dialog */}
        <Dialog open={adminRequestDialogOpen} onOpenChange={setAdminRequestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Confirm Admin Request
              </DialogTitle>
              <DialogDescription>
                Admin accounts require approval from an existing administrator. Your request will be submitted for review.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">What happens next?</p>
                  <p className="text-muted-foreground text-xs">An admin will review your request. Once approved, you'll be able to login with your credentials.</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Email:</strong> {email}</p>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setAdminRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdminRequest} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {activeTab === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => handleTabChange(activeTab === 'login' ? 'signup' : 'login')}
            className="text-primary font-medium hover:underline"
          >
            {activeTab === 'login' ? 'Sign up' : 'Login'}
          </button>
        </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;