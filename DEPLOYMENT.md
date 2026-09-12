# SahajCredit — Cloud Deployment Guide (Vercel + Render)

This guide walks you through deploying **SahajCredit** to production:
- **Backend (Python Microservices + ML Engine)** on **[Render](https://render.com)**
- **Frontend (Next.js Dashboard)** on **[Vercel](https://vercel.com)**

---

## Part 1: Deploy Backend to Render

Render will run your 7 microservices in a single Docker container and expose the API Gateway on a public HTTPS URL.

### Steps:
1. **Push Changes to GitHub**:
   Ensure all changes are committed and pushed to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure production deployment for Vercel and Render"
   git push origin main
   ```

2. **Create Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and log in.
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository: `Umesh-369/SahajCredit`.
   - Configure the following settings:
     - **Name**: `sahajcredit-api` (or your preferred name)
     - **Region**: Oregon (US West) or closest to your users
     - **Language / Runtime**: `Docker`
     - **Dockerfile Path**: `Dockerfile.render`
     - **Instance Type**: `Free` (or `Starter` if you want persistent disk)
   - Click **Advanced** and verify/add Environment Variables if desired:
     - `APPLICATION_DB_PATH`: `/app/data/app_data/application_service.db`
     - `AUDIT_DB_PATH`: `/app/data/audit_data/audit_service.db`
   - Click **Create Web Service**.

3. **Wait for Build & Copy URL**:
   - Render will build the Docker container and start all 7 services.
   - Once deployment completes and health check passes (`/health`), copy your Render URL, e.g.:
     `https://sahajcredit-api.onrender.com`

---

## Part 2: Deploy Frontend to Vercel

Vercel provides edge hosting and automatic continuous deployment for your Next.js application.

### Steps:
1. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and log in.
   - Select your GitHub repository: `SahajCredit`.
   - In the project configuration:
     - **Framework Preset**: Next.js (auto-detected)
     - **Root Directory**: Click **Edit** and choose `frontend`
2. **Set Environment Variable**:
   - Expand the **Environment Variables** section.
   - Add:
     - **Key**: `NEXT_PUBLIC_API_URL`
     - **Value**: Your Render backend URL from Part 1 (e.g. `https://sahajcredit-api.onrender.com`)
3. **Deploy**:
   - Click **Deploy**.
   - Vercel will build and deploy your frontend in ~1 minute.
   - You will get a live URL like: `https://sahaj-credit.vercel.app`.

---

## Verification & Testing

Once both are deployed:
1. Open your Vercel URL in your browser.
2. Navigate to **System & Settings** (`/settings` tab) and click **Ping Services** — all backend microservices should report `Operational`.
3. Submit an evaluation under **Application Wizard** — verify that the ML credit engine scores the application, rules are evaluated, and the SHA-256 audit ledger records the decision.
4. Visit **Audit Ledger** and **Fairness Monitor** to confirm the end-to-end data pipeline is active.
