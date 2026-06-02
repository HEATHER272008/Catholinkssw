import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CheckCircle, Cake, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import emailjs from '@emailjs/browser';
import PageTransition from '@/components/PageTransition';

// EmailJS configuration - these are PUBLIC keys, safe for client-side
const EMAILJS_SERVICE_ID = 'service_h1pyehm';
const EMAILJS_TEMPLATE_ID = 'template_dtvn3ve';
const EMAILJS_PUBLIC_KEY = 'a_-2E3G0k-69ParTm';

// Generate a daily signature based on user_id and date (must match StudentQRCode.tsx)
const generateDailySignature = (userId: string, date: string): string => {
  const data = `${userId}-${date}-catholink-secure`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(-8).padStart(8, '0');
};

const getTodayDate = (): string => {
  // Use local date (Philippine time) instead of UTC to prevent timezone issues
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
};

const getLocalDayRangeIso = (dateStr: string): { startIso: string; endIso: string } => {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Local midnight boundaries, converted to ISO for querying timestamptz reliably
  const start = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  const end = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

const AdminScanner = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [isBirthday, setIsBirthday] = useState(false);
  const [qrValidationError, setQrValidationError] = useState<string | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<{ type: string; reason: string | null } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check school calendar for today (holidays / suspended / no_classes)
  useEffect(() => {
    const checkCalendar = async () => {
      const today = getTodayDate();
      const { data } = await supabase
        .from('school_calendar')
        .select('entry_type, reason')
        .eq('date', today)
        .maybeSingle();
      if (data) setCalendarStatus({ type: data.entry_type, reason: data.reason });
      else setCalendarStatus(null);
    };
    checkCalendar();
  }, []);


  useEffect(() => {
    audioRef.current = new Audio('/happy-birthday.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  if (userRole && userRole !== 'admin') {
    return null;
  }

  const checkIfBirthday = (birthday: string) => {
    if (!birthday) return false;
    const today = new Date();
    const birthDate = new Date(birthday);
    return today.getMonth() === birthDate.getMonth() && 
           today.getDate() === birthDate.getDate();
  };

  const getAttendanceStatus = (): 'present' | 'late' | 'absent' | 'half_day' => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    // Time ranges in minutes:
    // 5:00 AM = 300, 7:45 AM = 465, 7:46 AM = 466
    // 12:15 PM = 735, 12:16 PM = 736, 1:15 PM = 795, 1:16 PM = 796
    // 4:30 PM = 990, 4:59 AM = 299
    
    // Present (Morning): 5:00 AM - 7:45 AM (300-465 minutes)
    if (currentTime >= 300 && currentTime <= 465) {
      return 'present';
    }
    
    // Late (Morning): 7:46 AM - 12:15 PM (466-735 minutes)
    if (currentTime >= 466 && currentTime <= 735) {
      return 'late';
    }
    
    // Present (Afternoon): 12:16 PM - 1:15 PM (736-795 minutes)
    if (currentTime >= 736 && currentTime <= 795) {
      return 'present';
    }
    
    // Late (Afternoon): 1:16 PM - 4:30 PM (796-990 minutes)
    if (currentTime >= 796 && currentTime <= 990) {
      return 'late';
    }
    
    // Absent: 4:31 PM - 4:59 AM (991-1439 minutes OR 0-299 minutes)
    // This covers 4:31 PM to 11:59 PM (991-1439) and 12:00 AM to 4:59 AM (0-299)
    return 'absent';
  };

  const playBirthdayAnimation = () => {
    // Play birthday audio
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
    }

    // Trigger confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handleScan = async (result: any) => {
    if (!result || !scanning) return;

    console.log('[QR] scan result:', result);
    setQrValidationError(null);

    try {
      setScanning(false);

      const rawValue = Array.isArray(result) ? result[0]?.rawValue : result?.rawValue;
      if (!rawValue) {
        throw new Error('Invalid scan result (missing rawValue)');
      }

      const studentData = JSON.parse(rawValue);
      console.log('[QR] parsed studentData:', studentData);

      // Handle offline weekly QR codes (v4)
      if (studentData.v === 4 && studentData.type === 'offline_weekly') {
        console.log('[QR] Offline weekly QR code detected');

        // Validate expiration
        if (new Date(studentData.expires_at) < new Date()) {
          setQrValidationError('This offline QR code has expired. The student must generate a new one.');
          toast({ variant: 'destructive', title: '⚠️ Expired Offline QR', description: 'This offline QR code has expired.' });
          setTimeout(() => { setScanning(true); setQrValidationError(null); }, 4000);
          return;
        }

        // Regenerate token to verify authenticity
        const verifyData = `${studentData.user_id}-${studentData.created_at}-catholink-offline-weekly`;
        let hash = 0;
        for (let i = 0; i < verifyData.length; i++) {
          const char = verifyData.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const part1 = Math.abs(hash).toString(36);
        let hash2 = 0;
        const data2 = `${verifyData}-part2`;
        for (let i = 0; i < data2.length; i++) {
          const char = data2.charCodeAt(i);
          hash2 = ((hash2 << 5) - hash2) + char;
          hash2 = hash2 & hash2;
        }
        const part2 = Math.abs(hash2).toString(36);
        const expectedToken = `${part1}-${part2}`;

        if (studentData.token !== expectedToken) {
          setQrValidationError('Invalid offline QR code. This may be tampered.');
          toast({ variant: 'destructive', title: '🚨 Invalid Offline QR', description: 'The token signature is invalid.' });
          setTimeout(() => { setScanning(true); setQrValidationError(null); }, 4000);
          return;
        }

        // Check weekend
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          try {
            await supabase.functions.invoke('send-notification', {
              body: {
                user_ids: [],
                title: '⚠️ Weekend Offline QR Scan',
                body: `Offline QR Code was scanned during weekend by ${studentData.name}.`,
                notification_type: 'weekend_scan_alert',
              }
            });
          } catch (e) { console.error('[PUSH] weekend notification error:', e); }
        }

        // Check duplicate for today
        const today = getTodayDate();
        const { startIso, endIso } = getLocalDayRangeIso(today);
        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentData.user_id)
          .gte('scanned_at', startIso)
          .lte('scanned_at', endIso);

        // Use same morning/afternoon duplicate logic as v2
        const now = new Date();
        const hours = now.getHours();
        if (existingAttendance && existingAttendance.length > 0) {
          const morningScans = existingAttendance.filter(a => new Date(a.scanned_at).getHours() < 12);
          const afternoonScans = existingAttendance.filter(a => new Date(a.scanned_at).getHours() >= 12);
          const currentlyMorning = hours < 12;
          if ((currentlyMorning && morningScans.length > 0) || (!currentlyMorning && afternoonScans.length > 0)) {
            toast({ title: 'Already Recorded', description: `${studentData.name} already marked for this session.`, variant: 'destructive' });
            setTimeout(() => { setScanning(true); }, 3000);
            return;
          }
        }

        const status = getAttendanceStatus();
        const { error: insertErr } = await supabase.from('attendance').insert([{
          student_id: studentData.user_id,
          student_name: studentData.name,
          section: studentData.section,
          scanned_by: user?.id || '',
          status,
          parent_notified: false,
        }]);

        if (insertErr) throw insertErr;

        setScannedStudent({ name: studentData.name, section: studentData.section, status, parent_number: studentData.parent_number });
        toast({ title: 'Attendance Recorded', description: `${studentData.name} from ${studentData.section} marked ${status}. (Offline QR)` });
        setTimeout(() => { setScannedStudent(null); setScanning(true); }, 3000);
        return;
      }

      // Handle admin-generated QR codes (v3)
      if (studentData.v === 3 && studentData.type === 'admin_generated') {
        console.log('[QR] Admin-generated QR code detected');
        
        // Validate token against database
        const { data: qrRecord, error: qrError } = await supabase
          .from('generated_qr_codes')
          .select('*')
          .eq('qr_token', studentData.token)
          .eq('is_active', true)
          .single();

        if (qrError || !qrRecord) {
          setQrValidationError('This QR code is invalid or has been deactivated.');
          toast({ variant: 'destructive', title: '⚠️ Invalid QR Code', description: 'QR code not found or deactivated.' });
          setTimeout(() => { setScanning(true); setQrValidationError(null); }, 4000);
          return;
        }

        // Check expiration
        if (new Date(qrRecord.expires_at) < new Date()) {
          setQrValidationError('This QR code has expired. Please ask your admin for a new one.');
          toast({ variant: 'destructive', title: '⚠️ Expired QR Code', description: 'This admin-generated QR code has expired.' });
          setTimeout(() => { setScanning(true); setQrValidationError(null); }, 4000);
          return;
        }

        // Check weekend scan
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Log weekend scan but still record
          try {
            await supabase.functions.invoke('send-notification', {
              body: {
                user_ids: [], // will notify all admins via the notification table
                title: '⚠️ Weekend QR Scan',
                body: `Admin-generated QR Code was scanned during weekend by ${qrRecord.student_name}.`,
                notification_type: 'weekend_scan_alert',
              }
            });
          } catch (e) { console.error('[PUSH] weekend notification error:', e); }
        }

        // Check if already scanned today
        const today = getTodayDate();
        const { startIso, endIso } = getLocalDayRangeIso(today);
        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_name', qrRecord.student_name)
          .eq('section', qrRecord.section)
          .gte('scanned_at', startIso)
          .lte('scanned_at', endIso);

        if (existingAttendance && existingAttendance.length > 0) {
          toast({
            title: 'Already Recorded',
            description: `${qrRecord.student_name} has already been marked today.`,
            variant: 'destructive',
          });
          setTimeout(() => { setScanning(true); }, 3000);
          return;
        }

        const status = getAttendanceStatus();

        const { error: insertErr } = await supabase
          .from('attendance')
          .insert([{
            student_id: user?.id || qrRecord.created_by, // use creator as fallback since student has no account
            student_name: qrRecord.student_name,
            section: qrRecord.section,
            scanned_by: user?.id || '',
            status,
            parent_notified: false,
          }]);

        if (insertErr) throw insertErr;

        setScannedStudent({
          name: qrRecord.student_name,
          section: qrRecord.section,
          status,
          parent_number: null,
        });

        toast({
          title: 'Attendance Recorded',
          description: `${qrRecord.student_name} from ${qrRecord.section} marked ${status}. (Admin QR)`,
        });

        setTimeout(() => {
          setScannedStudent(null);
          setScanning(true);
        }, 3000);
        return;
      }

      // Validate QR code version and date signature (v2 QR codes)
      if (studentData.v === 2) {
        const today = getTodayDate();
        
        // Check if QR is from today
        if (studentData.date !== today) {
          const errorMsg = `This QR code is from ${studentData.date}. It has expired and is no longer valid.`;
          setQrValidationError(errorMsg);
          toast({
            variant: 'destructive',
            title: '⚠️ Expired QR Code',
            description: 'This QR code is from a previous day. Students must show their current QR code.',
          });
          setTimeout(() => {
            setScanning(true);
            setQrValidationError(null);
          }, 4000);
          return;
        }

        // Verify signature
        const expectedSig = generateDailySignature(studentData.user_id, studentData.date);
        if (studentData.sig !== expectedSig) {
          const errorMsg = 'Invalid QR code signature. This may be a tampered or fake QR code.';
          setQrValidationError(errorMsg);
          toast({
            variant: 'destructive',
            title: '🚨 Invalid QR Code',
            description: 'The QR code signature is invalid. This may be a tampered code.',
          });
          setTimeout(() => {
            setScanning(true);
            setQrValidationError(null);
          }, 4000);
          return;
        }

        console.log('[QR] Signature verified successfully');
      } else {
        // Legacy QR code (v1 or no version) - still accept but warn
        console.log('[QR] Legacy QR code detected (no daily signature)');
        toast({
          title: 'Legacy QR Code',
          description: 'This is an older QR format. Student should regenerate their QR code for better security.',
          variant: 'default',
        });
      }

      // Fetch full student profile including birthday
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', studentData.user_id)
        .single();

      if (!profile) {
        throw new Error('Student profile not found');
      }

      // Check if it's their birthday
      const birthdayToday = checkIfBirthday(profile.birthday);
      setIsBirthday(birthdayToday);

      if (birthdayToday) {
        playBirthdayAnimation();
      }

      // Check if already scanned today (LOCAL day, not UTC)
      const today = getTodayDate();
      const { startIso, endIso } = getLocalDayRangeIso(today);
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentData.user_id)
        .gte('scanned_at', startIso)
        .lte('scanned_at', endIso);

      // Determine attendance status
      const status = getAttendanceStatus();
      const now = new Date();
      const hours = now.getHours();

      // Check for half-day scenario
      let finalStatus: 'present' | 'late' | 'absent' | 'half_day' = status;
      if (existingAttendance && existingAttendance.length > 0) {
        const morningScans = existingAttendance.filter(a => {
          const scanHour = new Date(a.scanned_at).getHours();
          return scanHour >= 6 && scanHour < 12;
        });
        const afternoonScans = existingAttendance.filter(a => {
          const scanHour = new Date(a.scanned_at).getHours();
          return scanHour >= 12 && scanHour < 16;
        });

        // If scanning now and already scanned in the other session
        const currentlyMorning = hours >= 6 && hours < 12;
        const currentlyAfternoon = hours >= 12 && hours < 16;

        if ((currentlyMorning && afternoonScans.length > 0) ||
            (currentlyAfternoon && morningScans.length > 0)) {
          // Both sessions attended - already recorded
          toast({
            title: birthdayToday ? '🎂 Happy Birthday!' : 'Already Recorded',
            description: birthdayToday
              ? `${studentData.name} - Happy Birthday! Already marked present today.`
              : `${studentData.name} has already been marked present today.`,
            variant: birthdayToday ? 'default' : 'destructive',
          });

          setTimeout(() => {
            setScanning(true);
            setIsBirthday(false);
          }, birthdayToday ? 5000 : 3000);
          return;
        } else if ((currentlyMorning && morningScans.length > 0) ||
                   (currentlyAfternoon && afternoonScans.length > 0)) {
          // Already scanned this session
          toast({
            title: birthdayToday ? '🎂 Happy Birthday!' : 'Already Recorded',
            description: birthdayToday
              ? `${studentData.name} - Happy Birthday! Already marked for this session.`
              : `${studentData.name} has already been marked for this session.`,
            variant: birthdayToday ? 'default' : 'destructive',
          });

          setTimeout(() => {
            setScanning(true);
            setIsBirthday(false);
          }, birthdayToday ? 5000 : 3000);
          return;
        }
      }

      // Record attendance
      const { error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentData.user_id,
          student_name: studentData.name,
          section: studentData.section,
          scanned_by: user?.id || '',
          status: finalStatus,
          parent_notified: !!profile.parent_number,
        }]);

      if (error) throw error;

      setScannedStudent({
        ...studentData,
        status: finalStatus,
        birthday: profile.birthday,
        parent_number: profile.parent_number,
        parent_email: profile.email,
      });

      const statusMessage = finalStatus === 'late' ? ' (Late)' :
                           finalStatus === 'half_day' ? ' (Half Day)' :
                           finalStatus === 'absent' ? ' (Absent)' : '';
      toast({
        title: birthdayToday ? '🎂 Happy Birthday & Attendance Recorded!' : 'Attendance Recorded',
        description: `${studentData.name} from ${studentData.section}${statusMessage} has been marked ${finalStatus}.`,
      });

      // Send email notification using client-side EmailJS
      if (profile.email) {
        try {
          const recipientEmail = String(profile.email).trim();
          
          // Email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(recipientEmail);

          // Log email for debugging
          console.log('[EMAIL] Preparing to send to:', recipientEmail);
          console.log('[EMAIL] Email valid:', isValidEmail);

          if (!isValidEmail) {
            toast({
              variant: 'destructive',
              title: 'Invalid Email',
              description: "Invalid recipient email. Please check the student's registered email.",
            });
            throw new Error(`Invalid recipient email: ${recipientEmail}`);
          }

          // Template params matching EmailJS template_dtvn3ve exactly
          const templateParams = {
            to_email: recipientEmail,
            to_name: profile.parent_guardian_name || 'Parent/Guardian',
            student_name: studentData.name,
            message: `Good day Ma'am/Sir! Your son/daughter has safely arrived at school.`,
          };

          console.log('[EMAIL] Sending via EmailJS with params:', JSON.stringify(templateParams, null, 2));

          const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
          );

          console.log('[EMAIL] EmailJS success:', response);
          toast({
            title: 'Email Sent',
            description: `Notification sent to ${recipientEmail}`,
          });
        } catch (emailError: any) {
          console.error('[EMAIL] EmailJS failed:', emailError);
          if (!emailError.message?.includes('Invalid recipient email')) {
            toast({
              variant: 'destructive',
              title: 'Email Failed',
              description: emailError?.text || emailError?.message || 'Failed to send email notification',
            });
          }
        }
      }

      // Send push notification for late/absent/half_day (for app users)
      if (finalStatus === 'late' || finalStatus === 'absent' || finalStatus === 'half_day') {
        const notificationTitle = finalStatus === 'late'
          ? '⚠️ Late Arrival Alert'
          : finalStatus === 'absent'
            ? '🚫 Absence Alert'
            : '📝 Half Day Alert';

        const notificationBody = finalStatus === 'late'
          ? `Good Day! Your child ${studentData.name} has arrived late to school today.`
          : finalStatus === 'absent'
            ? `Good Day! Your child ${studentData.name} has been marked absent today.`
            : `Good Day! Your child ${studentData.name} attended only half day today.`;

        try {
          console.log('[PUSH] invoking send-notification');
          const { data, error } = await supabase.functions.invoke('send-notification', {
            body: {
              user_ids: [studentData.user_id],
              title: notificationTitle,
              body: notificationBody,
              notification_type: 'attendance_alert',
              data: {
                student_id: studentData.user_id,
                student_name: studentData.name,
                status: finalStatus,
              }
            }
          });

          if (error) {
            console.error('[PUSH] send-notification failed:', error);
          } else {
            console.log('[PUSH] send-notification response:', data);
          }
        } catch (notifError) {
          console.error('[PUSH] unexpected error:', notifError);
        }
      }

      // SMS TEMPORARILY DISABLED - Semaphore account pending approval
      // EmailJS handles all parent notifications for now
      // To re-enable SMS, uncomment the block below once Semaphore is approved
      /*
      if (profile.parent_number) {
        try {
          const smsMessage = finalStatus === 'present'
            ? `Good day, Ma'am/Sir. We would like to inform you that your son/daughter, ${studentData.name}, has safely entered the school premises. - Holy Cross of Davao College`
            : finalStatus === 'late'
              ? `Good Day! Your child ${studentData.name} from ${studentData.section} has arrived late to school today at ${new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}. - Holy Cross of Davao College`
              : finalStatus === 'absent'
                ? `Good Day! Your child ${studentData.name} from ${studentData.section} has been marked absent today. Please contact the school if you have any concerns. - Holy Cross of Davao College`
                : `Good Day! Your child ${studentData.name} from ${studentData.section} attended only half day today. - Holy Cross of Davao College`;

          const smsPayload = {
            phone_number: profile.parent_number,
            message: smsMessage,
            student_id: studentData.user_id,
            notification_type: 'attendance_sms',
          };

          console.log('[SMS] invoking send-sms with:', smsPayload);
          const { data, error } = await supabase.functions.invoke('send-sms', {
            body: smsPayload,
          });

          if (error) {
            console.error('[SMS] send-sms failed:', error);
          } else {
            console.log('[SMS] send-sms response:', data);
          }
        } catch (smsError) {
          console.error('[SMS] unexpected error:', smsError);
        }
      }
      */
      console.log('[SMS] Temporarily disabled - using EmailJS only');

      // Reset after animation / processing
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setScannedStudent(null);
        setScanning(true);
        setIsBirthday(false);
      }, birthdayToday ? 5000 : 3000);
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: error.message || 'Invalid QR code',
      });

      setTimeout(() => {
        setScanning(true);
        setIsBirthday(false);
      }, 2000);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="outline" 
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CrossLogo size={80} clickable={false} />
            </div>
            <CardTitle className="text-2xl">Student QR Scanner</CardTitle>
            <CardDescription>
              Scan student QR codes to record attendance
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center gap-6">
            {/* QR Validation Error Display */}
            {qrValidationError && (
              <div className="w-full max-w-md text-center space-y-4 py-8">
                <ShieldAlert className="h-24 w-24 text-red-500 mx-auto animate-scale-in" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-red-600">QR Code Rejected</h3>
                  <p className="text-muted-foreground">{qrValidationError}</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    The student must open their app and show their current QR code.
                  </p>
                </div>
              </div>
            )}
            
            {scannedStudent && !qrValidationError ? (
              <div className="w-full max-w-md text-center space-y-4 py-8">
                <div className="relative">
                  <CheckCircle className="h-24 w-24 text-green-500 mx-auto animate-scale-in" />
                  <ShieldCheck className="h-8 w-8 text-green-600 absolute bottom-0 right-1/3 animate-fade-in" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-green-600">Attendance Recorded!</h3>
                  <p className="text-lg font-semibold">{scannedStudent.name}</p>
                  <p className="text-muted-foreground">Section: {scannedStudent.section}</p>
                  <p className="text-sm text-muted-foreground">Parent notified at: {scannedStudent.parent_number}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-green-600">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verified Daily QR</span>
                  </div>
                </div>
              </div>
            ) : scanning && !qrValidationError ? (
              <div className="w-full max-w-md">
                {/* No-class day warning */}
                {calendarStatus && (
                  <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-center">
                    <p className="font-semibold text-sm">
                      ⚠️ Classes are NOT in session today ({calendarStatus.type.replace('_', ' ')})
                    </p>
                    {calendarStatus.reason && (
                      <p className="text-xs mt-1 opacity-90">{calendarStatus.reason}</p>
                    )}
                  </div>
                )}
                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full mx-auto w-fit">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Daily QR Validation Active</span>
                </div>
                
                <Scanner
                  onScan={handleScan}
                  components={{
                    finder: true,
                  }}
                  styles={{
                    container: {
                      width: '100%',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                    },
                  }}
                />
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Position the QR code within the frame
                </p>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Only today's QR codes will be accepted
                </p>
              </div>
            ) : !qrValidationError ? (
              <div className="w-full max-w-md text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Processing...</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
};

export default AdminScanner;