import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Bug, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PageTransition from '@/components/PageTransition';

const FAQ = [
  ['How do I scan my QR?', 'Open the dashboard and tap "My QR Code" — show it to your teacher\'s scanner.'],
  ['What if I\'m offline?', 'Use "Offline QR" — it generates a weekly secure code that works without internet.'],
  ['How do excuses work?', 'Submit a reason from the Excuses page; your teacher reviews and approves.'],
  ['Can I change my email?', 'Email changes require admin assistance. Contact support below.'],
  ['Why isn\'t my dark mode saving?', 'Make sure you allow cookies / local storage for the app.'],
  ['How do birthday popups work?', 'Add birthdays in Calendar → Customize. On the day, a cake + song will play.'],
  ['How do I add a profile frame?', 'Go to Profile and pick from over 20 frames.'],
];

const SettingsHelp = () => {
  const navigate = useNavigate();
  const mailto = 'mailto:support@catholink.app?subject=CathoLink%20Help';
  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-12">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <HelpCircle className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold">Help & Support</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-bold">Frequently Asked Questions</h2>
            {FAQ.map(([q, a]) => (
              <div key={q} className="p-3 rounded-lg bg-muted/40 border">
                <p className="font-semibold text-sm">{q}</p>
                <p className="text-xs text-muted-foreground mt-1">{a}</p>
              </div>
            ))}
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-bold mb-3">Get in touch</h2>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start" onClick={() => window.location.href = mailto}>
                <Mail className="h-4 w-4 mr-2" /> Contact support
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => window.location.href = mailto + '%20Problem%20Report'}>
                <Bug className="h-4 w-4 mr-2" /> Report a problem
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/ratings')}>
                <MessageCircle className="h-4 w-4 mr-2" /> Send feedback
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/terms')}>
                <ExternalLink className="h-4 w-4 mr-2" /> Terms & Conditions
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </PageTransition>
  );
};

export default SettingsHelp;
