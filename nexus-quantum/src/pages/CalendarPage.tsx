// ============================================================
// NEXUS QUANTUM v3.0 — Economic Calendar & Sessions Page
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNexusStore, CalendarEvent } from '../store/nexusStore';
import {
  loadCalendarEvents, getUpcomingEvents, formatEventTime,
  formatEventDate, getCountdown, TRADING_SESSIONS, KILLZONES, getCurrentSession,
} from '../services/calendarService';

function CountdownTimer({ time }: { time: string }) {
  const [cd, setCd] = useState(getCountdown(time));
  useEffect(() => {
    const iv = setInterval(() => setCd(getCountdown(time)), 1000);
    return () => clearInterval(iv);
  }, [time]);
  const isLive = cd === 'LIVE';
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
      color: isLive ? '#ff3366' : '#00d2ff',
      padding: '1px 6px', borderRadius: 3,
      background: isLive ? 'rgba(255,51,102,0.15)' : 'rgba(0,210,255,0.08)',
      border: `1px solid ${isLive ? 'rgba(255,51,102,0.3)' : 'rgba(0,210,255,0.2)'}`,
      animation: isLive ? 'pulse-cyan 1s infinite' : 'none',
    }}>{cd}</span>
  );
}

function SessionClock({ session }: { session: typeof TRADING_SESSIONS[0] }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const check = () => {
      const h = new Date().getUTCHours();
      const { open, close } = session;
      const isActive = open < close ? (h >= open && h < close) : (h >= open || h < close);
      setActive(isActive);
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [session]);

  const now = new Date();
  const openTime = `${String(session.open).padStart(2, '0')}:00 UTC`;
  const closeTime = `${String(session.close).padStart(2, '0')}:00 UTC`;

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: active ? `${session.color}12` : 'rgba(0,0,0,0.2)',
      border: `1px solid ${active ? session.color + '40' : 'rgba(0,210,255,0.08)'}`,
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: active ? session.color : '#3d6070',
            boxShadow: active ? `0 0 8px ${session.color}` : 'none',
            animation: active ? 'pulse-cyan 1.5s infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 700,
            color: active ? session.color : '#3d6070', letterSpacing: '0.08em',
          }}>{session.name}</span>
          <span style={{
            fontSize: 9, color: '#3d6070',
            fontFamily: 'JetBrains Mono, monospace',
          }}>{session.tz}</span>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
          background: active ? `${session.color}20` : 'rgba(61,96,112,0.15)',
          color: active ? session.color : '#3d6070',
          border: `1px solid ${active ? session.color + '40' : 'rgba(61,96,112,0.2)'}`,
        }}>{active ? 'OPEN' : 'CLOSED'}</span>
      </div>
      <div style={{ fontSize: 10, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
        {openTime} → {closeTime}
      </div>
    </div>
  );
}

function KillzoneItem({ kz }: { kz: typeof KILLZONES[0] }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const check = () => {
      const h = new Date().getUTCHours();
      const m = new Date().getUTCMinutes();
      const dec = h + m / 60;
      setActive(dec >= kz.open && dec < kz.close);
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, [kz]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 10px', borderRadius: 6,
      background: active ? `${kz.color}10` : 'rgba(0,0,0,0.15)',
      border: `1px solid ${active ? kz.color + '30' : 'rgba(0,210,255,0.06)'}`,
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {(kz as any).special && <span style={{ fontSize: 10 }}>⚡</span>}
        <span style={{
          fontSize: 10, fontWeight: active ? 700 : 500,
          color: active ? kz.color : '#3d6070',
          fontFamily: 'JetBrains Mono, monospace',
        }}>{kz.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>
          {String(kz.open).padStart(2, '0')}:00–{String(kz.close).padStart(2, '0')}:00 UTC
        </span>
        {active && (
          <span style={{
            fontSize: 8, fontWeight: 700, color: kz.color,
            padding: '1px 5px', borderRadius: 3,
            background: `${kz.color}20`, border: `1px solid ${kz.color}40`,
            fontFamily: 'JetBrains Mono, monospace', animation: 'pulse-cyan 1s infinite',
          }}>ACTIVE</span>
        )}
      </div>
    </div>
  );
}

const IMPACT_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default function CalendarPage() {
  const { calendarEvents, setCalendarEvents } = useNexusStore();
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');

  useEffect(() => {
    if (calendarEvents.length === 0) {
      setCalendarEvents(loadCalendarEvents());
    }
  }, []);

  // Refresh events every hour
  useEffect(() => {
    const iv = setInterval(() => setCalendarEvents(loadCalendarEvents()), 3600000);
    return () => clearInterval(iv);
  }, []);

  const events = viewMode === 'upcoming'
    ? getUpcomingEvents(calendarEvents, 48)
    : calendarEvents;

  const filtered = events
    .filter((e) => filter === 'ALL' || e.impact === filter)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const session = getCurrentSession();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 700, color: '#00d2ff', letterSpacing: '0.1em' }}>
            ◷ ECONOMIC CALENDAR
          </div>
          <div style={{
            padding: '2px 10px', borderRadius: 12,
            background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.25)',
            fontSize: 10, color: '#00d2ff', fontFamily: 'JetBrains Mono, monospace',
          }}>Session: {session}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                background: filter === f
                  ? (f === 'HIGH' ? 'rgba(255,51,102,0.2)' : f === 'MEDIUM' ? 'rgba(255,140,0,0.2)' : f === 'LOW' ? 'rgba(0,210,255,0.1)' : 'rgba(0,210,255,0.15)')
                  : 'transparent',
                border: `1px solid ${filter === f
                  ? (f === 'HIGH' ? 'rgba(255,51,102,0.4)' : f === 'MEDIUM' ? 'rgba(255,140,0,0.4)' : 'rgba(0,210,255,0.3)')
                  : 'rgba(0,210,255,0.08)'}`,
                color: filter === f
                  ? (f === 'HIGH' ? '#ff3366' : f === 'MEDIUM' ? '#ff8c00' : '#00d2ff')
                  : '#3d6070',
              }}>{f}</button>
            ))}
            <button onClick={() => setViewMode(v => v === 'upcoming' ? 'all' : 'upcoming')} style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 9, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,210,255,0.1)',
              color: '#7ab3cc',
            }}>{viewMode === 'upcoming' ? '◷ 48H' : '◶ ALL'}</button>
          </div>
        </div>

        {/* Sessions grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {TRADING_SESSIONS.map((s) => <SessionClock key={s.name} session={s} />)}
        </div>

        {/* Killzones */}
        <div className="glass" style={{ padding: 14, marginBottom: 16, borderRadius: 10 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: '#ff8c00',
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10,
          }}>⚡ ICT KILLZONES (UTC)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {KILLZONES.map((kz) => <KillzoneItem key={kz.name} kz={kz} />)}
          </div>
        </div>

        {/* Events */}
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#00d2ff', letterSpacing: '0.1em', marginBottom: 10 }}>
          {filtered.length} EVENTS — {viewMode === 'upcoming' ? 'NEXT 48 HOURS' : 'FULL WEEK'}
        </div>

        {filtered.length === 0 ? (
          <div className="glass" style={{
            padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12, borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, opacity: 0.15 }}>◷</div>
            <div style={{ color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
              No events in this time window
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const impactColors = {
    HIGH: { border: '#ff3366', bg: 'rgba(255,51,102,0.06)', dot: '#ff3366' },
    MEDIUM: { border: '#ff8c00', bg: 'rgba(255,140,0,0.05)', dot: '#ff8c00' },
    LOW: { border: '#3d6070', bg: 'rgba(0,0,0,0.15)', dot: '#3d6070' },
  };
  const c = impactColors[event.impact];
  const isPast = new Date(event.time).getTime() < Date.now() - 3600000;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 28px 1fr auto',
      gap: 12, alignItems: 'center',
      padding: '10px 14px', borderRadius: 8,
      background: isPast ? 'rgba(0,0,0,0.15)' : c.bg,
      borderLeft: `3px solid ${c.border}`,
      border: `1px solid ${isPast ? 'rgba(61,96,112,0.1)' : c.border + '20'}`,
      opacity: isPast ? 0.5 : 1,
      transition: 'all 0.2s',
    }}
      onMouseEnter={(e) => { if (!isPast) (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(0)'; }}
    >
      {/* Time */}
      <div>
        <div style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace', marginBottom: 1 }}>
          {formatEventDate(event.time)}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7ab3cc', fontFamily: 'JetBrains Mono, monospace' }}>
          {formatEventTime(event.time)}
        </div>
      </div>

      {/* Flag */}
      <div style={{
        width: 22, height: 22, borderRadius: 4,
        background: 'rgba(0,0,0,0.3)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#7ab3cc',
        fontFamily: 'JetBrains Mono, monospace',
        border: '1px solid rgba(0,210,255,0.1)',
      }}>{event.currency.slice(0, 2)}</div>

      {/* Event info */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#e8f4ff', marginBottom: 3 }}>{event.event}</div>
        <div style={{ display: 'flex', gap: 10, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}>
          {event.forecast && <span style={{ color: '#3d6070' }}>Forecast: <span style={{ color: '#7ab3cc' }}>{event.forecast}</span></span>}
          {event.previous && <span style={{ color: '#3d6070' }}>Previous: <span style={{ color: '#7ab3cc' }}>{event.previous}</span></span>}
          {event.actual && <span style={{ color: '#3d6070' }}>Actual: <span style={{ color: parseFloat(event.actual) > parseFloat(event.forecast || '0') ? '#00ff88' : '#ff3366', fontWeight: 700 }}>{event.actual}</span></span>}
        </div>
      </div>

      {/* Impact + countdown */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{
          padding: '2px 7px', borderRadius: 3, fontSize: 8, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
          background: `${c.dot}20`, color: c.dot, border: `1px solid ${c.dot}40`,
        }}>{event.impact}</span>
        {!isPast && <CountdownTimer time={event.time} />}
        {isPast && <span style={{ fontSize: 9, color: '#3d6070', fontFamily: 'JetBrains Mono, monospace' }}>PAST</span>}
      </div>
    </div>
  );
}
