# 🚀 EduVerse Deployment Guide (FREE Tier)

This project is optimized for the **Free Tier** of Render (Backend & Database) and Vercel (Frontend).

## 1. Backend & Database (Render Free Plan)

### A. Create PostgreSQL Database
1.  Go to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **PostgreSQL**.
3.  **Name**: `eduverse-db`
4.  **Plan**: Select **Free**.
5.  Click **Create Database**.
6.  **Copy Connection String**: Once created, copy the **Internal Database URL** (e.g., `postgres://user:pass@host/db`).

### B. Create Web Service
1.  Go to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repo: [FabTech_Hackathon-Eduverse](https://github.com/sankalpvasekar/FabTech_Hackathon-Eduverse).
4.  **Name**: `eduverse-backend`
5.  **Language**: `Python 3`
6.  **Build Command**: `cd eduverse-backend && pip install -r requirements.txt`
7.  **Start Command**: `cd eduverse-backend && uvicorn main:sio_app --host 0.0.0.0 --port $PORT`
8.  **Environment Variables**:
    -   `DATABASE_URL`: (Paste the **Internal Database URL** you copied in Step A)
    -   `GEMINI_API_KEY`: (Your Gemini key)
    -   `OPEN_ROUTER_KEY`: (Your OpenRouter key)
    -   `GROQ_API_KEY`: (Your Groq key)
    -   `EMAIL_HOST_USER`: (Your Email)
    -   `EMAIL_HOST_PASSWORD`: (Your App Password)
9.  Click **Create Web Service**.

---

## 2. Frontend (Vercel Free Plan)

### Steps:
1.  Go to [Vercel Dashboard](https://vercel.com/new).
2.  Import your GitHub repo.
3.  **Project Name**: `eduverse-frontend`
4.  **Framework Preset**: Other (Vite is auto-detected).
5.  **Root Directory**: `eduverse-frontend`
6.  **Build Command**: `npm run build`
7.  **Output Directory**: `dist`
8.  Click **Deploy**.

---

## 3. Database Migration
The platform is configured to automatically create tables on its first run (`startup` event in `main.py`). No manual SQL migration is required.

## 4. CORS Policy
The backend allows all origins (`*`) by default in production, ensuring the Vercel frontend can call the Render backend without issues.
