# Q-GEN AI — Environment Setup & Configuration Guide

This guide explains how to configure environment variables and secrets for Q-GEN AI.

---

## 1. Backend Environment Configuration (`server/.env`)

Create or update `server/.env` based on `server/.env.example`:

```bash
# Server Port
PORT=5000

# SQLite Database Connection String
DATABASE_URL="file:./dev.db"

# JWT Secret for Session Signing
JWT_SECRET="q_gen_ai_super_secret_jwt_key_2026_standalone"
JWT_EXPIRES_IN="7d"

# Google Gemini API Configuration
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"

# Uploads Directory Path
UPLOAD_DIR="./uploads"

# Client Application URL
FRONTEND_URL="http://localhost:5173"
```

### Key Variables Description

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Optional | `5000` | Port for the Express backend server. |
| `DATABASE_URL` | **Required** | `file:./dev.db` | SQLite database file location (or PostgreSQL URI). |
| `JWT_SECRET` | **Required** | - | Secret string used for signing and verifying JWT tokens. |
| `GEMINI_API_KEY` | Optional | - | Google Gemini API key. Can also be entered dynamically in the in-app **Settings** UI. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model to use (`gemini-2.5-flash`, `gemini-1.5-pro`). |
| `UPLOAD_DIR` | Optional | `./uploads` | Directory where uploaded syllabus files are temporarily stored. |

---

## 2. Frontend Environment Configuration (`client/.env`)

Create or update `client/.env` based on `client/.env.example`:

```bash
# API Base Endpoint (Vite reverse-proxies this in development)
VITE_API_URL=/api/v1
VITE_APP_NAME="Q-GEN AI"
VITE_APP_VERSION="1.0.0"
```

---

## 3. Database Migration & Seeding Commands

Run these commands inside the `server/` directory:

```bash
# 1. Sync database schema with SQLite
npx prisma db push

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed initial educational boards & blueprints
npx tsx prisma/seed.ts
```

---

## 4. Starting the Application

### Start Backend Server:
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

### Start Frontend Application:
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```
