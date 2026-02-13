from app.database import SessionLocal
from app.models import Student, Result, UploadLog, Semester, Subject
from sqlalchemy import func

def inspect_data():
    db = SessionLocal()
    try:
        print("--- STUDENTS ---")
        students = db.query(Student).all()
        for s in students:
            print(f"ID: {s.id}, USN: {s.usn}, Name: {s.student_name}, Batch: {s.batch}")

        print("\n--- RESULTS SAMPLE ---")
        results = db.query(Result).limit(5).all()
        for r in results:
            print(f"Result ID: {r.id}, Student: {r.student.usn}, Batch ID: {r.upload_batch_id}")

        print("\n--- UPLOAD LOGS ---")
        logs = db.query(UploadLog).all()
        for l in logs:
            print(f"Batch: {l.batch_id}, Status: {l.status}, Files: {l.total_files}")
            
    finally:
        db.close()

if __name__ == "__main__":
    inspect_data()
