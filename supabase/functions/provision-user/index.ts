import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "student" | "super_admin";

type UserMeta = {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  role?: AppRole | string;
  section?: string | null;
  adviser_name?: string | null;
  parent_guardian_name?: string | null;
  parent_number?: string | null;
  terms_accepted?: boolean;
};

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length ? token : null;
}

function normalizeRole(role?: string | null): AppRole | null {
  if (role === "super_admin" || role === "admin" || role === "student") {
    return role;
  }

  return null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = getBearerToken(req);
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userResp, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userResp.user;
    const meta = (user.user_metadata ?? {}) as UserMeta;
    const resolvedEmail = user.email ?? meta.email ?? "";

    if (!resolvedEmail) {
      return new Response(JSON.stringify({ error: "User email is missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingProfiles, error: profilesReadError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (profilesReadError) throw profilesReadError;

    const { data: existingRoles, error: rolesReadError } = await supabase
      .from("user_roles")
      .select("id, role, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (rolesReadError) throw rolesReadError;

    const currentProfile = existingProfiles?.[0] ?? null;
    const requestedRole = normalizeRole(meta.role);
    const currentRole = normalizeRole(existingRoles?.[0]?.role ?? null);
    const resolvedRole: AppRole = requestedRole ?? currentRole ?? "student";

    const profilePayload = {
      user_id: user.id,
      name: meta.name ?? currentProfile?.name ?? resolvedEmail,
      email: resolvedEmail,
      phone: meta.phone ?? currentProfile?.phone ?? null,
      birthday: meta.birthday ?? currentProfile?.birthday ?? null,
      adviser_name: meta.adviser_name ?? currentProfile?.adviser_name ?? null,
      parent_guardian_name: meta.parent_guardian_name ?? currentProfile?.parent_guardian_name ?? null,
      parent_number: meta.parent_number ?? currentProfile?.parent_number ?? null,
      terms_accepted: meta.terms_accepted ?? currentProfile?.terms_accepted ?? false,
      section: resolvedRole === "student" ? meta.section ?? currentProfile?.section ?? null : null,
      updated_at: new Date().toISOString(),
    };

    let profileAction: "inserted" | "updated" = "inserted";

    if (existingProfiles && existingProfiles.length > 0) {
      const keep = existingProfiles[0];
      const extras = existingProfiles.slice(1);

      if (extras.length) {
        await supabase.from("profiles").delete().in(
          "id",
          extras.map((profile) => profile.id)
        );
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("id", keep.id);

      if (profileUpdateError) throw profileUpdateError;
      profileAction = "updated";
    } else {
      const { error: profileInsertError } = await supabase.from("profiles").insert({
        ...profilePayload,
        created_at: new Date().toISOString(),
      });

      if (profileInsertError) throw profileInsertError;
    }

    let roleAction: "inserted" | "updated" = "inserted";

    if (existingRoles && existingRoles.length > 0) {
      const keep = existingRoles[0];
      const extras = existingRoles.slice(1);

      if (extras.length) {
        await supabase.from("user_roles").delete().in(
          "id",
          extras.map((roleRow) => roleRow.id)
        );
      }

      const { error: roleUpdateError } = await supabase
        .from("user_roles")
        .update({ role: resolvedRole })
        .eq("id", keep.id);

      if (roleUpdateError) throw roleUpdateError;
      roleAction = "updated";
    } else {
      const { error: roleInsertError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: resolvedRole,
        created_at: new Date().toISOString(),
      });

      if (roleInsertError) throw roleInsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.id,
        profile: profileAction,
        role: roleAction,
        resolvedRole,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[provision-user] Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
