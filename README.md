## Money Tracking (Next.js App Router)

Personal side project to track income/expense and demo practical Next.js 15 App Router patterns (auth, data fetching, pagination, **`SSR` / `CSR` / `ISR`**, basic tests). Not a production finance app.

### Core business data
- Transaction: income/expense, amount, date-time, category (id + name), note, id.
- Summary: current balance, week/month comparison, top spending categories, recent transactions.
- Reports: public monthly report (ISR) with total income/expense/net, grouped by day with details.

### Main features
- **Authentication (mock)**: login form; **`Server Action`** sets **`JWT`** (jose) into httpOnly cookie; middleware guards `/dashboard` + `/transactions`; logout clears cookie.
<img width="1916" height="872" alt="image" src="https://github.com/user-attachments/assets/14257c93-4de2-40a6-b204-ca7d9b86310e" />
- **Dashboard**: balance overview; week/month summaries with Recharts bar chart; top expense categories; recent transactions with **infinite scroll** (`IntersectionObserver`) + fallback “Load more”.
<img width="1911" height="879" alt="image" src="https://github.com/user-attachments/assets/22a2861e-5adf-4545-af69-6947b50974a6" />
- **Transactions**: month selector; paginated fetch via **`React Query`** `useInfiniteQuery`; group by date; view detail; add/edit via modal (CRUD); delete with confirm; monthly summary + report modal; expense distribution pie (Recharts).
<img width="1908" height="874" alt="image" src="https://github.com/user-attachments/assets/1132bd8e-963a-43eb-8abb-6cbb2249b1ed" />
<img width="1918" height="881" alt="image" src="https://github.com/user-attachments/assets/18ff9e43-7cb1-4137-8078-bb88acee12ae" />
<img width="1914" height="277" alt="image" src="https://github.com/user-attachments/assets/73538a24-ebbd-4ada-8ac3-ec66e204ecfc" />
- **Reports (public)**: route `/reports/monthly/[month]`; **`ISR`** (`revalidate` 24h); server component fetch via mock route handlers; shows income/expense/net + list.
<img width="1919" height="878" alt="image" src="https://github.com/user-attachments/assets/049ea047-dd01-444d-8e38-dfe51cb17db5" />
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
