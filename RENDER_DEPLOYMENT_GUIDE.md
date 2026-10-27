# Storeanalysis — Render Production Deployment Guide

**Application:** Storeanalysis by Pranshu Singh Baghel  
**Target Deployment Server:** [Render Dashboard](https://dashboard.render.com)  
**Shopify App Pricing Guideline Reference:** [Shopify App Pricing Documentation](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing)

---

## Architecture & Deployment Overview

Storeanalysis is built on Shopify Remix / React Router, Node.js, Prisma, and Polaris.

When deploying to Render, the web service runs with:
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm run start:prod` (automatically runs `prisma db push --accept-data-loss` to initialize or update database tables before starting the Remix SSR server on the assigned port).
- **Database:** SQLite with a 1 GB persistent disk mounted at `/data/production.sqlite` (or Render Managed PostgreSQL).

---

## Deployment Option A: 1-Click Render Blueprint (Recommended)

Render Blueprints (`render.yaml`) automatically configure the Web Service, Persistent Disk, and environment specifications.

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: pricing modal and render deployment configuration"
   git push origin main
   ```

2. **Open Render Dashboard:**
   - Navigate to [https://dashboard.render.com](https://dashboard.render.com).
   - Click **New +** in the top right and select **Blueprint**.
   - Connect your GitHub repository (`Storeanalysis-Shopify-app` or similar).

3. **Provide Secrets:**
   Render will inspect `render.yaml` and prompt you for the un-synced variables:
   - `SHOPIFY_API_SECRET`: (Get this from your Shopify Partner Dashboard → App setup)
   - `SHOPIFY_APP_URL`: Enter your Render assigned URL (e.g., `https://storeanalysis.onrender.com`)

4. **Click Apply:**
   Render will create the service, mount the `/data` persistent disk, run migrations, and launch your application.

---

## Deployment Option B: Manual Web Service Setup on Render

If you prefer to configure the Web Service manually in the Render UI:

1. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Select your GitHub repository.
3. Configure the following settings:
   - **Name:** `storeanalysis` (or your preferred name)
   - **Region:** `Oregon (US West)` (or closest to your Shopify primary merchant base)
   - **Branch:** `main`
   - **Root Directory:** leave blank
   - **Runtime:** `Node` (or `Docker` using the included `Dockerfile`)
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Instance Type:** `Starter` ($7/mo) — *Required on Render when attaching a persistent disk*.

4. **Attach Persistent Disk (for SQLite):**
   - Scroll down to **Disks** and click **Add Disk**.
   - **Name:** `sqlite-data`
   - **Mount Path:** `/data`
   - **Size:** `1 GB`

5. **Add Environment Variables:**
   Click **Environment Variables** and add:

   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `3000` | Port for web server |
   | `SHOPIFY_API_KEY` | `75d14d5d475920324080eb0fcb850342` | Your Shopify App Client ID |
   | `SHOPIFY_API_SECRET` | *(Your Secret)* | App secret key from Partner Dashboard |
   | `SHOPIFY_APP_URL` | `https://storeanalysis.onrender.com` | Your live Render domain with `https://` |
   | `SCOPES` | `read_orders,read_all_orders,read_products,read_inventory` | Required API scopes |
   | `DATABASE_URL` | `file:/data/production.sqlite` | SQLite file path on the persistent disk |
   | `SHOPIFY_BILLING_TEST` | `false` | Set to `true` only for dev store testing |
   | `SHOPIFY_APP_HANDLE` | `storeanalysis` | App handle from `shopify.app.toml` |
   | `SHOPIFY_USE_MANAGED_PRICING`| `false` | Set to `true` if using Partner hosted page |

6. Click **Create Web Service**.

---

## Step 2: Update Shopify Partner Dashboard URLs

Once your Render app is live (e.g. `https://storeanalysis.onrender.com`):

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com).
2. Select your app: **storeanalysis**.
3. Click **App setup** in the sidebar.
4. Update the **App URL:**
   ```text
   https://storeanalysis.onrender.com
   ```
5. Update **Allowed redirection URL(s):**
   ```text
   https://storeanalysis.onrender.com/auth/callback
   https://storeanalysis.onrender.com/auth/shopify/callback
   https://storeanalysis.onrender.com/api/auth/callback
   ```
6. Click **Save** in the top right.

---

## Step 3: Configure Shopify App Pricing in Partner Dashboard

In accordance with [Shopify App Pricing Guidelines](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing):

1. In the Partner Dashboard, click **Distribution**.
2. Under **Shopify App Store listing**, click **Manage listing**.
3. Under **Pricing content**, click **Manage**.
4. In **Settings**:
   - Pricing method: select **Shopify App Pricing** (or keep Manual Pricing if using direct Billing API).
   - Default billing frequency: **Monthly**.
5. Configure the 3 tiers:
   - **Free Plan:** `$0` (Free forever)
   - **Basic Plan:** `$9.99` / month, 7-day free trial
   - **Pro Plan:** `$29.99` / month, 7-day free trial
6. Set the **Welcome / Redirection Link** for plans:
   ```text
   /app/pricing
   ```

---

## Post-Deployment Smoke Test Checklist

- [ ] Visit `https://storeanalysis.onrender.com` to confirm it redirects to Shopify authentication or renders the login prompt.
- [ ] Open the app inside your Shopify development store admin.
- [ ] Check the top navigation bar: verify the app logo, store name, and plan badge render correctly.
- [ ] Click the **"Upgrade"** / **"Manage Plan"** button next to the badge in the navigation bar to verify the **Pricing Modal** opens cleanly.
- [ ] On the **Forecasting** page (`/app/forecasting`), verify the Pro entitlement gate displays USD pricing (`$29.99/mo`) and that clicking "Upgrade" opens the Pricing Modal.
- [ ] Verify that selecting a plan initiates the Shopify Billing authorization screen and redirects back to `/app/pricing` with the subscription confirmed banner.
