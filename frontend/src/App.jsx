import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StatCards from "./components/StatCards";
import PriceChart from "./components/PriceChart";
import TechnicalIndicators from "./components/TechnicalIndicators";
import CompareStocks from "./components/CompareStocks";
import AIInsights from "./components/AIInsights";
import NewsPanel from "./components/NewsPanel";
import { fetchStock, fetchHistory } from "./utils/api";

const DEFAULT_WATCHLIST = ["AAPL", "GOOGL", "TSLA", "MSFT", "AMZN"];
const TABS = ["Technical Indicators", "Compare Stocks", "AI Insights", "News"];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSymbol, setActiveSymbol] = useState("AAPL");
  const [period, setPeriod] = useState("1mo");
  const [activeTab, setActiveTab] = useState(0);
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const loadStockData = useCallback(async (symbol, selectedPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const [stockData, histData] = await Promise.all([
        fetchStock(symbol),
        fetchHistory(symbol, selectedPeriod),
      ]);
      setStock(stockData);
      setHistory(histData);
    } catch (err) {
      setError(
        err.response?.data?.detail || `Failed to load data for ${symbol}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockData(activeSymbol, period);
  }, [activeSymbol, period, loadStockData]);

  const handleSearch = (symbol) => {
    const upper = symbol.trim().toUpperCase();
    if (upper) setActiveSymbol(upper);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? "bg-bg-primary text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Navbar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        onSearch={handleSearch}
        activeSymbol={activeSymbol}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          watchlist={DEFAULT_WATCHLIST}
          activeSymbol={activeSymbol}
          onSelect={setActiveSymbol}
          darkMode={darkMode}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 animate-fade-in">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-negative text-sm">
              {error}
            </div>
          )}

          <StatCards stock={stock} loading={loading} darkMode={darkMode} />

          <PriceChart
            history={history}
            loading={loading}
            period={period}
            onPeriodChange={setPeriod}
            darkMode={darkMode}
            symbol={activeSymbol}
          />

          {/* Tabs */}
          <div
            className={`rounded-2xl border overflow-hidden transition-colors ${
              darkMode
                ? "bg-bg-card border-bg-border"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`flex border-b ${
                darkMode ? "border-bg-border" : "border-gray-200"
              }`}
            >
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === i
                      ? "text-accent"
                      : darkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab}
                  {activeTab === i && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 md:p-6 animate-slide-up">
              {activeTab === 0 && (
                <TechnicalIndicators
                  symbol={activeSymbol}
                  darkMode={darkMode}
                />
              )}
              {activeTab === 1 && (
                <CompareStocks symbol={activeSymbol} darkMode={darkMode} />
              )}
              {activeTab === 2 && (
                <AIInsights symbol={activeSymbol} darkMode={darkMode} />
              )}
              {activeTab === 3 && (
                <NewsPanel symbol={activeSymbol} darkMode={darkMode} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
