# Money Tracking App

A production-grade personal finance tracker built with Next.js 15, showcasing real-world patterns for high-performance React applications.

**What makes this different:** Not just another CRUD app. This demonstrates advanced patterns you'd find in modern SaaS products—virtual scrolling for large datasets, WebSocket real-time sync, optimistic updates, and sophisticated state management with React Query.

## 🎯 Technical Highlights

| Feature | Implementation | Impact |
|---------|---------------|--------|
| **Virtual Scrolling** | @tanstack/react-virtual | Only rendering ~15 visible rows from 1000+ item datasets (~98% DOM reduction), maintaining ~62 FPS during scroll — verified via DevTools Performance and Chrome Frame Rendering |
| **Real-Time Sync** | Native WebSocket + BroadcastChannel | <100ms cross-device updates, 80% connection efficiency |
| **Optimistic Updates** | React Query mutations | <16ms UI response, graceful rollback |
| **Infinite Scroll** | IntersectionObserver + cursor pagination | Smooth loading, no layout shift |
| **State Management** | React Query + query key factory | Zero prop drilling, intelligent caching |

→ [Performance Metrics](./metrics/README.md) | [Virtual List Deep Dive](./docs/VIRTUALIZED_LIST.md) | [WebSocket Architecture](./docs/WEBSOCKET_SYNC.md)

---

## 📈 Measured Performance (Kanban Page — heaviest page)

| Metric | Value |
|--------|-------|
| **Lighthouse Performance** | 97 |
| **First Contentful Paint (FCP)** | 0.6s |
| **Largest Contentful Paint (LCP)** | 0.6s |
| **Scroll FPS** | ~62 FPS |
| **DOM nodes rendered** | ~15 of 2000+ items (~98% reduction) |

*Measured on production deployment: `money-tracking-react-web.vercel.app` with real-time WebSocket sync active.*

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

```bash
# Install dependencies
pnpm install


# Start development server
pnpm dev

# Start WebSocket mock server (separate terminal)
pnpm ws-server

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Collect performance metrics
pnpm collect-metrics
```

Open [http://localhost:3000](http://localhost:3000)

**Test Real-Time Sync:**
1. Open app in two browser tabs
2. Drag a transaction in Tab 1
3. Watch it update in Tab 2 instantly ✨

---

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login)
│   ├── (private)/         # Protected routes (dashboard, transactions, kanban)
│   └── reports/           # Public ISR routes
├── features/              # Feature-based modules
│   ├── dashboard/         # Balance, summaries, charts
│   ├── transactions/      # CRUD, infinite scroll
│   └── kanban/           # Virtual list, drag-drop, WebSocket
├── lib/
│   ├── query-keys.ts     # React Query key factory
│   ├── websocket/        # WebSocket client + mock server
│   └── sync/             # BroadcastChannel manager
└── providers/            # React Query, WebSocket, Auth

docs/                      # Architecture documentation
metrics/                   # Performance tracking
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

- **API:** Route Handlers backed by PostgreSQL (`/api/transactions`, `/api/balance`, `/api/summary`, `/api/expenses/top`)
- **Authentication:** Mock JWT flow for demonstration (not production-ready security)
- **WebSocket Server:** Mock server for local development (`pnpm ws-server`)

---

## 🤝 Contributing

This is a personal learning project, but feel free to:
- Open issues for bugs or suggestions
- Fork and experiment with patterns
- Reference code for your own projects

---

**Built to learn, refined to teach. Explore the code to see production patterns in action.** 🚀
