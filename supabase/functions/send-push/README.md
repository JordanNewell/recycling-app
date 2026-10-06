# send-push — Web Push sender edge function

Sends Web Push notifications to a user's registered devices (`push_subscriptions` table) using VAPID. Handles badge-unlock webhooks and explicit sends, and deletes dead subscriptions (404/410) automatically.

## One-time setup

1. **Set function secrets** (the private key must never be in the client or repo):

   ```bash
   supabase secrets set \
     VAPID_PUBLIC_KEY=<same value as VITE_VAPID_PUBLIC_KEY> \
     VAPID_PRIVATE_KEY=<private half of the VAPID pair> \
     VAPID_SUBJECT="mailto:you@example.com"
   ```

   Or in the dashboard: Edge Functions → send-push → Secrets.

2. **Deploy the function** (CLI):

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase functions deploy send-push
   ```

   Or create it in the dashboard: Edge Functions → Create → paste `index.ts`.

## Triggers

**Badge unlock (recommended):** run `supabase/migrations/003_badge_push_trigger.sql` in the SQL Editor (replace `<SERVICE_ROLE_KEY>` with your service_role secret first). It creates a pg_net trigger on `user_badges` INSERT that calls this function. Equivalent dashboard route: Database → Webhooks → hook on `user_badges` (INSERT), POST to `https://<project-ref>.supabase.co/functions/v1/send-push` with header `Authorization: Bearer <SERVICE_ROLE_KEY>`.

**Explicit send (server-side jobs, tests):**

```bash
curl -X POST 'https://<project-ref>.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"<uuid>","title":"Streak alert","body":"Scan something today to keep your 5-day streak!","url":"./scan"}'
```

**Self-send (authenticated user JWT):** callers with a normal user JWT may only target their own `user_id` — useful for "test notification" buttons.

## Payload contract

The client service worker (`src/sw.ts`) expects `{ title, body, icon, tag, data: { url } }`. Icon and `data.url` are resolved relative to the service worker scope, so relative values like `icon-192.png` and `./profile` are subpath-safe.
