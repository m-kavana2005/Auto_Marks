-- VTU Results Database Schema
-- MySQL Database Schema for VTU Student Results Management System
-- Run this script in MySQL terminal to set up the database

-- INSTRUCTIONS TO RUN IN TERMINAL:
-- 1. Open Command Prompt/Terminal
-- 2. Connect to MySQL: mysql -u root -p
-- 3. Enter your MySQL root password when prompted
-- 4. Create database: CREATE DATABASE IF NOT EXISTS vtu_results;
-- 5. Use database: USE vtu_results;
-- 6. Run this file: SOURCE sql/schema.sql;
-- 7. Verify: SHOW TABLES;
-- 8. Exit: EXIT;

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS upload_logs;
DROP TABLE IF EXISTS notifications;

-- Create Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usn VARCHAR(20) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    batch VARCHAR(9),
    branch VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usn (usn),
    INDEX idx_student_name (student_name),
    INDEX idx_batch (batch),
    INDEX idx_branch (branch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Semesters table
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_number INT NOT NULL,
    exam_month VARCHAR(50),
    exam_year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_semester (semester_number),
    UNIQUE KEY unique_semester (semester_number, exam_month, exam_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Subjects table
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(500) NOT NULL,
    credits INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subject_code (subject_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Results table
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    semester_id INT NOT NULL,
    subject_id INT NOT NULL,
    internal_marks INT DEFAULT NULL,
    external_marks INT DEFAULT NULL,
    total_marks INT DEFAULT NULL,
    upload_batch_id VARCHAR(50) DEFAULT NULL,
    result_status VARCHAR(4) DEFAULT NULL,
    announced_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_semester (semester_id),
    INDEX idx_subject (subject_id),
    INDEX idx_result_status (result_status),
    INDEX idx_upload_batch (upload_batch_id),
    UNIQUE KEY unique_result (student_id, semester_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Upload Logs table (to track batch uploads)
CREATE TABLE upload_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    total_files INT DEFAULT 0,
    processed_files INT DEFAULT 0,
    failed_files INT DEFAULT 0,
    current_file VARCHAR(255) DEFAULT NULL,
    current_file_index INT DEFAULT 0,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    error_log TEXT,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_timestamp TIMESTAMP NULL,
    INDEX idx_batch_id (batch_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    detail TEXT DEFAULT NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'info',
    cleared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_cleared (cleared),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a view for easy result retrieval with all details
CREATE VIEW vw_student_results AS
SELECT 
    st.usn,
    st.student_name,
    sem.semester_number,
    sem.exam_month,
    sem.exam_year,
    sub.subject_code,
    sub.subject_name,
    r.internal_marks,
    r.external_marks,
    r.total_marks,
    r.result_status,
    r.announced_date,
    r.created_at as result_created_at
FROM results r
JOIN students st ON r.student_id = st.id
JOIN semesters sem ON r.semester_id = sem.id
JOIN subjects sub ON r.subject_id = sub.id;

-- Create a view for semester-wise performance summary
CREATE VIEW vw_semester_summary AS
SELECT 
    st.usn,
    st.student_name,
    sem.semester_number,
    sem.exam_month,
    sem.exam_year,
    COUNT(DISTINCT r.subject_id) as total_subjects,
    SUM(CASE WHEN r.result_status = 'P' THEN 1 ELSE 0 END) as subjects_passed,
    SUM(CASE WHEN r.result_status = 'F' THEN 1 ELSE 0 END) as subjects_failed,
    AVG(r.total_marks) as average_marks,
    MAX(r.total_marks) as highest_marks,
    MIN(r.total_marks) as lowest_marks
FROM results r
JOIN students st ON r.student_id = st.id
JOIN semesters sem ON r.semester_id = sem.id
GROUP BY st.id, sem.id, st.usn, st.student_name, sem.semester_number, sem.exam_month, sem.exam_year;

-- Create a view for subject-wise statistics
CREATE VIEW vw_subject_statistics AS
SELECT 
    sem.semester_number,
    sub.subject_code,
    sub.subject_name,
    COUNT(r.id) as total_students,
    AVG(r.internal_marks) as avg_internal,
    AVG(r.external_marks) as avg_external,
    AVG(r.total_marks) as avg_total,
    MAX(r.total_marks) as max_marks,
    MIN(r.total_marks) as min_marks,
    SUM(CASE WHEN r.result_status = 'P' THEN 1 ELSE 0 END) as pass_count,
    SUM(CASE WHEN r.result_status = 'F' THEN 1 ELSE 0 END) as fail_count,
    ROUND((SUM(CASE WHEN r.result_status = 'P' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.id)), 2) as pass_percentage
FROM results r
JOIN subjects sub ON r.subject_id = sub.id
JOIN semesters sem ON r.semester_id = sem.id
GROUP BY sem.semester_number, sub.id, sub.subject_code, sub.subject_name;

-- Sample queries for reference

-- Query 1: Get all results for a specific student
-- SELECT * FROM vw_student_results WHERE usn = '1SV22AD005';

-- Query 2: Get semester summary for a student
-- SELECT * FROM vw_semester_summary WHERE usn = '1SV22AD005' ORDER BY semester_number;

-- Query 3: Get subject-wise statistics for a semester
-- SELECT * FROM vw_subject_statistics WHERE semester_number = 5 ORDER BY subject_code;

-- Query 4: Find students who failed in any subject
-- SELECT DISTINCT usn, student_name FROM vw_student_results WHERE result_status = 'F';

-- Query 5: Get top performers in a subject
-- SELECT usn, student_name, total_marks 
-- FROM vw_student_results 
-- WHERE subject_code = 'BCS501' 
-- ORDER BY total_marks DESC LIMIT 10;

COMMIT;
