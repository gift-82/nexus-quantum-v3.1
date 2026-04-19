// ============================================================
// NEXUS QUANTUM v3.0 — Dashboard Page (Main View)
// ============================================================
import React, { useEffect, useCallback, useRef } from 'react';
import { useNexusStore } from '../store/nexusStore';
import {
  fetchCandles, fetchAllTickers,
  connectTickerStream, connectKlineStream, connectDepthStream,
  SYMBOLS, getSymbolDisplay, formatPrice,
} from '../services/marketData';
import { runSignalEngine } from '../services/signalEngine';
import LiveChart from '../components/LiveChart';
import OrderBook from '../components/OrderBook';
import MarketHeatmap from '../components/MarketHeatmap';
import PositionsPanel from '../components/PositionsPanel';

// ─── Ticker strip item ───────────────────────────────────────
function TickerItem({ symbol }: { symbol: string }) {
  const tickers = useNexusStore((s) => s.tickers);
  const selectedSymbol = useNexusStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useNexusStore((s) => s.setSelectedSymbol);
  const t = tickers[symbol];
  const isSelected = symbol === selectedSymbol;
  return (
    <div
      onClick={() => setSelectedSymbol(symbol)}
      style={{
        padding: '6px 14px', cursor: 'pointer', flexShrink: 0,
        borderRight: '1px solid rgba(0,210,255,0.06)',
        background: isSelected ? 'rgba(0,210,255,0.08)' : 'transparent',
        transition: 'background 0.15s', userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
          color: isSelected ? '#00d2ff' : '#7ab3cc',
        }}>{getSymbolDisplay(symbol)}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
          color: t ? (t.changePct >= 0 ? '#00ff88' : '#ff3366') : '#3d6070',
        }}>{t ? formatPrice(t.price, symbol) : '---'}</span>
        <span style={{
          fontSize: 9, fontWeight: 600,
          color: t ? (t.changePct >= 0 ? 'rgba(0,255,136,0.7)' : 'rgba(255,51,102,0.7)') : '#3d6070',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {t ? `${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%` : '--'}
        </span>
      </div>
    </div>
  );
}

// ─── Symbol sidebar item ─────────────────────────────────────
function SymbolItem({ symbol }: { symbol: string }) {
  const tickers = useNexusStore((s) => s.tickers);
  const selectedSymbol = useNexusStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useNexusStore((s) => s.setSelectedSymbol);
  const t = tickers[symbol];
  const isSelected = symbol === selectedSymbol;
  return (
    <div
      onClick={() => setSelectedSymbol(symbol)}
      style={{
        padding: '7px 10px', cursor: 'pointer',
        background: isSelected ? 'rgba(0,210,255,0.1)' : 'transparent',
        borderLeft: `2px solid ${isSelected ? '#00d2ff' : 'transparent'}`,
        transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
          color: isSelected ? '#00d2ff' : '#7ab3cc',
        }}>{getSymbolDisplay(symbol)}</span>
        <span style={{
          fontSize: 9, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
          color: t ? (t.changePct >= 0 ? '#00ff88' : '#ff3366') : '#3d6070',
        }}>
          {t ? `${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%` : '--'}
        </span>
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
        color: t ? (t.changePct >= 0 ? '#00ff88' : '#ff3366') : '#3d6070',
        marginTop: 2,
      }}>
        {t ? formatPrice(t.price, symbol) : '---'}
      </div>
    </div>
  );
}

const TIMEFRAMES_LIST = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const STRATEGIES_LIST = ['ICT_AMD', 'SMC', 'ALL'];

export default function Dashboard() {
  const selectedSymbol = useNexusStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useNexusStore((s) => s.setSelectedSymbol);
  const selectedTimeframe = useNexusStore((s) => s.selectedTimeframe);
  const setSelectedTimeframe = useNexusStore((s) => s.setSelectedTimeframe);
  const selectedStrategy = useNexusStore((s) => s.selectedStrategy);
  const setSelectedStrategy = useNexusStore((s) => s.setSelectedStrategy);
  const setCandles = useNexusStore((s) => s.setCandles);
  const addSignal = useNexusStore((s) => s.addSignal);
  const addToast = useNexusStore((s) => s.addToast);
  const addPosition = useNexusStore((s) => s.addPosition);
  const riskPct = useNexusStore((s) => s.riskPct);
  const setRiskPct = useNexusStore((s) => s.setRiskPct);
  const accountBalance = useNexusStore((s) => s.accountBalance);
  const ticker = useNexusStore((s) => s.tickers[selectedSymbol]);

  const signalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Initialize ticker stream once ──────────────────────────
  useEffect(() => {
    fetchAllTickers();
    connectTickerStream();
    const iv = setInterval(fetchAllTickers, 30000);
    return () => clearInterval(iv);
  }, []);

  // ─── Load candles + streams on symbol/timeframe change ───────
  useEffect(() => {
    fetchCandles(selectedSymbol, selectedTimeframe, 500).then((cs) => {
      if (cs.length > 0) setCandles(selectedSymbol, cs);
    });
    connectKlineStream(selectedSymbol, selectedTimeframe);
    connectDepthStream(selectedSymbol);
  }, [selectedSymbol, selectedTimeframe]);

  // ─── Signal scanning loop ────────────────────────────────────
  useEffect(() => {
    if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
    signalIntervalRef.current = setInterval(() => {
      const state = useNexusStore.getState();
      const c = state.candles[selectedSymbol] || [];
      if (c.length < 50) return;
      const sig = runSignalEngine(c, selectedSymbol, selectedStrategy);
      if (sig) {
        state.addSignal(sig);
        state.addToast({
          type: 'signal',
          title: `🚨 ${sig.type} — ${getSymbolDisplay(selectedSymbol)}`,
          message: `${sig.strategy} | Score: ${sig.confluenceScore}% | RR ${sig.rr}:1`,
          duration: 8000,
        });
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification(`NEXUS: ${sig.type} ${selectedSymbol}`, {
              body: `${sig.strategy} @ ${formatPrice(sig.price, selectedSymbol)} | ${sig.confluenceScore}%`,
            });
          } catch (_) {}
        }
      }
    }, 15000);
    return () => {
      if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
    };
  }, [selectedSymbol, selectedStrategy]);

  // ─── Request notification permission ────────────────────────
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ─── One-click trade simulation ──────────────────────────────
  const executeTrade = useCallback((side: 'BUY' | 'SELL') => {
    const state = useNexusStore.getState();
    const t = state.tickers[selectedSymbol];
    if (!t) {
      state.addToast({ type: 'warning', title: 'No Price Data', message: 'Waiting for live price feed.' });
      return;
    }
    const price = side === 'BUY' ? (t.ask || t.price) : (t.bid || t.price);
    const atrApprox = price * 0.005;
    const sl = side === 'BUY' ? price - atrApprox * 1.5 : price + atrApprox * 1.5;
    const tp = side === 'BUY' ? price + atrApprox * 3 : price - atrApprox * 3;
    const riskAmount = state.accountBalance * (state.riskPct / 100);
    const slDistance = Math.abs(price - sl);
    const size = slDistance > 0 ? riskAmount / slDistance : 0.01;
    state.addPosition({
      id: `pos-${Date.now()}`,
      symbol: selectedSymbol,
      side,
      entryPrice: price,
      currentPrice: price,
      size: Math.min(Math.round(size * 10000) / 10000, 9999),
      sl, tp, pnl: 0, pnlPct: 0,
      openedAt: Date.now(),
    });
    state.addToast({
      type: side === 'BUY' ? 'success' : 'error',
      title: `${side} Executed`,
      message: `${getSymbolDisplay(selectedSymbol)} @ ${formatPrice(price, selectedSymbol)} | SL ${formatPrice(sl, selectedSymbol)} | TP ${formatPrice(tp, selectedSymbol)}`,
    });
  }, [selectedSymbol]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Ticker Strip ────────────────────────────────────── */}
      <div style={{
        display: 'flex', overflowX: 'auto', flexShrink: 0,
        background: 'rgba(2,4,8,0.8)',
        borderBottom: '1px solid rgba(0,210,255,0.08)',
        height: 36, alignItems: 'center',
        scrollbarWidth: 'none',
      }}>
        {SYMBOLS.map((s) => <TickerItem key={s} symbol={s} />)}
      </div>

      {/* ── Main 3-column layout ────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '140px 1fr 240px', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: Watchlist */}
        <div style={{
          borderRight: '1px solid rgba(0,210,255,0.08)',
          overflowY: 'auto', background: 'rgba(2,4,8,0.6)',
        }}>
          <div style={{
            padding: '6px 10px', fontSize: 9,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#3d6070', letterSpacing: '0.1em',
            borderBottom: '1px solid rgba(0,210,255,0.06)',
          }}>WATCHLIST</div>
          {SYMBOLS.map((s) => <SymbolItem key={s} symbol={s} />)}
        </div>

        {/* Center: Chart area */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          {/* Toolbar */}
          <div style={{
            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: '1px solid rgba(0,210,255,0.08)',
            background: 'rgba(2,4,8,0.5)', flexShrink: 0, flexWrap: 'wrap',
          }}>
            {/* Symbol + price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: '#00d2ff' }}>
                {getSymbolDisplay(selectedSymbol)}
              </span>
              {ticker && (
                <>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700,
                    color: ticker.changePct >= 0 ? '#00ff88' : '#ff3366',
                  }}>{formatPrice(ticker.price, selectedSymbol)}</span>
                  <span style={{
                    fontSize: 10,
                    color: ticker.changePct >= 0 ? 'rgba(0,255,136,0.7)' : 'rgba(255,51,102,0.7)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {ticker.changePct >= 0 ? '+' : ''}{ticker.changePct.toFixed(2)}%
                  </span>
                </>
              )}
            </div>

            {/* Timeframes */}
            <div style={{ display: 'flex', gap: 2 }}>
              {TIMEFRAMES_LIST.map((tf) => (
                <button key={tf} onClick={() => setSelectedTimeframe(tf)} style={{
                  padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                  background: selectedTimeframe === tf ? 'rgba(0,210,255,0.2)' : 'transparent',
                  border: `1px solid ${selectedTimeframe === tf ? 'rgba(0,210,255,0.4)' : 'rgba(0,210,255,0.08)'}`,
                  color: selectedTimeframe === tf ? '#00d2ff' : '#3d6070',
                  transition: 'all 0.15s',
                }}>{tf}</button>
              ))}
            </div>

            {/* Strategy select */}
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              style={{
                background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.2)',
                borderRadius: 4, color: '#7ab3cc', fontSize: 10, padding: '3px 8px',
                fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
              }}
            >
              {STRATEGIES_LIST.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>

            {/* Trade buttons + risk */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => executeTrade('BUY')} style={{
                padding: '4px 12px', borderRadius: 5,
                border: '1px solid rgba(0,255,136,0.4)',
                background: 'rgba(0,255,136,0.1)', color: '#00ff88',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}>▲ BUY</button>
              <button onClick={() => executeTrade('SELL')} style={{
                padding: '4px 12px', borderRadius: 5,
                border: '1px solid rgba(255,51,102,0.4)',
                background: 'rgba(255,51,102,0.1)', color: '#ff3366',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}>▼ SELL</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#3d6070', fontFamily: "'JetBrains Mono', monospace" }}>RISK</span>
                <input
                  type="number" min={0.1} max={10} step={0.1}
                  value={riskPct}
                  onChange={(e) => setRiskPct(parseFloat(e.target.value) || 1)}
                  style={{
                    width: 40, padding: '2px 5px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,210,255,0.15)',
                    borderRadius: 4, color: '#00d2ff',
                    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: 9, color: '#3d6070', fontFamily: "'JetBrains Mono', monospace" }}>%</span>
              </div>
            </div>
          </div>

          {/* Chart — fills remaining height */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
            <LiveChart symbol={selectedSymbol} />
          </div>

          {/* Positions panel */}
          <div style={{
            height: 170, borderTop: '1px solid rgba(0,210,255,0.08)',
            flexShrink: 0, overflow: 'hidden',
          }}>
            <PositionsPanel />
          </div>
        </div>

        {/* Right: Order Book */}
        <div style={{
          borderLeft: '1px solid rgba(0,210,255,0.08)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <OrderBook />
        </div>
      </div>

      {/* ── Bottom heatmap ───────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(0,210,255,0.08)',
        flexShrink: 0, padding: '6px 8px',
        background: 'rgba(2,4,8,0.6)',
      }}>
        <MarketHeatmap onSelect={setSelectedSymbol} />
      </div>
    </div>
  );
}
