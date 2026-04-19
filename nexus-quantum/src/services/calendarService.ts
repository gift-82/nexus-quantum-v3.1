// ============================================================
// NEXUS QUANTUM v3.0 — Economic Calendar Service
// Uses open trading calendar data
// ============================================================
import { CalendarEvent } from '../store/nexusStore';

// Hardcoded high-impact events for the week (real event names, simulated times for demo)
// In production, connect to forex-factory API or economic-calendar API
function generateWeeklyEvents(): CalendarEvent[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);

  const events: Omit<CalendarEvent, 'id'>[] = [
    // USD Events
    { time: getTimeStr(base, 0, 13, 30), country: 'US', event: 'Non-Farm Payrolls', impact: 'HIGH', currency: 'USD', forecast: '185K', previous: '177K', actual: '' },
    { time: getTimeStr(base, 0, 14, 0), country: 'US', event: 'Unemployment Rate', impact: 'HIGH', currency: 'USD', forecast: '3.9%', previous: '3.8%', actual: '' },
    { time: getTimeStr(base, 1, 13, 30), country: 'US', event: 'CPI m/m', impact: 'HIGH', currency: 'USD', forecast: '0.3%', previous: '0.4%', actual: '' },
    { time: getTimeStr(base, 1, 14, 0), country: 'US', event: 'Core CPI m/m', impact: 'HIGH', currency: 'USD', forecast: '0.3%', previous: '0.3%', actual: '' },
    { time: getTimeStr(base, 2, 18, 0), country: 'US', event: 'FOMC Meeting Minutes', impact: 'HIGH', currency: 'USD', forecast: '', previous: '', actual: '' },
    { time: getTimeStr(base, 2, 13, 30), country: 'US', event: 'PPI m/m', impact: 'MEDIUM', currency: 'USD', forecast: '0.2%', previous: '0.2%', actual: '' },
    { time: getTimeStr(base, 3, 13, 30), country: 'US', event: 'Initial Jobless Claims', impact: 'MEDIUM', currency: 'USD', forecast: '220K', previous: '215K', actual: '' },
    { time: getTimeStr(base, 4, 14, 0), country: 'US', event: 'Retail Sales m/m', impact: 'HIGH', currency: 'USD', forecast: '0.4%', previous: '-0.9%', actual: '' },
    { time: getTimeStr(base, 4, 15, 0), country: 'US', event: 'Michigan Consumer Sentiment', impact: 'MEDIUM', currency: 'USD', forecast: '77.0', previous: '76.5', actual: '' },
    // EUR Events
    { time: getTimeStr(base, 1, 9, 0), country: 'EU', event: 'ECB President Lagarde Speech', impact: 'HIGH', currency: 'EUR', forecast: '', previous: '', actual: '' },
    { time: getTimeStr(base, 0, 10, 0), country: 'EU', event: 'German ZEW Economic Sentiment', impact: 'MEDIUM', currency: 'EUR', forecast: '10.2', previous: '9.8', actual: '' },
    { time: getTimeStr(base, 3, 11, 45), country: 'EU', event: 'ECB Main Refinancing Rate', impact: 'HIGH', currency: 'EUR', forecast: '4.50%', previous: '4.50%', actual: '' },
    { time: getTimeStr(base, 3, 12, 30), country: 'EU', event: 'ECB Press Conference', impact: 'HIGH', currency: 'EUR', forecast: '', previous: '', actual: '' },
    // GBP Events
    { time: getTimeStr(base, 2, 7, 0), country: 'GB', event: 'UK CPI y/y', impact: 'HIGH', currency: 'GBP', forecast: '3.2%', previous: '3.4%', actual: '' },
    { time: getTimeStr(base, 3, 12, 0), country: 'GB', event: 'BoE Governor Bailey Speech', impact: 'HIGH', currency: 'GBP', forecast: '', previous: '', actual: '' },
    // JPY Events
    { time: getTimeStr(base, 2, 23, 50), country: 'JP', event: 'BoJ Policy Rate', impact: 'HIGH', currency: 'JPY', forecast: '-0.10%', previous: '-0.10%', actual: '' },
    { time: getTimeStr(base, 0, 23, 30), country: 'JP', event: 'Japan CPI y/y', impact: 'MEDIUM', currency: 'JPY', forecast: '2.7%', previous: '2.8%', actual: '' },
    // Crypto / risk-off events
    { time: getTimeStr(base, 1, 15, 0), country: 'US', event: 'Fed Chair Powell Speech', impact: 'HIGH', currency: 'USD', forecast: '', previous: '', actual: '' },
    { time: getTimeStr(base, 4, 14, 30), country: 'US', event: 'US GDP Growth Rate QoQ', impact: 'HIGH', currency: 'USD', forecast: '2.1%', previous: '3.4%', actual: '' },
    { time: getTimeStr(base, 2, 14, 30), country: 'US', event: 'EIA Crude Oil Inventories', impact: 'MEDIUM', currency: 'USD', forecast: '-1.2M', previous: '-3.5M', actual: '' },
  ];

  return events.map((e, i) => ({ ...e, id: `evt-${i}-${Date.now()}` }));
}

function getTimeStr(base: Date, dayOffset: number, hour: number, minute: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function loadCalendarEvents(): CalendarEvent[] {
  return generateWeeklyEvents().sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

export function getUpcomingEvents(events: CalendarEvent[], hours = 24): CalendarEvent[] {
  const now = Date.now();
  const limit = now + hours * 60 * 60 * 1000;
  return events.filter((e) => {
    const t = new Date(e.time).getTime();
    return t >= now - 3600000 && t <= limit;
  });
}

export function formatEventTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatEventDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getCountdown(isoString: string): string {
  const ms = new Date(isoString).getTime() - Date.now();
  if (ms < 0) return 'LIVE';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Trading sessions (UTC times)
export const TRADING_SESSIONS = [
  { name: 'Sydney', open: 21, close: 6, color: '#7c3aed', tz: 'AEST' },
  { name: 'Tokyo', open: 0, close: 9, color: '#0080ff', tz: 'JST' },
  { name: 'London', open: 7, close: 16, color: '#00d2ff', tz: 'GMT' },
  { name: 'New York', open: 12, close: 21, color: '#00ff88', tz: 'EST' },
];

// ICT Killzones (UTC)
export const KILLZONES = [
  { name: 'Asia Killzone', open: 0, close: 2, color: '#7c3aed' },
  { name: 'London Killzone', open: 7, close: 9, color: '#00d2ff' },
  { name: 'NY AM Killzone', open: 12, close: 14, color: '#00ff88' },
  { name: 'AMD Manipulation', open: 3, close: 4, color: '#ff3366', special: true },
];

export function getCurrentSession(): string {
  const h = new Date().getUTCHours();
  if (h >= 0 && h < 6) return 'Tokyo';
  if (h >= 7 && h < 12) return 'London';
  if (h >= 12 && h < 17) return 'London/NY Overlap';
  if (h >= 17 && h < 21) return 'New York';
  return 'Sydney/After-Hours';
}

export function isInKillzone(): { active: boolean; name: string } {
  const h = new Date().getUTCHours();
  const m = new Date().getUTCMinutes();
  const decH = h + m / 60;
  for (const kz of KILLZONES) {
    if (decH >= kz.open && decH < kz.close) return { active: true, name: kz.name };
  }
  return { active: false, name: '' };
}
