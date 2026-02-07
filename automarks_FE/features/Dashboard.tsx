
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  UploadCloud,
  UserCircle,
  Download,
  Award,
  Users,
  BarChart2,
  Zap,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/client';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="glass-card p-6 rounded-[2rem] shadow-sm flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-indigo-100">
    <div className="flex justify-between items-start">
      <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg flex items-center gap-1 uppercase tracking-widest">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none">{title}</h3>
      <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    passRate: 0,
    avgCgpa: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const [semesterOverview, setSemesterOverview] = useState<
    Array<{ semester: number; total_records: number; total_students: number; avg_total_marks: number; pass_rate: number }>
  >([]);

  const [branches, setBranches] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [branchRes, batchRes] = await Promise.all([
          endpoints.getBranches(undefined),
          endpoints.getBatches(),
        ]);
        setBranches(branchRes);
        setBatches(batchRes);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        setBranches([]);
        setBatches([]);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [overallStats, overview] = await Promise.all([
          endpoints.getOverallStatistics(undefined),
          endpoints.getSemesterOverview(undefined),
        ]);

        setStats({
          passRate: Math.round(overallStats.pass_rate),
          avgCgpa: overallStats.average_cgpa,
        });

        setSemesterOverview(overview);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Keep previous values on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalBatches = batches.length;
  const totalBranches = branches.length;

  const overviewGridClass = (() => {
    const n = semesterOverview.length;
    if (n <= 1) return 'grid-cols-1';
    if (n === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (n === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
  })();

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Academic Oversight</h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Holistic performance metrics across all university departments.</p>
        </div>
        <div className="flex">
          <Link
            to="/upload"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 sm:py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <UploadCloud size={20} /> <span className="text-sm">Batch Import</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-6 rounded-[2rem] animate-pulse">
              <div className="h-20 bg-slate-100 rounded-xl"></div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-6 sm:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Semester Overview</h3>
            </div>
            <Link to="/analytics" className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline hidden sm:block">Details</Link>
          </div>

          {isLoading ? (
            <div className="w-full h-[240px] bg-slate-50/50 rounded-2xl animate-pulse" />
          ) : semesterOverview.length === 0 ? (
            <div className="w-full h-[240px] bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-sm">
              No data for current filters
            </div>
          ) : (
            <div className={`grid ${overviewGridClass} gap-4`}>
              {semesterOverview.map((s) => (
                <div key={s.semester} className="p-5 rounded-[1.75rem] bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Semester {s.semester}</p>
                  <p className="text-slate-900 font-black text-2xl tracking-tight mt-2">{Math.round(s.pass_rate)}%</p>
                  <p className="text-slate-500 font-bold text-xs mt-1">Pass Rate</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-100 p-3">
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Avg</p>
                      <p className="text-slate-900 font-black text-sm mt-1">{s.avg_total_marks.toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-3">
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Students</p>
                      <p className="text-slate-900 font-black text-sm mt-1">{s.total_students.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
            <div className="absolute -top-10 -right-10 p-8 opacity-10">
              <BarChart2 size={160} />
            </div>
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
              <Link to="/profile" className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-3 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                <UserCircle size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Find USN</span>
              </Link>
              <Link to="/export" className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-3 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                <Download size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

