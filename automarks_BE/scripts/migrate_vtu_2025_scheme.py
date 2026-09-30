"""Idempotently seed VTU 2025 Scheme subjects and credit mappings.

Run from ``automarks_BE`` with: ``python scripts/migrate_vtu_2025_scheme.py``.
The migration only adds nullable metadata columns/tables and new catalog rows.  It
never updates or deletes a legacy subject, credit, student, or result.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, SessionLocal, engine
from app.models import Subject, SubjectSchemeCredit


SCHEME = "2025"
VTU_2025_CREDITS: tuple[tuple[str, int], ...] = (
    ("1BMATx101", 4), ("1BMATx201", 4),
    ("1BCHEx102", 4), ("1BCHEx202", 4),
    ("1BPHYx102", 4), ("1BPHYx202", 4),
    ("1BAIA103", 3), ("1BAIA203", 3),
    ("1BESC104x", 3), ("1BESC204x", 3),
    ("1BCEDx103", 3), ("1BCEDx203", 3),
    ("1BPLC105x", 4), ("1BPLC205x", 4),
    ("1Bxxx105x", 3), ("1Bxxx205x", 3),
    ("1BENG106", 1), ("1BENG206", 1),
    ("1BSKS106", 0), ("1BSKS206", 0),
    ("1BICO107", 0), ("1BICO207", 0),
    ("1BIDTL158", 1), ("1BPRJ258", 1),
    ("1BKSK109", 1), ("1BKBK109", 1),
    ("1BKSK209", 1), ("1BKBK209", 1),
    ("1BxxxL107x", 1), ("1BxxxL207x", 1),
)


def semester_for(code: str) -> int | None:
    match = re.search(r"([12])\d{2}", code.upper())
    return int(match.group(1)) if match else None


def subject_name_for(code: str, credits: int) -> str:
    suffix = " (PP / Non-Credit)" if credits == 0 else ""
    return f"VTU 2025 Scheme - {code}{suffix}"


def ensure_schema() -> None:
    """Add nullable scheme metadata only; no existing rows are modified."""
    inspector = inspect(engine)
    existing_subject_columns = {column["name"] for column in inspector.get_columns("subjects")}
    existing_student_columns = {column["name"] for column in inspector.get_columns("students")}

    additions = (
        ("subjects", existing_subject_columns, "scheme", "VARCHAR(20) NULL"),
        ("subjects", existing_subject_columns, "semester_number", "INTEGER NULL"),
        ("subjects", existing_subject_columns, "branch", "VARCHAR(50) NULL"),
        ("students", existing_student_columns, "scheme", "VARCHAR(20) NULL"),
    )
    with engine.begin() as connection:
        for table, columns, column, definition in additions:
            if column not in columns:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))

    # Creates only the new mapping table; it never changes legacy tables or rows.
    Base.metadata.create_all(bind=engine, tables=[SubjectSchemeCredit.__table__])


def migrate() -> dict[str, int]:
    ensure_schema()
    db = SessionLocal()
    stats = {"inserted": 0, "skipped_duplicates": 0, "failed": 0}
    try:
        for code, credits in VTU_2025_CREDITS:
            try:
                subject = db.query(Subject).filter(Subject.subject_code == code).first()
                if subject is None:
                    db.add(Subject(
                        subject_code=code,
                        subject_name=subject_name_for(code, credits),
                        credits=credits,
                        scheme=SCHEME,
                        semester_number=semester_for(code),
                    ))
                    stats["inserted"] += 1
                else:
                    # Intentionally do not update the existing subject record.
                    stats["skipped_duplicates"] += 1

                mapping = db.query(SubjectSchemeCredit).filter(
                    SubjectSchemeCredit.subject_code == code,
                    SubjectSchemeCredit.scheme == SCHEME,
                ).first()
                if mapping is None:
                    db.add(SubjectSchemeCredit(
                        subject_code=code,
                        subject_name=subject_name_for(code, credits),
                        credits=credits,
                        scheme=SCHEME,
                        semester_number=semester_for(code),
                    ))
                db.commit()
            except SQLAlchemyError as error:
                db.rollback()
                stats["failed"] += 1
                print(f"FAILED {code}: {error}")
    finally:
        db.close()

    print(f"VTU 2025 migration complete: inserted={stats['inserted']}, "
          f"skipped_duplicates={stats['skipped_duplicates']}, failed={stats['failed']}")
    return stats


if __name__ == "__main__":
    migrate()
