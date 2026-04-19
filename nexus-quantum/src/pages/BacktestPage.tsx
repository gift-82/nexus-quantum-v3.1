// ============================================================
// NEXUS QUANTUM v3.0 — Backtesting Engine Page
// ============================================================
import React, { useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import { useNexusStore } from '../store/nexusStore';
import { fetchCandles, SYMBOLS, getSymbolDisplay } from '../services/marketData';
import { runBacktest } from '../services/signalEngine';

const STRATEGIES = ['ICT_AMD', 'SMC', 'ALL'];
const TIMEFRAMES = ['5m', '15m', '30m', '1h', '4h'];

function StatCard({ label, value, sub, color = '#00d2ff', icon = '' }:
  { label: string; value: string; sub?: string; color?: string; icon?: string }) {
  return (
    <div className="glass" style={{ padding: '12px 14px', borderRadius: 10 }}>
      <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 6 }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#3d6070', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(5,13,25,0.95)', border: '1px solid rgba(0,210,255,0.3)',
      borderRadius: 6, padding: '8px 12px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
    }}>
      <div style={{ color: '#7ab3cc' }}>Trade #{payload[0]?.payload?.x}</div>
      <div style={{ color: '#00d2ff', fontWeight: 700, fontSize: 12 }}>
        ${payload[0]?.value?.toLocaleString()}
      </div>
    </div>
  );
};

export default function BacktestPage() {
  const { backtestResult, setBacktestResult, isBacktesting, setIsBacktesting, backtestProgress, setBacktestProgress, addToast } = useNexusStore();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [strategy, setStrategy] = useState('ICT_AMD');
  const [timeframe, setTimeframe] = useState('15m');
  const [activeTab, setActiveTab] = useState<'curve' | 'trades' | 'monte'>('curve');

  const runTest = useCallback(async () => {
    if (isBacktesting) return;
    setIsBacktesting(true);
    setBacktestResult(null);
    setBacktestProgress(0);
    addToast({ type: 'info', title: 'Backtest Started', message: `Running ${strategy} on ${getSymbolDisplay(symbol)} ${timeframe}...` });
    try {
      const candles = await fetchCandles(symbol, timeframe, 1000);
      if (candles.length < 100) {
        addToast({ type: 'error', title: 'Error', message: 'Not enough historical data. Try a different timeframe.' });
        setIsBacktesting(false);
        return;
      }
      const result = await runBacktest(candles, symbol, strategy, setBacktestProgress);
      setBacktestResult(result);
      addToast({
        type: result.netPnl > 0 ? 'success' : 'warning',
        title: 'Backtest Complete',
        message: `${result.totalTrades} trades | WR: ${result.winRate.toFixed(1)}% | PF: ${result.profitFactor.toFixed(2)} | Net: $${result.netPnl.toFixed(2)}`,
        duration: 8000,
      });
    } catch (e) {
      addToast({ type: 'error', title: 'Backtest Failed', message: String(e) });
    }
    setIsBacktesting(false);
  }, [symbol, strategy, timeframe, isBacktesting]);

  const exportResults = () => {
    if (!backtestResult) return;
    const csv = ['Trade,Side,Entry,Exit,PnL,PnL%,Bars',
      ...backtestResult.trades.map((t) =>
        `${t.id},${t.side},${t.entry},${t.exit},${t.pnl},${t.pnlPct},${t.bars}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nexus-backtest-${symbol}-${strategy}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Monte Carlo simulation — flatten 20 paths into single dataset with p10/p50/p90 bands
  const monteCarloData = React.useMemo(() => {
    if (!backtestResult || activeTab !== 'monte') return [];
    const wr = backtestResult.winRate / 100;
    const avgWin = Math.abs(backtestResult.avgWin) || 10;
    const avgLoss = Math.abs(backtestResult.avgLoss) || 8;
    const SIM_COUNT = 100;
    const STEPS = 50;
    // Run simulations
    const allPaths: number[][] = Array.from({ length: SIM_COUNT }, () => {
      let eq = 10000;
      const path = [eq];
      for (let i = 0; i < STEPS; i++) {
        eq += Math.random() < wr ? avgWin : -avgLoss;
        path.push(Math.round(eq));
      }
      return path;
    });
    // Build percentile data for each step
    return Array.from({ length: STEPS + 1 }, (_, step) => {
      const vals = allPaths.map((p) => p[step]).sort((a, b) => a - b);
      const p10 = vals[Math.floor(SIM_COUNT * 0.1)];
      const p50 = vals[Math.floor(SIM_COUNT * 0.5)];
      const p90 = vals[Math.floor(SIM_COUNT * 0.9)];
      return { step, p10, p50, p90 };
    });
  }, [backtestResult, activeTab]);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Controls */}
      <div className="glass" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 700, color: '#00d2ff', letterSpacing: '0.1em', alignSelf: 'center', marginRight: 8 }}>
          ◈ BACKTEST ENGINE
        </div>

        {[
          { label: 'SYMBOL', el: (
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ padding: '6px 10px', minWidth: 120 }}>
              {SYMBOLS.map((s) => <option key={s} value={s}>{getSymbolDisplay(s)}</option>)}
            </select>
          )},
          { label: 'STRATEGY', el: (
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={{ padding: '6px 10px' }}>
              {STRATEGIES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          )},
          { label: 'TIMEFRAME', el: (
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ padding: '6px 10px' }}>
              {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )},
        ].map((ctrl) => (
          <div key={ctrl.label}>
            <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4, letterSpacing: '0.1em' }}>{ctrl.label}</div>
            {ctrl.el}
          </div>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {backtestResult && (
            <button onClick={exportResults} style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(0,210,255,0.3)',
              background: 'rgba(0,210,255,0.08)', color: '#00d2ff', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
            }}>↓ EXPORT CSV</button>
          )}
          <button onClick={runTest} disabled={isBacktesting} style={{
            padding: '8px 24px', borderRadius: 6, border: 'none',
            background: isBacktesting
              ? 'rgba(0,210,255,0.2)'
              : 'linear-gradient(135deg, #00d2ff, #0080ff)',
            color: isBacktesting ? '#00d2ff' : '#000',
            cursor: isBacktesting ? 'not-allowed' : 'pointer',
            fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', transition: 'all 0.2s',
            minWidth: 120,
          }}>
            {isBacktesting ? `${backtestProgress}%` : '▶ RUN TEST'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isBacktesting && (
        <div style={{ height: 4, background: 'rgba(0,210,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${backtestProgress}%`,
            background: 'linear-gradient(90deg, #00d2ff, #7c3aed)',
            borderRadius: 2, transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Results */}
      {backtestResult && (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <StatCard label="NET P&L" value={`$${backtestResult.netPnl.toFixed(0)}`}
              color={backtestResult.netPnl >= 0 ? '#00ff88' : '#ff3366'}
              sub={`${backtestResult.netPnl >= 0 ? '+' : ''}${((backtestResult.netPnl / 10000) * 100).toFixed(1)}% return`}
              icon="💰" />
            <StatCard label="WIN RATE" value={`${backtestResult.winRate.toFixed(1)}%`}
              color={backtestResult.winRate >= 50 ? '#00ff88' : '#ff8c00'}
              sub={`${backtestResult.wins}W / ${backtestResult.losses}L of ${backtestResult.totalTrades}`}
              icon="🎯" />
            <StatCard label="PROFIT FACTOR" value={backtestResult.profitFactor.toFixed(2)}
              color={backtestResult.profitFactor >= 1.5 ? '#00ff88' : backtestResult.profitFactor >= 1 ? '#ff8c00' : '#ff3366'}
              sub="Gross profit / loss"
              icon="⚡" />
            <StatCard label="MAX DRAWDOWN" value={`${backtestResult.maxDrawdown.toFixed(1)}%`}
              color={backtestResult.maxDrawdown < 15 ? '#00ff88' : backtestResult.maxDrawdown < 30 ? '#ff8c00' : '#ff3366'}
              sub="Peak to trough"
              icon="📉" />
            <StatCard label="SHARPE RATIO" value={backtestResult.sharpeRatio.toFixed(2)}
              color={backtestResult.sharpeRatio >= 1.5 ? '#00ff88' : backtestResult.sharpeRatio >= 0.5 ? '#ff8c00' : '#ff3366'}
              sub="Risk-adjusted return"
              icon="📊" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <StatCard label="EXPECTANCY" value={`$${backtestResult.expectancy.toFixed(2)}`}
              color={backtestResult.expectancy > 0 ? '#00d2ff' : '#ff3366'} sub="Per trade expected" icon="🧮" />
            <StatCard label="AVG WIN" value={`$${backtestResult.avgWin.toFixed(2)}`} color="#00ff88" sub="Per winning trade" />
            <StatCard label="AVG LOSS" value={`$${backtestResult.avgLoss.toFixed(2)}`} color="#ff3366" sub="Per losing trade" />
            <StatCard label="TOTAL TRADES" value={backtestResult.totalTrades.toString()} sub={`${symbol} ${timeframe} ${strategy}`} />
          </div>

          {/* Chart tabs */}
          <div className="glass" style={{ padding: 16, flex: 1 }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
              {(['curve', 'trades', 'monte'] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  padding: '5px 14px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', border: 'none',
                  background: activeTab === t ? 'rgba(0,210,255,0.2)' : 'transparent',
                  color: activeTab === t ? '#00d2ff' : '#3d6070',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  borderBottom: activeTab === t ? '2px solid #00d2ff' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  {t === 'curve' ? 'EQUITY CURVE' : t === 'trades' ? 'TRADE LOG' : 'MONTE CARLO'}
                </button>
              ))}
            </div>

            {activeTab === 'curve' && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={backtestResult.equityCurve}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00d2ff" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,210,255,0.05)" />
                  <XAxis dataKey="x" stroke="rgba(122,179,204,0.3)" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#3d6070' }} />
                  <YAxis stroke="rgba(122,179,204,0.3)" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#3d6070' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={10000} stroke="rgba(0,210,255,0.2)" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="y" stroke="#00d2ff" strokeWidth={2} fill="url(#eqGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'trades' && (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,210,255,0.1)' }}>
                      {['#', 'SIDE', 'ENTRY', 'EXIT', 'P&L', 'P&L%', 'BARS'].map((h) => (
                        <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: '#3d6070', fontSize: 9, letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResult.trades.slice(0, 100).map((t) => (
                      <tr key={t.id} style={{
                        borderBottom: '1px solid rgba(0,210,255,0.04)',
                        background: t.pnl > 0 ? 'rgba(0,255,136,0.02)' : 'rgba(255,51,102,0.02)',
                      }}>
                        <td style={{ padding: '3px 8px', color: '#3d6070' }}>{t.id}</td>
                        <td style={{ padding: '3px 8px', color: t.side === 'BUY' ? '#00ff88' : '#ff3366', fontWeight: 700 }}>{t.side}</td>
                        <td style={{ padding: '3px 8px', color: '#7ab3cc' }}>{t.entry.toFixed(4)}</td>
                        <td style={{ padding: '3px 8px', color: '#7ab3cc' }}>{t.exit.toFixed(4)}</td>
                        <td style={{ padding: '3px 8px', color: t.pnl > 0 ? '#00ff88' : '#ff3366', fontWeight: 700 }}>
                          {t.pnl > 0 ? '+' : ''}{t.pnl.toFixed(2)}
                        </td>
                        <td style={{ padding: '3px 8px', color: t.pnlPct > 0 ? '#00ff88' : '#ff3366' }}>
                          {t.pnlPct > 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                        </td>
                        <td style={{ padding: '3px 8px', color: '#3d6070' }}>{t.bars}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'monte' && (
              <div>
                <div style={{ fontSize: 10, color: '#3d6070', fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
                  Monte Carlo — 100 paths · P10 / Median / P90 percentile bands
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monteCarloData}>
                    <defs>
                      <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,210,255,0.04)" />
                    <XAxis dataKey="step" stroke="rgba(122,179,204,0.2)" tick={{ fontSize: 9, fill: '#3d6070' }} label={{ value: 'Trade', position: 'insideBottom', fill: '#3d6070', fontSize: 9 }} />
                    <YAxis stroke="rgba(122,179,204,0.2)" tick={{ fontSize: 9, fill: '#3d6070' }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(5,13,25,0.95)', border: '1px solid rgba(0,210,255,0.3)', borderRadius: 6, fontSize: 10 }}
                      formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name]}
                    />
                    <ReferenceLine y={10000} stroke="rgba(255,215,0,0.4)" strokeDasharray="6 3" />
                    <Line type="monotone" dataKey="p10" stroke="rgba(255,51,102,0.5)" strokeWidth={1.5} dot={false} name="P10 (Bear)" />
                    <Line type="monotone" dataKey="p50" stroke="#00d2ff" strokeWidth={2.5} dot={false} name="Median" />
                    <Line type="monotone" dataKey="p90" stroke="rgba(0,255,136,0.5)" strokeWidth={1.5} dot={false} name="P90 (Bull)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!backtestResult && !isBacktesting && (
        <div className="glass" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, minHeight: 300,
        }}>
          <div style={{ fontSize: 48, opacity: 0.15 }}>◈</div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#3d6070', letterSpacing: '0.1em' }}>
            BACKTESTING ENGINE READY
          </div>
          <div style={{ color: '#3d6070', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', maxWidth: 400 }}>
            Select a symbol, strategy, and timeframe above.<br />
            Click RUN TEST to execute a full bar-by-bar backtest with 1,000 historical candles.
          </div>
        </div>
      )}
    </div>
  );
}
