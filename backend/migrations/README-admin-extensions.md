# Admin / operations schema extensions

On app boot, Sequelize creates **new tables** (see `model/*Model.js` and `ALLMODELSYNC.js`).  
Existing tables get extra columns via `utils/ensureAdminFeatureDDL.js` (best-effort `ALTER TABLE`, ignores duplicate-column errors).

## New tables (high level)

- `admin_activity_logs` — immutable admin audit trail  
- `platform_settings` — key/value JSON (feature flags, maintenance text, SLA hours, staff read-only, …)  
- `marketing_consent_logs` — consent channel log  
- `order_risk_flags` — fraud / manual review queue  
- `order_shipments` — extra tracking rows (split shipments)  
- `return_requests` — RMA / returns workflow  
- `coupons` — coupon definitions (checkout wiring optional)  
- `content_flags` — moderation inbox  
- `admin_order_notes`, `admin_user_notes` — internal CRM notes  
- `product_cost_sheets` — cost price + supplier PO per product  

## Altered tables

- `produkt.listing_status` — `draft` | `published` (storefront hides drafts unless admin bearer)  
- `order.respond_by`, `order.ship_by` — SLA targets (set when status moves to `processing`)  
- `order_item.shipped_quantity` — partial fulfillment counts  

## Public API

`GET /public/site-config` — no auth; returns safe subset of `platform_settings` for the storefront (maintenance banner, feature toggles).

## Admin API prefix

All extended routes live under **`/admin/ops/...`** (see `routes/AdminRoute.js`).  
`staff_readonly` platform flag blocks **staff** mutating methods on authenticated admin routes (via `middleware/staffReadOnlyBlock.js`).

Restart the API after pulling so models + DDL run once.
