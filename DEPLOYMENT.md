# Deploying Q-GEN AI (Production Guide)

This guide provides end-to-end instructions for deploying **Q-GEN AI** with the frontend on **Vercel** and the backend on **Render** (or Railway).

---

## Architecture Overview

Q-GEN AI is a decoupled full-stack application:
- **Frontend (`client/`):** React 18, Vite 5, Tailwind CSS. Hosted statically on **Vercel Edge Network**.
- **Backend (`server/`):** Node.js Express, Prisma ORM, SQLite database (`dev.db`), Google Gemini AI, PDFKit. Hosted as a persistent service on **Render** or **Railway**.

---

## Why Authentication Failed with a 404 on Vercel

If you deploy **only** the frontend to Vercel without deploying the backend or without setting `VITE_API_URL`:
1. Vercel only serves static HTML/JS/CSS files from `client/dist`.
2. The browser makes requests to `https://your-vercel-domain.vercel.app/api/v1/auth/login`.
3. Because Vercel has no Node.js Express server running, Vercel looks for a static file named `/api/v1/auth/login`.
4. It does not exist, so Vercel returns **HTTP 404 Not Found**.

**Solution:** Deploy the `server/` directory to Render (takes 2 minutes, free), copy the Render URL, and add `VITE_API_URL` to Vercel.

---

## Step 1: Deploy Backend to Render (2 Minutes)

1. Sign in to [Render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `mansarajkumar18/questionai`.
4. Fill in the deployment details:
   - **Name:** `qgen-api` (or any name you prefer)
   - **Region:** Any (e.g. Frankfurt, Singapore, Oregon)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npx tsx prisma/seed.ts && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PORT` | `5000` | Port for Express server |
   | `JWT_SECRET` | `generate_a_random_32_char_secret_string` | Secret key for signing JWT tokens |
   | `GEMINI_API_KEY` | `your_actual_gemini_api_key` | From [Google AI Studio](https://aistudio.google.com/) |
   | `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model for AI question generation |
   | `NODE_ENV` | `production` | Production mode |
6. Click **Create Web Service**.
7. Once deployed, Render will issue a URL like:
   `https://qgen-api.onrender.com`
8. Verify it by opening `https://qgen-api.onrender.com/api/health` in your browser. You should see:
   ```json
   { "status": "ok", "service": "Q-GEN AI Backend Engine", "database": "healthy" }
   ```

---

## Step 2: Configure Frontend on Vercel

1. Go to your project on [Vercel Dashboard](https://vercel.com).
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://qgen-api.onrender.com/api/v1` *(replace with your actual Render URL)*
   - **Environments:** Check `Production`, `Preview`, and `Development`.
4. Click **Save**.
5. Go to the **Deployments** tab, click the **...** (three dots) next to the latest deployment, and click **Redeploy** (or push a new commit to GitHub).
   > *Note: Vite bakes environment variables into the static bundle during the build. Redeploying is required for the new variable to take effect.*

---

## Step 3: Log In to Production

Once redeployed, open your Vercel URL (e.g., `https://questionai.vercel.app/login`):
- **Email / Username:** `manasa@158` (or `manasa@gmail.com`)
- **Password:** `12345678`

Or log in with the administrator account:
- **Email:** `admin@qgenai.edu`
- **Password:** `AdminPassword123!`

The request will reach your Render backend, validate the password against SQLite, and authenticate into the Dashboard!
