# Auto_Marks – VTU Results Management System

Auto_Marks is a full-stack **VTU Results Management System** designed to simplify student result processing, academic performance analysis, SGPA calculation, and result exploration.

The system provides a modern web interface for managing VTU student results while automating data processing and presenting academic information in an easy-to-use format.

---

## 🚀 Features

### 🔐 Authentication & Security

* User authentication and protected routes
* Email OTP verification
* Two-factor authentication (2FA)
* Private/protected frontend routes
* Authentication context management
* Admin support and user management

### 📊 Results Management

* Upload and process VTU result data
* Support for multiple academic batches
* Student-wise result exploration
* Subject-wise marks and result information
* Student profile and academic performance details
* Result filtering and exploration

### 🎓 SGPA Calculator

* Automated SGPA calculation
* VTU credit-based calculation
* Support for different VTU schemes
* Performance grouping based on SGPA

### 📈 Dashboard

* Interactive academic dashboard
* Student performance overview
* Result statistics
* SGPA-based student groups
* Easy navigation between academic data

### 🧮 VTU Scheme Support

The system is designed to handle VTU academic schemes including:

* 2022 Scheme
* 2025 Scheme
* Batch-specific result processing
* Credit-based SGPA calculation

### ⚙️ Backend Processing

* REST API based backend
* Database integration
* Automated result processing
* Data analysis and transformation
* Authentication services
* OTP and 2FA services
* Database migration and diagnostic utilities

---

## 🏗️ Project Architecture

```text
Auto_Marks
│
├── automarks_FE/                 # Frontend
│   ├── components/
│   │   └── auth/
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── features/
│   │   ├── Dashboard.tsx
│   │   ├── ResultsExplorer.tsx
│   │   ├── SGPACalculator.tsx
│   │   └── StudentProfile.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── VerifyOTP.tsx
│   │   └── Verify2FA.tsx
│   ├── api/
│   │   └── client.ts
│   └── App.tsx
│
├── automarks_BE/                 # Backend
│   ├── app/
│   │   ├── auth/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   ├── scripts/
│   ├── pyproject.toml
│   └── run_api.py
│
├── Start-AutoMarks.ps1
├── run.txt
└── .gitignore
```

---

## 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* React Components
* REST API Integration

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pandas
* NumPy
* REST APIs

### Database

* PostgreSQL
* SQLite for local development/fallback

### Authentication

* OTP Authentication
* Two-Factor Authentication
* JWT-based authentication
* Protected Routes

### Development Tools

* Git
* GitHub
* VS Code
* Uvicorn
* uv

---

## 🔄 Application Workflow

```text
                    ┌─────────────────────┐
                    │      User Login     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  OTP / 2FA Verify   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Dashboard      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │   Results  │   │   Student  │   │    SGPA    │
       │  Explorer  │   │   Profile  │   │ Calculator │
       └──────┬─────┘   └──────┬─────┘   └──────┬─────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Backend REST API  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Database      │
                    └─────────────────────┘
```

---

## 📂 Main Modules

### Frontend

| Module            | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `Dashboard`       | Displays overall academic information and statistics |
| `ResultsExplorer` | Provides result browsing and filtering               |
| `SGPACalculator`  | Calculates student SGPA based on VTU credits         |
| `StudentProfile`  | Displays individual student academic information     |
| `LoginPage`       | Handles user authentication                          |
| `VerifyOTP`       | Handles OTP verification                             |
| `Verify2FA`       | Handles two-factor authentication                    |
| `AuthContext`     | Manages authentication state                         |
| `PrivateRoute`    | Protects authenticated application routes            |

### Backend

| Module                 | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `main.py`              | Main FastAPI application                                     |
| `database.py`          | Database configuration and connection                        |
| `models.py`            | Database models                                              |
| `schemas.py`           | API request/response schemas                                 |
| `auth/`                | Authentication and security services                         |
| `services/analyzer.py` | Result/data processing logic                                 |
| `scripts/`             | Database initialization, migration, and diagnostic utilities |

---

## 🔐 Authentication Flow

```text
User
 │
 ▼
Login
 │
 ▼
OTP Verification
 │
 ▼
2FA Verification
 │
 ▼
Authenticated Session
 │
 ▼
Protected Dashboard
```

The application separates authentication logic from the main application features and uses protected routes to restrict access to authenticated users.

---

## 💻 Installation & Setup

### Prerequisites

Make sure the following are installed:

* Git
* Python 3.10+
* Node.js
* npm
* PostgreSQL (for PostgreSQL-based setup)
* uv (recommended for Python dependency management)

---

## 1. Clone the Repository

```bash
git clone https://github.com/m-kavana2005/Auto_Marks.git
cd Auto_Marks
```

---

## 2. Backend Setup

Navigate to the backend:

```bash
cd automarks_BE
```

Install dependencies using `uv`:

```bash
uv sync
```

Or create and activate a virtual environment and install the required dependencies according to the project configuration.

Start the FastAPI server:

```bash
python run_api.py
```

Alternatively:

```bash
uvicorn app.main:app --reload
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation can be accessed at:

```text
http://127.0.0.1:8000/docs
```

---

## 3. Frontend Setup

Open another terminal and navigate to:

```bash
cd automarks_FE
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## ⚡ Quick Start

The repository also includes:

```text
Start-AutoMarks.ps1
```

which can be used to simplify starting the Auto_Marks application on Windows.

Run PowerShell from the project directory and execute:

```powershell
.\Start-AutoMarks.ps1
```

---

## 🗄️ Database

Auto_Marks supports database-backed result management.

The backend includes database configuration, models, initialization utilities, and migration scripts.

Important backend utilities include:

```text
automarks_BE/scripts/
├── create_admin.py
├── db_diag.py
├── manual_init.py
├── migrate_vtu_2025_scheme.py
├── raw_db_check.py
└── raw_sql_fix.py
```

These scripts support administration, database diagnostics, initialization, and VTU scheme migration.

---

## 📊 Supported Academic Data

The application is designed around VTU academic result processing and supports:

* Student information
* Subject marks
* Subject credits
* Semester results
* SGPA
* Academic performance
* Batch-wise result data
* VTU scheme-specific calculations

---

## 🎯 SGPA Performance Groups

The dashboard can organize students into performance groups such as:

```text
SGPA ≥ 9.0
SGPA ≥ 8.5
SGPA ≥ 8.0
SGPA ≥ 7.5
```

This makes it easier to explore academic performance across batches and semesters.

---

## 🔌 API Architecture

The frontend communicates with the backend through REST APIs.

```text
React + TypeScript
        │
        │ HTTP / REST API
        ▼
     FastAPI
        │
        ▼
   Service Layer
        │
        ▼
    SQLAlchemy
        │
        ▼
    PostgreSQL
```

This separation allows the frontend and backend to be developed and maintained independently.

---

## 🧪 Testing & Diagnostics

The backend contains utilities for testing and diagnosing database and authentication functionality.

Examples include:

```text
test_database_fallback.py
scripts/db_diag.py
scripts/raw_db_check.py
scripts/test_login_error.py
```

---

## 🔒 Environment Variables

Do **not** commit passwords, API keys, database credentials, JWT secrets, SMTP credentials, or other sensitive information to GitHub.

Create environment files locally as required by the application configuration.

Example:

```env
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
SMTP_HOST=your_smtp_host
SMTP_USERNAME=your_username
SMTP_PASSWORD=your_password
```

Use your own local values and keep `.env` files out of version control.

---

## 📸 Application

Auto_Marks provides a web-based interface for:

* Secure login
* Dashboard visualization
* Result exploration
* Student profiles
* SGPA calculation
* Academic performance analysis
* VTU result management

---

## 🔮 Future Enhancements

Potential future improvements include:

* Advanced analytics and visualizations
* Automated result report generation
* More VTU scheme support
* Role-based administration
* Advanced student performance analytics
* Exportable academic reports
* Cloud deployment
* Improved notification and communication features
* Automated result data ingestion

---

---

## ⭐ Project

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.
