import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length ? token : null;
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

    // Verify the calling user is an admin
    const { data: userResp, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userResp.user.id)
      .maybeSingle();

    if (roleErr || roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { requestId, action, rejectionReason } = body;

    if (!requestId || !action || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the admin request
    const { data: adminRequest, error: reqErr } = await supabase
      .from("admin_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqErr || !adminRequest) {
      return new Response(JSON.stringify({ error: "Admin request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (adminRequest.status !== "pending") {
      return new Response(JSON.stringify({ error: "Request already processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      // Update request as rejected
      const { error: updateErr } = await supabase
        .from("admin_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: userResp.user.id,
          rejection_reason: rejectionReason || null,
        })
        .eq("id", requestId);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({ success: true, message: "Request rejected" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Approve: Create the user account with admin role
    const tempPassword = adminRequest.temp_password_hash; // This is the actual password, not hash

    // Create user in auth
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: adminRequest.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: adminRequest.name,
        phone: adminRequest.phone,
        birthday: adminRequest.birthday,
        role: "admin",
        terms_accepted: true,
      },
    });

    if (createErr) {
      console.error("[approve-admin] Create user error:", createErr);
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    const { error: profileErr } = await supabase.from("profiles").insert({
      user_id: newUser.user.id,
      name: adminRequest.name,
      email: adminRequest.email,
      phone: adminRequest.phone,
      birthday: adminRequest.birthday,
      terms_accepted: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileErr) {
      console.error("[approve-admin] Profile creation error:", profileErr);
    }

    // Create admin role
    const { error: roleInsertErr } = await supabase.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "admin",
      created_at: new Date().toISOString(),
    });

    if (roleInsertErr) {
      console.error("[approve-admin] Role creation error:", roleInsertErr);
    }

    // Update request as approved
    const { error: updateErr } = await supabase
      .from("admin_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userResp.user.id,
      })
      .eq("id", requestId);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin account created successfully",
        userId: newUser.user.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[approve-admin] Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
