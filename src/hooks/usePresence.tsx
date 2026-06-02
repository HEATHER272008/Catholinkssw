import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceMeta {
  user_id: string;
  name: string;
  role: 'student' | 'admin' | 'super_admin';
  section?: string | null;
  online_at: string;
}

const CHANNEL = 'catholink-presence';

/**
 * Joins a shared presence channel and broadcasts the current user's identity.
 * Use on dashboards / interior pages so admins can see who's online.
 */
export const usePresenceTracker = (meta: PresenceMeta | null) => {
  useEffect(() => {
    if (!meta?.user_id) return;
    const channel = supabase.channel(CHANNEL, {
      config: { presence: { key: meta.user_id } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ ...meta, online_at: new Date().toISOString() });
      }
    });

    const heartbeat = setInterval(() => {
      channel.track({ ...meta, online_at: new Date().toISOString() }).catch(() => {});
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  }, [meta?.user_id, meta?.role, meta?.name, meta?.section]);
};

export type { PresenceMeta };
export { CHANNEL as PRESENCE_CHANNEL };
