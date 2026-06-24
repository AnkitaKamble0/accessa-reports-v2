/**
 * Reports.jsx â Accessa locker.OS Reporting & Analytics page
 * -----------------------------------------------------------
 * Standalone React component (React 17+). No external deps.
 *
 * Requirements:
 *   - "Nunito Sans" + "JetBrains Mono" loaded somewhere in the app
 *     (e.g. Google Fonts). Falls back to system fonts otherwise.
 *
 * Data is synthetic + deterministic (seeded) so the page renders fully
 * without a backend. Replace `buildData()` / the agg helpers with real
 * API calls when wiring this up â the component reads everything through
 * `agg()` / `aggDev()` so the UI layer stays unchanged.
 */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* tokens                                                              */
/* ------------------------------------------------------------------ */
const FONT = "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";
const PURPLE = '#4A42EA';

const C = {
  ink: '#0A0A0A', graphite: '#323232', slate: '#646464', mute: '#8a8a8a',
  silver: '#B8B8B8', line: '#D9D9D9', lineSoft: '#E5E5E5', mist: '#F4F4F4',
  paper: '#FAFAFA', white: '#fff', purple: PURPLE,
  success: '#15794E', warning: '#B45309', danger: '#B91C1C',
  successBg: '#E7F6EE', warningBg: '#FEF3C7', dangerBg: '#FDECEC', purpleBg: '#E7E5FB',
};

const S = {
  card: { background: C.white, border: `1px solid ${C.lineSoft}`, borderRadius: 4 },
  sectionTitle: { fontFamily: FONT, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.slate },
  eyebrow: { fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.slate },
  th: { padding: '11px 18px', fontSize: 10, color: C.slate, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 },
  select: { width: 170, boxSizing: 'border-box', padding: '8px 12px', border: `1px solid ${C.line}`, borderRadius: 4, fontSize: 13, fontFamily: FONT, fontWeight: 600, background: C.white, color: C.ink, cursor: 'pointer' },
  cardTitle: { fontFamily: FONT, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' },
};

/* ------------------------------------------------------------------ */
/* pure helpers                                                        */
/* ------------------------------------------------------------------ */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const usd = n => '$' + Math.round(n).toLocaleString('en-US');
const usdk = n => (n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : '$' + Math.round(n));
const num = n => Math.round(n).toLocaleString('en-US');
const pct = n => n.toFixed(1) + '%';
const md = d => MONTHS[d.getMonth()] + ' ' + d.getDate();
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngFrom = seed => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; let m; if (n <= 1) m = 1; else if (n <= 2) m = 2; else if (n <= 2.5) m = 2.5; else if (n <= 5) m = 5; else m = 10; return m * p; };
const successColor = p => (p >= 95 ? C.success : p >= 90 ? C.ink : p >= 85 ? C.warning : C.danger);
const satColor = p => (p >= 88 ? C.success : p >= 78 ? C.ink : p >= 70 ? C.warning : C.danger);

/* ------------------------------------------------------------------ */
/* synthetic dataset (replace with API)                                */
/* ------------------------------------------------------------------ */
function buildData() {
  const today = new Date(2026, 5, 18);
  const locs = [
    { id: 'eclipse', name: 'Eclipse Estates', city: 'Chicago, IL' },
    { id: 'lincoln', name: 'Lincoln Park', city: 'Chicago, IL' },
    { id: 'midway', name: 'Midway Transit', city: 'Chicago, IL' },
    { id: 'zurich', name: 'Zurich HQ', city: 'Zurich, CH' },
    { id: 'sanjuan', name: 'San Juan Office', city: 'San JosÃ©, CR' },
    { id: 'brooklyn', name: 'Brooklyn Navy Yard', city: 'New York, NY' },
  ];
  const devs = [
    { id: 'A101', locId: 'eclipse', mode: 'Delivery', price: 4.5, base: 70, failR: 0.03, cancR: 0.02, upR: 0.95, trend: 0.18 },
    { id: 'A102', locId: 'eclipse', mode: 'Delivery', price: 4.5, base: 64, failR: 0.025, cancR: 0.02, upR: 0.94, trend: 0.12 },
    { id: 'A103', locId: 'eclipse', mode: 'Storage', price: 9, base: 40, failR: 0.03, cancR: 0.03, upR: 0.93, trend: 0.10 },
    { id: 'A104', locId: 'eclipse', mode: 'Vending', price: 3, base: 28, failR: 0.04, cancR: 0.03, upR: 0.92, trend: 0.06 },
    { id: 'B201', locId: 'lincoln', mode: 'Storage', price: 9, base: 46, failR: 0.035, cancR: 0.03, upR: 0.91, trend: 0.05 },
    { id: 'B202', locId: 'lincoln', mode: 'Asset', price: 14, base: 30, failR: 0.045, cancR: 0.035, upR: 0.90, trend: 0.02 },
    { id: 'B203', locId: 'lincoln', mode: 'Storage', price: 9, base: 38, failR: 0.05, cancR: 0.04, upR: 0.88, trend: -0.04 },
    { id: 'C301', locId: 'midway', mode: 'Delivery', price: 4, base: 120, failR: 0.04, cancR: 0.05, upR: 0.90, trend: 0.22 },
    { id: 'C302', locId: 'midway', mode: 'Delivery', price: 4, base: 108, failR: 0.045, cancR: 0.05, upR: 0.89, trend: 0.18 },
    { id: 'C303', locId: 'midway', mode: 'Delivery', price: 4, base: 96, failR: 0.05, cancR: 0.11, upR: 0.88, trend: 0.12 },
    { id: 'C304', locId: 'midway', mode: 'Vending', price: 3.5, base: 52, failR: 0.04, cancR: 0.04, upR: 0.90, trend: 0.08 },
    { id: 'C305', locId: 'midway', mode: 'Asset', price: 14, base: 34, failR: 0.05, cancR: 0.04, upR: 0.89, trend: 0.05 },
    { id: 'D401', locId: 'zurich', mode: 'Asset', price: 16, base: 30, failR: 0.05, cancR: 0.03, upR: 0.93, trend: 0.04 },
    { id: 'D402', locId: 'zurich', mode: 'Service', price: 6, base: 44, failR: 0.06, cancR: 0.04, upR: 0.90, trend: 0.02 },
    { id: 'D403', locId: 'zurich', mode: 'Service', price: 6, base: 40, failR: 0.105, cancR: 0.05, upR: 0.84, trend: -0.06 },
    { id: 'E501', locId: 'sanjuan', mode: 'Delivery', price: 4.5, base: 36, failR: 0.04, cancR: 0.03, upR: 0.92, trend: 0.07 },
    { id: 'E502', locId: 'sanjuan', mode: 'Storage', price: 9, base: 26, failR: 0.05, cancR: 0.04, upR: 0.90, trend: 0.03 },
    { id: 'F601', locId: 'brooklyn', mode: 'Storage', price: 9, base: 30, failR: 0.07, cancR: 0.06, upR: 0.78, trend: -0.18 },
    { id: 'F602', locId: 'brooklyn', mode: 'Service', price: 6, base: 24, failR: 0.10, cancR: 0.07, upR: 0.70, trend: -0.22 },
    { id: 'F603', locId: 'brooklyn', mode: 'Delivery', price: 4.5, base: 22, failR: 0.155, cancR: 0.08, upR: 0.60, trend: -0.30 },
  ];
  const locById = Object.fromEntries(locs.map(l => [l.id, l]));
  const devById = Object.fromEntries(devs.map(d => [d.id, d]));

  const days = [];
  for (let i = 0; i < 90; i++) { const d = new Date(today); d.setDate(d.getDate() - (89 - i)); days.push(d); }

  const daily = {};
  for (const dev of devs) {
    const rng = rngFrom(hashStr(dev.id));
    const arr = [];
    for (let i = 0; i < 90; i++) {
      const wd = days[i].getDay();
      const weekendF = wd === 0 ? 0.6 : wd === 6 ? 0.72 : wd === 5 ? 1.08 : 1.0;
      const trendF = 1 + (dev.trend * (i - 45)) / 60;
      const seasonal = 1 + 0.1 * Math.sin(i / 13);
      const noise = 0.82 + 0.36 * rng();
      const cnt = Math.max(0, Math.round(dev.base * weekendF * trendF * seasonal * noise));
      const failed = Math.round(cnt * dev.failR * (0.8 + 0.4 * rng()));
      const cancelled = Math.round(cnt * dev.cancR * (0.7 + 0.6 * rng()));
      const success = Math.max(0, cnt - failed - cancelled);
      const rev = success * dev.price * (0.92 + 0.16 * rng());
      const refund = rng() < 0.16 ? success * dev.price * 0.05 * rng() : 0;
      const fbGiven = Math.round(success * 0.42);
      let fbU = Math.round(fbGiven * dev.upR * (0.92 + 0.16 * rng())); if (fbU > fbGiven) fbU = fbGiven;
      arr.push({ cnt, success, failed, cancelled, rev, refund, fbU, fbD: fbGiven - fbU });
    }
    daily[dev.id] = arr;
  }
  const hourly = [2, 1, 1, 1, 1, 2, 5, 9, 12, 10, 7, 8, 9, 7, 6, 7, 10, 12, 11, 8, 6, 5, 4, 3];
  const dayMult = [0.95, 1.0, 1.0, 1.02, 1.1, 0.7, 0.55]; // Mon..Sun
  return { today, locs, devs, locById, devById, days, daily, hourly, dayMult };
}

const EMPTY = { cnt: 0, success: 0, failed: 0, cancelled: 0, rev: 0, refund: 0, fbU: 0, fbD: 0 };
function aggDev(daily, id, idxs) {
  const a = { ...EMPTY }, arr = daily[id];
  for (const i of idxs) { const x = arr[i]; a.cnt += x.cnt; a.success += x.success; a.failed += x.failed; a.cancelled += x.cancelled; a.rev += x.rev; a.refund += x.refund; a.fbU += x.fbU; a.fbD += x.fbD; }
  return a;
}
function agg(daily, ids, idxs) {
  const a = { ...EMPTY };
  for (const id of ids) { const d = aggDev(daily, id, idxs); for (const k in a) a[k] += d[k]; }
  return a;
}
const rate = (n, d) => (d ? (n / d) * 100 : 0);
const idxRange = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };

const TYPE_MAP = { Delivery: ['Drop-off', 'Pickup'], Storage: ['Rental start', 'Rental end'], Asset: ['Checkout', 'Return'], Service: ['Service start', 'Service end'], Vending: ['Purchase', 'Refill'] };
const STATUS_COLORS = { Finished: [C.successBg, C.success], Expired: [C.dangerBg, C.danger], Canceled: [C.warningBg, C.warning], 'In progress': [C.purpleBg, C.purple] };

function sampleTxns(devById, days, devId, idxs) {
  const dev = devById[devId], rng = rngFrom(hashStr(devId) ^ 9999), out = [];
  const recent = idxs.slice(-11); let counter = 1000 + Math.floor(rng() * 8000);
  for (let k = recent.length - 1; k >= 0; k--) {
    const date = days[recent[k]];
    for (let m = 0; m < 2; m++) {
      const hh = 6 + Math.floor(rng() * 15), mm = Math.floor(rng() * 60), r = rng();
      let st = 'Finished'; if (r < dev.failR) st = 'Expired'; else if (r < dev.failR + dev.cancR) st = 'Canceled';
      if (k === 0 && m === 0 && rng() < 0.5) st = 'In progress';
      const amount = st === 'Finished' ? dev.price : 0;
      const types = TYPE_MAP[dev.mode] || ['Session'];
      const type = types[Math.floor(rng() * types.length)];
      const fr = rng(); let fb = 'â'; if (st === 'Finished') { if (fr < dev.upR * 0.5) fb = 'up'; else if (fr < dev.upR * 0.5 + 0.13) fb = 'down'; }
      out.push({ id: 'TXN-' + counter++, time: md(date) + ' Â· ' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), type, amount, status: st, fb });
    }
  }
  return out;
}

const TABS = [['overview', 'Overview'], ['revenue', 'Revenue'], ['transactions', 'Transactions'], ['devices', 'Devices'], ['locations', 'Locations'], ['alerts', 'Alerts']];
const SECTION_IDS = TABS.map(t => t[0]);

/* ================================================================== */
/* component                                                           */
/* ================================================================== */
export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = useMemo(buildData, []);
  const { locs, devs, locById, devById, days, daily, hourly, dayMult, today } = data;
  const el = React.createElement;

  const [range, setRange] = useState('30d');
  const [cStart, setCStart] = useState('2026-05-20');
  const [cEnd, setCEnd] = useState('2026-06-18');
  const [loc, setLoc] = useState('all');
  const [dev, setDev] = useState('all');
  const [mode, setMode] = useState('all');
  const [status, setStatus] = useState('all');
  const [chart, setChart] = useState('area');
  const [sort, setSort] = useState({ key: 'rev', dir: 'desc' });
  const [drill, setDrill] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [trendHover, setTrendHover] = useState(-1);
  const [heatHover, setHeatHover] = useState(null);
  const [donutHover, setDonutHover] = useState(null);
  const [drawer, setDrawer] = useState(null); // { type:'loc'|'dev', id }

  const scrollRef = useRef(null);
  const toastTimer = useRef(null);

  /* --- toast --- */
  const showToast = useCallback(msg => {
    setExportOpen(false); setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  /* --- font loading (Nunito Sans + JetBrains Mono, matching the platform) --- */
  useEffect(() => {
    const href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,500;0,6..12,600;0,6..12,700;0,6..12,800;0,6..12,900&family=JetBrains+Mono:wght@400;500;700&display=swap';
    if (document.querySelector(`link[data-ra-fonts]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.setAttribute('data-ra-fonts', '');
    document.head.appendChild(link);
  }, []);

  /* --- scrollspy --- */
  useEffect(() => {
    const sc = scrollRef.current; if (!sc) return;
    const onScroll = () => {
      const top = sc.scrollTop + 170; let cur = 'overview';
      for (const id of SECTION_IDS) { const e = document.getElementById('sec-' + id); if (e && e.offsetTop <= top) cur = id; }
      setActiveTab(prev => (prev === cur ? prev : cur));
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    return () => sc.removeEventListener('scroll', onScroll);
  }, []);

  /* Usage tracking */
  useEffect(() => {
    const payload = { event: 'reports_page_view', path: location.pathname, timestamp: new Date().toISOString() };
    if (typeof window.__trackUsage === 'function') window.__trackUsage(payload);
  }, [location.pathname]);

  const gotoSection = useCallback(id => {
    setActiveTab(id);
    const e = document.getElementById('sec-' + id), sc = scrollRef.current;
    if (e && sc) sc.scrollTo({ top: e.offsetTop - 150, behavior: 'smooth' });
  }, []);
  const gotoExplore = useCallback(arr => {
    if (arr) setDrill(arr);
    setActiveTab('locations');
    const e = document.getElementById('sec-locations'), sc = scrollRef.current;
    if (e && sc) sc.scrollTo({ top: e.offsetTop - 150, behavior: 'smooth' });
  }, []);

  /* --- date windows --- */
  const dateToIdx = s => { const d = new Date(s + 'T00:00:00'); const diff = Math.round((today - d) / 86400000); return Math.max(0, Math.min(89, 89 - diff)); };
  const windows = () => {
    if (range === '7d') return { val: idxRange(83, 89), dc: idxRange(83, 89), dp: idxRange(76, 82) };
    if (range === '30d') return { val: idxRange(60, 89), dc: idxRange(60, 89), dp: idxRange(30, 59) };
    if (range === '90d') return { val: idxRange(0, 89), dc: idxRange(60, 89), dp: idxRange(30, 59) };
    let a = dateToIdx(cStart), b = dateToIdx(cEnd); if (a > b) [a, b] = [b, a];
    const len = b - a + 1, val = idxRange(a, b);
    return { val, dc: val, dp: a - len >= 0 ? idxRange(a - len, a - 1) : null };
  };
  const w = windows();

  const delta = (c, p, isPct) => {
    if (p == null || p === 0) return { color: C.slate, text: 'â' };
    const diff = isPct ? c - p : ((c - p) / p) * 100;
    if (Math.abs(diff) < 0.05) return { color: C.slate, text: 'â' };
    const up = diff >= 0;
    return { color: up ? C.success : C.danger, text: (up ? 'â² +' : 'â¼ ') + (isPct ? diff.toFixed(1) + ' pp' : diff.toFixed(1) + '%') };
  };

  /* --- scope --- */
  let scopeDevs = devs;
  if (loc !== 'all') scopeDevs = scopeDevs.filter(d => d.locId === loc);
  if (dev !== 'all') scopeDevs = scopeDevs.filter(d => d.id === dev);
  if (mode !== 'all') scopeDevs = scopeDevs.filter(d => d.mode === mode);
  const scopeIds = scopeDevs.map(d => d.id);

  const cur = agg(daily, scopeIds, w.val);
  const dC = agg(daily, scopeIds, w.dc);
  const dP = w.dp ? agg(daily, scopeIds, w.dp) : null;

  const sr = rate(cur.success, cur.cnt);
  const srC = rate(dC.success, dC.cnt), srP = dP ? rate(dP.success, dP.cnt) : null;
  const sat = rate(cur.fbU, cur.fbU + cur.fbD);
  const satC = rate(dC.fbU, dC.fbU + dC.fbD), satP = dP ? rate(dP.fbU, dP.fbU + dP.fbD) : null;
  const avg = cur.success ? cur.rev / cur.success : 0;
  const avgC = dC.success ? dC.rev / dC.success : 0, avgP = dP && dP.success ? dP.rev / dP.success : null;

  const kpis = [
    { label: 'Total revenue', value: usd(cur.rev), d: delta(dC.rev, dP && dP.rev), sub: usd(cur.refund) + ' refunded' },
    { label: 'Transactions', value: num(cur.cnt), d: delta(dC.cnt, dP && dP.cnt), sub: 'all sessions' },
    { label: 'Completed', value: num(cur.success), d: delta(dC.success, dP && dP.success), sub: num(cur.failed) + ' failed Â· ' + num(cur.cancelled) + ' cancelled' },
    { label: 'Avg transaction', value: usd(avg), d: delta(avgC, avgP), sub: 'per completed' },
    { label: 'Success rate', value: pct(sr), d: delta(srC, srP, true), sub: num(cur.failed) + ' failed' },
    { label: 'Satisfaction', value: pct(sat), d: delta(satC, satP, true), sub: num(cur.fbU) + ' up Â· ' + num(cur.fbD) + ' down' },
  ];

  /* --- revenue by location (respects date + mode only) --- */
  const locBarArr = locs.map(l => {
    let ids = devs.filter(d => d.locId === l.id);
    if (mode !== 'all') ids = ids.filter(d => d.mode === mode);
    return { name: l.name, rev: agg(daily, ids.map(d => d.id), w.val).rev, sel: loc === l.id };
  }).sort((a, b) => b.rev - a.rev);

  /* --- outcomes --- */
  const totSess = Math.max(1, cur.success + cur.failed + cur.cancelled);
  const outcomes = [
    { label: 'Finished', color: C.ink, value: num(cur.success), pct: pct(rate(cur.success, totSess)) + ' of sessions' },
    { label: 'Expired', color: C.danger, value: num(cur.failed), pct: pct(rate(cur.failed, totSess)) + ' of sessions' },
    { label: 'Canceled', color: C.warning, value: num(cur.cancelled), pct: pct(rate(cur.cancelled, totSess)) + ' of sessions' },
  ];

  /* --- device table --- */
  const deviceRows = scopeDevs.map(d => {
    const a = aggDev(daily, d.id, w.val);
    const srr = rate(a.success, a.cnt), fbr = rate(a.fbU, a.fbU + a.fbD);
    const dys = w.val.length || 1;
    const util = Math.min(99, Math.round((a.success / dys) / d.base * 100 * 1.05));
    const needs = srr < 90 || fbr < 78;
    return { d, a, srr, fbr, util, needs };
  });
  const sortVal = x => (sort.key === 'rev' ? x.a.rev : sort.key === 'txns' ? x.a.cnt : sort.key === 'success' ? x.srr : sort.key === 'fb' ? x.fbr : x.util);
  deviceRows.sort((x, y) => (sortVal(x) - sortVal(y)) * (sort.dir === 'desc' ? -1 : 1));
  const caret = k => (sort.key === k ? (sort.dir === 'desc' ? ' â' : ' â') : '');
  const toggleSort = k => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));

  /* --- drill-down --- */
  const isL0 = drill.length === 0, isL1 = drill.length === 1, isL2 = drill.length === 2;

  /* --- alerts --- */
  const devAgg = Object.fromEntries(devs.map(d => [d.id, aggDev(daily, d.id, w.val)]));
  const locAgg = Object.fromEntries(locs.map(l => [l.id, agg(daily, devs.filter(d => d.locId === l.id).map(d => d.id), w.val)]));
  const alerts = [];
  const revDelta = dP && dP.rev ? ((dC.rev - dP.rev) / dP.rev) * 100 : null;
  if (revDelta != null && revDelta < -3) alerts.push({ sev: 'Revenue', color: C.danger, title: `Revenue decreased ${Math.abs(revDelta).toFixed(1)}% vs the prior period.`, body: 'Driven mostly by declining volume at Brooklyn Navy Yard. Review pricing and traffic at lagging locations.', action: 'Investigate', go: () => gotoSection('revenue') });
  else if (revDelta != null && revDelta > 8) alerts.push({ sev: 'Revenue', color: C.success, title: `Revenue grew ${revDelta.toFixed(1)}% vs the prior period.`, body: 'Midway Transit and Eclipse Estates are leading the growth. Consider expanding capacity at peak hours.', action: 'View detail', go: () => gotoSection('revenue') });
  const worst = devs.map(d => ({ d, fr: rate(devAgg[d.id].failed, devAgg[d.id].cnt) })).sort((a, b) => b.fr - a.fr)[0];
  if (worst && worst.fr > 8) alerts.push({ sev: 'Device', color: C.danger, title: `Device ${worst.d.id} failure rate ${worst.fr.toFixed(1)}% â above the 8% threshold.`, body: `${worst.d.mode} device at ${locById[worst.d.locId].name}. Likely a lock or payment-terminal fault. Schedule a service visit.`, action: 'Create ticket', go: () => showToast(`Service ticket created for device ${worst.d.id} â assigned to field ops.`) });
  const lowSat = locs.map(l => ({ l, st: locAgg[l.id].fbU + locAgg[l.id].fbD ? rate(locAgg[l.id].fbU, locAgg[l.id].fbU + locAgg[l.id].fbD) : 100 })).sort((a, b) => a.st - b.st)[0];
  if (lowSat && lowSat.st < 78) alerts.push({ sev: 'Satisfaction', color: C.warning, title: `${lowSat.l.name} satisfaction ${lowSat.st.toFixed(0)}% â below the 80% target.`, body: 'Customer thumbs-down is concentrated on service and delivery devices. Audit hardware reliability and signage.', action: 'Review location', go: () => setDrawer({ type: 'loc', id: lowSat.l.id }) });
  const conv = devs.map(d => ({ d, cnt: devAgg[d.id].cnt, cr: rate(devAgg[d.id].cancelled, devAgg[d.id].cnt) })).filter(x => x.cnt > 1500).sort((a, b) => b.cr - a.cr)[0];
  if (conv && conv.cr > 8) alerts.push({ sev: 'Conversion', color: C.purple, title: `Device ${conv.d.id} sees high traffic but ${conv.cr.toFixed(0)}% of sessions are cancelled.`, body: `High footfall at ${locById[conv.d.locId].name} is not converting. Check flow, pricing, and door availability at peak.`, action: 'Open device', go: () => setDrawer({ type: 'dev', id: conv.d.id }) });
  const under = devs.map(d => { const dys = w.val.length || 1; return { d, util: Math.min(99, Math.round((devAgg[d.id].success / dys) / d.base * 100 * 1.05)) }; }).sort((a, b) => a.util - b.util)[0];
  if (under && under.util < 45) alerts.push({ sev: 'Utilization', color: C.purple, title: `Device ${under.d.id} utilization ${under.util}% â consistently underused.`, body: `Consider relocating or consolidating this unit at ${locById[under.d.locId].name} to free up capital.`, action: 'Open device', go: () => setDrawer({ type: 'dev', id: under.d.id }) });

  /* --- export --- */
  const csvFor = () => {
    let csv = 'Device,Location,Mode,Transactions,Revenue,Success rate %,Satisfaction %\n';
    for (const d of scopeDevs) { const a = aggDev(daily, d.id, w.val); csv += [d.id, locById[d.locId].name, d.mode, a.cnt, Math.round(a.rev), rate(a.success, a.cnt).toFixed(1), rate(a.fbU, a.fbU + a.fbD).toFixed(1)].join(',') + '\n'; }
    return csv;
  };
  const exportData = (fmt, name, type) => {
    const csv = csvFor(); let ok = false;
    try { const blob = new Blob([csv], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => { try { document.body.removeChild(a); } catch (e) {} URL.revokeObjectURL(url); }, 1500); ok = true; } catch (e) { ok = false; }
    try { navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText(csv); } catch (e) {}
    showToast(ok ? `${fmt} file downloaded â data also copied to clipboard.` : `${fmt} data copied to clipboard â paste into a spreadsheet.`);
  };

  /* --- options --- */
  const rangeOptions = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days'], ['custom', 'Custom range']];
  const locOptions = [['all', 'All locations'], ...locs.map(l => [l.id, l.name])];
  const devicePool = loc === 'all' ? devs : devs.filter(d => d.locId === loc);
  const deviceOptions = [['all', 'All devices'], ...devicePool.map(d => [d.id, d.id + ' Â· ' + d.mode])];
  const modeOptions = [['all', 'All modes'], ['Storage', 'Storage'], ['Delivery', 'Delivery'], ['Asset', 'Asset'], ['Service', 'Service'], ['Vending', 'Vending']];
  const statusOptions = [['all', 'All statuses'], ['Finished', 'Finished'], ['Canceled', 'Canceled'], ['Expired', 'Expired'], ['In progress', 'In progress']];

  const scopeLabel = (range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : range === '90d' ? 'Last 90 days' : 'Custom range') + (loc !== 'all' ? ' Â· ' + locById[loc].name : '');

  /* ---------------- chart builders ---------------- */
  function trendPoints(idxs) {
    const dailyPts = idxs.map(i => ({ i, rev: scopeIds.reduce((s, d) => s + daily[d][i].rev, 0) }));
    if (idxs.length > 45) {
      const out = [];
      for (let k = 0; k < dailyPts.length; k += 7) { const slice = dailyPts.slice(k, k + 7); out.push({ label: md(days[slice[slice.length - 1].i]), v: slice.reduce((s, x) => s + x.rev, 0) }); }
      return out;
    }
    return dailyPts.map(x => ({ label: md(days[x.i]), v: x.rev }));
  }
  function TrendChart() {
    const pts = trendPoints(w.val), prev = w.dp ? trendPoints(w.dp) : null;
    const W = 920, H = 300, pL = 14, pR = 16, pT = 18, pB = 36, iW = W - pL - pR, iH = H - pT - pB;
    const max = niceMax(Math.max(1, ...pts.map(p => p.v), ...(prev ? prev.map(p => p.v) : [])));
    const n = pts.length;
    const X = i => (n <= 1 ? pL + iW / 2 : pL + (i * iW) / (n - 1));
    const Y = v => pT + iH - (v / max) * iH;
    const ch = [];
    for (let g = 0; g <= 4; g++) { const y = pT + iH - (g / 4) * iH; ch.push(el('line', { key: 'g' + g, x1: pL, x2: pL + iW, y1: y, y2: y, stroke: '#EDEDED' })); ch.push(el('text', { key: 'gl' + g, x: pL + iW, y: y - 4, textAnchor: 'end', fontSize: 10, fill: C.silver, fontFamily: FONT }, usdk((max * g) / 4))); }
    if (prev && chart !== 'bars') ch.push(el('polyline', { key: 'prev', points: prev.map((p, i) => X(i) + ',' + Y(p.v)).join(' '), fill: 'none', stroke: '#C9C9C9', strokeWidth: 1.5, strokeDasharray: '4 4' }));
    if (chart === 'bars') {
      const bw = Math.max(3, (iW / n) * 0.6);
      pts.forEach((p, i) => { const y = Y(p.v); ch.push(el('rect', { key: 'b' + i, x: X(i) - bw / 2, y, width: bw, height: pT + iH - y, fill: i === trendHover ? C.purple : C.ink })); });
    } else {
      const line = pts.map((p, i) => X(i) + ',' + Y(p.v)).join(' ');
      if (chart === 'area') ch.push(el('path', { key: 'area', d: 'M ' + X(0) + ',' + (pT + iH) + ' L ' + line + ' L ' + X(n - 1) + ',' + (pT + iH) + ' Z', fill: 'rgba(74,66,234,0.10)' }));
      ch.push(el('polyline', { key: 'ln', points: line, fill: 'none', stroke: C.purple, strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' }));
      pts.forEach((p, i) => { if (n <= 31 || i === trendHover) ch.push(el('circle', { key: 'pt' + i, cx: X(i), cy: Y(p.v), r: i === trendHover ? 4.5 : 2.4, fill: i === trendHover ? C.purple : '#fff', stroke: C.purple, strokeWidth: 1.5 })); });
    }
    const step = Math.max(1, Math.ceil(n / 7));
    pts.forEach((p, i) => { if (i % step === 0 || i === n - 1) ch.push(el('text', { key: 'xl' + i, x: X(i), y: H - 12, textAnchor: 'middle', fontSize: 10, fill: C.slate, fontFamily: FONT }, p.label)); });
    if (trendHover >= 0 && trendHover < n) {
      const i = trendHover; ch.push(el('line', { key: 'hv', x1: X(i), x2: X(i), y1: pT, y2: pT + iH, stroke: C.purple, strokeDasharray: '3 3', opacity: 0.5 }));
      const tx = Math.min(Math.max(X(i), 58), W - 58), ty = Math.max(Y(pts[i].v) - 14, 40);
      ch.push(el('g', { key: 'tt' }, el('rect', { x: tx - 54, y: ty - 40, width: 108, height: 34, fill: C.ink, rx: 3 }), el('text', { x: tx, y: ty - 24, textAnchor: 'middle', fontSize: 12, fontWeight: 700, fill: '#fff', fontFamily: FONT }, usd(pts[i].v)), el('text', { x: tx, y: ty - 11, textAnchor: 'middle', fontSize: 9, fill: C.silver, fontFamily: FONT }, pts[i].label)));
    }
    pts.forEach((p, i) => { const wd = n <= 1 ? iW : iW / (n - 1); ch.push(el('rect', { key: 'h' + i, x: X(i) - wd / 2, y: pT, width: wd, height: iH, fill: 'transparent', onMouseEnter: () => setTrendHover(i), onMouseLeave: () => setTrendHover(-1) })); });
    return el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', style: { display: 'block', height: 'auto' } }, ch);
  }
  function LocBars() {
    const mx = Math.max(1, ...locBarArr.map(a => a.rev));
    return el('div', { style: { display: 'flex', flexDirection: 'column', gap: 13 } }, locBarArr.map((a, i) =>
      el('div', { key: i, style: { display: 'flex', flexDirection: 'column', gap: 5 } },
        el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: FONT } },
          el('span', { style: { fontWeight: 600, color: a.sel ? C.purple : C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, a.name),
          el('span', { style: { fontWeight: 800, marginLeft: 8 } }, usdk(a.rev))),
        el('div', { style: { height: 8, background: '#F0F0F0' } }, el('div', { style: { height: '100%', width: (a.rev / mx) * 100 + '%', background: a.sel ? C.purple : C.ink } })))));
  }
  function Donut() {
    const segs = [{ label: 'Finished', value: cur.success, color: C.ink }, { label: 'Expired', value: cur.failed, color: C.danger }, { label: 'Canceled', value: cur.cancelled, color: C.warning }];
    const tot = Math.max(1, segs.reduce((s, x) => s + x.value, 0)), R = 52, CIRC = 2 * Math.PI * R, cx = 70, cy = 70, sw = 18; let off = 0;
    const ch = [el('circle', { key: 'bg', cx, cy, r: R, fill: 'none', stroke: '#F0F0F0', strokeWidth: sw })];
    segs.forEach((sg, k) => { const len = (sg.value / tot) * CIRC, active = donutHover === k; ch.push(el('circle', { key: k, cx, cy, r: R, fill: 'none', stroke: sg.color, strokeWidth: active ? sw + 4 : sw, strokeDasharray: len + ' ' + (CIRC - len), strokeDashoffset: -off, transform: `rotate(-90 ${cx} ${cy})`, style: { transition: 'stroke-width .12s', cursor: 'default' }, onMouseEnter: () => setDonutHover(k), onMouseLeave: () => setDonutHover(null) })); off += len; });
    const show = donutHover != null ? segs[donutHover] : segs[0];
    ch.push(el('text', { key: 't', x: cx, y: cy - 1, textAnchor: 'middle', fontSize: 22, fontWeight: 800, fontFamily: FONT, fill: C.ink }, ((show.value / tot) * 100).toFixed(1) + '%'));
    ch.push(el('text', { key: 't2', x: cx, y: cy + 15, textAnchor: 'middle', fontSize: 9, letterSpacing: '0.12em', fill: C.slate, fontFamily: FONT, fontWeight: 700 }, show.label.toUpperCase()));
    return el('svg', { viewBox: '0 0 140 140', width: 140, height: 140, style: { display: 'block' } }, ch);
  }
  function Heatmap() {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let mx = 0, totW = 0; const grid = [];
    for (let d = 0; d < 7; d++) { const row = []; for (let h = 0; h < 24; h++) { const v = hourly[h] * dayMult[d]; row.push(v); if (v > mx) mx = v; totW += v; } grid.push(row); }
    const weeklyAvg = cur.cnt / Math.max(1, w.val.length / 7);
    const hh12 = h => (h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : h - 12 + ' PM');
    const rows = dayNames.map((dn, d) => el('div', { key: d, style: { display: 'flex', alignItems: 'center', gap: 6 } },
      el('div', { style: { width: 28, fontSize: 10, color: C.slate, fontFamily: FONT, textAlign: 'right' } }, dn),
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(24,1fr)', gap: 2, flex: 1 } },
        grid[d].map((v, h) => { const active = heatHover && heatHover.d === d && heatHover.h === h; return el('div', { key: h, onMouseEnter: () => setHeatHover({ d, h, dn, sessions: Math.round((weeklyAvg * v) / totW), pct: Math.round((v / mx) * 100) }), style: { height: 15, background: `rgba(74,66,234,${(v / mx * 0.92 + 0.05).toFixed(2)})`, boxShadow: active ? 'inset 0 0 0 2px #0A0A0A' : 'none', cursor: 'default' } }); }))))
    const labels = [];
    for (let h = 0; h < 24; h++) labels.push(el('div', { key: h, style: { textAlign: 'center', fontSize: 9, color: C.silver, fontFamily: FONT } }, h % 6 === 0 ? (h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? h + 'a' : h - 12 + 'p') : ''));
    const axis = el('div', { style: { display: 'flex', gap: 6, marginTop: 5 } }, el('div', { style: { width: 28 } }), el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(24,1fr)', gap: 2, flex: 1 } }, labels));
    let tip = null;
    if (heatHover) tip = el('div', { style: { position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%,-112%)', background: C.ink, color: '#fff', padding: '8px 13px', borderRadius: 4, fontFamily: FONT, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.18)', pointerEvents: 'none', zIndex: 5 } },
      el('div', { style: { fontWeight: 800, fontSize: 13 } }, `${heatHover.dn}, ${hh12(heatHover.h)} â ${hh12((heatHover.h + 1) % 24)}`),
      el('div', { style: { fontSize: 11, color: C.silver, marginTop: 2 } }, `~${heatHover.sessions} sessions Â· ${heatHover.pct}% of peak`));
    return el('div', { onMouseLeave: () => setHeatHover(null), style: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 } }, tip, ...rows, axis);
  }
  let peakH = 0; for (let h = 0; h < 24; h++) if (hourly[h] > hourly[peakH]) peakH = h;

  /* ---------------- drill rows ---------------- */
  let scopeStats = [], drillLocRows = [], drillDevRows = [], drillTxnRows = [];
  if (isL0) {
    const all = agg(daily, devs.map(d => d.id), w.val);
    scopeStats = [{ label: 'Locations', value: String(locs.length) }, { label: 'Devices', value: String(devs.length) }, { label: 'Revenue', value: usd(all.rev) }, { label: 'Transactions', value: num(all.cnt) }, { label: 'Satisfaction', value: pct(rate(all.fbU, all.fbU + all.fbD)) }];
    drillLocRows = locs.map(l => { const ids = devs.filter(d => d.locId === l.id).map(d => d.id); const a = agg(daily, ids, w.val); const srr = rate(a.success, a.cnt), st = rate(a.fbU, a.fbU + a.fbD); return { id: l.id, name: l.name, city: l.city, devCount: ids.length, rev: a.rev, revT: usd(a.rev), txns: num(a.cnt), success: pct(srr), successColor: successColor(srr), sat: pct(st), satColor: satColor(st) }; }).sort((a, b) => b.rev - a.rev);
  } else if (isL1) {
    const l = locById[drill[0]], ids = devs.filter(d => d.locId === l.id).map(d => d.id), a = agg(daily, ids, w.val);
    scopeStats = [{ label: 'Location', value: l.name }, { label: 'Devices', value: String(ids.length) }, { label: 'Revenue', value: usd(a.rev) }, { label: 'Transactions', value: num(a.cnt) }, { label: 'Success', value: pct(rate(a.success, a.cnt)) }, { label: 'Satisfaction', value: pct(rate(a.fbU, a.fbU + a.fbD)) }];
    drillDevRows = devs.filter(d => d.locId === l.id).map(d => { const da = aggDev(daily, d.id, w.val); const dsr = rate(da.success, da.cnt), dfb = rate(da.fbU, da.fbU + da.fbD); return { id: d.id, mode: d.mode, rev: da.rev, revT: usd(da.rev), txns: num(da.cnt), success: pct(dsr), successColor: successColor(dsr), fb: pct(dfb), fbColor: satColor(dfb) }; }).sort((a, b) => b.rev - a.rev);
  } else if (isL2) {
    const d = devById[drill[1]], a = aggDev(daily, d.id, w.val), dys = w.val.length || 1;
    const util = Math.min(99, Math.round((a.success / dys) / d.base * 100 * 1.05));
    scopeStats = [{ label: 'Device', value: d.id }, { label: 'Revenue', value: usd(a.rev) }, { label: 'Transactions', value: num(a.cnt) }, { label: 'Success', value: pct(rate(a.success, a.cnt)) }, { label: 'Feedback', value: pct(rate(a.fbU, a.fbU + a.fbD)) }, { label: 'Utilization', value: util + '%' }];
    let rows = sampleTxns(devById, days, d.id, w.val);
    if (status !== 'all') rows = rows.filter(r => r.status === status);
    drillTxnRows = rows.slice(0, 18).map(r => ({ id: r.id, time: r.time, type: r.type, amount: r.amount ? usd(r.amount) : 'â', status: r.status, stBg: STATUS_COLORS[r.status][0], stFg: STATUS_COLORS[r.status][1], fb: r.fb === 'up' ? 'â' : r.fb === 'down' ? 'â' : 'â', fbColor: r.fb === 'up' ? C.success : r.fb === 'down' ? C.danger : C.silver }));
  }
  const crumbs = [{ label: 'All locations', go: () => setDrill([]), color: isL0 ? C.ink : C.purple, sep: isL0 ? '' : '/' }];
  if (drill.length >= 1) crumbs.push({ label: locById[drill[0]].name, go: () => setDrill([drill[0]]), color: isL1 ? C.ink : C.purple, sep: isL1 ? '' : '/' });
  if (drill.length >= 2) crumbs.push({ label: drill[1], go: () => {}, color: C.ink, sep: '' });

  /* ---------------- drawer data ---------------- */
  let drawerData = null;
  if (drawer) {
    if (drawer.type === 'loc') {
      const l = locById[drawer.id], dids = devs.filter(d => d.locId === l.id), a = agg(daily, dids.map(d => d.id), w.val);
      drawerData = {
        isLoc: true, kicker: 'Location', title: l.name, subtitle: `${l.city} Â· ${dids.length} devices`,
        stats: [['Revenue', usd(a.rev)], ['Transactions', num(a.cnt)], ['Success rate', pct(rate(a.success, a.cnt))], ['Satisfaction', pct(rate(a.fbU, a.fbU + a.fbD))], ['Avg transaction', usd(a.success ? a.rev / a.success : 0)], ['Failed sessions', num(a.failed)]],
        devices: dids.map(d => { const da = aggDev(daily, d.id, w.val); const dsr = rate(da.success, da.cnt), dfb = rate(da.fbU, da.fbU + da.fbD); const needs = dsr < 90 || dfb < 78; return { id: d.id, mode: d.mode, rev: usd(da.rev), success: pct(dsr), successColor: successColor(dsr), pillBg: needs ? (dsr < 85 ? C.dangerBg : C.warningBg) : C.successBg, pillFg: needs ? (dsr < 85 ? C.danger : C.warning) : C.success, pillText: needs ? 'Attention' : 'Healthy' }; }),
      };
    } else {
      const d = devById[drawer.id], l = locById[d.locId], a = aggDev(daily, d.id, w.val), dys = w.val.length || 1;
      const srr = rate(a.success, a.cnt), dfb = rate(a.fbU, a.fbU + a.fbD), needs = srr < 90 || dfb < 78;
      const util = Math.min(99, Math.round((a.success / dys) / d.base * 100 * 1.05));
      drawerData = {
        isLoc: false, kicker: 'Device', title: d.id, subtitle: `${d.mode} Â· ${l.name}`,
        needsBg: needs ? C.warningBg : C.successBg, needsColor: needs ? C.warning : C.success, needsText: needs ? 'Flagged â below the success-rate or satisfaction target.' : 'Operating within all targets.',
        stats: [['Revenue', usd(a.rev)], ['Transactions', num(a.cnt)], ['Success rate', pct(srr)], ['Satisfaction', pct(dfb)], ['Utilization', util + '%'], ['Failure rate', pct(rate(a.failed, a.cnt))]],
        txns: sampleTxns(devById, days, d.id, w.val).slice(0, 6).map(r => ({ id: r.id, time: r.time, amount: r.amount ? usd(r.amount) : 'â', status: r.status, stBg: STATUS_COLORS[r.status][0], stFg: STATUS_COLORS[r.status][1] })),
      };
    }
  }

  /* ---------------- render ---------------- */
  const sec = { scrollMarginTop: 150, marginBottom: 40 };
  const headerRow = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 };
  const metaTxt = { fontSize: 12, color: C.slate, fontFamily: FONT };
  const SectionHead = ({ id, title, meta }) => (
    <div style={headerRow}>
      <div><div style={S.sectionTitle}>{title}</div></div>
      {meta != null && <span style={metaTxt}>{meta}</span>}
    </div>
  );
  const Field = ({ label, children }) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ ...S.eyebrow, fontSize: 9, color: C.mute }}>{label}</span>
      {children}
    </label>
  );
  const sortTh = (label, key) => (
    <th onClick={() => toggleSort(key)} style={{ ...S.th, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>{label}{caret(key)}</th>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: FONT, background: C.paper, color: C.ink, overflow: 'hidden' }}>
      <style>{`
        .ra-navlink{transition:background .15s,color .15s}
        .ra-rowhover{transition:background .12s}
        .ra-rowhover:hover{background:${C.paper};cursor:pointer}
        .ra-anchor:hover{color:${C.ink}}
        .ra-menuitem:hover{background:${C.mist}}
        .ra-pill{display:inline-flex;align-items:center;padding:8px 15px;font-family:${FONT};font-weight:500;font-size:12px;color:${C.ink};background:#fff;border:1px solid ${C.ink};border-radius:8px;cursor:pointer;transition:background .2s,color .2s}
        .ra-pill:hover{background:${C.ink};color:#fff}
        @keyframes ra-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes ra-slideIn{from{transform:translateX(100%)}to{transform:none}}
        @keyframes ra-fadeBg{from{opacity:0}to{opacity:1}}
        @keyframes ra-toastIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
      `}</style>

      <main ref={scrollRef} id="scroll" style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
        {/* sticky header: tabs + filters */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(250,250,250,0.92)', backdropFilter: 'saturate(180%) blur(8px)', borderBottom: `1px solid ${C.lineSoft}` }}>
          <div style={{ maxWidth: 1320, padding: '0 32px', display: 'flex', gap: 22, alignItems: 'center', overflowX: 'auto' }}>
            {TABS.map(([id, label]) => {
              const active = activeTab === id;
              return <a key={id} href={'#sec-' + id} onClick={() => setActiveTab(id)} className="ra-anchor" style={{ whiteSpace: 'nowrap', textDecoration: 'none', padding: '13px 1px 11px', fontFamily: FONT, fontWeight: active ? 800 : 600, fontSize: 13, color: active ? C.ink : C.slate, borderBottom: `2px solid ${active ? C.purple : 'transparent'}` }}>{label}</a>;
            })}
          </div>
          <div style={{ maxWidth: 1320, padding: '12px 32px', display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid #EFEFEF' }}>
            <Field label="Date range">
              <select value={range} onChange={e => setRange(e.target.value)} style={S.select}>{rangeOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </Field>
            {range === 'custom' && <>
              <Field label="From"><input type="date" value={cStart} onChange={e => setCStart(e.target.value)} style={{ ...S.select, fontWeight: 400 }} /></Field>
              <Field label="To"><input type="date" value={cEnd} onChange={e => setCEnd(e.target.value)} style={{ ...S.select, fontWeight: 400 }} /></Field>
            </>}
            <Field label="Location"><select value={loc} onChange={e => { setLoc(e.target.value); setDev('all'); }} style={S.select}>{locOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Device"><select value={dev} onChange={e => setDev(e.target.value)} style={S.select}>{deviceOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Mode"><select value={mode} onChange={e => setMode(e.target.value)} style={S.select}>{modeOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value)} style={S.select}>{statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <button onClick={() => { setRange('30d'); setLoc('all'); setDev('all'); setMode('all'); setStatus('all'); }} style={{ ...S.select, width: 'auto', color: C.slate }}>Reset</button>
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <button onClick={() => setExportOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: C.ink, border: `1px solid ${C.ink}`, borderRadius: 4, fontFamily: FONT, fontWeight: 600, fontSize: 13, color: '#fff', cursor: 'pointer' }}>Export â¾</button>
              {exportOpen && (
                <div style={{ position: 'absolute', right: 0, top: 46, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 50, minWidth: 190 }}>
                  <div style={{ ...S.eyebrow, padding: '10px 14px 6px', fontSize: 9, color: C.mute, borderBottom: '1px solid #F0F0F0' }}>Respects active filters</div>
                  {[['CSV', 'accessa-report.csv', 'text/csv', '.csv'], ['Excel', 'accessa-report.xls', 'application/vnd.ms-excel', '.xlsx'], ['Report', 'accessa-report.csv', 'text/csv', '.pdf']].map(([fmt, name, type, ext], i) => (
                    <button key={i} onClick={() => exportData(fmt, name, type)} className="ra-menuitem" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: C.ink, cursor: 'pointer', textAlign: 'left' }}>{ext === '.pdf' ? 'PDF' : fmt}<span style={{ color: C.silver, fontWeight: 500 }}>{ext}</span></button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 32px 90px', maxWidth: 1320 }}>
          {/* OVERVIEW */}
          <section id="sec-overview" style={sec}>
            <SectionHead title="Executive summary" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
              {kpis.map((k, i) => (
                <div key={i} style={{ ...S.card, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 9, animation: 'ra-fadeUp .3s ease' }}>
                  <div style={{ ...S.eyebrow, fontSize: 10 }}>{k.label}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1 }}>{k.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: k.d.color }}>{k.d.text}</span>
                    <span style={{ fontSize: 11, color: C.mute }}>{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* REVENUE */}
          <section id="sec-revenue" style={sec}>
            <SectionHead title="Revenue" />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.15fr) minmax(0,1fr)', gap: 16 }}>
              <div style={{ ...S.card, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={S.cardTitle}>Revenue trend</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.slate }}><span style={{ width: 14, height: 3, background: C.purple, display: 'inline-block' }} />This period</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.slate }}><span style={{ width: 14, borderTop: '2px dashed #C9C9C9', display: 'inline-block' }} />Prior period</span>
                    </div>
                  </div>
                  <div style={{ display: 'inline-flex', border: `1px solid ${C.line}`, borderRadius: 4, overflow: 'hidden' }}>
                    {['area', 'bars', 'line'].map((m, i) => (
                      <button key={m} onClick={() => setChart(m)} style={{ padding: '7px 14px', border: 'none', borderRight: i < 2 ? `1px solid ${C.line}` : 'none', fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: 'pointer', background: chart === m ? C.ink : '#fff', color: chart === m ? '#fff' : C.slate }}>{m[0].toUpperCase() + m.slice(1)}</button>
                    ))}
                  </div>
                </div>
                <div style={{ width: '100%' }}><TrendChart /></div>
              </div>
              <div style={{ ...S.card, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ ...S.cardTitle, marginBottom: 18 }}>By location</div>
                <div style={{ flex: 1 }}><LocBars /></div>
              </div>
            </div>
          </section>

          {/* TRANSACTIONS */}
          <section id="sec-transactions" style={sec}>
            <SectionHead title="Transactions" />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)', gap: 16 }}>
              <div style={{ ...S.card, padding: '20px 22px' }}>
                <div style={{ ...S.cardTitle, marginBottom: 14 }}>Outcomes</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  <div style={{ flex: 'none' }}><Donut /></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {outcomes.map((o, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: FONT, fontWeight: 600 }}><span style={{ width: 10, height: 10, background: o.color, display: 'inline-block' }} />{o.label}</span>
                          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15 }}>{o.value}</span>
                        </div>
                        <span style={{ fontSize: 11, color: C.mute, paddingLeft: 18 }}>{o.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ ...S.card, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={S.cardTitle}>Peak usage</div>
                  <div style={metaTxt}>Busiest: <strong style={{ color: C.ink }}>Friday</strong> Â· Peak hours <strong style={{ color: C.ink }}>8â10 AM Â· 5â7 PM</strong></div>
                </div>
                <Heatmap />
              </div>
            </div>
          </section>

          {/* DEVICES */}
          <section id="sec-devices" style={sec}>
            <SectionHead title="Device health" meta={`Showing ${scopeDevs.length} of ${devs.length} devices`} />
            <div style={{ ...S.card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.paper, textAlign: 'left' }}>
                    <th style={S.th}>Device</th><th style={S.th}>Location</th><th style={S.th}>Mode</th>
                    {sortTh('Txns', 'txns')}{sortTh('Revenue', 'rev')}{sortTh('Success rate', 'success')}{sortTh('Satisfaction', 'fb')}
                    <th onClick={() => toggleSort('util')} style={{ ...S.th, cursor: 'pointer', userSelect: 'none' }}>Utilization{caret('util')}</th>
                    <th style={S.th} />
                  </tr>
                </thead>
                <tbody>
                  {deviceRows.map(x => (
                    <tr key={x.d.id} className="ra-rowhover" onClick={() => gotoExplore([x.d.locId, x.d.id])} style={{ borderTop: '1px solid #F4F4F4' }}>
                      <td style={{ padding: '13px 18px', fontFamily: MONO, fontWeight: 600 }}>{x.d.id}</td>
                      <td style={{ padding: '13px 18px', color: C.graphite }}>{locById[x.d.locId].name}</td>
                      <td style={{ padding: '13px 18px', color: C.graphite }}>{x.d.mode}</td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', color: C.graphite }}>{num(x.a.cnt)}</td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 700 }}>{usd(x.a.rev)}</td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 700, color: successColor(x.srr) }}>{pct(x.srr)}</td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', color: satColor(x.fbr), fontWeight: 600 }}>{pct(x.fbr)}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 64, height: 6, background: '#F0F0F0', flex: 'none' }}><div style={{ height: '100%', width: x.util + '%', background: C.purple }} /></div>
                          <span style={{ fontSize: 12, color: C.slate, fontVariantNumeric: 'tabular-nums' }}>{x.util}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px' }}><span style={{ background: x.needs ? (x.srr < 85 ? C.dangerBg : C.warningBg) : C.successBg, color: x.needs ? (x.srr < 85 ? C.danger : C.warning) : C.success, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: FONT, whiteSpace: 'nowrap' }}>{x.needs ? 'Needs attention' : 'Healthy'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* LOCATIONS / EXPLORE */}
          <section id="sec-locations" style={sec}>
            <SectionHead title="Explore" />
            <div style={{ ...S.card, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {crumbs.map((c, i) => (
                  <React.Fragment key={i}>
                    <button onClick={c.go} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 15, color: c.color }}>{c.label}</button>
                    {c.sep && <span style={{ color: '#C9C9C9', fontSize: 14 }}>{c.sep}</span>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 1, background: '#EFEFEF', border: '1px solid #EFEFEF', marginBottom: 18 }}>
                {scopeStats.map((s, i) => (
                  <div key={i} style={{ background: '#fff', padding: '14px 16px' }}>
                    <div style={{ ...S.eyebrow, fontSize: 9, color: C.mute, marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {isL0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: C.paper, textAlign: 'left' }}>
                    <th style={{ ...S.th, padding: '10px 16px' }}>Location</th><th style={{ ...S.th, padding: '10px 16px' }}>Devices</th>
                    <th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Revenue</th><th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Transactions</th>
                    <th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Success</th><th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Satisfaction</th><th style={{ ...S.th, padding: '10px 16px' }} />
                  </tr></thead>
                  <tbody>
                    {drillLocRows.map(r => (
                      <tr key={r.id} className="ra-rowhover" onClick={() => setDrill([r.id])} style={{ borderTop: '1px solid #F4F4F4' }}>
                        <td style={{ padding: '14px 16px' }}><div style={{ fontFamily: FONT, fontWeight: 700 }}>{r.name}</div><div style={{ fontSize: 11, color: C.mute }}>{r.city}</div></td>
                        <td style={{ padding: '14px 16px', color: C.graphite }}>{r.devCount}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>{r.revT}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: C.graphite }}>{r.txns}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: r.successColor }}>{r.success}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: r.satColor, fontWeight: 600 }}>{r.sat}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}><span style={{ color: C.purple, fontWeight: 700 }}>Open â</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {isL1 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: C.paper, textAlign: 'left' }}>
                    <th style={{ ...S.th, padding: '10px 16px' }}>Device</th><th style={{ ...S.th, padding: '10px 16px' }}>Mode</th>
                    <th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Revenue</th><th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Transactions</th>
                    <th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Success</th><th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Feedback</th><th style={{ ...S.th, padding: '10px 16px' }} />
                  </tr></thead>
                  <tbody>
                    {drillDevRows.map(r => (
                      <tr key={r.id} className="ra-rowhover" onClick={() => setDrill([drill[0], r.id])} style={{ borderTop: '1px solid #F4F4F4' }}>
                        <td style={{ padding: '14px 16px', fontFamily: MONO, fontWeight: 600 }}>{r.id}</td>
                        <td style={{ padding: '14px 16px', color: C.graphite }}>{r.mode}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>{r.revT}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: C.graphite }}>{r.txns}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: r.successColor }}>{r.success}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: r.fbColor, fontWeight: 600 }}>{r.fb}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}><span style={{ color: C.purple, fontWeight: 700 }}>Open â</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {isL2 && (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ background: C.paper, textAlign: 'left' }}>
                      <th style={{ ...S.th, padding: '10px 16px' }}>Transaction</th><th style={{ ...S.th, padding: '10px 16px' }}>Time</th><th style={{ ...S.th, padding: '10px 16px' }}>Type</th>
                      <th style={{ ...S.th, padding: '10px 16px', textAlign: 'right' }}>Amount</th><th style={{ ...S.th, padding: '10px 16px' }}>Status</th><th style={{ ...S.th, padding: '10px 16px' }}>Feedback</th>
                    </tr></thead>
                    <tbody>
                      {drillTxnRows.map(r => (
                        <tr key={r.id} style={{ borderTop: '1px solid #F4F4F4' }}>
                          <td style={{ padding: '12px 16px', fontFamily: MONO, fontWeight: 600, fontSize: 12 }}>{r.id}</td>
                          <td style={{ padding: '12px 16px', color: C.slate }}>{r.time}</td>
                          <td style={{ padding: '12px 16px', color: C.graphite }}>{r.type}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{r.amount}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ background: r.stBg, color: r.stFg, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: FONT }}>{r.status}</span></td>
                          <td style={{ padding: '12px 16px', color: r.fbColor, fontWeight: 700 }}>{r.fb}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {drillTxnRows.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: C.mute, fontFamily: FONT, fontSize: 14 }}>No transactions match the current status filter.</div>}
                </>
              )}
            </div>
          </section>

          {/* ALERTS */}
          <section id="sec-alerts" style={{ scrollMarginTop: 150 }}>
            <SectionHead title="What needs attention" meta={`${alerts.length} active`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, ...S.card, padding: '16px 18px', alignItems: 'flex-start' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.color, marginTop: 6, flex: 'none' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ ...S.eyebrow, color: a.color, fontSize: 10 }}>{a.sev}</span>
                      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15 }}>{a.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.slate, margin: '5px 0 0' }}>{a.body}</p>
                  </div>
                  <button onClick={a.go} className="ra-pill" style={{ flex: 'none', whiteSpace: 'nowrap' }}>{a.action}</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* DETAIL DRAWER */}
        {drawer && drawerData && (
          <>
            <div onClick={() => setDrawer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.32)', zIndex: 70, animation: 'ra-fadeBg .15s ease' }} />
            <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 440, maxWidth: '92vw', background: '#fff', zIndex: 71, boxShadow: '-8px 0 30px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', animation: 'ra-slideIn .24s cubic-bezier(0.2,0.8,0.2,1)' }}>
              <div style={{ padding: '22px 24px', borderBottom: `1px solid ${C.lineSoft}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ ...S.eyebrow, fontSize: 10, marginBottom: 8 }}>{drawerData.kicker}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1 }}>{drawerData.title}</div>
                  <div style={{ fontSize: 13, color: C.slate, marginTop: 7 }}>{drawerData.subtitle}</div>
                </div>
                <button onClick={() => setDrawer(null)} style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 4, width: 32, height: 32, cursor: 'pointer', fontSize: 17, color: C.slate, flex: 'none', lineHeight: 1 }}>Ã</button>
              </div>
              <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
                {!drawerData.isLoc && <div style={{ background: drawerData.needsBg, color: drawerData.needsColor, padding: '11px 14px', borderRadius: 4, fontFamily: FONT, fontWeight: 700, fontSize: 13, marginBottom: 20 }}>{drawerData.needsText}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#EFEFEF', border: '1px solid #EFEFEF', marginBottom: 24 }}>
                  {drawerData.stats.map(([label, value], i) => (
                    <div key={i} style={{ background: '#fff', padding: '14px 16px' }}>
                      <div style={{ ...S.eyebrow, fontSize: 9, color: C.mute, marginBottom: 6 }}>{label}</div>
                      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {drawerData.isLoc && <>
                  <div style={{ ...S.eyebrow, fontSize: 10, marginBottom: 12 }}>Devices at this location</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {drawerData.devices.map(d => (
                      <div key={d.id} onClick={() => setDrawer({ type: 'dev', id: d.id })} className="ra-rowhover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${C.lineSoft}`, cursor: 'pointer' }}>
                        <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13 }}>{d.id}</span>
                        <span style={{ fontSize: 12, color: C.slate }}>{d.mode}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: FONT, fontWeight: 700, fontSize: 13 }}>{d.rev}</span>
                        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: d.successColor }}>{d.success}</span>
                        <span style={{ background: d.pillBg, color: d.pillFg, padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: FONT }}>{d.pillText}</span>
                      </div>
                    ))}
                  </div>
                </>}
                {!drawerData.isLoc && <>
                  <div style={{ ...S.eyebrow, fontSize: 10, marginBottom: 12 }}>Recent transactions</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {drawerData.txns.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F4F4F4' }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: C.graphite }}>{t.id}</span>
                        <span style={{ fontSize: 11, color: C.mute }}>{t.time}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>{t.amount}</span>
                        <span style={{ background: t.stBg, color: t.stFg, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: FONT }}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </>}
              </div>
            </div>
          </>
        )}

        {toast && <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', background: C.ink, color: '#fff', padding: '13px 22px', fontFamily: FONT, fontWeight: 600, fontSize: 13, zIndex: 60, boxShadow: '0 4px 12px rgba(0,0,0,0.18)', animation: 'ra-toastIn .2s ease' }}>{toast}</div>}
      </main>
    </div>
  );
}

import { Routes, Route } from 'react-router-dom';
export function ReportsRoute() {
  return (
    <Routes>
      <Route index element={<Reports />} />
      <Route path=":tab" element={<Reports />} />
    </Routes>
  );
}
