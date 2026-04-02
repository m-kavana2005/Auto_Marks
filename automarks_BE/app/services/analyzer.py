"""
Data Analysis Service using Pandas and NumPy
Provides analytics and statistical analysis of student results
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Student, Result, Subject, Semester
from app.schemas import (
    SubjectStatistics, SemesterSummary, ResultMatrixResponse,
    StudentHistoryResponse, StudentHistorySemester, StudentHistorySubject, StudentResponse
)
import logging
from openpyxl.styles import PatternFill, Font



logger = logging.getLogger(__name__)

# ============================================================
# SUBJECTS_2025: Reference mapping for 2025 Scheme Subjects
# ============================================================
SUBJECTS_2025 = {
    "1BMATS101": "Calculus and Linear Algebra",
    "1BCHES102": "Applied Chemistry",
    "1BAIA103": "Introduction to Artificial Intelligence",
    "1BENG106": "Communication Skills",
    "1BICO107": "Indian Constitution",
    "1BIDTL158": "Innovation and Design Thinking Lab",
    "1BPLC105B": "Python Programming",
    "1BESC104D": "Introduction to Mechanical Engineering"
}

# ============================================================
# VTU Fixed Subject-Credit Mapping (CBCS 2021 scheme)
# Credits are FIXED per subject code and must NEVER be changed
# or inferred from uploaded PDF data.
# ============================================================
VTU_CREDITS: dict[str, int] = {
    # ---- Semester I (Total = 20) ----
    "BMATS101": 4,
    "BPHYS102": 4,  "BCHES102": 4,
    "BPOPS103": 3,  "BCEDK103": 3,
    "BESCK104A": 3, "BESCK104B": 3, "BESCK104C": 3, "BESCK104D": 3,
    "BESCK104E": 3,
    "BETCK105A": 3, "BETCK105B": 3, "BETCK105C": 3, "BETCK105D": 3,
    "BPLCK105A": 3, "BPLCK105B": 3,
    "BENGK106": 1,  "BPWSK106": 1,
    "BICOK107": 1,  "BKSKK107": 1,  "BKBKK107": 1,
    "BIDTK158": 1,  "BSFHK158": 1,
    # ---- Semester II (Total = 20) ----
    "BMATS201": 4,
    "BCHES202": 4,  "BPHYS202": 4,
    "BCEDK203": 3,  "BPOPS203": 3,
    "BESCK204A": 3, "BESCK204B": 3, "BESCK204C": 3, "BESCK204D": 3,
    "BESCK204E": 3,
    "BPLCK205A": 3, "BPLCK205B": 3,
    "BETCK205A": 3, "BETCK205B": 3,
    "BENGK206": 1,  "BPWSK206": 1,
    "BICOK207": 1,  "BKSKK207": 1,  "BKBKK207": 1,
    "BIDTK258": 1,  "BSFHK258": 1,
    # ---- Semester III (Total = 21) ----
    "BCS301": 4,
    "BCS302": 4,
    "BCS303": 4,
    "BCS304": 3,
    "BCSL305": 1,
    "BCS306A": 3, "BCS306B": 3, "BCS306C": 3,
    "BXX306A": 3, "BXX306B": 3, "BXX306C": 3,
    "BSCK307": 1,
    "BCS358A": 1, "BCS358B": 1, "BCS358C": 1,
    "BXX358A": 1, "BXX358B": 1,
    # ---- Semester IV (Total = 19) ----
    "BCS401": 3,
    "BAI402": 4,
    "BCS403": 4,
    "BCSL404": 1,
    "BCS405A": 3, "BCS405B": 3, "BCS405C": 3,
    "BXX405A": 3, "BXX405B": 3,
    "BBOK407": 2,
    "BUHK408": 1,
    "BDS456A": 1, "BDS456B": 1,
    "BXX456A": 1,
    # ---- Semester V (Total = 22) ----
    "BCS501": 3,
    "BCS502": 4,
    "BCS503": 4,
    "BAIL504": 1,
    "BCS515A": 3, "BCS515B": 3, "BCS515C": 3,
    "BXX515A": 3, "BXX515B": 3, "BXX515C": 3,
    "BAD586": 2,
    "BRMK557": 3,
    "BCS508": 2,
    # ---- Semester VI (Total = 18) ----
    "BAD601": 4,
    "BCS602": 4,
    "BCS613A": 3, "BCS613B": 3, "BCS613C": 3,
    "BXX613A": 3, "BXX613B": 3, "BXX613C": 3,
    "BCS654A": 3, "BCS654B": 3,
    "BXX654A": 3, "BXX654B": 3,
    "BAD685": 2,
    "BCSL606": 1,
    "BCS657A": 1, "BCS657B": 1,
    "BXX657A": 1,
    # ---- Semester VII (Total = 24) ----
    "BAI701": 4,
    "BAD702": 4,
    "BAD703": 4,
    "BAD714A": 3, "BAD714B": 3, "BAD714C": 3,
    "BAD755A": 3, "BAD755B": 3, "BAD755C": 3,
    "BAD786": 6,
    # ---- Semester VIII (Total = 16) ----
    "BAD811A": 3, "BAD811B": 3, "BAD811C": 3,
    "BAD812A": 3, "BAD812B": 3, "BAD812C": 3,
    "BAD883": 10,
}

# Generic suffix-stripped fallback credits per semester
# Used when a subject code variant (e.g. BESCK104X) is not in VTU_CREDITS.
_VTU_SEM_DEFAULTS: dict[int, dict[str, int]] = {
    1:  {"BMATS": 4, "BPHYS": 4, "BCHES": 4, "BPOPS": 3, "BCEDK": 3,
         "BESCK": 3, "BETCK": 3, "BPLCK": 3, "BENGK": 1, "BPWSK": 1,
         "BICOK": 1, "BKSKK": 1, "BKBKK": 1, "BIDTK": 1, "BSFHK": 1},
    2:  {"BMATS": 4, "BPHYS": 4, "BCHES": 4, "BPOPS": 3, "BCEDK": 3,
         "BESCK": 3, "BETCK": 3, "BPLCK": 3, "BENGK": 1, "BPWSK": 1,
         "BICOK": 1, "BKSKK": 1, "BKBKK": 1, "BIDTK": 1, "BSFHK": 1},
    3:  {"BCS30": 4, "BCSL": 1, "BSCK": 1, "BXX30": 3, "BCS35": 1, "BXX35": 1},
    4:  {"BCS40": 3, "BAI40": 4, "BCSL": 1, "BXX40": 3, "BBOK": 2, "BUHK": 1,
         "BDS45": 1, "BXX45": 1},
    5:  {"BCS50": 4, "BAIL": 1, "BXX51": 3, "BAD5": 2, "BRMK": 3},
    6:  {"BAD60": 4, "BCS60": 4, "BXX61": 3, "BXX65": 3, "BAD68": 2,
         "BCSL": 1, "BXX65": 1},
    7:  {"BAI70": 4, "BAD70": 4, "BAD71": 3, "BAD75": 3, "BAD78": 6},
    8:  {"BAD81": 3, "BAD81": 3, "BAD88": 10},
}


class ResultAnalyzer:
    """
    Analyzes student results using pandas and numpy
    """

    def __init__(self, db: Session):
        self.db = db

    # ---------------- UTILS ---------------- #

    @staticmethod
    def _marks_to_percentage(total_marks: Optional[float]) -> Optional[float]:
        if total_marks is None or pd.isna(total_marks):
            return None
        m = float(total_marks)
        if m <= 100:
            return m
        if m <= 150:
            return (m / 150) * 100
        if m <= 200:
            return (m / 200) * 100
        return min(m, 100)

    @staticmethod
    def _percentage_to_grade_points(percent: Optional[float], result_status: Optional[str]) -> int:
        if percent is None or pd.isna(percent):
            return 0
        if str(result_status or "").upper() not in {"", "P", "PASS"}:
            return 0

        if percent >= 90: return 10
        if percent >= 80: return 9
        if percent >= 70: return 8
        if percent >= 60: return 7
        if percent >= 50: return 6
        if percent >= 45: return 5
        if percent >= 40: return 4
        return 0

    @staticmethod
    def _get_vtu_credits(subject_code: str, semester: Optional[int] = None) -> int:
        """
        Return the FIXED VTU credit value for a subject code.
        Lookup order:
          1. Exact match in VTU_CREDITS
          2. Upper-cased exact match
          3. Prefix match in _VTU_SEM_DEFAULTS for the given semester
          4. Fallback: 3 credits (most common for theory papers)
        Credits from the database are NEVER used.
        """
        code = (subject_code or "").strip().upper()
        if code in VTU_CREDITS:
            return VTU_CREDITS[code]
        # Try prefix matching from semester-specific defaults
        if semester and semester in _VTU_SEM_DEFAULTS:
            for prefix, credits in _VTU_SEM_DEFAULTS[semester].items():
                if code.startswith(prefix.upper()):
                    return credits
        # Universal fallback: scan all VTU_CREDITS for a prefix match
        for key, credits in VTU_CREDITS.items():
            if code.startswith(key[:-1]):
                return credits
        return 3  # Default fallback

    @staticmethod
    def _percentage_to_grade_letter(percent: Optional[float], result_status: Optional[str]) -> str:
        if str(result_status or "").upper() not in {"", "P", "PASS"}:
            return "F"
        if percent is None or pd.isna(percent):
            return "F"
        
        if percent >= 90: return "O"
        if percent >= 80: return "S"
        if percent >= 70: return "A"
        if percent >= 60: return "B"
        if percent >= 50: return "C"
        if percent >= 45: return "D"
        if percent >= 40: return "E"
        return "F"


    # ---------------- DATAFRAME ---------------- #

    def get_results_dataframe(
        self,
        semester: Optional[int] = None,
        usn: Optional[str] = None,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        subject_code: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None,
    ) -> pd.DataFrame:

        query = self.db.query(
            Student.usn,
            Student.student_name,
            Student.batch,
            Student.branch,
            Semester.semester_number,
            Semester.exam_month,
            Semester.exam_year,
            Subject.id,
            Subject.subject_code,
            func.coalesce(Result.subject_name, Subject.subject_name).label('subject_name'),
            Subject.credits,
            Result.internal_marks,
            Result.external_marks,
            Result.total_marks,
            Result.result_status,
            Result.announced_date
        ).join(Result.student).join(Result.semester).join(Result.subject)

        if semester:
            query = query.filter(Semester.semester_number == semester)
        if usn:
            query = query.filter(Student.usn == usn)
        if batch:
            query = query.filter(Student.batch == batch)
        if branch:
            query = query.filter(Student.branch == branch)
        if subject_code:
            query = query.filter(Subject.subject_code == subject_code)
        if exam_year:
            query = query.filter(Semester.exam_year == exam_year)
        if exam_month:
            query = query.filter(Semester.exam_month.ilike(exam_month))

        results = query.all()

        df = pd.DataFrame(results, columns=[
            'usn', 'student_name', 'batch', 'branch', 'semester', 'exam_month', 'exam_year',
            'subject_id', 'subject_code', 'subject_name', 'credits',
            'internal_marks', 'external_marks', 'total_marks',
            'result_status', 'announced_date'
        ])

        return df

    # ---------------- SUBJECT STATS ---------------- #

    # ---------------- SUBJECT STATS ---------------- #

    def get_subject_statistics(
        self,
        semester: int,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None
    ) -> List[SubjectStatistics]:
        df = self.get_results_dataframe(
            semester=semester,
            batch=batch,
            branch=branch,
            exam_year=exam_year,
            exam_month=exam_month
        )
        if df.empty:
            return []

        stats = []
        for code in df['subject_code'].unique():
            s = df[df['subject_code'] == code]

            # Guard against all-NaN columns (NULL marks in DB) to avoid int(NaN) ValueError
            total = pd.to_numeric(s['total_marks'], errors='coerce')
            internal = pd.to_numeric(s['internal_marks'], errors='coerce')
            external = pd.to_numeric(s['external_marks'], errors='coerce')

            avg_total   = float(total.mean())   if not total.isnull().all()    else None
            avg_int     = float(internal.mean()) if not internal.isnull().all() else None
            avg_ext     = float(external.mean()) if not external.isnull().all() else None
            max_marks   = int(total.max())       if not total.isnull().all()    else None
            min_marks   = int(total.min())       if not total.isnull().all()    else None

            stats.append(SubjectStatistics(
                subject_code=code,
                subject_name=s['subject_name'].iloc[0],
                total_students=len(s),
                avg_internal=avg_int,
                avg_external=avg_ext,
                avg_total=avg_total,
                max_marks=max_marks,
                min_marks=min_marks,
                pass_count=int((s['result_status'] == 'P').astype(int).sum()),
                fail_count=int((s['result_status'] == 'F').astype(int).sum()),
                pass_percentage=float((s['result_status'] == 'P').astype(int).mean() * 100)
            ))
        return stats

    # ---------------- SUBJECT-WISE ANALYSIS ---------------- #

    def get_subject_wise_analysis(
        self,
        semester: Optional[int] = None,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None,
    ) -> list:
        """
        Returns subject-wise performance analysis for the given filters.
        Subject names are taken directly from the result data (PDF-extracted)
        so that both 2022 and 2025 scheme subjects are handled correctly.
        """
        from app.schemas import SubjectWiseAnalysis

        df = self.get_results_dataframe(
            semester=semester,
            batch=batch,
            branch=branch,
            exam_year=exam_year,
            exam_month=exam_month,
        )

        if df.empty:
            return []

        result = []
        # Group by subject_code; pick the most-common subject_name within the group
        for code, group in df.groupby('subject_code'):
            total = pd.to_numeric(group['total_marks'], errors='coerce')
            appeared = len(group)
            passed = int((group['result_status'] == 'P').astype(int).sum())
            failed = int((group['result_status'] == 'F').astype(int).sum())

            result.append(SubjectWiseAnalysis(
                subject_code=str(code),
                # Use the most-frequently occurring subject_name (mirrors exact PDF text)
                subject_name=group['subject_name'].mode().iloc[0] if not group['subject_name'].empty else str(code),
                students_appeared=appeared,
                students_passed=passed,
                students_failed=failed,
                pass_percentage=round((passed / appeared) * 100, 2) if appeared > 0 else 0.0,
                fail_percentage=round((failed / appeared) * 100, 2) if appeared > 0 else 0.0,
                average_marks=round(float(total.mean()), 2) if not total.isnull().all() else None,
                highest_marks=int(total.max()) if not total.isnull().all() else None,
                lowest_marks=int(total.min()) if not total.isnull().all() else None,
            ))

        # Sort by subject_code ascending
        result.sort(key=lambda x: x.subject_code)
        return result


    # ---------------- STUDENT SUMMARY ---------------- #

    def get_student_summary(self, usn: str) -> List[SemesterSummary]:
        df = self.get_results_dataframe(usn=usn)
        if df.empty:
            return []

        summaries = []
        # Group by semester attempt (semester + exam session)
        # Note: A student might have multiple attempts for same semester.
        # This summary is per exam session.
        for (semester, exam_year, exam_month), group in df.groupby(['semester', 'exam_year', 'exam_month']):
            
            total_subjects = len(group)
            subjects_passed = int((group["result_status"] == "P").astype(int).sum())
            subjects_failed = int((group["result_status"] == "F").astype(int).sum())
            
            # Basic aggregate stats
            avg_marks = float(group["total_marks"].mean()) if not group["total_marks"].isnull().all() else 0.0
            highest_marks = int(group["total_marks"].max()) if not group["total_marks"].isnull().all() else 0
            lowest_marks = int(group["total_marks"].min()) if not group["total_marks"].isnull().all() else 0

            summaries.append(SemesterSummary(
                usn=usn,
                student_name=group["student_name"].iloc[0],
                semester_number=semester,
                exam_month=exam_month,
                exam_year=exam_year,
                total_subjects=total_subjects,
                subjects_passed=subjects_passed,
                subjects_failed=subjects_failed,
                average_marks=avg_marks,
                highest_marks=highest_marks,
                lowest_marks=lowest_marks
            ))
            
        # Sort by semester then year then month
        summaries.sort(key=lambda x: (x.semester_number, x.exam_year or 0, x.exam_month or ""))
        return summaries

    # ---------------- GPA CALCULATION ---------------- #

    def get_student_gpa_progression(self, usn: str) -> List[Dict]:
        df = self.get_results_dataframe(usn=usn)
        if df.empty:
            return []

        # Calculate Grade Points based on percentage
        def calculate_gp(row):
            pct = self._marks_to_percentage(row['total_marks'])
            return self._percentage_to_grade_points(pct, row['result_status'])

        df['grade_points'] = df.apply(calculate_gp, axis=1)

        # Apply FIXED VTU credits — DB credits are intentionally ignored
        df['vtu_credits'] = df.apply(
            lambda r: self._get_vtu_credits(r['subject_code'], r['semester']), axis=1
        )
        df['credits_earned'] = df.apply(
            lambda r: r['vtu_credits'] if str(r['result_status']).upper() in ('P', 'PASS') else 0, axis=1
        )

        progression = []
        cumulative_credits = 0
        cumulative_weighted_gp = 0

        semesters = sorted(df['semester'].unique())

        for sem in semesters:
            sem_data = df[df['semester'] == sem]

            # Latest attempt only per subject (sort desc by exam session)
            sem_data = sem_data.sort_values(['exam_year', 'exam_month'], ascending=[False, False])
            latest = sem_data.drop_duplicates(subset=['subject_code'], keep='first')

            total_sem_credits = latest['vtu_credits'].sum()
            total_sem_weighted_gp = (latest['grade_points'] * latest['vtu_credits']).sum()

            sgpa = round(total_sem_weighted_gp / total_sem_credits, 2) if total_sem_credits > 0 else 0.0

            cumulative_credits += total_sem_credits
            cumulative_weighted_gp += total_sem_weighted_gp
            cgpa = round(cumulative_weighted_gp / cumulative_credits, 2) if cumulative_credits > 0 else 0.0

            progression.append({
                "semester": int(sem),
                "sgpa": sgpa,
                "cgpa": cgpa,
                "credits_registered": int(total_sem_credits),
                "credits_earned": int(latest['credits_earned'].sum())
            })

        return progression

    # ---------------- TOP PERFORMERS ---------------- #

    def get_top_performers(
        self,
        semester: int,
        subject_code: Optional[str] = None,
        limit: int = 10,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None,
        rank_by: str = "marks"
    ) -> List[Dict]:
        
        df = self.get_results_dataframe(
            semester=semester,
            subject_code=subject_code,
            batch=batch,
            branch=branch,
            exam_year=exam_year,
            exam_month=exam_month
        )

        if df.empty:
            return []

        top_students = []

        if subject_code:
            # Rank by marks in specific subject
            # Sort by total_marks desc
            ranked = df.sort_values('total_marks', ascending=False).head(limit)
            
            for _, row in ranked.iterrows():
                top_students.append({
                    "rank": len(top_students) + 1,
                    "usn": row['usn'],
                    "student_name": row['student_name'],
                    "total_marks": int(row['total_marks']) if pd.notna(row['total_marks']) else 0,
                    "score": int(row['total_marks']) if pd.notna(row['total_marks']) else 0,
                    "result_status": row['result_status']
                })

        else:
            # Rank by total semester marks or SGPA using FIXED VTU credits
            student_stats = []

            for (usn, name), group in df.groupby(['usn', 'student_name']):
                total_marks = group['total_marks'].sum()

                # Use FIXED VTU credits — ignore DB credits
                sem_val = group['semester'].iloc[0] if not group.empty else None

                def calc_gp(r):
                    pct = self._marks_to_percentage(r['total_marks'])
                    return self._percentage_to_grade_points(pct, r['result_status'])

                fixed_credits = group.apply(
                    lambda r: self._get_vtu_credits(r['subject_code'], r['semester']), axis=1
                )
                weighted_gp = (group.apply(calc_gp, axis=1) * fixed_credits).sum()
                total_credits = fixed_credits.sum()

                sgpa = round(weighted_gp / total_credits, 2) if total_credits > 0 else 0.0

                student_stats.append({
                    "usn": usn,
                    "student_name": name,
                    "total_marks": int(total_marks),
                    "sgpa": sgpa,
                    "section": group['batch'].iloc[0] if 'batch' in group.columns else None
                })

            # Sort
            if rank_by == "sgpa":
                student_stats.sort(key=lambda x: x['sgpa'], reverse=True)
            else:
                student_stats.sort(key=lambda x: x['total_marks'], reverse=True)

            # Take top N
            for i, s in enumerate(student_stats[:limit]):
                s['rank'] = i + 1
                s['score'] = s['sgpa'] if rank_by == "sgpa" else s['total_marks']
                top_students.append(s)

        return top_students

    # ---------------- STUDENT PIVOT ---------------- #

    def _create_student_pivot(self, df: pd.DataFrame) -> pd.DataFrame:
        pivot_data = []

        for (usn, name, batch, branch, semester), group in df.groupby(
            ['usn', 'student_name', 'batch', 'branch', 'semester']
        ):
            row = {
                "USN": usn,
                "Student Name": name,
                "Batch": batch,
                "Branch": branch,
                "Semester": semester,
                "Total_Marks": group["total_marks"].sum(),
                "Subjects_Passed": int((group["result_status"] == "P").astype(int).sum()),
                "Subjects_Failed": int((group["result_status"] == "F").astype(int).sum()),
            }

            for _, r in group.iterrows():
                row[f"{r.subject_code}_Total"] = r.total_marks

            pivot_data.append(row)

        return pd.DataFrame(pivot_data)

    # ---------------- EXPORT CSV ---------------- #

    def export_to_csv(
        self,
        output_path: str,
        semester: Optional[int] = None,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        usn: Optional[str] = None,
        subject_code: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None,
    ):
        df = self.get_results_dataframe(
            semester=semester,
            usn=usn,
            batch=batch,
            branch=branch,
            subject_code=subject_code,
            exam_year=exam_year,
            exam_month=exam_month,
        )
        if df.empty:
            logger.warning("No data to export")
            return

        pivot = self._create_student_pivot(df)

        # ── CSV cannot store colors, so insert a plain-text RESULT column ──
        # Insert right after Subjects_Failed so it's immediately visible.
        fail_col_idx = pivot.columns.get_loc("Subjects_Failed") + 1
        pivot.insert(
            fail_col_idx,
            "Overall_Result",
            pivot["Subjects_Failed"].apply(lambda f: "FAIL" if f > 0 else "PASS"),
        )

        pivot.to_csv(output_path, index=False)
        logger.info(f"CSV exported to {output_path}")


    # ---------------- EXPORT EXCEL ---------------- #

    def export_to_excel(
        self,
        output_path: str,
        semester: Optional[int] = None,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        usn: Optional[str] = None,
        subject_code: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None,
    ):
        from openpyxl.styles import PatternFill, Font, Alignment
        from openpyxl import load_workbook

        df = self.get_results_dataframe(
            semester=semester,
            usn=usn,
            batch=batch,
            branch=branch,
            subject_code=subject_code,
            exam_year=exam_year,
            exam_month=exam_month,
        )
        if df.empty:
            logger.warning("No data to export")
            return

        pivot = self._create_student_pivot(df)

        # Write to Excel first, then apply styling
        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            pivot.to_excel(writer, sheet_name="Student View", index=False)

        # ── Apply row-level colour using openpyxl ──────────────────────────
        RED_FILL   = PatternFill(start_color="FFCDD2", end_color="FFCDD2", fill_type="solid")  # light red
        GREEN_FILL = PatternFill(start_color="C8E6C9", end_color="C8E6C9", fill_type="solid")  # light green
        HEADER_FILL = PatternFill(start_color="1A237E", end_color="1A237E", fill_type="solid") # dark indigo
        HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
        FAIL_FONT = Font(bold=True, color="B71C1C")   # dark red text for failed rows

        wb = load_workbook(output_path)
        ws = wb["Student View"]

        # Find the column index for "Subjects_Failed" (1-indexed in openpyxl)
        col_names = [cell.value for cell in ws[1]]
        try:
            failed_col_idx = col_names.index("Subjects_Failed") + 1  # 1-based
        except ValueError:
            failed_col_idx = None

        max_col = ws.max_column

        # Style header row
        for cell in ws[1]:
            cell.fill = HEADER_FILL
            cell.font = HEADER_FONT
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Style data rows
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
            is_failed = False
            if failed_col_idx:
                fail_val = row[failed_col_idx - 1].value  # 0-indexed list
                is_failed = isinstance(fail_val, (int, float)) and fail_val > 0

            fill = RED_FILL if is_failed else GREEN_FILL
            for cell in row:
                cell.fill = fill
                if is_failed:
                    cell.font = FAIL_FONT

        # Auto-fit column widths
        for col in ws.columns:
            max_len = max((len(str(c.value or "")) for c in col), default=10)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 40)

        wb.save(output_path)
        logger.info(f"Excel exported to {output_path} (with row highlighting)")


    # ---------------- OVERALL STATS ---------------- #

    def get_overall_statistics(self, batch: Optional[str] = None, branch: Optional[str] = None) -> Dict:
        """
        Calculate overall statistics: pass rate, total students, total records, average CGPA.
        """
        df = self.get_results_dataframe(batch=batch, branch=branch)
        
        if df.empty:
            return {
                "pass_rate": 0,
                "total_students": 0,
                "total_records": 0,
                "average_cgpa": 0
            }

        total_students = int(df['usn'].nunique())
        total_records = len(df)
        
        # Pass Rate (Result level)
        # Using 'P' as the indicator for pass
        pass_count = (df['result_status'].str.upper() == 'P').sum()
        pass_rate = (pass_count / total_records * 100) if total_records > 0 else 0
        
        # Average CGPA calculation using FIXED VTU credits
        def calc_gp(row):
            pct = self._marks_to_percentage(row['total_marks'])
            return self._percentage_to_grade_points(pct, row['result_status'])

        df['grade_points'] = df.apply(calc_gp, axis=1)
        df['vtu_credits'] = df.apply(
            lambda r: self._get_vtu_credits(r['subject_code'], r.get('semester')), axis=1
        )

        # Calculate average GPA per student using fixed credits
        student_gpas = []
        for usn, group in df.groupby('usn'):
            total_credits = group['vtu_credits'].sum()
            weighted_points = (group['grade_points'] * group['vtu_credits']).sum()
            if total_credits > 0:
                student_gpas.append(weighted_points / total_credits)

        # Data-wide average CGPA
        average_cgpa = sum(student_gpas) / len(student_gpas) if student_gpas else 0
        
        return {
            "pass_rate": round(pass_rate, 2),
            "total_students": total_students,
            "total_records": total_records,
            "average_cgpa": round(average_cgpa, 2)
        }

    # ---------------- FAILURE ANALYSIS ---------------- #

    def get_failure_analysis(
        self,
        semester: int,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None
    ) -> Dict:
        df = self.get_results_dataframe(
            semester=semester,
            batch=batch,
            branch=branch,
            exam_year=exam_year,
            exam_month=exam_month
        )

        if df.empty:
            return {
                "total_results": 0,
                "total_failures": 0,
                "failure_rate": 0.0,
                "subject_wise_failures": {},
                "students_with_failures": []
            }

        # 1. Subject-wise failures
        subject_failures = {}
        for code in df['subject_code'].unique():
            s = df[df['subject_code'] == code]
            fail_count = int((s['result_status'] == 'F').astype(int).sum())
            if fail_count > 0:
                subject_failures[code] = fail_count

        # 2. Student-wise failures
        students_failed = []
        total_students = df['usn'].nunique()
        failed_student_count = 0

        for (usn, name), group in df.groupby(['usn', 'student_name']):
            failed_subjects = group[group['result_status'] == 'F']
            f_count = len(failed_subjects)
            if f_count > 0:
                failed_student_count += 1
                students_failed.append({
                    "usn": usn,
                    "name": name,
                    "failed_subjects_count": f_count,
                    "failed_subjects": failed_subjects['subject_code'].tolist()
                })

        # Sort by failure count desc
        students_failed.sort(key=lambda x: x['failed_subjects_count'], reverse=True)

        return {
            "total_results": total_students,
            "total_failures": failed_student_count,
            "failure_rate": round((failed_student_count / total_students * 100), 2) if total_students > 0 else 0.0,
            "subject_wise_failures": subject_failures,
            "students_with_failures": students_failed
        }

    # ---------------- GRADE DISTRIBUTION ---------------- #

    def get_grade_distribution(
        self,
        semester: int,
        subject_code: Optional[str] = None,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None
    ) -> Dict[str, int]:
        df = self.get_results_dataframe(
            semester=semester,
            subject_code=subject_code,
            batch=batch,
            branch=branch,
            exam_year=exam_year,
            exam_month=exam_month
        )

        distribution = {"O": 0, "S": 0, "A": 0, "B": 0, "C": 0, "D": 0, "E": 0, "F": 0}
        
        if df.empty:
            return distribution

        def map_grade(row):
            pct = self._marks_to_percentage(row['total_marks'])
            return self._percentage_to_grade_letter(pct, row['result_status'])

        grades = df.apply(map_grade, axis=1)
        counts = grades.value_counts().to_dict()
        
        for g, count in counts.items():
            if g in distribution:
                distribution[g] = count
            else:
                 # Handle unexpected
                 pass

        return distribution

    # ---------------- MATRIX VIEW ---------------- #

    def get_result_matrix(
        self,
        semester: Optional[int] = None,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
        exam_year: Optional[int] = None,
        exam_month: Optional[str] = None
    ) -> ResultMatrixResponse:
        
        df = self.get_results_dataframe(
            semester=semester,
            batch=batch,
            branch=branch,
            exam_year=exam_year,
            exam_month=exam_month
        )

        if df.empty:
            return ResultMatrixResponse(
                columns=[],
                data=[],
                summary={"total_students": 0, "passed": 0, "failed": 0}
            )

        # 1. Identify all unique subjects in this view (sorted by code)
        subjects = df[['subject_code', 'subject_name']].drop_duplicates().sort_values('subject_code')
        columns = [{"code": r.subject_code, "name": r.subject_name} for _, r in subjects.iterrows()]
        
        # 2. Group by Student (USN)
        student_data = []
        
        # Pre-aggregation stats
        pass_students = 0
        fail_students = 0
        
        # Group by USN
        grouped = df.groupby(['usn', 'student_name'])
        
        for (usn, name), group in grouped:
            
            # Student-level pass/fail logic:
            # A student passes if ALL subjects in this view have result_status='P'
            statuses = group['result_status'].fillna('F').str.upper()
            is_pass = (statuses == 'P').all() and (len(statuses) > 0)
            
            if is_pass:
                pass_students += 1
            else:
                fail_students += 1
                
            student_entry = {
                "usn": usn,
                "name": name,
                "total_marks": int(group['total_marks'].sum()),
                "result": "PASS" if is_pass else "FAIL"
            }
            
            # Add subject specific data
            for _, row in group.iterrows():
                sub_code = row['subject_code']
                student_entry[sub_code] = {
                    "internal": int(row['internal_marks']) if pd.notna(row['internal_marks']) else None,
                    "external": int(row['external_marks']) if pd.notna(row['external_marks']) else None,
                    "total": int(row['total_marks']) if pd.notna(row['total_marks']) else None,
                    "result": row['result_status'],
                    "credits": int(row['credits']) if pd.notna(row['credits']) else 0
                }
            
            student_data.append(student_entry)
            
        # 3. Sort by USN ascending
        student_data.sort(key=lambda x: x['usn'])
        
        return ResultMatrixResponse(
            columns=columns,
            data=student_data,
            summary={
                "total_students": len(student_data),
                "passed": pass_students,
                "failed": fail_students
            }
        )

    # ---------------- COMPREHENSIVE HISTORY ---------------- #

    def get_student_comprehensive_history(self, usn: str) -> Optional[StudentHistoryResponse]:
        """
        Get comprehensive history for a student including all semesters, subjects, marks, and GPA progression.
        """
        # 1. Fetch Student Info
        student = self.db.query(Student).filter(Student.usn == usn).first()
        if not student:
            return None

        # 2. Fetch Results Dataframe
        df = self.get_results_dataframe(usn=usn)
        if df.empty:
            # Return empty structure if student exists but no results
            return StudentHistoryResponse(
                student=StudentResponse.from_orm(student),
                history=[],
                overall_cgpa=0.0,
                total_credits_earned=0,
                sgpa_trend=[],
                marks_distribution=[]
            )

        # 3. Process Data — use FIXED VTU credits (never database credits)
        def calculate_gp(row):
            pct = self._marks_to_percentage(row['total_marks'])
            return self._percentage_to_grade_points(pct, row['result_status'])

        df['grade_points'] = df.apply(calculate_gp, axis=1)
        # Fixed VTU credits per subject code
        df['vtu_credits'] = df.apply(
            lambda r: self._get_vtu_credits(r['subject_code'], r['semester']), axis=1
        )
        df['credits_earned'] = df.apply(
            lambda r: r['vtu_credits'] if str(r['result_status']).upper() in ('P', 'PASS') else 0, axis=1
        )

        history_semesters: List[StudentHistorySemester] = []
        sgpa_trend = []
        marks_distribution = []

        cumulative_credits = 0
        cumulative_weighted_gp = 0

        semesters = sorted(df['semester'].unique())

        for sem in semesters:
            sem_data = df[df['semester'] == sem]

            # Latest attempt per subject (sort by exam session descending)
            sem_data = sem_data.sort_values(['exam_year', 'exam_month'], ascending=[False, False])
            latest_subjects = sem_data.drop_duplicates(subset=['subject_code'], keep='first')

            total_sem_credits = latest_subjects['vtu_credits'].sum()
            total_sem_weighted_gp = (latest_subjects['grade_points'] * latest_subjects['vtu_credits']).sum()
            sem_credits_earned = latest_subjects['credits_earned'].sum()

            sgpa = round(total_sem_weighted_gp / total_sem_credits, 2) if total_sem_credits > 0 else 0.0

            cumulative_credits += total_sem_credits
            cumulative_weighted_gp += total_sem_weighted_gp
            cgpa = round(cumulative_weighted_gp / cumulative_credits, 2) if cumulative_credits > 0 else 0.0

            subjects_list: List[StudentHistorySubject] = []

            for _, row in latest_subjects.iterrows():
                fixed_cr = int(row['vtu_credits'])
                marks_distribution.append({
                    "subject_code": row['subject_code'],
                    "subject_name": row['subject_name'],
                    "credits": fixed_cr,
                    "total_marks": int(row['total_marks']) if pd.notna(row['total_marks']) else 0,
                    "semester": int(sem),
                    "result": row['result_status']
                })

                subjects_list.append(StudentHistorySubject(
                    subject_code=row['subject_code'],
                    subject_name=row['subject_name'],
                    credits=fixed_cr,
                    internal_marks=int(row['internal_marks']) if pd.notna(row['internal_marks']) else None,
                    external_marks=int(row['external_marks']) if pd.notna(row['external_marks']) else None,
                    total_marks=int(row['total_marks']) if pd.notna(row['total_marks']) else None,
                    result_status=row['result_status'],
                    exam_period=f"{row['exam_month']} {int(row['exam_year'])}" if pd.notna(row['exam_year']) else None
                ))

            history_semesters.append(StudentHistorySemester(
                semester=int(sem),
                total_credits_registered=int(total_sem_credits),
                total_credits_earned=int(sem_credits_earned),
                sgpa=sgpa,
                cgpa=cgpa,
                subjects=subjects_list
            ))

            sgpa_trend.append({
                "semester": int(sem),
                "sgpa": sgpa,
                "cgpa": cgpa,
                "credits_earned": int(sem_credits_earned)
            })

        overall_cgpa = sgpa_trend[-1]["cgpa"] if sgpa_trend else 0.0
        total_earned = sum(s.total_credits_earned for s in history_semesters) # Or strictly cumulative logic

        return StudentHistoryResponse(
            student=StudentResponse.from_orm(student),
            history=history_semesters,
            overall_cgpa=round(overall_cgpa, 2),
            total_credits_earned=total_earned,
            sgpa_trend=sgpa_trend,
            marks_distribution=marks_distribution
        )

    # ---------------- SEMESTER SGPA (Selected Semester Only) ---------------- #

    def get_semester_sgpa(self, usn: str, semester: int):
        """
        Calculate SGPA for a single selected semester only.

        Priority for marks/pass-status per subject:
          1. result_status == 'P'  →  student passed (use total_marks, note marks_source)
          2. Otherwise            →  subject is failed / backlog (excluded from SGPA)

        The marks_source column ('original' | 'rv' | 'final') indicates how the
        student achieved the current result_status.  The RV upload already overwrites
        total_marks and result_status AND sets marks_source = 'rv', so this method
        simply reads what is in the DB.

        SGPA = Σ(grade_point × credits) / Σ(credits of passed subjects only)
        Failed / backlog subjects are returned in a separate list for display but are
        NOT included in the denominator or numerator.

        Returns an SGPAResponse (schema defined in schemas.py).
        """
        from app.schemas import SGPASubjectDetail, SGPAResponse

        # ── 1. Fetch student ───────────────────────────────────────────────────
        student = self.db.query(Student).filter(Student.usn == usn).first()
        if not student:
            return None

        # ── 2. Fetch all result rows for this USN + semester ──────────────────
        rows = (
            self.db.query(
                Subject.subject_code,
                func.coalesce(Result.subject_name, Subject.subject_name).label('subject_name'),
                Result.total_marks,
                Result.result_status,
                Result.marks_source,
                Semester.semester_number,
                Semester.exam_year,
                Semester.exam_month,
            )
            .join(Result.student)
            .join(Result.semester)
            .join(Result.subject)
            .filter(Student.usn == usn)
            .filter(Semester.semester_number == semester)
            .all()
        )

        if not rows:
            return SGPAResponse(
                usn=usn,
                student_name=student.student_name,
                semester=semester,
                sgpa=0.0,
                total_credits_passed=0,
                passed_subjects=[],
                failed_subjects=[],
            )

        # ── 3. De-duplicate: keep the latest exam attempt per subject ─────────
        # Build a dict keyed by subject_code, preferring the most recent session
        latest: dict = {}
        for row in rows:
            code = row.subject_code
            if code not in latest:
                latest[code] = row
            else:
                # Compare exam sessions; keep the newer one
                existing = latest[code]
                newer = False
                if (row.exam_year or 0) > (existing.exam_year or 0):
                    newer = True
                elif (row.exam_year or 0) == (existing.exam_year or 0):
                    if (row.exam_month or "") > (existing.exam_month or ""):
                        newer = True
                if newer:
                    latest[code] = row

        # ── 4. Classify passed vs. failed and build detail records ────────────
        passed_subjects: list[SGPASubjectDetail] = []
        failed_subjects: list[SGPASubjectDetail] = []

        for code, row in latest.items():
            status = str(row.result_status or "").upper()
            is_passed = status in ("P", "PASS")

            marks = row.total_marks
            source = row.marks_source or "original"

            credits = self._get_vtu_credits(code, semester)
            pct = self._marks_to_percentage(marks) if is_passed else None
            gp = self._percentage_to_grade_points(pct, row.result_status) if is_passed else 0
            gl = self._percentage_to_grade_letter(pct, row.result_status) if is_passed else "F"

            detail = SGPASubjectDetail(
                subject_code=code,
                subject_name=row.subject_name,
                marks_used=int(marks) if marks is not None else None,
                marks_source=source,
                grade_letter=gl,
                grade_point=gp,
                credits=credits,
            )

            if is_passed:
                passed_subjects.append(detail)
            else:
                failed_subjects.append(detail)

        # ── 5. Compute SGPA ──────────────────────────────────────────────────
        # SGPA is calculated over PASSED subjects only.
        # Failed subjects are excluded from both numerator and denominator.
        total_credits = sum(s.credits for s in passed_subjects)
        weighted_gp   = sum(s.grade_point * s.credits for s in passed_subjects)
        sgpa = round(weighted_gp / total_credits, 2) if total_credits > 0 else 0.0

        # Sort both lists by subject code for consistency
        passed_subjects.sort(key=lambda s: s.subject_code)
        failed_subjects.sort(key=lambda s: s.subject_code)

        return SGPAResponse(
            usn=usn,
            student_name=student.student_name,
            semester=semester,
            sgpa=sgpa,
            total_credits_passed=total_credits,
            passed_subjects=passed_subjects,
            failed_subjects=failed_subjects,
        )

    # ---------------- BATCH SEMESTER SGPA ---------------- #

    def get_batch_semester_sgpa(self, batch: str, semester: int, branch: Optional[str] = None):
        from app.schemas import BatchSGPAStudent, BatchSGPAResponse

        query = self.db.query(Student).filter(Student.batch == batch)
        if branch:
            query = query.filter(Student.branch == branch)
        students = query.all()
        
        if not students:
            return BatchSGPAResponse(batch=batch, semester=semester, average_sgpa=0.0, students=[])

        usns = {s.usn: s.student_name for s in students}

        rows_query = (
            self.db.query(
                Student.usn,
                Subject.subject_code,
                Result.total_marks,
                Result.result_status,
                Semester.exam_year,
                Semester.exam_month,
            )
            .join(Result.student)
            .join(Result.semester)
            .join(Result.subject)
            .filter(Student.batch == batch)
            .filter(Semester.semester_number == semester)
        )
        if branch:
            rows_query = rows_query.filter(Student.branch == branch)
            
        rows = rows_query.all()

        latest = {}
        for row in rows:
            key = (row.usn, row.subject_code)
            if key not in latest:
                latest[key] = row
            else:
                existing = latest[key]
                newer = False
                if (row.exam_year or 0) > (existing.exam_year or 0):
                    newer = True
                elif (row.exam_year or 0) == (existing.exam_year or 0):
                    if (row.exam_month or "") > (existing.exam_month or ""):
                        newer = True
                if newer:
                    latest[key] = row

        by_usn = {}
        for (usn, code), row in latest.items():
            if usn not in by_usn:
                by_usn[usn] = []
            by_usn[usn].append(row)

        batch_students = []
        for usn, name in usns.items():
            rows_for_usn = by_usn.get(usn, [])
            if not rows_for_usn:
                continue

            total_credits = 0
            weighted_gp = 0
            for row in rows_for_usn:
                status = str(row.result_status or "").upper()
                is_passed = status in ("P", "PASS")
                if is_passed:
                    credits = self._get_vtu_credits(row.subject_code, semester)
                    pct = self._marks_to_percentage(row.total_marks)
                    gp = self._percentage_to_grade_points(pct, row.result_status)
                    total_credits += credits
                    weighted_gp += (gp * credits)

            # SGPA is computed from passed subjects only; failed ones are already excluded above.
            sgpa = round(weighted_gp / total_credits, 2) if total_credits > 0 else 0.0

            batch_students.append(BatchSGPAStudent(
                usn=usn,
                student_name=name,
                semester=semester,
                sgpa=sgpa
            ))

        avg_sgpa = round(sum(s.sgpa for s in batch_students) / len(batch_students), 2) if batch_students else 0.0

        batch_students.sort(key=lambda x: x.usn)

        return BatchSGPAResponse(
            batch=batch,
            semester=semester,
            average_sgpa=avg_sgpa,
            students=batch_students
        )

    # ------------- BACKLOG DISTRIBUTION ANALYTICS ------------- #

    def get_backlog_distribution(
        self,
        semester: Optional[int] = None,
        batch: Optional[str] = None,
        branch: Optional[str] = None,
    ) -> Dict:
        """
        For a given semester (and optional batch/branch filters):

        1. distribution — how many students have exactly N backlogs
           [{"backlogs": 1, "count": 23}, {"backlogs": 2, "count": 11}, ...]

        2. students — per-student drilldown, sorted by backlog_count desc
           [{"usn": ..., "name": ..., "backlog_count": 2,
             "failed_subjects": [{"code": ..., "name": ...}, ...]}, ...]
        """
        df = self.get_results_dataframe(
            semester=semester,
            batch=batch,
            branch=branch,
        )

        if df.empty:
            return {"distribution": [], "students": []}

        # Keep only the latest attempt per (usn, subject_code)
        df_sorted = df.sort_values(
            ["exam_year", "exam_month"], ascending=[False, False]
        )
        latest = df_sorted.drop_duplicates(
            subset=["usn", "subject_code"], keep="first"
        )

        # Mark each row as failed
        latest = latest.copy()
        latest["is_failed"] = latest["result_status"].apply(
            lambda s: str(s).upper() not in ("P", "PASS")
        )

        # Per-student backlog info
        student_records = []
        for usn, grp in latest.groupby("usn"):
            failed_rows = grp[grp["is_failed"]]
            backlog_count = int(len(failed_rows))
            if backlog_count == 0:
                continue  # Only include students with ≥1 backlog

            name = grp["student_name"].iloc[0]
            failed_subjects = [
                {"code": row["subject_code"], "name": row["subject_name"]}
                for _, row in failed_rows.iterrows()
            ]
            student_records.append({
                "usn": usn,
                "name": name,
                "backlog_count": backlog_count,
                "failed_subjects": failed_subjects,
            })

        # Sort worst first
        student_records.sort(key=lambda r: r["backlog_count"], reverse=True)

        # Build distribution histogram
        from collections import Counter
        counts = Counter(r["backlog_count"] for r in student_records)
        distribution = [
            {"backlogs": k, "count": counts[k]}
            for k in sorted(counts.keys())
        ]

        return {
            "distribution": distribution,
            "students": student_records,
        }


