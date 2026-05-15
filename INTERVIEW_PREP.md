# StockSense AI — Interview Prep

Answers to the questions you'll actually get asked.

---

## 1. Walk me through the architecture

"StockSense AI is a full-stack web app split into a React frontend and a FastAPI backend, deployed on Vercel and Render respectively.

The frontend is a React + Vite + Tailwind app. When you load it, you pick a stock ticker — either from the watchlist sidebar or by searching. The app makes REST API calls to the backend and renders the data using Recharts.

The backend is a Python FastAPI server with six endpoints. Each endpoint uses yFinance to fetch data from Yahoo Finance — no API key required, completely free. For the technical indicator endpoint, I compute RSI, MACD, and moving averages in Python using pandas rather than a third-party library, so the calculations are transparent. For the AI Insights tab, I take the stock data, construct a prompt with real numbers, and send it to Gemini 1.5 Flash. The response comes back as plain English and gets rendered in the frontend.

The frontend talks to the backend via an environment variable — `VITE_API_URL` — so the same code works locally and in production without changes."

---

## 2. How does the AI insight feature work?

"When a user clicks the AI Insights tab, the frontend calls the `/ai-insight/{symbol}` endpoint on the backend.

The backend first fetches one month of price history and stock info from yFinance — things like current price, 1-month % change, sector, and industry. It also computes the RSI from the price history.

With that data, I construct a prompt that tells Gemini: here's the company, here's the price movement, here's the RSI reading, write 3-4 sentences of plain English analysis for a general audience. I explicitly instruct it not to give buy/sell recommendations — that keeps it educational.

The response text comes back and gets rendered in the UI with a disclaimer that it's for educational purposes only, not financial advice.

If the user hasn't configured a Gemini API key, the backend returns a fallback message built from the actual data — so the feature degrades gracefully instead of breaking."

---

## 3. What is RSI and why did you include it?

"RSI stands for Relative Strength Index. It's a momentum indicator that measures how quickly a stock's price has been moving relative to its recent history, on a scale from 0 to 100.

The formula: you take the average gain over 14 days and divide it by the average loss. RSI above 70 typically means a stock is overbought — it's risen quickly and may be due for a pullback. RSI below 30 means oversold — it's fallen sharply and may bounce.

I included it because it's one of the most universally understood technical indicators. Any recruiter with a finance background will immediately recognize it. More importantly, it's actionable — it gives you a single number that summarizes recent momentum, which pairs well with the AI insight feature where I pass the RSI value to Gemini as part of the prompt context."

---

## 4. How did you handle CORS between frontend and backend?

"CORS — Cross-Origin Resource Sharing — is a browser security policy that blocks a webpage from making requests to a different domain than the one it was loaded from.

In this app, the frontend is served from `stocksense-ai.vercel.app` and the backend runs on `stocksense-ai-backend.onrender.com` — two different domains. Without CORS headers, every API call would be blocked by the browser.

I solved it in FastAPI using the `CORSMiddleware` from Starlette, which FastAPI includes by default. During development I set `allow_origins=["*"]` to allow all origins. In production, you'd tighten that to the exact Vercel URL to prevent other sites from hitting your API.

The middleware adds the necessary `Access-Control-Allow-Origin` headers to every response, which tells the browser it's safe to use the data."

---

## 5. What would you add with more time?

"A few things in priority order:

**Portfolio tracking** — let users add positions with buy price and quantity. Show unrealized P&L and portfolio-level charts. This is the feature that would keep users coming back.

**Price alerts** — WebSocket connection from frontend to backend. When a watched stock crosses a threshold, push a browser notification. This moves the app from passive to active.

**Better chart types** — right now it's an area chart. A proper candlestick chart would make it look more like a real trading terminal. Recharts doesn't have native candlesticks, so this would mean either implementing a custom shape or swapping in a library like lightweight-charts from TradingView.

**Caching** — yFinance calls add latency. I'd add Redis on the backend to cache ticker responses for 60 seconds. The free tier on Render includes enough memory for this.

**Authentication** — user accounts so watchlists and alerts persist. Firebase Auth would let me add Google sign-in in under an hour."

---

## 6. How is this production-ready vs a toy project?

"A few things deliberately make this not just a homework project:

**Graceful degradation** — the AI feature has a fallback. If no Gemini key is configured, users still get real data-driven text instead of an error screen.

**Environment separation** — secrets live in `.env` files, never in code. The frontend uses `VITE_API_URL` so it can point to localhost in dev and the real backend in prod without touching source code.

**Proper error handling** — API errors return structured JSON with HTTP status codes (404 for missing symbols, 422 for insufficient data). The frontend surfaces these as readable messages rather than crashing.

**CORS done right** — the middleware is wired up, not hacked around.

**Responsive design** — tested on mobile viewport, not just desktop. The sidebar collapses, cards stack to 2-column, charts reflow.

**No secret leakage** — the Gemini API key lives only on the backend. The frontend never sees it. This is a basic but often-missed production requirement.

What it doesn't have yet: automated tests, a CI pipeline, database persistence, and rate limiting. Those are the gaps I'd close before calling it truly production-ready."
