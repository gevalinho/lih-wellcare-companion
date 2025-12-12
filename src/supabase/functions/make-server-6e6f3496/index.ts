import * as kv from "./kv_store.ts";

// === Simple CORS handler ===
function corsHeaders() {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE",
  });
}

async function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  return null;
}

// === Supabase client helper ===
const getSupabaseClient = (serviceRole = false) => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRole
      ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      : Deno.env.get("SUPABASE_ANON_KEY")!
  );
};

// === Auth check ===
async function requireAuth(req: Request) {
  const header = req.headers.get("Authorization") || "";
  const token = header.split(" ")[1];
  if (!token) return null;
  try {
    const { data: { user } } = await getSupabaseClient().auth.getUser(token);
    return user?.id || null;
  } catch {
    return null;
  }
}

// === OpenAI key helper ===
function getOpenAIKey() {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return key;
}

// === Main Serve ===
Deno.serve(async (req) => {
  const preflight = await handleCors(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const path = url.pathname.replace("/make-server-6e6f3496", "");
  const headers = corsHeaders();

  // === Health ===
  if (path === "/health" && req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), { headers });
  }

  // === SIGNUP ===
  if (path === "/auth/signup" && req.method === "POST") {
    try {
      const body = await req.json();
      const { email, password, name, role, profileData } = body;
      if (!email || !password || !name || !role) {
        return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers });
      }
      const supa = getSupabaseClient(true);
      const { data, error } = await supa.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { name, role },
      });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });

      const userId = data.user.id;
      const profile = { id: userId, email, name, role, createdAt: new Date().toISOString(), ...profileData };
      await kv.set(`user:${userId}`, profile);
      await kv.set(`user:email:${email}`, userId);

      return new Response(JSON.stringify({ success: true, userId }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  // === GET PROFILE ===
  if (path === "/auth/profile" && req.method === "GET") {
    const userId = await requireAuth(req);
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    const profile = await kv.get(`user:${userId}`);
    return new Response(JSON.stringify({ profile }), { headers });
  }

  // === ADD VITAL ===
  if (path === "/vitals" && req.method === "POST") {
    const userId = await requireAuth(req);
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    const { systolic, diastolic, pulse, notes, timestamp } = await req.json();
    if (!systolic || !diastolic) {
      return new Response(JSON.stringify({ error: "Missing BP" }), { status: 400, headers });
    }

    const vitalId = `vital:${userId}:${Date.now()}`;
    const vital = {
      id: vitalId, userId,
      systolic: parseInt(systolic), diastolic: parseInt(diastolic),
      pulse: pulse ? parseInt(pulse) : null,
      notes: notes || "", timestamp: timestamp || new Date().toISOString(), createdAt: new Date().toISOString()
    };
    await kv.set(vitalId, vital);

    return new Response(JSON.stringify({ success: true, vital }), { headers });
  }

  // === GET VITALS ===
  if (path === "/vitals" && req.method === "GET") {
    const userId = await requireAuth(req);
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    const vitals = await kv.getByPrefix(`vital:${userId}:`);
    vitals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return new Response(JSON.stringify({ vitals }), { headers });
  }

  // === AI CHAT ===
  if (path === "/ai/chat" && req.method === "POST") {
    const userId = await requireAuth(req);
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    const { message } = await req.json();
    if (!message) return new Response(JSON.stringify({ error: "Message required" }), { status: 400, headers });

    const openaiKey = getOpenAIKey();
    const out = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful health assistant." },
          { role: "user", content: message },
        ],
        max_tokens: 1000,
      }),
    });
    const data = await out.json();
    const resp = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ success: true, response: resp }), { headers });
  }

  // === 404 fallback ===
  return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers });
});
