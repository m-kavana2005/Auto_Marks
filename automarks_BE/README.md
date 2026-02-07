# 📊 VTU Results Management System

**Automated VTU Result Extraction & Analysis Platform**

Extract, store, and analyze VTU student results from PDF documents using AI-powered extraction with **MySQL** database.

---

## ✅ Current Status

- ✅ MySQL-backed storage (local/college server)
- ✅ Fixed PDF extraction (extracts all 9 subjects)
- ✅ Uses `uv` for dependency management

---

## 🚀 Quick Start Guide

### 1️⃣ Prerequisites

- **Python 3.11** (recommended) or Python 3.10+
- **MySQL Server** installed and running
- **uv** (fast package installer)

### 2️⃣ MySQL Setup (REQUIRED FIRST)

#### Install MySQL Server
Download from: https://dev.mysql.com/downloads/mysql/
Or use XAMPP which includes MySQL.

#### Start MySQL Service
```bash
# Windows (run as Administrator):
net start mysql

# Linux/Mac:
sudo systemctl start mysql
```

#### Create Database and Tables
Open terminal and run these commands **one by one**:

```bash
# Step 1: Connect to MySQL (enter your root password when prompted)
mysql -u root -p

# Step 2: Inside MySQL prompt, run these commands one by one:
CREATE DATABASE IF NOT EXISTS vtu_results;
USE vtu_results;
SOURCE sql/schema.sql;
SHOW TABLES;
EXIT;
```

### 3️⃣ Python Installation

**Install uv (if not already installed):**
```bash
pip install uv
```

### 4️⃣ Project Setup

**Clone and setup the project:**
```bash
# Clone the repository
git clone <repository-url>
cd vtu-results-system

# Install all dependencies with uv
uv sync

# Start the application
uv run python run_api.py
```

**Alternative start command:**
```bash
uv run run-api
```

---

## 📋 API Endpoints

- **📖 API Documentation**: `http://localhost:8000/docs`
- **🏥 Health Check**: `GET /health`
- **📤 Upload Results**: `POST /upload-results`
- **👤 Student Results**: `GET /students/{usn}`
- **📊 Analytics**: `GET /analytics`

---

## 🔧 Configuration

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

---

## 📚 College Server Deployment

For detailed deployment instructions on college servers, see: **[COLLEGE_DEPLOYMENT_GUIDE.md](COLLEGE_DEPLOYMENT_GUIDE.md)**

---

## 🆕 Recent Improvements

### PDF Extraction Enhancements
- ✅ **Structured Parsing**: Replaced complex regex with clean line-by-line parsing
- ✅ **Complete Subject Extraction**: Now extracts all 9 subjects (previously missing multi-line subjects)
- ✅ **Better Error Handling**: Improved logging and error recovery
- ✅ **Dual PDF Libraries**: Docling (AI-powered) + PyPDF (lightweight fallback)

### Database Migration
- ✅ **MySQL Schema**: MySQL-compatible schema with proper enum values
- ✅ **Connection Stability**: Reliable local database connections
- ✅ **Schema Optimization**: MySQL-compatible schema with proper enum values

### Development Experience
- ✅ **uv Package Manager**: Modern, fast dependency management
- ✅ **pyproject.toml**: Replaced requirements.txt with modern Python packaging
- ✅ **Type Safety**: Enhanced Pydantic models and type hints
- ✅ **Performance**: Optimized for production deployment

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (async web framework)
- **Database**: MySQL 8.0+ with SQLAlchemy ORM
- **PDF Processing**: Docling + PyPDF for robust extraction
- **Package Management**: uv (modern Python packaging)
- **Data Processing**: Pandas, NumPy
- **API Documentation**: Automatic OpenAPI/Swagger
- **Environment**: Python 3.11+ with virtual environments

---

**Install Dependencies:**
```bash
uv pip install -r requirements.txt
```

### 4️⃣ Environment Configuration

Your `.env` file should have:
```env
DB_TYPE=mysql
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=vtu_results

API_BASE_URL=http://localhost:8000
APP_ENV=development
DEBUG=True
SECRET_KEY=vtu-results-secret-key-2025
```

### 5️⃣ Test Database Connection

```bash
python -c "from app.database import engine; print('✅ MySQL connection successful!' if engine else '❌ Connection failed!')"
```

### 6️⃣ Run Application

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🗄️ Database Schema

The system uses MySQL with the following tables:
- **students**: Student information (USN, name)
- **semesters**: Exam semester details
- **subjects**: Subject codes and names
- **results**: Individual subject results
- **upload_logs**: Batch upload tracking

All tables include proper indexes and foreign key relationships.

---

## 🏫 College Server Deployment

When deploying to college server:

1. **Install MySQL** on the server
2. **Create dedicated database user**:
```sql
CREATE USER 'vtu_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON vtu_results.* TO 'vtu_user'@'localhost';
FLUSH PRIVILEGES;
```
3. **Update .env** with server credentials
4. **Run schema** using the same terminal commands above
5. **Deploy application** with proper firewall settings

---

## 🔧 Troubleshooting

- **MySQL connection fails?** Check service is running: `net start mysql`
- **Password issues?** Verify password in `.env` matches MySQL root password
- **Port blocked?** Ensure port 3306 is open in firewall
- **Permission denied?** Run terminal as Administrator/sudo
- **Module not found?** Run: `pip install -r requirements.txt`

---

## 📁 Project Structure

```
Demo/
├── app/                    # FastAPI application
│   ├── main.py            # Main API endpoints
│   ├── database.py        # Database configuration
│   ├── models.py          # SQLAlchemy models
│   └── services/          # Business logic
├── sql/
│   └── schema.sql         # MySQL database schema
├── data/                  # Data processing directories
├── utils/                 # Utility scripts
└── requirements.txt       # Python dependencies
```

### 4️⃣ Run the FastAPI + React stack

**Backend (FastAPI):**
```bash
python run_api.py
# or
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Docs live at: **http://localhost:8000/docs**

**Frontend (Vite + React):**
```bash
cd ../automarks_FE
npm install
npm run dev
```
Set the API base if your backend runs elsewhere:
```bash
set VITE_API_BASE=http://localhost:8000   # Windows PowerShell
export VITE_API_BASE=http://localhost:8000 # macOS/Linux
```

> Note: The legacy Streamlit UI has been removed; the React app is now the primary frontend.

---

## 🎯 Features

### ✅ Current Features
- **📤 Dynamic PDF Upload**: Single or batch upload (65+ PDFs supported)
- **🤖 AI-Powered Extraction**: Automatic data extraction using Docling
- **💾 MySQL Storage**: Local or college server MySQL
- **📊 Analytics Dashboard**: Subject-wise, semester-wise analysis
- **📥 Export Options**: Excel, CSV formats
- **🔍 Search & Filter**: By USN, name, semester, subject

### 🔮 Future Features (FastAPI Mode)
- **🌐 REST API**: When you build custom frontend
- **🔐 Authentication**: JWT-based auth
- **📱 Mobile App**: React Native integration
- **🔔 Notifications**: Email alerts for new results

---

## 📋 Usage Examples

### API Mode
```bash
# Start API server
python run_api.py

# Upload PDF via API
curl -X POST "http://localhost:8000/upload/single" \
  -F "file=@VTU_Result_2025.pdf"

# Get student results
curl "http://localhost:8000/students/1CR21CS001"

# Get analytics
curl "http://localhost:8000/analytics/semester/5"
```

### Standalone PDF Converter
```bash
# Convert single PDF to JSON
python -m utils.pdf_converter "VTU Result 2025.pdf"

# Batch convert all PDFs in folder
python -m utils.pdf_converter "pdfs/" -b -o "output/"
```

---

## 🗄️ Database Setup

### MySQL (Local / College Server)

1. **Update `.env` file**
   ```env
   DB_TYPE=mysql
   MYSQL_HOST=college-server.com
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DB=vtu_results
   ```

2. **Run MySQL Schema**
   ```bash
   mysql -u root -p vtu_results < sql/schema.sql
   ```

---

## 📊 Database Schema

### Tables
- **students**: Student information (USN, Name)
- **semesters**: Semester details (Number, Month, Year)
- **subjects**: Subject information (Code, Name)
- **results**: Individual result records (Marks, Status)
- **upload_logs**: Batch upload tracking

---

## 🛠️ Development

### Running Tests
```bash
pytest tests/
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

### Code Style
```bash
# Format code
black app/ streamlit_app/

# Lint
flake8 app/ streamlit_app/
```

---

## 📦 Dependencies

### Core
- **FastAPI** + **Uvicorn**: API server
- **Streamlit**: Web UI
- **Docling**: PDF extraction
- **SQLAlchemy**: Database ORM
- **Pandas**: Data manipulation

### Database
- **pymysql**: MySQL driver

### Utilities
- **python-dotenv**: Environment variables
- **plotly**: Charts and graphs

---

## 🚨 Important Notes

### Security
- ✅ Never commit `.env` file
- ✅ Use environment variables for secrets
- ✅ `.env.example` provided as template

### Performance
- ✅ Batch upload supports 65+ PDFs
- ✅ Async processing for large files
- ✅ Database connection pooling

### Migration
- ✅ MySQL schema-based setup

---

## 📞 Support & Contact

For issues or questions:
1. Check `IMPLEMENTATION_GUIDE.md` for detailed setup
2. Check `sql/migration_guide.md` for database migration
3. Review API docs at `/docs` endpoint

---

## 🎯 Roadmap

- [x] PDF extraction with Docling
- [x] MySQL support
- [x] FastAPI backend
- [x] Batch processing (65+ PDFs)
- [x] Analytics dashboard
- [x] Export to Excel/CSV
- [ ] Authentication system
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Mobile responsive UI
- [ ] REST API for mobile apps

---

## 📄 License

This project is for educational purposes.

---

**Made for VTU Students**
