
import React, { useState, useEffect } from 'react';
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
  Edit2
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
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-lg flex items-center gap-1 uppercase tracking-widest">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none dark:text-white">{title}</h3>
      <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tighter">{value}</p>
    </div>
  </div>
);



interface SemesterOverviewItem {
  batch: string;
  semester: number;
  total_records: number;
  total_students: number;
  avg_total_marks: number;
  pass_rate: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    passRate: 0,
    avgCgpa: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const [semesterOverview, setSemesterOverview] = useState<SemesterOverviewItem[]>([]);

  const [branches, setBranches] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  // State for manual entry modal - reusing logic from StudentProfile would be ideal, 
  // but for now we can redirect or show a simplified trigger.
  // Actually, let's toggle a state that we might pass to a modal if we had one global,
  // but since the Manual Entry logic is inside StudentProfile, we might just link to it 
  // or duplicate the modal state here if the user wants it ON Dashboard.
  // Given the request "i cannot see manual entry button on dashboard", let's add a button 
  // that links to the profile page with a query param or state to open the modal, 
  // OR strictly implement a button that opens the modal here.
  // Re-implementing the modal here would be duplication. 
  // A better approach: The "Manual Entry" feature is heavily tied to Student Profile creation.
  // Let's add a direct button that navigates to `/profile?action=manual_entry`.
  // AND/OR we can lift the state up, but for now let's guide the user to the profile page 
  // where the feature resides, or render the StudentProfile component in a hidden way? No.

  // Simplest and most robust: Add a button that says "Manual Entry" which goes to the profile page
  // and automatically opens the modal. We need to handle that in StudentProfile.

  // HOWEVER, the user asked to "Add a manual entry system...".
  // If we want it ON the dashboard, we should probably add the button here.

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
          endpoints.getSemesterOverview(undefined)
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
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Academic Oversight</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base mt-1">Holistic performance metrics across all university departments.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/profile?mode=manual"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100 px-6 py-4 sm:py-3.5 rounded-2xl font-bold hover:bg-indigo-50 dark:bg-indigo-900/20 transition-all active:scale-95"
          >
            <Edit2 size={20} /> <span className="text-sm">Manual Entry</span>
          </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Semester Overview Grouped by Batch */}
          {isLoading ? (
            <div className="glass-card rounded-[2.5rem] p-6 sm:p-10 space-y-8 animate-pulse">
              <div className="h-8 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-50 dark:bg-slate-800 rounded-2xl"></div>)}
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
            // Group by batch and render
            Object.entries(semesterOverview.reduce((acc, curr) => {
              if (!acc[curr.batch]) acc[curr.batch] = [];
              acc[curr.batch].push(curr);
              return acc;
            }, {} as Record<string, SemesterOverviewItem[]>)).sort((a, b) => b[0].localeCompare(a[0])).map(([batch, items]: [string, SemesterOverviewItem[]]) => (
              <div key={batch} className="glass-card rounded-[2.5rem] p-6 sm:p-10 mb-8 border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Users size={120} />
                </div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm border border-indigo-100/50">
                    Batch {batch}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Semester Performance</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
                  {items.sort((a, b) => a.semester - b.semester).map((s) => (
                    <div key={s.semester} className="p-5 rounded-[1.75rem] bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors shadow-sm group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Sem {s.semester}</p>
                        <p className={`font-black text-lg tracking-tight ${s.pass_rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : s.pass_rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {Math.round(s.pass_rate)}% <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Pass</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                          <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Avg Marks</p>
                          <p className="text-slate-700 dark:text-white font-black text-sm mt-0.5">{s.avg_total_marks.toFixed(1)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
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
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
          <div className="absolute -top-10 -right-10 p-8 opacity-10">
            <BarChart2 size={160} />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 tracking-tight dark:text-white">Data Insights</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-10 opacity-80">
              Explore detailed analytics and performance trends across all semesters.
            </p>
            <Link to="/analytics" className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              View Analytics
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/profile" className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:bg-indigo-900/20 hover:text-indigo-600 dark:text-indigo-400 transition-all group">
              <UserCircle size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest">Find USN</span>
            </Link>
            <Link to="/export" className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:bg-indigo-900/20 hover:text-indigo-600 dark:text-indigo-400 transition-all group">
              <Download size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

