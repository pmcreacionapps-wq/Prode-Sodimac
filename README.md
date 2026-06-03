# 🏆 Next World Cup Prode
### FIFA World Cup 2026 — Prediction App for Next English Institute

A full-stack prediction ("prode") web app built with Next.js 15, Supabase, and Prisma. Mobile-first, premium minimalist design.

---

## Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Database:** Supabase Postgres + Prisma ORM
- **Auth:** Supabase Auth (email/password)
- **Styling:** TailwindCSS + shadcn/ui + Framer Motion
- **Hosting:** Vercel
- **Scores API:** API-Football v3

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [API-Football](https://www.api-football.com) key (free tier works)
- A [Vercel](https://vercel.com) account (for deployment)

### 2. Clone & install

```bash
git clone <repo>
cd next-world-cup-prode
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (Transaction pooler) |
| `DIRECT_URL` | Supabase → Settings → Database → Connection string (Direct connection) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `FOOTBALL_API_KEY` | api-football.com dashboard |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your Vercel URL in production |
| `CRON_SECRET` | Any random secret string (e.g. `openssl rand -hex 32`) |

### 4. Database setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase (first time or after schema changes)
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### 5. Supabase config

#### RLS policies
Run `prisma/rls-policies.sql` in the Supabase SQL Editor.

#### DB triggers
Run `prisma/db-triggers.sql` in the Supabase SQL Editor.

#### Auth settings
In Supabase → Authentication → Settings:
- Disable "Confirm email" for smoother onboarding (or configure email templates)
- Set Site URL to your production URL

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Create admin user

1. Register normally through the app
2. In Supabase SQL Editor, promote your user:

```sql
UPDATE "User" SET "isAdmin" = true WHERE nickname = 'your_nickname';
```

---

## Scoring Rules

| Result | Points |
|---|---|
| Exact score | **3 pts** |
| Correct winner / draw | **1 pt** |
| Each correct semifinalist pick | **2 pts** |

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all environment variables in Vercel → Project → Settings → Environment Variables.

The `vercel.json` already configures a cron job at `/api/cron/sync` every 5 minutes for live score syncing. Make sure to add `CRON_SECRET` to Vercel env vars.

---

## Project Structure

```
├── actions/          # Server Actions (auth, predictions, admin)
├── app/              # Next.js App Router pages
│   ├── admin/        # Admin panel
│   ├── auth/         # Login / Register
│   ├── fixture/      # Main prediction page
│   ├── my-stats/     # Personal stats
│   └── ranking/      # Global & weekly leaderboard
├── components/
│   ├── fixture/      # Match cards, phase sections
│   ├── ranking/      # Leaderboard components
│   ├── shared/       # Nav, countdown, providers
│   ├── stats/        # Stats charts, badges
│   └── ui/           # shadcn/ui primitives
├── hooks/            # use-toast
├── lib/              # prisma, supabase, auth helpers, utils
├── prisma/
│   ├── schema.prisma
│   ├── seeds/seed.ts
│   ├── rls-policies.sql
│   └── db-triggers.sql
├── services/         # scoring engine, API-Football sync
├── types/            # TypeScript interfaces
└── styles/           # globals.css (CSS variables)
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset DB + re-seed |
| `npm run typecheck` | TypeScript check |

---

## Tournament Timeline

- **Tournament start:** June 11, 2026
- **Semi-finals lock:** Semi-finalist picks lock when first semi-final kicks off
- **Predictions lock:** 5 minutes before each match kickoff

---

## License

Internal use — Next English Institute.
