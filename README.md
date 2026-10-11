# MediChain Omni — Clinical Intelligence Core

Federated Clinical Intelligence Network, Tiger Data Sentinel, Snowflake Vector RAG, and Solana Consent Layer.

## 🏥 Overview

MediChain Omni is an intelligent clinical decision support and outbreak surveillance platform designed to bridge hospital telemetry, federated outbreak analytics, and immutable patient audit trails.

- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind CSS, Lucide icons, Three.js)
- **Backend**: FastAPI (Python), Sentinel Engine, Vector RAG (Snowflake & Healthcare Datasets), Live Outbreak Scraper, Solana Audit Trail

---

## 📁 Repository Structure

```
.
├── backend/                  # FastAPI intelligence server & analytics engines
│   ├── main.py               # API endpoints & core orchestrator
│   ├── sentinel.py           # Delhi-NCR Outbreak Sentinel engine
│   ├── healthcare_vector_db.py # Vector similarity search & RAG
│   ├── live_outbreak_scraper.py # Real-time outbreak registry
│   ├── snowflake_kb.py       # Snowflake knowledge base integration
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container definition for container platforms
│   ├── Procfile              # Process runner for Railway/Heroku/Render
│   └── .env.example          # Environment variables template
│
├── frontend/                 # Next.js clinical dashboard
│   ├── src/
│   │   ├── app/              # App router pages & layouts
│   │   └── components/       # Clinical UI decks, radar map, 3D anatomical viewer
│   ├── package.json          # Node dependencies & scripts
│   └── .env.example          # Frontend configuration template
│
├── .github/workflows/        # Automated CI/CD workflow
└── render.yaml               # Render Infrastructure Blueprint
```

---

## 🌐 Full Stack Deployment Guide

### Option A: Frontend on Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository `khushalgoel/MediChainOmni`.
3. Set the project root directory to `frontend`; Vercel will detect the Next.js app.
4. Add your environment variables:
   - `NEXT_PUBLIC_API_URL`: The public URL of your deployed backend (do not use `localhost` in production).
5. Click **Deploy**.

Keep Gemini and ElevenLabs API keys in the backend's server-side environment only. Do not expose them as `NEXT_PUBLIC_*` variables.

### Option B: Backend on Render (1-Click Blueprint)
1. Go to [render.com](https://render.com) and click **"New" -> "Blueprint"**.
2. Connect your GitHub repository `khushalgoel/MediChainOmni`.
3. Render reads [`render.yaml`](render.yaml) automatically and provisions the backend on the free plan.
4. If you use the external providers, add their keys as server-side environment variables in the Render dashboard:
   - `GEMINI_API_KEY` or `GEMINI_API_KEYS`
   - `ELEVENLABS_API_KEY`
5. Click **Apply**. Render gives you a public URL (e.g., `https://medichain-omni-backend.onrender.com`).
6. Paste this URL into the frontend's `NEXT_PUBLIC_API_URL` environment variable in Vercel, then redeploy the frontend.

The free backend may spin down after inactivity, so the first request can take longer while it starts.

### Option C: Backend on Railway
1. Go to [railway.app](https://railway.app) and create **"New Project from GitHub Repo"**.
2. Select `khushalgoel/MediChainOmni`.
3. In settings, set the **Root Directory** to `/backend`.
4. Add your environment variables and Railway will deploy automatically.

---

## 🚀 Local Development

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Run FastAPI server
uvicorn main:app --reload --port 8000
```

The API docs will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local if needed

# Run Next.js dev server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔒 Security Note

Never commit `.env` or `.env.local` files to version control. Reference `.env.example` templates for required variables.
