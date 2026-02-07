
import React, { useState, useEffect, useRef } from 'react';
import {
  HashRouter,
  MemoryRouter,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  UserCircle,
  BarChart3,
  Download,
  Menu,
  X,
  Bell,
  ChevronRight,
  Settings,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { endpoints, getApiBase, setApiBaseOverride } from './api/client';

// Pages
import Dashboard from './features/Dashboard';
import UploadPage from './features/UploadPage';
import ResultsExplorer from './features/ResultsExplorer';
import StudentProfile from './features/StudentProfile';
import Analytics from './features/Analytics';
import ExportPage from './features/ExportPage';
import { getBatchOptions } from './utils/batches';

const isBlobEnvironment = window.location.protocol === 'blob:';

const SidebarLink = ({ to, icon: Icon, label, active, onClick }: any) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
      : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'
      }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
    <span className="font-semibold text-sm">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </Link>
);

type UiNotification = { id: number; title: string; detail?: string | null; level: string; created_at?: string | null };

const NotificationDropdown = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

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
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const mapLevel = (level: string) => {
    const l = (level || '').toLowerCase();
    if (l === 'success') return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (l === 'warning') return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' };
    if (l === 'error') return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' };
    return { icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50' };
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);
    endpoints
      .getNotifications(50)
      .then((res) => {
        if (!cancelled) setNotifications(res || []);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const wsUrl = getApiBase().replace('http', 'ws') + '/ws/notifications';
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === 'notification' && msg?.data?.id) {
          setNotifications((prev) => {
            const next = [msg.data as UiNotification, ...prev.filter((n) => n.id !== msg.data.id)];
            return next.slice(0, 50);
          });
        }
        if (msg?.type === 'notification_cleared' && msg?.id) {
          setNotifications((prev) => prev.filter((n) => n.id !== Number(msg.id)));
        }
      } catch {
        // ignore bad frames
      }
    };
    wsRef.current = ws;

    return () => {
      cancelled = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };
  }, [isOpen]);

  const handleClearAll = async () => {
    try {
      await endpoints.clearNotifications();
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  };

  const handleDismissOne = async (id: number) => {
    // Optimistic UI
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await endpoints.clearNotification(id);
    } catch (e) {
      // If API fails, refetch for consistency
      try {
        const res = await endpoints.getNotifications(50);
        setNotifications(res || []);
      } catch {
        // ignore
      }
      console.error('Failed to clear notification', e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h4 className="font-bold text-slate-900">Notifications</h4>
          {notifications.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">
              {notifications.length} New
            </span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-sm text-slate-400 font-medium">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-sm text-slate-400 font-medium">No notifications</div>
          ) : (
            notifications.map((n) => {
              const m = mapLevel(n.level);
              const Icon = m.icon;
              return (
                <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 border-b border-slate-50 last:border-0 cursor-pointer">
                  <div className={`shrink-0 w-11 h-11 rounded-2xl ${m.bg} flex items-center justify-center ${m.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{n.title}</p>
                    {n.detail ? <p className="text-[11px] text-slate-500 mt-1 font-medium leading-snug">{n.detail}</p> : null}
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                      <Clock size={12} /> {formatAgo(n.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDismissOne(n.id);
                    }}
                    className="shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    aria-label="Dismiss notification"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="p-3 bg-slate-50/50 border-t border-slate-50">
          <button
            onClick={handleClearAll}
            className="w-full py-2.5 text-center text-[11px] font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            Clear all
          </button>
        </div>
      </div>
    </>
  );
};

const ApiSettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [url, setUrl] = useState(getApiBase());
  const [subjects, setSubjects] = useState<Array<{ code: string; name: string; credits?: number | null }>>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [subjectsMessage, setSubjectsMessage] = useState<string | null>(null);
  const [purgeUsn, setPurgeUsn] = useState('');
  const [purgeSem, setPurgeSem] = useState('');
  const [confirmCandidate, setConfirmCandidate] = useState('');
  const [confirmSemester, setConfirmSemester] = useState('');
  const [confirmAll, setConfirmAll] = useState('');
  const [purgeBatch, setPurgeBatch] = useState('');
  const [purgeBusy, setPurgeBusy] = useState<null | 'candidate' | 'semester' | 'all'>(null);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const purgeInFlightRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setPurgeMessage(null);
    setPurgeError(null);
    setSubjectsError(null);
    setSubjectsMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const loadSubjects = async () => {
    if (subjectsLoading) return;
    setSubjectsError(null);
    setSubjectsMessage(null);
    setSubjectsLoading(true);
    try {
      const res = await endpoints.getSubjectsWithCredits();
      setSubjects(res || []);
    } catch (e: any) {
      setSubjects([]);
      setSubjectsError(e?.message || 'Failed to load subjects');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const saveCredits = async () => {
    if (subjectsLoading) return;
    setSubjectsError(null);
    setSubjectsMessage(null);
    setSubjectsLoading(true);
    try {
      const payload = (subjects || []).map((s) => ({
        code: s.code,
        credits: s.credits === undefined ? null : s.credits,
      }));
      const res = await endpoints.setSubjectCreditsBulk(payload);
      const parts: string[] = [];
      parts.push(`Updated ${res.updated}`);
      if (res.missing?.length) parts.push(`Missing: ${res.missing.length}`);
      if (res.invalid?.length) parts.push(`Invalid: ${res.invalid.length}`);
      setSubjectsMessage(parts.join(' • '));
    } catch (e: any) {
      setSubjectsError(e?.message || 'Failed to save credits');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const showResult = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const handlePurgeCandidate = async () => {
    if (purgeInFlightRef.current) return;
    setPurgeMessage(null);
    setPurgeError(null);
    const usn = purgeUsn.trim();
    if (!usn) {
      setPurgeError('Enter a USN');
      return;
    }
    if (confirmCandidate.trim().toUpperCase() !== 'DELETE') {
      setPurgeError('Type DELETE to confirm candidate purge');
      return;
    }

    purgeInFlightRef.current = true;
    setPurgeBusy('candidate');
    try {
      const res = await endpoints.purgeCandidate(usn, purgeBatch || undefined);
      setPurgeMessage(showResult(res));
    } catch (e: any) {
      setPurgeError(e?.message || 'Failed to purge candidate');
    } finally {
      setPurgeBusy(null);
      purgeInFlightRef.current = false;
    }
  };

  const handlePurgeSemester = async () => {
    if (purgeInFlightRef.current) return;
    setPurgeMessage(null);
    setPurgeError(null);
    const sem = Number(purgeSem);
    if (!Number.isFinite(sem) || sem <= 0) {
      setPurgeError('Enter a valid semester number');
      return;
    }
    if (confirmSemester.trim().toUpperCase() !== 'DELETE') {
      setPurgeError('Type DELETE to confirm semester purge');
      return;
    }

    purgeInFlightRef.current = true;
    setPurgeBusy('semester');
    try {
      const res = await endpoints.purgeSemester(sem, purgeBatch || undefined);
      setPurgeMessage(showResult(res));
    } catch (e: any) {
      setPurgeError(e?.message || 'Failed to purge semester');
    } finally {
      setPurgeBusy(null);
      purgeInFlightRef.current = false;
    }
  };

  const handlePurgeAll = async () => {
    if (purgeInFlightRef.current) return;
    setPurgeMessage(null);
    setPurgeError(null);
    if (confirmAll.trim().toUpperCase() !== 'DELETE_ALL') {
      setPurgeError('Type DELETE_ALL to confirm full wipe');
      return;
    }

    purgeInFlightRef.current = true;
    setPurgeBusy('all');
    try {
      const res = await endpoints.purgeAll(purgeBatch || undefined);
      setPurgeMessage(showResult(res));
    } catch (e: any) {
      setPurgeError(e?.message || 'Failed to purge all records');
    } finally {
      setPurgeBusy(null);
      purgeInFlightRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Globe size={24} /></div>
            <h3 className="text-xl font-bold text-slate-900">API Connection</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-8 py-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Endpoint URL</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
              <button onClick={() => { setApiBaseOverride(url); window.location.reload(); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Apply</button>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Subject Credits (CBCS)</h4>
                <div className="flex gap-2">
                  <button
                    onClick={loadSubjects}
                    disabled={subjectsLoading}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {subjectsLoading ? 'Loading…' : 'Load'}
                  </button>
                  <button
                    onClick={saveCredits}
                    disabled={subjectsLoading || subjects.length === 0}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed">
                Set credits once per subject (e.g., 4). Use 0 to exclude a subject from GPA.
              </p>

              {subjectsError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold">
                  {subjectsError}
                </div>
              )}
              {subjectsMessage && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold">
                  {subjectsMessage}
                </div>
              )}

              {subjects.length > 0 && (
                <div className="mt-4 max-h-72 overflow-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 w-24">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {subjects.map((s, i) => (
                        <tr key={s.code}>
                          <td className="px-4 py-3 text-xs font-black text-slate-800">{s.code}</td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-600">{s.name}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              max={50}
                              className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-xs"
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

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Danger Zone</h4>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">Irreversible</span>
              </div>

              <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <label className="text-xs font-black text-orange-700 uppercase tracking-widest block mb-2">Active Batch Filter</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700"
                  value={purgeBatch}
                  onChange={(e) => setPurgeBatch(e.target.value)}
                  disabled={purgeBusy !== null}
                >
                  <option value="">Apply to ALL batches</option>
                  {getBatchOptions().map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <p className="text-[10px] text-orange-600 mt-2 font-medium italic">Purge actions below will be restricted to this batch if selected.</p>
              </div>

              <div className="mt-4 space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">Purge Candidate (USN)</p>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      placeholder="USN (e.g., 1SV24AI037)"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                      value={purgeUsn}
                      onChange={(e) => setPurgeUsn(e.target.value)}
                      disabled={purgeBusy !== null}
                    />
                    <input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                      value={confirmCandidate}
                      onChange={(e) => setConfirmCandidate(e.target.value)}
                      disabled={purgeBusy !== null}
                    />
                    <button
                      onClick={handlePurgeCandidate}
                      disabled={purgeBusy !== null}
                      className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                    >
                      {purgeBusy === 'candidate' ? 'Purging…' : 'Delete Candidate Records'}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">Purge Semester</p>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <input
                      type="number"
                      placeholder="Semester number (e.g., 1)"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                      value={purgeSem}
                      onChange={(e) => setPurgeSem(e.target.value)}
                      disabled={purgeBusy !== null}
                    />
                    <input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                      value={confirmSemester}
                      onChange={(e) => setConfirmSemester(e.target.value)}
                      disabled={purgeBusy !== null}
                    />
                    <button
                      onClick={handlePurgeSemester}
                      disabled={purgeBusy !== null}
                      className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                    >
                      {purgeBusy === 'semester' ? 'Purging…' : 'Delete Semester Records'}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-sm font-bold text-rose-800">Delete ALL Records</p>
                  <p className="text-[11px] font-medium text-rose-700 mt-1">This wipes students, subjects, semesters, results, and upload logs.</p>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      placeholder="Type DELETE_ALL to confirm"
                      className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                      value={confirmAll}
                      onChange={(e) => setConfirmAll(e.target.value)}
                      disabled={purgeBusy !== null}
                    />
                    <button
                      onClick={handlePurgeAll}
                      disabled={purgeBusy !== null}
                      className="w-full py-3 bg-rose-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                    >
                      {purgeBusy === 'all' ? 'Purging…' : 'Delete Everything'}
                    </button>
                  </div>
                </div>

                {purgeError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold">
                    {purgeError}
                  </div>
                )}

                {purgeMessage && (
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[10px] overflow-auto max-h-48">
                    {purgeMessage}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/upload', icon: UploadCloud, label: 'Upload Portal' },
    { to: '/results', icon: FileSearch, label: 'Explorer' },
    { to: '/profile', icon: UserCircle, label: 'Student Profile' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/export', icon: Download, label: 'Exports' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      <ApiSettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Strictly 64w on Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">V</div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">VTU <span className="text-indigo-600">Insight</span></h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                active={location.pathname === item.to}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-6">
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all group"
            >
              <Settings size={18} />
              <span className="font-bold text-xs uppercase tracking-widest">Config</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 md:hidden">
              {navItems.find(i => i.to === location.pathname)?.label || 'VTU Insight'}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-xl transition-all relative ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
              </button>
              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">Registrar</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Administrator</p>
              </div>
              <img
                src="/student-avatar.svg"
                alt="Avatar"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 bg-white shadow-sm object-cover"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/results" element={<ResultsExplorer />} />
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/export" element={<ExportPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const RouterComponent = isBlobEnvironment ? MemoryRouter : HashRouter;
  return (
    <RouterComponent>
      <AppLayout />
    </RouterComponent>
  );
}
