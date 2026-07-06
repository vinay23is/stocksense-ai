# StockSense AI

An AI-powered stock market intelligence dashboard: live prices, technical indicators, multi-stock comparison, and plain-English AI market commentary in one screen.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat&logo=google&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.12-22c55e?style=flat)
![yFinance](https://img.shields.io/badge/yFinance-free-6366f1?style=flat)

**Live Demo:** [stocksense-ai-ten.vercel.app](https://stocksense-ai-ten.vercel.app)

## What problem does this solve?
Getting a real read on a stock usually means stitching together a price chart, technical indicators, recent news, and some idea of market sentiment from three or four different tools. StockSense AI puts all of that in one dashboard — live price and volume, RSI/MACD/moving averages, a normalized multi-stock comparison chart, a live news feed, and an AI-generated plain-English summary of what's going on with the stock — so you get a full picture without hopping between sites.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS, Recharts for charting, deployed on Vercel
- **Backend:** Python + FastAPI, deployed on Render (`stocksense-ai-17ld.onrender.com`) — serves the REST API the frontend calls via `VITE_API_URL`
- **Data source:** yFinance (Yahoo Finance) — free, no API key, covers real-time price, historical OHLCV, and news
- **AI:** Google Gemini (`gemini-2.5-flash`) generates the market-insight summaries
- **Observability:** a small SQLite-backed request-logging middleware (`request_logger.py`) records endpoint, method, status, and latency for every API call, exposed via a `/metrics` endpoint

## Architecture
```
Browser (React + Vite)
    |
    |  REST API calls (VITE_API_URL)
    v
FastAPI Backend (Render)
    +-- /stocks/{symbol}      <- yFinance: price, market cap, volume
    +-- /history/{symbol}     <- yFinance: OHLC data for charts
    +-- /indicators/{symbol}  <- computed: RSI, MACD, MA50, MA200
    +-- /compare              <- yFinance: normalized multi-stock returns
    +-- /ai-insight/{symbol}  <- yFinance data -> Gemini 2.5 Flash prompt
    +-- /news/{symbol}        <- yFinance: latest headlines
    +-- /metrics              <- SQLite-logged request stats
```

## Key Features
- Real-time price, % change, market cap, and volume via yFinance.
- Interactive price chart with 1M / 3M / 6M / 1Y range toggles.
- Technical indicators computed server-side: RSI gauge, MACD chart, 50-day and 200-day moving averages.
- Multi-stock comparison — normalized return chart for up to 5 tickers at once.
- AI market insights: Gemini reads the current price, 1-month change, RSI, sector, and industry, and writes a 3-4 sentence plain-English summary (with a Regenerate button), explicitly instructed not to give buy/sell advice.
- Live news feed per ticker, dark/light mode, a watchlist sidebar with live mini-prices, and a fully responsive layout.

## Interesting Engineering Decisions
- **AI insight has a deterministic fallback, not just a spinner:** `/ai-insight/{symbol}` in `backend/main.py` checks for a real `GEMINI_API_KEY` before calling the model, and if the key is missing or the Gemini call throws, it falls back to a rule-based summary (RSI-derived "overbought/oversold/neutral" sentiment, computed directly from the price data) instead of failing the request. The response includes an `ai_powered` flag so the frontend can be transparent about which path produced the text.
- **Defensive parsing around a third-party data source:** yFinance's `.news` payload shape changed between versions (flat fields vs. a nested `content` object), so `_parse_news_item()` handles both formats, and `_safe_info()` wraps `ticker.info` in a try/except because Yahoo's info endpoint is noticeably flakier than `fast_info`. This is the kind of defensive coding that matters when you don't control the upstream data provider's API stability.
- **Request logging middleware over a hosted APM tool:** rather than wiring up a third-party observability service, `request_logger.py` is a small Starlette middleware that logs endpoint, method, status, and latency to a local SQLite file and exposes it via `/metrics` — a lightweight way to demonstrate API observability without adding an external dependency or cost.
- **yFinance over a paid market-data API:** zero cost, no API key, and one library covers real-time price, historical OHLCV, and news — the right tradeoff for a portfolio project where a recurring data-provider bill isn't justified.

## Running Locally

### Prerequisites
- Python 3.11+, Node.js 18+
- A free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```
API docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend
```bash
cd frontend
npm install
cp .env.example .env         # defaults to VITE_API_URL=http://localhost:8000
npm run dev
```
App available at [http://localhost:3000](http://localhost:3000)

## License
MIT
