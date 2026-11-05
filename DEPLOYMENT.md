# Deploying Q-GEN AI (Production Guide)

This guide provides end-to-end instructions for deploying **Q-GEN AI** with the frontend on **Vercel** and the backend on **Render** (or Railway).

---

## Architecture Overview

Q-GEN AI is a decoupled full-stack application:
- **Frontend (`client/`):** React 18, Vite 5, Tailwind CSS. Hosted statically on **Vercel Edge Network**.
- **Backend (`server/`):** Node.js Express, Prisma ORM, SQLite database (`dev.db`), Google Gemini AI, PDFKit. Hosted as a persistent service on **Render** or **Railway**.

---

## Why Full-Stack Requires a Decoupled Backend

If you deploy **only** the frontend to Vercel without deploying the backend or without setting `VITE_API_URL`:
1. Vercel only serves static HTML/JS/CSS files from `client/dist`.
2. The browser makes API requests to `/api/v1/*`.
3. Because Vercel has no persistent Node.js Express server running, Vercel looks for static files and returns **HTTP 404 Not Found**.
4. Furthermore, AI generation requests (taking ~10-25 seconds) and Tesseract OCR execution exceed Vercel's 10-second serverless execution limits.

**Solution:** Deploy the `server/` directory to Render (persistent Node.js runtime), copy the Render URL, and configure `VITE_API_URL` in Vercel.

---

## Step 1: Deploy Backend to Render

1. Sign in to [Render.com](https://render.com).
2. Click **New +** > **Web Service** (or use Blueprint with `render.yaml`).
3. Connect your GitHub repository: `mansarajkumar18/questionai`.
4. Fill in the deployment details:
   - **Name:** `qgen-api` (or any preferred name)
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
   - **Instance Type:** `Free` (or Starter for higher memory)
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PORT` | `5000` | Port for Express server |
   | `DATABASE_URL` | `file:./dev.db` | SQLite database location |
   | `JWT_SECRET` | `generate_a_random_32_char_secret_string` | Secret key for signing workspace tokens |
   | `GEMINI_API_KEY` | `your_actual_gemini_api_key` | From [Google AI Studio](https://aistudio.google.com/) |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Gemini model for AI question generation |
   | `NODE_ENV` | `production` | Production mode |
6. Click **Create Web Service**.
7. Once deployed, Render will issue a URL like:
   `https://qgen-api.onrender.com`
8. Verify it by opening `https://qgen-api.onrender.com/api/v1/health` in your browser. You should see:
   ```json
   { "status": "ok", "service": "Q-GEN AI Backend Engine", "database": "healthy" }
   ```

---

## Step 2: Configure Frontend on Vercel

1. Go to your project on the [Vercel Dashboard](https://vercel.com).
2. Ensure Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (or leave default root)
   - **Build Command:** `cd client && npm install && npm run build` (handled automatically by `vercel.json`)
   - **Output Directory:** `client/dist`
3. Navigate to **Settings** > **Environment Variables**.
4. Add the following variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://qgen-api.onrender.com/api/v1` *(replace with your actual Render URL)*
   - **Environments:** Check `Production`, `Preview`, and `Development`.
5. Click **Save**.
6. Go to the **Deployments** tab, click the **...** (three dots) next to the latest deployment, and click **Redeploy**.
   > *Note: Vite bakes environment variables into the static bundle during build time. Redeploying is required for the new variable to take effect.*

---

## Step 3: Open Direct Dashboard in Production

Once redeployed, open your Vercel URL (e.g., `https://questionai.vercel.app`):
- The dashboard opens directly with zero authentication barriers or login redirects.
- Educational boards (CBSE, ICSE, NEET, etc.) load directly from the Render API.
- Syllabus uploads (PDF/Image) and AI Question Paper Generation work end-to-end.
