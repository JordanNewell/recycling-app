# EcoScan - Recycling Tracker PWA

Track your recycling, earn points, unlock badges, and see your environmental impact.

**Live demo:** https://jordannewell.github.io/recycling-app/

## Tech Stack

- **React 18** + TypeScript + Vite
- **Tailwind CSS** + shadcn/ui components
- **Framer Motion** for animations
- **Supabase** for auth, database, and realtime
- **Hugging Face Inference API** for AI item identification

## Getting Started

```bash
# Install dependencies
pnpm install

# Create .env from example
cp .env.example .env

# Start dev server
pnpm dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_AI_PROVIDER` | `huggingface` \| `nyckel` \| `mock` (default: `mock`) |
| `VITE_HF_API_TOKEN` | Hugging Face API token (for `huggingface` provider) |
| `VITE_NYCKEL_API_KEY` | Nyckel API key (for `nyckel` provider) |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID public key — enables push subscription after notification permission is granted |
| `VITE_BASE` | Deploy subpath (CI sets `/recycling-app/` for GitHub Pages; unset locally) |

AI item identification has three providers (see `src/services/apiService.ts`): Hugging Face Inference API (trash-classification CNN), Nyckel's prefab recycling-identifier function, or a built-in mock that returns random results for development without credentials.

## App Structure

Routes (`src/App.tsx`, react-router-dom v6): `/` home dashboard, `/scan` AI scan + log item, `/history` entry history, `/profile` stats and badges. The shell (`src/components/MobileLayout.tsx`) is responsive: bottom tab bar + FAB on mobile, persistent sidebar nav at `md+`.

```
src/
  pages/          HomePage, ScanPage, HistoryPage, ProfilePage
  components/     UI components (shadcn/ui in components/ui), mobile layout,
                  desktop/SidebarNavigation, PWA install prompt
  contexts/       AuthContext (Supabase session, offline-queue sync)
  integrations/   Supabase client
  services/       apiService (AI providers), notificationService,
                  offlineQueue (IndexedDB), pushSubscription (Web Push)
  sw.ts           Service worker (vite-plugin-pwa injectManifest)
supabase/
  migrations/     SQL schema (profiles, recycling_entries, badges, user_badges,
                  push_subscriptions)
public/           icons
```

## Supabase Tables

- `profiles` — user profiles (points, streaks, totals)
- `recycling_entries` — scanned items with location data
- `badges` — badge definitions with criteria
- `user_badges` — junction table for awarded badges
- `push_subscriptions` — Web Push endpoints per user (migration `002`)

## Build

```bash
pnpm build        # Development build
pnpm build:prod   # Production build
```

## PWA

Built with `vite-plugin-pwa` (injectManifest strategy — `src/sw.ts`):

- **Precaching** — all static assets cached at install; navigation requests fall back to the cached app shell. Live-data hosts (Supabase, AI providers) are never cached.
- **Offline scan queue** — scans confirmed while offline are stored in IndexedDB (`src/services/offlineQueue.ts`) and replayed through the normal save path when connectivity returns (on the `online` event or next app load). ScanPage shows a "waiting to sync" count.
- **Web Push** — after the user grants notification permission, the browser push subscription is stored in `push_subscriptions` (`src/services/pushSubscription.ts`). Sending pushes from the server (Supabase edge function + the private VAPID key via `web-push`) is the remaining follow-up.
- Manifest (with maskable icons + app shortcuts) is generated at build time; the SW keeps the `/sw.js` URL so previously installed clients update in place.

Setup for push: generate keys with `npx web-push generate-vapid-keys`, put the public key in `VITE_VAPID_PUBLIC_KEY` (local `.env` and the repo's Actions variables) and run `supabase/migrations/002_push_subscriptions.sql`.
