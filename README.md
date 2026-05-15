# StockSense AI

> AI-powered stock market intelligence dashboard

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?style=flat&logo=google&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.12-22c55e?style=flat)
![yFinance](https://img.shields.io/badge/yFinance-free-6366f1?style=flat)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=flat&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=flat&logo=render&logoColor=white)

**Live Demo:** [https://stocksense-ai-ten.vercel.app](https://stocksense-ai-ten.vercel.app)

**Backend API:** [https://stocksense-ai-17ld.onrender.com](https://stocksense-ai-17ld.onrender.com)

---

## Features

- **Real-time stock data** — price, % change, market cap, volume via yFinance (free, no API key)
- **Interactive price chart** — area chart with 1M / 3M / 6M / 1Y toggles
- **Technical indicators** — RSI gauge, MACD chart, 50-day and 200-day moving averages
- **Multi-stock comparison** — normalized return chart, add up to 5 tickers
- **AI market insights** — Gemini 1.5 Flash generates plain English analysis with a Regenerate button
- **Live news feed** — latest headlines per ticker via yFinance's built-in news
- **Dark / light mode** — system-aware toggle
- **Watchlist sidebar** — AAPL, GOOGL, TSLA, MSFT, AMZN with live mini-prices
- **Fully responsive** — works on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| Backend | Python + FastAPI |
| Data | yFinance (Yahoo Finance) |
| AI | Gemini 1.5 Flash (free tier) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render (free tier) |

---

## Architecture

```
Browser (React + Vite)
    │
    │  REST API calls (VITE_API_URL)
    ▼
FastAPI Backend (Render)
    ├── /stocks/{symbol}      ← yFinance: price, market cap, volume
    ├── /history/{symbol}     ← yFinance: OHLC data for charts
    ├── /indicators/{symbol}  ← computed: RSI, MACD, MA50, MA200
    ├── /compare              ← yFinance: normalized multi-stock returns
    ├── /ai-insight/{symbol}  ← yFinance data → Gemini 1.5 Flash prompt
    └── /news/{symbol}        ← yFinance: latest headlines
```

---

## Run Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start server
uvicorn main:app --reload --port 8000
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# .env already has: VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

App available at [http://localhost:3000](http://localhost:3000)

---

## Deploy

### Backend → Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect your repo
3. Set root directory to `backend/`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `GEMINI_API_KEY=your_key`
7. Deploy → copy your Render URL (e.g., `https://stocksense-ai-backend.onrender.com`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → connect your repo
2. Set root directory to `frontend/`
3. Add environment variable: `VITE_API_URL=https://your-render-backend-url.onrender.com`
4. Deploy

---

## Design Decisions

**Why FastAPI over Django?** FastAPI is purpose-built for APIs — automatic OpenAPI docs, async support, Pydantic validation, and 2-3x faster startup. Django is better for full-stack apps with templates; we don't need that overhead here.

**Why Recharts?** Composable React components that integrate naturally with state. Lightweight (~100KB), no D3 required, and the API is straightforward enough to not get in the way of UI work.

**Why dark theme?** Financial terminals (Bloomberg, TradingView) are universally dark for a reason — reduced eye strain during extended sessions, better contrast for colored price indicators, and the aesthetic signals "professional tool" to users.

**Why yFinance?** Zero cost, no API key required, covers real-time prices, historical OHLCV, fundamental data, and news in one library. The right call for a portfolio project where recurring API costs shouldn't be a concern.

**Why Gemini 1.5 Flash?** Free tier is generous (15 RPM, 1M TPD), fast response times, and the output quality is excellent for concise financial summaries. No cost, no OpenAI dependency.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stocks/{symbol}` | Current price, change, market cap, volume |
| GET | `/history/{symbol}?period=1mo` | OHLCV history (1mo/3mo/6mo/1y) |
| GET | `/indicators/{symbol}` | RSI, MACD, MA50, MA200 |
| GET | `/compare?symbols=AAPL,GOOGL&period=3mo` | Normalized price comparison |
| GET | `/ai-insight/{symbol}` | Gemini-generated market analysis |
| GET | `/news/{symbol}` | Latest news headlines |

---

## License

MIT
