import { useEffect, useState } from "react";
import { fetchNews } from "../utils/api";
import { ExternalLink, Newspaper } from "lucide-react";

function timeAgo(unixTs) {
  if (!unixTs) return "";
  const diff = Math.floor(Date.now() / 1000) - unixTs;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsPanel({ symbol, darkMode }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchNews(symbol)
      .then((d) => mounted && setNews(d.news || []))
      .catch((e) => mounted && setError(e.response?.data?.detail || "Failed to load news"))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [symbol]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-bg-border/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-negative text-sm">{error}</p>;
  }

  if (!news.length) {
    return (
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        No recent news available for {symbol}.
      </p>
    );
  }

  return (
    <div className="space-y-2 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper size={14} className={darkMode ? "text-gray-500" : "text-gray-400"} />
        <span className={`text-xs font-semibold uppercase tracking-widest ${
          darkMode ? "text-gray-500" : "text-gray-400"
        }`}>
          Latest Headlines — {symbol}
        </span>
      </div>

      {news.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-all group ${
            darkMode
              ? "bg-bg-hover border-bg-border hover:border-accent/40"
              : "bg-gray-50 border-gray-200 hover:border-accent/50"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {item.publisher}
              </span>
              {item.published_at > 0 && (
                <>
                  <span className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>·</span>
                  <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {timeAgo(item.published_at)}
                  </span>
                </>
              )}
            </div>
          </div>
          <ExternalLink
            size={13}
            className={`shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </a>
      ))}
    </div>
  );
}
