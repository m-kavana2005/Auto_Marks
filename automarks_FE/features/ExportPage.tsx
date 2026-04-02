
import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Settings,
  ShieldCheck,
  Check
} from 'lucide-react';
import { endpoints } from '../api/client';
import { getBatchOptions } from '../utils/batches';

const ExportPage: React.FC = () => {
  const [semester, setSemester] = useState<number | ''>('');
  const [batch, setBatch] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [branches, setBranches] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch branches whenever batch changes
  useEffect(() => {
    setBranch('');
    if (batch) {
      endpoints.getBranches(batch)
        .then((res) => setBranches(res || []))
        .catch(() => setBranches([]));
    } else {
      setBranches([]);
    }
  }, [batch]);

  const handleExport = (format: 'excel' | 'csv') => {
    setIsExporting(true);
    const url = endpoints.exportUrl(format, {
      semester: semester === '' ? undefined : semester,
      batch: batch || undefined,
      branch: branch || undefined,
    });

    try {
      const link = document.createElement('a');
      link.href = url;
      const filename = `vtu_export_${format}_sem${semester || 'all'}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export download failed:", e);
      window.open(url, '_blank');
    }

    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Data Export Hub</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Extract processed results for offline reporting and integration.</p>
      </div>

      {/* â”€â”€ Shared Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Batch</label>
          <select
<<<<<<< HEAD
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
=======
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700"
>>>>>>> cff7087d21966a6ce19187e87fbbe2e34e665847
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            disabled={isExporting}
          >
            <option value="">All Batches</option>
            {getBatchOptions().map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Branch</label>
          <select
<<<<<<< HEAD
            className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${!batch ? 'opacity-50 cursor-not-allowed' : ''}`}
=======
            className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white ${!batch ? 'opacity-50 cursor-not-allowed' : ''}`}
>>>>>>> cff7087d21966a6ce19187e87fbbe2e34e665847
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={isExporting || !batch}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {!batch && (
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Select a batch first to filter by branch.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="glass-card p-8 sm:p-10 rounded-[2.5rem] flex flex-col">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8 shadow-sm">
            <FileSpreadsheet size={32} />
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Excel Export</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
              Formatted workbook with color-coded pass/fail rows.
            </p>
          </div>

<<<<<<< HEAD
          <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl space-y-4 mb-8 border border-slate-100 dark:border-slate-700">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Semester</label>
            <select
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
=======
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4 mb-8 border border-slate-100 dark:border-slate-800/50">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Semester</label>
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:bg-slate-800 dark:border-slate-700"
>>>>>>> cff7087d21966a6ce19187e87fbbe2e34e665847
              value={semester}
              onChange={(e) => setSemester(e.target.value === '' ? '' : parseInt(e.target.value))}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="mt-auto w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
          >
            <Download size={20} className="group-hover:translate-y-1 transition-transform" />
            <span>Download Excel</span>
          </button>
        </div>

        <div className="glass-card p-8 sm:p-10 rounded-[2.5rem] flex flex-col">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white mb-8 shadow-sm">
            <FileText size={32} />
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">CSV Export</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
              Simple CSV with Overall_Result column (PASS/FAIL).
            </p>
          </div>

<<<<<<< HEAD
          <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl space-y-4 mb-8 border border-slate-100 dark:border-slate-700">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Semester</label>
            <select
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-slate-500 transition-all"
=======
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4 mb-8 border border-slate-100 dark:border-slate-800/50">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Semester</label>
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-slate-500 transition-all dark:bg-slate-800 dark:border-slate-700"
>>>>>>> cff7087d21966a6ce19187e87fbbe2e34e665847
              value={semester}
              onChange={(e) => setSemester(e.target.value === '' ? '' : parseInt(e.target.value))}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="mt-auto w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
          >
            <Download size={20} className="group-hover:translate-y-1 transition-transform" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;


