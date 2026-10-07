# EcoScan — Idea Briefs & Research Log

Companion to `ROADMAP.md`. Each idea below: the claim as pitched, what the
research found, honest verdict, and open research questions. Sources inline.
Updated: 2026-10-06.

---

## 1. Franchise & big-box partnerships (McDonald's, Walmart, Burger King)

**The idea:** get major franchises to join because the app keeps their
facilities cleaner — "guilt them in," plus a certification they'd want.

Research findings:

- Parking-lot litter removal is a real, recurring budget line for commercial
  properties — "exterior porter" contracts (litter/clutter removal + lot and
  sidewalk sweeping) are a standard property-management service category
  ([PPM](https://ppm.us)). The pitch isn't charity; it's *cheaper cleaner lots,
  happier customers, ESG story*.
- Franchise reality: local franchisees, not corporate, control lot operations
  and local spend. Route to market is (a) corporate CSR/ESG for the narrative
  and (b) franchisee associations / co-op ad funds for the money.
- The "guilt" mechanic works only in its positive form: *public litter scores
  + a certification worth having*. Negative-shame selling to brands gets you
  sued, ignored, or both.

Verdict: **valid B2B line, reframe from guilt to ROI + stamp.** A pilot
pitch: "your lot's litter index, the cleanups our users already do for free,
and a path to the Clean Facility mark — cheaper than another sweeping
contract week."

Open questions:

- Typical monthly cost of exterior porter / sweeping contracts per site (get
  3 quotes, build the ROI slide).
- Who signs: franchisee, franchisor brand team, or property manager?
- One warm connection into a franchisee association?

## 2. Coupon rewards economy ("pick up trash at Walmart → % off code")

**The idea:** partners fund rewards — clean up at their location, earn a
discount code.

Research findings:

- **The cautionary tale: Recyclebank.** Points-for-recycling with coupons/
  gift cards, ~400 municipal contracts at peak, Waste Management-backed —
  dead by 2022 after [RTS acquired it in 2019](https://www.wastedive.com/news/recycle-track-systems-acquires-recyclebank/565572/).
  Their own 10-year retrospective: "it takes more than reward points" to
  change behavior; cities dropped it over cost vs. modest gains
  ([Trellis](https://trellis.net), [shutdown thread](https://slickdeals.net/f/15946009-recyclebank-is-dead)).
- **The working model: Bower** (Sweden, ex-"Panta På"). Scan → recycle →
  reward; brands fund the coupons in exchange for engagement and packaging
  traceability; deposits refunded via barcode scan at reverse vending
  ([App Store](https://apps.apple.com)). Rewards are modest — and that's fine,
  because the reward is a nudge, not the reason.

Design implications (steal these):

- **Brands fund every coupon.** We never buy rewards — Recyclebank's
  economics died exactly there.
- Coupons are *location-locked* to the funding partner ("clean a Walmart lot,
  spend it at Walmart") — which is exactly the foot-traffic story that closes
  the B2B sale. A cleaner lot + a redemption visit is an ad with proof.
- Verification is the hard part: GPS + photo timestamp + duplicate/
  re-photograph detection, or the coupon economy gets farmed by fake cleanups.
- Rewards complement the care loop; they don't replace it (Recyclebank's
  core lesson).

Verdict: **yes, but as the B2B closer, not the consumer hook.** Sequence:
care loop first, coupons when a partner asks "what do our customers get?"

Open questions:

- Benchmark: what do brands pay per redemption in adjacent apps (Ibotta/
  Fetch-style economics)?
- Coupon fraud controls used by receipt-scan apps — portable to geo+photo?

## 3. The certification / stamp of approval ("as strong as Got Milk / Heart-Check")

**The idea:** businesses earn a certification or stamp — a mark consumers
recognize on the door.

Research findings:

- Precision matters: **"Got Milk?" was an industry ad campaign** (dairy
  processors buying ads). What you're describing is a **certification mark**
  — the Heart-Check / LEED / Green Seal model — and that's the right one:
  - [Heart-Check (AHA)](https://www.heart.org/en/healthy-living/food-system-strategy/heart-check-certification):
    companies pay product-review + licensing fees per product; it's a major
    nonprofit revenue line — and it draws "pay-to-play" criticism. Credibility
    must be armored from day one.
  - [LEED (USGBC)](https://www.usgbc.org/tools/leed-certification/fees):
    flat registration + certification fees scaled by project size; plus
    training/credential revenue.
  - [Green Seal](https://greenseal.org): sliding-scale fees by company
    revenue (~$3.5–9.5k product certs, ~$1.5k renewals per third-party
    guides).
- Adoption drivers per the research: consumer trust, procurement preference,
  and documented market premiums for certified operators.
- Certification marks are a formal USPTO category with standards + audit
  obligations. You don't start there — you start as a **published-standard
  badge** and formalize once someone displays it.

Verdict: **the strongest idea in the batch — this is the "forcing function"
done right.** A mark worth earning applies market pressure (consumers notice
who has it) without the app ever playing cop. It also monetizes (annual
licensing + audit) and gives brands a *positive* reason to join, which beats
guilt forever.

Sketch: **"Clean Facility Certified"** — standard = sustained litter index
below X (measured by our own verified data — see idea 5), responsive-report
handling, participation in cleanup days. The data flywheel becomes the audit
engine. That's the moat closing shut: our dataset is the only credible way to
award the mark.

Open questions:

- USPTO certification-mark filing cost/timeline (later).
- Standards drafting: who sits on the initial review board (one KAB-affiliate
  voice would anchor credibility)?
- Precedent study: how did Heart-Check get its first 50 licensees?

## 4. Reporting, staff, law enforcement, and "fine territory"

**The idea:** report staff if necessary; law-enforcement and fine territory
if applicable.

Research findings:

- The US precedent is real but narrow: **Don't Mess with Texas "Report a
  Litterer"** — you submit plate, make/model, date, location, litter type;
  TxDOT mails the *registered owner an educational letter*. **No fine, no
  citation** — citizen reports can't legally become penalties
  ([dontmesswithtexas.org](https://dontmesswithtexas.org),
  [TxDOT](https://www.txdot.gov)). Fort Worth routes litter reports through
  311/MyFW ([fortworthtexas.gov](https://www.fortworthtexas.gov)).
- Fines ($500 up to ~$2,000 for illegal dumping in TX) issue only where a
  government enforcement process — officer or camera + human review + legal
  authority — exists.

Hard lines for us (this is the "don't" section):

- **Never report individuals or staff.** Misidentification, defamation,
  harassment of workers, and it incinerates the brand's soul — the whole
    premise is *responsible love*, not surveillance of people.
- **The app reports conditions, not persons.** "This lot has 40 open pins"
  — never "this employee dropped a cup."
- **We are not an enforcement authority and must never pretend to be.**
  Route: verified data → the business first (private, a chance to fix it),
  aggregate open data second (a litter index anyone can read), government
  intake *only* where a real program already accepts it (311-style), and only
  as conditions/aggregates.

Verdict: **the deterrence instinct is right, the enforcement mechanism is
wrong.** Deterrence arrives anyway via visibility: public facility litter
scores + the certification do the "forcing" through market pressure, which is
legal, likable, and scalable. Texas's letter-not-fine model is the ceiling of
individual reporting — and even that required a state DOT.

Open questions:

- Which 311 systems accept photo litter reports with open APIs (pilot
  integration targets)?
- Defamation/misidentification case law for "dirty business" reviews —
  how review platforms (Yelp) structure immunity; mirror their practices.

## 5. The scenario engine ("millions of scenarios — what people should do")

**The idea:** run the combinatorics of item × place × context so the app
always knows the next right step.

This is not a new feature — it is **Track 1 + Track 2 of the roadmap stated
as a data product**: `item × region × context → action`, where coverage grows
with every rule seeded and every correction confirmed. Three payoffs:

- Consumer: the verdict card is the navigation.
- Certification (idea 3): the standard is measured, not self-reported.
- B2B/licensing: "we know what to do with any item anywhere in these N
  regions" is the dataset municipalities and brands buy.

Verdict: **keep — it's the pitch-deck sentence for work already planned.**
"Millions of scenarios" = the size of the decision space we cover; the number
we actually market is *coverage % of real scans answered locally* (already on
the scoreboard).

Open question: packaging the rules DB as a licensable API later (pricing
analog: weather-data APIs).

## 6. Specialized cameras ("NOT LIKE FLOCK")

**The idea:** purpose-built cameras for detecting litter.

Research findings:

- This exists, aimed at enforcement: [LitterCam](https://littercam.ai/) (UK) —
  AI detects litter *thrown from vehicles*, human review, DVLA keeper lookup,
  ~£90–150 penalty; trialed in Maidstone, rolled out in Scotland as "Digital
  Warden," and they also retrofit existing CCTV
  ([modern.scot](https://modern.scot/from-littercam-to-digital-warden-inside-the-company-behind-scotlands-new-roadside-ai-cameras/),
  [Maidstone coverage](https://www.gmal.co.uk/ai-littercam-target-motorists-who-throw-rubbish-from-cars/)).
- Note what that positioning buys them: government contracts — and the exact
  surveillance-adjacent backlash you flagged with Flock.

Verdict: **park it.** Hardware is a capital trap pre-seed, and
plate-and-person detection drags the brand into the surveillance fight right
as the care story is working. The benign software analog (worth a line in the
deck, nothing more): *businesses point their own existing cameras at their
own lots; CV produces a daily litter index — no plates, no faces, no
individuals — feeding the certification.* That's idea 3's audit engine, not a
product. Phone cameras remain our sensor fleet; everyone already carries one.

Open question: litter-index-from-CV model feasibility on fixed-angle video
(a research spike, not a build).

---

## How this slots into the roadmap

- Idea 3 (certification) + idea 1 (franchises) extend **Track P** with a
  private-sector lane alongside city/nonprofit programs — add a `Facility
  Program` org_type and a `litter_index` materialized view per facility.
- Idea 2 (coupons) is the Track P *closing benefit*, built only when a
  partner commits.
- Idea 5 is the existing Track 1/2 told as a data product.
- Idea 4's "route to business first, 311 second" becomes the litter-report
  disposition flow in Track L.
- Idea 6 goes in the "not building (yet)" list with a one-line rationale.

---

## Deep Dive: Recyclebank — the complete post-mortem

Why this company deserves a whole section: it's the closest predecessor to
half of what EcoScan does, it raised roughly **$85–91M across 4+ rounds**
(CB Insights ~$91M; Tracxn $90.1M; Seedtable $85.1M) — and still died. Every
design decision we make should clear the "how does this avoid Recyclebank's
grave" test.

### Timeline

- **2004** — Founded by Ron Gonen and Patrick K. FitzGerald out of Columbia
  ($100k Lang Fund seed). Unit-based recycling rewards for households.
- **2004–2010** — Gonen as CEO; growth era. Pilot data showed participation
  tripling, households going ~10 → ~25 lbs/week.
- **2011** — ~$47M round including **Waste Management** as strategic
  investor (WM planned to offer it to ~20M customers); investors across its
  life included Kleiner Perkins, RRE Ventures, The Westly Group, Physic
  Ventures, ATEL Capital.
- **Peak** — ~400 municipal contracts, **4M+ members**, ~$60M in reward
  value earned in 2013 alone.
- **2009–2019** — Philadelphia Recycling Rewards (rebranded Philacycle
  2017); Clayton, NJ ends its deal Dec 2017 citing "financial
  considerations"; **Philadelphia cancels effective June 30, 2019** citing
  market changes; Waste Connections terminates its partnership in 2019.
- **Oct 23, 2019** — Acquired by **Recycle Track Systems (RTS)**, terms
  undisclosed; RTS promised to "reinvigorate" rewards.
- **By 2022** — Consumer platform effectively dead: site redesigned, logins
  invalidated, points worthless, restricted to a handful of partnering
  municipalities.
- **Aftermath** — Gonen (departed CEO 2010) became NYC Deputy Commissioner
  of Recycling, then co-founded **Closed Loop Partners** — the VC fund now
  investing in exactly this space. The people and capital didn't leave the
  sector; the business model did.

### How the machine actually worked

- RFID tags/barcodes on household carts; the truck's lift arm had a motion-
  triggered RFID reader + weighing — **points per pound** credited to the
  household account.
- Municipal contracts funded the rewards: cities shared recyclable-commodity
  revenue and landfill-diversion savings with the program.
- Points redeemed at a brand-funded catalog of national/local retailers.

### Why it died (ranked)

1. **Verification cost** — hardware on trucks, chipped carts, weighing
   infrastructure: capital-intensive measurement of an *invisible* act.
2. **Attribution failure** — recycling gains in its cities coincided with
   the single-stream collection rollout; the program couldn't prove *its*
   lift, so it couldn't defend its contract at renewal.
3. **Fragile payer** — city budgets funded rewards out of commodity revenue;
   when China's import ban (2017–18) collapsed commodity prices, the
   funding logic collapsed with it.
4. **Channel consolidation** — hauler partners (WM, Waste Connections)
   pulled back; the distribution went with them.
5. **Rewards ≠ retention** — their own 10-year retrospective conceded it
   takes more than points to change behavior.

### The reversal insight (read this twice)

The lesson everyone repeats is "recycling rewards don't work." The truer
lesson: **Recyclebank died of cost structure, not of concept.**

- Their single biggest cost — hardware verification — is our **$0 marginal
  cost**: phone GPS + photo + timestamp.
- Their fatal flaw — no attributable proof of effect — is solved by our
  Track 0 instrumentation baseline *before* features ship.
- Their fragile payer — commodity-indexed city budgets — is avoidable by
  never letting any single payer class fund the loop (see EPR below).
- They rewarded an invisible act (a bin set-out no one sees) with no
  shareable artifact. Our cleanups produce photos, maps, and a facility
  score — visible, ownable, spreadable proof.

### The anti-Recyclebank checklist (taped to the wall)

- [ ] Verify with phones, never hardware.
- [ ] Attribution instrumented from day 0 — baseline before features.
- [ ] We never fund rewards; brands fund, location-locked.
- [ ] ≥3 independent payer classes; zero commodity-price exposure.
- [ ] Reward visible acts with shareable artifacts.
- [ ] Stay capital-light — they raised ~$90M and died of burn, not ideas.

---

## EPR: the tailwind that changes the funding story

Found while researching Recyclebank's era — and it's the biggest strategic
fact in this document:

- **Seven states now have packaging EPR laws**: CA, CO, ME, MN, OR, MD, WA.
- **Circular Action Alliance (CAA)** is the Producer Responsibility
  Organization for CA/CO/MN; Oregon's program is fully operational with
  producers paying PRO membership fees. First producer reports landed 2025;
  **full 2025 supply data due ~May 31, 2026**.
- **California SB 54**: the PRO must pay **$500M/year into the California
  Plastic Pollution Mitigation Fund starting 2027** (through 2037).

Why this matters for EcoScan: brands now have **legal, budgeted
obligations** around packaging end-of-life. Every covered brand needs
(a) evidence of *where its packaging actually leaks* — brand-tagged litter
pins are exactly that dataset, and (b) visible recovery programs — cleanups
and certifications are that story. The "guilt" pitch is dead; the pitch is
now *"we are the measurement layer for obligations you already have."*
PROs like CAA must fund education and cleanup measurement in their program
plans — a vendor surface that didn't exist in Recyclebank's era.

---

## Deep-dive queue (what to research next, in order)

1. **RTS today** — the acquirer's current platform; partner, competitor, or
   acquirer-in-waiting for us too.
2. **Closed Loop Partners** — portfolio map; the capital still circling this
   space (plus Gonen's *The Waste-Free World* for the thesis framing).
3. **Bower unit economics** — the only working consumer recycling-rewards
   model; how do Swedish brands price redemptions?
4. **Litterati 2026 status** — alive, pivoted, or gone? What happened to
   the city-partnership revenue line?
5. **CAA program plans** — what PROs are legally required to fund; the
   vendor surface item by item.
6. **SeeClickFix / 311 contract pricing** — comps for municipal dashboard
   pricing.
7. **KAB affiliate tooling budgets** — what affiliates pay today for
   volunteer reporting portals.
8. **Deposit-return expansion + TOMRA/reverse vending** — adjacent rails
   our barcode scan could ride.
