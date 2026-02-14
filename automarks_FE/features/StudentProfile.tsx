import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  Hash,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  PieChart as PieIcon,
  ChevronRight,
  ChevronDown,
  X,
  GraduationCap,
  Edit2,
  Save,
  Plus,
  AlertCircle
} from 'lucide-react';
import { endpoints } from '../api/client';
import { StudentSummary, Student, Result, StudentGpaProgression } from '../types';
import { formatOrdinal } from '../utils/ordinal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const StudentProfile: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ usn: string; student_name: string; batch?: string; branch?: string }>>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpa, setGpa] = useState<StudentGpaProgression | null>(null);
  const [expandedSemesters, setExpandedSemesters] = useState<number[]>([]);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<number, Result>>({});

  // Manual Entry State
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    usn: '',
    student_name: '', // Added for new student creation
    batch: '',       // Added for new student creation
    branch: '',      // Added for new student creation
    semester: '',
    exam_month: '',
    exam_year: '',
    subjects: [{ subject_code: '', subject_name: '', credits: 4, internal_marks: 0, external_marks: 0, total_marks: 0, result_status: 'P' }]
  });

  // Check URL params for manual mode trigger
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'manual') {
      setShowManualEntry(true);
      // Clean up URL without refresh
      window.history.replaceState({}, '', '/profile');
    }
    const usnParam = params.get('usn');
    if (usnParam) {
      setQuery(usnParam);
      performSearch(usnParam);
    }
  }, []);

  const handleManualEntryChange = (field: string, value: any) => {
    setManualEntryData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectChange = (index: number, field: string, value: any) => {
    const newSubjects = [...manualEntryData.subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    // Auto-calc total
    if (field === 'internal_marks' || field === 'external_marks') {
      newSubjects[index].total_marks = Number(newSubjects[index].internal_marks || 0) + Number(newSubjects[index].external_marks || 0);
    }
    setManualEntryData(prev => ({ ...prev, subjects: newSubjects }));
  };

  const addSubjectRow = () => {
    setManualEntryData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { subject_code: '', subject_name: '', credits: 4, internal_marks: 0, external_marks: 0, total_marks: 0, result_status: 'P' }]
    }));
  };

  const removeSubjectRow = (index: number) => {
    setManualEntryData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  }

  const submitManualEntryFinal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Basic validation
      if (!manualEntryData.usn || !manualEntryData.semester || !manualEntryData.exam_month || !manualEntryData.exam_year) {
        throw new Error("USN, Semester, Exam Month, and Exam Year are required.");
      }
      if (manualEntryData.subjects.length === 0 || manualEntryData.subjects.some(s => !s.subject_code || !s.subject_name)) {
        throw new Error("At least one subject with code and name is required.");
      }

      // Check for duplicate subject codes
      const subjectCodes = manualEntryData.subjects.map(s => s.subject_code.trim().toUpperCase());
      const uniqueCodes = new Set(subjectCodes);
      if (uniqueCodes.size !== subjectCodes.length) {
        throw new Error("Duplicate subject codes found. Each subject must have a unique code.");
      }

      // Check if student exists
      let existingStudent = null;
      try {
        existingStudent = await endpoints.getStudentByUsn(manualEntryData.usn);
      } catch (e) { /* Student not found, proceed to create */ }

      if (!existingStudent) {
        // We need student name/batch/branch.
        if (!manualEntryData.student_name) throw new Error("Student Name is required for new student");

        await endpoints.createStudent({
          usn: manualEntryData.usn,
          student_name: manualEntryData.student_name,
          batch: manualEntryData.batch || '202X', // Default if not provided
          branch: manualEntryData.branch || 'CS' // Default if not provided
        });
      }

      // Now add semester
      await endpoints.addStudentSemester(manualEntryData.usn, {
        semester_number: Number(manualEntryData.semester),
        exam_month: manualEntryData.exam_month,
        exam_year: Number(manualEntryData.exam_year),
        subjects: manualEntryData.subjects.map(s => ({
          subject_code: s.subject_code,
          subject_name: s.subject_name,
          credits: Number(s.credits),
          internal_marks: Number(s.internal_marks),
          external_marks: Number(s.external_marks),
          total_marks: Number(s.total_marks),
          result_status: s.result_status
        }))
      });

      // Success
      setShowManualEntry(false);
      setQuery(manualEntryData.usn); // Auto search
      performSearch(manualEntryData.usn);
    } catch (err: any) {
      setError(err.message || "Failed to submit manual entry");
      setIsLoading(false);
    }
  };

  // Toggle semester expansion
  const toggleSemester = (sem: number) => {
    setExpandedSemesters(prev =>
      prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    performSearch(query);
  };

  const performSearch = async (q: string) => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    setStudent(null);

    try {
      const results = await endpoints.searchStudents(q);

      if (results.length === 0) {
        setError("No students found. Use 'Manual Entry' to add a new record.");
        setIsLoading(false);
        return;
      }

      if (results.length === 1) {
        await selectStudent(results[0].usn);
      } else {
        setSearchResults(results);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError("An error occurred while searching.");
      setIsLoading(false);
    }
  };

  const selectStudent = async (selectedUsn: string) => {
    setIsLoading(true);
    setSearchResults([]);
    setError(null);
    setIsEditing(false);

    try {
      const [studentData, summaryData, gpaData, resultsData] = await Promise.all([
        endpoints.getStudentByUsn(selectedUsn),
        endpoints.getStudentSummary(selectedUsn),
        endpoints.getStudentGpa(selectedUsn).catch(() => null),
        endpoints.getResults({ usn: selectedUsn })
      ]);

      const latestSemester = summaryData.semesters.length
        ? summaryData.semesters[summaryData.semesters.length - 1].semester
        : undefined;

      setStudent({ ...studentData, current_semester: latestSemester });
      setSummary(summaryData);
      setGpa(gpaData);
      setAllResults(resultsData);

      if (latestSemester) {
        setExpandedSemesters([latestSemester]);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to load full student profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const getResultsForSemester = (sem: number) => {
    return allResults.filter(r => r.semester === sem);
  };

  const handleEditChange = (id: number, field: keyof Result, value: any) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const startEditing = () => {
    // Populate editData with current results
    const initialEditData: Record<number, Result> = {};
    allResults.forEach(r => {
      initialEditData[r.id] = { ...r };
    });
    setEditData(initialEditData);
    setIsEditing(true);
    // Expand all semesters to allow editing
    setExpandedSemesters(summary?.semesters.map(s => s.semester) || []);
  };

  const saveChanges = async () => {
    setIsLoading(true);
    try {
      // Iterate through editData and send updates
      // This is naive; normally we'd diff.
      // Only send changes if possible, but for now we send all 'dirty' ones?
      // We can just iterate all and update.
      const updates = Object.values(editData) as Result[];
      for (const res of updates) {
        const original = allResults.find(r => r.id === res.id);
        if (JSON.stringify(original) !== JSON.stringify(res)) {
          await endpoints.updateStudentResult(
            res.usn,
            res.subject_code,
            res.semester,
            {
              internal_marks: Number(res.internal_marks),
              external_marks: Number(res.external_marks),
              total_marks: Number(res.total_marks),
              result_status: res.result_status
            }
          );
        }
      }
      // Reload data
      if (student) await selectStudent(student.usn);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes. Please check values.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Student Profile</h2>
            <p className="text-slate-500 font-medium">Search by Name or USN to view academic history.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <form onSubmit={handleSearch} className="max-w-2xl flex-1 flex gap-3 relative">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Enter Name or USN (e.g., 'Anjan' or '1SV22...')"
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isLoading ? '...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={() => setShowManualEntry(true)}
              className="bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Manual Entry</span>
            </button>
          </form>
        </div>

        {/* Search Results Dropdown / List */}
        {searchResults.length > 0 && !student && (
          <div className="max-w-2xl bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="font-bold text-slate-700">Select a Student ({searchResults.length} matches)</h3>
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              {searchResults.map((s) => (
                <button
                  key={s.usn}
                  onClick={() => selectStudent(s.usn)}
                  className="w-full text-left p-4 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-black text-slate-900">{s.student_name}</p>
                    <p className="text-xs text-slate-500 font-bold">{s.usn}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">{s.batch} • {s.branch}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="glass-card p-10 text-center rounded-[2.5rem]">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-rose-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{error}</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Try refining your search query.</p>
        </div>
      )}

      {student && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 animate-in fade-in duration-500">

          {/* Left Column: Stats & Graphs */}
          <div className="space-y-8">
            {/* Student Card */}
            <div className="glass-card rounded-[2.5rem] p-8 text-center relative overflow-hidden">
              {/* Edit Button */}
              <button
                onClick={isEditing ? saveChanges : startEditing}
                className={`absolute top-6 right-6 p-3 rounded-xl transition-all shadow-sm z-20 ${isEditing
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-white text-slate-400 hover:text-indigo-600'
                  }`}
                disabled={isLoading}
              >
                {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
              </button>

              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <img
                src="/student-avatar.svg"
                alt="Student"
                className="w-32 h-32 rounded-3xl mx-auto mb-6 border-4 border-white shadow-xl relative z-10 bg-indigo-50"
              />
              <h3 className="text-2xl font-black text-slate-900">{student.student_name}</h3>
              <p className="text-indigo-600 font-bold mb-6">{student.usn}</p>

              <div className="space-y-4 text-left border-t border-slate-100 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Award size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Avg %</p>
                      <p className="text-lg font-black text-slate-900 mt-1">{summary.overall_avg.toFixed(2)}%</p>
                    </div>
                  </div>
                  {gpa?.gpa?.length ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <div className="font-serif font-black text-lg">A+</div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">CGPA</p>
                        <p className="text-lg font-black text-indigo-600 mt-1">
                          {gpa.gpa[gpa.gpa.length - 1].cgpa.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sem</p>
                      <p className="text-lg font-black text-slate-900 mt-1">{student.current_semester || 'N/A'}</p>
                    </div>
                  </div>
                  {gpa?.gpa?.length ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Hash size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Credits</p>
                        <p className="text-lg font-black text-emerald-600 mt-1">
                          {gpa.gpa.reduce((sum, s) => sum + s.total_credits, 0)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card rounded-[2.5rem] p-8">
              <h4 className="text-lg font-black text-slate-900 mb-6">Overview</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-600">Completion</span>
                    <span className="text-sm font-black text-indigo-600">
                      {summary ? Math.round((summary.semesters.filter(s => s.passed_count + s.failed_count > 0).length / summary.semesters.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${summary ? Math.round((summary.semesters.filter(s => s.passed_count + s.failed_count > 0).length / summary.semesters.length) * 100) : 0}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Passed</p>
                    <p className="text-xl font-black text-slate-900">
                      {summary ? summary.semesters.reduce((sum, s) => sum + s.passed_count, 0) : 0}
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Backlogs</p>
                    <p className="text-xl font-black text-slate-900">
                      {summary ? summary.semesters.reduce((sum, s) => sum + s.failed_count, 0) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* GPA Graph */}
            {gpa?.gpa?.length ? (
              <div className="glass-card rounded-[2.5rem] p-8">
                <h4 className="text-lg font-black text-slate-900 mb-6">Performance Trend</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gpa.gpa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="semester" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis tickLine={false} axisLine={false} domain={[0, 10]} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="sgpa" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="cgpa" stroke="#0f172a" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-indigo-600 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">SGPA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-slate-900 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">CGPA</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Full History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <GraduationCap size={24} className="text-indigo-600" /> Academic History
              </h4>
              {isEditing && <span className="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">EDIT MODE ACTIVE</span>}
            </div>

            <div className="space-y-6">
              {[...summary.semesters].reverse().map((sem) => {
                const results = getResultsForSemester(sem.semester);
                const isExpanded = expandedSemesters.includes(sem.semester);

                return (
                  <div key={sem.semester} className={`glass-card rounded-[2rem] overflow-hidden transition-all border ${isExpanded ? 'ring-4 ring-indigo-50 border-indigo-200' : 'border-slate-100'}`}>
                    {/* Semester Header / Summary */}
                    <div
                      className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between select-none"
                      onClick={() => toggleSemester(sem.semester)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                          {sem.semester}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-lg">Semester {sem.semester}</h5>
                          <div className="flex gap-3 text-xs font-bold text-slate-500 mt-0.5">
                            <span>Avg: {sem.avg.toFixed(1)}%</span>
                            <span>•</span>
                            <span className="text-emerald-600">{sem.passed_count} Passed</span>
                            <span>•</span>
                            <span className="text-rose-500">{sem.failed_count} Failed</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">

                        <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown size={20} className="text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content: Result Table */}
                    {isExpanded && (
                      <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/30 animate-in fade-in slide-in-from-top-2">
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr>
                                <th className="pb-3 pl-2 text-xs font-black text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-20">Int</th>
                                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-20">Ext</th>
                                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-20">Total</th>
                                <th className="pb-3 pr-2 text-xs font-black text-slate-400 uppercase tracking-widest text-right w-24">Result</th>
                              </tr>
                            </thead>
                            <tbody className="space-y-2">
                              {results.map((res) => (
                                <tr key={res.id} className="group hover:bg-white transition-colors rounded-lg">
                                  <td className="py-3 pl-2 border-b border-slate-100 group-last:border-0">
                                    <div className="font-bold text-slate-900">{res.subject_name}</div>
                                    <div className="text-xs text-slate-500 font-bold font-mono">{res.subject_code}</div>
                                  </td>

                                  {/* Internal Marks */}
                                  <td className="py-3 text-center border-b border-slate-100 group-last:border-0 font-medium text-slate-600">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        className="w-16 p-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                        value={editData[res.id]?.internal_marks ?? res.internal_marks}
                                        onChange={(e) => handleEditChange(res.id, 'internal_marks', e.target.value)}
                                      />
                                    ) : res.internal_marks}
                                  </td>

                                  {/* External Marks */}
                                  <td className="py-3 text-center border-b border-slate-100 group-last:border-0 font-medium text-slate-600">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        className="w-16 p-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                        value={editData[res.id]?.external_marks ?? res.external_marks}
                                        onChange={(e) => handleEditChange(res.id, 'external_marks', e.target.value)}
                                      />
                                    ) : res.external_marks}
                                  </td>

                                  {/* Total Marks */}
                                  <td className="py-3 text-center border-b border-slate-100 group-last:border-0 font-black text-slate-900">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        className="w-16 p-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-black"
                                        value={editData[res.id]?.total_marks ?? res.total_marks}
                                        onChange={(e) => handleEditChange(res.id, 'total_marks', e.target.value)}
                                      />
                                    ) : res.total_marks}
                                  </td>

                                  {/* Result Status */}
                                  <td className="py-3 pr-2 text-right border-b border-slate-100 group-last:border-0">
                                    {isEditing ? (
                                      <select
                                        className="p-1 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200"
                                        value={editData[res.id]?.result_status ?? res.result_status}
                                        onChange={(e) => handleEditChange(res.id, 'result_status', e.target.value)}
                                      >
                                        <option value="P">PASS</option>
                                        <option value="F">FAIL</option>
                                        <option value="A">ABSENT</option>
                                      </select>
                                    ) : (
                                      <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-black uppercase ${res.result_status === 'P' || res.result_status === 'PASS'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-rose-100 text-rose-700'
                                        }`}>
                                        {res.result_status === 'P' ? 'PASS' : res.result_status}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {results.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-4 text-center text-sm text-slate-500 font-medium">No subjects recorded for this semester.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Disclaimer or End Logic */}
            <div className="text-center pt-8 pb-4">
              <p className="text-xs text-slate-400 font-medium">
                {isEditing ? 'Make sure to save your changes!' : 'Results data is refreshed whenever a new PDF is uploaded.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!student && !isLoading && searchResults.length === 0 && (
        <div className="glass-card p-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Search size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-400">Search to view profile</h3>
          <p className="text-slate-400 mt-2 max-w-xs mx-auto">Enter Name or USN to see detailed performance metrics and history.</p>
          <button
            onClick={() => setShowManualEntry(true)}
            className="mt-8 text-indigo-600 font-bold hover:underline"
          >
            Or add a record manually
          </button>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2rem]">
              <div>
                <h3 className="text-xl font-black text-slate-900">Manual Entry</h3>
                <p className="text-xs font-bold text-slate-500">Add a new student record or semester result</p>
              </div>
              <button
                onClick={() => setShowManualEntry(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Student Details */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-black text-indigo-600 uppercase tracking-wider">
                  <User size={16} /> Student Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">USN <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. 1SV22CS001"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 uppercase"
                      value={manualEntryData.usn}
                      onChange={(e) => handleManualEntryChange('usn', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Student Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                      value={manualEntryData.student_name}
                      onChange={(e) => handleManualEntryChange('student_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Batch</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                      value={manualEntryData.batch}
                      onChange={(e) => handleManualEntryChange('batch', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 uppercase"
                      value={manualEntryData.branch}
                      onChange={(e) => handleManualEntryChange('branch', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>

              {/* Semester Details */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-black text-indigo-600 uppercase tracking-wider">
                  <Calendar size={16} /> Semester Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Semester <span className="text-rose-500">*</span></label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                      value={manualEntryData.semester}
                      onChange={(e) => handleManualEntryChange('semester', e.target.value)}
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Exam Month <span className="text-rose-500">*</span></label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                      value={manualEntryData.exam_month}
                      onChange={(e) => handleManualEntryChange('exam_month', e.target.value)}
                    >
                      <option value="">Select</option>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Exam Year <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      placeholder="YYYY"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                      value={manualEntryData.exam_year}
                      onChange={(e) => handleManualEntryChange('exam_year', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-black text-indigo-600 uppercase tracking-wider">
                    <BookOpen size={16} /> Subjects
                  </h4>
                  <button
                    onClick={addSubjectRow}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Subject
                  </button>
                </div>

                <div className="space-y-3">
                  {manualEntryData.subjects.map((subj, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative group">
                      <button
                        onClick={() => removeSubjectRow(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Subject Info */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Code</label>
                          <input
                            type="text"
                            placeholder="e.g. 21CS41"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold uppercase"
                            value={subj.subject_code}
                            onChange={(e) => handleSubjectChange(idx, 'subject_code', e.target.value.toUpperCase())}
                          />
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Name</label>
                          <input
                            type="text"
                            placeholder="Subject Name"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                            value={subj.subject_name}
                            onChange={(e) => handleSubjectChange(idx, 'subject_name', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Cred</label>
                          <input
                            type="number"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center"
                            value={subj.credits}
                            onChange={(e) => handleSubjectChange(idx, 'credits', e.target.value)}
                          />
                        </div>

                        {/* Marks */}
                        <div className="md:col-span-1 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Int</label>
                          <input
                            type="number"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center"
                            value={subj.internal_marks}
                            onChange={(e) => handleSubjectChange(idx, 'internal_marks', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Ext</label>
                          <input
                            type="number"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center"
                            value={subj.external_marks}
                            onChange={(e) => handleSubjectChange(idx, 'external_marks', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Result</label>
                          <select
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                            value={subj.result_status}
                            onChange={(e) => handleSubjectChange(idx, 'result_status', e.target.value)}
                          >
                            <option value="P">PASS</option>
                            <option value="F">FAIL</option>
                            <option value="A">ABSENT</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem] flex justify-end gap-3">
              <button
                onClick={() => setShowManualEntry(false)}
                className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitManualEntryFinal}
                disabled={isLoading}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {isLoading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
