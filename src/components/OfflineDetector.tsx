import { useState, useEffect } from 'react';
import { WifiOff, ArrowLeft, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const OfflineDetector = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowPopup(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setShowPopup(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Show popup if already offline on mount
    if (!navigator.onLine) {
      setShowPopup(true);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <WifiOff className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">You are currently offline.</DialogTitle>
          <DialogDescription className="text-center">
            It looks like you've lost your internet connection. You can still generate an offline QR code for attendance.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => {
              setShowPopup(false);
              navigate('/student/offline-qr');
            }}
            className="w-full"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Generate Offline QR Code
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPopup(false)}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfflineDetector;
