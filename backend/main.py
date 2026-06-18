from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from google import genai as google_genai
import os
from dotenv import load_dotenv

from request_logger import RequestLoggerMiddleware, init_db, get_metrics

load_dotenv()

app = FastAPI(title="StockSense AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggerMiddleware)

init_db()


def _calc_rsi(close: pd.Series, period: int = 14) -> float:
    delta = close.diff()
    gain = delta.where(delta > 0, 0).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1])


@app.get("/")
def root():
    return {"message": "StockSense AI API is running", "version": "1.0.0"}


@app.get("/metrics")
def metrics():
    return get_metrics()


def _safe_info(ticker) -> dict:
    """Return ticker.info with fallback to empty dict if Yahoo's endpoint is flaky."""
    try:
        return ticker.info or {}
    except Exception:
        return {}


@app.get("/stocks/{symbol}")
def get_stock(symbol: str):
    symbol = symbol.upper()
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="5d")

    if hist.empty:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

    fi = ticker.fast_info  # always reliable
    info = _safe_info(ticker)  # best-effort for string fields

    current_price = float(hist["Close"].iloc[-1])
    prev_price = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
    change = current_price - prev_price
    change_pct = (change / prev_price) * 100

    def _fi(attr, fallback=None):
        try:
            v = getattr(fi, attr, None)
            return v if v is not None else fallback
        except Exception:
            return fallback

    return {
        "symbol": symbol,
        "name": info.get("longName", symbol),
        "price": round(current_price, 2),
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "market_cap": _fi("market_cap"),
        "volume": _fi("three_month_average_volume") or info.get("volume"),
        "avg_volume": _fi("three_month_average_volume"),
        "week_52_high": _fi("year_high"),
        "week_52_low": _fi("year_low"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
    }


@app.get("/history/{symbol}")
def get_history(symbol: str, period: str = "1mo"):
    valid_periods = {"1mo", "3mo", "6mo", "1y"}
    if period not in valid_periods:
        period = "1mo"

    ticker = yf.Ticker(symbol.upper())
    hist = ticker.history(period=period)

    if hist.empty:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

    data = [
        {
            "date": date.strftime("%Y-%m-%d"),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        }
        for date, row in hist.iterrows()
    ]

    return {"symbol": symbol.upper(), "period": period, "data": data}


@app.get("/indicators/{symbol}")
def get_indicators(symbol: str):
    symbol = symbol.upper()
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="1y")

    if hist.empty or len(hist) < 50:
        raise HTTPException(
            status_code=422, detail=f"Not enough historical data for {symbol}"
        )

    close = hist["Close"]

    ma50 = float(close.rolling(50).mean().iloc[-1])
    ma200 = (
        float(close.rolling(200).mean().iloc[-1]) if len(close) >= 200 else None
    )

    rsi = _calc_rsi(close)

    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    histogram = macd_line - signal_line

    macd_data = [
        {
            "date": hist.index[i].strftime("%Y-%m-%d"),
            "macd": round(float(macd_line.iloc[i]), 4),
            "signal": round(float(signal_line.iloc[i]), 4),
            "histogram": round(float(histogram.iloc[i]), 4),
        }
        for i in range(-60, 0)
    ]

    current_price = float(close.iloc[-1])

    return {
        "symbol": symbol,
        "current_price": round(current_price, 2),
        "ma50": round(ma50, 2),
        "ma200": round(ma200, 2) if ma200 and not np.isnan(ma200) else None,
        "rsi": round(rsi, 2),
        "macd_current": round(float(macd_line.iloc[-1]), 4),
        "signal_current": round(float(signal_line.iloc[-1]), 4),
        "macd_data": macd_data,
        "ma50_signal": "above" if current_price > ma50 else "below",
        "ma200_signal": (
            "above"
            if (ma200 and not np.isnan(ma200) and current_price > ma200)
            else "below"
        ),
    }


@app.get("/compare")
def compare_stocks(symbols: str = "AAPL,GOOGL,MSFT", period: str = "3mo"):
    symbol_list = [s.strip().upper() for s in symbols.split(",")][:5]

    series_map: dict[str, dict[str, float]] = {}
    for symbol in symbol_list:
        try:
            hist = yf.Ticker(symbol).history(period=period)
            if hist.empty:
                continue
            first = float(hist["Close"].iloc[0])
            series_map[symbol] = {
                date.strftime("%Y-%m-%d"): round((float(price) / first - 1) * 100, 2)
                for date, price in zip(hist.index, hist["Close"])
            }
        except Exception:
            continue

    if not series_map:
        raise HTTPException(status_code=404, detail="No valid symbols found")

    common_dates = sorted(
        set.intersection(*[set(v.keys()) for v in series_map.values()])
    )

    chart_data = [
        {"date": date, **{sym: series_map[sym][date] for sym in series_map}}
        for date in common_dates
    ]

    return {"symbols": list(series_map.keys()), "period": period, "data": chart_data}


@app.get("/ai-insight/{symbol}")
async def get_ai_insight(symbol: str):
    symbol = symbol.upper()
    try:
        ticker = yf.Ticker(symbol)
        info = _safe_info(ticker)
        hist = ticker.history(period="1mo")

        if hist.empty:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

        current_price = float(hist["Close"].iloc[-1])
        month_ago_price = float(hist["Close"].iloc[0])
        change_pct = (current_price - month_ago_price) / month_ago_price * 100
        rsi = _calc_rsi(hist["Close"])
        company_name = info.get("longName", symbol)

        def _fallback_insight(reason_suffix: str) -> dict:
            sentiment = "overbought" if rsi > 70 else "oversold" if rsi < 30 else "neutral"
            return {
                "symbol": symbol,
                "company_name": company_name,
                "insight": (
                    f"{company_name} is currently trading at ${current_price:.2f}, "
                    f"showing a {change_pct:+.1f}% move over the past month. "
                    f"The RSI of {rsi:.1f} indicates {sentiment} conditions. "
                    f"{reason_suffix}"
                ),
                "price": round(current_price, 2),
                "change_pct": round(change_pct, 2),
                "rsi": round(rsi, 2),
                "ai_powered": False,
            }

        gemini_key = os.getenv("GEMINI_API_KEY", "")
        placeholder = not gemini_key or gemini_key.startswith("your_")
        if placeholder:
            return _fallback_insight(
                "Add a real GEMINI_API_KEY to your .env file to enable AI-powered insights."
            )

        try:
            client = google_genai.Client(api_key=gemini_key)

            prompt = (
                f"You are a financial market analyst providing educational insights.\n"
                f"Analyze {company_name} ({symbol}) based on these data points:\n\n"
                f"- Current Price: ${current_price:.2f}\n"
                f"- 1-Month Change: {change_pct:+.1f}%\n"
                f"- RSI (14-day): {rsi:.1f}\n"
                f"- Sector: {info.get('sector', 'Unknown')}\n"
                f"- Industry: {info.get('industry', 'Unknown')}\n\n"
                f"Write exactly 3-4 sentences in plain English for a general audience. "
                f"Cover: recent price momentum, what the RSI reading suggests about "
                f"current market sentiment, and one key factor investors are watching. "
                f"Do NOT give specific buy/sell recommendations."
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash", contents=prompt
            )
            return {
                "symbol": symbol,
                "company_name": company_name,
                "insight": response.text,
                "price": round(current_price, 2),
                "change_pct": round(change_pct, 2),
                "rsi": round(rsi, 2),
                "ai_powered": True,
            }
        except Exception:
            return _fallback_insight(
                "AI insight unavailable — check your GEMINI_API_KEY."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _parse_news_item(item: dict):
    """Handle both old (flat) and new (nested content) yfinance news formats."""
    # yfinance >= 1.x nests everything under 'content'
    content = item.get("content", item)
    title = content.get("title", "")
    if not title:
        return None

    # publisher: nested provider.displayName or flat publisher
    provider = content.get("provider", {})
    publisher = provider.get("displayName", "") or content.get("publisher", "")

    # URL: nested canonicalUrl.url or clickThroughUrl.url or flat link
    canonical = content.get("canonicalUrl", {}) or {}
    click = content.get("clickThroughUrl", {}) or {}
    link = canonical.get("url") or click.get("url") or content.get("link", "")

    # timestamp: pubDate ISO string (new) or providerPublishTime epoch (old)
    pub_date = content.get("pubDate", "")
    pub_ts = content.get("providerPublishTime", 0)
    if pub_date and not pub_ts:
        try:
            from datetime import datetime, timezone
            pub_ts = int(
                datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                .timestamp()
            )
        except Exception:
            pub_ts = 0

    return {"title": title, "publisher": publisher, "link": link, "published_at": pub_ts}


@app.get("/news/{symbol}")
def get_news(symbol: str):
    symbol = symbol.upper()
    ticker = yf.Ticker(symbol)
    raw_news = ticker.news or []

    news = []
    for item in raw_news:
        parsed = _parse_news_item(item)
        if parsed is not None:
            news.append(parsed)
        if len(news) >= 8:
            break

    return {"symbol": symbol, "news": news}
