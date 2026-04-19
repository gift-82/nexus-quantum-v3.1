// ============================================================
// NEXUS QUANTUM v3.0 — Positions & P&L Panel
// ============================================================
import React from 'react';
import { useNexusStore } from '../store/nexusStore';
import { formatPrice } from '../services/marketData';

export default function PositionsPanel() {
  const { positions, closePosition, accountBalance, addToast } = useNexusStore();
  const totalPnl = positions.reduce((a, p) => a + p.pnl, 0);
  const equity = accountBalance + totalPnl;

  const handleClose = (id: string, sym: string) => {
    closePosition(id);
    addToast({ type: 'info', title: 'Position Closed', message: `${sym} position closed at market.` });
  };

  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid rgba(0,210,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: '#00d2ff', letterSpacing: '0.1em', fontWeight: 700 }}>
          OPEN POSITIONS
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>EQUITY</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d2ff', fontFamily: 'JetBrains Mono, monospace' }}>
              ${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>OPEN P&L</div>
            <div style={{
              fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              color: totalPnl >= 0 ? '#00ff88' : '#ff3366',
            }}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Positions list */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {positions.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 24, opacity: 0.2 }}>◎</div>
            <div style={{ color: '#3d6070', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>No open positions</div>
          </div>
        ) : (
          positions.map((pos) => (
            <div key={pos.id} style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(0,210,255,0.05)',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 8, alignItems: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,210,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{
                    padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    background: pos.side === 'BUY' ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)',
                    color: pos.side === 'BUY' ? '#00ff88' : '#ff3366',
                    border: `1px solid ${pos.side === 'BUY' ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
                  }}>{pos.side}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#e8f4ff' }}>{pos.symbol}</span>
                  <span style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
                    {pos.size.toFixed(4)} lots
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: '#3d6070' }}>Entry: <span style={{ color: '#7ab3cc' }}>{formatPrice(pos.entryPrice, pos.symbol)}</span></span>
                  <span style={{ color: '#3d6070' }}>Now: <span style={{ color: '#e8f4ff' }}>{formatPrice(pos.currentPrice, pos.symbol)}</span></span>
                  <span style={{ color: '#3d6070' }}>SL: <span style={{ color: '#ff3366' }}>{formatPrice(pos.sl, pos.symbol)}</span></span>
                  <span style={{ color: '#3d6070' }}>TP: <span style={{ color: '#00ff88' }}>{formatPrice(pos.tp, pos.symbol)}</span></span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  color: pos.pnl >= 0 ? '#00ff88' : '#ff3366',
                }}>
                  {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: pos.pnl >= 0 ? 'rgba(0,255,136,0.6)' : 'rgba(255,51,102,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                </div>
                <button onClick={() => handleClose(pos.id, pos.symbol)} style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                  background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.3)',
                  color: '#ff3366', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.05em',
                }}>CLOSE</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Account info */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid rgba(0,210,255,0.08)',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flexShrink: 0,
      }}>
        {[
          { label: 'BALANCE', value: `$${accountBalance.toLocaleString()}`, color: '#7ab3cc' },
          { label: 'POSITIONS', value: positions.length.toString(), color: '#00d2ff' },
          { label: 'MARGIN USED', value: `${Math.min(positions.length * 2, 100).toFixed(1)}%`, color: positions.length > 5 ? '#ff8c00' : '#00ff88' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
