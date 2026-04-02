
import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  UploadCloud,
  UserCircle,
  Download,
  Award,
  Users,
  BarChart2,
  Zap,
  Edit2,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  Bell,
  AlertCircle,
  Clock,
  X,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { endpoints, getApiBase } from '../api/client';

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
  return { icon: BarChart2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300', label: 'Info' };
};

/* ─── Stat Card ───────────────────────────────────────────*/
const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="glass-card p-6 rounded-[2rem] shadow-sm flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-indigo-100">
    <div className="flex justify-between items-start">
      <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-lg flex items-center gap-1 uppercase tracking-widest">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none dark:text-slate-400">{title}</h3>
      <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tighter">{value}</p>
    </div>
  </div>
);

/* ─── Overview Tab Content ───────────────────────────────*/
interface SemesterOverviewItem { batch: string; semester: number; total_records: number; total_students: number; avg_total_marks: number; pass_rate: number; }

const OverviewTab: React.FC<{ stats: any; isLoading: boolean; semesterOverview: SemesterOverviewItem[]; totalBatches: number; totalBranches: number }> = ({
  stats, isLoading, semesterOverview, totalBatches, totalBranches
}) => (
  <div className="space-y-8 sm:space-y-10">
    {/* Action Buttons */}
    <div className="flex flex-wrap gap-3 justify-end">
      <Link
        to="/profile?mode=manual"
        className="flex items-center gap-2 bg-white dark:bg-slate-900 text-indigo-600 border-2 border-indigo-100 dark:border-indigo-800 px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-95"
      >
        <Edit2 size={18} /> <span className="text-sm">Manual Entry</span>
      </Link>
      <Link
        to="/upload"
        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
      >
        <UploadCloud size={18} /> <span className="text-sm">Batch Import</span>
      </Link>
    </div>

    {/* Stat Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {isLoading ? (
        [1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-6 rounded-[2rem] animate-pulse">
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          </div>
        ))
      ) : (
        <>
          <StatCard title="Overall Pass Rate" value={`${stats.passRate}%`} icon={CheckCircle2} color="bg-emerald-600" />
          <StatCard title="Average CGPA" value={stats.avgCgpa.toFixed(2)} icon={Award} color="bg-indigo-600" />
          <StatCard title="Total Batches" value={totalBatches.toLocaleString()} icon={BarChart2} color="bg-slate-900" />
          <StatCard title="Total Branches" value={totalBranches.toLocaleString()} icon={Users} color="bg-amber-600" />
        </>
      )}
    </div>

    {/* Semester Overview */}
    <div>
      {isLoading ? (
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-10 space-y-8 animate-pulse">
          <div className="h-8 w-40 bg-slate-100 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-50 rounded-2xl"></div>)}
          </div>
        </div>
      ) : semesterOverview.length === 0 ? (
        <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full mb-4">
            <Zap size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Result Data</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upload results to see analytics.</p>
        </div>
      ) : (
        Object.entries(
          semesterOverview.reduce((acc, curr) => {
            if (!acc[curr.batch]) acc[curr.batch] = [];
            acc[curr.batch].push(curr);
            return acc;
          }, {} as Record<string, SemesterOverviewItem[]>)
        ).sort((a, b) => b[0].localeCompare(a[0])).map(([batch, items]) => (
          <div key={batch} className="glass-card rounded-[2.5rem] p-6 sm:p-10 mb-8 border border-white/50 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Users size={120} /></div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm border border-indigo-100/50">
                Batch {batch}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Semester Performance</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
              {items.sort((a, b) => a.semester - b.semester).map((s) => (
                <div key={s.semester} className="p-5 rounded-[1.75rem] bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Sem {s.semester}</p>
                    <p className={`font-black text-lg tracking-tight ${s.pass_rate >= 80 ? 'text-emerald-600' : s.pass_rate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {Math.round(s.pass_rate)}% <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Pass</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Avg Marks</p>
                      <p className="text-slate-700 dark:text-white font-black text-sm mt-0.5">{s.avg_total_marks.toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Students</p>
                      <p className="text-slate-700 dark:text-white font-black text-sm mt-0.5">{s.total_students.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>

    {/* CTA + Quick Actions */}
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
        <div className="absolute -top-10 -right-10 p-8 opacity-10"><BarChart2 size={160} /></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2 tracking-tight">Data Insights</h3>
          <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-10 opacity-80">
            Explore detailed analytics and performance trends across all semesters.
          </p>
          <Link to="/analytics" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            View Analytics
          </Link>
        </div>
      </div>
      <div className="glass-card rounded-[2.5rem] p-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/profile" className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
            <UserCircle size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Find USN</span>
          </Link>
          <Link to="/export" className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
            <Download size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Settings Tab Content ───────────────────────────────*/
const SettingsTab: React.FC = () => {
  /* Theme */
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'light');
  const applyTheme = (t: string) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
  };

  /* Notifications */
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
          if (msg?.type === 'notification' && msg?.data?.id)
            setNotifications((prev) => [msg.data as UiNotification, ...prev.filter((n) => n.id !== msg.data.id)].slice(0, 100));
          if (msg?.type === 'notification_cleared' && msg?.id)
            setNotifications((prev) => prev.filter((n) => n.id !== Number(msg.id)));
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

  const themeOptions = [
    { value: 'light', label: 'Light Mode', icon: Sun, desc: 'Bright and clean interface' },
    { value: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Easy on the eyes at night' },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* ── Appearance ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sun size={20} />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-base leading-tight">Appearance</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Choose how Auto Marks looks.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themeOptions.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              id={`theme-btn-${value}`}
              onClick={() => applyTheme(value)}
              className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                theme === value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                theme === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
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
      </div>

      {/* ── Notifications ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm p-7">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white text-base leading-tight">Notifications</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {loading ? 'Loading…' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors"
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <Bell size={24} />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
            <p className="text-sm text-slate-400 font-medium mt-1">No notifications right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
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
        )}
      </div>
    </div>
  );
};

/* ─── Main Dashboard ──────────────────────────────────────*/
const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [stats, setStats] = useState({ passRate: 0, avgCgpa: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [semesterOverview, setSemesterOverview] = useState<SemesterOverviewItem[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  useEffect(() => {
    endpoints.getBranches(undefined).then((r) => setBranches(r || [])).catch(() => setBranches([]));
    endpoints.getBatches().then((r) => setBatches(r || [])).catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([endpoints.getOverallStatistics(undefined), endpoints.getSemesterOverview(undefined)])
      .then(([overall, overview]) => {
        setStats({ passRate: Math.round(overall.pass_rate), avgCgpa: overall.average_cgpa });
        setSemesterOverview(overview);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base mt-1">
          {activeTab === 'overview' ? 'Holistic performance metrics across all university departments.' : 'Manage appearance and notifications.'}
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`dashboard-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === id
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Pages */}
      {activeTab === 'overview' ? (
        <OverviewTab
          stats={stats}
          isLoading={isLoading}
          semesterOverview={semesterOverview}
          totalBatches={batches.length}
          totalBranches={branches.length}
        />
      ) : (
        <SettingsTab />
      )}
    </div>
  );
};

export default Dashboard;
