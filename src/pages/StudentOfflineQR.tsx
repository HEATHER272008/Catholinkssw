import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, Clock, ShieldCheck, WifiOff, RefreshCw, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/PageTransition';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const OFFLINE_QR_KEY = 'catholink_offline_qr';

interface OfflineQRData {
  token: string;
  createdAt: string;
  expiresAt: string;
  userId: string;
  name: string;
  section: string;
  parentNumber: string | null;
}

const generateOfflineToken = (userId: string, createdAt: string): string => {
  const data = `${userId}-${createdAt}-catholink-offline-weekly`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const part1 = Math.abs(hash).toString(36);
  // Second hash for longer token
  let hash2 = 0;
  const data2 = `${data}-part2`;
  for (let i = 0; i < data2.length; i++) {
    const char = data2.charCodeAt(i);
    hash2 = ((hash2 << 5) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  const part2 = Math.abs(hash2).toString(36);
  return `${part1}-${part2}`;
};

const getTimeUntilExpiry = (expiresAt: string): { days: number; hours: number; minutes: number; seconds: number } => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = Math.max(0, expiry - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
};

const StudentOfflineQR = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [offlineQR, setOfflineQR] = useState<OfflineQRData | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Load or check existing offline QR
  const loadOfflineQR = useCallback(() => {
    const stored = localStorage.getItem(OFFLINE_QR_KEY);
    if (stored) {
      const data: OfflineQRData = JSON.parse(stored);
      // Check if expired
      if (new Date(data.expiresAt).getTime() > Date.now()) {
        setOfflineQR(data);
        return;
      }
      // Expired — clear it
      localStorage.removeItem(OFFLINE_QR_KEY);
    }
    setOfflineQR(null);
  }, []);

  useEffect(() => {
    loadOfflineQR();
  }, [loadOfflineQR]);

  // Countdown timer
  useEffect(() => {
    if (!offlineQR) return;
    const interval = setInterval(() => {
      const remaining = getTimeUntilExpiry(offlineQR.expiresAt);
      setCountdown(remaining);

      // Auto-regenerate when expired
      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        localStorage.removeItem(OFFLINE_QR_KEY);
        setOfflineQR(null);
        toast({ title: 'QR Code Expired', description: 'Your offline QR code has expired. Generate a new one.' });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [offlineQR, toast]);

  const generateNewQR = () => {
    if (!profile) return;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    const createdAt = now.toISOString();

    const token = generateOfflineToken(profile.user_id, createdAt);

    const data: OfflineQRData = {
      token,
      createdAt,
      expiresAt: expiresAt.toISOString(),
      userId: profile.user_id,
      name: profile.name,
      section: profile.section || '',
      parentNumber: profile.parent_number || null,
    };

    localStorage.setItem(OFFLINE_QR_KEY, JSON.stringify(data));
    setOfflineQR(data);
    setShowGenerateDialog(false);
    toast({ title: 'Offline QR Generated', description: 'Your offline QR code is valid for 1 week.' });
  };

  const downloadQR = () => {
    const svg = document.getElementById('offline-qr-code');
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
          link.download = `${profile?.name.replace(/\s+/g, '_')}_Offline_QR.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast({ title: 'Downloaded', description: 'Offline QR code saved as PNG.' });
        }
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const formatNum = (n: number) => n.toString().padStart(2, '0');

  if (!profile) return null;

  const qrPayload = offlineQR
    ? JSON.stringify({
        v: 4,
        type: 'offline_weekly',
        token: offlineQR.token,
        user_id: offlineQR.userId,
        name: offlineQR.name,
        section: offlineQR.section,
        parent_number: offlineQR.parentNumber,
        created_at: offlineQR.createdAt,
        expires_at: offlineQR.expiresAt,
      })
    : '';

  return (
    <PageTransition>
      <div className="min-h-screen gradient-bg p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" className="mb-6" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CrossLogo size={80} />
              </div>
              <CardTitle className="text-2xl">My Offline QR Code</CardTitle>
              <CardDescription>Weekly offline attendance verification</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center gap-6">
              {offlineQR ? (
                <>
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Offline QR — Valid for 1 Week</span>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-8 rounded-lg shadow-inner relative">
                    <QRCodeSVG
                      id="offline-qr-code"
                      value={qrPayload}
                      size={256}
                      level="H"
                      includeMargin
                    />
                    <div className="absolute bottom-2 right-2 bg-amber-600 text-white text-xs px-2 py-1 rounded font-mono">
                      OFFLINE
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="text-center space-y-1">
                    <p className="text-lg font-semibold">{profile.name}</p>
                    <p className="text-muted-foreground">Section: {profile.section}</p>
                  </div>

                  {/* Expiry Countdown */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl border border-border w-full max-w-sm">
                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="text-center flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Expires: {new Date(offlineQR.expiresAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex justify-center gap-1 font-mono text-lg font-bold">
                        <span className="bg-background px-2 py-1 rounded">{countdown.days}d</span>
                        <span>:</span>
                        <span className="bg-background px-2 py-1 rounded">{formatNum(countdown.hours)}</span>
                        <span>:</span>
                        <span className="bg-background px-2 py-1 rounded">{formatNum(countdown.minutes)}</span>
                        <span>:</span>
                        <span className="bg-background px-2 py-1 rounded">{formatNum(countdown.seconds)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button onClick={downloadQR} size="lg" className="w-full">
                      <Download className="h-5 w-5 mr-2" />
                      Download QR (PNG)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowGenerateDialog(true)}
                      size="lg"
                      className="w-full"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Regenerate QR Code
                    </Button>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 max-w-md">
                    <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                      <strong>⚠️ Security Notice:</strong> This offline QR code is valid for one week.
                      Do not share it with others. Scanning on weekends will alert admins.
                    </p>
                  </div>
                </>
              ) : (
                /* No active offline QR */
                <div className="text-center space-y-6 py-8">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <WifiOff className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No Active Offline QR Code</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Generate an offline QR code that will be valid for 1 week for attendance verification.
                    </p>
                  </div>
                  <Button onClick={() => setShowGenerateDialog(true)} size="lg">
                    <QrCode className="h-5 w-5 mr-2" />
                    Generate Offline QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generate Confirmation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center">Offline QR Code</DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              Good day, this is your official offline QR code for the whole week. This QR code will
              serve as your attendance verification while you are offline. Please keep it secure and
              do not share it with others. This QR code will expire after one week.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={generateNewQR} className="w-full">
              Generate Now
            </Button>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default StudentOfflineQR;
