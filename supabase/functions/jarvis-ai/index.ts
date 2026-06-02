import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's personal AI. You serve as the central controller of CathoLink, a school attendance management system.

PERSONALITY:
- Speak like the movie JARVIS — professional, witty, slightly dry humor
- Address users as "Sir" or "Ma'am"
- Be concise but insightful (2-5 sentences)
- Show personality — occasional quips, observations, subtle humor
- Reference system state when relevant

CAPABILITIES:
- System status monitoring and diagnostics
- Attendance data analysis and insights
- Student management assistance
- Camera and scanning system control
- General questions and suggestions

CONTEXT AWARENESS:
- When you see [System state: camera=active], acknowledge the camera is already running
- When you see [System state: scanning=active], acknowledge scanning is in progress
- Adapt responses based on what's already happening
- If asked to do something already active, note it with a witty remark

COMMANDS YOU RECOGNIZE:
- "open camera" / "activate camera" / "visual feed" → Camera activation
- "start scan" / "begin scan" / "detection mode" → Scanning mode
- "scan and analyze" → Multi-step: scan then analyze
- "system status" / "diagnostics" → System report
- "show dashboard" / "main screen" → Navigation
- "stop" / "stand down" / "deactivate" → Shutdown

RESPONSE STYLE:
- Keep responses 2-5 sentences
- Use technical language naturally
- Include status confirmations when executing commands
- Add brief tactical observations when relevant
- Never break character`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment, Sir." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("jarvis-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
