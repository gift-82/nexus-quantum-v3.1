// ============================================================
// NEXUS QUANTUM v3.0 — Market Heatmap (12 symbols)
// ============================================================
import React from 'react';
import { useNexusStore } from '../store/nexusStore';
import { SYMBOLS, getSymbolDisplay, formatPrice, formatVolume } from '../services/marketData';

function getHeatColor(pct: number): string {
  const abs = Math.abs(pct);
  const intensity = Math.min(abs / 3, 1); // normalize to 3%
  if (pct > 0) {
    const r = Math.round(0 * (1 - intensity));
    const g = Math.round((100 + 155 * intensity));
    const b = Math.round(100 * (1 - intensity * 0.5));
    return `rgba(${r},${g},${b},0.15)`;
  } else {
    const r = Math.round(150 + 105 * intensity);
    const g = Math.round(50 * (1 - intensity));
    const b = Math.round(70 * (1 - intensity * 0.5));
    return `rgba(${r},${g},${b},0.15)`;
  }
}
function getBorderColor(pct: number): string {
  const abs = Math.min(Math.abs(pct) / 3, 1);
  if (pct > 0) return `rgba(0,${Math.round(136 + 119 * abs)},${Math.round(100 * (1 - abs * 0.5))},${0.2 + abs * 0.3})`;
  return `rgba(${Math.round(150 + 105 * abs)},${Math.round(50 * (1 - abs))},70,${0.2 + abs * 0.3})`;
}

interface Props { onSelect: (symbol: string) => void; }

export default function MarketHeatmap({ onSelect }: Props) {
  const { tickers, selectedSymbol } = useNexusStore();

  return (
    <div className="glass" style={{ padding: 12 }}>
      <div style={{
        fontFamily: 'Orbitron, sans-serif', fontSize: 10,
        color: '#00d2ff', letterSpacing: '0.1em', fontWeight: 700,
        marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>MARKET HEATMAP</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 8, color: '#3d6070' }}>24H CHANGE</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
              <div key={v} style={{
                width: 14, height: 8, borderRadius: 2,
                background: getHeatColor(v),
                border: `1px solid ${getBorderColor(v)}`,
              }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
      }}>
        {SYMBOLS.map((sym) => {
          const t = tickers[sym];
          const pct = t?.changePct || 0;
          const isSelected = sym === selectedSymbol;
          return (
            <div
              key={sym}
              onClick={() => onSelect(sym)}
              style={{
                padding: '8px 10px', borderRadius: 8,
                background: isSelected
                  ? 'rgba(0,210,255,0.12)'
                  : getHeatColor(pct),
                border: `1px solid ${isSelected ? 'rgba(0,210,255,0.5)' : getBorderColor(pct)}`,
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #00d2ff, transparent)',
                }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, fontWeight: 700,
                  color: isSelected ? '#00d2ff' : '#e8f4ff',
                }}>{getSymbolDisplay(sym).split('/')[0]}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: pct >= 0 ? '#00ff88' : '#ff3366',
                  background: pct >= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)',
                  padding: '1px 4px', borderRadius: 3,
                }}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</span>
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, fontWeight: 600,
                color: pct >= 0 ? '#00ff88' : '#ff3366',
                marginBottom: 2,
              }}>
                {t ? formatPrice(t.price, sym) : '---'}
              </div>
              <div style={{
                fontSize: 8, color: '#3d6070',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                VOL {t ? formatVolume(t.volume) : '---'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
