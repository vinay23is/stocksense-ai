import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const fetchStock = (symbol) => api.get(`/stocks/${symbol}`).then((r) => r.data);

export const fetchHistory = (symbol, period = "1mo") =>
  api.get(`/history/${symbol}`, { params: { period } }).then((r) => r.data);

export const fetchIndicators = (symbol) =>
  api.get(`/indicators/${symbol}`).then((r) => r.data);

export const fetchCompare = (symbols, period = "3mo") =>
  api
    .get("/compare", { params: { symbols: symbols.join(","), period } })
    .then((r) => r.data);

export const fetchAIInsight = (symbol) =>
  api.get(`/ai-insight/${symbol}`).then((r) => r.data);

export const fetchNews = (symbol) =>
  api.get(`/news/${symbol}`).then((r) => r.data);
