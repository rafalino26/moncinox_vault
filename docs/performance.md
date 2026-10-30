# Page and data loading

The three web pages are static shells. They render navigation and loading/error states without connecting to PostgreSQL. Financial data is fetched after hydration through `/api/web/*` with `Cache-Control: private, no-store`; it is not embedded in the cached HTML. The existing Android API paths and response shapes are preserved.

`WalletProvider` owns separate in-memory resources for wallets, transactions, and income. Each resource loads only when its page needs it. Dashboard wallet and transaction reads start independently. Dashboard and transaction history reuse the same transaction resource. Concurrent reads share a request, and navigation reuses fresh data for 30 seconds. Stale data remains visible during refresh. Only already-loaded resources refresh on focus, reconnect, or every 60 seconds while the document is visible. Nothing is stored in localStorage.

Successful add/edit/delete responses update the resources directly, without a route refresh or a second read. The cache discards reads that began before a successful write and then revalidates. Initial failures show a retry action rather than a false zero balance or empty history.

Date/source/type/sort and table/chart view changes use the native History API, so URL filters work without a server round trip. Dates are interpreted in the viewer's local timezone. The search box remains debounced. Chart.js loads only when a chart is opened; dashboard charts reuse existing transactions instead of running four more database queries. Tables initially render 50 records, with a button to display more. Totals and charts still use the entire matching dataset.

## Current scope

Transaction and income reads still return complete histories. This preserves all-time totals, search, comparisons, and filters while removing repeated transfers and queries. This is not database pagination. If these datasets grow substantially, move summaries and comparisons to aggregate queries and paginate record reads together; limiting the existing data without doing both would silently produce incorrect totals.

No schema migration or new dependency is required. Existing savings edit math was corrected to match creation/deletion: both expense and savings deduct from the spending wallet.

## Measurements

Local production builds before/after:

| Page | Initial JavaScript before | After |
| --- | ---: | ---: |
| Dashboard | 181 KB | 116 KB |
| Transactions | 184 KB | 119 KB |
| Income | 105 KB | 106 KB |

A read-only check against the configured database returned 1,559 transactions (317,394 bytes of uncompressed JSON) and 423 income records (46,394 bytes). Concurrent reads took 403–490 ms on the first pass and 96–188 ms on the warm pass. These are measurements from the development environment, not production-user latency or a before/after database speed comparison.

Local HTTP smoke checks with `next start` returned 200 for all three pages without waiting for database reads. Browser interaction tests were unavailable in this session.

## Verify after deploying

- Run `npm test` and `npx next build`.
- Open Network in browser developer tools. First opening dashboard should issue one wallets GET and one transactions GET, with no dashboard-statistics request. They should run in parallel.
- Navigate to transactions within 30 seconds. It should reuse transaction data; changing filters or table/chart mode should not request another page or dataset.
- Open income. Only the income resource should load on first visit.
- Submit, edit, or delete a record. The successful write response should update local history and wallets without a page refresh.
- Slow or block `/api/web/*`. Navigation should remain usable; cached records should stay visible, with a retry option on error.
- The `Server-Timing: db;dur=...` header on web data GETs separates server database time from the rest of the request. Compare it with request TTFB in the deployed region. Run `npm run check:db` for a separate read-only timing check; it logs durations, counts, and JSON sizes, without record contents or credentials.
