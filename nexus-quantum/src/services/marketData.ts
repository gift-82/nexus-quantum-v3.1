// ============================================================
// NEXUS QUANTUM v3.0 — Binance WebSocket + REST Data Service
// ============================================================
import { useNexusStore } from '../store/nexusStore';

// Direct Binance REST (no proxy needed — Binance allows CORS from browser)
const BASE_REST = 'https://api.binance.com';

// ✅ All symbols verified valid on Binance as of 2024
export const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'DOTUSDT',
  'LTCUSDT',
  'INJUSDT',
  'MATICUSDT',
];

export const TIMEFRAMES: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '1h', '4h': '4h', '1d': '1d',
};

let wsConnections: WebSocket[] = [];
let tickerWs: WebSocket | null = null;
let depthWs: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Fetch historical klines ─────────────────────────────────
export async function fetchCandles(symbol: string, interval: string, limit = 500) {
  try {
    const url = `${BASE_REST}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Kline fetch failed: ${res.status}`);
    const raw = await res.json() as any[][];
    return raw.map((k) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));
  } catch (e) {
    console.error('fetchCandles error:', e);
    return [];
  }
}

// ─── Fetch 24hr ticker for specific symbols ───────────────────
export async function fetchAllTickers() {
  try {
    // Use individual symbol requests to avoid getting all 2000+ pairs
    const symbolsParam = JSON.stringify(SYMBOLS);
    const url = `${BASE_REST}/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ticker fetch failed: ${res.status}`);
    const data = await res.json() as {
      symbol: string;
      lastPrice: string;
      priceChange: string;
      priceChangePercent: string;
      highPrice: string;
      lowPrice: string;
      volume: string;
      bidPrice: string;
      askPrice: string;
    }[];
    const store = useNexusStore.getState();
    data.forEach((d) => {
      store.updateTicker(d.symbol, {
        price: parseFloat(d.lastPrice),
        change: parseFloat(d.priceChange),
        changePct: parseFloat(d.priceChangePercent),
        high24h: parseFloat(d.highPrice),
        low24h: parseFloat(d.lowPrice),
        volume: parseFloat(d.volume),
        bid: parseFloat(d.bidPrice),
        ask: parseFloat(d.askPrice),
      });
    });
  } catch (e) {
    console.error('fetchAllTickers error:', e);
  }
}

// ─── WebSocket: Multi-stream ticker ──────────────────────────
export function connectTickerStream() {
  if (tickerWs) {
    try { tickerWs.close(); } catch (_) {}
    tickerWs = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const streams = SYMBOLS.map((s) => `${s.toLowerCase()}@miniTicker`).join('/');
  const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  try {
    tickerWs = new WebSocket(wsUrl);
  } catch (e) {
    console.error('WS connect error:', e);
    reconnectTimer = setTimeout(connectTickerStream, 5000);
    return;
  }

  const store = useNexusStore.getState();

  tickerWs.onopen = () => {
    useNexusStore.getState().setWsConnected(true);
    console.log('[NEXUS] Ticker WebSocket connected');
  };

  tickerWs.onerror = (e) => {
    console.warn('[NEXUS] Ticker WS error', e);
    useNexusStore.getState().setWsConnected(false);
  };

  tickerWs.onclose = () => {
    useNexusStore.getState().setWsConnected(false);
    console.log('[NEXUS] Ticker WS closed — reconnecting in 3s');
    reconnectTimer = setTimeout(connectTickerStream, 3000);
  };

  tickerWs.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data as string);
      const d = msg.data;
      if (!d || !d.s) return;
      const currentStore = useNexusStore.getState();
      // miniTicker fields: c=close, o=open, h=high, l=low, v=volume
      const price = parseFloat(d.c);
      const open = parseFloat(d.o);
      currentStore.updateTicker(d.s, {
        price,
        change: price - open,
        changePct: ((price - open) / open) * 100,
        high24h: parseFloat(d.h),
        low24h: parseFloat(d.l),
        volume: parseFloat(d.v),
        bid: price,
        ask: price,
      });
      currentStore.updatePositionPrice(d.s, price);
    } catch (_) {}
  };

  wsConnections = wsConnections.filter((w) => w !== tickerWs);
  wsConnections.push(tickerWs);
}

// ─── WebSocket: Kline stream ──────────────────────────────────
export function connectKlineStream(symbol: string, interval: string) {
  const streamId = `${symbol}@kline_${interval}`;
  // Close any existing stream for same symbol/interval
  wsConnections = wsConnections.filter((ws) => {
    if ((ws as any)._nexusStream === streamId) {
      try { ws.close(); } catch (_) {}
      return false;
    }
    return true;
  });

  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
  (ws as any)._nexusStream = streamId;

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data as string);
      const k = msg.k;
      if (!k) return;
      useNexusStore.getState().addCandle(symbol, {
        time: Math.floor(Number(k.t) / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      });
    } catch (_) {}
  };

  ws.onerror = () => {};
  ws.onclose = () => {
    setTimeout(() => connectKlineStream(symbol, interval), 3000);
  };

  wsConnections.push(ws);
  return ws;
}

// ─── WebSocket: Order book depth ─────────────────────────────
export function connectDepthStream(symbol: string) {
  if (depthWs) {
    try { depthWs.close(); } catch (_) {}
    depthWs = null;
  }

  depthWs = new WebSocket(
    `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@1000ms`
  );

  depthWs.onmessage = (evt) => {
    try {
      const d = JSON.parse(evt.data as string);
      let cumBid = 0, cumAsk = 0;
      const bids = ((d.bids || []) as string[][]).slice(0, 15).map((b) => {
        const sz = parseFloat(b[1]);
        cumBid += sz;
        return { price: parseFloat(b[0]), size: sz, total: cumBid };
      });
      const asks = ((d.asks || []) as string[][]).slice(0, 15).map((a) => {
        const sz = parseFloat(a[1]);
        cumAsk += sz;
        return { price: parseFloat(a[0]), size: sz, total: cumAsk };
      });
      useNexusStore.getState().setOrderBook({ bids, asks });
    } catch (_) {}
  };

  depthWs.onerror = () => {};
  depthWs.onclose = () => {
    setTimeout(() => connectDepthStream(symbol), 3000);
  };

  wsConnections = wsConnections.filter((w) => w !== depthWs);
  wsConnections.push(depthWs!);
}

// ─── Disconnect all streams ───────────────────────────────────
export function disconnectAll() {
  wsConnections.forEach((ws) => { try { ws.close(); } catch (_) {} });
  wsConnections = [];
  tickerWs = null;
  depthWs = null;
  if (reconnectTimer) clearTimeout(reconnectTimer);
}

// ─── Format helpers ───────────────────────────────────────────
export function formatPrice(price: number, symbol?: string): string {
  if (!price || isNaN(price)) return '0.00';
  if (symbol?.includes('BTC') || price > 10000)
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price > 1000)
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price > 1) return price.toFixed(4);
  return price.toFixed(6);
}

export function formatVolume(vol: number): string {
  if (!vol || isNaN(vol)) return '0';
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
  return vol.toFixed(2);
}

export function getSymbolDisplay(symbol: string): string {
  const map: Record<string, string> = {
    BTCUSDT: 'BTC/USDT',
    ETHUSDT: 'ETH/USDT',
    SOLUSDT: 'SOL/USDT',
    BNBUSDT: 'BNB/USDT',
    XRPUSDT: 'XRP/USDT',
    ADAUSDT: 'ADA/USDT',
    AVAXUSDT: 'AVAX/USDT',
    LINKUSDT: 'LINK/USDT',
    DOTUSDT: 'DOT/USDT',
    LTCUSDT: 'LTC/USDT',
    INJUSDT: 'INJ/USDT',
    MATICUSDT: 'MATIC/USDT',
  };
  return map[symbol] || symbol;
}
