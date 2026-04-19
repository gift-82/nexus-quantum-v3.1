// ============================================================
// NEXUS QUANTUM v3.0 — Top Header / Nav Bar
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNexusStore, Tab } from '../store/nexusStore';
import { getCurrentSession, isInKillzone } from '../services/calendarService';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'backtest', label: 'Backtest', icon: '◈' },
  { id: 'signals', label: 'Signals', icon: '◉' },
  { id: 'ai', label: 'AI Analyst', icon: '◎' },
  { id: 'calendar', label: 'Calendar', icon: '◷' },
  { id: 'strategy', label: 'Strategies', icon: '◇' },
];

export default function Header() {
  const { activeTab, setActiveTab, traderId, wsConnected, positions, signals } = useNexusStore();
  const [time, setTime] = useState(new Date());
  const [session, setSession] = useState(getCurrentSession());
  const [killzone, setKillzone] = useState(isInKillzone());

  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date());
      setSession(getCurrentSession());
      setKillzone(isInKillzone());
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const activeSignals = signals.filter((s) => s.status === 'ACTIVE').length;
  const totalPnl = positions.reduce((a, p) => a + p.pnl, 0);

  const utcStr = time.toUTCString().slice(17, 25);
  const localStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 16,
      background: 'rgba(2,4,8,0.95)',
      borderBottom: '1px solid rgba(0,210,255,0.12)',
      backdropFilter: 'blur(20px)',
      position: 'relative', zIndex: 100, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'radial-gradient(circle, #00d2ff, #0080ff)',
          boxShadow: '0 0 12px rgba(0,210,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>⬡</div>
        <div>
          <div style={{
            fontFamily: 'Orbitron, sans-serif', fontWeight: 900,
            fontSize: 13, letterSpacing: '0.1em',
            background: 'linear-gradient(90deg, #00d2ff, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>NEXUS QUANTUM</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, color: 'rgba(0,210,255,0.5)',
            letterSpacing: '0.15em',
          }}>v3.0 TERMINAL</div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px', border: 'none', cursor: 'pointer',
              borderRadius: 6, fontSize: 11, fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.2s',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, rgba(0,210,255,0.2), rgba(0,128,255,0.1))'
                : 'transparent',
              color: activeTab === tab.id ? '#00d2ff' : 'rgba(61,96,112,0.9)',
              border: activeTab === tab.id ? '1px solid rgba(0,210,255,0.3)' : '1px solid transparent',
              position: 'relative',
            }}
          >
            <span style={{ marginRight: 5 }}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'signals' && activeSignals > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 14, height: 14, borderRadius: '50%',
                background: '#ff3366', color: '#fff',
                fontSize: 8, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{activeSignals}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Right status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* WS Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: wsConnected ? '#00ff88' : '#ff3366',
            boxShadow: wsConnected ? '0 0 8px rgba(0,255,136,0.6)' : '0 0 8px rgba(255,51,102,0.6)',
            animation: wsConnected ? 'pulse-cyan 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 10, color: wsConnected ? '#00ff88' : '#ff3366', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
            {wsConnected ? 'LIVE' : 'CONNECTING'}
          </span>
        </div>

        {/* Killzone indicator */}
        {killzone.active && (
          <div style={{
            padding: '2px 8px', borderRadius: 4,
            background: 'rgba(255,51,102,0.15)',
            border: '1px solid rgba(255,51,102,0.4)',
            fontSize: 9, fontWeight: 700,
            color: '#ff3366', letterSpacing: '0.1em',
            fontFamily: 'JetBrains Mono, monospace',
            animation: 'pulse-cyan 1.5s infinite',
          }}>⚡ {killzone.name.toUpperCase()}</div>
        )}

        {/* Session */}
        <div style={{
          padding: '2px 8px', borderRadius: 4,
          background: 'rgba(0,210,255,0.08)',
          border: '1px solid rgba(0,210,255,0.2)',
          fontSize: 10, color: '#00d2ff',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {session}
        </div>

        {/* P&L */}
        {positions.length > 0 && (
          <div style={{
            padding: '2px 8px', borderRadius: 4,
            background: totalPnl >= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)',
            border: `1px solid ${totalPnl >= 0 ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,
            fontSize: 10, fontWeight: 700,
            color: totalPnl >= 0 ? '#00ff88' : '#ff3366',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            P&L: {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </div>
        )}

        {/* Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12, fontWeight: 600, color: '#00d2ff', letterSpacing: '0.05em',
          }}>{utcStr} UTC</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, color: 'rgba(61,96,112,0.8)', letterSpacing: '0.05em',
          }}>LOCAL {localStr}</div>
        </div>

        {/* Trader ID */}
        <div style={{
          padding: '4px 10px', borderRadius: 6,
          background: 'rgba(0,210,255,0.08)',
          border: '1px solid rgba(0,210,255,0.2)',
          fontSize: 10, color: '#7ab3cc',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <span style={{ color: '#3d6070', marginRight: 4 }}>ID:</span>
          <span style={{ color: '#00d2ff', fontWeight: 700 }}>{traderId}</span>
        </div>
      </div>
    </header>
  );
}
