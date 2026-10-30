# Logic audit — 30 October 2026

## Fixed

- Chart/comparison grouping now uses full calendar dates, including the year, and sorts by date keys rather than attempting to parse Indonesian display labels. Amount sorting no longer changes chart chronology. Comparison detail views derive their records from current data instead of holding a stale copy.
- Custom filters reject incomplete, reversed, and invalid calendar ranges. Daily/weekly/recent-month views exclude future dates. Recent-month views cover 30 calendar days including today. Spending summaries use seven or thirty calendar days, and dashboard history now respects its “Last 30 Days” label.
- Monthly dashboard API queries use an exclusive first-of-next-month boundary, so transactions on the final day are included. Independent statistics queries run concurrently. Seven-day charts exclude tomorrow and do not combine identical weekday labels from different dates.
- Input validation is shared by web actions and Android HTTP routes. Blank descriptions, invalid/rolled-over dates, nonnumeric/coerced boolean amounts, nonpositive/nonfinite amounts, and amounts beyond the safe numeric range are rejected. Existing Android ISO timestamps and web date inputs remain supported. The transaction GET API now forwards custom dates and sorting instead of silently ignoring them.
- Failed reads return an error/503 through HTTP routes instead of successful empty histories or zero statistics. Client requests time out after 15 seconds. Initial failures can retry when connectivity returns.
- Edit operations conditionally update the original record before changing balances. A competing edit with an obsolete value is rejected. Wallet locks follow a consistent order; same-wallet edits use one net adjustment. Delete operations refund the record actually deleted, avoiding a stale read if an edit wins the race.
- Transaction, top-up, edit, and confirmation forms guard against duplicate submissions. Backdrop clicks cannot dismiss a saving modal. Failed confirmations release their pending state. The global add form remounts on each opening so its default date is current.
- The dashboard's savings amount is labeled “Tabungan”, rather than “Income”. The Android statistics response field `totalPemasukan` retains its historical meaning (savings) for compatibility; actual wallet top-ups remain in `Pemasukan`.

## Dependencies

Next.js was updated from 15.3.8 to 15.5.28, following the [October security advisory](https://nextjs.org/blog/nextjs-security-update-october-14-2026). Zod was updated to 4.6.6. Compatible transitive patches were applied, and a PostCSS override ensures Next.js uses the project's patched PostCSS 8.5.32 instead of its pinned 8.4.31. No major-version framework migration was forced. Final npm audit reported zero known vulnerabilities.

`npm run typecheck` replaces the old unconfigured `next lint` script. Output tracing is restricted to this repository, so parent-directory lockfiles do not change the build root.

## Scope and verification

- Access intentionally remains without login, as requested. This audit does not assert that an unauthenticated deployment is private.
- No production records or balances were edited during testing. No schema migration is required. Existing historical balances are not recalculated.
- Complete histories are still fetched and cached, as documented in `performance.md`; server pagination and a database currency-type migration are separate changes if needed later.
- Regression tests cover validation, grouping across years, date boundaries, reconnect recovery, competing edits, correct delete refunds, query concurrency, and HTTP error behavior. Run `npm test`, `npm run typecheck`, and `npm run build` after pulling dependency changes.
