import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, RefreshCw, Clock, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/PageTransition';

// Generate a daily signature based on user_id and date
// This creates a unique hash that changes every day
const generateDailySignature = (userId: string, date: string): string => {
  // Simple hash function for client-side signature
  const data = `${userId}-${date}-catholink-secure`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to base36 and take last 8 characters for a compact signature
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

const getTimeUntilMidnight = (): { hours: number; minutes: number; seconds: number } => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
};

const StudentQRCode = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(getTimeUntilMidnight());

  // Update countdown every second and check for date change
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = getTodayDate();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        toast({
          title: 'QR Code Updated',
          description: 'Your QR code has been refreshed for today.',
        });
      }
      setTimeUntilExpiry(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentDate, toast]);

  if (!profile) {
    return null;
  }

  const signature = generateDailySignature(profile.user_id, currentDate);

  const qrData = JSON.stringify({
    name: profile.name,
    section: profile.section,
    parent_number: profile.parent_number,
    user_id: profile.user_id,
    date: currentDate,
    sig: signature,
    v: 2, // QR version for backward compatibility detection
  });

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${profile.name.replace(/\s+/g, '_')}_QR_${currentDate}.png`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: 'QR Code Downloaded',
            description: 'Note: This QR code is only valid for today.',
            variant: 'default',
          });
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const formatTime = (num: number): string => num.toString().padStart(2, '0');

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
              <CrossLogo size={80} />
            </div>
            <CardTitle className="text-2xl">Your Personal QR Code</CardTitle>
            <CardDescription>
              Show this QR code to the admin for attendance scanning
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center gap-6">
            {/* Security Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Daily Secure QR</span>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-inner relative">
              <QRCodeSVG
                id="qr-code"
                value={qrData}
                size={256}
                level="H"
                includeMargin={true}
                className="glow-effect"
              />
              {/* Date watermark */}
              <div className="absolute bottom-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded font-mono">
                {currentDate}
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">{profile.name}</p>
              <p className="text-muted-foreground">Section: {profile.section}</p>
            </div>

            {/* Expiry Countdown */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl border border-border">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Valid until midnight</p>
                <div className="flex gap-1 font-mono text-lg font-bold">
                  <span className="bg-background px-2 py-1 rounded">{formatTime(timeUntilExpiry.hours)}</span>
                  <span>:</span>
                  <span className="bg-background px-2 py-1 rounded">{formatTime(timeUntilExpiry.minutes)}</span>
                  <span>:</span>
                  <span className="bg-background px-2 py-1 rounded">{formatTime(timeUntilExpiry.seconds)}</span>
                </div>
              </div>
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <Button 
              onClick={downloadQR}
              size="lg"
              className="w-full max-w-xs"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Today's QR
            </Button>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 max-w-md">
              <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                <strong>⚠️ Security Notice:</strong> This QR code changes daily at midnight. 
                Screenshots from previous days will not work.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
};

export default StudentQRCode;