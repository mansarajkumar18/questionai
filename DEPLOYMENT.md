# Deploying Q-GEN AI on Vercel

This guide outlines how to deploy **Q-GEN AI** using Vercel.

---

## 1. Deploying the Frontend on Vercel (2-Minute Setup)

### Step 1: Import Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select and import your GitHub repository: `mansarajkumar18/questionai`.

### Step 2: Configure Project Settings
- **Framework Preset:** `Vite` (automatically detected).
- **Root Directory:**
  - If deploying from root: Leave as `./` (Root `vercel.json` will automatically build `client/dist`).
  - Or click **Edit** and set Root Directory to `client`.
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 3: Environment Variables
Add the following in Vercel Project Settings > **Environment Variables**:
- `VITE_API_URL`: Your deployed backend API URL (e.g. `https://your-backend.onrender.com/api/v1` or Railway URL).

### Step 4: Click Deploy
Vercel will build the frontend and issue your live HTTPS URL (e.g., `https://questionai.vercel.app`).

---

## 2. Deploying the Backend (Recommended: Render / Railway)

Because Q-GEN AI features a persistent SQLite/PostgreSQL database via Prisma, file upload processing (`uploads/`), and OCR engines, hosting the backend on a Node server environment ensures persistent storage and fast responses:

### Option A: Render (Free & Fast)
1. Go to [Render.com](https://render.com) and click **New Web Service**.
2. Connect `mansarajkumar18/questionai`.
3. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma db push && npx prisma generate && npx tsx prisma/seed.ts && npm run build`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `JWT_SECRET`: `your_random_secret_here`
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `PORT`: `5000`
5. Copy your Render backend URL (e.g., `https://questionai-api.onrender.com`) and paste it as `VITE_API_URL` in your Vercel frontend project!

### Option B: Railway (1-Click)
1. Go to [Railway.app](https://railway.app) > **New Project** > **Deploy from GitHub repo**.
2. Select `server` folder as root.
3. Railway automatically detects Node, installs packages, runs Prisma migrations, and assigns an HTTPS URL.

