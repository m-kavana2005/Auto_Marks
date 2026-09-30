
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Zap, LayoutDashboard } from 'lucide-react';
import { endpoints } from '../api/client';

interface DisciplineSummaryRow {
  discipline: string;
  semester: number;
  appeared: number;
  passed: number;
  failed: number;
  passPercent: number;
}

const Dashboard: React.FC = () => {
  const [batches, setBatches] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [rows, setRows] = useState<DisciplineSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    endpoints.getBatches().then((r) => setBatches(r || [])).catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    endpoints.getBranches(selectedBatch || undefined)
      .then((r) => setBranches(r || []))
      .catch(() => setBranches([]));

    endpoints.getSemesters(selectedBatch || undefined, undefined)
      .then((r) => setSemesters(r || []))
      .catch(() => setSemesters([]));

    setSelectedSemester('');
  }, [selectedBatch]);

  useEffect(() => {
    if (!selectedSemester) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    if (branches.length === 0) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all(
      branches.map(async (branch) => {
        const res = await endpoints.getResultMatrix({
          semester: Number(selectedSemester),
          batch: selectedBatch || undefined,
          branch: branch || undefined,
        });

        const appeared = res.summary.total_students;
        const passed = res.summary.passed;
        const failed = res.summary.failed;
        const passPercent = appeared > 0 ? (passed / appeared) * 100 : 0;

        return {
          discipline: branch,
          semester: Number(selectedSemester),
          appeared,
          passed,
          failed,
          passPercent,
        };
      })
    )
      .then((summaryRows) => {
        const sorted = summaryRows.sort((a, b) => a.discipline.localeCompare(b.discipline));
        setRows(sorted);
      })
      .catch(() => setRows([]))
      .finally(() => setIsLoading(false));
  }, [branches, selectedBatch, selectedSemester]);

  const totalAppeared = rows.reduce((sum, row) => sum + row.appeared, 0);
  const totalPassed = rows.reduce((sum, row) => sum + row.passed, 0);
  const totalFailed = rows.reduce((sum, row) => sum + row.failed, 0);
  const overallPass = totalAppeared > 0 ? (totalPassed / totalAppeared) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="rounded-[2rem] bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-5 shadow-sm border border-amber-100 dark:border-slate-800">
        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-rose-600 to-violet-700 dark:from-amber-300 dark:via-rose-300 dark:to-violet-300 tracking-tight">Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base mt-1">
          Branch-wise semester pass summary
        </p>
      </div>

      <div className="rounded-[2rem] border border-amber-200 dark:border-slate-800 bg-gradient-to-r from-white to-amber-50 dark:from-slate-900 dark:to-slate-900 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Batch</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none shadow-sm appearance-none"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Semester</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none shadow-sm appearance-none"
            >
              <option value="">Select Semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={String(semester)}>Semester {semester}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-[2rem] border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 animate-pulse">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Zap size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No Result Data</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a batch and semester to generate the table.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gradient-to-r from-amber-100 via-rose-100 to-orange-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-amber-900 dark:text-amber-100">Sl. No.</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-rose-900 dark:text-rose-100">Discipline</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-violet-900 dark:text-violet-100">Sem</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900 dark:text-emerald-100">Number of Students Appeared</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-sky-900 dark:text-sky-100">Number of Students Passed in All Subjects</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-orange-900 dark:text-orange-100">Number of Students Failed</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-teal-900 dark:text-teal-100">% of Pass (B/A × 100)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.discipline}-${row.semester}`} className="border-t border-slate-100 dark:border-slate-800 hover:bg-gradient-to-r hover:from-amber-50 hover:to-rose-50 dark:hover:from-slate-800/70 dark:hover:to-slate-800/90">
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-200">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-extrabold text-black dark:text-white">{row.discipline}</td>
                    <td className="px-4 py-3 text-sm font-bold text-violet-700 dark:text-violet-200">{row.semester}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{row.appeared}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-sky-700 dark:text-sky-300">{row.passed}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-orange-700 dark:text-orange-300">{row.failed}</td>
                    <td className="px-4 py-3 text-sm font-black text-teal-700 dark:text-teal-300">{row.passPercent.toFixed(2)}</td>
                  </tr>
                ))}

                <tr className="border-t-2 border-amber-400 dark:border-amber-600 bg-gradient-to-r from-amber-100 via-rose-50 to-orange-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
                  <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">TOTAL</td>
                  <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white"></td>
                  <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white"></td>
                  <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">{totalAppeared}</td>
                  <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">{totalPassed}</td>
                  <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">{totalFailed}</td>
                  <td className="px-4 py-3 text-sm font-black text-emerald-600">{overallPass.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
