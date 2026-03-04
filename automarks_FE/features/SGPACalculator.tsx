import React, { useState, useRef } from 'react';
import { Search, Calculator, CheckCircle2, XCircle, AlertTriangle, ChevronDown, Award } from 'lucide-react';
import { endpoints } from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SGPASubject {
    subject_code: string;
    subject_name: string;
    marks_used: number | null;
    marks_source: string;   // "original" | "rv" | "final"
    grade_letter: string;
    grade_point: number;
    credits: number;
}

interface SGPAResult {
    usn: string;
    student_name: string;
    semester: number;
    sgpa: number;
    total_credits_passed: number;
    passed_subjects: SGPASubject[];
    failed_subjects: SGPASubject[];
}

// ─── Grade colour helper ──────────────────────────────────────────────────────

function gradeColor(letter: string) {
    switch (letter) {
        case 'O': return 'text-violet-700 bg-violet-50   border-violet-200';
        case 'S': return 'text-blue-700   bg-blue-50     border-blue-200';
        case 'A': return 'text-indigo-700 bg-indigo-50   border-indigo-200';
        case 'B': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        case 'C': return 'text-teal-700   bg-teal-50     border-teal-200';
        case 'D': return 'text-amber-700  bg-amber-50    border-amber-200';
        case 'E': return 'text-orange-700 bg-orange-50   border-orange-200';
        default: return 'text-rose-700   bg-rose-50     border-rose-200';
    }
}

// ─── Source badge ─────────────────────────────────────────────────────────────

const SourceBadge = ({ source }: { source: string }) => {
    if (source === 'rv') {
        return (
            <span
                title="Passed after Revaluation"
                className="source-badge source-badge--rv"
            >
                RV ✓
            </span>
        );
    }
    if (source === 'final') {
        return (
            <span
                title="Updated by Final Result"
                className="source-badge source-badge--final"
            >
                Final ✓
            </span>
        );
    }
    return (
        <span className="source-badge source-badge--original">Original</span>
    );
};

// ─── Subject table ────────────────────────────────────────────────────────────

const SubjectTable = ({ subjects, variant }: { subjects: SGPASubject[]; variant: 'passed' | 'failed' }) => {
    const isPassed = variant === 'passed';
    return (
        <div className={`sgpa-table-wrapper ${isPassed ? '' : 'sgpa-table-wrapper--failed'}`}>
            <table className="sgpa-table">
                <thead>
                    <tr>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Marks</th>
                        <th>Source</th>
                        <th>Grade</th>
                        <th>GP</th>
                        <th>Credits</th>
                        {isPassed && <th>GP × Cr</th>}
                    </tr>
                </thead>
                <tbody>
                    {subjects.map((s) => (
                        <tr key={s.subject_code} className={isPassed ? '' : 'sgpa-row--failed'}>
                            <td className="font-bold text-slate-800 dark:text-slate-200">{s.subject_code}</td>
                            <td className="text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={s.subject_name}>
                                {s.subject_name}
                            </td>
                            <td className="text-center font-semibold">
                                {s.marks_used !== null && s.marks_used !== undefined ? s.marks_used : '—'}
                            </td>
                            <td className="text-center">
                                <SourceBadge source={s.marks_source} />
                            </td>
                            <td className="text-center">
                                <span className={`grade-badge ${gradeColor(s.grade_letter)}`}>
                                    {s.grade_letter}
                                </span>
                            </td>
                            <td className="text-center font-bold">{isPassed ? s.grade_point : '—'}</td>
                            <td className="text-center">{s.credits}</td>
                            {isPassed && (
                                <td className="text-center font-bold text-indigo-700 dark:text-indigo-400">
                                    {s.grade_point * s.credits}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── SGPA Display ─────────────────────────────────────────────────────────────

const SGPADisplay = ({ sgpa, totalCredits }: { sgpa: number; totalCredits: number }) => {
    const color =
        sgpa >= 9 ? 'from-violet-600 to-indigo-600' :
            sgpa >= 8 ? 'from-indigo-600 to-blue-600' :
                sgpa >= 7 ? 'from-blue-600   to-teal-600' :
                    sgpa >= 6 ? 'from-teal-600   to-emerald-600' :
                        'from-amber-500  to-orange-500';

    return (
        <div className="sgpa-result-card">
            <div className={`sgpa-score-circle bg-gradient-to-br ${color}`}>
                <span className="sgpa-score-value">{sgpa.toFixed(2)}</span>
                <span className="sgpa-score-label">SGPA</span>
            </div>
            <div className="sgpa-credits-info">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Credits (passed): <span className="text-indigo-700 dark:text-indigo-400">{totalCredits}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Formula: Σ(GP × Credits) ÷ Σ(Credits of passed subjects)
                </p>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SGPACalculator() {
    const [usn, setUsn] = useState('');
    const [semester, setSemester] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SGPAResult | null>(null);

    // Autocomplete search state
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Array<{ usn: string; student_name: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = (q: string) => {
        setSearchQuery(q);
        setUsn('');
        setResult(null);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await endpoints.searchStudents(q, 8);
                setSuggestions(res);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            }
        }, 300);
    };

    const selectStudent = (s: { usn: string; student_name: string }) => {
        setUsn(s.usn);
        setSearchQuery(`${s.student_name} (${s.usn})`);
        setSuggestions([]);
        setShowSuggestions(false);
        setResult(null);
        setError(null);
    };

    const handleCalculate = async () => {
        const resolvedUsn = usn.trim() || searchQuery.trim();
        if (!resolvedUsn) { setError('Please select or enter a student USN'); return; }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await endpoints.getStudentSgpa(resolvedUsn, semester);
            setResult(data);
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch SGPA data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sgpa-page">
            {/* Header */}
            <div className="sgpa-header">
                <div className="sgpa-header-icon">
                    <Calculator size={28} />
                </div>
                <div>
                    <h1 className="sgpa-title">SGPA Calculator</h1>
                    <p className="sgpa-subtitle">
                        Select a student and semester to compute VTU CBCS SGPA.
                        Passed subjects only are included. Failed / backlog subjects are shown separately.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="sgpa-controls">
                {/* Student Search */}
                <div className="sgpa-search-wrapper">
                    <label className="sgpa-label">Student (USN or Name)</label>
                    <div className="relative">
                        <Search size={16} className="sgpa-search-icon" />
                        <input
                            id="sgpa-student-input"
                            type="text"
                            className="sgpa-input pl-10"
                            placeholder="Search by name or USN…"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            autoComplete="off"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="sgpa-suggestions">
                                {suggestions.map((s) => (
                                    <li
                                        key={s.usn}
                                        className="sgpa-suggestion-item"
                                        onMouseDown={() => selectStudent(s)}
                                    >
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{s.student_name}</span>
                                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">{s.usn}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Semester Selector */}
                <div className="sgpa-semester-wrapper">
                    <label className="sgpa-label">Semester</label>
                    <div className="relative">
                        <select
                            id="sgpa-semester-select"
                            className="sgpa-input pr-10 appearance-none"
                            value={semester}
                            onChange={(e) => { setSemester(Number(e.target.value)); setResult(null); }}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Semester {s}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* Calculate Button */}
                <div className="sgpa-btn-wrapper">
                    <label className="sgpa-label">&nbsp;</label>
                    <button
                        id="sgpa-calculate-btn"
                        onClick={handleCalculate}
                        disabled={loading}
                        className="sgpa-calculate-btn"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Calculating…
                            </span>
                        ) : (
                            <span className="flex items-center gap-2"><Award size={16} /> Calculate SGPA</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="sgpa-error">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="sgpa-results">
                    {/* Student info bar */}
                    <div className="sgpa-student-bar">
                        <div>
                            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{result.student_name}</p>
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{result.usn} &bull; Semester {result.semester}</p>
                        </div>
                        <SGPADisplay sgpa={result.sgpa} totalCredits={result.total_credits_passed} />
                    </div>

                    {/* Passed subjects */}
                    <div className="sgpa-section">
                        <div className="sgpa-section-header sgpa-section-header--pass">
                            <CheckCircle2 size={18} />
                            <span>Passed Subjects ({result.passed_subjects.length})</span>
                            <span className="ml-auto text-xs font-normal opacity-75">Included in SGPA</span>
                        </div>
                        {result.passed_subjects.length === 0 ? (
                            <p className="sgpa-empty">No passed subjects found for this semester.</p>
                        ) : (
                            <SubjectTable subjects={result.passed_subjects} variant="passed" />
                        )}
                    </div>

                    {/* Failed subjects */}
                    {result.failed_subjects.length > 0 && (
                        <div className="sgpa-section">
                            <div className="sgpa-section-header sgpa-section-header--fail">
                                <XCircle size={18} />
                                <span>Failed / Backlog Subjects ({result.failed_subjects.length})</span>
                                <span className="ml-auto text-xs font-normal opacity-75">Excluded from SGPA</span>
                            </div>
                            <SubjectTable subjects={result.failed_subjects} variant="failed" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
