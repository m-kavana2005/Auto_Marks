"""
Admin Router — Database maintenance endpoints (purge operations).
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.models import Student, Subject, Semester, Result, UploadLog, Notification

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

logger = logging.getLogger(__name__)


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db)
):
    """Get system statistics for admin dashboard."""
    total_students = db.query(Student).count()
    total_results = db.query(Result).count()
    total_uploads = db.query(UploadLog).count()

    return {
        "total_students": total_students,
        "total_results": total_results,
        "total_uploads": total_uploads,
    }


# ── Purge Endpoints ──────────────────────────────────

@router.delete("/purge/all")
def purge_all_data(
    confirm: str = Query(...),
    batch: str = Query(None),
    db: Session = Depends(get_db)
):
    """DANGER: Purges database records. Requires confirm='DELETE_ALL'."""
    if confirm != "DELETE_ALL":
        raise HTTPException(status_code=400, detail="Must send confirm=DELETE_ALL")
    try:
        deleted = []
        if batch:
            res = db.query(Result).join(Student).filter(Student.batch == batch).delete()
            stu = db.query(Student).filter(Student.batch == batch).delete()
            deleted.append(f"Results: {res}")
            deleted.append(f"Students: {stu}")
        else:
            res = db.query(Result).delete()
            sem = db.query(Semester).delete()
            sub = db.query(Subject).delete()
            stu = db.query(Student).delete()
            upl = db.query(UploadLog).delete()
            notifs = db.query(Notification).delete()
            deleted = [
                f"Results: {res}", f"Semesters: {sem}", f"Subjects: {sub}",
                f"Students: {stu}", f"Upload Logs: {upl}", f"Notifications: {notifs}",
            ]
        db.commit()
        return {"message": "Purge successful", "details": deleted}
    except Exception as e:
        db.rollback()
        logger.error(f"Purge ALL failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/purge/candidate/{usn}")
def purge_candidate(
    usn: str,
    confirm: str = Query(...),
    batch: str = Query(None),
    db: Session = Depends(get_db)
):
    """DANGER: Purge a specific candidate and their results."""
    if confirm != "DELETE":
        raise HTTPException(status_code=400, detail="Must send confirm=DELETE")
    try:
        query = db.query(Student).filter(Student.usn == usn)
        if batch:
            query = query.filter(Student.batch == batch)
        student = query.first()
        if not student:
            raise HTTPException(status_code=404, detail=f"Candidate {usn} not found")
        db.delete(student)
        db.commit()
        return {"message": f"Successfully deleted candidate {usn}"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/purge/semester/{semester_num}")
def purge_semester(
    semester_num: int,
    confirm: str = Query(...),
    batch: str = Query(None),
    db: Session = Depends(get_db)
):
    """DANGER: Purge results for a specific semester."""
    if confirm != "DELETE":
        raise HTTPException(status_code=400, detail="Must send confirm=DELETE")
    try:
        query = db.query(Result).join(Semester).filter(Semester.semester_number == semester_num)
        if batch:
            query = query.join(Student).filter(Student.batch == batch)
        deleted_count = query.delete()
        if not batch:
            sems = db.query(Semester).filter(Semester.semester_number == semester_num).all()
            for sem in sems:
                if db.query(Result).filter(Result.semester_id == sem.id).count() == 0:
                    db.delete(sem)
        db.commit()
        return {"message": f"Deleted {deleted_count} results for semester {semester_num}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
