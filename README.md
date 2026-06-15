# Hayden Ford Portfolio 2026

**A beautiful, modern, full-stack personal portfolio and client portal platform.**

Built with Next.js 16 (App Router, Turbopack), Prisma, NextAuth, Stripe, Resend, and a premium glassmorphism + fluent UI system. Designed for seamless client experiences, powerful admin tools, real-time features, and a cohesive design language across desktop and mobile.

> "Fluent, beautiful, and production-ready — from public site to private client dashboards and admin insights."

## ✨ Highlights & Philosophy

- **Unified Experience**: Everything (profile edits, photos with live crop, linktrees, forum, email prefs, appearance themes, auth) lives in one elegant **Account Settings Modal** with live-updating preview hero, responsive sidebar tabs (desktop) / horizontal pills (mobile), and instant feedback.
- **Client Portal First**: Dedicated `/client/*` routes with Discord-style desktop sidebar, limited mobile header, beautiful bottom nav, and client-specific data (projects, invoices, tickets with real-time chat via SSE, spending trends).
- **Powerful Admin Tools**: Full dashboard with impersonation ("View as Client" / switch to any user), revenue/project analytics (Recharts), user management, webhook/email tester, vercel stats, and the ability to preview the exact client experience.
- **Payments & Business**: Stripe Checkout + webhooks (invoices, refunds, subscriptions), beautiful premium email templates (Resend), receipts, and client billing transparency.
- **Community & Presence**: Full-featured forum (topics, replies, votes), multiple branded Linktrees per user (with public views at `/linktree/{username}/{id}`), testimonials, leads.
- **Design System**: Glassmorphism, noise overlays, smooth animations, responsive everything, touch-friendly modals with cropper (mouse + touch), live previews. Accent colors from user Appearance settings propagate across buttons, accents, and UI.
- **Mobile Excellence**: Finalized fluent, neat, tidy experience — safe areas, no cutoffs, excellent tap targets, scrollable content, responsive modals/heroes/sidebars that collapse gracefully.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (RSC, Server Actions, force-dynamic where needed)
- **Auth**: NextAuth (Credentials + session role handling + impersonation via httpOnly cookies)
- **Database**: Prisma + PostgreSQL (rich relations for User/Client/Project/Invoice/Ticket/Linktree/Forum + clientUserId for modern portal users)
- **Payments**: Stripe (Checkout, webhooks for paid/invoice/refund/sub events)
- **Emails**: Resend with premium dark themed templates + notification system (prefs-aware)
- **UI/UX**: Tailwind + custom glass, Lucide icons, GSAP for some modals, Recharts (lazy via next/dynamic ssr:false), React Hook Form patterns in modals
- **Real-time**: SSE for ticket chat/typing
- **Other**: bcryptjs, zod (light), beautiful cropper canvas (with touch), command palette (⌘K)

## 📁 Key Sections

### Public Site
- Hero, work, services, process, testimonials, contact
- Public Linktree views (socials + specific branded trees)
- Forum (public read + auth write)
- Hire form / leads

### Client Portal (`/client/*`)
- Desktop: Left sidebar (nav + Discord user bar with gear for settings modal), limited header, main content
- Mobile: Collapsed header nav + fixed beautiful bottom tab nav (safe areas)
- Dashboard: Personalized stats, spending trends (Recharts), live websites, quick actions, active projects
- Projects, Invoices (with receipts), Support (real-time ticket chat + typing), Linktree management, Forum participation, Profile (read + edit via modal)

### Admin Dashboard (`/dashboard/*`)
- Overview with full stats, trends (revenue, tiers), quick actions
- "View as Client" toggle + full impersonation (cookie-driven, affects all data + nav)
- Leads, Users/Clients management (create, ban, badges, impersonate), Projects, Invoices (refunds), Tickets, Testimonials, Forum moderation, Linktrees, Badges, Vercel stats, Settings (webhook/email tester with premium templates)
- Sidebar adapts based on view mode; mobile bottom nav too

### Account Settings Modal (the heart of personalization)
- Responsive tabs: Profile (live hero at top with drag/crop photo upload), **Appearance** (toggles + accent color), Preview (exact public replica), **Linktree**, **Forum**, Notifications/Email, Authentication (password + email change)
- All settings (including new ones) persist via `/api/user/profile` (merged into emailPreferences JSON)
- Live updates everywhere, full cropper with zoom/pan (mouse + full touch support)
- Triggered from client header/sidebar gears, admin header, profile pages, users management, etc.

### Other
- Real-time ticket system with SSE
- Stripe-powered billing with refunds + notifications
- Premium email system (receipts, forum replies, sub updates, specials, settings changes, webhook tester)
- Analytics & trends powered by Recharts (lazy loaded)
- Impersonation & effective user context throughout (getEffectiveUser helper)

## 🎨 Appearance & Theming

User-chosen **accentColor** (from Account Settings → Appearance) now applies platform-wide:
- CSS custom properties (`--accent-color`) set dynamically for logged-in users.
- Primary buttons, accents, hover states, borders, and highlights respect the chosen color (blue, purple, emerald, rose, amber).
- Works in dashboards, modals, client portal, public previews where applicable.
- Mobile + desktop consistent.

## 📱 Mobile Experience (Finalized)

- **Client**: Beautiful bottom navigation with active states, safe-area padding, overflow handling.
- **Modals**: Responsive (sidebar collapses to horizontal scrollable pills), excellent touch targets, cropper fully touch-enabled (pan/zoom), no content cutoffs, proper scrolling.
- **Dashboards & Lists**: Fluid grids, compact cards on small screens, readable text, no horizontal overflow.
- **Navigation**: Header collapses links on small screens; sidebars hidden on mobile with bottom nav taking over.
- **Overall**: Neat, tidy, fluent — tested patterns for 320px+ widths, no jank, great performance.

## 🔗 Linktrees (Updated Public Views)

- Management: Full CRUD in `/client/linktree` & `/dashboard/linktree` (name + array of platform/url links, limits enforced).
- **Public Views**:
  - `/linktree/{username}` — Legacy/socials view + profile info.
  - **`/linktree/{username}/{linktreeId}/`** — Specific branded Linktree (uses that tree's links + user's banner/avatar/bio). Beautiful glass UI, copyable share URL, project teasers.
- Public URLs are shown in management, Account Settings → Linktree tab, and generated on creation.
- Multiple per user (unlimited for admins, 2 for clients).

## 📖 Project Summary (for README)

This is a complete, ambitious, real-world portfolio + SaaS client portal demonstrating advanced Next.js patterns, business features (billing, support, community), delightful UX (modals with live previews + crop, glass everywhere, smooth interactions), role-based experiences (client vs admin with preview/impersonation), and mobile-first polish.

Perfect for a freelance developer or small agency wanting a stunning online presence that also serves paying clients professionally.

## 🚀 Getting Started (Local)

1. `npm install`
2. Set up `.env.local` (DATABASE_URL, NEXTAUTH_SECRET, Stripe keys, RESEND_API_KEY, etc.)
3. `npx prisma migrate dev` (or db-setup route)
4. `npm run dev`
5. Login (default flows via credentials), explore admin (/dashboard) with "View as Client", client portal, create linktrees, post in forum, etc.

Admin tester in settings for webhooks/emails.

## 📌 Notes & Future

- All data respects effective user / impersonation context.
- Beautiful, consistent design language (glass, space, typography via font-space).
- Production considerations: force-dynamic on dynamic pages, proper auth guards, error boundaries.

---

**Built with love for craft, clients, and code.** 

If you're viewing this, welcome — the live site is even better. ✨

(Full source includes 50+ routes, real-time features, charts, payments, emails, and a settings modal that feels like a mini app.) 

---

*This README was generated as a high-quality project summary per request.*