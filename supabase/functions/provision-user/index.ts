// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { email, password, username } = await req.json();
    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ error: "Missing email, password or username" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    // 1) Create or get user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    // If user exists already, fetch it
    let userId = created?.user?.id;
    if (createErr) {
      // Try to sign in to get existing user id
      const { data: signin, error: signErr } = await admin.auth.signInWithPassword({
        email,
        password,
      });
      if (!signErr && signin?.user) {
        userId = signin.user.id;
      } else {
        // Fallback: list users and match by email
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listErr) throw new Error("Database error finding users");
        const found = list.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!found) throw createErr;
        userId = found.id;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unable to resolve user id" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // 2) Upsert profile (service role bypasses RLS)
    const { error: upsertErr } = await admin.from("profiles").upsert({
      id: userId,
      email,
      username,
    });
    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({ ok: true, userId }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && e !== null && "message" in e
      ? (e as any).message
      : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
