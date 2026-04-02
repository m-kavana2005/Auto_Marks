
import React, { useState, useEffect } from 'react';
import {
  Download,
  WifiOff,
  RefreshCcw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { endpoints, getApiBase } from '../api/client';
import { ResultMatrix } from '../types';

const ResultsExplorer: React.FC = () => {
  const [matrix, setMatrix] = useState<ResultMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Meta options
  const [batches, setBatches] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);

  const [filters, setFilters] = useState({
    batch: '' as string,
    branch: '' as string,
    semester: '' as string | number,
    usn: '',
    status: '' as '' | 'pass' | 'fail',  // '' = show all
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await endpoints.getResultMatrix({
        batch: filters.batch || undefined,
        branch: filters.branch || undefined,
        semester: filters.semester ? Number(filters.semester) : undefined,
      });
      setMatrix(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while fetching results.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load & Dependencies
  useEffect(() => {
    endpoints.getBatches().then((res) => setBatches(res || [])).catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    if (filters.batch) {
      endpoints.getBranches(filters.batch).then((res) => setBranches(res || [])).catch(() => setBranches([]));
      endpoints.getSemesters(filters.batch, filters.branch || undefined).then((res) => setSemesters(res || [])).catch(() => setSemesters([]));
    } else {
      setBranches([]);
      setSemesters([]);
    }
  }, [filters.batch, filters.branch]);

  useEffect(() => {
    // Configurable: Fetch on any filter change or wait for manual sync?
    // For typical "Explorer", auto-fetch is better UX if dataset isn't massive.
    fetchData();
  }, [filters.batch, filters.branch, filters.semester]);


  const handleExport = () => {
    const exportParams: any = {};
    if (filters.batch) exportParams.batch = filters.batch;
    if (filters.branch) exportParams.branch = filters.branch;
    if (filters.semester) exportParams.semester = filters.semester;

    // Using existing export endpoint which might support matrix format or raw
    // Ideally backend should support format='excel-matrix'. 
    // For now using default excel export.
    const url = endpoints.exportUrl('excel', exportParams);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `results_matrix.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Data (client-side: USN/Name search + Pass/Fail status)
  const filteredData = (matrix?.data || []).filter(d => {
    const matchSearch =
      d.usn.toLowerCase().includes(filters.usn.toLowerCase()) ||
      d.name.toLowerCase().includes(filters.usn.toLowerCase());
    const matchStatus =
      !filters.status ||
      (filters.status === 'pass' && d.result === 'PASS') ||
      (filters.status === 'fail' && d.result === 'FAIL');
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Results Matrix</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Comprehensive view of student performance across all subjects.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:bg-slate-800 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Sync
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {matrix && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Students</p>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{matrix.summary.total_students}</p>
            </div>
            <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users size={24} />
            </div>
          </div>
          {/* Passed card — click to filter */}
          <button
            onClick={() => setFilters(f => ({ ...f, status: f.status === 'pass' ? '' : 'pass' }))}
            className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all text-left w-full ${filters.status === 'pass'
              ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-700 dark:border-emerald-700'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:hover:bg-emerald-900/30'
              }`}
          >
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider ${filters.status === 'pass' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400/60'
                }`}>Passed All</p>
              <p className={`text-3xl font-black mt-1 ${filters.status === 'pass' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                }`}>{matrix.summary.passed}</p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${filters.status === 'pass' ? 'bg-emerald-50 dark:bg-emerald-500/100 text-white' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
              <CheckCircle size={24} />
            </div>
          </button>
          {/* Failed card — click to filter */}
          <button
            onClick={() => setFilters(f => ({ ...f, status: f.status === 'fail' ? '' : 'fail' }))}
            className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all text-left w-full ${filters.status === 'fail'
              ? 'bg-rose-600 border-rose-600 text-white dark:bg-rose-700 dark:border-rose-700'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:bg-rose-500/10 dark:hover:bg-rose-900/30'
              }`}
          >
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider ${filters.status === 'fail' ? 'text-rose-100' : 'text-rose-600 dark:text-rose-400/60'
                }`}>Failed ≥1 Subject</p>
              <p className={`text-3xl font-black mt-1 ${filters.status === 'fail' ? 'text-white' : 'text-rose-600 dark:text-rose-400'
                }`}>{matrix.summary.failed}</p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${filters.status === 'fail' ? 'bg-rose-50 dark:bg-rose-500/100 text-white' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
              <XCircle size={24} />
            </div>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap items-end gap-3">
        <div className="w-full md:w-48">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">Batch</label>
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
            value={filters.batch}
            onChange={e => setFilters(f => ({ ...f, batch: e.target.value, branch: '', semester: '' }))}
          >
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="w-full md:w-40">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">Branch</label>
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700"
            value={filters.branch}
            onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}
            disabled={!filters.batch || branches.length === 0}
          >
            <option value="">{!filters.batch ? 'Select batch first' : 'All Branches'}</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="w-full md:w-32">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">Semester</label>
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700"
            value={filters.semester}
            onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
            disabled={!filters.batch || semesters.length === 0}
          >
            <option value="">{!filters.batch ? 'Select batch first' : 'All'}</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">Search Student</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by Name or USN..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 placeholder:font-medium"
              value={filters.usn}
              onChange={e => setFilters(f => ({ ...f, usn: e.target.value }))}
            />
          </div>
        </div>
        {/* Status dropdown */}
        <div className="w-full md:w-36">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">Status</label>
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value as '' | 'pass' | 'fail' }))}
          >
            <option value="">All</option>
            <option value="pass">✓ Pass</option>
            <option value="fail">✗ Fail</option>
          </select>
        </div>
      </div>{/* end filters bar */}

      {/* Main Content */}
      <div className="glass-card rounded-[2rem] overflow-hidden shadow-sm min-h-[400px] flex flex-col border border-slate-200 dark:border-slate-700/60">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-6">
              <WifiOff size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Data Unavailable</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium">{error}</p>
            <button onClick={fetchData} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : !matrix || filteredData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-20">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-lg">No records found.</p>
            <p className="text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[70vh] relative">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 px-4 py-4 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 dark:border-slate-700 min-w-[140px]">USN</th>
                  <th className="sticky left-[140px] z-30 bg-slate-50 dark:bg-slate-800 px-4 py-4 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 dark:border-slate-700 min-w-[180px]">Student Name</th>
                  <th className="px-4 py-4 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 text-center w-[100px]">Total</th>
                  <th className="px-4 py-4 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 text-center w-[100px]">Result</th>
                  {matrix.columns.map(col => (
                    <th key={col.code} className="px-4 py-4 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 min-w-[100px] text-center" title={col.name}>
                      <div className="flex flex-col">
                        <span>{col.code}</span>
                        {/* <span className="text-[9px] opacity-50 font-normal truncate max-w-[80px] mx-auto">{col.name}</span> */}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredData.map((row) => (
                  <tr key={row.usn} className="hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:bg-slate-800 dark:group-hover:bg-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {row.usn}
                    </td>
                    <td className="sticky left-[140px] z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:bg-slate-800 dark:group-hover:bg-slate-800 px-4 py-3 text-[13px] font-black text-indigo-700 dark:text-indigo-400 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={row.name}>
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-emerald-600 dark:text-emerald-400 text-center bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/30">
                      {row.total_marks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${row.result === 'PASS'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100'
                        }`}>
                        {row.result}
                      </span>
                    </td>
                    {matrix.columns.map(col => {
                      const subResult = row[col.code];
                      return (
                        <td key={col.code} className={`px-4 py-3 text-center border-l border-slate-50 dark:border-slate-800/50 ${subResult?.result === 'F' ? 'bg-rose-50 dark:bg-rose-500/10/30 dark:bg-rose-900/10' : ''
                          }`}>
                          {subResult ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-xs font-bold ${subResult.result === 'F' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                                }`}>
                                {subResult.total}
                              </span>
                              {subResult.result === 'F' && (
                                <span className="text-[9px] font-black text-rose-400 leading-none mt-0.5">F</span>
                              )}
                              {subResult.result === 'A' && (
                                <span className="text-[9px] font-black text-amber-500 leading-none mt-0.5">ABS</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsExplorer;
