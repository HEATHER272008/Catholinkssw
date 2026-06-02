import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';
import noticeMinion from '@/assets/notice-minion.png';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoticeModal = ({ isOpen, onClose }: NoticeModalProps) => {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    localStorage.setItem('catholink_notice_seen', 'true');
    setShowModal(false);
    onClose();
  };

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[450px] max-h-[85vh] p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl [&>button]:hidden flex flex-col">
        {/* Header with gradient and minion */}
        <div className="relative bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 p-5 text-white overflow-hidden flex-shrink-0">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-3 right-4 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Minion image and title */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-20 h-20 flex-shrink-0 animate-bounce-subtle">
              <img 
                src={noticeMinion} 
                alt="Notice" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-5 w-5" />
                <h2 className="text-xl font-bold">Notice!</h2>
              </div>
              <p className="text-white/90 text-sm">Important information for users</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-background">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="font-semibold text-foreground">Welcome!</span> This is currently a web app version created for <span className="text-primary font-medium">demonstration and data-gathering purposes</span>. The full version of the app is still in development, so some features may not function fully or exactly as intended. You might encounter bugs, glitches, or unexpected behavior while using it.
            </p>
            
            <p>
              We built this web app so that we can collect feedback and test features before releasing the complete application. <span className="font-medium text-foreground">Your experience and input are very valuable to us</span>, as they help us identify issues, improve usability, and plan future updates.
            </p>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-foreground font-medium mb-2">Please keep in mind:</p>
              <ul className="space-y-1 text-xs">
                <li>• The web app may load slower than the final app</li>
                <li>• Some options might look incomplete</li>
                <li>• Certain interactions may not work consistently across all devices or browsers</li>
              </ul>
            </div>
            
            <p>
              We encourage you to explore and test the app, but also ask for your <span className="font-medium text-foreground">patience and understanding</span>. Any feedback you provide will directly contribute to making the final app more reliable, smoother, and feature-rich.
            </p>
            
            <p className="text-center font-medium text-primary">
              Thank you for helping us improve and for being part of this testing phase! 🙏
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 bg-background border-t border-border">
          <Button 
            onClick={handleClose}
            className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          >
            I Understand, Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage notice modal state - shows after loading screen
export const useNoticeModal = (isLoaded: boolean) => {
  const [showNotice, setShowNotice] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Show notice after content is loaded (every time)
    if (isLoaded && !hasTriggered) {
      setHasTriggered(true);
      // Small delay after loading completes
      const timer = setTimeout(() => {
        setShowNotice(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, hasTriggered]);

  const closeNotice = () => setShowNotice(false);

  return { showNotice, closeNotice };
};

export default NoticeModal;
