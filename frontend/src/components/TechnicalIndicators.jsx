import { useEffect, useState } from "react";
import { fetchIndicators } from "../utils/api";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function RSIGauge({ value, darkMode }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const angle = (pct / 100) * 180 - 90;

  let color = "#22c55e";
  let label = "Neutral";
  if (value >= 70) { color = "#ef4444"; label = "Overbought"; }
  else if (value <= 30) { color = "#f59e0b"; label = "Oversold"; }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Background arc */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={darkMode ? "#1e1e2e" : "#e5e7eb"}
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 188} 188`}
        />
        {/* Needle */}
        <line
          x1="70"
          y1="75"
          x2={70 + 45 * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={75 + 45 * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke={darkMode ? "#ffffff" : "#1f2937"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="70" cy="75" r="4" fill={color} />
        <text x="70" y="68" textAnchor="middle" fontSize="15" fontWeight="700" fill={color}>
          {value.toFixed(1)}
        </text>
      </svg>
      <div className="text-center">
        <span
          className="px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {label}
        </span>
        <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          RSI (14)
        </p>
      </div>
    </div>
  );
}

function MABadge({ label, price, signal, current, darkMode }) {
  const above = signal === "above";
  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-1 transition-colors ${
        darkMode ? "bg-bg-hover border-bg-border" : "bg-gray-50 border-gray-200"
      }`}
    >
      <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        {label}
      </span>
      <span className="font-semibold text-sm">
        {price ? `$${price.toLocaleString()}` : "N/A"}
      </span>
      {price && (
        <span
          className={`text-xs font-medium ${
            above ? "text-positive" : "text-negative"
          }`}
        >
          Price {above ? "↑ above" : "↓ below"} MA
        </span>
      )}
    </div>
  );
}

export default function TechnicalIndicators({ symbol, darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchIndicators(symbol)
      .then((d) => mounted && setData(d))
      .catch((e) => mounted && setError(e.response?.data?.detail || "Failed to load indicators"))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [symbol]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-bg-border/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-negative text-sm">{error}</p>;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top row: RSI + Moving Averages */}
      <div className="grid md:grid-cols-2 gap-6">
        <div
          className={`rounded-2xl border p-4 flex flex-col items-center justify-center ${
            darkMode ? "bg-bg-hover border-bg-border" : "bg-gray-50 border-gray-200"
          }`}
        >
          <h3 className="text-sm font-semibold mb-3 self-start">RSI Gauge</h3>
          <RSIGauge value={data.rsi} darkMode={darkMode} />
          <p className={`text-xs mt-2 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Above 70 = Overbought · Below 30 = Oversold
          </p>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            darkMode ? "bg-bg-hover border-bg-border" : "bg-gray-50 border-gray-200"
          }`}
        >
          <h3 className="text-sm font-semibold mb-3">Moving Averages</h3>
          <div className="grid grid-cols-2 gap-3">
            <MABadge
              label="MA 50-day"
              price={data.ma50}
              signal={data.ma50_signal}
              current={data.current_price}
              darkMode={darkMode}
            />
            <MABadge
              label="MA 200-day"
              price={data.ma200}
              signal={data.ma200_signal}
              current={data.current_price}
              darkMode={darkMode}
            />
          </div>
          <p className={`text-xs mt-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Current price: <span className="font-semibold text-white">${data.current_price}</span>
          </p>
        </div>
      </div>

      {/* MACD Chart */}
      <div
        className={`rounded-2xl border p-4 ${
          darkMode ? "bg-bg-hover border-bg-border" : "bg-gray-50 border-gray-200"
        }`}
      >
        <h3 className="text-sm font-semibold mb-4">MACD (60-day)</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.macd_data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? "#1e1e2e" : "#f1f5f9"}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: darkMode ? "#6b7280" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: darkMode ? "#6b7280" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#12121a" : "#ffffff",
                  border: `1px solid ${darkMode ? "#1e1e2e" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  color: darkMode ? "#ffffff" : "#111827",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="histogram" fill="#6366f1" opacity={0.6} name="Histogram" radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="macd" stroke="#22c55e" dot={false} strokeWidth={1.5} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
