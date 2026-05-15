import { useState } from "react";
import { Search, Sun, Moon, TrendingUp } from "lucide-react";

export default function Navbar({ darkMode, onToggleDark, onSearch, activeSymbol }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery("");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
        darkMode
          ? "bg-bg-primary/90 border-bg-border"
          : "bg-white/90 border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-14 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight hidden sm:block">
            StockSense{" "}
            <span className="text-accent">AI</span>
          </span>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-sm">
          <div className="relative">
            <Search
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder={`Search ticker… (${activeSymbol})`}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors border ${
                darkMode
                  ? "bg-bg-card border-bg-border text-white placeholder-gray-500 focus:border-accent"
                  : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-accent focus:bg-white"
              }`}
            />
          </div>
        </form>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? "text-gray-400 hover:text-white hover:bg-bg-hover"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
