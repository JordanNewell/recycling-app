// EcoScan push sender — Supabase Edge Function (Deno)
//
// Sends Web Push notifications to a user's registered devices
// (rows in public.push_subscriptions) via the web-push VAPID protocol.
//
// Two authorization modes:
//  - Service role (Authorization: Bearer <SERVICE_ROLE_KEY>): may target any
//    user_id. This is what Database Webhooks / cron use.
//  - Authenticated user JWT: may only send to themselves.
//
// Two payload modes:
//  1. Explicit: { "user_id": "...", "title": "...", "body": "...", "url": "./profile", "tag": "badge" }
//  2. Database webhook on user_badges INSERT (Supabase webhook body shape):
//     { "type": "INSERT", "table": "user_badges", "record": { "user_id": "...", "badge_id": "..." } }
//     -> enriches with the badge name and sends a "Badge unlocked" notification.
//
// Secrets (supabase secrets set or dashboard -> Edge Functions -> Secrets):
//  - VAPID_PUBLIC_KEY   same value as the client VITE_VAPID_PUBLIC_KEY
//  - VAPID_PRIVATE_KEY  the private half of the pair (NEVER in the client)
//  - VAPID_SUBJECT      contact for the push service, e.g. "mailto:you@example.com"
//
// Dead subscriptions (push service answers 404/410) are deleted automatically.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "POST only" });
  }

  // Service-role detection by JWT claims rather than string equality: the
  // platform gateway (verify_jwt) has already established the token is
  // genuinely signed by this project, so the payload's role claim is
  // trustworthy. String equality breaks when signing keys are rotated
  // (env var and api-keys endpoint can carry differently-signed JWTs).
  const PROJECT_REF = "cwruvcrjlnafgksssxpi";
  function isServiceRole(header: string): boolean {
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return false;
    const parts = match[1].split(".");
    if (parts.length !== 3) return false;
    try {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      return payload?.role === "service_role" && payload?.ref === PROJECT_REF;
    } catch {
      return false;
    }
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ??
    "mailto:ecoscan@example.com";
  if (!vapidPublicKey || !vapidPrivateKey) {
    return json(500, {
      error:
      "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY function secrets.",
    });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const isService = isServiceRole(authHeader);

  // Resolve the caller. Service role may target anyone; a user JWT may only
  // target themselves.
  let callerId: string | null = null;
  if (!isService) {
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      },
    );
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return json(401, { error: "Unauthorized" });
    }
    callerId = data.user.id;
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  // Admin client for subscription reads/cleanup (bypasses RLS in service
  // mode; in self mode the target is the caller anyway).
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let targetUserId: string | undefined;
  let payload: Record<string, unknown>;

  const isBadgeWebhook = body.type === "INSERT" &&
    body.table === "user_badges" && !!body.record;
  if (isBadgeWebhook) {
    const record = body.record as Record<string, unknown>;
    targetUserId = typeof record.user_id === "string" ? record.user_id : undefined;
    const badgeId = typeof record.badge_id === "string" ? record.badge_id : undefined;
    if (!targetUserId || !badgeId) {
      return json(400, { error: "Webhook record missing user_id or badge_id" });
    }
    let badgeName = "a new badge";
    const { data: badge } = await admin
      .from("badges")
      .select("name")
      .eq("id", badgeId)
      .maybeSingle();
    if (badge?.name) badgeName = badge.name;
    payload = {
      title: "Badge unlocked!",
      body: `You just earned ${badgeName}. Keep the streak going!`,
      icon: "icon-192.png",
      tag: `badge-${badgeId}`,
      data: { url: "./profile", type: "badge" },
    };
  } else {
    targetUserId = typeof body.user_id === "string" ? body.user_id : undefined;
    if (!isService && targetUserId !== callerId) {
      return json(403, {
        error: "Users may only send push notifications to themselves",
      });
    }
    if (!targetUserId) {
      return json(400, { error: "user_id is required" });
    }
    payload = {
      title: typeof body.title === "string" && body.title
        ? body.title
        : "EcoScan",
      body: typeof body.body === "string" ? body.body : "",
      icon: "icon-192.png",
      tag: typeof body.tag === "string" ? body.tag : undefined,
      data: { url: typeof body.url === "string" ? body.url : "./", type: "generic" },
    };
  }

  const { data: subs, error: subsError } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", targetUserId);

  if (subsError) {
    return json(500, { error: subsError.message });
  }
  if (!subs || subs.length === 0) {
    return json(200, { sent: 0, removed: 0, note: "No registered devices" });
  }

  let sent = 0;
  let removed = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq(
            "id",
            sub.id,
          );
          removed++;
        } else {
          console.error(`Push to ${sub.endpoint} failed:`, err);
        }
      }
    }),
  );

  return json(200, { sent, removed, total: subs.length });
});
