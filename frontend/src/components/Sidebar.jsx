import { useEffect, useState } from "react";
import { fetchStock } from "../utils/api";
import { LayoutList } from "lucide-react";

function WatchItem({ symbol, active, onSelect, darkMode }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchStock(symbol)
      .then((d) => mounted && setData(d))
      .catch(() => {});
    return () => { mounted = false; };
  }, [symbol]);

  const positive = data && data.change_pct >= 0;

  return (
    <button
      onClick={() => onSelect(symbol)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
        active
          ? "bg-accent/20 border border-accent/30"
          : darkMode
          ? "hover:bg-bg-hover border border-transparent"
          : "hover:bg-gray-100 border border-transparent"
      }`}
    >
      <div>
        <p className={`text-sm font-semibold ${active ? "text-accent" : ""}`}>
          {symbol}
        </p>
        {data && (
          <p
            className={`text-xs mt-0.5 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {data.name?.split(" ").slice(0, 2).join(" ")}
          </p>
        )}
      </div>
      {data ? (
        <div className="text-right">
          <p className="text-sm font-medium">${data.price.toLocaleString()}</p>
          <p
            className={`text-xs font-medium ${
              positive ? "text-positive" : "text-negative"
            }`}
          >
            {positive ? "+" : ""}
            {data.change_pct.toFixed(2)}%
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="h-3 w-14 bg-bg-border rounded animate-pulse" />
          <div className="h-3 w-10 bg-bg-border rounded animate-pulse" />
        </div>
      )}
    </button>
  );
}

export default function Sidebar({ watchlist, activeSymbol, onSelect, darkMode }) {
  return (
    <aside
      className={`hidden md:flex flex-col w-56 shrink-0 border-r transition-colors ${
        darkMode
          ? "bg-bg-primary border-bg-border"
          : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b text-xs font-semibold uppercase tracking-widest ${
          darkMode
            ? "border-bg-border text-gray-500"
            : "border-gray-200 text-gray-400"
        }`}
      >
        <LayoutList size={13} />
        Watchlist
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {watchlist.map((sym) => (
          <WatchItem
            key={sym}
            symbol={sym}
            active={sym === activeSymbol}
            onSelect={onSelect}
            darkMode={darkMode}
          />
        ))}
      </div>
    </aside>
  );
}
