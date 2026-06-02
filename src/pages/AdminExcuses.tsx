import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, FileCheck2, Clock, CheckCircle2, XCircle, Search, Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type Category = 'sick' | 'emergency' | 'family' | 'event' | 'school_activity' | 'transportation' | 'other';
type Status = 'pending' | 'approved' | 'rejected';

interface Excuse {
  id: string;
  student_id: string;
  student_name: string;
  section: string;
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
  sick: '🤒 Sick',
  emergency: '🚨 Emergency',
  family: '👨‍👩‍👧 Family',
  event: '🏆 Event',
  school_activity: '🎓 School Activity',
  transportation: '🚌 Transportation',
  other: '📝 Other',
};

const AdminExcuses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Excuse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>('pending');
  const [search, setSearch] = useState('');

  const [reviewing, setReviewing] = useState<Excuse | null>(null);
  const [decision, setDecision] = useState<Status>('approved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('absence_excuses')
      .select('*')
      .order('absence_date', { ascending: false });
    setItems((data || []) as Excuse[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((i) => {
    if (i.status !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.student_name.toLowerCase().includes(q) || i.section.toLowerCase().includes(q) || i.reason.toLowerCase().includes(q);
  });

  const openReview = (e: Excuse) => {
    setReviewing(e);
    setDecision('approved');
    setNote(e.reviewer_note || '');
  };

  const submitReview = async () => {
    if (!reviewing || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('absence_excuses')
      .update({
        status: decision,
        reviewer_note: note.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reviewing.id);

    if (error) {
      setSaving(false);
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
      return;
    }

    // If approved, also flip any existing absent record for that day to 'excused'
    if (decision === 'approved') {
      const dayStart = new Date(reviewing.absence_date + 'T00:00:00+08:00').toISOString();
      const dayEnd = new Date(reviewing.absence_date + 'T23:59:59+08:00').toISOString();
      await supabase
        .from('attendance')
        .update({ status: 'excused' as any })
        .eq('student_id', reviewing.student_id)
        .eq('status', 'absent')
        .gte('scanned_at', dayStart)
        .lte('scanned_at', dayEnd);
    }

    setSaving(false);
    setReviewing(null);
    toast({ title: decision === 'approved' ? '✅ Excuse approved' : '❌ Excuse rejected' });
    load();
  };

  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const counts = {
    pending: items.filter((i) => i.status === 'pending').length,
    approved: items.filter((i) => i.status === 'approved').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <FileCheck2 className="h-5 w-5 text-primary" />
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight">Excuse Requests</h1>
            <p className="text-[11px] text-muted-foreground">Review &amp; approve student absence reasons</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, section, reason..." className="pl-8 h-9"
            />
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pending"><Clock className="h-3.5 w-3.5 mr-1" /> Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected"><XCircle className="h-3.5 w-3.5 mr-1" /> Rejected ({counts.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
            ) : filtered.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">No {tab} excuses.</Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((e) => (
                  <Card key={e.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{e.student_name}</p>
                          <Badge variant="outline" className="text-[10px]">{e.section}</Badge>
                          <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[e.category]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{fmt(e.absence_date)}</p>
                        <p className="text-sm mt-2">{e.reason}</p>
                        {e.proof_url && (
                          <a href={e.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-primary underline hover:opacity-80">
                            <Paperclip className="h-3 w-3" /> View proof
                          </a>
                        )}
                        {e.reviewer_note && (
                          <p className="text-xs mt-2 p-2 rounded bg-muted border">
                            <span className="font-semibold">Note:</span> {e.reviewer_note}
                          </p>
                        )}
                      </div>
                      {e.status === 'pending' ? (
                        <Button size="sm" onClick={() => openReview(e)}>Review</Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => openReview(e)}>Edit</Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Excuse</DialogTitle>
            <DialogDescription>
              {reviewing && <>{reviewing.student_name} · {fmt(reviewing.absence_date)}</>}
            </DialogDescription>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-muted text-sm">
                <p className="font-medium">{CATEGORY_LABELS[reviewing.category]}</p>
                <p className="mt-1">{reviewing.reason}</p>
              </div>
              {reviewing.proof_url && (
                <div className="rounded-md border overflow-hidden">
                  {/\.(jpg|jpeg|png|webp|gif|heic)(\?|#|$)/i.test(reviewing.proof_url) ? (
                    <a href={reviewing.proof_url} target="_blank" rel="noopener noreferrer">
                      <img src={reviewing.proof_url} alt="Excuse proof" className="w-full max-h-72 object-contain bg-muted" />
                    </a>
                  ) : (
                    <a href={reviewing.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 hover:bg-accent">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">Open attached document</span>
                    </a>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={decision === 'approved' ? 'default' : 'outline'}
                  onClick={() => setDecision('approved')}
                  className={decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  variant={decision === 'rejected' ? 'destructive' : 'outline'}
                  onClick={() => setDecision('rejected')}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
              <div>
                <Textarea
                  placeholder="Optional note to student (e.g., 'Please bring a medical certificate next time')"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button onClick={submitReview} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExcuses;
