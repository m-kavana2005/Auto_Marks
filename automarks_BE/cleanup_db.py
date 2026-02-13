from app.database import SessionLocal
from app.models import Student, Result, UploadLog
from sqlalchemy import or_

def cleanup():
    db = SessionLocal()
    try:
        print("Cleaning up test data...")
        
        # 1. Delete students with "test" or "manual" in their name
        students_to_delete = db.query(Student).filter(
            or_(
                Student.student_name.ilike("%test%"),
                Student.student_name.ilike("%manual%")
            )
        ).all()
        
        count = 0
        for s in students_to_delete:
            print(f"Deleting student: {s.student_name} ({s.usn})")
            db.delete(s)
            count += 1
            
        # 2. Delete results that are explicitly marked as MANUAL (if any remain)
        # Note: If we delete student, results cascade delete.
        # But if there are manual results for real students, we should delete them too as per "only data which were uploaded as pdf's"
        manual_results = db.query(Result).filter(Result.upload_batch_id == "MANUAL").all()
        r_count = 0
        for r in manual_results:
            db.delete(r)
            r_count += 1
            
        print(f"Deleted {count} test students and {r_count} manual results.")
        db.commit()
        print("Cleanup complete.")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
