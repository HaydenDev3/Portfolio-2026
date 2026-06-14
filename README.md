# Hayden Ford — Portfolio 2026

Premium freelance web development portfolio built with **Next.js 16**, **Tailwind CSS v4**, and **Neon Postgres**. Features a public brand site, admin dashboard, client portal, forum community, Stripe payments, and real-time live viewer tracking.

**Live:** [https://haydenf.fyi](https://haydenf.fyi)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Styling | Tailwind CSS v4, GSAP (animations), Lenis (smooth scroll) |
| Database | Neon Postgres via Prisma 5.22.0 |
| Auth | NextAuth v5 (Credentials provider, bcryptjs) |
| Payments | Stripe Checkout + Subscriptions (real) |
| Forms | Web3Forms (contact submissions + parallel DB save) |
| UI | Lucide icons, glassmorphism design tokens |
| Fonts | Space Grotesk (via @fontsource) |

## Features

### Public Site
- Hero with pricing cards, stats bar, GSAP cascade entrance
- 6-phase process timeline
- Story section with scrapbook/masonry layout + ScrollTrigger
- Interactive footer (4-column grid, social links, pricing)
- LiveBadge + ShareButton overlays
- Contact form (Web3Forms + database)
- Calendly booking integration

### Forum ("Social Hub")
- Twitter/Reddit hybrid feed with upvote/downvote
- Category browsing with slug-based URLs
- Sort tabs, category pills, gear-icon consolidated dropdown
- Markdown post rendering with code highlighting
- Inline editing for topic authors
- Threaded replies on topic detail pages
- Dynamic OG image generation per topic
- Client-only categories (accessLevel CLIENTS) — visible only to logged-in clients + admins (in addition to PUBLIC categories)

### Admin Dashboard
- Overview stats (clients, projects, revenue, leads, tickets)
- Client CRUD with detail pages (info, projects, invoices, subscriptions)
- Project kanban board with status columns + detail modal
- Invoice management (view, create, filter)
- Lead tracking with status workflow
- Support ticket management with threaded replies + admin notes
- User management with badge assignment
- Forum moderation
- Testimonial approval/workflow
- Real-time live viewer tracking
- Profile/settings pages

### Client Portal
- Dashboard with key metrics, "My Websites" (live links), and Quick Actions (request update, book call, etc.)
- Project detail pages with comment threads + file uploads + prominent "Visit Live Website" button
- Projects list shows live site links when configured
- Invoice history (paid, pending, overdue)
- Support tickets (create, view conversation, reply)
- Community nav item linking into the forum (clients see additional private "Client Announcements" + "Website Help & Tips" categories)
- Profile management
- Admin can set `liveUrl` per project (visible in kanban, modals, client views)

### Authentication & Roles
- **Admin** — full system access
- **Client** — portal access, ticket/project visibility scoped to their data
- Banned user enforcement via session callback

### Badge System
- Extensible via `UserBadge` join table
- Badges: ADMIN, VERIFIED, PRO, EARLY_SUPPORTER
- Displayed on forum profiles and dashboard user list

### Payments (Stripe)
- **Essential** — $300
- **Growth** — $600
- **Premium** — $1,200
- **Maintenance** — $25/mo (subscription)
- Stripe Checkout for one-time purchases
- Stripe Customer Portal for subscription management
- Webhook handler for payment lifecycle events

## Prisma Schema (15 models)

`User` → `UserBadge` (join), `ForumTopic`, `ForumPost`, `ForumVote`, `TicketMessage`, `ProjectComment`
`Lead` — inbound contact submissions
`Client` → `Project`, `Invoice`, `Subscription`, `Testimonial`, `SupportTicket`
`ForumCategory` (now has `accessLevel`: PUBLIC | CLIENTS) → `ForumTopic` → `ForumPost` → `ForumVote`
`SupportTicket` → `TicketMessage`
`Project` (now has optional `liveUrl`) → `ProjectComment`
`LiveViewer` — geolocation-tracked site visitors

## Project Structure

```
src/
├── app/
│   ├── api/           — 25+ route handlers (auth, stripe, crud, forum, upload, live)
│   ├── auth/login/    — Login page with GSAP animation
│   ├── client/        — Client portal (dashboard, projects, invoices, support, profile)
│   ├── dashboard/     — Admin dashboard (overview, clients, projects, tickets, etc.)
│   ├── forum/         — Public forum (feed, categories, topics, new topic)
│   └── ...            — Public pages (/, /projects, /hire-web-developer, etc.)
├── components/        — Reusable UI (Navbar, Footer, MarkdownRenderer, ProjectDetailModal, etc.)
├── hooks/             — useContextMenu, useSwipe
├── lib/               — Prisma client singleton, Auth config, Stripe config
└── types/             — Shared TypeScript types
```

## Getting Started

### Prerequisites
- Node.js 20+
- Neon Postgres database (or any PostgreSQL)
- Stripe account with products/prices created

### Local Setup

```bash
git clone https://github.com/HaydenDev3/Portfolio-2026.git
cd Portfolio-2026
npm install
```

Copy `.env.local` (see below for required vars) then:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### Required Environment Variables

```
# Database
DATABASE_URL=postgresql://...

# Auth (NextAuth v5)
AUTH_SECRET=<generated-secret>
AUTH_ADMIN_EMAIL=<your-email>
AUTH_ADMIN_PASSWORD=<admin-password>

# Stripe (live keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ESSENTIAL_PRICE_ID=price_...
STRIPE_GROWTH_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_MAINTENANCE_PRICE_ID=price_...

# Web3Forms
NEXT_PUBLIC_WEB3FORMS_KEY=<access-key>

# Site Config
NEXT_PUBLIC_SITE_NAME="Hayden Ford"
NEXT_PUBLIC_SITE_URL=https://haydenf.fyi
NEXT_PUBLIC_EMAIL=<your-email>
NEXT_PUBLIC_CALENDLY=<calendly-username>
```

### Seed

```bash
# Create admin user + forum categories + test lead
npx tsx src/scripts/seed.ts
```

## Scripts

```bash
npm run dev      # Next.js dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Deployment

Deployed on **Vercel** with these build settings:

- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Root directory: `./`

Ensure all env vars are configured in Vercel project settings.

### Post-Deploy
1. Configure Stripe webhook endpoint → `https://haydenf.fyi/api/stripe/webhook`
2. Submit sitemap to Google Search Console
3. Set up custom domain on Vercel

## Design

- **Theme:** Dark with blue brand accent (#3b82f6)
- **UI:** Glassmorphism (frosted glass cards, backdrop blur, subtle borders)
- **Typography:** Space Grotesk throughout
- **Components:** Fully responsive, mobile-first with bottom nav bar on phones
- **Animations:** GSAP on hero/process/story sections, staggered card entrances on forum

## License

All Rights Reserved. No part of this project may be reproduced, distributed, or transmitted in any form without prior written permission. AI training and model fine-tuning are expressly prohibited.
