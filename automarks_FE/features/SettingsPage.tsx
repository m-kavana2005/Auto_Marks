
import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Trash2,
  BarChart3,
  Link as LinkIcon,
  BookOpen,
  ShieldAlert,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  RefreshCcw,
} from 'lucide-react';
import { endpoints, getApiBase, setApiBaseOverride } from '../api/client';
import { getBatchOptions } from '../utils/batches';

/* ─── Types ─────────────────────────────────────────────── */
type UiNotification = { id: number; title: string; detail?: string | null; level: string; created_at?: string | null };

/* ─── Helpers ─────────────────────────────────────────────*/
const formatAgo = (iso?: string | null) => {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

const mapLevel = (level: string) => {
  const l = (level || '').toLowerCase();
  if (l === 'success') return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', label: 'Success' };
  if (l === 'warning') return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', label: 'Warning' };
  if (l === 'error') return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300', label: 'Error' };
  return { icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300', label: 'Info' };
};

/* ─── Section Wrapper ─────────────────────────────────────*/
const Section = ({
  id,
  icon: Icon,
  title,
  subtitle,
  accent,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <button
        type="button"
        className={`w-full flex items-center gap-4 px-7 py-5 text-left ${collapsible ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors' : 'cursor-default'}`}
        onClick={() => collapsible && setOpen((o) => !o)}
      >
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${accent}`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base text-slate-900 dark:text-white leading-tight">{title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">{subtitle}</p>
        </div>
        {collapsible && (
          <div className="text-slate-400 shrink-0">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </button>
      {(!collapsible || open) && (
        <div className="px-7 pb-7 border-t border-slate-50 dark:border-slate-800 pt-5">
          {children}
        </div>
      )}
    </section>
  );
};

/* ─── Theme Section ───────────────────────────────────────*/
const ThemeSection = () => {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'light');

  const apply = (t: string) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
  };

  const options = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Bright and clean interface' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes at night' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(({ value, label, icon: Icon, desc }) => (
        <button
          key={value}
          onClick={() => apply(value)}
          className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
            theme === value
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className={`font-bold text-sm ${theme === value ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{desc}</p>
          </div>
          {theme === value && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

/* ─── Notifications Section ───────────────────────────────*/
const NotificationsSection = () => {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    endpoints.getNotifications(100)
      .then((res) => { if (!cancelled) setNotifications(res || []); })
      .catch(() => { if (!cancelled) setNotifications([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    try {
      const wsUrl = getApiBase().replace('http', 'ws') + '/ws/notifications';
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === 'notification' && msg?.data?.id) {
            setNotifications((prev) => {
              const next = [msg.data as UiNotification, ...prev.filter((n) => n.id !== msg.data.id)];
              return next.slice(0, 100);
            });
          }
          if (msg?.type === 'notification_cleared' && msg?.id) {
            setNotifications((prev) => prev.filter((n) => n.id !== Number(msg.id)));
          }
        } catch { /* ignore */ }
      };
      wsRef.current = ws;
    } catch { /* ignore */ }

    return () => {
      cancelled = true;
      try { wsRef.current?.close(); } catch { /* ignore */ }
      wsRef.current = null;
    };
  }, []);

  const handleDismiss = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try { await endpoints.clearNotification(id); } catch { /* ignore */ }
  };

  const handleClearAll = async () => {
    try { await endpoints.clearNotifications(); setNotifications([]); } catch { /* ignore */ }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  if (notifications.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
        <Bell size={28} />
      </div>
      <p className="font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
      <p className="text-sm text-slate-400 font-medium mt-1">No notifications to show right now.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors"
        >
          <Trash2 size={14} /> Clear All
        </button>
      </div>
      <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
        {notifications.map((n) => {
          const m = mapLevel(n.level);
          const Icon = m.icon;
          return (
            <div key={n.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex gap-3 items-start hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
              <div className={`shrink-0 w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center ${m.color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{n.title}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${m.badge}`}>{m.label}</span>
                </div>
                {n.detail && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{n.detail}</p>}
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                  <Clock size={11} /> {formatAgo(n.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(n.id)}
                className="shrink-0 w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── API / Advanced Section ──────────────────────────────*/
const AdvancedSection = () => {
  const [url, setUrl] = useState(getApiBase());
  const [subjects, setSubjects] = useState<Array<{ code: string; name: string; credits?: number | null }>>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [subjectsMessage, setSubjectsMessage] = useState<string | null>(null);
  const [purgeBatch, setPurgeBatch] = useState('');
  const [purgeUsn, setPurgeUsn] = useState('');
  const [purgeSem, setPurgeSem] = useState('');
  const [confirmCandidate, setConfirmCandidate] = useState('');
  const [confirmSemester, setConfirmSemester] = useState('');
  const [confirmAll, setConfirmAll] = useState('');
  const [purgeBusy, setPurgeBusy] = useState<null | 'candidate' | 'semester' | 'all'>(null);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const purgeInFlight = useRef(false);

  const inputCls = 'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white text-sm';
  const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2';

  const loadSubjects = async () => {
    if (subjectsLoading) return;
    setSubjectsError(null); setSubjectsMessage(null); setSubjectsLoading(true);
    try { setSubjects((await endpoints.getSubjectsWithCredits()) || []); }
    catch (e: any) { setSubjects([]); setSubjectsError(e?.message || 'Failed to load'); }
    finally { setSubjectsLoading(false); }
  };

  const saveCredits = async () => {
    if (subjectsLoading) return;
    setSubjectsError(null); setSubjectsMessage(null); setSubjectsLoading(true);
    try {
      const payload = subjects.map((s) => ({ code: s.code, credits: s.credits ?? null }));
      const res = await endpoints.setSubjectCreditsBulk(payload);
      const parts = [`Updated ${res.updated}`];
      if (res.missing?.length) parts.push(`Missing: ${res.missing.length}`);
      if (res.invalid?.length) parts.push(`Invalid: ${res.invalid.length}`);
      setSubjectsMessage(parts.join(' • '));
    } catch (e: any) { setSubjectsError(e?.message || 'Failed to save'); }
    finally { setSubjectsLoading(false); }
  };

  const showResult = (d: any) => { try { return JSON.stringify(d, null, 2); } catch { return String(d); } };

  const handlePurgeCandidate = async () => {
    if (purgeInFlight.current) return;
    setPurgeMessage(null); setPurgeError(null);
    if (!purgeUsn.trim()) { setPurgeError('Enter a USN'); return; }
    if (confirmCandidate.trim().toUpperCase() !== 'DELETE') { setPurgeError('Type DELETE to confirm'); return; }
    purgeInFlight.current = true; setPurgeBusy('candidate');
    try { setPurgeMessage(showResult(await endpoints.purgeCandidate(purgeUsn.trim(), purgeBatch || undefined))); }
    catch (e: any) { setPurgeError(e?.message || 'Failed'); }
    finally { setPurgeBusy(null); purgeInFlight.current = false; }
  };

  const handlePurgeSemester = async () => {
    if (purgeInFlight.current) return;
    setPurgeMessage(null); setPurgeError(null);
    const sem = Number(purgeSem);
    if (!Number.isFinite(sem) || sem <= 0) { setPurgeError('Enter a valid semester'); return; }
    if (confirmSemester.trim().toUpperCase() !== 'DELETE') { setPurgeError('Type DELETE to confirm'); return; }
    purgeInFlight.current = true; setPurgeBusy('semester');
    try { setPurgeMessage(showResult(await endpoints.purgeSemester(sem, purgeBatch || undefined))); }
    catch (e: any) { setPurgeError(e?.message || 'Failed'); }
    finally { setPurgeBusy(null); purgeInFlight.current = false; }
  };

  const handlePurgeAll = async () => {
    if (purgeInFlight.current) return;
    setPurgeMessage(null); setPurgeError(null);
    if (confirmAll.trim().toUpperCase() !== 'DELETE_ALL') { setPurgeError('Type DELETE_ALL to confirm'); return; }
    purgeInFlight.current = true; setPurgeBusy('all');
    try { setPurgeMessage(showResult(await endpoints.purgeAll(purgeBatch || undefined))); }
    catch (e: any) { setPurgeError(e?.message || 'Failed'); }
    finally { setPurgeBusy(null); purgeInFlight.current = false; }
  };

  return (
    <div className="space-y-8">
      {/* API Endpoint */}
      <div>
        <label className={labelCls}>Backend API Endpoint</label>
        <div className="flex gap-3">
          <input type="text" className={inputCls + ' flex-1'} value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            onClick={() => { setApiBaseOverride(url); window.location.reload(); }}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 shrink-0"
          >
            <Save size={16} /> Apply
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Changes require a page reload to take effect.</p>
      </div>

      {/* Subject Credits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className={labelCls}>Subject Credits (CBCS)</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Set credits once per subject (e.g. 4). Use 0 to exclude from GPA.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadSubjects} disabled={subjectsLoading} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-1.5">
              <RefreshCcw size={12} className={subjectsLoading ? 'animate-spin' : ''} /> {subjectsLoading ? 'Loading…' : 'Load'}
            </button>
            <button onClick={saveCredits} disabled={subjectsLoading || subjects.length === 0} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm disabled:opacity-50 flex items-center gap-1.5">
              <Save size={12} /> Save
            </button>
          </div>
        </div>
        {subjectsError && <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold mb-3">{subjectsError}</div>}
        {subjectsMessage && <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3">{subjectsMessage}</div>}
        {subjects.length > 0 && (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 w-28">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {subjects.map((s, i) => (
                  <tr key={s.code}>
                    <td className="px-4 py-2.5 text-xs font-black text-slate-800 dark:text-slate-100">{s.code}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">{s.name}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number" min={0} max={50}
                        className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-200 text-xs"
                        value={s.credits ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSubjects((prev) => {
                            const next = [...prev];
                            const credits = v === '' ? null : Number(v);
                            next[i] = { ...next[i], credits: Number.isFinite(credits) ? credits : null };
                            return next;
                          });
                        }}
                        disabled={subjectsLoading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">Danger Zone</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">These actions cannot be undone.</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg">Irreversible</span>
        </div>

        {/* Batch filter */}
        <div className="p-4 bg-orange-50 dark:bg-orange-900/15 rounded-2xl border border-orange-100 dark:border-orange-800 mb-4">
          <label className="text-xs font-black text-orange-700 dark:text-orange-300 uppercase tracking-widest block mb-2">Active Batch Filter</label>
          <select
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 dark:text-slate-200 text-sm"
            value={purgeBatch} onChange={(e) => setPurgeBatch(e.target.value)} disabled={purgeBusy !== null}
          >
            <option value="">Apply to ALL batches</option>
            {getBatchOptions().map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-2 font-medium italic">Purge actions below will be restricted to this batch if selected.</p>
        </div>

        <div className="space-y-4">
          {/* Purge candidate */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Purge Candidate (USN)</p>
            <div className="grid gap-2.5">
              <input type="text" placeholder="USN (e.g. 1SV24AI037)" className={inputCls} value={purgeUsn} onChange={(e) => setPurgeUsn(e.target.value)} disabled={purgeBusy !== null} />
              <input type="text" placeholder="Type DELETE to confirm" className={inputCls} value={confirmCandidate} onChange={(e) => setConfirmCandidate(e.target.value)} disabled={purgeBusy !== null} />
              <button onClick={handlePurgeCandidate} disabled={purgeBusy !== null} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-sm disabled:opacity-50 hover:bg-rose-700 transition-colors">
                {purgeBusy === 'candidate' ? 'Purging…' : 'Delete Candidate Records'}
              </button>
            </div>
          </div>

          {/* Purge semester */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Purge Semester</p>
            <div className="grid gap-2.5">
              <input type="number" placeholder="Semester number (e.g. 1)" className={inputCls} value={purgeSem} onChange={(e) => setPurgeSem(e.target.value)} disabled={purgeBusy !== null} />
              <input type="text" placeholder="Type DELETE to confirm" className={inputCls} value={confirmSemester} onChange={(e) => setConfirmSemester(e.target.value)} disabled={purgeBusy !== null} />
              <button onClick={handlePurgeSemester} disabled={purgeBusy !== null} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-sm disabled:opacity-50 hover:bg-rose-700 transition-colors">
                {purgeBusy === 'semester' ? 'Purging…' : 'Delete Semester Records'}
              </button>
            </div>
          </div>

          {/* Delete all */}
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800">
            <p className="text-sm font-bold text-rose-800 dark:text-rose-200 mb-1">Delete ALL Records</p>
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300 mb-3">This wipes students, subjects, semesters, results, and upload logs.</p>
            <div className="grid gap-2.5">
              <input type="text" placeholder="Type DELETE_ALL to confirm" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-900 dark:text-white text-sm" value={confirmAll} onChange={(e) => setConfirmAll(e.target.value)} disabled={purgeBusy !== null} />
              <button onClick={handlePurgeAll} disabled={purgeBusy !== null} className="w-full py-3 bg-rose-700 text-white rounded-xl font-bold text-sm shadow-sm disabled:opacity-50 hover:bg-rose-800 transition-colors">
                {purgeBusy === 'all' ? 'Purging…' : 'Delete Everything'}
              </button>
            </div>
          </div>

          {purgeError && <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold">{purgeError}</div>}
          {purgeMessage && <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[10px] overflow-auto max-h-48">{purgeMessage}</pre>}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────*/
const SettingsPage: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
    {/* Page header */}
    <div className="flex items-center gap-4 mb-2">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 shrink-0">
        <Settings size={28} />
      </div>
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Manage appearance, notifications, and advanced configuration.</p>
      </div>
    </div>

    <Section
      id="appearance"
      icon={Sun}
      title="Appearance"
      subtitle="Choose how Auto Marks looks on your device."
      accent="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
    >
      <ThemeSection />
    </Section>

    <Section
      id="notifications"
      icon={Bell}
      title="Notifications"
      subtitle="Recent system events and upload activity."
      accent="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
      collapsible
    >
      <NotificationsSection />
    </Section>

    <Section
      id="advanced"
      icon={LinkIcon}
      title="Advanced"
      subtitle="API configuration, subject credits, and data management."
      accent="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
      collapsible
      defaultOpen={false}
    >
      <AdvancedSection />
    </Section>
  </div>
);

export default SettingsPage;
