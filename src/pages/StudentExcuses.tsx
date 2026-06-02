import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, FileWarning, Plus, Clock, CheckCircle2, XCircle, Trash2, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type Category = 'sick' | 'emergency' | 'family' | 'event' | 'school_activity' | 'transportation' | 'other';
type Status = 'pending' | 'approved' | 'rejected';

interface Excuse {
  id: string;
  absence_date: string;
  category: Category;
  reason: string;
  status: Status;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  proof_url: string | null;
}

const CATEGORY_LABELS: Record<Category, string> = {
  sick: '🤒 Sick / Health Issue',
  emergency: '🚨 Emergency',
  family: '👨‍👩‍👧 Family Matter (e.g., bereavement)',
  event: '🏆 Event (Sports / Pageant / Competition)',
  school_activity: '🎓 Official School Activity',
  transportation: '🚌 Transportation Issue',
  other: '📝 Other',
};

const STATUS_META: Record<Status, { label: string; cls: string; icon: any }> = {
  pending: { label: 'Pending Review', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', icon: Clock },
  approved: { label: 'Approved (Excused)', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: 'Rejected', cls: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30', icon: XCircle },
};

const StudentExcuses = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [excuses, setExcuses] = useState<Excuse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(today);
  const [category, setCategory] = useState<Category>('sick');
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('absence_excuses')
      .select('*')
      .eq('student_id', user.id)
      .order('absence_date', { ascending: false });
    setExcuses((data || []) as Excuse[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const submit = async () => {
    if (!user || !profile) return;
    if (!reason.trim() || reason.trim().length < 5) {
      toast({ title: 'Please describe your reason (at least 5 characters).', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    let proof_url: string | null = null;
    if (proofFile) {
      if (proofFile.size > 8 * 1024 * 1024) {
        setSubmitting(false);
        toast({ title: 'File too large', description: 'Max 8 MB.', variant: 'destructive' });
        return;
      }
      setUploading(true);
      const ext = proofFile.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('excuse-proofs')
        .upload(path, proofFile, { contentType: proofFile.type, upsert: false });
      setUploading(false);
      if (upErr) {
        setSubmitting(false);
        toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
        return;
      }
      const { data: pub } = supabase.storage.from('excuse-proofs').getPublicUrl(path);
      proof_url = pub.publicUrl;
    }

    const { error } = await supabase.from('absence_excuses').insert({
      student_id: user.id,
      student_name: profile.name,
      section: profile.section || '',
      absence_date: date,
      category,
      reason: reason.trim().slice(0, 1000),
      proof_url,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit excuse', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Excuse submitted', description: 'Your teacher will review it shortly.' });
    setOpen(false);
    setReason('');
    setCategory('sick');
    setDate(today);
    setProofFile(null);
    load();
  };

  const cancelPending = async (id: string) => {
    const { error } = await supabase.from('absence_excuses').delete().eq('id', id);
    if (error) { toast({ title: 'Could not cancel', variant: 'destructive' }); return; }
    setExcuses((prev) => prev.filter((e) => e.id !== id));
    toast({ title: 'Excuse withdrawn' });
  };

  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground shadow-md">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-9 w-9 text-primary-foreground hover:bg-white/15">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
            <FileWarning className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight">Absence Excuses</h1>
            <p className="text-[11px] opacity-90">Submit a reason so you won't be marked absent</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="h-9 bg-white text-primary hover:bg-white/90"><Plus className="h-4 w-4 mr-1" />New</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit an Excuse</DialogTitle>
                <DialogDescription>
                  Provide an honest reason. Your teacher will review and approve or reject it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="date">Date of Absence</Label>
                  <Input id="date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Reason Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CATEGORY_LABELS) as Category[]).map((k) => (
                        <SelectItem key={k} value={k}>{CATEGORY_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reason">Details</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly explain what happened..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 1000))}
                    rows={4}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{reason.length}/1000</p>
                </div>
                <div>
                  <Label htmlFor="proof">Proof (photo or document, optional but speeds approval)</Label>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <label htmlFor="proof" className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-accent text-sm">
                      <Paperclip className="h-4 w-4" /> {proofFile ? 'Change file' : 'Attach file'}
                    </label>
                    <input
                      id="proof" type="file"
                      accept="image/*,application/pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    />
                    {proofFile && (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                        {proofFile.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        <span className="truncate max-w-[140px]">{proofFile.name}</span>
                        <button type="button" onClick={() => setProofFile(null)} className="ml-1 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Max 8 MB. Medical cert, event letter, etc.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={submitting || uploading}>{uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
        ) : excuses.length === 0 ? (
          <Card className="p-8 text-center">
            <FileWarning className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No excuses submitted yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap <span className="font-semibold">New</span> to submit a reason for an absence.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {excuses.map((e) => {
              const meta = STATUS_META[e.status];
              const Icon = meta.icon;
              return (
                <Card key={e.id} className={`p-4 border ${meta.cls}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-background/60 p-2"><Icon className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-semibold">{fmt(e.absence_date)}</p>
                        <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                      </div>
                      <p className="text-sm mt-1 opacity-90">{CATEGORY_LABELS[e.category]}</p>
                      <p className="text-sm mt-1">{e.reason}</p>
                      {e.proof_url && (
                        <a href={e.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs underline opacity-80 hover:opacity-100">
                          <Paperclip className="h-3 w-3" /> View attached proof
                        </a>
                      )}
                      {e.reviewer_note && (
                        <p className="text-xs mt-2 p-2 rounded bg-background/60 border">
                          <span className="font-semibold">Teacher note:</span> {e.reviewer_note}
                        </p>
                      )}
                      {e.status === 'pending' && (
                        <Button
                          variant="ghost" size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => cancelPending(e.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentExcuses;
