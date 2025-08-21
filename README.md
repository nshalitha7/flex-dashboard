# Flex – Reviews Dashboard

A dashboard to manage guest reviews across sources (Hostaway, Google Places), with a public property page that only displays **manager-approved** reviews.

---

## Key Features

- **Manager Dashboard**
  - Per property performance (avg rating, trend chart)
  - Filters: rating, category (with min), channel, type, date range, text search
  - Sorting: newest, oldest, rating desc
  - Quick KPI bar (listings, avg rating, approved, loaded)
  - Infinite “Load more” pagination (scales gracefully)
  - Approve reviews for website display (optimistic + server persisted)

- **Public Property Page**
  - `/properties/[listingId]` shows **only approved** reviews in a simple layout consistent with Flex’s property detail style.

- **APIs**
  - `GET /api/reviews/hostaway` – normalized Hostaway reviews via API (falls back to mock)
  - `GET /api/reviews/google` – normalized Google Places reviews
  - `GET|POST /api/approvals` – persist manager approvals (Vercel KV → file → memory)

- **Robust data handling**
  - Normalization, filtering, sorting, and server side pagination
  - Defensive Zod parsing for Hostaway data
  - Clear separation of domain types & services

---

## Tech Stack

- **Next.js 15 (App Router)**, TypeScript
- **React 19**, SWR / SWR Infinite
- **Tailwind CSS v4**, minimal, clean UI
- **Recharts** for trends
- **Zod** for input/JSON validation
- **Node 22** (works with 20+, uses native `fetch`)
- **Storage**: Vercel KV (preferred in prod) → filesystem `.data/approvals.json` (dev) → in-memory (fallback)

---

## Quickstart

### 1) Prerequisites

- Node **v22.18.0**
- npm 10+

### 2) Clone & install

```bash
git clone https://github.com/nshalitha7/flex-dashboard.git
cd flex-dashboard
npm install
```

### 3) Configure environment

Create `.env.local`:

```bash
# Reviews storage (choose one)
# APPROVALS_STORE can be: 'kv' | 'file' | 'memory'
APPROVALS_STORE=file

# Hostaway API credentials (falls back to mock data if absent)
HOSTAWAY_API_KEY={ACCOUNT_ID}
HOSTAWAY_ACCOUNT_ID={API_KEY}

# For Vercel KV (production), set these in Vercel’s Project Settings:
# KV_REST_API_URL=
# KV_REST_API_TOKEN=

# Google Places
# GOOGLE_API_KEY={SERVER_SIDE_KEY}
# GOOGLE_PLACE_ID={DEFAULT_PLACE_ID}
```

> **Local dev:** `APPROVALS_STORE=file` persists approvals to `./.data/approvals.json`.

### 4) Run

```bash
npm run dev
# http://localhost:3000/
```

For deployed demo visit **https://flex-dashboard-zeta.vercel.app**.

### 5) Test & Lint

```bash
npm test          # run Jest tests
npm run lint      # run ESLint
npm run typecheck # verify TypeScript types
```

---

## How to use

1. Open **`/dashboard`**.
2. Use filters (rating, channel, date range, type, text search) to refine.
3. Expand per listing sections:

- View avg rating and trend chart.
- Toggle **Show on review page** to approve a review (persists to server).

4. Click **View public page** to see `/properties/[listingId]` with **approved only** reviews.

---

## Project Structure (high level)

```
src/
  app/
    api/
      approvals/route.ts          # GET/POST approvals
      reviews/
        hostaway/route.ts         # Hostaway API → normalized (fallback to mock)
        google/route.ts           # Google Places → normalized
    dashboard/page.tsx            # Manager dashboard (SWR Infinite)
    properties/[listingId]/page.tsx  # Public property page (approved only)
  components/
    DashboardFilters.tsx
    ListingGroup.tsx
    ReviewCard.tsx
    TrendChart.tsx
  domain/
    reviews/                      # Core types + normalization + filters/sorts
      index.ts
      types.ts
      normalize.ts
      hostaway.ts
      google.ts
  lib/
    approvals-store.ts            # KV → file → memory store logic
    fetcher.ts
    format.ts
    paginate.ts
```

---

## 🔌 API Reference

All endpoints return JSON with this paging shape:

```json
{
  "status": "success",
  "total": 123,         // items across all pages after filters
  "page": 1,
  "perPage": 20,
  "count": 20,          // items in this page
  "result": [ ... ]     // array of normalized reviews
}
```

### Query parameters (shared)

- `minRating` (number, 0–10)
- `channel` (`hostaway` | `airbnb` | `booking` | `google`)
- `type` (`guest` | `guest-to-host` | `host-to-guest`)
- `listingName` (string contains)
- `search` (string contains in content/author)
- `from`, `to` (ISO `YYYY-MM-DD` date bounds, inclusive)
- `sort` (`newest` | `oldest` | `rating`)
- `page` (1 based), `perPage` (default 20)

> **Hostaway only:** category filter in dashboard is applied on normalized categories.  
> **Google reviews:** don’t have fine grained categories; those fields will be empty.

### `GET /api/reviews/hostaway`

Returns normalized reviews from the Hostaway API using an access token.
Falls back to bundled mock data if the API is unavailable or returns no reviews.

### `GET /api/reviews/google`

Returns normalized reviews from the **Google Places** API (if configured).  
`placeId` query param selects the Google Place. If omitted, the server uses `GOOGLE_PLACE_ID`.

### `GET /api/approvals`

- Without params: return **all** approval records.
- With `listingId`: return only that listing’s approvals.

### `POST /api/approvals`

Body:

```json
{
  "listingId": 1001,
  "reviewId": "7453",
  "approved": true
}
```

Creates/updates an approval record:

```json
{
  "status": "success",
  "result": {
    "listingId": 1001,
    "reviewId": "7453",
    "approved": true,
    "approvedAt": "2025-08-20T18:55:35.402Z"
  }
}
```

For more on Google review integration see [docs/google-reviews.md](docs/google-reviews.md).

---

## Normalized Review Model (frontend/backend)

```ts
type CategoryScore = { category: string; rating: number | null };

type NormalizedReview = {
  id: string; // unique across data source
  listingId: number | null;
  listingName: string;
  channel: 'hostaway' | 'airbnb' | 'booking' | 'google';
  type: 'guest' | 'guest-to-host' | 'host-to-guest';
  rating: number | null; // 0–10 (normalized)
  content: string; // review text
  authorName?: string | null;
  submittedAt?: string | null; // ISO string
  categories?: CategoryScore[]; // hostaway derived; google empty
  sourceUrl?: string; // optional, e.g. googleMapsUri
};
```

---

## Known limitations

- Category filter doesn’t apply to Google (no category breakdown in Places reviews).
- Google Places returns **few** reviews, for complete history use Google Business Profile APIs.
- Hostaway sandbox has no reviews at the moment, mock data is used when the API fails or returns none.

---

## Sample cURL

```bash
# Hostaway
curl "http://localhost:3000/api/reviews/hostaway?sort=newest&perPage=10"

# Google (placeId query param)
curl "http://localhost:3000/api/reviews/google?placeId=YOUR_PLACE_ID"

# Approvals
curl "http://localhost:3000/api/approvals"
curl -X POST "http://localhost:3000/api/approvals"   -H "Content-Type: application/json"   -d '{"listingId":1001,"reviewId":"7453","approved":true}'
```

---

## Google Reviews – Exploration & Findings

**What’s feasible now**

- **Google Places (Place Details “New”)** returns limited, curated reviews, good for basic integration and a demo.
- **Limitations**: Google controls selection & order; no API pagination; typically only a handful are returned.

**Path to full coverage**

- If Flex Living **owns/controls** each property’s Google Business Profile, use the **GBP APIs** to list all reviews. Requires OAuth and verified locations. This is the production path for comprehensive coverage.

**Policy considerations**

- Keep the Places API key server side.
- Show attribution (we include `sourceUrl` to Google Maps where available).
- Respect caching terms (generally ≤ 30 days for content; Place IDs are ok to store).
- Rate limit and add short term caching server side in production.

---

## Evaluation criteria achieved

- **Handling & normalization**: real world JSON → strongly typed, normalized model across sources. defensive parsing.
- **Code clarity & structure**: domain separation, small composable route handlers, clear types, utilities.
- **UX/UI**: modern, clean dashboard. obvious KPIs, sticky filters, per listing grouping, trends and category insights, infinite load.
- **Insightfulness**: trend chart + category averages surface recurring issues quickly. channel filter isolates sources.
- **Problem-solving**: pragmatic Google integration with documented limits. production notes (GBP, KV, caching).

---

## Live Demo

A live deployment is available at **https://flex-dashboard-zeta.vercel.app**.
