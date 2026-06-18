import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

DB_PATH = Path(__file__).parent / "request_logs.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS request_logs (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint  TEXT    NOT NULL,
                method    TEXT    NOT NULL,
                status    INTEGER NOT NULL,
                latency   REAL    NOT NULL,
                ts        TEXT    NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_endpoint ON request_logs(endpoint)")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        latency_ms = (time.perf_counter() - start) * 1000

        endpoint = request.url.path
        ts = datetime.now(timezone.utc).isoformat()

        try:
            with _get_conn() as conn:
                conn.execute(
                    "INSERT INTO request_logs (endpoint, method, status, latency, ts) VALUES (?,?,?,?,?)",
                    (endpoint, request.method, response.status_code, round(latency_ms, 2), ts),
                )
        except Exception:
            pass

        return response


def get_metrics() -> dict:
    with _get_conn() as conn:
        rows = conn.execute("""
            SELECT
                endpoint,
                COUNT(*)                                          AS total_requests,
                ROUND(AVG(latency), 2)                           AS mean_latency_ms,
                ROUND(SUM(CASE WHEN status >= 400 THEN 1.0 ELSE 0.0 END) / COUNT(*), 4) AS error_rate
            FROM request_logs
            GROUP BY endpoint
            ORDER BY total_requests DESC
        """).fetchall()

        total = conn.execute("SELECT COUNT(*) FROM request_logs").fetchone()[0]

    return {
        "total_requests": total,
        "by_endpoint": [dict(r) for r in rows],
    }
