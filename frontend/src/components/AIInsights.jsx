import { useEffect, useState, useCallback } from "react";
import { fetchAIInsight } from "../utils/api";
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react";

export default function AIInsights({ symbol, darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAIInsight(symbol)
      .then(setData)
      .catch((e) =>
        setError(e.response?.data?.detail || "Failed to generate insight")
      )
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sparkles size={14} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Market Insight</h3>
            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Powered by Gemini 1.5 Flash
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            darkMode
              ? "border-bg-border text-gray-400 hover:text-white hover:border-accent/50 disabled:opacity-40"
              : "border-gray-200 text-gray-500 hover:text-gray-900 hover:border-accent/50 disabled:opacity-40"
          }`}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Regenerate
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-4 rounded-full bg-bg-border/70 animate-pulse"
              style={{ width: `${[95, 85, 90, 60][i]}%` }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-negative text-sm">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Stats chips */}
          {data && (
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  darkMode ? "bg-bg-hover text-gray-300" : "bg-gray-100 text-gray-600"
                }`}
              >
                ${data.price?.toLocaleString()}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  data.change_pct >= 0
                    ? "bg-positive/10 text-positive"
                    : "bg-negative/10 text-negative"
                }`}
              >
                {data.change_pct >= 0 ? "+" : ""}{data.change_pct?.toFixed(2)}% (1M)
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  data.rsi > 70
                    ? "bg-negative/10 text-negative"
                    : data.rsi < 30
                    ? "bg-warning/10 text-warning"
                    : darkMode
                    ? "bg-bg-hover text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                RSI {data.rsi?.toFixed(1)}
              </span>
              {data.ai_powered && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  AI-powered
                </span>
              )}
            </div>
          )}

          {/* Insight text */}
          <div
            className={`rounded-2xl border p-4 leading-relaxed text-sm ${
              darkMode
                ? "bg-bg-hover border-bg-border text-gray-200"
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            {data?.insight}
          </div>

          {/* Disclaimer */}
          <div
            className={`flex items-start gap-2 rounded-xl p-3 border text-xs ${
              darkMode
                ? "bg-warning/5 border-warning/20 text-gray-400"
                : "bg-yellow-50 border-yellow-200 text-gray-500"
            }`}
          >
            <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
            AI-generated insights are for educational purposes only, not financial advice.
            Always do your own research before making investment decisions.
          </div>
        </>
      )}
    </div>
  );
}
