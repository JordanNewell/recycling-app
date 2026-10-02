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

AI item identification has three providers (see `src/services/apiService.ts`): Hugging Face Inference API (trash-classification CNN), Nyckel's prefab recycling-identifier function, or a built-in mock that returns random results for development without credentials.

## App Structure

Routes (`src/App.tsx`, react-router-dom v6): `/` home dashboard, `/scan` AI scan + log item, `/history` entry history, `/profile` stats and badges.

```
src/
  pages/          HomePage, ScanPage, HistoryPage, ProfilePage
  components/     UI components (shadcn/ui in components/ui, mobile layout, PWA install prompt)
  contexts/       AuthContext (Supabase session)
  integrations/   Supabase client
  services/       apiService (AI providers), notificationService
supabase/
  migrations/     SQL schema (profiles, recycling_entries, badges, user_badges)
public/           manifest.json, sw.js (service worker), icons
```

## Supabase Tables

- `profiles` — user profiles (points, streaks, totals)
- `recycling_entries` — scanned items with location data
- `badges` — badge definitions with criteria
- `user_badges` — junction table for awarded badges

## Build

```bash
pnpm build        # Development build
pnpm build:prod   # Production build
```

## PWA

The app ships as a progressive web app with offline shell caching, install prompt, and push notification support.
