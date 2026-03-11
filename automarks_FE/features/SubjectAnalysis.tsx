
import React, { useState, useEffect, useCallback } from 'react';
import {
    BookOpen, Filter, TrendingUp, TrendingDown, Users,
    CheckCircle, XCircle, AlertTriangle, Search, RefreshCcw,
    WifiOff, ChevronDown, ChevronUp, Loader2, UserX, Award
} from 'lucide-react';
import { endpoints } from '../api/client';
import { getBatchOptions } from '../utils/batches';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SubjectWiseEntry {
    subject_code: string;
    subject_name: string;
    students_appeared: number;
    students_passed: number;
    students_failed: number;
    pass_percentage: number;
    fail_percentage: number;
    average_marks: number | null;
    highest_marks: number | null;
    lowest_marks: number | null;
}

interface FailedStudent {
    usn: string;
    student_name: string;
    total_marks: number | null;
    internal_marks: number | null;
    external_marks: number | null;
}

// ─── Fixed semester list ──────────────────────────────────────────────────────
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ─── Color helper ─────────────────────────────────────────────────────────────
const passColor = (pct: number) =>
    pct >= 80 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 40 ? '#f59e0b' : '#f43f5e';

const passLabel = (pct: number) =>
    pct >= 80 ? 'text-emerald-600 dark:text-emerald-400'
        : pct >= 60 ? 'text-indigo-600 dark:text-indigo-400'
            : pct >= 40 ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400';

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) => (
    <div className={`${h} ${w} bg-slate-100 dark:bg-slate-700 rounded animate-pulse`} />
);

// ─── Subject Row (accordion item) ─────────────────────────────────────────────
const SubjectRow: React.FC<{
    subject: SubjectWiseEntry;
    filters: { semester: number; batch?: string; branch?: string };
}> = ({ subject, filters }) => {
    const [open, setOpen] = useState(false);
    const [students, setStudents] = useState<FailedStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [search, setSearch] = useState('');

    const fetchFailed = useCallback(async () => {
        if (loaded) { setOpen(o => !o); return; }
        setOpen(true);
        setLoading(true);
        try {
            const data = await endpoints.getSubjectFailedStudents({
                subject_code: subject.subject_code,
                semester: filters.semester,
                batch: filters.batch,
                branch: filters.branch,
            });
            setStudents(data);
            setLoaded(true);
        } catch {
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [subject.subject_code, filters, loaded]);

    const filtered = students.filter(s =>
        s.usn.toLowerCase().includes(search.toLowerCase()) ||
        s.student_name.toLowerCase().includes(search.toLowerCase())
    );

    const pct = subject.pass_percentage;

    return (
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3 transition-all">
            {/* ── Subject summary row ── */}
            <button
                onClick={fetchFailed}
                className="w-full flex items-center gap-4 px-5 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
            >
                {/* Subject code badge */}
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300
                    text-[11px] font-black rounded-lg border border-indigo-100 dark:border-indigo-500/20 whitespace-nowrap shrink-0">
                    {subject.subject_code}
                </span>

                {/* Name */}
                <span className="flex-1 font-semibold text-slate-800 dark:text-slate-100 text-sm truncate" title={subject.subject_name}>
                    {subject.subject_name}
                </span>

                {/* Stats pills */}
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Users size={12} /> {subject.students_appeared}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={12} /> {subject.students_passed}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-500 dark:text-rose-400">
                        <XCircle size={12} /> {subject.students_failed}
                    </span>

                    {/* Pass rate bar */}
                    <div className="flex items-center gap-2 w-36">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: passColor(pct) }}
                            />
                        </div>
                        <span className={`text-xs font-black w-11 text-right ${passLabel(pct)}`}>
                            {pct.toFixed(1)}%
                        </span>
                    </div>

                    {/* Avg marks */}
                    {subject.average_marks != null && (
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-20 text-right">
                            Avg: <span className="text-slate-800 dark:text-slate-200">{subject.average_marks.toFixed(1)}</span>
                        </span>
                    )}
                </div>

                {/* Expand/Collapse icon — only if students failed */}
                {subject.students_failed > 0 ? (
                    <div className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all
                        ${open ? 'bg-rose-500 text-white' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        <UserX size={13} />
                        <span>{subject.students_failed} Failed</span>
                        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl text-xs font-black
                        bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={13} />
                        <span>All Passed</span>
                    </div>
                )}
            </button>

            {/* ── Expanded: failed students panel ── */}
            {open && subject.students_failed > 0 && (
                <div className="bg-rose-50/40 dark:bg-rose-500/5 border-t border-rose-100 dark:border-rose-500/10 px-5 py-4">

                    {/* Search */}
                    <div className="flex items-center justify-between mb-3 gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-rose-500">
                            Failed Students — {subject.subject_name}
                        </p>
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search USN / Name…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                                    rounded-xl text-xs font-medium text-slate-700 dark:text-white outline-none
                                    focus:ring-2 focus:ring-rose-300 w-52 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-3 py-6 justify-center text-rose-400">
                            <Loader2 size={20} className="animate-spin" />
                            <span className="text-sm font-bold">Loading failed students…</span>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-rose-100 dark:border-rose-500/10">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">USN</th>
                                        <th className="px-4 py-3">Student Name</th>
                                        <th className="px-4 py-3 text-center">Internal</th>
                                        <th className="px-4 py-3 text-center">External</th>
                                        <th className="px-4 py-3 text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-rose-50 dark:divide-slate-800">
                                    {filtered.map((s, i) => (
                                        <tr key={s.usn} className="bg-white dark:bg-slate-900 hover:bg-rose-50/60 dark:hover:bg-rose-500/5 transition-colors">
                                            <td className="px-4 py-3 text-xs font-bold text-slate-400">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-black text-slate-700 dark:text-slate-200 font-mono text-xs">
                                                    {s.usn}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate" title={s.student_name}>
                                                {s.student_name}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-300">
                                                {s.internal_marks != null ? s.internal_marks.toFixed(0) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-300">
                                                {s.external_marks != null ? s.external_marks.toFixed(0) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-black text-rose-600 dark:text-rose-400">
                                                    {s.total_marks ?? '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-rose-50 dark:border-slate-700 text-xs font-bold text-slate-400">
                                {filtered.length} student{filtered.length !== 1 ? 's' : ''} failed
                                {search && ` matching "${search}"`}
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center text-slate-400 text-sm font-bold">
                            {search ? `No results matching "${search}"` : 'No failed students found.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SubjectAnalysis: React.FC = () => {
    const [semester, setSemester] = useState<number>(1);
    const [batch, setBatch] = useState<string | undefined>(undefined);
    const [branch, setBranch] = useState<string | undefined>(undefined);
    const [branches, setBranches] = useState<string[]>([]);
    const [data, setData] = useState<SubjectWiseEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<'pass_percentage' | 'students_failed' | 'subject_code'>('pass_percentage');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // ── Load branches when batch changes ──────────────────────────────────────
    useEffect(() => {
        endpoints.getBranches(batch)
            .then(res => setBranches(res || []))
            .catch(() => setBranches([]));
        setBranch(undefined);
    }, [batch]);

    // ── Fetch subject data ─────────────────────────────────────────────────────
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await endpoints.getSubjectWiseAnalysis({
                semester,
                batch,
                branch,
            });
            setData(result);
        } catch (e: any) {
            setError(e.message || 'Failed to load subject analysis data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (batch && branch) {
            fetchData();
        } else {
            setData([]);
            setError(null);
        }
    }, [semester, batch, branch]);

    // ── Sort & search ─────────────────────────────────────────────────────────
    const sorted = [...data]
        .filter(s =>
            s.subject_code.toLowerCase().includes(search.toLowerCase()) ||
            s.subject_name.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : Number(av) - Number(bv);
            return sortDir === 'asc' ? cmp : -cmp;
        });

    // ── KPI summary ───────────────────────────────────────────────────────────
    const totalStudents = data.reduce((s, d) => s + d.students_appeared, 0);
    const totalPassed = data.reduce((s, d) => s + d.students_passed, 0);
    const totalFailed = data.reduce((s, d) => s + d.students_failed, 0);
    const avgPassRate = data.length ? data.reduce((s, d) => s + d.pass_percentage, 0) / data.length : 0;
    const highestPassSubject = data.length ? data.reduce((a, b) => a.pass_percentage > b.pass_percentage ? a : b) : null;
    const lowestPassSubject = data.length ? data.reduce((a, b) => a.pass_percentage < b.pass_percentage ? a : b) : null;

    // ─── Sort button ──────────────────────────────────────────────────────────
    const SortBtn = ({ label, k }: { label: string; k: typeof sortKey }) => (
        <button
            onClick={() => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc'); } }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all
                ${sortKey === k ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200'}`}
        >
            {label} {sortKey === k && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── Header + Filters ──────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subject Analysis</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Click any subject to see the list of students who failed it.
                    </p>
                    {batch && branch && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                                Showing: {batch} &bull; {branch} &bull; Sem {semester}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Batch */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <span className="pl-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</span>
                        <select
                            className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 text-sm outline-none"
                            value={batch || ''}
                            onChange={e => setBatch(e.target.value || undefined)}
                        >
                            <option value="">— Select —</option>
                            {getBatchOptions().map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    {/* Branch */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <span className="pl-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch</span>
                        <select
                            className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 text-sm outline-none"
                            value={branch || ''}
                            onChange={e => setBranch(e.target.value || undefined)}
                        >
                            <option value="">— Select —</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    {/* Semester */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <span className="pl-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</span>
                        <select
                            className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 text-sm outline-none"
                            value={semester}
                            onChange={e => setSemester(Number(e.target.value))}
                        >
                            {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Require batch + branch ─────────────────────────────────────── */}
            {(!batch || !branch) && (
                <div className="glass-card rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500">
                        <Filter size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Select a Batch and Branch</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                        Choose a <strong>Batch</strong> and <strong>Branch</strong> to analyse subject-wise results for that specific group.
                    </p>
                </div>
            )}

            {/* ── Data state (loading / error) ──────────────────────────────── */}
            {batch && branch && error && !isLoading && (
                <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center gap-4 text-center">
                    <WifiOff size={40} className="text-rose-400" />
                    <p className="font-bold text-slate-500">{error}</p>
                    <button onClick={fetchData}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95">
                        <RefreshCcw size={16} /> Retry
                    </button>
                </div>
            )}

            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
            {batch && branch && !error && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Subjects', value: data.length, icon: BookOpen, color: 'indigo', sub: `in ${batch} · ${branch} · Sem ${semester}` },
                            {
                                label: 'Avg Pass Rate', value: `${avgPassRate.toFixed(1)}%`, icon: TrendingUp,
                                color: avgPassRate >= 70 ? 'emerald' : avgPassRate >= 40 ? 'amber' : 'rose', sub: 'mean across subjects'
                            },
                            { label: 'Total Passed', value: totalPassed.toLocaleString(), icon: CheckCircle, color: 'emerald', sub: 'student-subject passes' },
                            { label: 'Total Failed', value: totalFailed.toLocaleString(), icon: XCircle, color: 'rose', sub: `${totalStudents ? ((totalFailed / totalStudents) * 100).toFixed(1) : 0}% of all records` },
                        ].map(({ label, value, icon: Icon, color, sub }) => (
                            <div key={label} className="glass-card rounded-[2rem] p-5 flex flex-col gap-3">
                                <div className={`p-2.5 bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 w-fit rounded-xl`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    {isLoading ? <Skeleton h="h-7" w="w-24" /> : <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>}
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Best / Worst spotlight ────────────────────────────────────── */}
                    {!isLoading && data.length >= 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { subject: highestPassSubject, label: 'Highest Pass Rate', icon: TrendingUp, bg: 'from-emerald-500 to-teal-600' },
                                { subject: lowestPassSubject, label: 'Lowest Pass Rate', icon: TrendingDown, bg: 'from-rose-500 to-pink-600' },
                            ].map(({ subject, label, icon: Icon, bg }) => subject ? (
                                <div key={label} className={`rounded-[2rem] bg-gradient-to-br ${bg} p-6 text-white flex items-center justify-between gap-4 shadow-lg`}>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">{label}</p>
                                        <p className="text-xl font-black leading-tight">{subject.subject_name}</p>
                                        <p className="text-sm opacity-70 mt-1">{subject.subject_code}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-5xl font-black">{subject.pass_percentage.toFixed(0)}%</p>
                                        <div className="flex items-center gap-1 justify-end mt-1 opacity-70">
                                            <Icon size={14} />
                                            <span className="text-xs font-bold">{subject.students_appeared} students</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null)}
                        </div>
                    )}

                    {/* ── Subject Accordion List ────────────────────────────────────── */}
                    <div className="glass-card rounded-[2.5rem] overflow-hidden">
                        {/* List header */}
                        <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Subjects & Failed Students</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    Click a subject row to expand and see who failed
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Sort buttons */}
                                <SortBtn label="Pass %" k="pass_percentage" />
                                <SortBtn label="Most Failed" k="students_failed" />
                                <SortBtn label="Code" k="subject_code" />
                                {/* Search */}
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search subject…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                                    rounded-xl text-xs font-medium text-slate-700 dark:text-white outline-none
                                    focus:ring-2 focus:ring-indigo-400 w-48 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                                            <Skeleton />
                                        </div>
                                    ))}
                                </div>
                            ) : sorted.length > 0 ? (
                                sorted.map(subject => (
                                    <SubjectRow
                                        key={subject.subject_code}
                                        subject={subject}
                                        filters={{ semester, batch, branch }}
                                    />
                                ))
                            ) : (
                                <div className="py-16 flex flex-col items-center text-slate-400 gap-3">
                                    <AlertTriangle size={40} className="opacity-20" />
                                    <p className="font-bold">
                                        {search ? 'No subjects match your search.' : 'No subject data for the selected filters.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!isLoading && data.length > 0 && (
                            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-5 text-xs font-bold text-slate-400">
                                <span>{data.length} subjects</span>
                                <span>Avg pass rate: <span className="text-emerald-600 dark:text-emerald-400">{avgPassRate.toFixed(1)}%</span></span>
                                <span>Total failed (records): <span className="text-rose-500">{totalFailed}</span></span>
                            </div>
                        )}
                    </div>
                </>
            )}

        </div>
    );
};

export default SubjectAnalysis;
