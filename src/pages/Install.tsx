import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Already Installed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Catholink is already installed on your device.</p>
            <Button onClick={() => navigate("/")} className="w-full">Open App</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Install Catholink</CardTitle>
          <p className="text-muted-foreground mt-2">
            Install the app on your device for quick access and offline support.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isIOS ? (
            <div className="space-y-3 p-4 rounded-lg bg-muted">
              <p className="font-medium text-sm">To install on iPhone/iPad:</p>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Share className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                <span>Tap the <strong>Share</strong> button in Safari</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Download className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                <span>Select <strong>"Add to Home Screen"</strong></span>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full gap-2" size="lg">
              <Download className="w-5 h-5" />
              Install App
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg bg-muted">
              <p className="font-medium text-sm">To install:</p>
              <p className="text-sm text-muted-foreground">
                Open this page in <strong>Chrome</strong> or <strong>Edge</strong>, then tap the menu (⋮) and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
              </p>
            </div>
          )}
          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            Continue in Browser
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
