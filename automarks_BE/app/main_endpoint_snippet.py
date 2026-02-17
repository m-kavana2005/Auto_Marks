
@app.get("/student/history/{usn_or_name}", response_model=StudentHistoryResponse)
async def get_student_history_api(
    usn_or_name: str,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive academic history for a student.
    Searchable by USN (exact) or Name (partial match).
    """
    # 1. Try to find student by USN
    student = db.query(Student).filter(Student.usn == usn_or_name).first()
    
    if not student:
        # Try finding by name (case insensitive)
        matches = db.query(Student).filter(Student.student_name.ilike(f"%{usn_or_name}%")).all()
        
        if not matches:
            raise HTTPException(status_code=404, detail=f"Student '{usn_or_name}' not found")
            
        if len(matches) > 1:
            msg = f"Multiple students found matching '{usn_or_name}'. Please use USN. Candidates: {', '.join([s.student_name + ' (' + s.usn + ')' for s in matches[:5]])}"
            raise HTTPException(status_code=400, detail=msg)
            
        student = matches[0]

    # 2. Get history
    analyzer = ResultAnalyzer(db)
    history = analyzer.get_student_comprehensive_history(student.usn)
    
    if not history:
        raise HTTPException(status_code=404, detail="History data could not be generated")
        
    return history
