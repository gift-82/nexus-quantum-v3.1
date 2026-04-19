// ============================================================
// NEXUS QUANTUM v3.0 — Strategy Library Page
// ============================================================
import React, { useState } from 'react';

interface Strategy {
  id: string;
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  winRate: string;
  rr: string;
  description: string;
  rules: string[];
  entry: string[];
  exit: string[];
  timeframes: string[];
  markets: string[];
  pineScript: string;
  color: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: 'ict_amd',
    name: 'ICT AMD Manipulation',
    category: 'ICT',
    difficulty: 'Advanced',
    winRate: '62-68%',
    rr: '1:3+',
    color: '#00d2ff',
    description: 'The AMD (Accumulation-Manipulation-Distribution) model identifies institutional manipulation during the 3:30–4:30 UTC window. Smart money sweeps liquidity before the real move begins.',
    rules: [
      'Mark the 4H Day High/Low (green/red dashed lines)',
      'Mark the 1H Hour High/Low (cyan/orange dashed lines)',
      'Draw a vertical purple line at 3:30 AM UTC',
      'Wait for price to sweep 1H high/low during manipulation window',
      'Confirm with RSI divergence and volume spike',
      'Enter on the first 15m candle close after manipulation',
    ],
    entry: [
      'BUY: Price sweeps 1H low, then closes above it with RSI > 50',
      'SELL: Price sweeps 1H high, then closes below it with RSI < 50',
      'Minimum RSI divergence on 15m timeframe',
      'Volume must be 1.2× the 10-period average',
    ],
    exit: [
      'Take Profit: Opposite 4H Day High/Low',
      'Stop Loss: 1.5× ATR beyond the swept level',
      'Trail stop to breakeven after 1:1 R:R reached',
      'Exit before NY close if position open all day',
    ],
    timeframes: ['15m', '1h', '4h'],
    markets: ['Gold (XAUUSD)', 'Major Forex Pairs', 'BTC/USDT'],
    pineScript: `//@version=5
strategy("ICT AMD Manipulation", overlay=true, default_qty_type=strategy.percent_of_equity)

// Parameters
amd_hour = input.int(3, "AMD Hour (UTC)")
amd_min = input.int(30, "AMD Minute (UTC)")
rsi_period = input.int(14, "RSI Period")
rsi_bull = input.float(50, "RSI Bull Threshold")
atr_mult = input.float(1.5, "ATR SL Multiplier")
tp_mult = input.float(3.0, "ATR TP Multiplier")

// Indicators
rsi = ta.rsi(close, rsi_period)
atr = ta.atr(14)
[_, h1h] = ta.highest(high, 4), ta.highest(high, 4)
h1l = ta.lowest(low, 4)

// AMD manipulation window (3:30-4:30 UTC)
inWindow = (hour == amd_hour and minute >= amd_min) or (hour == amd_hour + 1 and minute <= 30)

// Volume confirmation
vol_avg = ta.sma(volume, 10)
vol_surge = volume > vol_avg * 1.2

// Break of 1H high/low
broke_high = close > h1h[1] and close[1] <= h1h[1]
broke_low = close < h1l[1] and close[1] >= h1l[1]

// Plot levels
plot(h1h, "1H High", color.new(color.cyan, 50), style=plot.style_linebr, linewidth=1)
plot(h1l, "1H Low", color.new(color.orange, 50), style=plot.style_linebr, linewidth=1)

// AMD vertical line
bgcolor(inWindow ? color.new(color.purple, 93) : na)

// Signals
long_signal = broke_high and rsi > rsi_bull and vol_surge and inWindow
short_signal = broke_low and rsi < 100 - rsi_bull and vol_surge and inWindow

if long_signal
    strategy.entry("AMD Long", strategy.long)
    strategy.exit("AMD Long Exit", "AMD Long", stop=close - atr * atr_mult, limit=close + atr * tp_mult)
    label.new(bar_index, low, "▲ AMD BUY", style=label.style_label_up, color=color.new(color.green, 30))

if short_signal
    strategy.entry("AMD Short", strategy.short)
    strategy.exit("AMD Short Exit", "AMD Short", stop=close + atr * atr_mult, limit=close - atr * tp_mult)
    label.new(bar_index, high, "▼ AMD SELL", style=label.style_label_down, color=color.new(color.red, 30))`,
  },
  {
    id: 'smc_ob',
    name: 'SMC Order Block + FVG',
    category: 'Smart Money',
    difficulty: 'Expert',
    winRate: '58-65%',
    rr: '1:4+',
    color: '#7c3aed',
    description: 'Smart Money Concepts combines Order Blocks (OB), Fair Value Gaps (FVG), and Liquidity Sweeps to identify high-probability institutional entry points.',
    rules: [
      'Identify the trend using Market Structure: HH/HL (bull) or LH/LL (bear)',
      'Locate the most recent Order Block (last bearish candle before bullish impulse)',
      'Mark the Fair Value Gap between the OB and the next candle',
      'Wait for price to retrace into the OB/FVG zone',
      'Look for inducement (liquidity sweep) before entering',
      'Enter on strong confirmation candle with confluence',
    ],
    entry: [
      'Bullish: Price retraces to bullish OB, sweeps previous lows, then closes above',
      'Bearish: Price retraces to bearish OB, sweeps previous highs, then closes below',
      'FVG should partially fill before entry',
      'EMA21 must align with trade direction',
    ],
    exit: [
      'TP: Next significant liquidity pool (swing highs/lows, equal highs/lows)',
      'SL: Below the Order Block by 0.5× ATR',
      'Scale out 50% at 1:2, move SL to breakeven',
      'Let remaining 50% run to full target',
    ],
    timeframes: ['15m', '1h', '4h', '1d'],
    markets: ['All Forex Pairs', 'Gold', 'Major Crypto'],
    pineScript: `//@version=5
// SMC Order Block + FVG Detector
indicator("SMC OB + FVG", overlay=true)

lookback = input.int(5, "OB Lookback")

// Market structure
swing_high = ta.pivothigh(high, lookback, lookback)
swing_low = ta.pivotlow(low, lookback, lookback)

// Detect OBs
bull_ob = close[1] < open[1] and close > open and close > high[1]
bear_ob = close[1] > open[1] and close < open and close < low[1]

// Detect FVGs
bull_fvg = low > high[2]
bear_fvg = high < low[2]

// Plot
plotshape(bull_ob, "Bullish OB", shape.square, location.belowbar, color.new(color.green,70), size=size.small)
plotshape(bear_ob, "Bearish OB", shape.square, location.abovebar, color.new(color.red,70), size=size.small)
plotshape(bull_fvg, "Bull FVG", shape.triangleup, location.belowbar, color.new(color.cyan,50))
plotshape(bear_fvg, "Bear FVG", shape.triangledown, location.abovebar, color.new(color.orange,50))`,
  },
  {
    id: 'wyckoff',
    name: 'Wyckoff Method',
    category: 'Institutional',
    difficulty: 'Expert',
    winRate: '55-62%',
    rr: '1:5+',
    color: '#ffd700',
    description: 'The Wyckoff Method identifies the 4 phases of market cycles: Accumulation, Markup, Distribution, and Markdown. Trade in harmony with the composite operator.',
    rules: [
      'Phase A (Accumulation): PS, SC, AR, ST — stop of decline',
      'Phase B: Building cause, secondary tests',
      'Phase C: Spring or test — the last shakeout',
      'Phase D: SOS (Sign of Strength) — demand overcomes supply',
      'Enter on LPS (Last Point of Supply) after SOS',
      'Phase E: Markup — ride the trend to next distribution',
    ],
    entry: [
      'Long: Enter on Spring + Test with volume dry-up',
      'Confirm with Point & Figure count for target projection',
      'Volume should decrease on tests (spring, LPS)',
      'Breadth indicators should confirm',
    ],
    exit: [
      'Exit at UTAD (Upthrust After Distribution)',
      'Use P&F count from accumulation base',
      'Exit when distribution signs appear: LPSY, UTAD',
    ],
    timeframes: ['4h', '1d', '1w'],
    markets: ['Major Crypto', 'Indices', 'Commodities'],
    pineScript: `//@version=5
indicator("Wyckoff Phase Detector", overlay=false)

period = input.int(20, "Period")
vol = volume
vol_sma = ta.sma(vol, period)
price_change = (close - close[period]) / close[period] * 100
vol_ratio = vol / vol_sma

// Simplified phase detection
spring = ta.lowest(low, period) == low and vol_ratio > 1.5 and close > open
utad = ta.highest(high, period) == high and vol_ratio > 1.5 and close < open

plotshape(spring, "Spring (Buy Zone)", shape.triangleup, location.belowbar, color.green, size=size.normal)
plotshape(utad, "UTAD (Sell Zone)", shape.triangledown, location.abovebar, color.red, size=size.normal)
plot(vol_ratio, "Volume Ratio", color.blue)
hline(1.5, "High Volume", color.gray, linestyle=hline.style_dashed)`,
  },
  {
    id: 'breakerblock',
    name: 'Breaker Block',
    category: 'ICT',
    difficulty: 'Intermediate',
    winRate: '60-70%',
    rr: '1:3',
    color: '#ff8c00',
    description: 'A Breaker Block forms when price breaks a previous structure level, converting former support into resistance (or vice versa). Highly reliable when combined with FVG.',
    rules: [
      'Identify a broken swing high/low (failed OB)',
      'The candle that caused the break becomes the Breaker Block',
      'Wait for price to retrace back to the Breaker zone',
      'Confirm with momentum and volume',
    ],
    entry: [
      'Bearish Breaker: Rally back to broken support level',
      'Bullish Breaker: Decline back to broken resistance level',
      'Best when coincides with a discount/premium zone',
    ],
    exit: [
      'Target: Next liquidity pool',
      'SL: Beyond the Breaker Block high/low',
    ],
    timeframes: ['5m', '15m', '1h'],
    markets: ['Forex', 'Gold', 'Crypto'],
    pineScript: `//@version=5
indicator("Breaker Block Detector", overlay=true)

lookback = input.int(10)
swing_high = ta.pivothigh(high, lookback, lookback)
swing_low = ta.pivotlow(low, lookback, lookback)

// Broken structure
bull_break = not na(swing_high) and close > swing_high
bear_break = not na(swing_low) and close < swing_low

bgcolor(bull_break ? color.new(color.green, 90) : bear_break ? color.new(color.red, 90) : na)`,
  },
  {
    id: 'liquidity_sweep',
    name: 'Liquidity Sweep Reversal',
    category: 'Smart Money',
    difficulty: 'Intermediate',
    winRate: '64-72%',
    rr: '1:2.5',
    color: '#00ff88',
    description: 'Liquidity sweeps occur when price briefly breaks beyond swing highs/lows to trigger stop losses, then reverses sharply. This is smart money hunting stops before the real move.',
    rules: [
      'Identify equal highs/lows (resting liquidity)',
      'Wait for a wick beyond the liquidity level',
      'Price must CLOSE back inside the range',
      'Enter on the next candle open after the closing candle',
    ],
    entry: [
      'Long: Wick below equal lows, body closes above',
      'Short: Wick above equal highs, body closes below',
      'Volume spike during the sweep confirms manipulation',
    ],
    exit: [
      'TP: Opposite liquidity pool',
      'SL: Beyond the sweep wick tip',
    ],
    timeframes: ['1m', '5m', '15m', '1h'],
    markets: ['All liquid markets'],
    pineScript: `//@version=5
indicator("Liquidity Sweep Detector", overlay=true)
lookback = input.int(20)
prev_high = ta.highest(high, lookback)[1]
prev_low = ta.lowest(low, lookback)[1]
bull_sweep = low < prev_low and close > prev_low
bear_sweep = high > prev_high and close < prev_high
plotshape(bull_sweep, "Bull Sweep", shape.triangleup, location.belowbar, color.green)
plotshape(bear_sweep, "Bear Sweep", shape.triangledown, location.abovebar, color.red)`,
  },
];

const CATEGORIES = ['All', 'ICT', 'Smart Money', 'Institutional'];

export default function StrategyPage() {
  const [selected, setSelected] = useState<Strategy>(STRATEGIES[0]);
  const [tab, setTab] = useState<'overview' | 'rules' | 'pine'>('overview');
  const [category, setCategory] = useState('All');

  const filtered = STRATEGIES.filter((s) => category === 'All' || s.category === category);

  const diffColor = { Beginner: '#00ff88', Intermediate: '#ff8c00', Advanced: '#00d2ff', Expert: '#7c3aed' };

  const copyPine = () => {
    navigator.clipboard.writeText(selected.pineScript);
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '260px 1fr', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ borderRight: '1px solid rgba(0,210,255,0.08)', overflowY: 'auto', background: 'rgba(2,4,8,0.5)' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,210,255,0.08)' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#00d2ff', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
            ◇ STRATEGY LIBRARY
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '3px 8px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                background: category === c ? 'rgba(0,210,255,0.15)' : 'transparent',
                border: `1px solid ${category === c ? 'rgba(0,210,255,0.4)' : 'rgba(0,210,255,0.08)'}`,
                color: category === c ? '#00d2ff' : '#3d6070',
              }}>{c}</button>
            ))}
          </div>
        </div>
        {filtered.map((s) => (
          <div key={s.id} onClick={() => setSelected(s)} style={{
            padding: '10px 14px', cursor: 'pointer',
            borderLeft: `3px solid ${selected.id === s.id ? s.color : 'transparent'}`,
            background: selected.id === s.id ? `${s.color}08` : 'transparent',
            borderBottom: '1px solid rgba(0,210,255,0.05)',
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: selected.id === s.id ? s.color : '#e8f4ff', marginBottom: 4 }}>
              {s.name}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 8, padding: '1px 5px', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace',
                background: 'rgba(0,0,0,0.3)', color: '#3d6070', border: '1px solid rgba(0,210,255,0.06)',
              }}>{s.category}</span>
              <span style={{
                fontSize: 8, padding: '1px 5px', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace',
                background: `${diffColor[s.difficulty]}15`, color: diffColor[s.difficulty],
                border: `1px solid ${diffColor[s.difficulty]}30`,
              }}>{s.difficulty}</span>
              <span style={{ fontSize: 8, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>WR: {s.winRate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div style={{ overflow: 'auto', padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: 18, fontWeight: 800,
              color: selected.color, letterSpacing: '0.08em', marginBottom: 6,
            }}>{selected.name}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: selected.category, color: '#7ab3cc' },
                { label: selected.difficulty, color: diffColor[selected.difficulty] },
                { label: `WR: ${selected.winRate}`, color: '#00ff88' },
                { label: `R:R ${selected.rr}`, color: '#ffd700' },
              ].map((b) => (
                <span key={b.label} style={{
                  padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  background: `${b.color}15`, color: b.color, border: `1px solid ${b.color}30`,
                }}>{b.label}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['overview', 'rules', 'pine'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '5px 12px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                background: tab === t ? `${selected.color}20` : 'transparent',
                border: `1px solid ${tab === t ? selected.color + '40' : 'rgba(0,210,255,0.1)'}`,
                color: tab === t ? selected.color : '#3d6070',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {t === 'pine' ? '⟨/⟩ Pine Script' : t === 'rules' ? '◈ Rules' : '◎ Overview'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="glass" style={{ padding: 16, borderRadius: 10, borderLeft: `3px solid ${selected.color}` }}>
              <div style={{ fontSize: 12, color: '#7ab3cc', lineHeight: 1.8 }}>{selected.description}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="glass" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 9, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 700 }}>▲ ENTRY RULES</div>
                {selected.entry.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#00ff88', fontSize: 11, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 11, color: '#7ab3cc', lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
              <div className="glass" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 9, color: '#ff3366', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 700 }}>▼ EXIT RULES</div>
                {selected.exit.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#ff3366', fontSize: 11, flexShrink: 0 }}>◉</span>
                    <span style={{ fontSize: 11, color: '#7ab3cc', lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="glass" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 9, color: '#00d2ff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700 }}>BEST TIMEFRAMES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.timeframes.map((tf) => (
                    <span key={tf} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(0,210,255,0.12)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.25)' }}>{tf}</span>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 9, color: '#ffd700', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700 }}>BEST MARKETS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selected.markets.map((m) => (
                    <span key={m} style={{ fontSize: 10, color: '#7ab3cc', fontFamily: 'JetBrains Mono, monospace' }}>◇ {m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'rules' && (
          <div className="glass" style={{ padding: 20, borderRadius: 10 }}>
            <div style={{ fontSize: 9, color: selected.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 14, fontWeight: 700 }}>
              STEP-BY-STEP TRADING RULES
            </div>
            {selected.rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: `${selected.color}20`, border: `1px solid ${selected.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: selected.color,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>{i + 1}</div>
                <div style={{ fontSize: 12, color: '#7ab3cc', lineHeight: 1.7, paddingTop: 3 }}>{r}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'pine' && (
          <div style={{ position: 'relative' }}>
            <button onClick={copyPine} style={{
              position: 'absolute', top: 12, right: 12, zIndex: 1,
              padding: '5px 12px', borderRadius: 5, fontSize: 10, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
              background: 'rgba(0,210,255,0.15)', border: '1px solid rgba(0,210,255,0.3)',
              color: '#00d2ff',
            }}>⎘ COPY</button>
            <pre style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 20,
              border: '1px solid rgba(0,210,255,0.1)',
              color: '#7ab3cc', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{selected.pineScript}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
