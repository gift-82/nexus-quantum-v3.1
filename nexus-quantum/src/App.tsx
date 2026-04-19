// ============================================================
// NEXUS QUANTUM v3.0 — Root App Component
// ============================================================
import React from 'react';
import { useNexusStore } from './store/nexusStore';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import BacktestPage from './pages/BacktestPage';
import SignalsPage from './pages/SignalsPage';
import AIAnalystPage from './pages/AIAnalystPage';
import CalendarPage from './pages/CalendarPage';
import StrategyPage from './pages/StrategyPage';

function PageRouter() {
  const { activeTab } = useNexusStore();
  switch (activeTab) {
    case 'dashboard':  return <Dashboard />;
    case 'backtest':   return <BacktestPage />;
    case 'signals':    return <SignalsPage />;
    case 'ai':         return <AIAnalystPage />;
    case 'calendar':   return <CalendarPage />;
    case 'strategy':   return <StrategyPage />;
    default:           return <Dashboard />;
  }
}

export default function App() {
  const { isAuthenticated } = useNexusStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Global animated background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: 'radial-gradient(ellipse at 20% 20%, rgba(0,128,255,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(124,58,237,0.04) 0%, transparent 50%), #020408',
      }} />
      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        backgroundImage: `
          linear-gradient(rgba(0,210,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,210,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
      }} />

      <Header />

      <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <PageRouter />
      </main>

      <ToastContainer />
    </div>
  );
}
