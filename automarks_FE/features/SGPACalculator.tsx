import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calculator, AlertTriangle, ChevronDown, Award } from 'lucide-react';
import { endpoints } from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchSGPAStudent {
    usn: string;
    student_name: string;
    semester: number;
    sgpa: number;
}

interface BatchSGPAResult {
    batch: string;
    semester: number;
    average_sgpa: number;
    students: BatchSGPAStudent[];
}

type SgpaFilter = 'all' | '9.0' | '8.5-9.0' | '8.0-8.5' | '7.5-8.0' | '7.0-7.5';

const SGPA_FILTERS: Array<{ value: SgpaFilter; label: string; matches: (sgpa: number) => boolean }> = [
    { value: 'all', label: 'All Students', matches: () => true },
    { value: '9.0', label: 'SGPA ≥ 9.0', matches: (sgpa) => sgpa >= 9.0 },
    { value: '8.5-9.0', label: 'SGPA ≥ 8.5 and < 9.0', matches: (sgpa) => sgpa >= 8.5 && sgpa < 9.0 },
    { value: '8.0-8.5', label: 'SGPA ≥ 8.0 and < 8.5', matches: (sgpa) => sgpa >= 8.0 && sgpa < 8.5 },
    { value: '7.5-8.0', label: 'SGPA ≥ 7.5 and < 8.0', matches: (sgpa) => sgpa >= 7.5 && sgpa < 8.0 },
    { value: '7.0-7.5', label: 'SGPA ≥ 7.0 and < 7.5', matches: (sgpa) => sgpa >= 7.0 && sgpa < 7.5 },
];

// ─── SGPA Display ─────────────────────────────────────────────────────────────

const AverageSGPADisplay = ({ sgpa, totalStudents }: { sgpa: number; totalStudents: number }) => {
    const color =
        sgpa >= 9 ? 'from-violet-600 to-indigo-600' :
            sgpa >= 8 ? 'from-indigo-600 to-blue-600' :
                sgpa >= 7 ? 'from-blue-600   to-teal-600' :
                    sgpa >= 6 ? 'from-teal-600   to-emerald-600' :
                        'from-amber-500  to-orange-500';

    return (
        <div className="sgpa-result-card relative overflow-hidden bg-white dark:bg-slate-900/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex items-center shadow-sm">
            <div className={`sgpa-score-circle w-20 h-20 rounded-full flex flex-col items-center justify-center text-white shadow-lg bg-gradient-to-br ${color} shrink-0`}>
                <span className="sgpa-score-value text-2xl font-black tracking-tight">{sgpa.toFixed(2)}</span>
                <span className="sgpa-score-label text-[10px] font-medium uppercase tracking-wider opacity-90">Avg SGPA</span>
            </div>
            <div className="sgpa-credits-info ml-6">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Batch Performance
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculated from <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalStudents}</span> students in this batch.
                </p>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SGPACalculator() {
    const [batches, setBatches] = useState<string[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>('');
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [semester, setSemester] = useState(1);
    const [sgpaFilter, setSgpaFilter] = useState<SgpaFilter>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BatchSGPAResult | null>(null);

    // Fetch batches on mount
    useEffect(() => {
        async function fetchBatches() {
            try {
                const b = await endpoints.getBatches();
                setBatches(b);
                if (b.length > 0) setSelectedBatch(b[b.length - 1]); // default to newest batch
            } catch (err) {
                console.error("Failed to fetch batches", err);
            }
        }
        fetchBatches();
    }, []);

    // Fetch branches when batch changes
    useEffect(() => {
        if (!selectedBatch) {
            setBranches([]);
            setSelectedBranch('');
            return;
        }
        async function fetchBranches() {
            try {
                const b = await endpoints.getBatchBranches(selectedBatch);
                setBranches(b);
                setSelectedBranch('');
            } catch (err) {
                console.error("Failed to fetch branches", err);
            }
        }
        fetchBranches();
    }, [selectedBatch]);

    const loadResults = useCallback(async () => {
        if (!selectedBatch) {
            setResult(null);
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await endpoints.getBatchSgpa(selectedBatch, semester, selectedBranch || undefined);
            setResult(data);
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch batch SGPA data');
        } finally {
            setLoading(false);
        }
    }, [selectedBatch, semester, selectedBranch]);

    // Keep displayed records current whenever a data-defining selection changes.
    useEffect(() => {
        void loadResults();
    }, [loadResults]);

    const activeSgpaFilter = SGPA_FILTERS.find((filter) => filter.value === sgpaFilter) ?? SGPA_FILTERS[0];

    // Filter and sort students
    const filteredStudents = useMemo(() => (
        result?.students
            .filter((student) => activeSgpaFilter.matches(student.sgpa))
            .sort((a, b) => b.sgpa - a.sgpa || a.usn.localeCompare(b.usn)) ?? []
    ), [result, activeSgpaFilter]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSgpaFilter(e.target.value as SgpaFilter);
    };

    return (
        <div className="sgpa-page max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="sgpa-header flex items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="sgpa-header-icon shrink-0 w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-50 dark:bg-indigo-900/200/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Calculator size={28} />
                </div>
                <div>
                    <h1 className="sgpa-title text-2xl font-black text-slate-900 dark:text-white mb-1">Batch SGPA Calculator</h1>
                    <p className="sgpa-subtitle text-sm text-slate-500 dark:text-slate-400">
                        Calculate and analyze Semester Grade Point Average (SGPA) for an entire batch.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="sgpa-controls bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                {/* Batch Selector */}
                <div className="sgpa-batch-wrapper">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Batch</label>
                    <div className="relative">
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedBatch}
                            onChange={(e) => { setSelectedBatch(e.target.value); setSelectedBranch(''); }}
                        >
                            <option value="" disabled>Select a batch</option>
                            {batches.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* Branch Selector */}
                <div className="sgpa-branch-wrapper">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Branch</label>
                    <div className="relative">
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            disabled={!selectedBatch || branches.length === 0}
                        >
                            <option value="">All Branches</option>
                            {branches.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* Semester Selector */}
                <div className="sgpa-semester-wrapper">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Semester</label>
                    <div className="relative">
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={semester}
                            onChange={(e) => setSemester(Number(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Semester {s}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* Filter Selector */}
                <div className="sgpa-filter-wrapper">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">SGPA Filter</label>
                    <div className="relative">
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={sgpaFilter}
                            onChange={handleFilterChange}
                        >
                            {SGPA_FILTERS.map((filter) => (
                                <option key={filter.value} value={filter.value}>{filter.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* Calculate Button */}
                <div className="sgpa-btn-wrapper">
                    <button
                        onClick={loadResults}
                        disabled={loading || !selectedBatch}
                        className="w-full h-[42px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm px-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Calculating…
                            </>
                        ) : (
                            <><Award size={16} /> Calculate</>
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="sgpa-error text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-50 dark:bg-rose-500/100/10 dark:text-rose-400 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20 text-sm font-medium flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="sgpa-results space-y-6">
                    {/* Summary */}
                    <AverageSGPADisplay sgpa={result.average_sgpa} totalStudents={result.students.length} />

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Batch Results ({filteredStudents.length}/{result.students.length})</h2>
                            {sgpaFilter !== 'all' && <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-50 dark:bg-indigo-900/200/20 dark:text-indigo-400">Filter: {activeSgpaFilter.label}</span>}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">USN</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Student Name</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-center">Semester</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">SGPA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((s, i) => (
                                            <tr key={s.usn} className={`border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/20 transition-colors ${i % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50'}`}>
                                                <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white text-xs">{s.usn}</td>
                                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={s.student_name}>{s.student_name}</td>
                                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">{s.semester}</td>
                                                <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{s.sgpa.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                No students found matching the selected filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
