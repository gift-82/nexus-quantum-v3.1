// ============================================================
// NEXUS QUANTUM v3.0 — Global State Store
// ============================================================
import { create } from 'zustand';

export type Tab = 'dashboard' | 'backtest' | 'signals' | 'ai' | 'calendar' | 'strategy';
export type SignalType = 'BUY' | 'SELL';
export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  high24h: number;
  low24h: number;
  volume: number;
  bid: number;
  ask: number;
  updatedAt: number;
}

export interface Signal {
  id: string;
  symbol: string;
  type: SignalType;
  price: number;
  sl: number;
  tp: number;
  rr: number;
  confluenceScore: number;
  strategy: string;
  timeframe: string;
  reasons: string[];
  timestamp: number;
  status: 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'EXPIRED';
}

export interface Position {
  id: string;
  symbol: string;
  side: SignalType;
  entryPrice: number;
  currentPrice: number;
  size: number;
  sl: number;
  tp: number;
  pnl: number;
  pnlPct: number;
  openedAt: number;
}

export interface CalendarEvent {
  id: string;
  time: string;
  country: string;
  event: string;
  impact: ImpactLevel;
  forecast: string;
  previous: string;
  actual: string;
  currency: string;
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  netPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  equityCurve: { x: number; y: number }[];
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  id: number;
  symbol: string;
  side: SignalType;
  entry: number;
  exit: number;
  pnl: number;
  pnlPct: number;
  bars: number;
  timestamp: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface AIAnalysis {
  symbol: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  summary: string;
  technical: string;
  fundamental: string;
  sentiment: string;
  keyLevels: { label: string; price: number; type: 'support' | 'resistance' }[];
  tradePlan: string;
  model: string;
  timestamp: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'signal';
  title: string;
  message: string;
  duration?: number;
}

interface NexusStore {
  // UI
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  traderId: string;
  setTraderId: (id: string) => void;
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Market Data
  tickers: Record<string, Ticker>;
  updateTicker: (symbol: string, data: Partial<Ticker>) => void;
  candles: Record<string, Candle[]>;
  addCandle: (symbol: string, c: Candle) => void;
  setCandles: (symbol: string, cs: Candle[]) => void;
  orderBook: { bids: OrderBookEntry[]; asks: OrderBookEntry[] };
  setOrderBook: (book: { bids: OrderBookEntry[]; asks: OrderBookEntry[] }) => void;
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  // Signals
  signals: Signal[];
  addSignal: (s: Signal) => void;
  updateSignalStatus: (id: string, status: Signal['status']) => void;

  // Positions
  positions: Position[];
  addPosition: (p: Position) => void;
  closePosition: (id: string) => void;
  updatePositionPrice: (symbol: string, price: number) => void;

  // Backtest
  backtestResult: BacktestResult | null;
  setBacktestResult: (r: BacktestResult | null) => void;
  isBacktesting: boolean;
  setIsBacktesting: (v: boolean) => void;
  backtestProgress: number;
  setBacktestProgress: (p: number) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;

  // AI
  aiAnalysis: AIAnalysis | null;
  setAiAnalysis: (a: AIAnalysis | null) => void;
  isAiLoading: boolean;
  setIsAiLoading: (v: boolean) => void;

  // Settings
  riskPct: number;
  setRiskPct: (v: number) => void;
  accountBalance: number;
  setAccountBalance: (v: number) => void;
  selectedStrategy: string;
  setSelectedStrategy: (s: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (tf: string) => void;
}

export const useNexusStore = create<NexusStore>((set, get) => ({
  // UI
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedSymbol: 'BTCUSDT',
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),
  traderId: '',
  setTraderId: (id) => set({ traderId: id }),
  isAuthenticated: false,
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  toasts: [],
  addToast: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => get().removeToast(id), t.duration ?? 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // Market Data
  tickers: {},
  updateTicker: (symbol, data) =>
    set((s) => ({
      tickers: {
        ...s.tickers,
        [symbol]: { ...(s.tickers[symbol] || {}), ...data, symbol, updatedAt: Date.now() } as Ticker,
      },
    })),
  candles: {},
  addCandle: (symbol, c) =>
    set((s) => {
      const existing = s.candles[symbol] || [];
      const last = existing[existing.length - 1];
      if (last && last.time === c.time) {
        return { candles: { ...s.candles, [symbol]: [...existing.slice(0, -1), c] } };
      }
      return { candles: { ...s.candles, [symbol]: [...existing.slice(-499), c] } };
    }),
  setCandles: (symbol, cs) => set((s) => ({ candles: { ...s.candles, [symbol]: cs } })),
  orderBook: { bids: [], asks: [] },
  setOrderBook: (book) => set({ orderBook: book }),
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  // Signals
  signals: [],
  addSignal: (s) => set((st) => ({ signals: [s, ...st.signals].slice(0, 50) })),
  updateSignalStatus: (id, status) =>
    set((s) => ({ signals: s.signals.map((sig) => (sig.id === id ? { ...sig, status } : sig)) })),

  // Positions
  positions: [],
  addPosition: (p) => set((s) => ({ positions: [...s.positions, p] })),
  closePosition: (id) => set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),
  updatePositionPrice: (symbol, price) =>
    set((s) => ({
      positions: s.positions.map((p) => {
        if (p.symbol !== symbol) return p;
        const pnl = (price - p.entryPrice) * p.size * (p.side === 'BUY' ? 1 : -1);
        return { ...p, currentPrice: price, pnl, pnlPct: (pnl / (p.entryPrice * p.size)) * 100 };
      }),
    })),

  // Backtest
  backtestResult: null,
  setBacktestResult: (r) => set({ backtestResult: r }),
  isBacktesting: false,
  setIsBacktesting: (v) => set({ isBacktesting: v }),
  backtestProgress: 0,
  setBacktestProgress: (p) => set({ backtestProgress: p }),

  // Calendar
  calendarEvents: [],
  setCalendarEvents: (events) => set({ calendarEvents: events }),

  // AI
  aiAnalysis: null,
  setAiAnalysis: (a) => set({ aiAnalysis: a }),
  isAiLoading: false,
  setIsAiLoading: (v) => set({ isAiLoading: v }),

  // Settings
  riskPct: 1,
  setRiskPct: (v) => set({ riskPct: v }),
  accountBalance: 10000,
  setAccountBalance: (v) => set({ accountBalance: v }),
  selectedStrategy: 'ICT_AMD',
  setSelectedStrategy: (s) => set({ selectedStrategy: s }),
  selectedTimeframe: '15m',
  setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),
}));
