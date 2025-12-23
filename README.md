## Money Tracking (Next.js App Router)

Personal side project to track income/expense and demo practical Next.js 15 App Router patterns (auth, data fetching, pagination, **`SSR` / `CSR` / `ISR`**, basic tests). Not a production finance app.

### Core business data
- Transaction: income/expense, amount, date-time, category (id + name), note, id.
- Summary: current balance, week/month comparison, top spending categories, recent transactions.
- Reports: public monthly report (ISR) with total income/expense/net, grouped by day with details.

### Main features (gắn tag phỏng vấn)
- **Authentication (mock)**: login form; **`Server Action`** sets **`JWT`** (jose) into httpOnly cookie; middleware guards `/dashboard` + `/transactions`; logout clears cookie.
- **Dashboard**: balance overview; week/month summaries with Recharts bar chart; top expense categories; recent transactions with **infinite scroll** (`IntersectionObserver`) + fallback “Load more”.
- **Transactions**: month selector; paginated fetch via **`React Query`** `useInfiniteQuery`; group by date; view detail; add/edit via modal (CRUD); delete with confirm; monthly summary + report modal; expense distribution pie (Recharts).
- **Reports (public)**: route `/reports/monthly/[month]`; **`ISR`** (`revalidate` 24h); server component fetch via mock route handlers; shows income/expense/net + list.
- **API & data layer**: Next.js **Route Handlers** under `/api/mock/*` (GET/POST/PUT/DELETE, pagination, artificial latency for skeletons) + `/api/transactions` for create; in-memory mock data.
- **Rendering & state**: **`React Query`** for **`CSR`** fetching + invalidation; server components for **`SSR`**/**`ISR`**; client components for interactive UI.
- **UI/UX**: Tailwind CSS; shadcn/ui + Radix (Tabs, Dialog); lucide-react icons; loading skeletons.
- **Testing**: Vitest + Testing Library; unit tests for utils; component test for `TransactionDetailPage`; mocked API data.

### Running locally
```bash
pnpm install
pnpm dev    # http://localhost:3000
pnpm test   # vitest + jsdom
```