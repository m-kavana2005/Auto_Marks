import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Activity, 
  Trash2, 
  UserMinus, 
  UserPlus, 
  Search,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  Database,
  CloudUpload
} from 'lucide-react';

interface AdminStats {
  total_students: number;
  total_results: number;
  total_uploads: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await apiFetch<AdminStats>('/admin/stats');
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <ShieldAlert size={12} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Monitor track metrics and manage system resources</p>
        </div>
        <Button onClick={fetchData} variant="outline" rightIcon={Activity} size="sm">
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={GraduationCap} label="Students" value={stats?.total_students || 0} color="blue" />
        <StatCard icon={Database} label="Results" value={stats?.total_results || 0} color="amber" />
        <StatCard icon={CloudUpload} label="Uploads" value={stats?.total_uploads || 0} color="purple" />
      </div>

      <div className="grid xl:grid-cols-2 gap-8">
        <div className="bg-slate-900 dark:bg-indigo-950 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-500/20">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <ShieldAlert className="text-rose-400" />
            Critical Actions
          </h3>
          <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
            Management of database state. These actions are irreversible and will affect all student data.
          </p>
          <div className="space-y-3">
            <Button 
              className="w-full bg-white/10 hover:bg-white/20 border-white/5 justify-between text-xs py-5 rounded-2xl" 
              variant="outline"
              rightIcon={ArrowUpRight}
            >
              Audit System Logs
            </Button>
            <Button 
              className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/20 justify-between text-xs py-5 rounded-2xl" 
              variant="outline"
              rightIcon={Trash2}
            >
              Manage Data Purge
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Database Health</h3>
          <div className="space-y-6">
            <HealthBar label="PDF Parser" progress={98.5} color="bg-indigo-500" />
            <HealthBar label="Storage" progress={42} color="bg-amber-500" />
            <HealthBar label="API Response" progress={100} color="bg-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 ring-indigo-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 ring-emerald-500/20',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 ring-rose-500/20',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 ring-blue-500/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 ring-amber-500/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 ring-purple-500/20',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col group hover:-translate-y-1 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
        {value.toLocaleString()}
      </p>
    </div>
  );
};

const HealthBar = ({ label, progress, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-black text-slate-900 dark:text-white">{progress.toFixed(1)}%</span>
    </div>
    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
    </div>
  </div>
);

export default AdminDashboard;
