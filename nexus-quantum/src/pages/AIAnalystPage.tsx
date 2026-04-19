// ============================================================
// NEXUS QUANTUM v3.0 — Quantum AI Analyst Page
// ============================================================
import React, { useCallback } from 'react';
import { useNexusStore } from '../store/nexusStore';
import { getAIAnalysis } from '../services/aiService';
import { SYMBOLS, getSymbolDisplay, formatPrice } from '../services/marketData';

function BiasGauge({ bias, confidence }: { bias: string; confidence: number }) {
  const color = bias === 'BULLISH' ? '#00ff88' : bias === 'BEARISH' ? '#ff3366' : '#00d2ff';
  const rotation = bias === 'BULLISH' ? 45 : bias === 'BEARISH' ? -45 : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Gauge arc */}
      <div style={{ position: 'relative', width: 120, height: 70 }}>
        <svg width="120" height="70" viewBox="0 0 120 70">
          {/* Background arc */}
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(0,210,255,0.1)" strokeWidth="8" strokeLinecap="round" />
          {/* Bear section */}
          <path d="M 10 60 A 50 50 0 0 1 60 10" fill="none" stroke="rgba(255,51,102,0.3)" strokeWidth="8" strokeLinecap="round" />
          {/* Bull section */}
          <path d="M 60 10 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(0,255,136,0.3)" strokeWidth="8" strokeLinecap="round" />
          {/* Needle */}
          <line
            x1="60" y1="60" x2="60" y2="18"
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{
              transformOrigin: '60px 60px',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 1s ease',
            }}
          />
          <circle cx="60" cy="60" r="5" fill={color} />
        </svg>
      </div>
      <div style={{
        fontFamily: 'Orbitron, sans-serif', fontSize: 13, fontWeight: 700,
        color, letterSpacing: '0.1em',
      }}>{bias}</div>
      <div style={{ fontSize: 10, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
        {confidence}% confidence
      </div>
    </div>
  );
}

function AnalysisSection({ title, content, color = '#7ab3cc' }: { title: string; content: string; color?: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '12px 14px',
      border: '1px solid rgba(0,210,255,0.08)',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.12em', color: color, marginBottom: 8,
      }}>{title}</div>
      <div style={{
        fontSize: 11, color: '#7ab3cc', lineHeight: 1.7,
        fontFamily: 'Inter, sans-serif',
      }}>{content}</div>
    </div>
  );
}

export default function AIAnalystPage() {
  const {
    aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading,
    selectedSymbol, setSelectedSymbol, candles, tickers, addToast,
  } = useNexusStore();

  const analyze = useCallback(async (sym?: string) => {
    const symbol = sym || selectedSymbol;
    const data = candles[symbol] || [];
    setIsAiLoading(true);
    addToast({ type: 'info', title: 'AI Analyzing...', message: `Running Quantum AI on ${getSymbolDisplay(symbol)}` });
    try {
      const result = await getAIAnalysis(symbol, data);
      setAiAnalysis(result);
      addToast({ type: 'success', title: 'Analysis Complete', message: `${result.model} — ${result.bias} bias (${result.confidence}%)` });
    } catch (e) {
      addToast({ type: 'error', title: 'AI Error', message: String(e) });
    }
    setIsAiLoading(false);
  }, [selectedSymbol, candles]);

  const ticker = tickers[selectedSymbol];
  const analysis = aiAnalysis;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 700, color: '#00d2ff', letterSpacing: '0.1em' }}>
          ◎ QUANTUM AI ANALYST
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={selectedSymbol}
            onChange={(e) => { setSelectedSymbol(e.target.value); }}
            style={{ padding: '6px 10px', minWidth: 120 }}
          >
            {SYMBOLS.map((s) => <option key={s} value={s}>{getSymbolDisplay(s)}</option>)}
          </select>
          <button onClick={() => analyze()} disabled={isAiLoading} style={{
            padding: '7px 20px', borderRadius: 6, border: 'none',
            background: isAiLoading ? 'rgba(0,210,255,0.2)' : 'linear-gradient(135deg, #7c3aed, #0080ff)',
            color: isAiLoading ? '#00d2ff' : '#fff', cursor: isAiLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em',
          }}>
            {isAiLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 12, height: 12,
                  border: '2px solid rgba(0,210,255,0.3)', borderTop: '2px solid #00d2ff',
                  borderRadius: '50%', display: 'inline-block',
                  animation: 'quantum-spin 0.8s linear infinite',
                }} />
                ANALYZING...
              </span>
            ) : '◎ ANALYZE'}
          </button>
        </div>
      </div>

      {/* AI loading state */}
      {isAiLoading && (
        <div className="glass" style={{
          padding: 48, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20, borderRadius: 12, marginBottom: 16,
        }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            {[80, 60, 40].map((size, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: (80 - size) / 2, left: (80 - size) / 2,
                width: size, height: size,
                borderRadius: '50%',
                border: `2px solid rgba(${i === 0 ? '0,210,255' : i === 1 ? '124,58,237' : '0,128,255'},0.${4 - i})`,
                animation: `quantum-spin ${3 + i}s linear ${i % 2 === 0 ? '' : 'reverse'} infinite`,
              }} />
            ))}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: '#00d2ff', boxShadow: '0 0 12px #00d2ff',
            }} />
          </div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d2ff', fontSize: 13, letterSpacing: '0.1em' }}>
            QUANTUM ANALYSIS IN PROGRESS
          </div>
          <div style={{ color: '#3d6070', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>
            Processing 500+ candles · Running indicator confluence · Generating AI insight...
          </div>
        </div>
      )}

      {/* Analysis results */}
      {analysis && !isAiLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Top row: gauge + summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
            {/* Bias card */}
            <div className="glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>MARKET BIAS</div>
              <BiasGauge bias={analysis.bias} confidence={analysis.confidence} />
              <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                Model: {analysis.model}
              </div>
              <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
                {new Date(analysis.timestamp).toLocaleTimeString()}
              </div>
              {ticker && (
                <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid rgba(0,210,255,0.1)', width: '100%' }}>
                  <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>CURRENT PRICE</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: ticker.changePct >= 0 ? '#00ff88' : '#ff3366', fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatPrice(ticker.price, selectedSymbol)}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="glass" style={{ padding: 16 }}>
              <div style={{ fontSize: 9, color: '#00d2ff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 700 }}>
                EXECUTIVE SUMMARY
              </div>
              <div style={{ fontSize: 13, color: '#e8f4ff', lineHeight: 1.8, marginBottom: 16 }}>{analysis.summary}</div>

              {/* Confidence bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', minWidth: 80 }}>CONFIDENCE</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${analysis.confidence}%`,
                    background: `linear-gradient(90deg, ${analysis.confidence >= 70 ? '#00ff88' : analysis.confidence >= 50 ? '#ff8c00' : '#ff3366'}, rgba(0,210,255,0.5))`,
                    borderRadius: 3, transition: 'width 1s ease',
                  }} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  color: analysis.confidence >= 70 ? '#00ff88' : analysis.confidence >= 50 ? '#ff8c00' : '#ff3366',
                }}>{analysis.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Analysis sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <AnalysisSection title="◈ TECHNICAL ANALYSIS" content={analysis.technical} color="#00d2ff" />
            <AnalysisSection title="◎ FUNDAMENTAL OUTLOOK" content={analysis.fundamental} color="#7c3aed" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <AnalysisSection title="◉ MARKET SENTIMENT" content={analysis.sentiment} color="#ff8c00" />
            <AnalysisSection title="⚡ TRADE PLAN" content={analysis.tradePlan} color="#00ff88" />
          </div>

          {/* Key levels */}
          {analysis.keyLevels.length > 0 && (
            <div className="glass" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 9, color: '#ffd700', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 700 }}>
                ◇ KEY PRICE LEVELS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {analysis.keyLevels.map((lv, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px',
                    border: `1px solid ${lv.type === 'support' ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)'}`,
                  }}>
                    <div style={{ fontSize: 8, color: lv.type === 'support' ? '#00ff88' : '#ff3366', fontFamily: 'JetBrains Mono, monospace', marginBottom: 3, letterSpacing: '0.08em', fontWeight: 700 }}>
                      {lv.type.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 9, color: '#7ab3cc', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{lv.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e8f4ff', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formatPrice(lv.price, selectedSymbol)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick analyze other symbols */}
          <div className="glass" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10 }}>
              QUICK SCAN — CLICK TO ANALYZE
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SYMBOLS.map((s) => (
                <button key={s} onClick={() => { setSelectedSymbol(s); analyze(s); }} style={{
                  padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                  fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                  background: s === selectedSymbol ? 'rgba(0,210,255,0.15)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${s === selectedSymbol ? 'rgba(0,210,255,0.4)' : 'rgba(0,210,255,0.08)'}`,
                  color: s === selectedSymbol ? '#00d2ff' : '#3d6070',
                  transition: 'all 0.15s',
                }}>{getSymbolDisplay(s)}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !isAiLoading && (
        <div className="glass" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, padding: 80, borderRadius: 12,
        }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            {[80, 56, 32].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', top: (80 - s) / 2, left: (80 - s) / 2,
                width: s, height: s, borderRadius: '50%',
                border: `1px solid rgba(0,210,255,${0.1 + i * 0.1})`,
              }} />
            ))}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              fontSize: 20, opacity: 0.4,
            }}>◎</div>
          </div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#3d6070', fontSize: 14, letterSpacing: '0.1em' }}>
            QUANTUM AI READY
          </div>
          <div style={{ color: '#3d6070', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', maxWidth: 400 }}>
            Select a symbol and click ANALYZE to get a deep institutional-grade analysis<br />
            powered by multi-model AI with ICT, SMC, and macro context.
            <br /><br />
            <span style={{ color: 'rgba(0,210,255,0.4)' }}>
              Add VITE_GEMINI_API_KEY to .env for enhanced AI via Google Gemini.<br />
              Local quantum analysis works without an API key.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
