// Auto-mark-absent: runs daily at 4:31 PM Manila (08:31 UTC).
// Inserts an 'absent' record for every student profile that has no attendance for today,
// skipping weekends and any date present in school_calendar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---- Compute "today" in Manila (UTC+8) ----
    const now = new Date();
    const manilaMs = now.getTime() + 8 * 60 * 60 * 1000;
    const manila = new Date(manilaMs);
    const y = manila.getUTCFullYear();
    const m = String(manila.getUTCMonth() + 1).padStart(2, "0");
    const d = String(manila.getUTCDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;
    const dow = manila.getUTCDay(); // 0=Sun ... 6=Sat

    // ---- Skip weekends ----
    if (dow === 0 || dow === 6) {
      return new Response(JSON.stringify({ skipped: "weekend", date: todayStr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Skip if school_calendar marks today as no-class ----
    const { data: calEntry } = await supabase
      .from("school_calendar")
      .select("entry_type, reason")
      .eq("date", todayStr)
      .maybeSingle();

    if (calEntry) {
      return new Response(
        JSON.stringify({ skipped: "calendar", entry: calEntry, date: todayStr }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Compute today's local-day boundary in ISO ----
    // Manila day starts at UTC (todayStr 00:00 +08:00) -> previous day 16:00 UTC
    const startUtc = new Date(Date.UTC(y, manila.getUTCMonth(), manila.getUTCDate(), 0, 0, 0) - 8 * 60 * 60 * 1000);
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

    // ---- Get all student profiles (anyone with a 'student' role OR no admin/super_admin role) ----
    // Simplest: pull all profiles, then exclude those who already have attendance today.
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, name, section");
    if (profErr) throw profErr;

    // Exclude admins/super_admins
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "super_admin"]);
    const adminIds = new Set((adminRoles || []).map((r: any) => r.user_id));

    const studentProfiles = (profiles || []).filter(
      (p: any) => p.user_id && p.section && !adminIds.has(p.user_id)
    );

    if (studentProfiles.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, reason: "no students" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Today's attendance for those students ----
    const studentIds = studentProfiles.map((p: any) => p.user_id);
    const { data: todayAtt } = await supabase
      .from("attendance")
      .select("student_id")
      .in("student_id", studentIds)
      .gte("scanned_at", startUtc.toISOString())
      .lte("scanned_at", endUtc.toISOString());

    const presentIds = new Set((todayAtt || []).map((a: any) => a.student_id));

    // ---- Approved excuses for today ----
    const { data: excuses } = await supabase
      .from("absence_excuses")
      .select("student_id, student_name, section, reason, category")
      .eq("absence_date", todayStr)
      .eq("status", "approved");
    const excusedMap = new Map<string, any>();
    (excuses || []).forEach((e: any) => excusedMap.set(e.student_id, e));

    // ---- Build absent / excused rows ----
    // Stamp scanned_at at 4:31 PM Manila of today (08:31 UTC same calendar day in Manila)
    const absentStamp = new Date(Date.UTC(y, manila.getUTCMonth(), manila.getUTCDate(), 8, 31, 0)).toISOString();

    const rows = studentProfiles
      .filter((p: any) => !presentIds.has(p.user_id))
      .map((p: any) => {
        const excused = excusedMap.get(p.user_id);
        return {
          student_id: p.user_id,
          student_name: p.name,
          section: p.section,
          scanned_by: p.user_id,
          scanned_at: absentStamp,
          status: excused ? "excused" : "absent",
          parent_notified: false,
        };
      });

    if (rows.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, date: todayStr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert in batches of 200
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      const { error } = await supabase.from("attendance").insert(batch);
      if (error) {
        console.error("[auto-mark-absent] batch insert error:", error);
        throw error;
      }
      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({ inserted, date: todayStr, totalStudents: studentProfiles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[auto-mark-absent] error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
