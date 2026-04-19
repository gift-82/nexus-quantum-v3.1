// ============================================================
// NEXUS QUANTUM v3.0 — Signal Engine
// ICT AMD, Wyckoff, SMC, Order Blocks, FVG, Liquidity Sweeps
// ============================================================
import { Candle, Signal, SignalType } from '../store/nexusStore';

// ─── Technical Indicators ────────────────────────────────────

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function calcSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function calcMACD(closes: number[]): { macd: number; signal: number; hist: number } {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine.slice(-9), 9);
  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  return { macd, signal, hist: macd - signal };
}

export function calcBollingerBands(closes: number[], period = 20, multiplier = 2) {
  if (closes.length < period) return { upper: 0, mid: 0, lower: 0 };
  const slice = closes.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / period;
  const std = Math.sqrt(variance);
  return { upper: mid + multiplier * std, mid, lower: mid - multiplier * std };
}

export function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return 0;
  const trs = candles.slice(-period - 1).map((c, i, arr) => {
    if (i === 0) return c.high - c.low;
    const prev = arr[i - 1];
    return Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
  });
  return trs.reduce((a, b) => a + b, 0) / period;
}

// ─── Pattern Detectors ───────────────────────────────────────

export function detectOrderBlock(candles: Candle[]): { bullish: number | null; bearish: number | null } {
  if (candles.length < 5) return { bullish: null, bearish: null };
  // Bearish OB: strong bearish candle before bullish move
  let bullish = null, bearish = null;
  for (let i = candles.length - 5; i < candles.length - 1; i++) {
    const c = candles[i];
    const next = candles[i + 1];
    const bodySize = Math.abs(c.close - c.open);
    const range = c.high - c.low;
    if (range === 0) continue;
    // Bullish OB: large bearish candle followed by reversal up
    if (c.close < c.open && bodySize / range > 0.6 && next.close > next.open && next.close > c.high) {
      bullish = c.low;
    }
    // Bearish OB: large bullish candle followed by reversal down
    if (c.close > c.open && bodySize / range > 0.6 && next.close < next.open && next.close < c.low) {
      bearish = c.high;
    }
  }
  return { bullish, bearish };
}

export function detectFairValueGap(candles: Candle[]): { bullFVG: [number, number] | null; bearFVG: [number, number] | null } {
  if (candles.length < 3) return { bullFVG: null, bearFVG: null };
  let bullFVG: [number, number] | null = null;
  let bearFVG: [number, number] | null = null;
  for (let i = candles.length - 3; i < candles.length - 2; i++) {
    const prev = candles[i];
    const curr = candles[i + 1];
    const next = candles[i + 2];
    // Bullish FVG: gap between prev high and next low
    if (next.low > prev.high) bullFVG = [prev.high, next.low];
    // Bearish FVG: gap between prev low and next high
    if (next.high < prev.low) bearFVG = [next.high, prev.low];
  }
  return { bullFVG, bearFVG };
}

export function detectLiquiditySweep(candles: Candle[], lookback = 20): { sweptHigh: boolean; sweptLow: boolean; level: number } {
  if (candles.length < lookback) return { sweptHigh: false, sweptLow: false, level: 0 };
  const recent = candles.slice(-lookback - 1, -1);
  const prevHigh = Math.max(...recent.map((c) => c.high));
  const prevLow = Math.min(...recent.map((c) => c.low));
  const last = candles[candles.length - 1];
  const sweptHigh = last.high > prevHigh && last.close < prevHigh;
  const sweptLow = last.low < prevLow && last.close > prevLow;
  return { sweptHigh, sweptLow, level: sweptHigh ? prevHigh : prevLow };
}

export function detectWyckoffPhase(candles: Candle[]): string {
  if (candles.length < 30) return 'UNKNOWN';
  const last20 = candles.slice(-20);
  const volumes = last20.map((c) => c.volume);
  const closes = last20.map((c) => c.close);
  const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const trend = closes[closes.length - 1] - closes[0];
  const lastVol = volumes[volumes.length - 1];
  // Simplified Wyckoff detection
  if (trend < 0 && lastVol > avgVol * 1.5 && candles[candles.length - 1].close > candles[candles.length - 1].open) return 'SPRING';
  if (trend > 0 && lastVol > avgVol * 1.5 && candles[candles.length - 1].close < candles[candles.length - 1].open) return 'UPTHRUST';
  if (trend < 0 && lastVol < avgVol * 0.7) return 'ACCUMULATION';
  if (trend > 0 && lastVol < avgVol * 0.7) return 'DISTRIBUTION';
  if (trend > 0 && lastVol > avgVol) return 'MARKUP';
  if (trend < 0 && lastVol > avgVol) return 'MARKDOWN';
  return 'RANGING';
}

// ─── ICT AMD Strategy (Core) ─────────────────────────────────

export function detectICTAMD(
  candles: Candle[],
  symbol: string,
): Partial<Signal> | null {
  if (candles.length < 50) return null;
  const closes = candles.map((c) => c.close);
  const rsi = calcRSI(closes);
  const atr = calcATR(candles);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  // Check if current time is in AMD manipulation window (3:00–4:30 UTC)
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const inManipulationWindow = (utcHour === 3 && utcMin >= 30) || (utcHour === 4 && utcMin <= 30);

  // 1H high/low lookback (approx 4 candles on 15m)
  const lookback = candles.slice(-8, -1);
  const h1High = Math.max(...lookback.map((c) => c.high));
  const h1Low = Math.min(...lookback.map((c) => c.low));

  const brokeHigh = last.close > h1High && prev.close <= h1High;
  const brokeLow = last.close < h1Low && prev.close >= h1Low;
  const volumeConfirm = last.volume > candles.slice(-10).reduce((a, c) => a + c.volume, 0) / 10 * 1.2;

  if (brokeHigh && rsi > 50 && rsi < 75 && volumeConfirm) {
    const reasons = [
      `1H High breached at ${h1High.toFixed(4)}`,
      `RSI: ${rsi.toFixed(1)} (bullish zone)`,
      `Volume surge confirmed`,
    ];
    if (inManipulationWindow) reasons.push('ICT AMD Manipulation Window (3:30 UTC)');
    return {
      symbol, type: 'BUY',
      price: last.close,
      sl: last.close - atr * 1.5,
      tp: last.close + atr * 3,
      rr: 2.0,
      confluenceScore: Math.min(95, 60 + (inManipulationWindow ? 20 : 0) + (volumeConfirm ? 15 : 0)),
      strategy: 'ICT AMD',
      timeframe: '15m',
      reasons,
    };
  }
  if (brokeLow && rsi < 50 && rsi > 25 && volumeConfirm) {
    const reasons = [
      `1H Low breached at ${h1Low.toFixed(4)}`,
      `RSI: ${rsi.toFixed(1)} (bearish zone)`,
      `Volume surge confirmed`,
    ];
    if (inManipulationWindow) reasons.push('ICT AMD Manipulation Window (3:30 UTC)');
    return {
      symbol, type: 'SELL',
      price: last.close,
      sl: last.close + atr * 1.5,
      tp: last.close - atr * 3,
      rr: 2.0,
      confluenceScore: Math.min(95, 60 + (inManipulationWindow ? 20 : 0) + (volumeConfirm ? 15 : 0)),
      strategy: 'ICT AMD',
      timeframe: '15m',
      reasons,
    };
  }
  return null;
}

// ─── SMC + Order Block + FVG Signal ──────────────────────────

export function detectSMCSignal(candles: Candle[], symbol: string): Partial<Signal> | null {
  if (candles.length < 30) return null;
  const closes = candles.map((c) => c.close);
  const rsi = calcRSI(closes);
  const atr = calcATR(candles);
  const last = candles[candles.length - 1];
  const { sweptHigh, sweptLow } = detectLiquiditySweep(candles);
  const { bullFVG, bearFVG } = detectFairValueGap(candles);
  const ob = detectOrderBlock(candles);
  const ema21 = calcEMA(closes, 21);
  const trend = last.close > ema21[ema21.length - 1] ? 'BULL' : 'BEAR';

  if (sweptLow && bullFVG && ob.bullish && trend === 'BULL' && rsi < 50) {
    return {
      symbol, type: 'BUY',
      price: last.close,
      sl: ob.bullish - atr * 0.5,
      tp: last.close + atr * 3,
      rr: 3.0,
      confluenceScore: Math.min(98, 70 + (sweptLow ? 10 : 0) + (bullFVG ? 10 : 0) + (ob.bullish ? 8 : 0)),
      strategy: 'SMC + OB + FVG',
      timeframe: '15m',
      reasons: ['Liquidity sweep low', 'Bullish FVG present', 'Order block support', 'Trend aligned'],
    };
  }
  if (sweptHigh && bearFVG && ob.bearish && trend === 'BEAR' && rsi > 50) {
    return {
      symbol, type: 'SELL',
      price: last.close,
      sl: ob.bearish + atr * 0.5,
      tp: last.close - atr * 3,
      rr: 3.0,
      confluenceScore: Math.min(98, 70 + (sweptHigh ? 10 : 0) + (bearFVG ? 10 : 0) + (ob.bearish ? 8 : 0)),
      strategy: 'SMC + OB + FVG',
      timeframe: '15m',
      reasons: ['Liquidity sweep high', 'Bearish FVG present', 'Order block resistance', 'Trend aligned'],
    };
  }
  return null;
}

// ─── Run All Strategies ───────────────────────────────────────

export function runSignalEngine(candles: Candle[], symbol: string, strategy: string): Signal | null {
  let partial: Partial<Signal> | null = null;
  if (strategy === 'ICT_AMD' || strategy === 'ALL') partial = detectICTAMD(candles, symbol);
  if (!partial && (strategy === 'SMC' || strategy === 'ALL')) partial = detectSMCSignal(candles, symbol);
  if (!partial) return null;
  return {
    id: `${symbol}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    symbol,
    type: partial.type as SignalType,
    price: partial.price!,
    sl: partial.sl!,
    tp: partial.tp!,
    rr: partial.rr!,
    confluenceScore: partial.confluenceScore!,
    strategy: partial.strategy!,
    timeframe: partial.timeframe!,
    reasons: partial.reasons!,
    timestamp: Date.now(),
    status: 'ACTIVE',
  };
}

// ─── Backtest Engine ──────────────────────────────────────────

export function runBacktest(
  candles: Candle[],
  symbol: string,
  strategy: string,
  onProgress: (pct: number) => void,
): Promise<import('../store/nexusStore').BacktestResult> {
  return new Promise((resolve) => {
    const results = {
      trades: [] as import('../store/nexusStore').BacktestTrade[],
      equity: 10000,
      peak: 10000,
      maxDD: 0,
      equityCurve: [{ x: 0, y: 10000 }] as { x: number; y: number }[],
    };

    const windowSize = 50;
    const total = candles.length - windowSize;
    let processed = 0;

    const processChunk = () => {
      const chunkSize = 50;
      for (let i = 0; i < chunkSize && processed < total; i++, processed++) {
        const idx = processed + windowSize;
        const window = candles.slice(idx - windowSize, idx);
        const sig = runSignalEngine(window, symbol, strategy);
        if (!sig) continue;

        // Forward-test the signal on next 20 candles
        const future = candles.slice(idx, idx + 20);
        let tradeResult: 'WIN' | 'LOSS' | null = null;
        let exitPrice = sig.price;
        let exitBar = 0;

        for (let j = 0; j < future.length; j++) {
          const fc = future[j];
          if (sig.type === 'BUY') {
            if (fc.low <= sig.sl) { tradeResult = 'LOSS'; exitPrice = sig.sl; exitBar = j; break; }
            if (fc.high >= sig.tp) { tradeResult = 'WIN'; exitPrice = sig.tp; exitBar = j; break; }
          } else {
            if (fc.high >= sig.sl) { tradeResult = 'LOSS'; exitPrice = sig.sl; exitBar = j; break; }
            if (fc.low <= sig.tp) { tradeResult = 'WIN'; exitPrice = sig.tp; exitBar = j; break; }
          }
        }

        if (!tradeResult) continue;

        const pnlPct = sig.type === 'BUY'
          ? ((exitPrice - sig.price) / sig.price) * 100
          : ((sig.price - exitPrice) / sig.price) * 100;
        const pnl = (results.equity * 0.01) * (pnlPct / 100) * results.equity / 100;
        results.equity += pnl;
        if (results.equity > results.peak) results.peak = results.equity;
        const dd = (results.peak - results.equity) / results.peak * 100;
        if (dd > results.maxDD) results.maxDD = dd;
        results.equityCurve.push({ x: results.trades.length + 1, y: Math.round(results.equity) });
        results.trades.push({
          id: results.trades.length + 1,
          symbol,
          side: sig.type,
          entry: sig.price,
          exit: exitPrice,
          pnl: Math.round(pnl * 100) / 100,
          pnlPct: Math.round(pnlPct * 100) / 100,
          bars: exitBar,
          timestamp: candles[idx].time,
        });
      }

      onProgress(Math.round((processed / total) * 100));

      if (processed < total) {
        setTimeout(processChunk, 0);
      } else {
        const wins = results.trades.filter((t) => t.pnl > 0);
        const losses = results.trades.filter((t) => t.pnl <= 0);
        const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
        const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
        const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
        const expectancy = wins.length / results.trades.length * avgWin - losses.length / results.trades.length * avgLoss;
        // Sharpe (simplified)
        const returns = results.equityCurve.slice(1).map((p, i) => (p.y - results.equityCurve[i].y) / results.equityCurve[i].y);
        const avgRet = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdRet = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgRet, 2), 0) / returns.length);
        const sharpe = stdRet > 0 ? (avgRet / stdRet) * Math.sqrt(252) : 0;

        resolve({
          totalTrades: results.trades.length,
          wins: wins.length,
          losses: losses.length,
          winRate: results.trades.length > 0 ? (wins.length / results.trades.length) * 100 : 0,
          profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0,
          netPnl: Math.round((results.equity - 10000) * 100) / 100,
          maxDrawdown: Math.round(results.maxDD * 100) / 100,
          sharpeRatio: Math.round(sharpe * 100) / 100,
          expectancy: Math.round(expectancy * 100) / 100,
          avgWin: Math.round(avgWin * 100) / 100,
          avgLoss: Math.round(avgLoss * 100) / 100,
          equityCurve: results.equityCurve,
          trades: results.trades,
        });
      }
    };
    processChunk();
  });
}
