from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="StockSense AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.get("/stocks/{symbol}")
def get_stock(symbol: str):
    symbol = symbol.upper()
    ticker = yf.Ticker(symbol)
    info = ticker.info
    hist = ticker.history(period="5d")

    if hist.empty:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

    current_price = float(hist["Close"].iloc[-1])
    prev_price = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
    change = current_price - prev_price
    change_pct = (change / prev_price) * 100

    return {
        "symbol": symbol,
        "name": info.get("longName", symbol),
        "price": round(current_price, 2),
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "market_cap": info.get("marketCap"),
        "volume": info.get("volume"),
        "avg_volume": info.get("averageVolume"),
        "pe_ratio": info.get("trailingPE"),
        "week_52_high": info.get("fiftyTwoWeekHigh"),
        "week_52_low": info.get("fiftyTwoWeekLow"),
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
        info = ticker.info
        hist = ticker.history(period="1mo")

        if hist.empty:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")

        current_price = float(hist["Close"].iloc[-1])
        month_ago_price = float(hist["Close"].iloc[0])
        change_pct = (current_price - month_ago_price) / month_ago_price * 100
        rsi = _calc_rsi(hist["Close"])
        company_name = info.get("longName", symbol)

        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            sentiment = (
                "overbought" if rsi > 70 else "oversold" if rsi < 30 else "neutral"
            )
            fallback = (
                f"{company_name} is currently trading at ${current_price:.2f}, "
                f"showing a {change_pct:+.1f}% move over the past month. "
                f"The RSI of {rsi:.1f} indicates {sentiment} conditions. "
                f"Configure GEMINI_API_KEY in your .env file to enable AI-powered insights."
            )
            return {
                "symbol": symbol,
                "company_name": company_name,
                "insight": fallback,
                "price": round(current_price, 2),
                "change_pct": round(change_pct, 2),
                "rsi": round(rsi, 2),
                "ai_powered": False,
            }

        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are a financial market analyst providing educational insights.
Analyze {company_name} ({symbol}) based on these data points:

- Current Price: ${current_price:.2f}
- 1-Month Change: {change_pct:+.1f}%
- RSI (14-day): {rsi:.1f}
- Sector: {info.get('sector', 'Unknown')}
- Industry: {info.get('industry', 'Unknown')}
- Market Cap: {info.get('marketCap', 'Unknown')}

Write exactly 3-4 sentences in plain English for a general audience. Cover: recent price momentum, what the RSI reading suggests about current market sentiment, and one key factor investors are watching. Do NOT give specific buy/sell recommendations."""

        response = model.generate_content(prompt)

        return {
            "symbol": symbol,
            "company_name": company_name,
            "insight": response.text,
            "price": round(current_price, 2),
            "change_pct": round(change_pct, 2),
            "rsi": round(rsi, 2),
            "ai_powered": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/news/{symbol}")
def get_news(symbol: str):
    symbol = symbol.upper()
    ticker = yf.Ticker(symbol)
    raw_news = ticker.news or []

    news = [
        {
            "title": item.get("title", ""),
            "publisher": item.get("publisher", ""),
            "link": item.get("link", ""),
            "published_at": item.get("providerPublishTime", 0),
        }
        for item in raw_news[:8]
    ]

    return {"symbol": symbol, "news": news}
