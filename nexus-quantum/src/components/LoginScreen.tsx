// ============================================================
// NEXUS QUANTUM v3.0 — Login / Auth Screen
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNexusStore } from '../store/nexusStore';

const PARTICLE_COUNT = 40;

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.5 + 0.1,
  }));
}

const particles = generateParticles();

export default function LoginScreen() {
  const { setTraderId, setAuthenticated, addToast } = useNexusStore();
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(0);

  const login = async () => {
    if (!id.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'Enter your Trader ID to access the terminal.' });
      return;
    }
    setLoading(true);
    setPhase(1);
    await delay(800);
    setPhase(2);
    await delay(800);
    setPhase(3);
    await delay(600);
    setTraderId(id.trim().toUpperCase());
    setAuthenticated(true);
    addToast({ type: 'success', title: 'ACCESS GRANTED', message: `Welcome, Trader ${id.trim().toUpperCase()}. Nexus Quantum is online.` });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') login();
  };

  const phases = [
    'Initializing quantum matrix...',
    'Connecting to data streams...',
    'Loading AI neural networks...',
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 50%, #050d20 0%, #020408 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', overflow: 'hidden',
    }}>
      {/* Animated grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,210,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,210,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Particles */}
      {particles.map((p) => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: `${p.size}px`, height: `${p.size}px`,
          borderRadius: '50%',
          background: Math.random() > 0.5 ? '#00d2ff' : '#7c3aed',
          opacity: p.opacity,
          animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          boxShadow: `0 0 ${p.size * 3}px currentColor`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Glowing orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(0,210,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 10s ease-in-out 2s infinite',
      }} />

      {/* Login card */}
      <div className="glass animate-fade-in" style={{
        width: 420, padding: '48px 40px',
        textAlign: 'center', position: 'relative',
        background: 'rgba(5,13,25,0.9)',
        border: '1px solid rgba(0,210,255,0.25)',
        boxShadow: '0 0 60px rgba(0,210,255,0.1), 0 0 120px rgba(124,58,237,0.06)',
      }}>
        {/* Top line glow */}
        <div style={{
          position: 'absolute', top: -1, left: '20%', right: '20%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, #00d2ff, transparent)',
        }} />

        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          {/* Quantum icon */}
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '2px solid rgba(0,210,255,0.3)',
              position: 'absolute',
              animation: 'quantum-spin 8s linear infinite',
            }} />
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '2px solid rgba(124,58,237,0.4)',
              position: 'absolute',
              animation: 'quantum-spin 5s linear infinite reverse',
            }} />
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'radial-gradient(circle, #00d2ff, #0080ff)',
              boxShadow: '0 0 20px rgba(0,210,255,0.8)',
            }} />
          </div>

          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 22, fontWeight: 900,
            letterSpacing: '0.15em',
            background: 'linear-gradient(135deg, #00d2ff, #0080ff, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>NEXUS QUANTUM</div>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 11, letterSpacing: '0.3em',
            color: 'rgba(0,210,255,0.6)', fontWeight: 500,
          }}>v3.0 — GOD-TIER TRADING TERMINAL</div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,210,255,0.3), transparent)',
          marginBottom: 32,
        }} />

        {!loading ? (
          <>
            <p style={{ color: 'rgba(122,179,204,0.8)', fontSize: 12, marginBottom: 24, letterSpacing: '0.05em' }}>
              ENTER YOUR TRADER ID TO ACCESS THE TERMINAL
            </p>

            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toUpperCase())}
              onKeyDown={handleKey}
              placeholder="TRADER-ID (e.g. NQ-001)"
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(0,210,255,0.05)',
                border: '1px solid rgba(0,210,255,0.25)',
                borderRadius: 8,
                color: '#00d2ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14, fontWeight: 600,
                letterSpacing: '0.1em',
                textAlign: 'center', outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0,210,255,0.6)';
                e.target.style.boxShadow = '0 0 20px rgba(0,210,255,0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0,210,255,0.25)';
                e.target.style.boxShadow = 'none';
              }}
              autoFocus
            />

            <button
              onClick={login}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #00d2ff 0%, #0080ff 50%, #7c3aed 100%)',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                color: '#000', fontWeight: 800, fontSize: 13,
                letterSpacing: '0.15em',
                fontFamily: 'Orbitron, sans-serif',
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(0,210,255,0.3)',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                (e.target as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,210,255,0.5)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = 'translateY(0)';
                (e.target as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,210,255,0.3)';
              }}
            >
              INITIALIZE TERMINAL
            </button>

            {/* Demo hint */}
            <p style={{ color: 'rgba(61,96,112,0.8)', fontSize: 11, marginTop: 16 }}>
              No password required · Enter any Trader ID
            </p>
          </>
        ) : (
          <div style={{ padding: '16px 0' }}>
            {/* Loading animation */}
            <div style={{
              width: 48, height: 48, margin: '0 auto 24px',
              border: '3px solid rgba(0,210,255,0.1)',
              borderTop: '3px solid #00d2ff',
              borderRadius: '50%',
              animation: 'quantum-spin 0.8s linear infinite',
            }} />
            <div style={{
              color: '#00d2ff', fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, marginBottom: 16, letterSpacing: '0.05em',
            }}>
              {phases[Math.min(phase - 1, phases.length - 1)]}
            </div>
            {/* Progress bar */}
            <div style={{
              height: 3, background: 'rgba(0,210,255,0.1)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(phase * 33, 100)}%`,
                background: 'linear-gradient(90deg, #00d2ff, #7c3aed)',
                borderRadius: 2,
                transition: 'width 0.7s ease',
              }} />
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12, marginTop: 32,
          padding: '16px 0',
          borderTop: '1px solid rgba(0,210,255,0.1)',
        }}>
          {[
            { label: 'STRATEGIES', value: '8+' },
            { label: 'SYMBOLS', value: '12' },
            { label: 'AI MODELS', value: '3' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: 16, fontWeight: 700, color: '#00d2ff',
              }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#3d6070', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
