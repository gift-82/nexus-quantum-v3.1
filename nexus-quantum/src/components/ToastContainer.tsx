// ============================================================
// NEXUS QUANTUM v3.0 — Toast Notification System
// ============================================================
import React, { useEffect } from 'react';
import { useNexusStore, Toast } from '../store/nexusStore';

const ICONS: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
  signal: '◉',
};

const COLORS: Record<Toast['type'], { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.3)', icon: '#00ff88' },
  error: { bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.3)', icon: '#ff3366' },
  warning: { bg: 'rgba(255,140,0,0.08)', border: 'rgba(255,140,0,0.3)', icon: '#ff8c00' },
  info: { bg: 'rgba(0,210,255,0.08)', border: 'rgba(0,210,255,0.3)', icon: '#00d2ff' },
  signal: { bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.4)', icon: '#7c3aed' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useNexusStore();
  const c = COLORS[toast.type];

  return (
    <div className="animate-slide-right" style={{
      padding: '12px 14px',
      borderRadius: 8,
      border: `1px solid ${c.border}`,
      background: `rgba(5,13,25,0.95)`,
      backdropFilter: 'blur(20px)',
      minWidth: 300, maxWidth: 380,
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${c.border}`,
      cursor: 'pointer',
    }} onClick={() => removeToast(toast.id)}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: `rgba(${c.icon === '#00ff88' ? '0,255,136' : c.icon === '#ff3366' ? '255,51,102' : c.icon === '#ff8c00' ? '255,140,0' : c.icon === '#00d2ff' ? '0,210,255' : '124,58,237'},0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: c.icon, flexShrink: 0,
        border: `1px solid ${c.border}`,
      }}>{ICONS[toast.type]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: c.icon, letterSpacing: '0.05em', marginBottom: 2 }}>
          {toast.title}
        </div>
        <div style={{ fontSize: 11, color: '#7ab3cc', lineHeight: 1.4 }}>{toast.message}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#3d6070', fontSize: 14, padding: 0, lineHeight: 1,
      }}>×</button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useNexusStore();
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', top: 68, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
