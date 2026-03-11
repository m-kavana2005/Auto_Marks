
import {
  BatchStatus,
  Student,
  Result,
  SubjectStats,
  StudentSummary,
  TopPerformer,
  FailureAnalysis,
  ResultMatrix
} from '../types';

// Detect environment variables from both Vite and Next.js naming conventions
const getInitialApiBase = () => {
  const env = (import.meta as any).env || {};
  return env.VITE_API_BASE || env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
};

let API_BASE = localStorage.getItem('vtu_api_base_override') || getInitialApiBase();

export const setApiBaseOverride = (url: string) => {
  API_BASE = url;
  localStorage.setItem('vtu_api_base_override', url);
};

export const getApiBase = () => API_BASE;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...rest } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) url += `?${query}`;
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        ...(rest.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        'ngrok-skip-browser-warning': 'true',
        ...rest.headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const looksJson = contentType.includes('application/json');

    const readBodyText = async () => response.clone().text().catch(() => '');

    if (!response.ok) {
      const bodyText = await readBodyText();
      if (looksJson) {
        try {
          const data = JSON.parse(bodyText || '{}');
          if (data?.detail) {
            throw new Error(data.detail);
          }
        } catch {
          // Fall through to generic handler below
        }
      }

      const snippet = bodyText ? bodyText.slice(0, 300) : '[empty body]';
      throw new Error(
        `API error ${response.status} (${response.statusText}). Body looks non-JSON (maybe an HTML page). Snippet: ${snippet}`
      );
    }

    if (looksJson) {
      try {
        return await response.json();
      } catch {
        const snippet = (await readBodyText()).slice(0, 300) || '[empty body]';
        throw new Error(
          `Unexpected response format from ${url}. Expected JSON but got: ${snippet}`
        );
      }
    }

    // Fallback: try to parse non-JSON content as JSON and surface a helpful error if it fails
    const text = await readBodyText();
    try {
      return JSON.parse(text) as T;
    } catch {
      const snippet = text ? text.slice(0, 300) : '[empty body]';
      throw new Error(
        `Unexpected response format from ${url}. Expected JSON but received non-JSON content. Snippet: ${snippet}`
      );
    }
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error(`Network Error: The server at ${API_BASE} is unreachable. Check CORS settings or if the server is running.`);
    }
    throw error;
  }
}

export const endpoints = {
  uploadSingle: (file: File, batch: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batch', batch);
    return apiFetch('/upload/single', { method: 'POST', body: formData });
  },
  uploadBatch: (files: File[], batch: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('batch', batch);
    return apiFetch<{ batch_id: string }>('/upload/batch', { method: 'POST', body: formData });
  },
  getBatchStatus: async (batchId: string): Promise<BatchStatus> => {
    const res = await apiFetch<any>(`/upload/status/${batchId}`);
    return {
      batch_id: res.batch_id,
      status: res.status,
      total_files: res.total_files,
      processed_files: res.processed ?? res.processed_files ?? 0,
      failed_files: res.failed ?? res.failed_files ?? 0,
      errors: res.errors ?? res.error_log ?? [],
    };
  },
  getStudents: async (skip = 0, limit = 50): Promise<Student[]> => {
    const res = await apiFetch<any[]>('/students', { params: { skip, limit } });
    return res.map((s) => ({
      id: s.id,
      usn: s.usn,
      student_name: s.student_name,
    }));
  },
  getStudentByUsn: async (usn: string): Promise<Student> => {
    const s = await apiFetch<any>(`/students/${usn}`);
    return {
      id: s.id,
      usn: s.usn,
      student_name: s.student_name,
    };
  },
  searchStudents: async (q: string, limit = 10): Promise<Array<{ usn: string; student_name: string; batch?: string; branch?: string }>> => {
    return apiFetch('/student/search', { params: { q, limit } });
  },
  createStudent: async (data: { usn: string; student_name: string; batch: string; branch: string }): Promise<Student> => {
    return apiFetch('/student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  addStudentSemester: async (
    usn: string,
    data: {
      semester_number: number;
      exam_month?: string;
      exam_year?: number;
      subjects: Array<{
        subject_code: string;
        subject_name: string;
        credits?: number;
        internal_marks?: number;
        external_marks?: number;
        total_marks?: number;
        result_status?: string;
      }>;
    }
  ): Promise<{ success: boolean; data: any }> => {
    return apiFetch(`/student/${usn}/semester`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getBatchSemesters: async (batch: string): Promise<number[]> => {
    return apiFetch(`/batches/${batch}/semesters`);
  },
  getBatchBranches: async (batch: string): Promise<string[]> => {
    return apiFetch(`/batches/${batch}/branches`);
  },
  getBatchSemesterSubjects: async (batch: string, semester: number): Promise<Array<{ id: number; subject_code: string; subject_name: string }>> => {
    return apiFetch(`/batch/${batch}/semester/${semester}/subjects`);
  },
  getResults: async (params: {
    usn?: string;
    semester?: number;
    batch?: string;
    branch?: string;
    status?: 'pass' | 'fail';
    exam_year?: number;
    exam_month?: string;
    subject_code?: string;
    skip?: number;
    limit?: number;
  }): Promise<Result[]> => {
    const res = await apiFetch<any[]>('/results', { params });
    return res.map((r) => ({
      id: r.id,
      usn: r.usn ?? r.student?.usn ?? '',
      student_name: r.student_name ?? r.student?.name ?? '',
      semester: r.semester ?? 0,
      subject_code: r.subject_code ?? r.subject?.code ?? '',
      subject_name: r.subject_name ?? r.subject?.name ?? '',
      internal_marks: r.internal_marks ?? 0,
      external_marks: r.external_marks ?? 0,
      total_marks: r.total_marks ?? 0,
      result_status: r.result_status ?? '',
      announced_date: r.announced_date,
    }));
  },
  getSubjectStats: async (
    semester: number,
    opts?: { batch?: string; branch?: string; exam_year?: number; exam_month?: string }
  ): Promise<SubjectStats[]> => {
    const res = await apiFetch<any[]>(`/analytics/subject-stats/${semester}`, { params: opts });
    return res.map((s) => ({
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      avg_total: s.avg_total ?? s.average_marks ?? s.average ?? undefined,
      avg_internal: s.avg_internal,
      avg_external: s.avg_external,
      max_marks: s.max_marks,
      min_marks: s.min_marks,
      pass_count: s.pass_count,
      fail_count: s.fail_count,
      pass_percentage: s.pass_percentage,
      total_students: s.total_students,
    }));
  },
  getStudentSummary: async (usn: string): Promise<StudentSummary> => {
    const res = await apiFetch<any[]>(`/analytics/student-summary/${usn}`);
    if (!res || res.length === 0) {
      throw new Error('No summary found for this USN');
    }

    const semesters = res.map((s) => ({
      semester: s.semester_number,
      avg: s.average_marks ?? 0,
      highest: s.highest_marks ?? 0,
      lowest: s.lowest_marks ?? 0,
      passed_count: s.subjects_passed ?? 0,
      failed_count: s.subjects_failed ?? 0,
      total_subjects: s.total_subjects ?? 0,
      exam_month: s.exam_month,
      exam_year: s.exam_year,
    }));

    const overall_avg = semesters.length
      ? semesters.reduce((sum, s) => sum + (s.avg || 0), 0) / semesters.length
      : 0;

    return {
      usn: res[0].usn,
      student_name: res[0].student_name,
      semesters,
      overall_avg,
    };
  },
  getTopPerformers: async (
    semester: number,
    subject_code?: string,
    limit = 10,
    opts?: { batch?: string; branch?: string; exam_year?: number; exam_month?: string; rank_by?: 'marks' | 'sgpa' }
  ): Promise<TopPerformer[]> => {
    const res = await apiFetch<any[]>(`/analytics/top-performers/${semester}`, {
      params: { subject_code, limit, ...(opts || {}) },
    });

    const rankBy = opts?.rank_by ?? 'marks';
    const maxMarks = Math.max(...res.map((r) => r.total_marks ?? 0), 0) || 1;
    const maxSgpa = Math.max(...res.map((r) => r.sgpa ?? 0), 0) || 10;

    return res.map((r) => ({
      usn: r.usn,
      student_name: r.student_name ?? r.name ?? '',
      total_marks: r.total_marks ?? 0,
      sgpa: r.sgpa,
      total_credits: r.total_credits,
      subject_code: r.subject_code,
      subject_name: r.subject_name,
      result_status: r.result_status,
      percentage:
        rankBy === 'sgpa'
          ? Math.round((((r.sgpa ?? 0) as number) / maxSgpa) * 100)
          : Math.round(((r.total_marks ?? 0) / maxMarks) * 100),
    }));
  },
  getFailureAnalysis: async (
    semester: number,
    opts?: { batch?: string; branch?: string; exam_year?: number; exam_month?: string }
  ): Promise<FailureAnalysis> => {
    const res = await apiFetch<any>(`/analytics/failure-analysis/${semester}`, { params: opts });
    const subjectFailures = res.subject_wise_failures
      ? Object.entries(res.subject_wise_failures).map(([subject_code, count]) => ({
        subject_code,
        count: Number(count),
      }))
      : [];

    return {
      total_results: res.total_results ?? 0,
      total_failures: res.total_failures ?? 0,
      failure_rate: res.failure_rate ?? 0,
      subject_wise_failures: subjectFailures,
      students_with_failures: res.students_with_failures ?? [],
    };
  },
  getGradeDistribution: async (
    semester: number,
    opts?: { subject_code?: string; batch?: string; branch?: string; exam_year?: number; exam_month?: string }
  ): Promise<Record<string, number>> => {
    return apiFetch<Record<string, number>>(`/analytics/grade-distribution/${semester}`, { params: opts });
  },
  getOverallStatistics: async (opts?: { batch?: string; branch?: string }) => {
    const res = await apiFetch<any>('/analytics/overall-statistics', { params: opts });
    return {
      pass_rate: res.pass_rate ?? 0,
      total_students: res.total_students ?? 0,
      total_records: res.total_records ?? 0,
      average_cgpa: res.average_cgpa ?? 0,
    };
  },

  getSemesterOverview: async (opts?: { batch?: string; branch?: string; exam_year?: number; exam_month?: string }) => {
    return apiFetch<Array<{ batch: string; semester: number; total_records: number; total_students: number; avg_total_marks: number; pass_rate: number }>>(
      '/analytics/semester-overview',
      { params: opts }
    );
  },

  getResultMatrix: async (opts?: { semester?: number; batch?: string; branch?: string; exam_year?: number; exam_month?: string }): Promise<ResultMatrix> => {
    return apiFetch<ResultMatrix>('/analytics/matrix', { params: opts });
  },

  getStudentGpa: async (usn: string) => {
    return apiFetch<{ usn: string; gpa: Array<{ semester: number; total_credits: number; sgpa: number; cgpa: number }> }>(
      `/analytics/student-gpa/${encodeURIComponent(usn)}`
    );
  },

  getBranches: async (batch?: string): Promise<string[]> => {
    return apiFetch<string[]>('/meta/branches', { params: { batch } });
  },

  getSemesters: async (batch?: string, branch?: string): Promise<number[]> => {
    return apiFetch<number[]>('/meta/semesters', { params: { batch, branch } });
  },

  getBatches: async (): Promise<string[]> => {
    return apiFetch<string[]>('/meta/batches');
  },
  getSubjects: async (batch?: string, semester?: number, branch?: string): Promise<Array<{ code: string; name: string }>> => {
    return apiFetch<Array<{ code: string; name: string }>>('/meta/subjects', { params: { batch, semester, branch } });
  },

  getSubjectsWithCredits: async (): Promise<Array<{ code: string; name: string; credits?: number | null }>> => {
    return apiFetch<Array<{ code: string; name: string; credits?: number | null }>>('/meta/subjects');
  },

  setSubjectCreditsBulk: async (items: Array<{ code: string; credits: number | null }>): Promise<{ updated: number; missing: string[]; invalid: string[] }> => {
    return apiFetch('/meta/subjects/credits', {
      method: 'PUT',
      body: JSON.stringify(items),
    });
  },

  getNotifications: async (
    limit = 50
  ): Promise<Array<{ id: number; title: string; detail?: string | null; level: string; created_at?: string | null }>> => {
    return apiFetch('/notifications', { params: { limit } });
  },

  clearNotifications: async (): Promise<{ message: string; cleared: number }> => {
    return apiFetch('/notifications/clear', {
      method: 'DELETE',
      params: { confirm: 'CLEAR_ALL' },
    });
  },

  clearNotification: async (id: number): Promise<{ message: string; id: number }> => {
    return apiFetch(`/notifications/${id}`, { method: 'DELETE' });
  },
  exportUrl: (
    format: 'excel' | 'csv',
    opts?: {
      semester?: number;
      batch?: string;
      branch?: string;
      usn?: string;
      exam_year?: number;
      exam_month?: string;
      subject_code?: string;
    }
  ) => {
    const params: Record<string, string> = {};
    if (opts?.semester !== undefined) params.semester = String(opts.semester);
    if (opts?.batch) params.batch = String(opts.batch);
    if (opts?.branch) params.branch = String(opts.branch);
    if (opts?.usn) params.usn = String(opts.usn);
    if (opts?.exam_year !== undefined) params.exam_year = String(opts.exam_year);
    if (opts?.exam_month) params.exam_month = String(opts.exam_month);
    if (opts?.subject_code) params.subject_code = String(opts.subject_code);

    const q = new URLSearchParams(params).toString();
    return `${API_BASE}/export/${format}${q ? `?${q}` : ''}`;
  },
  updateStudentResult: async (
    usn: string,
    subjectCode: string,
    semester: number,
    data: { internal_marks?: number; external_marks?: number; total_marks?: number; result_status?: string }
  ): Promise<Result> => {
    // Note: The backend expects 'subjectId' but treats it as subject_code logic.
    return apiFetch(`/student/${usn}/subject/${subjectCode}?semester=${semester}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteResult: async (resultId: number): Promise<{ message: string }> => {
    return apiFetch(`/results/${resultId}`, { method: 'DELETE' });
  },
  deleteStudent: async (usn: string): Promise<{ message: string }> => {
    return apiFetch(`/students/${usn}`, { method: 'DELETE' });
  },
  deleteBatch: async (batchId: string): Promise<{ message: string }> => {
    return apiFetch(`/upload/batch/${batchId}`, { method: 'DELETE' });
  },

  purgeCandidate: async (usn: string, batch?: string): Promise<any> => {
    return apiFetch(`/admin/purge/candidate/${encodeURIComponent(usn)}`, {
      method: 'DELETE',
      params: { confirm: 'DELETE', batch },
    });
  },
  purgeSemester: async (semester: number, batch?: string): Promise<any> => {
    return apiFetch(`/admin/purge/semester/${semester}`, {
      method: 'DELETE',
      params: { confirm: 'DELETE', batch },
    });
  },
  purgeAll: async (batch?: string): Promise<any> => {
    return apiFetch(`/admin/purge/all`, {
      method: 'DELETE',
      params: { confirm: 'DELETE_ALL', batch },
    });
  },

  getStudentSgpa: async (
    usn: string,
    semester: number
  ): Promise<{
    usn: string;
    student_name: string;
    semester: number;
    sgpa: number;
    total_credits_passed: number;
    passed_subjects: Array<{
      subject_code: string;
      subject_name: string;
      marks_used: number | null;
      marks_source: string;
      grade_letter: string;
      grade_point: number;
      credits: number;
    }>;
    failed_subjects: Array<{
      subject_code: string;
      subject_name: string;
      marks_used: number | null;
      marks_source: string;
      grade_letter: string;
      grade_point: number;
      credits: number;
    }>;
  }> => {
    return apiFetch(`/students/${encodeURIComponent(usn)}/sgpa`, {
      params: { semester },
    });
  },

  getBatchSgpa: async (
    batch: string,
    semester: number,
    branch?: string
  ): Promise<{
    batch: string;
    semester: number;
    average_sgpa: number;
    students: Array<{
      usn: string;
      student_name: string;
      semester: number;
      sgpa: number;
    }>;
  }> => {
    return apiFetch(`/batches/${encodeURIComponent(batch)}/semester/${semester}/sgpa`, {
      params: { branch },
    });
  },

  getBacklogDistribution: async (
    semester?: number,
    batch?: string,
    branch?: string,
  ): Promise<{
    distribution: Array<{ backlogs: number; count: number }>;
    students: Array<{
      usn: string;
      name: string;
      backlog_count: number;
      failed_subjects: Array<{ code: string; name: string }>;
    }>;
  }> => {
    return apiFetch('/analytics/backlog-distribution', {
      params: { semester, batch, branch },
    });
  },

  getSubjectWiseAnalysis: async (opts?: {
    semester?: number;
    batch?: string;
    branch?: string;
    exam_year?: number;
    exam_month?: string;
  }): Promise<Array<{
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
  }>> => {
    return apiFetch('/analytics/subject-wise', { params: opts });
  },

  getSubjectFailedStudents: async (opts: {
    subject_code: string;
    semester?: number;
    batch?: string;
    branch?: string;
    exam_year?: number;
    exam_month?: string;
  }): Promise<Array<{
    usn: string;
    student_name: string;
    total_marks: number | null;
    internal_marks: number | null;
    external_marks: number | null;
  }>> => {
    return apiFetch('/analytics/subject-wise/failed-students', { params: opts as any });
  },
};
