# VTU Results System - College Server Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy the VTU Results Extraction and Management System on a college server using MySQL.

## Prerequisites

### System Requirements
- **OS**: Windows/Linux/macOS
- **Python**: 3.11 or higher
- **MySQL**: 8.0 or higher
- **RAM**: Minimum 4GB
- **Storage**: 10GB free space

### Required Software
1. **Python 3.11+**: Download from [python.org](https://python.org)
2. **MySQL Server 8.0+**: Download from [mysql.com](https://dev.mysql.com/downloads/mysql/)
3. **uv Package Manager**: Install with `pip install uv`

## Installation Steps

### 1. Install uv Package Manager
```bash
pip install uv
```

### 2. Clone/Download the Project
```bash
# If using git
git clone <repository-url>
cd vtu-results-system

# Or extract the project files to a directory
```

### 3. Install Dependencies
```bash
uv sync
```

### 4. Set Up MySQL Database

#### Option A: Using MySQL Workbench/Command Line
1. Open MySQL Workbench or command line client
2. Create database:
```sql
CREATE DATABASE vtu_results;
```
3. Create user (optional, but recommended):
```sql
CREATE USER 'vtu_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON vtu_results.* TO 'vtu_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Option B: Using XAMPP/WAMP (Windows)
1. Install XAMPP from [apachefriends.org](https://www.apachefriends.org/)
2. Start MySQL service
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create database `vtu_results`

### 5. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vtu_results
DB_USER=root
DB_PASSWORD=your_mysql_password

# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=false

# PDF Processing
USE_DOCLING=false
```

### 6. Initialize Database Schema
```bash
# Create tables
mysql -u root -p

# Inside MySQL prompt:
CREATE DATABASE IF NOT EXISTS vtu_results;
USE vtu_results;
SOURCE sql/schema.sql;
EXIT;

# Alternative one-liner (database must already exist):
# mysql -u root -p vtu_results < sql/schema.sql
```

### 7. Start the Application
```bash
# Production mode (recommended for server)
uv run python run_api.py

# Or using the script
uv run run-api
```

The application will be available at `http://localhost:8000`

## API Endpoints

### Main Endpoints
- **API Documentation**: `http://localhost:8000/docs`
- **Health Check**: `GET /health`
- **Upload Results**: `POST /upload-results`
- **Get Student Results**: `GET /students/{usn}`
- **Analytics Dashboard**: `GET /analytics`

### File Upload
- **Endpoint**: `POST /upload-results`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: PDF file containing VTU results
  - `semester`: Semester number (optional)

## Troubleshooting

### Common Issues

#### 1. MySQL Connection Error
**Error**: `Can't connect to MySQL server`
**Solution**:
- Ensure MySQL service is running
- Check credentials in `.env` file
- Verify MySQL port (default: 3306)

#### 2. Port Already in Use
**Error**: `Port 8000 is already in use`
**Solution**:
- Change port in `.env`: `PORT=8001`
- Or kill process using the port

#### 3. PDF Processing Issues
**Error**: `PDF extraction failed`
**Solution**:
- Ensure PDF is not password-protected
- Check PDF format (should be text-based, not scanned images)
- Try setting `USE_DOCLING=true` in `.env` for better OCR

#### 4. Permission Errors
**Error**: `Permission denied`
**Solution**:
- Run as administrator/sudo
- Check file permissions on data directories

### Logs and Monitoring
- Application logs are displayed in the terminal
- Database connection logs show successful connections
- Check `data/` directory for processed files

## Security Considerations

### For Production Deployment
1. **Change Default Passwords**: Update MySQL root password
2. **Use Environment Variables**: Never hardcode credentials
3. **Firewall Configuration**: Restrict access to necessary ports only
4. **SSL/TLS**: Configure HTTPS for production
5. **User Permissions**: Create dedicated MySQL user with limited privileges

### Backup Strategy
```bash
# Database backup
mysqldump -u username -p vtu_results > backup.sql

# Restore backup
mysql -u username -p vtu_results < backup.sql
```

## Performance Optimization

### For High Load
1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Connection Pooling**: Configure SQLAlchemy connection pool settings
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Load Balancing**: Use nginx or similar for multiple instances

### Memory Usage
- Monitor memory usage with large PDF files
- Consider increasing server RAM for batch processing
- Use `USE_DOCLING=false` for faster processing (less accurate)

## Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review application logs
3. Verify database connectivity
4. Test with sample data

## Recent Updates

- ✅ MySQL-backed storage
- ✅ Improved PDF extraction (now extracts all 9 subjects)
- ✅ Migrated to uv package manager
- ✅ Fixed enum compatibility issues
- ✅ Enhanced error handling and logging