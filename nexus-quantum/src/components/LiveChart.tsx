// ============================================================
// NEXUS QUANTUM v3.0 — Live TradingView Chart Component
// ============================================================
import React, { useEffect, useRef, useCallback } from 'react';
import { useNexusStore } from '../store/nexusStore';
import { formatPrice } from '../services/marketData';

interface Props {
  symbol: string;
  height?: number;
}

export default function LiveChart({ symbol, height = 340 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const volSeriesRef = useRef<any>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const candles = useNexusStore((s) => s.candles[symbol] || []);

  // ─── Compute chart height ─────────────────────────────────────
  const getHeight = useCallback(() => {
    if (containerRef.current) {
      const h = containerRef.current.clientHeight;
      return h > 50 ? h : height;
    }
    return height;
  }, [height]);

  // ─── Init chart ───────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;
    let localChart: any = null;

    const init = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const lwc = await import('lightweight-charts');
        const { createChart, ColorType, CrosshairMode } = lwc;

        if (destroyed || !containerRef.current) return;

        const chartHeight = getHeight();

        localChart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: chartHeight,
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: 'rgba(122,179,204,0.7)',
            fontFamily: "'JetBrains Mono', monospace",
          },
          grid: {
            vertLines: { color: 'rgba(0,210,255,0.04)' },
            horzLines: { color: 'rgba(0,210,255,0.04)' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: { color: 'rgba(0,210,255,0.4)', labelBackgroundColor: '#071220' },
            horzLine: { color: 'rgba(0,210,255,0.4)', labelBackgroundColor: '#071220' },
          },
          rightPriceScale: {
            borderColor: 'rgba(0,210,255,0.08)',
            textColor: 'rgba(122,179,204,0.6)',
          },
          timeScale: {
            borderColor: 'rgba(0,210,255,0.08)',
            textColor: 'rgba(122,179,204,0.5)',
            timeVisible: true,
            secondsVisible: false,
          },
          handleScroll: true,
          handleScale: true,
        });

        // Candlestick series
        const candleSeries = localChart.addCandlestickSeries({
          upColor: '#00ff88',
          downColor: '#ff3366',
          borderUpColor: '#00ff88',
          borderDownColor: '#ff3366',
          wickUpColor: 'rgba(0,255,136,0.5)',
          wickDownColor: 'rgba(255,51,102,0.5)',
        });

        // Volume histogram
        const volSeries = localChart.addHistogramSeries({
          color: 'rgba(0,210,255,0.15)',
          priceFormat: { type: 'volume' },
          priceScaleId: 'vol',
        });
        localChart.priceScale('vol').applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
        });

        chartRef.current = localChart;
        seriesRef.current = candleSeries;
        volSeriesRef.current = volSeries;

        // Load initial data
        const currentCandles = useNexusStore.getState().candles[symbol] || [];
        if (currentCandles.length > 0) {
          const sorted = [...currentCandles].sort((a, b) => a.time - b.time);
          candleSeries.setData(
            sorted.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close }))
          );
          volSeries.setData(
            sorted.map((c) => ({
              time: c.time as any,
              value: c.volume,
              color: c.close >= c.open ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)',
            }))
          );
          localChart.timeScale().fitContent();
        }

        // ResizeObserver — properly tracked for cleanup
        if (roRef.current) roRef.current.disconnect();
        roRef.current = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (chartRef.current && entry.contentRect) {
              const w = entry.contentRect.width;
              const h = entry.contentRect.height > 50 ? entry.contentRect.height : height;
              try { chartRef.current.resize(w, h); } catch (_) {}
            }
          }
        });
        roRef.current.observe(containerRef.current);

      } catch (e) {
        console.error('[NEXUS] Chart init error:', e);
      }
    };

    init();

    return () => {
      destroyed = true;
      // Disconnect resize observer
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
      // Remove chart
      try {
        if (chartRef.current) {
          chartRef.current.remove();
        }
      } catch (_) {}
      chartRef.current = null;
      seriesRef.current = null;
      volSeriesRef.current = null;
    };
  }, [symbol]); // Re-init only when symbol changes

  // ─── Update chart data reactively ────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !volSeriesRef.current || candles.length === 0) return;
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    try {
      seriesRef.current.setData(
        sorted.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close }))
      );
      volSeriesRef.current.setData(
        sorted.map((c) => ({
          time: c.time as any,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)',
        }))
      );
    } catch (e) {
      // Ignore "not enough data" errors from lightweight-charts
    }
  }, [candles]);

  const lastCandle = candles[candles.length - 1];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* OHLCV overlay */}
      {lastCandle && (
        <div style={{
          position: 'absolute', top: 8, left: 10, zIndex: 5,
          display: 'flex', gap: 10, pointerEvents: 'none',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        }}>
          {[
            { label: 'O', value: formatPrice(lastCandle.open, symbol), color: '#7ab3cc' },
            { label: 'H', value: formatPrice(lastCandle.high, symbol), color: '#00ff88' },
            { label: 'L', value: formatPrice(lastCandle.low, symbol), color: '#ff3366' },
            { label: 'C', value: formatPrice(lastCandle.close, symbol), color: lastCandle.close >= lastCandle.open ? '#00ff88' : '#ff3366' },
          ].map((o) => (
            <span key={o.label} style={{ color: 'rgba(61,96,112,0.8)' }}>
              {o.label}:{' '}
              <span style={{ color: o.color, fontWeight: 600 }}>{o.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Loading spinner */}
      {candles.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 10,
          background: 'rgba(2,4,8,0.4)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid rgba(0,210,255,0.1)',
            borderTop: '3px solid #00d2ff',
            borderRadius: '50%',
            animation: 'quantum-spin 0.8s linear infinite',
          }} />
          <div style={{ color: '#3d6070', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
            Loading {symbol}...
          </div>
        </div>
      )}

      {/* Chart container — must fill parent */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: height }}
      />
    </div>
  );
}
