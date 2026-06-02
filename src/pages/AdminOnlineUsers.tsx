import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Activity, Search, RefreshCw, Users, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PRESENCE_CHANNEL, usePresenceTracker } from '@/hooks/usePresence';

interface OnlineUser {
  user_id: string;
  name: string;
  role: 'student' | 'admin' | 'super_admin';
  section?: string | null;
  online_at: string;
}

const AdminOnlineUsers = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [search, setSearch] = useState('');
  const [tick, setTick] = useState(0); // for "X seconds ago" updates

  // Make admin presence visible too
  usePresenceTracker(user && profile ? {
    user_id: user.id,
    name: profile.name,
    role: 'admin',
    section: profile.section,
    online_at: new Date().toISOString(),
  } : null);

  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL);

    const update = () => {
      const state = channel.presenceState() as Record<string, OnlineUser[]>;
      const flat: OnlineUser[] = [];
      Object.values(state).forEach((arr) => {
        if (arr && arr.length > 0) flat.push(arr[0]);
      });
      setUsers(flat.sort((a, b) => a.name.localeCompare(b.name)));
    };

    channel
      .on('presence', { event: 'sync' }, update)
      .on('presence', { event: 'join' }, update)
      .on('presence', { event: 'leave' }, update)
      .subscribe();

    const t = setInterval(() => setTick((x) => x + 1), 15000);
    return () => { clearInterval(t); supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      (u.section || '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  const students = filtered.filter((u) => u.role === 'student');
  const staff = filtered.filter((u) => u.role !== 'student');

  const fmtAgo = (iso: string) => {
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };
  void tick;

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Activity className="h-5 w-5 text-emerald-500" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold leading-tight">Who's Online</h1>
            <p className="text-[11px] text-muted-foreground">Live activity in real time</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Wifi className="h-3 w-3 text-emerald-500" /> {users.length}
          </Badge>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, section, role..." className="pl-8 h-9" />
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-3xl mx-auto space-y-5">
        {users.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No one is online right now</p>
            <p className="text-sm text-muted-foreground mt-1">
              When students or other staff open the app you'll see them here.
            </p>
          </Card>
        )}

        {staff.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Staff ({staff.length})</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {staff.map((u) => (
                <UserRow key={u.user_id} u={u} fmtAgo={fmtAgo} initials={initials} />
              ))}
            </div>
          </section>
        )}

        {students.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Students ({students.length})</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {students.map((u) => (
                <UserRow key={u.user_id} u={u} fmtAgo={fmtAgo} initials={initials} />
              ))}
            </div>
          </section>
        )}

        <p className="text-[10px] text-muted-foreground text-center pt-2 flex items-center justify-center gap-1">
          <RefreshCw className="h-3 w-3" /> Updates automatically as users connect.
        </p>
      </main>
    </div>
  );
};

const UserRow = ({ u, fmtAgo, initials }: {
  u: OnlineUser; fmtAgo: (s: string) => string; initials: (s: string) => string;
}) => (
  <Card className="p-3 flex items-center gap-3">
    <div className="relative">
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
        {initials(u.name)}
      </div>
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-medium text-sm truncate">{u.name}</p>
        {u.role !== 'student' && (
          <Badge variant="secondary" className="text-[10px]">{u.role === 'super_admin' ? 'Super Admin' : 'Admin'}</Badge>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground truncate">
        {u.section || (u.role === 'student' ? '—' : 'Staff')} · active {fmtAgo(u.online_at)}
      </p>
    </div>
  </Card>
);

export default AdminOnlineUsers;
