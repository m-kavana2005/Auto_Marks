import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.analyzer import ResultAnalyzer

def main():
    try:
        db = SessionLocal()
        analyzer = ResultAnalyzer(db)
        
        project_root = os.path.dirname(os.path.abspath(__file__))
        save_dir = os.path.join(project_root, "saved_data")
        os.makedirs(save_dir, exist_ok=True)
        
        print(f"Saving data to: {save_dir}")
        
        xl = os.path.join(save_dir, "all_data.xlsx")
        analyzer.export_to_excel(xl)
        print(f"Saved: {xl}")
        
        csv = os.path.join(save_dir, "all_data.csv")
        analyzer.export_to_csv(csv)
        print(f"Saved: {csv}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
