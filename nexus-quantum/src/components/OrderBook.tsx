// ============================================================
// NEXUS QUANTUM v3.0 — Order Book Component
// ============================================================
import React, { useMemo } from 'react';
import { useNexusStore } from '../store/nexusStore';
import { formatPrice, formatVolume } from '../services/marketData';

export default function OrderBook() {
  const { orderBook, tickers, selectedSymbol } = useNexusStore();
  const { bids, asks } = orderBook;
  const ticker = tickers[selectedSymbol];

  const maxTotal = useMemo(() => {
    const allTotals = [...bids, ...asks].map((e) => e.total);
    return Math.max(...allTotals, 1);
  }, [bids, asks]);

  const spread = ticker ? ticker.ask - ticker.bid : 0;
  const spreadPct = ticker ? ((spread / ticker.price) * 100).toFixed(3) : '0.000';

  const renderRow = (entry: { price: number; size: number; total: number }, side: 'bid' | 'ask', i: number) => {
    const pct = (entry.total / maxTotal) * 100;
    return (
      <div key={`${side}-${i}`} style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 4, padding: '2px 8px',
        fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
        position: 'relative', cursor: 'default',
        transition: 'background 0.15s',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,210,255,0.04)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Bar background */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          [side === 'ask' ? 'left' : 'right']: 0,
          width: `${pct}%`,
          background: side === 'ask' ? 'rgba(255,51,102,0.07)' : 'rgba(0,255,136,0.07)',
          pointerEvents: 'none',
        }} />
        <span style={{ color: side === 'ask' ? '#ff3366' : '#00ff88', fontWeight: 600, position: 'relative' }}>
          {formatPrice(entry.price, selectedSymbol)}
        </span>
        <span style={{ color: '#7ab3cc', textAlign: 'right', position: 'relative' }}>
          {formatVolume(entry.size)}
        </span>
        <span style={{ color: '#3d6070', textAlign: 'right', position: 'relative' }}>
          {formatVolume(entry.total)}
        </span>
      </div>
    );
  };

  return (
    <div className="glass" style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid rgba(0,210,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'Orbitron, sans-serif', fontSize: 10,
          color: '#00d2ff', letterSpacing: '0.1em', fontWeight: 700,
        }}>ORDER BOOK</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: bids.length > 0 ? '#00ff88' : '#3d6070',
            animation: bids.length > 0 ? 'pulse-cyan 1.5s infinite' : 'none',
          }} />
          <span style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
            {selectedSymbol}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 4, padding: '4px 8px',
        fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
        color: '#3d6070', letterSpacing: '0.05em',
        borderBottom: '1px solid rgba(0,210,255,0.06)',
      }}>
        <span>PRICE</span>
        <span style={{ textAlign: 'right' }}>SIZE</span>
        <span style={{ textAlign: 'right' }}>TOTAL</span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Asks (reverse order - highest to lowest) */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
          {bids.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: '#3d6070', fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
            }}>Connecting...</div>
          ) : (
            [...asks].reverse().map((e, i) => renderRow(e, 'ask', i))
          )}
        </div>

        {/* Spread */}
        <div style={{
          padding: '6px 8px',
          background: 'rgba(0,210,255,0.04)',
          borderTop: '1px solid rgba(0,210,255,0.08)',
          borderBottom: '1px solid rgba(0,210,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>SPREAD</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#00d2ff', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
              {formatPrice(spread, selectedSymbol)}
            </span>
            <span style={{ fontSize: 10, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
              {spreadPct}%
            </span>
          </div>
        </div>

        {/* Bids */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {bids.map((e, i) => renderRow(e, 'bid', i))}
        </div>
      </div>

      {/* Buy/Sell pressure bar */}
      {bids.length > 0 && (
        <div style={{ padding: '6px 8px', borderTop: '1px solid rgba(0,210,255,0.08)' }}>
          {(() => {
            const buyVol = bids.slice(0, 5).reduce((a, b) => a + b.size, 0);
            const sellVol = asks.slice(0, 5).reduce((a, b) => a + b.size, 0);
            const total = buyVol + sellVol;
            const buyPct = total > 0 ? (buyVol / total) * 100 : 50;
            return (
              <div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                  marginBottom: 4,
                }}>
                  <span style={{ color: '#00ff88' }}>{buyPct.toFixed(1)}% BUY</span>
                  <span style={{ color: '#ff3366' }}>{(100 - buyPct).toFixed(1)}% SELL</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,51,102,0.3)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${buyPct}%`,
                    background: '#00ff88', borderRadius: 2,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
