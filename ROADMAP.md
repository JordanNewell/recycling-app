# EcoScan — "Waze for the Waste Stream" Track

The pitch: one camera, two truths. People photograph **their own items** at the
bin and **other people's trash** on the sidewalk, in parking lots, in creeks.
Those photos build a live map of what litters a community and what its rules
actually accept — and the people who naturally want to clean and recycle are
the ones who keep both current. Cleanup programs that already exist (city,
county, state, nonprofit, corporate) plug into the same firehose.

Waze translation:

| Waze | EcoScan |
|---|---|
| Accident / hazard reports | Litter pins (photo + material + brand + location) |
| Map editors | Rule correctors + cleaners |
| Navigation | "What do I do with *this*, *here*?" — local verdict |
| The living map | Two datasets: litter hotspots + local recyclability rules |

The motivational core isn't points-greed — it's what we're calling the
**responsible-love method**: care for your block, visible contribution, being
counted among the people who pick things up. Every mechanic below is designed
and measured against that.

---

## The three loops

1. **Personal habit (shipped)** — scan my item, log it, streak, points.
2. **Civic sensing (new)** — photograph litter anywhere, pin it, optionally
   clean it, see the neighborhood map. "Other people's trash" mode.
3. **Programs (new)** — adopt-a-street, city cleanup days, KAB affiliates,
   corporate CSR events. We **attach to programs already running** — their
   volunteers, their reporting requirements, our app. Never rebuild their
   signup; make their existing mandated reporting the easiest thing in the day.

## Ground truth: what exists in the codebase today

- `recycling_entries` already stores `latitude`/`longitude` per scan —
  the geo spine for litter pins too.
- AI providers (`apiService.ts`) classify material with confidence — reusable
  for litter photos; brand detection is a later model add.
- Web Push end-to-end (`send-push`) — cleanup-day and digest channel.
- Streaks/points/badges — the economy that Track L extends to contribution.

## Precedents and why we're different

- **Litterati** — proved photo-tagged litter mapping works at global scale
  (6M+ pieces cleaned) and sells "City Fingerprint" litter-composition
  analysis to municipalities; brand-engagement angle. The lesson to steal:
  attach to budgeted programs early — consumer-only litter apps stall.
- **Ocean Conservancy's Clean Swell, NOAA's Marine Debris Tracker** —
  owned by institutions, event-centric, not habit apps with local rules.
- **SeeClickFix / 311 apps** — the revenue precedent: municipalities pay for
  civic-report intake and dashboards.
- **Keep America Beautiful network** — 730+ community affiliates running
  cleanups; adopt-a-street programs (e.g., Keep Austin Beautiful's) already
  require volunteers to adopt a segment and submit periodic cleanup reports
  through an app/portal to stay active. That is pre-existing recurring
  behavior with a reporting obligation and no great tool.
- **Our difference:** nobody combines a daily habit loop + local-rules truth +
  a public litter/cleanup layer + program attachment. Each incumbent does one.

---

## Track 0 — Instrumentation (measure before building)

Unchanged in principle: `posthog-js` behind `src/services/analytics.ts`,
identify by Supabase uid. The event dictionary grows to cover both modes:

| Event | Properties | Answers |
|---|---|---|
| `scan_started` | mode (my_item / found_litter), source | intent by mode |
| `ai_result` | provider, material, confidence, latency_ms | classifier quality |
| `scan_confirmed` | mode, material, had_local_verdict, region_id | activation + coverage |
| `litter_reported` | material, brand?, location_context | civic sensing volume |
| `litter_claimed` / `litter_cleaned` | self_cleaned, minutes? | cleanup conversion |
| `verdict_rated` / `correction_submitted` / `correction_vote` | (as before) | rules flywheel |
| `program_joined` / `program_report_filed` | program_id, org_type | B2B2C traction |
| `push_received` / `push_clicked` | kind | channel value |

**Done when:** activation and D7/W4 retention are answerable per mode, and
"of users who filed one litter report, what fraction filed another?" is a
one-click chart.
**Effort:** ~1 weekend.

## Track 1 — The local verdict (the "navigation" layer)

Unchanged from prior version — `regions` + `region_rules` tables, reverse
geocode scan coordinates to a region, verdict card reads "Accepted curbside
in {Region} — rinse, no lids", seed only the regions where pilot users live,
demand-pulled expansion. Full schema and gates in git history if needed; the
tables:

```sql
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null, region_type text not null, country text default 'US',
  admin1 text, centroid_lat numeric(9,6), centroid_lng numeric(9,6)
);
create table public.region_rules (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  material text not null,
  status text not null check (status in ('accepted','conditional','not_accepted','unknown')),
  notes text,
  source text not null default 'seed',   -- seed | official | crowd
  verified_at timestamptz,
  unique (region_id, material)
);
```

**Gate:** ≥60% of pilot-region scans carry a local verdict; helpful-rating
beats the generic card. **Effort:** ~2–3 weekends.

## Track 2 — Corrections flywheel (shared spine)

Unchanged: "Report Incorrect" with the two-way first tap (wrong material vs.
wrong rule), "was this right?" micro-votes, K-confirmations promote a rule
with provenance, conflicts flag for review. Same two failure modes, now
serving both loops — a litter pin's material is correctable exactly like a
home scan's. **Gate:** corrections-per-100-scans trending up; first crowd
rule update ships to other users. **Effort:** ~2 weekends.

## Track L — The litter loop ("other people's trash")

**Hypothesis:** care-motivated users will photograph and clean public litter
at rates that make the litter map live — and they retain like Waze editors.

Build:

- **Two-mode camera on ScanPage:** the filter the product is organized
  around — `My item` | `Found litter`. Found-litter flow: snap → AI tags
  material (brand later) → pin on map → choose `just reporting` or
  `cleaning it up` → after-photo closes the loop.
- Migration `005_litter_reports.sql`:

```sql
create table public.litter_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  photo_url text,                        -- private storage bucket
  material text not null,                -- AI-tagged, correctable via Track 2
  brand text,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  location_context text,                 -- sidewalk | parking_lot | park | creek | road_side
  status text not null default 'open',   -- open | claimed | cleaned | flagged
  claimed_by uuid references public.profiles(id),
  cleaned_at timestamptz,
  after_photo_url text,
  program_id uuid references public.programs(id),
  created_at timestamptz default now()
);
create index idx_litter_geo on public.litter_reports(latitude, longitude);
create index idx_litter_status on public.litter_reports(status);
```

- **Contribution economy:** cleaning a pin earns more than logging your own
  item. New badges: "Block Hero", "100 Pieces", "Parking Lot Sweep". The
  profile statement becomes "You've removed 143 pieces from your
  neighborhood."
- **Heat map view** on HomePage: open pins near you, recently cleaned
  streaks. This is the shareable screen.
- **Safety and legality baked into UX, not buried:**
  - *Report, don't touch* guidance for sharps/hazmat/needles — `flagged`
    status routes those to the attached program or city, never to volunteers.
  - Photograph from where you lawfully stand (public right-of-way); private
    lots = report from the sidewalk, no trespassing.
  - No identifiable faces or license plates — in-app crop prompt + policy;
    photos land in a private bucket, published only as aggregate/map data.
  - PPE basics surfaced before a first cleanup action.

**Gate:** pins-per-week sustained across a month in the pilot area; cleanup
completion rate (open → cleaned) above ~30%; `litter_reported` users' D7
versus `scan_confirmed`-only users.
**Effort:** ~2–3 weekends.
**Proof point:** the care loop turns — "people who love a place keep its map
current" with numbers behind it.

## Track P — Programs: attach, don't replace

**Hypothesis:** programs with budgets and mandated reporting (adopt-a-street,
KAB affiliates, municipal cleanup days, corporate CSR events) will adopt the
app as their reporting tool — giving us distribution and them dashboards.

Build:

- Migration `006_programs.sql`:

```sql
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- "Adopt-a-Street Springfield"
  org_type text not null,                -- city | county | state | nonprofit | corporate
  area_name text,
  join_url text,                         -- THEIR existing signup; we link out
  contact_email text,
  verified boolean default false,
  created_at timestamptz default now()
);
create table public.program_members (
  program_id uuid references public.programs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'volunteer',         -- volunteer | coordinator
  created_at timestamptz default now(),
  primary key (program_id, user_id)
);
```

- **Member flow:** join a program in-app (linking to their existing signup),
  then every cleanup files through our litter flow tagged with the program —
  which is exactly the recurring report adopt-a-street members already owe.
- **Coordinator dashboard (the paid thing later, free for pilots):** pins and
  cleanups in their area, volunteer hours (grant reporting they must do
  anyway), event-day check-ins.
- **Revenue lines this opens:** municipal/program dashboards (SeeClickFix
  precedent), CSR volunteer-engagement reports for corporate events, and —
  carefully, in aggregate only — brand-composition data (Litterati's
  City-Fingerprint playbook).
- **Seed the directory by hand:** 20 real programs in the pilot region,
  `verified: true`, emails sent. One yes beats a hundred cold listings.

**Gate:** one program files reports through the app for a full month;
program-attached user retention visibly exceeds unattached.
**Effort:** ~2 weekends + outreach that never stops.

---

## The scoreboard

| Metric | Why it matters |
|---|---|
| Pins per week (sustained) | civic-sensing flywheel health |
| Cleanup completion rate, median time-to-cleaned | the map is *live*, not a graveyard |
| Weekly verified local verdicts served | value delivered, loop 1 |
| Corrections per 100 scans | rules flywheel engagement |
| D7/W4: contributors vs consumers, program-attached vs not | the moat is the people |
| Programs filing monthly through the app | B2B2C traction |
| Regions with crowd-verified rules / brand-tagged pins | dataset size vs any competitor |

## Explicitly NOT building (yet)

Native wrappers, rewards marketplace, carbon credits, gamified county-vs-county
leaderboards, brand-shaming features (aggregate data only), AI brand detection
before the material loop is proven.

## Sequencing rule

Track 0 always first — and now it decides the wedge order too:

- If the first 50 users skew **care-motivated** (they want the litter loop):
  build L → P → 1 → 2.
- If they skew **utility-motivated** (is this recyclable here?): build
  1 → 2 → L → P.

Either way P starts as outreach in parallel from day one — Litterati's
trajectory says consumer-only litter apps stall; programs with budgets are the
distribution. And if Track 0 shows W1 retention under ~10% in *both* modes,
fix the core loop before building any flywheel on top of it.
