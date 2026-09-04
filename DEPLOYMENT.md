# MetrologyAI — Production Deployment Guide

This guide provides end-to-end instructions for deploying **MetrologyAI** (FastAPI Backend + React/Vite Frontend + OCR & AI Engine) to cloud providers including **Render**, **Vercel**, **Railway**, and **Docker**.

---

## Architecture Overview

```
[ Client Browser ]
        │
        ▼
[ Frontend (Vercel / Netlify / Nginx) ]
        │
        │ API Requests (/api/*)
        ▼
[ Backend (Render / Railway / Docker) ]
  ├── FastAPI (Python 3.11)
  ├── Tesseract OCR (Multi-Pass CLAHE + Hindi/Tamil/Telugu)
  ├── PCR 2011 Regulatory Engine
  └── SQLite (Default) or PostgreSQL (Production)
```

---

## Option 1: Render (Backend) + Vercel (Frontend) — *Recommended*

### Step 1: Deploy Backend on Render.com

1. Create an account on [Render.com](https://render.com).
2. Click **New +** → **Blueprint** and connect your GitHub repository containing the `metrology-ai` project.
3. Render will detect `render.yaml` automatically, which provisions:
   - **Backend Web Service**: Python 3.11 with Tesseract OCR system packages.
   - **PostgreSQL Database**: Free-tier or starter managed database.
   - **Persistent Disk (Optional)**: For uploaded package images and PDF reports.
4. If deploying manually without Blueprint:
   - **Environment**: Python
   - **Root Directory**: `backend`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     ```bash
     DATABASE_URL=postgresql://user:password@host/dbname   # From Render Postgres
     JWT_SECRET_KEY=generate-a-random-32-character-secret-key
     OCR_PROVIDER=auto
     AI_PROVIDER=builtin
     DEBUG=false
     CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
     ```
5. Copy your backend service URL (e.g. `https://metrologyai-backend.onrender.com`).

---

### Step 2: Deploy Frontend on Vercel

1. Create an account on [Vercel.com](https://vercel.com).
2. Click **Add New Project** and select your repository.
3. Configure the project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   ```bash
   VITE_API_URL=https://metrologyai-backend.onrender.com
   ```
5. Click **Deploy**.
   > **Note**: `frontend/vercel.json` is already configured with rewrite rules to support client-side SPA routing (`/analyze`, `/dashboard`, `/rules`, `/login`).

6. Go back to Render backend settings and update `CORS_ORIGINS` to include your new Vercel domain.

---

## Option 2: Full Docker / Docker Compose Deployment

MetrologyAI includes a production-ready `docker-compose.yml` that builds and starts both the FastAPI backend and Nginx-powered frontend in containers.

### Prerequisites:
- Docker installed (`docker --version`)
- Docker Compose installed (`docker compose version`)

### Single-Command Start:
```bash
# In project root:
docker compose up --build -d
```

### Access Services:
- **Frontend & App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### Stop Services:
```bash
docker compose down
```

---

## Option 3: Railway Deployment

1. Install Railway CLI or go to [Railway.app](https://railway.app).
2. **Backend**:
   - Create a service pointing to `backend/Dockerfile`.
   - Add PostgreSQL plugin and link `DATABASE_URL`.
   - Set environment variables (`JWT_SECRET_KEY`, `OCR_PROVIDER=auto`, `CORS_ORIGINS=*`).
3. **Frontend**:
   - Create a service pointing to `frontend/Dockerfile`.
   - Set `VITE_API_URL` to the public Railway backend URL.

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./metrology.db` | Connection string (`sqlite:///...` or `postgresql://...`) |
| `JWT_SECRET_KEY` | *(Required)* | 32+ character secret for signing JWT tokens |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_EXPIRATION_HOURS` | `24` | Token lifetime |
| `OCR_PROVIDER` | `auto` | `auto` (detects Tesseract, falls back to demo), `tesseract`, or `demo` |
| `AI_PROVIDER` | `builtin` | `builtin` (built-in rule evaluator), `gemini`, or `openai` |
| `CORS_ORIGINS` | `*` | Comma-delimited list of allowed origin URLs |
| `DEBUG` | `false` | Enable/disable debug mode |

### Frontend (`frontend/.env.production`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of deployed backend (e.g. `https://metrologyai-backend.onrender.com`) |

---

## Pre-Seeded Demonstration Accounts

For demonstration, client testing, and regulatory evaluation, the database auto-seeds these accounts on first run:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Field Inspector** | `inspector@metrology.ai` | `inspector123` | Create inspections, run scans, generate reports |
| **Compliance Officer** | `admin@metrology.ai` | `admin123` | Full dashboard, rules administration, system settings |
| **Consumer / Public** | `consumer@metrology.ai` | `consumer123` | Public scan & verification tool |

> **Note**: Anyone can also test packaging labels instantly without logging in via the **Instant Scanner** (`/analyze`).
