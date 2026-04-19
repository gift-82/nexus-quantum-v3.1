// ============================================================
// NEXUS QUANTUM v3.0 — Multi-AI Brain (Gemini + Claude routing)
// ============================================================
import { Candle, AIAnalysis } from '../store/nexusStore';
import { calcRSI, calcEMA, calcMACD, calcBollingerBands, calcATR, detectWyckoffPhase } from './signalEngine';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function buildMarketContext(symbol: string, candles: Candle[]): string {
  if (candles.length < 30) return '';
  const closes = candles.map((c) => c.close);
  const last = candles[candles.length - 1];
  const rsi = calcRSI(closes);
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const ema50 = calcEMA(closes, 50);
  const macd = calcMACD(closes);
  const bb = calcBollingerBands(closes);
  const atr = calcATR(candles);
  const wyckoff = detectWyckoffPhase(candles);
  const trend = ema9[ema9.length - 1] > ema21[ema21.length - 1] ? 'UPTREND' : 'DOWNTREND';
  const change24h = ((last.close - candles[0].close) / candles[0].close * 100).toFixed(2);
  const high20 = Math.max(...candles.slice(-20).map((c) => c.high));
  const low20 = Math.min(...candles.slice(-20).map((c) => c.low));

  return `
SYMBOL: ${symbol}
TIMEFRAME: 15m | CANDLES ANALYZED: ${candles.length}
CURRENT PRICE: ${last.close.toFixed(6)}
24H CHANGE: ${change24h}%
OHLCV: O:${last.open.toFixed(4)} H:${last.high.toFixed(4)} L:${last.low.toFixed(4)} C:${last.close.toFixed(4)} V:${last.volume.toFixed(0)}

TECHNICAL INDICATORS:
- RSI(14): ${rsi.toFixed(2)} [${rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'}]
- EMA9: ${ema9[ema9.length - 1].toFixed(4)} | EMA21: ${ema21[ema21.length - 1].toFixed(4)} | EMA50: ${ema50.length > 0 ? ema50[ema50.length - 1].toFixed(4) : 'N/A'}
- MACD: ${macd.macd.toFixed(6)} | Signal: ${macd.signal.toFixed(6)} | Hist: ${macd.hist.toFixed(6)}
- BB Upper: ${bb.upper.toFixed(4)} | Mid: ${bb.mid.toFixed(4)} | Lower: ${bb.lower.toFixed(4)}
- ATR(14): ${atr.toFixed(4)}
- Trend: ${trend}
- Wyckoff Phase: ${wyckoff}
- 20-Bar Range: H:${high20.toFixed(4)} L:${low20.toFixed(4)}
`;
}

const systemPrompt = `You are NEXUS QUANTUM AI — an elite institutional-grade trading analyst with deep expertise in:
- ICT (Inner Circle Trader) concepts: AMD, PD Arrays, Order Blocks, FVGs, Liquidity
- Smart Money Concepts (SMC)
- Wyckoff Method
- Technical Analysis (Elliott Wave, Harmonics, Market Structure)
- Fundamental & Macro Analysis
- On-chain analytics for crypto
- Risk Management

Provide concise, professional, actionable analysis. Format output as JSON.`;

interface AIResponse {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  summary: string;
  technical: string;
  fundamental: string;
  sentiment: string;
  keyLevels: { label: string; price: number; type: 'support' | 'resistance' }[];
  tradePlan: string;
}

async function callGemini(symbol: string, candles: Candle[]): Promise<AIResponse | null> {
  if (!GEMINI_API_KEY) return null;
  const context = buildMarketContext(symbol, candles);
  const prompt = `${systemPrompt}

${context}

Analyze this market data and return a JSON object with these exact fields:
{
  "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": number (0-100),
  "summary": "2-3 sentence executive summary",
  "technical": "Detailed technical analysis with key levels, patterns, indicator confluence",
  "fundamental": "Macro/fundamental outlook for this asset",
  "sentiment": "Market sentiment and positioning analysis",
  "keyLevels": [{"label": "Support 1", "price": 0.0, "type": "support"}, ...],
  "tradePlan": "Specific entry, SL, TP with reasoning"
}

Return ONLY valid JSON, no markdown.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]) as AIResponse;
  } catch (e) {
    console.error('Gemini AI error:', e);
    return null;
  }
}

// Fallback local AI analysis when no API key
function localAnalysis(symbol: string, candles: Candle[]): AIResponse {
  const closes = candles.map((c) => c.close);
  const rsi = calcRSI(closes);
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const macd = calcMACD(closes);
  const last = candles[candles.length - 1];
  const wyckoff = detectWyckoffPhase(candles);
  const isBullish = ema9[ema9.length - 1] > ema21[ema21.length - 1] && rsi > 50 && macd.hist > 0;
  const isBearish = ema9[ema9.length - 1] < ema21[ema21.length - 1] && rsi < 50 && macd.hist < 0;
  const bias = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
  const confidence = Math.round(50 + (isBullish || isBearish ? 25 : 0) + (Math.abs(rsi - 50) / 50) * 15);
  const atr = calcATR(candles);

  const keyLevels: AIResponse['keyLevels'] = [
    { label: 'Key Support', price: parseFloat((last.close - atr * 2).toFixed(4)), type: 'support' },
    { label: 'Major Support', price: parseFloat((last.close - atr * 4).toFixed(4)), type: 'support' },
    { label: 'Key Resistance', price: parseFloat((last.close + atr * 2).toFixed(4)), type: 'resistance' },
    { label: 'Major Resistance', price: parseFloat((last.close + atr * 4).toFixed(4)), type: 'resistance' },
  ];

  return {
    bias,
    confidence,
    summary: `${symbol} is showing a ${bias.toLowerCase()} bias based on multi-indicator confluence. RSI at ${rsi.toFixed(1)} with ${wyckoff} phase detected. Market structure suggests ${bias === 'BULLISH' ? 'further upside potential' : bias === 'BEARISH' ? 'continued selling pressure' : 'a consolidation phase'}.`,
    technical: `EMA9 ${ema9[ema9.length - 1] > ema21[ema21.length - 1] ? 'above' : 'below'} EMA21 — ${isBullish ? 'bullish' : 'bearish'} alignment. RSI: ${rsi.toFixed(1)} ${rsi > 70 ? '(overbought — caution)' : rsi < 30 ? '(oversold — potential reversal)' : '(neutral)'}. MACD histogram ${macd.hist > 0 ? 'positive' : 'negative'}, indicating ${macd.hist > 0 ? 'bullish' : 'bearish'} momentum. Wyckoff phase: ${wyckoff}. ATR: ${atr.toFixed(4)} suggesting ${atr > last.close * 0.01 ? 'high' : 'moderate'} volatility.`,
    fundamental: `${symbol.includes('BTC') ? 'Bitcoin continues to be the dominant crypto asset. Monitor BTC dominance, Fed policy, and macro risk appetite. On-chain metrics including exchange flows and whale activity provide additional confluence.' : symbol.includes('ETH') ? 'Ethereum network activity and DeFi TVL are key drivers. Monitor gas fees, staking yields, and upcoming network upgrades.' : symbol.includes('XAU') ? 'Gold is driven by USD strength, real interest rates, and geopolitical risk. Central bank buying remains a structural tailwind. Monitor DXY and 10Y Treasury yields.' : `Monitor key macro drivers for ${symbol} including sector rotation, risk sentiment, and correlation with BTC/ES1.`}`,
    sentiment: `Market sentiment appears ${bias === 'BULLISH' ? 'risk-on with buyers in control' : bias === 'BEARISH' ? 'risk-off with sellers dominant' : 'mixed with no clear directional bias'}. Volume analysis shows ${candles[candles.length - 1].volume > candles.slice(-10).reduce((a, c) => a + c.volume, 0) / 10 ? 'above-average participation' : 'below-average participation'}. Smart money positioning suggests ${bias === 'NEUTRAL' ? 'accumulation or distribution phase in progress' : bias + ' positioning by institutional players'}.`,
    keyLevels,
    tradePlan: bias !== 'NEUTRAL'
      ? `${bias} Setup: Look for ${bias === 'BULLISH' ? 'bullish confirmation candle or liquidity sweep of recent lows' : 'bearish confirmation candle or liquidity sweep of recent highs'} before entry. Entry zone: ${last.close.toFixed(4)}. Stop Loss: ${(bias === 'BULLISH' ? last.close - atr * 1.5 : last.close + atr * 1.5).toFixed(4)} (${(atr * 1.5).toFixed(4)} = 1.5× ATR). Take Profit: ${(bias === 'BULLISH' ? last.close + atr * 3 : last.close - atr * 3).toFixed(4)} (2:1 R:R). Risk no more than 1-2% per trade.`
      : 'No clear trade setup at this time. Wait for a breakout of the current range with volume confirmation and RSI divergence before committing capital.',
  };
}

export async function getAIAnalysis(symbol: string, candles: Candle[]): Promise<AIAnalysis> {
  // Try Gemini first, fallback to local
  let response: AIResponse | null = null;
  let model = 'Local Quantum AI';

  if (GEMINI_API_KEY) {
    response = await callGemini(symbol, candles);
    if (response) model = 'Gemini 1.5 Flash';
  }

  if (!response) {
    response = localAnalysis(symbol, candles);
  }

  return {
    symbol,
    bias: response.bias,
    confidence: response.confidence,
    summary: response.summary,
    technical: response.technical,
    fundamental: response.fundamental,
    sentiment: response.sentiment,
    keyLevels: response.keyLevels || [],
    tradePlan: response.tradePlan,
    model,
    timestamp: Date.now(),
  };
}
