# Storeanalysis 📊

**Created by Pranshu Singh Baghel**  
*Production-grade Shopify Embedded App for Store Analytics, Product Performance, Inventory Monitoring, and Replenishment Forecasting.*

---

## 🌟 Overview & Product Vision

**Storeanalysis** helps Shopify merchants monitor sales, revenue, products, inventory, orders, and business performance from one unified dashboard. It is engineered following official Shopify Polaris, App Bridge, and Admin GraphQL standards with strict tenant isolation, server-side entitlement enforcement, and privacy compliance.

### Core Capabilities
1. **📊 Overview Dashboard**
   - Key performance indicators: Gross Sales, Net Sales, Orders Count, Average Order Value (AOV).
   - Period-over-period percentage delta badges (+14.8% vs prior period).
   - Interactive SVG Sales & Revenue timeline chart comparing Gross vs Net sales.
   - Real-time stock status warnings and top seller rankings.
   - On-demand "Sync Store Data" action.

2. **📈 Sales & Revenue Analytics**
   - Date range selector: Today, Last 7 Days, Last 30 Days, Last 90 Days, This Month.
   - Financial reconciliation: Gross sales, refund deductions, discounts, taxes collected, and shipping billed.
   - Comparison against equivalent prior time periods.

3. **📦 Product Performance & Velocity**
   - Best-selling products ranked by sales amount and units sold.
   - Identification of slow-moving inventory items to avoid excess holding costs.
   - Qualified gross margin estimates derived from recorded variant unit costs (Pro tier).

4. **🏬 Inventory Status & Low-Stock Alerts**
   - Location-aware stock quantities.
   - Reorder threshold triggers (Critical $\le 5$, Low Stock $\le \text{Threshold}$, Out of Stock $= 0$).
   - Customizable reorder threshold per store.

5. **📑 Orders & Fulfillment Overview**
   - Order pipeline tracking with payment and fulfillment status pills.
   - Privacy-conscious design (zero unnecessary PII collected or retained).
   - Real-time fulfillment rate calculation.

6. **🔮 Pro Inventory Replenishment Forecasting**
   - Historical sales velocity (daily run rate).
   - Projected Days of Inventory Remaining (DOIR).
   - Estimated stockout / run-out dates.
   - Recommended reorder quantities accounting for supplier lead time and safety stock.
   - Data sufficiency rules (minimum 14–30 days history required before projecting).
   - Depletion trajectory visualization.

7. **💳 Subscriptions & Plan Entitlements**
   - **Free (₹0/mo)**: Basic dashboard, order overview, current inventory, 7-day history.
   - **Basic (₹799/mo)**: Sales reports, product analytics, low-stock indicators, 30-day history.
   - **Pro (₹1,999/mo)**: Advanced analytics, qualified profit estimates, inventory forecasting, unlimited history.
   - *Strict Server-Side Gating: Direct API calls cannot bypass plan entitlements.*

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Official Shopify React Router / Remix + Vite |
| **Language** | TypeScript (Strict mode enabled) |
| **Design System** | Shopify Polaris (`@shopify/polaris`) + Polaris Icons |
| **Embedded Client** | Shopify App Bridge (`@shopify/app-bridge-react`) |
| **Shopify Backend** | `@shopify/shopify-app-remix`, `@shopify/shopify-api` |
| **API Integration** | Shopify Admin GraphQL API (2025-01) |
| **Database & ORM** | PostgreSQL / SQLite with Prisma ORM |
| **Session Storage** | `@shopify/shopify-app-session-storage-prisma` |
| **Testing** | Vitest automated unit & integration test suite |

---

## 📂 Repository Structure

```
Storeanalysis-App/
├── app/
│   ├── root.tsx                         # Document shell & Polaris styles
│   ├── entry.server.tsx                 # Server streaming & App Bridge headers
│   ├── routes/
│   │   ├── app.tsx                      # Embedded navigation shell & plan badge
│   │   ├── app._index.tsx               # Main store overview dashboard
│   │   ├── app.analytics.tsx            # Sales & revenue analytics
│   │   ├── app.products.tsx             # Best-selling & slow-moving products
│   │   ├── app.inventory.tsx            # Real-time stock status & alerts
│   │   ├── app.orders.tsx               # Order & fulfillment overview
│   │   ├── app.forecasting.tsx          # Pro inventory forecasting
│   │   ├── app.pricing.tsx              # Subscription plans & billing
│   │   ├── app.settings.tsx             # Store settings, threshold & sync
│   │   ├── auth.$.tsx                   # Shopify OAuth handler
│   │   ├── auth.login.tsx               # Store login form
│   │   ├── webhooks.app.uninstalled.tsx # App uninstalled cleanup
│   │   ├── webhooks.orders.create.tsx   # Idempotent order processing
│   │   ├── webhooks.orders.updated.tsx  # Order update reconciler
│   │   ├── webhooks.inventory_levels.update.tsx # Live stock sync
│   │   └── webhooks.compliance.tsx      # Mandatory GDPR endpoints
│   ├── components/
│   │   ├── MetricCard.tsx               # KPI card with delta indicators
│   │   ├── SalesTrendChart.tsx          # Interactive SVG sales chart
│   │   ├── DateRangePicker.tsx          # Segmented date range filter
│   │   ├── ProductPerformanceTable.tsx  # Best/slow moving table
│   │   ├── LowStockTable.tsx            # Inventory warnings table
│   │   ├── PlanGateBanner.tsx           # Pro feature gating banner
│   │   └── ForecastChart.tsx            # Inventory depletion curve
│   ├── services/
│   │   ├── db.server.ts                 # Prisma singleton
│   │   ├── shopify.server.ts            # Shopify client & billing API
│   │   ├── analytics.server.ts          # Sales aggregation & deltas
│   │   ├── billing.server.ts            # Server-side entitlement checks
│   │   ├── orders.server.ts             # Admin GraphQL orders
│   │   ├── products.server.ts           # Admin GraphQL products
│   │   ├── inventory.server.ts          # Admin GraphQL inventory
│   │   ├── forecasting.server.ts        # Replenishment algorithms
│   │   ├── profit.server.ts             # Qualified profit estimates
│   │   ├── sync.server.ts               # Store sync & reconciliation
│   │   └── webhooks.server.ts           # HMAC verification & deduplication
│   ├── utils/
│   │   ├── money.ts                     # Decimal-safe currency formatting
│   │   ├── dates.ts                     # Range calculations & formatting
│   │   └── mockData.ts                  # Transparent demo fallbacks
│   └── types/
│       └── index.ts                     # Shared TypeScript interfaces
├── prisma/
│   └── schema.prisma                    # Tenant-isolated data models
├── tests/
│   ├── analytics.test.ts                # Formulas, deltas & money tests
│   ├── forecasting.test.ts              # Sufficiency & velocity tests
│   ├── profit.test.ts                   # Margin & disclosure tests
│   ├── billing.test.ts                  # Three-tier entitlement tests
│   └── webhooks.test.ts                 # HMAC security tests
├── shopify.app.toml                     # Shopify CLI app configuration
├── vite.config.ts                       # Vite bundler configuration
├── tsconfig.json                        # TypeScript configuration
├── vitest.config.ts                     # Test runner configuration
├── .env.example                         # Safe environment variables template
└── package.json                         # Scripts & dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or higher, tested on v26+)
- npm or pnpm
- Shopify Partner account with a development store

### 2. Installation
```bash
npm install
```

### 3. Database Setup
Generate the Prisma client:
```bash
npm run prisma:generate
```
Apply migrations for local development:
```bash
npx prisma db push
```

### 4. Running the App
Run with Shopify CLI:
```bash
npm run dev
```

### 5. Running Automated Tests
Execute the full test suite with Vitest:
```bash
npm test
```

---

## 🌐 Hosting & Production Deployment

For complete, step-by-step instructions on deploying Storeanalysis to a 24/7 cloud hosting service (Render, Fly.io, Railway, Docker, or VPS) and linking it to your Shopify Partner store, please read:

👉 **[Complete Deployment & Hosting Guide (DEPLOYMENT.md)](DEPLOYMENT.md)**

### Quick Reference:
- **Client ID**: `75d14d5d475920324080eb0fcb850342`
- **Development Store**: `my-store-5-m7gazbx4.myshopify.com`
- **Instant Preview Link**: [Open Storeanalysis in Shopify Admin](https://admin.shopify.com/store/my-store-5-m7gazbx4/apps/75d14d5d475920324080eb0fcb850342?dev-console=show)
- **Production Build**: `npm run build`
- **Deploy Configuration**: `shopify app deploy`

---

## 🔒 Security & Privacy Architecture

1. **Least-Privilege Scopes**: Requests only `read_orders`, `read_all_orders`, `read_products`, and `read_inventory`.
2. **HMAC Webhook Verification**: All incoming Shopify webhooks verify `X-Shopify-Hmac-Sha256` using constant-time comparison to prevent timing attacks.
3. **Webhook Deduplication**: Webhooks are hashed and verified against the `WebhookEvent` table to prevent duplicate accounting.
4. **Tenant Isolation**: Every database record is strictly linked to an authenticated `Shop.id`. Direct requests cannot query data belonging to other merchants.
5. **GDPR Compliance**: Implements all 3 mandatory Shopify compliance webhooks (`customers/data_request`, `customers/redact`, `shop/redact`). Storeanalysis does not collect or store unnecessary customer PII.
6. **Financial Disclosure Compliance**: Qualified profit calculations are clearly disclaimed as Gross Margin estimates based on variant unit costs, explicitly enumerating excluded operational overheads.

---

## 👤 Author Attribution
- **Brand**: Storeanalysis
- **Creator**: Pranshu Singh Baghel
