"""
Data Analysis Service using Pandas and NumPy
Provides analytics and statistical analysis of student results
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models import Student, Result, Subject, Semester
from app.schemas import SubjectStatistics, SemesterSummary
import logging
from openpyxl.styles import PatternFill, Font



logger = logging.getLogger(__name__)


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
            Subject.subject_name,
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
            stats.append(SubjectStatistics(
                subject_code=code,
                subject_name=s['subject_name'].iloc[0],
                total_students=len(s),
                avg_internal=float(s['internal_marks'].mean()),
                avg_external=float(s['external_marks'].mean()),
                avg_total=float(s['total_marks'].mean()),
                max_marks=int(s['total_marks'].max()),
                min_marks=int(s['total_marks'].min()),
                pass_count=int((s['result_status'] == 'P').astype(int).sum()),
                fail_count=int((s['result_status'] == 'F').astype(int).sum()),
                pass_percentage=float((s['result_status'] == 'P').astype(int).mean() * 100)
            ))
        return stats

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

        # Ensure we have numeric credits and marks
        df['credits'] = pd.to_numeric(df['credits'], errors='coerce').fillna(0)
        
        # Calculate Grade Points for each subject
        # Formula: GP based on percentage
        def calculate_gp(row):
            pct = self._marks_to_percentage(row['total_marks'])
            return self._percentage_to_grade_points(pct, row['result_status'])

        df['grade_points'] = df.apply(calculate_gp, axis=1)
        df['credits_earned'] = df.apply(
            lambda r: r['credits'] if r['result_status'] == 'P' else 0, axis=1
        )
        df['weighted_gp'] = df['grade_points'] * df['credits']

        progression = []
        cumulative_credits = 0
        cumulative_weighted_gp = 0

        # Group by semester number to calculate SGPA
        # We process semesters in order 1..8
        semesters = sorted(df['semester'].unique())
        
        for sem in semesters:
            sem_data = df[df['semester'] == sem]
            
            # For SGPA, we only consider the LATEST attempt for each subject in that semester
            # (If student re-took subject, use latest)
            # Group by subject_code and take last (assuming query order or reliable update)
            # Better: sort by exam_year, exam_month desc first
            sem_data = sem_data.sort_values(['exam_year', 'exam_month'], ascending=[False, False])
            latest_subjects = sem_data.drop_duplicates(subset=['subject_code'], keep='first')

            total_sem_credits = latest_subjects['credits'].sum()
            total_sem_weighted_gp = (latest_subjects['grade_points'] * latest_subjects['credits']).sum()

            sgpa = 0.0
            if total_sem_credits > 0:
                sgpa = total_sem_weighted_gp / total_sem_credits

            # For CGPA, we accumulate ALL unique subjects passed/attempted so far?
            # VTU CGPA considers best/latest attempt of all subjects up to this semester.
            
            # Add to cumulative (simplified logic: just add semester totals)
            # In reality, CGPA should be re-calculated based on all unique subjects across all semesters
            # For now, let's treat it as running cumulative of these semester stats
            cumulative_credits += total_sem_credits
            cumulative_weighted_gp += total_sem_weighted_gp

            cgpa = 0.0
            if cumulative_credits > 0:
                cgpa = cumulative_weighted_gp / cumulative_credits
            
            progression.append({
                "semester": int(sem),
                "sgpa": round(sgpa, 2),
                "cgpa": round(cgpa, 2),
                "credits_registered": int(total_sem_credits),
                "credits_earned": int(latest_subjects['credits_earned'].sum())
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
            # Rank by total semester marks or SGPA (approx)
            # Group by student
            student_stats = []
            
            for (usn, name), group in df.groupby(['usn', 'student_name']):
                total_marks = group['total_marks'].sum()
                
                # Approximate SGPA calculation
                # Needs credits
                group['credits'] = pd.to_numeric(group['credits'], errors='coerce').fillna(0)
                
                def calc_gp(r):
                    pct = self._marks_to_percentage(r['total_marks'])
                    return self._percentage_to_grade_points(pct, r['result_status'])
                
                weighted_gp = (group.apply(calc_gp, axis=1) * group['credits']).sum()
                total_credits = group['credits'].sum()
                
                sgpa = 0.0
                if total_credits > 0:
                    sgpa = weighted_gp / total_credits
                
                student_stats.append({
                    "usn": usn,
                    "student_name": name,
                    "total_marks": int(total_marks),
                    "sgpa": round(sgpa, 2),
                    "section": group['batch'].iloc[0] if 'batch' in group else None
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
    ):
        df = self.get_results_dataframe(semester, usn, batch, branch)
        if df.empty:
            logger.warning("No data to export")
            return

        pivot = self._create_student_pivot(df)
        pivot.to_csv(output_path, index=False)
        logger.info(f"CSV exported to {output_path}")

    # ---------------- EXPORT EXCEL ---------------- #

    def export_to_excel(self, output_path: str, semester: Optional[int] = None):
        df = self.get_results_dataframe(semester=semester)
        if df.empty:
            logger.warning("No data to export")
            return

        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            pivot = self._create_student_pivot(df)
            pivot.to_excel(writer, sheet_name="Student View", index=False)

        logger.info(f"Excel exported to {output_path}")

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
        
        # Average CGPA calculation
        # This is an approximation based on available data
        df['credits'] = pd.to_numeric(df['credits'], errors='coerce').fillna(0)
        
        # Use existing logic to calculate Grade Points
        def calc_gp(row):
            pct = self._marks_to_percentage(row['total_marks'])
            return self._percentage_to_grade_points(pct, row['result_status'])
            
        df['grade_points'] = df.apply(calc_gp, axis=1)
        
        # Calculate average GPA per student first
        student_gpas = []
        # Group by USN to calculate each student's average GPA (SGPA-like)
        for usn, group in df.groupby('usn'):
            total_credits = group['credits'].sum()
            weighted_points = (group['grade_points'] * group['credits']).sum()
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