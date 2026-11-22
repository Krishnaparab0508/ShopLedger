# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser for JSON request bodies.
- Browser interface is static HTML, CSS, and JavaScript under `public/`; app data is stored in `data/db.json`.

## Module map
- `routes/customers.js` — lists customers and recent settlements; records Khata settlements.
- `routes/orders.js` — lists, reads, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — serves dashboard and GST reports, pricing preview, and admin export.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats today, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` — finds products, checks and adjusts stock, and summarizes inventory.
- `lib/invoice.js` — calculates invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — lists customers, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, finds, cancels, and filters/sorts orders.
- `lib/pricing.js` — calculates subtotals, discounts, taxes, and order totals.
- `lib/reports.js` — builds dashboard summaries and GST reconciliation results.
- `lib/store.js` — reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` — selects item GST rates, reports slab percentages, and splits CGST/SGST.

## Commands
- Start the app: `node server.js` (or `npm start`).
- Run tests with Node's test runner: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Order history sorting and date filter are broken, and Khata settlements corrupt customer balances. Allowed files: `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
