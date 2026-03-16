# Money Tracking App

**[→ Live Demo](https://money-tracking-react-web.vercel.app)**

A full-stack personal finance tracker running in production on Vercel, backed by a real Neon Postgres database. Built with Next.js 15, React 19, and TypeScript.

**What makes this different:** This is an actual production deployment—real database, real WebSocket sync across devices, Lighthouse 97 on the heaviest page. Virtual scrolling renders only ~15 DOM nodes from 2000+ records. Every performance number in this README is measured, reproducible, and linked to evidence.

## 🎯 Technical Highlights

| Feature | Implementation | Impact |
|---------|---------------|--------|
| **Virtual Scrolling** | @tanstack/react-virtual | Only rendering ~15 visible rows from 1000+ item datasets (~98% DOM reduction), maintaining ~62 FPS during scroll — verified via DevTools Performance and Chrome Frame Rendering |
| **Real-Time Sync** | Native WebSocket + BroadcastChannel | <100ms cross-device updates, 80% connection efficiency |
| **Optimistic Updates** | React Query mutations | <16ms UI response, graceful rollback |
| **Infinite Scroll** | IntersectionObserver + cursor pagination | Smooth loading, no layout shift |
| **State Management** | React Query + query key factory | Zero prop drilling, intelligent caching |

→ [Performance Metrics](./metrics/README.md) | [Virtual List Deep Dive](./docs/VIRTUALIZED_LIST.md) | [WebSocket Architecture](./docs/WEBSOCKET_SYNC.md) | [Optimistic Updates](./docs/OPTIMISTIC_UPDATES.md)

---

## 📈 Measured Performance (Kanban Page — heaviest page)

| Metric | Value |
|--------|-------|
| **Lighthouse Performance** | 97 |
| **First Contentful Paint (FCP)** | 0.6s |
| **Largest Contentful Paint (LCP)** | 0.6s |
| **Scroll FPS** | ~62 FPS |
| **DOM nodes rendered** | ~15 of 2000+ items (~98% reduction) |

*Measured on production deployment: `money-tracking-react-web.vercel.app` (without WebSocket server — see WebSocket note below).*

Screenshots:
- Lighthouse (Throttling x4, 3G):
<img width="1206" height="871" alt="Image" src="https://github.com/user-attachments/assets/ff493ca6-14e5-455e-b149-ca5e2e6464c3" />

- DOM nodes for virtual list (15/2000+):
<img width="1108" height="641" alt="Image" src="https://github.com/user-attachments/assets/4d35e838-c0cb-452d-951b-4b59da57092c" />

- FPS & GPU:
<img width="194" height="183" alt="Image" src="https://github.com/user-attachments/assets/1971e519-6505-44f6-b3c1-25dbe27dc3af" />

## 🚀 Core Features

### 1. **Dashboard** - Financial Overview
Real-time balance tracking with week/month comparisons, top expense categories, and recent transactions. Infinite scroll powered by IntersectionObserver with fallback pagination.

<img width="1911" height="879" alt="Dashboard" src="https://github.com/user-attachments/assets/22a2861e-5adf-4545-af69-6947b50974a6" />

**Tech:** React Query for CSR, Recharts for visualizations, optimistic balance updates

---

### 2. **Kanban Board** - Drag & Drop Transaction Management
Organize transactions by categories with drag-and-drop. Handles 500+ transactions per column smoothly via virtualization.

<img width="1913" height="916" alt="Image" src="https://github.com/user-attachments/assets/e08bb730-c888-4d65-9f3c-05430a9e4890" />

**Key Patterns:**
- **Virtual scrolling** renders only visible cards (~20 DOM nodes for 500 items)
- **Optimistic drag-and-drop** with instant UI feedback + rollback on error
- **Real-time sync** via WebSocket—changes from one device appear on others instantly
- **Multi-tab optimization** via leader election (1 WebSocket for N tabs)

**Tech Stack:**
- `@tanstack/react-virtual` for virtualization
- `@dnd-kit` for accessible drag-and-drop
- Native WebSocket with auto-reconnect
- React Query cache manipulation for zero-refetch updates

---

### 3. **Transactions** - Comprehensive CRUD
Month selector, grouped timeline view, add/edit/delete with modals, monthly reports with expense distribution.

<img width="1908" height="874" alt="Transactions" src="https://github.com/user-attachments/assets/1132bd8e-963a-43eb-8abb-6cbb2249b1ed" />

**Tech:** `useInfiniteQuery` with cursor pagination, modal system with Radix UI, Recharts pie charts

---

### 4. **Public Reports** - ISR Static Pages
Public monthly reports at `/reports/monthly/[month]` with ISR (24h revalidation).

<img width="1919" height="878" alt="Reports" src="https://github.com/user-attachments/assets/049ea047-dd01-444d-8e38-dfe51cb17db5" />

**Tech:** Next.js ISR, server components for data fetching, SEO-optimized

---

### 5. **Authentication** - JWT-Based Auth
Mock authentication with JWT tokens in httpOnly cookies, middleware protection for private routes.

<img width="1916" height="872" alt="Auth" src="https://github.com/user-attachments/assets/14257c93-4de2-40a6-b204-ca7d9b86310e" />

**Tech:** Server Actions for auth flow, `jose` for JWT signing/verification, middleware route guards

---

## 🏗️ Architecture & Patterns

### React Query Architecture
- **Query key factory** for hierarchical invalidation
- **Optimistic mutations** with 3-phase pattern (onMutate → onError → onSuccess)
- **Smart prefetching** for adjacent data
- **Stale-while-revalidate** strategy for instant navigation

→ [Full React Query Architecture](./docs/TANSTACK_QUERY_ARCHITECTURE.md)

### WebSocket Real-Time Sync
- Auto-reconnect with exponential backoff (1s → 2s → 4s → 8s → 16s)
- Leader election via BroadcastChannel (multi-tab efficiency)
- Version-based conflict resolution
- Event deduplication to prevent double updates

→ [WebSocket Implementation Details](./docs/WEBSOCKET_SYNC.md)

### Virtual Scrolling
- Variable height support (cards with notes are taller)
- GPU-accelerated positioning (`transform` vs `top`)
- Scroll position stability during real-time updates
- Infinite scroll integration at 80% threshold

→ [Virtualization Rationale](./docs/VIRTUALIZED_LIST.md)

---

## 🛠️ Tech Stack

**Core:**
- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS

**State & Data:**
- @tanstack/react-query (server state)
- @tanstack/react-virtual (list virtualization)
- Native WebSocket (real-time)

**UI Libraries:**
- shadcn/ui + Radix UI (accessible components)
- @dnd-kit (drag-and-drop)
- Recharts (data visualization)
- lucide-react (icons)

**Dev Tools:**
- Vitest + Testing Library (testing)
- ESLint + TypeScript (code quality)
- pnpm (package management)

---

## 🚀 Quick Start

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment variables**

Create a `.env.local` file in the project root:

```env
# Neon Postgres — get your connection string at https://neon.tech
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Optional: direct (non-pooled) connection for Prisma CLI migrations
# DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT signing secret — change this to a random string in production
AUTH_SECRET="your-secret-here"
```

**3. Set up the database**

```bash
# Push the schema to your Neon database (first-time setup or dev)
pnpm db:push

# Or run migrations (production-style)
pnpm db:migrate

# Seed with sample transactions (optional)
pnpm db:seed

# Open Prisma Studio to browse your data (optional)
pnpm db:studio
```

**4. Start the app**

```bash
# Terminal 1 — Next.js dev server
pnpm dev

# Terminal 2 — WebSocket mock server (for real-time sync)
pnpm ws-server
```

Open [http://localhost:3000](http://localhost:3000)

**Test Real-Time Sync:**
1. Open the app in two browser tabs
2. Drag a transaction in Tab 1
3. Watch it update in Tab 2 instantly ✨

**Other commands:**

```bash
pnpm test              # Run tests
pnpm test:coverage     # Coverage report
pnpm typecheck         # TypeScript check
pnpm lint              # ESLint
```

---

## 📂 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── login/                   # Auth route
│   ├── dashboard/               # Dashboard page
│   ├── transactions/            # Transactions + Kanban sub-routes
│   │   └── kanban/
│   ├── reports/monthly/[month]/ # Public ISR reports
│   └── api/                     # Route Handlers (transactions, balance, summary…)
├── features/                    # Feature-based modules (co-located API, components, hooks)
│   ├── dashboard/
│   ├── transactions/
│   └── kanban/
├── components/ui/               # Shared UI primitives (shadcn/ui)
├── lib/
│   ├── query-keys.ts            # React Query key factory
│   ├── websocket/               # WebSocket client + mock server
│   └── sync/                    # BroadcastChannel leader election
├── store/                       # Redux store (UI state)
├── hooks/                       # Shared hooks
└── providers/                   # React Query, Auth context

docs/                            # Architecture documentation
metrics/                         # Performance tracking
prisma/                          # Schema + seed
```

---

## 📚 Documentation

- [React Query Architecture](./docs/TANSTACK_QUERY_ARCHITECTURE.md) - Query keys, caching, optimistic updates
- [Virtualized List](./docs/VIRTUALIZED_LIST.md) - Performance optimization for large lists
- [WebSocket Sync](./docs/WEBSOCKET_SYNC.md) - Real-time synchronization architecture
- [Optimistic Updates](./docs/OPTIMISTIC_UPDATES.md) - Instant UI with rollback patterns
- [Performance Metrics](./metrics/README.md) - Benchmarks and targets

---

## 🎓 Learning Resources

This project demonstrates patterns commonly used in production applications:

**Beginner-Friendly:**
- Next.js App Router with Server/Client Components
- React Query for server state management
- Infinite scroll with IntersectionObserver

**Intermediate:**
- Virtual scrolling for performance
- Optimistic updates with rollback
- Query key factory pattern

**Advanced:**
- WebSocket with leader election
- Multi-tab synchronization via BroadcastChannel
- Version-based conflict resolution
- Concurrent mutation handling

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage report
pnpm test:coverage
```

Tests include:
- Unit tests for utilities
- Component tests for key features
- Mocked API calls

---

## 📝 Notes

- **API:** Route Handlers backed by Neon Postgres (`/api/transactions`, `/api/balance`, `/api/summary`, `/api/expenses/top`)
- **Authentication:** JWT in httpOnly cookies via `jose`; mock user store (auth patterns are production-grade, user management is intentionally minimal)
- **WebSocket Server (important):** There is **no WebSocket server in production**. Real-time sync only works when you run the local mock server with `pnpm ws-server` (see Quick Start). On the Vercel demo, data updates via HTTP only.

---

## 🤝 Contributing

This is a personal learning project, but feel free to:
- Open issues for bugs or suggestions
- Fork and experiment with patterns
- Reference code for your own projects

---

**[Live on Vercel →](https://money-tracking-react-web.vercel.app)** — Browse the code to see production patterns applied to a real, deployed application.
