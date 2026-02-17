
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
    semester: '' as string | number, // can be empty
    usn: '',
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

  // Filtered Data (Client-side USN search)
  const filteredData = matrix?.data.filter(d =>
    d.usn.toLowerCase().includes(filters.usn.toLowerCase()) ||
    d.name.toLowerCase().includes(filters.usn.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Results Matrix</h2>
          <p className="text-slate-500 font-medium">Comprehensive view of student performance across all subjects.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Sync
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {matrix && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{matrix.summary.total_students}</p>
            </div>
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
              <Users size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-600/60 uppercase tracking-wider">Passed</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{matrix.summary.passed}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-rose-600/60 uppercase tracking-wider">Failed</p>
              <p className="text-3xl font-black text-rose-600 mt-1">{matrix.summary.failed}</p>
            </div>
            <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
              <XCircle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-end gap-3">
        <div className="w-full md:w-48">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">Batch</label>
          <select
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.branch}
            onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="w-full md:w-32">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block px-1">Semester</label>
          <select
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.semester}
            onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
          >
            <option value="">All</option>
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 placeholder:font-medium"
              value={filters.usn}
              onChange={e => setFilters(f => ({ ...f, usn: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-[2rem] overflow-hidden shadow-sm min-h-[400px] flex flex-col border border-slate-200/60">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
              <WifiOff size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Data Unavailable</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">{error}</p>
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
              <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 bg-slate-50 px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 min-w-[140px]">USN</th>
                  <th className="sticky left-[140px] z-30 bg-slate-50 px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-r border-slate-200 min-w-[180px]">Student Name</th>
                  <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center w-[100px]">Total</th>
                  <th className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center w-[100px]">Result</th>
                  {matrix.columns.map(col => (
                    <th key={col.code} className="px-4 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 min-w-[100px] text-center" title={col.name}>
                      <div className="flex flex-col">
                        <span>{col.code}</span>
                        {/* <span className="text-[9px] opacity-50 font-normal truncate max-w-[80px] mx-auto">{col.name}</span> */}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredData.map((row) => (
                  <tr key={row.usn} className="hover:bg-slate-50 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 text-xs font-bold text-indigo-600 border-r border-slate-100 whitespace-nowrap">
                      {row.usn}
                    </td>
                    <td className="sticky left-[140px] z-10 bg-white group-hover:bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 border-r border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={row.name}>
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-slate-800 text-center bg-slate-50/50">
                      {row.total_marks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${row.result === 'PASS'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                        {row.result}
                      </span>
                    </td>
                    {matrix.columns.map(col => {
                      const subResult = row[col.code];
                      return (
                        <td key={col.code} className={`px-4 py-3 text-center border-l border-slate-50 ${subResult?.result === 'F' ? 'bg-rose-50/30' : ''
                          }`}>
                          {subResult ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-xs font-bold ${subResult.result === 'F' ? 'text-rose-600' : 'text-slate-600'
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
