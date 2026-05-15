import { TrendingUp, TrendingDown, BarChart2, DollarSign, Activity } from "lucide-react";

function formatLargeNumber(n) {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatVolume(n) {
  if (!n) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function Card({ icon: Icon, label, value, sub, subPositive, loading, accent, darkMode }) {
  const base = darkMode
    ? "bg-bg-card border-bg-border hover:border-accent/30"
    : "bg-white border-gray-200 hover:border-accent/50";

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${base} ${
        accent ? "glow-accent" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-xs font-medium uppercase tracking-widest ${
            darkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon size={14} className="text-accent" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 mt-1">
          <div className="h-6 w-28 bg-bg-border rounded animate-pulse" />
          <div className="h-4 w-16 bg-bg-border rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-xl font-bold tracking-tight">{value}</p>
          {sub !== undefined && (
            <p
              className={`text-sm mt-1 font-medium ${
                subPositive === true
                  ? "text-positive"
                  : subPositive === false
                  ? "text-negative"
                  : darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function StatCards({ stock, loading, darkMode }) {
  const positive = stock && stock.change_pct >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        icon={DollarSign}
        label="Current Price"
        value={stock ? `$${stock.price.toLocaleString()}` : "—"}
        sub={
          stock
            ? `${positive ? "▲" : "▼"} $${Math.abs(stock.change).toFixed(2)}`
            : undefined
        }
        subPositive={stock ? positive : undefined}
        loading={loading}
        accent
        darkMode={darkMode}
      />
      <Card
        icon={positive ? TrendingUp : TrendingDown}
        label="Change Today"
        value={stock ? `${positive ? "+" : ""}${stock.change_pct.toFixed(2)}%` : "—"}
        sub={stock ? (positive ? "Positive session" : "Negative session") : undefined}
        subPositive={stock ? positive : undefined}
        loading={loading}
        darkMode={darkMode}
      />
      <Card
        icon={BarChart2}
        label="Market Cap"
        value={stock ? formatLargeNumber(stock.market_cap) : "—"}
        sub={stock?.sector || ""}
        darkMode={darkMode}
        loading={loading}
      />
      <Card
        icon={Activity}
        label="Volume"
        value={stock ? formatVolume(stock.volume) : "—"}
        sub={
          stock?.avg_volume
            ? `Avg: ${formatVolume(stock.avg_volume)}`
            : undefined
        }
        darkMode={darkMode}
        loading={loading}
      />
    </div>
  );
}
