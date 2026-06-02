import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog, Mail, Phone, Lock, LogOut, ShieldAlert, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PageTransition from '@/components/PageTransition';

const LS_REMEMBER = 'catholink_remember_me';
const LS_AUTO = 'catholink_auto_login';

const SettingsAccount = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [remember, setRemember] = useState(localStorage.getItem(LS_REMEMBER) !== 'false');
  const [auto, setAuto] = useState(localStorage.getItem(LS_AUTO) === 'true');

  const savePhone = async () => {
    if (!profile?.user_id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ phone: phone.trim() || null }).eq('user_id', profile.user_id);
    setSaving(false);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    await refreshProfile();
    toast({ title: 'Phone updated' });
  };

  const sendResetEmail = async () => {
    if (!profile?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: window.location.origin + '/auth' });
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Reset email sent', description: `Check ${profile.email}` });
  };

  const requestEmailChange = () => {
    window.location.href = `mailto:support@catholink.app?subject=Email%20Change%20Request&body=Current%20email%3A%20${encodeURIComponent(profile?.email || '')}%0ANew%20email%3A%20`;
  };

  const requestDeletion = () => {
    if (!confirm('Request account deletion? An admin will reach out to confirm.')) return;
    window.location.href = `mailto:support@catholink.app?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%3A%20${encodeURIComponent(profile?.email || '')}`;
  };

  const handleLogout = async () => {
    if (!confirm('Log out?')) return;
    await signOut();
    navigate('/');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-12">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <UserCog className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold">Account</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-bold">Contact</h2>
            <div>
              <label className="text-xs font-medium flex items-center gap-1.5 mb-1"><Mail className="h-3.5 w-3.5" /> Email</label>
              <div className="flex gap-2">
                <Input value={profile?.email || ''} readOnly className="bg-muted/40" />
                <Button variant="outline" onClick={requestEmailChange}>Change</Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium flex items-center gap-1.5 mb-1"><Phone className="h-3.5 w-3.5" /> Phone</label>
              <div className="flex gap-2">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxxx" />
                <Button onClick={savePhone} disabled={saving}>Save</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-1.5"><Lock className="h-4 w-4" /> Sign-in</h2>
            <Toggle icon={KeyRound} label="Remember me" desc="Keep me signed in on this device"
              checked={remember} onChange={(v) => { setRemember(v); localStorage.setItem(LS_REMEMBER, String(v)); }} />
            <Toggle icon={KeyRound} label="Auto-login" desc="Skip the sign-in screen when possible"
              checked={auto} onChange={(v) => { setAuto(v); localStorage.setItem(LS_AUTO, String(v)); }} />
            <Button variant="outline" className="w-full justify-start" onClick={sendResetEmail}>
              <KeyRound className="h-4 w-4 mr-2" /> Send password reset email
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-destructive flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Danger zone</h2>
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10" onClick={requestDeletion}>
              <ShieldAlert className="h-4 w-4 mr-2" /> Request account deletion
            </Button>
          </Card>
        </main>
      </div>
    </PageTransition>
  );
};

const Toggle = ({ icon: Icon, label, desc, checked, onChange }: any) => (
  <div className="flex items-center gap-3 p-2 rounded-lg">
    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default SettingsAccount;
