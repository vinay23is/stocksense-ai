import { useEffect, useState } from "react";
import { fetchCompare } from "../utils/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { X, Plus } from "lucide-react";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];
const DEFAULT_SYMBOLS = ["AAPL", "GOOGL", "MSFT"];
const PERIODS = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
];

export default function CompareStocks({ symbol, darkMode }) {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [period, setPeriod] = useState("3mo");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchCompare(symbols, period)
      .then((d) => mounted && setData(d))
      .catch((e) => mounted && setError(e.response?.data?.detail || "Failed to load comparison"))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [symbols, period]);

  const addSymbol = () => {
    const upper = inputVal.trim().toUpperCase();
    if (upper && !symbols.includes(upper) && symbols.length < 5) {
      setSymbols((s) => [...s, upper]);
      setInputVal("");
    }
  };

  const removeSymbol = (sym) => {
    if (symbols.length > 1) setSymbols((s) => s.filter((x) => x !== sym));
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {symbols.map((sym, i) => (
            <span
              key={sym}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${COLORS[i % COLORS.length]}20`,
                color: COLORS[i % COLORS.length],
                border: `1px solid ${COLORS[i % COLORS.length]}40`,
              }}
            >
              {sym}
              <button
                onClick={() => removeSymbol(sym)}
                className="ml-0.5 opacity-60 hover:opacity-100"
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {symbols.length < 5 && (
            <div className="flex gap-1">
              <input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && addSymbol()}
                placeholder="Add ticker"
                maxLength={6}
                className={`w-24 px-2 py-1 rounded-lg text-xs border outline-none transition-colors ${
                  darkMode
                    ? "bg-bg-hover border-bg-border text-white placeholder-gray-500 focus:border-accent"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-accent"
                }`}
              />
              <button
                onClick={addSymbol}
                className="px-2 py-1 rounded-lg bg-accent text-white text-xs hover:bg-accent-hover transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>

        <div
          className={`flex rounded-lg overflow-hidden border ${
            darkMode ? "border-bg-border" : "border-gray-200"
          }`}
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-accent text-white"
                  : darkMode
                  ? "text-gray-400 hover:text-white hover:bg-bg-hover"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        Normalized returns from start of period (%)
      </p>

      {loading ? (
        <div className="h-64 bg-bg-border/50 rounded-xl animate-pulse" />
      ) : error ? (
        <p className="text-negative text-sm">{error}</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data?.data || []}
              margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
            >
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
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
              />
              <ReferenceLine y={0} stroke={darkMode ? "#374151" : "#d1d5db"} strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#12121a" : "#ffffff",
                  border: `1px solid ${darkMode ? "#1e1e2e" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  color: darkMode ? "#ffffff" : "#111827",
                  fontSize: "12px",
                }}
                formatter={(v) => [`${v > 0 ? "+" : ""}${v.toFixed(2)}%`]}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {(data?.symbols || symbols).map((sym, i) => (
                <Line
                  key={sym}
                  type="monotone"
                  dataKey={sym}
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
