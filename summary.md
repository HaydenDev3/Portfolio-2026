## Goal
- Rebuild Hayden's developer portfolio into a premium client-facing business with Stripe payments, authentication, admin/client dashboards, forums, client reviews, support tickets, user profiles with badges, and AI-optimized SEO

## Constraints & Preferences
- Target audience: any Australian small business (not location-bound)
- Tone: professional, premium, trustworthy
- Keep existing dark theme with blue brand accent and glass morphism
- Must be really mobile responsive
- Domain: haydenf.fyi
- Calendly: hayd3nford2008
- Web3Forms access key: 1bab892b-2248-42b4-bd05-410fb3155eda
- Contact form uses Web3Forms (with parallel DB save)
- Repo is public at github.com/HaydenDev3/Portfolio-2026
- All personal data is in .env.local (gitignored)
- License: All Rights Reserved, no AI training, no copying
- Payment: real Stripe Checkout + Subscriptions
- Auth: NextAuth v5 with email/password credentials, admin + client roles
- Pricing: beginner-friendly (Essential $300, Growth $600, Premium $1,200, Maintenance $25/mo)

## Progress
### Done
- Installed dependencies: Prisma 5, Stripe, NextAuth v5 (beta), bcryptjs, react-markdown, rehype-raw, react-syntax-highlighter
- Created Prisma schema with 12 models: User, Lead, Client, Project, Invoice, Subscription, Testimonial, SupportTicket, UserBadge, ForumCategory, ForumTopic, ForumPost
- Set up Prisma client singleton, Neon Postgres datasource, Stripe library with PLANS config
- Created NextAuth v5 config with credentials provider, role-based callbacks, banned user check
- Created Auth login page with GSAP entrance + Suspense boundary
- Created 25+ API routes covering: Stripe (checkout, webhook, portal), DB setup, leads, clients, projects, invoices, testimonials, tickets, user profile, badges, forum (categories, topics, posts, topic/[id], post/[id]), user management, upload
- Built admin dashboard with sidebar (user avatar + badges + dropdown menu), profile preview modal, sticky top nav bar, overview stats, CRUD pages for all entities
- Built client portal with Dashboard, Projects, Invoices, Support, Profile pages
- Built public Forum as "Social Hub" (Twitter/Discord-style feed) with category pills, content previews, reply/view counts, last reply indicator, profile popovers on avatars/usernames, markdown rendering with code syntax highlighting, HTML support via rehype-raw
- Created MarkdownRenderer component with code blocks (One Dark theme), inline code, tables, blockquotes, GFM
- Created UserProfilePopover component with compact popover and full modal variants
- Created ProfilePreviewModal component for full profile view
- Created CommandPalette component (⌘K searchable actions menu)
- Created ForumSettingsModal component (sort by latest/oldest/views, filter by category)
- Created ContextMenu component (right-click context menu) with divider support
- Created useContextMenu hook for easy right-click integration
- Integrated ContextMenu into forum topic detail page (right-click on messages for copy/delete)
- Integrated ContextMenu into forum home page (right-click on topic cards and category pills)
- Integrated ContextMenu into dashboard sidebar nav items (right-click for open/new-tab/copy-link)
- Created image upload API (`/api/upload`) + public/uploads directory
- Added delete + admin control endpoints: DELETE topics (with cascade replies), DELETE posts, PATCH topics (pin/lock)
- Added search bar, inline sort pills (Latest/Top/Views), live search to forum home
- Added delete buttons with confirmation dialogs to topic detail page, admin pin/lock gear menu
- Added image upload buttons to profile page (alongside URL inputs)
- Merged Badges into Users tab: removed Badges nav item, command palette overlay on user click with badge toggles, ban/unban, delete
- Fixed runtime error "Rendered fewer hooks than expected" — moved all hooks before conditional early returns in Navbar and ShareButton, guarded effect bodies with `hidden` flag
- Fixed dashboard login session check — unwrapped `sessionData?.user ?? sessionData` for NextAuth v5 format
- Updated AuthNavItem with dropdown menu (Dashboard, Forum, Sign Out)
- Live Neon DB connected, seeded: admin user + 4 forum categories + 1 test lead
- Live Stripe keys + 4 products/prices created
- Build runs clean: 50 routes, zero errors, zero warnings
- Relocated full working tree (source + .git + .next build + node_modules + prisma + public + src + README.md + this summary.md + all config/assets) from temporary location /tmp/opencode/portfolio-2026 to permanent home ~/Documents/code/Portfolio-2026 (2026-06-13)
- Updated this summary.md Critical Context + progress log to reflect new canonical path
- Began addressing Next Step #4 ("Write proper content for SEO pages") by expanding hire-web-developer page with detailed packages section + clearer value messaging

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Use Prisma 5 (not 7) for compatibility with Next.js 16 Turbopack build
- Remove middleware.ts — auth protection handled in layout.tsx
- Lowered prices to beginner-friendly: Essential $300, Growth $600, Premium $1,200, Maintenance $25/mo
- Badge system via UserBadge join table for extensibility
- Forum uses slug-based URLs with auto-generated slugs from topic titles
- Dashboard layout converted to client component for session/profile management (no server-side layout)
- `rehype-raw` used for HTML in markdown (no sanitize — authenticated forum only)
- ContextMenu created as reusable fixed-position component with glass styling, divider support for separator lines

## Next Steps
1. Deploy to Vercel with all env vars
2. Configure Stripe webhook endpoint with live domain
3. Configure Google Search Console + sitemap submission
4. Write proper content for SEO pages (hire-web-developer, etc.)

## Critical Context
- All source code at `~/Documents/code/Portfolio-2026` (relocated 2026-06-13 from previous temporary /tmp/opencode location)
- Build runs clean: `npm run build` — 50 routes, zero errors, zero warnings
- Prisma 5.22.0, Next.js 16.1.6, Stripe SDK, NextAuth v5 beta
- Live Neon DB: `ep-mute-moon-ad2slml1.c-2.us-east-1.aws.neon.tech`
- DB seeded: admin user (hayd3nford2008@gmail.com / change-me-admin-password), 4 forum categories, 1 test lead
- Stripe: 4 live products/prices, keys in .env.local
- Admin login: hayd3nford2008@gmail.com / change-me-admin-password
- GSAP ScrollTrigger animations play once per section
- ContextMenu component at `src/components/ContextMenu.tsx` with divider support
- useContextMenu hook at `src/hooks/useContextMenu.ts`

## Relevant Files
- `src/components/ContextMenu.tsx`: Right-click context menu component with dividers, danger styling, auto-positioning
- `src/hooks/useContextMenu.ts`: Hook that provides `{ menu, show, hide }` for right-click integration
- `src/components/CommandPalette.tsx`: ⌘K searchable actions menu
- `src/components/ForumSettingsModal.tsx`: Sort/filter settings modal
- `src/components/MarkdownRenderer.tsx`: Markdown + code syntax + HTML renderer
- `src/components/UserProfilePopover.tsx`: Clickable profile popover (compact + modal)
- `src/components/ProfilePreviewModal.tsx`: Full profile overlay modal
- `src/app/forum/page.tsx`: Social Hub home with right-click on topic cards + category pills
- `src/app/forum/[slug]/[topicId]/page.tsx`: Topic detail with right-click on messages for copy/delete
- `src/app/dashboard/layout.tsx`: Sidebar nav items with right-click context menu
- `src/app/api/upload/route.ts`: File upload to /public/uploads/
- `prisma/schema.prisma`: 12 models + User.banned
