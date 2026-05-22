# Sans Souci Ongles & Spa — Website

Next.js 16 multilingual (FR/EN + ES/AR) booking & information site for **Sans Souci Ongles & Spa**, CF Carrefour Laval (Laval, QC).

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4
- **Data/Auth:** Supabase, iron-session
- **Animation:** framer-motion
- **Testing:** Playwright (E2E)
- **Booking:** embedded widgets from `app.onglessanssouci.com`

## Getting Started

```bash
cp env.example .env.local   # fill in values
bun install
bun run dev                 # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun run lint` | ESLint |
| `bun run test:e2e` | Playwright E2E tests |
| `bun run fetch:reviews` | Pull Google Business reviews → `src/data/google-reviews.json` |

## Environment

Copy `env.example` to `.env.local` and fill in the required values (Resend contact-form delivery, Supabase, Google Business reviews, session secret).
