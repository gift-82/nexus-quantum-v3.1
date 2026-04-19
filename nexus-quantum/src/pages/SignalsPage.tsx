// ============================================================
// NEXUS QUANTUM v3.0 — Signals Page (Live Alarm System)
// ============================================================
import React, { useState } from 'react';
import { useNexusStore, Signal } from '../store/nexusStore';
import { getSymbolDisplay, formatPrice, SYMBOLS } from '../services/marketData';
import { fetchCandles } from '../services/marketData';
import { runSignalEngine } from '../services/signalEngine';

function formatAge(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function ConfluenceBar({ score }: { score: number }) {
  const color = score >= 80 ? '#00ff88' : score >= 60 ? '#ff8c00' : '#ff3366';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        flex: 1, height: 4, background: 'rgba(0,0,0,0.3)',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${score}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 2, transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace', minWidth: 30 }}>
        {score}%
      </span>
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const updateSignalStatus = useNexusStore((s) => s.updateSignalStatus);
  const addPosition = useNexusStore((s) => s.addPosition);
  const accountBalance = useNexusStore((s) => s.accountBalance);
  const riskPct = useNexusStore((s) => s.riskPct);
  const addToast = useNexusStore((s) => s.addToast);
  const isBuy = signal.type === 'BUY';
  const isActive = signal.status === 'ACTIVE';

  const copySignal = () => {
    const text = `NEXUS QUANTUM SIGNAL 🚨\n${signal.type} ${getSymbolDisplay(signal.symbol)}\n` +
      `Entry: ${formatPrice(signal.price, signal.symbol)}\n` +
      `SL: ${formatPrice(signal.sl, signal.symbol)}\n` +
      `TP: ${formatPrice(signal.tp, signal.symbol)}\n` +
      `R:R = ${signal.rr}:1 | Score: ${signal.confluenceScore}%\n` +
      `Strategy: ${signal.strategy} | TF: ${signal.timeframe}`;
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copied!', message: 'Signal copied to clipboard.' });
  };

  const execute = () => {
    const riskAmount = accountBalance * (riskPct / 100);
    const slDistance = Math.abs(signal.price - signal.sl);
    const size = slDistance > 0 ? riskAmount / slDistance : 0.01;
    addPosition({
      id: `pos-${Date.now()}`,
      symbol: signal.symbol,
      side: signal.type,
      entryPrice: signal.price,
      currentPrice: signal.price,
      size: Math.round(size * 10000) / 10000,
      sl: signal.sl, tp: signal.tp,
      pnl: 0, pnlPct: 0,
      openedAt: Date.now(),
    });
    updateSignalStatus(signal.id, 'ACTIVE');
    addToast({
      type: signal.type === 'BUY' ? 'success' : 'error',
      title: `${signal.type} Executed`,
      message: `${getSymbolDisplay(signal.symbol)} @ ${formatPrice(signal.price, signal.symbol)}`,
    });
  };

  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10,
      background: isBuy ? 'rgba(0,255,136,0.04)' : 'rgba(255,51,102,0.04)',
      border: `1px solid ${isBuy ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)'}`,
      transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
      opacity: isActive ? 1 : 0.5,
    }}>
      {/* Top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${isBuy ? '#00ff88' : '#ff3366'}, transparent)`,
        opacity: isActive ? 1 : 0.3,
      }} />

      {/* Active pulse */}
      {isActive && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 8, height: 8, borderRadius: '50%',
          background: isBuy ? '#00ff88' : '#ff3366',
          boxShadow: `0 0 8px ${isBuy ? '#00ff88' : '#ff3366'}`,
          animation: 'pulse-cyan 1.5s infinite',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800,
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
          background: isBuy ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)',
          color: isBuy ? '#00ff88' : '#ff3366',
          border: `1px solid ${isBuy ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,102,0.4)'}`,
        }}>{signal.type}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e8f4ff' }}>{getSymbolDisplay(signal.symbol)}</span>
        <span style={{
          padding: '1px 6px', borderRadius: 3, fontSize: 9,
          background: 'rgba(0,210,255,0.1)', color: '#00d2ff',
          fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(0,210,255,0.2)',
        }}>{signal.strategy}</span>
        <span style={{
          padding: '1px 6px', borderRadius: 3, fontSize: 9,
          background: 'rgba(124,58,237,0.1)', color: '#7c3aed',
          fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(124,58,237,0.2)',
        }}>{signal.timeframe}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
          {formatAge(signal.timestamp)}
        </span>
        <span style={{
          padding: '1px 8px', borderRadius: 3, fontSize: 9, fontWeight: 700,
          background: signal.status === 'ACTIVE' ? 'rgba(0,255,136,0.1)' : 'rgba(61,96,112,0.2)',
          color: signal.status === 'ACTIVE' ? '#00ff88' : '#3d6070',
          fontFamily: 'JetBrains Mono, monospace',
        }}>{signal.status}</span>
      </div>

      {/* Price levels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        {[
          { label: 'ENTRY', value: formatPrice(signal.price, signal.symbol), color: '#7ab3cc' },
          { label: 'STOP LOSS', value: formatPrice(signal.sl, signal.symbol), color: '#ff3366' },
          { label: 'TAKE PROFIT', value: formatPrice(signal.tp, signal.symbol), color: '#00ff88' },
          { label: 'R:R RATIO', value: `${signal.rr}:1`, color: '#ffd700' },
        ].map((f) => (
          <div key={f.label} style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '6px 8px',
          }}>
            <div style={{ fontSize: 8, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2, letterSpacing: '0.08em' }}>{f.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: f.color, fontFamily: 'JetBrains Mono, monospace' }}>{f.value}</div>
          </div>
        ))}
      </div>

      {/* Confluence score */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4, letterSpacing: '0.08em' }}>
          CONFLUENCE SCORE
        </div>
        <ConfluenceBar score={signal.confluenceScore} />
      </div>

      {/* Reasons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {signal.reasons.map((r, i) => (
          <span key={i} style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 9,
            background: 'rgba(0,210,255,0.06)', color: '#7ab3cc',
            border: '1px solid rgba(0,210,255,0.1)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>✓ {r}</span>
        ))}
      </div>

      {/* Actions */}
      {isActive && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={execute} style={{
            flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: isBuy
              ? 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,255,136,0.15))'
              : 'linear-gradient(135deg, rgba(255,51,102,0.3), rgba(255,51,102,0.15))',
            color: isBuy ? '#00ff88' : '#ff3366',
            fontWeight: 700, fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
            border: `1px solid ${isBuy ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
          }}>⚡ EXECUTE TRADE</button>
          <button onClick={copySignal} style={{
            padding: '7px 14px', borderRadius: 6,
            background: 'rgba(0,210,255,0.1)',
            border: '1px solid rgba(0,210,255,0.2)',
            color: '#00d2ff', cursor: 'pointer',
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          }}>⎘ COPY</button>
          <button onClick={() => updateSignalStatus(signal.id, 'EXPIRED')} style={{
            padding: '7px 14px', borderRadius: 6,
            background: 'rgba(61,96,112,0.1)',
            border: '1px solid rgba(61,96,112,0.2)',
            color: '#3d6070', cursor: 'pointer',
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          }}>✕ DISMISS</button>
        </div>
      )}
    </div>
  );
}

export default function SignalsPage() {
  const { signals, selectedSymbol, selectedStrategy, candles, addSignal, addToast } = useNexusStore();
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'ACTIVE'>('ALL');
  const [scanning, setScanning] = useState(false);

  const filtered = signals.filter((s) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return s.status === 'ACTIVE';
    return s.type === filter;
  });

  const scanAll = async () => {
    setScanning(true);
    addToast({ type: 'info', title: 'Scanning Markets', message: 'Running signal engine on all symbols...' });
    let found = 0;
    for (const sym of SYMBOLS) {
      try {
        let data = candles[sym];
        if (!data || data.length < 50) {
          data = await fetchCandles(sym, '15m', 100);
        }
        if (data.length < 50) continue;
        const sig = runSignalEngine(data, sym, selectedStrategy);
        if (sig) { addSignal(sig); found++; }
      } catch (_) {}
    }
    addToast({
      type: found > 0 ? 'signal' : 'info',
      title: found > 0 ? `${found} Signal${found > 1 ? 's' : ''} Found!` : 'No Signals',
      message: found > 0 ? `Detected ${found} high-confidence setups across all symbols.` : 'No qualifying setups at this time.',
      duration: 6000,
    });
    setScanning(false);
  };

  const activeCount = signals.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 700, color: '#00d2ff', letterSpacing: '0.1em' }}>
          ◉ SIGNAL COMMAND CENTER
        </div>
        {activeCount > 0 && (
          <div style={{
            padding: '2px 10px', borderRadius: 20,
            background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.4)',
            color: '#ff3366', fontSize: 10, fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            animation: 'pulse-cyan 1.5s infinite',
          }}>⚡ {activeCount} ACTIVE</div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {/* Filters */}
          {(['ALL', 'ACTIVE', 'BUY', 'SELL'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
              background: filter === f ? 'rgba(0,210,255,0.15)' : 'transparent',
              border: `1px solid ${filter === f ? 'rgba(0,210,255,0.4)' : 'rgba(0,210,255,0.1)'}`,
              color: filter === f ? '#00d2ff' : '#3d6070',
              transition: 'all 0.15s',
            }}>{f}</button>
          ))}
          <button onClick={scanAll} disabled={scanning} style={{
            padding: '4px 16px', borderRadius: 5, fontSize: 10, fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif', cursor: scanning ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #00d2ff, #7c3aed)',
            border: 'none', color: '#000', letterSpacing: '0.08em',
            opacity: scanning ? 0.6 : 1,
          }}>{scanning ? 'SCANNING...' : '⚡ SCAN ALL'}</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'TOTAL SIGNALS', value: signals.length, color: '#7ab3cc' },
          { label: 'ACTIVE', value: signals.filter((s) => s.status === 'ACTIVE').length, color: '#00ff88' },
          { label: 'BUY SIGNALS', value: signals.filter((s) => s.type === 'BUY').length, color: '#00ff88' },
          { label: 'SELL SIGNALS', value: signals.filter((s) => s.type === 'SELL').length, color: '#ff3366' },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>{s.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Signals list */}
      {filtered.length === 0 ? (
        <div className="glass" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, padding: 64, borderRadius: 12,
        }}>
          <div style={{ fontSize: 48, opacity: 0.1 }}>◉</div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#3d6070', fontSize: 14, letterSpacing: '0.1em' }}>
            NO SIGNALS DETECTED
          </div>
          <div style={{ color: '#3d6070', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>
            Click SCAN ALL to run signal detection across all 12 symbols.<br />
            Signals auto-generate every 15 seconds on the active symbol.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((s) => <SignalCard key={s.id} signal={s} />)}
        </div>
      )}
    </div>
  );
}
