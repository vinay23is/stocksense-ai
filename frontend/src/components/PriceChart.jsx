import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PERIODS = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
];

function CustomTooltip({ active, payload, darkMode }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm shadow-xl ${
        darkMode
          ? "bg-bg-card border-bg-border"
          : "bg-white border-gray-200"
      }`}
    >
      <p className={`mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        {d.date}
      </p>
      <p className="font-semibold text-accent">Close: ${d.close?.toLocaleString()}</p>
      <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        H: ${d.high} · L: ${d.low}
      </p>
    </div>
  );
}

export default function PriceChart({
  history,
  loading,
  period,
  onPeriodChange,
  symbol,
  darkMode,
}) {
  const data = history?.data || [];
  const isPositive =
    data.length > 1 && data[data.length - 1].close >= data[0].close;
  const color = isPositive ? "#22c55e" : "#ef4444";

  const minClose = data.length ? Math.min(...data.map((d) => d.close)) : 0;
  const maxClose = data.length ? Math.max(...data.map((d) => d.close)) : 0;
  const padding = (maxClose - minClose) * 0.05;

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        darkMode ? "bg-bg-card border-bg-border" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div>
          <h2 className="font-semibold text-base">{symbol} Price</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Historical performance
          </p>
        </div>
        <div
          className={`flex rounded-lg overflow-hidden border ${
            darkMode ? "border-bg-border" : "border-gray-200"
          }`}
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
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

      <div className="px-2 pb-4 h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-full h-40 bg-bg-border/50 rounded-xl animate-pulse" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? "#1e1e2e" : "#f1f5f9"}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: darkMode ? "#6b7280" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                domain={[minClose - padding, maxClose + padding]}
                tick={{ fontSize: 11, fill: darkMode ? "#6b7280" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
