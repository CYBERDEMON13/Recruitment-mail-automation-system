# Recruitment Email Automation System

A complete full-stack **Recruitment Email Automation System** designed for HR departments to streamline candidate management, generate personalized PDF Offer Letters and Certificates, customize email templates, automate bulk email sending with PDF attachments, track delivery logs, and retry failed dispatches.

---

## Key Features

1. **Dashboard & HR Analytics**:
   - Total Candidates, Selected, Pending, Rejected KPI cards.
   - Emails Sent, Emails Pending, Emails Failed stats.
   - Department breakdown & recent candidate/email activity feeds.

2. **Candidate Management**:
   - Full CRUD operations with search and status/department filtering.
   - Pagination, multi-select checkboxes for bulk email dispatch.
   - Dynamic data fields (Candidate ID, Full Name, Email, Phone, Position, Department, Company, Joining Date, Salary, Address, Application Status, Offer Status, Email Status).

3. **Batch Excel & CSV Import**:
   - Drag-and-drop Excel/CSV file upload using ExcelJS.
   - Automatic schema validation & duplicate email detection.
   - Detailed pre-import error preview table.
   - Downloadable standard import Excel template.
   - Candidate data export to Excel (.xlsx).

4. **Document Studio (PDF Generation)**:
   - Automated PDF Offer Letter generator built with PDFKit.
   - Automated PDF Certificate generator with customizable title and issue date.
   - Professional styling: Header logos, decorative borders, signatures, typography, and variable placeholder substitution (`{{CandidateName}}`, `{{JobPosition}}`, `{{JoiningDate}}`, `{{Salary}}`, etc.).
   - Instant browser preview & download buttons.

5. **Email Templates Management**:
   - CRUD operations for email templates.
   - Subject & Body template editor with clickable variable insertion tags.
   - Pre-seeded default templates (Offer Letter Email, Selection Certificate, Rejection Notice).

6. **Email Automation & Bulk Dispatch**:
   - Multi-candidate email composer.
   - Automatic generation and attachment of Offer Letter PDFs / Certificate PDFs.
   - Interactive live email preview before sending.
   - Confirmation modal before bulk sending.
   - Delivery logging into `email_logs` table.

7. **Email Delivery Logs & Retry Engine**:
   - Comprehensive history table with status badges (`Sent`, `Failed`, `Pending`).
   - Detailed error traceback inspector.
   - **One-click Retry button** for failed email attempts.

8. **SMTP Settings & Security**:
   - HR Admin interface to configure SMTP host, port, security (STARTTLS/SSL), sender name/email, and credentials.
   - Sensitive password masking (`********`) in frontend.
   - Built-in **"Test SMTP Connection"** button with real-time feedback.
   - Default fallback to Nodemailer Ethereal test accounts when no SMTP server is configured.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Lucide React icons, Custom CSS Design System (Glassmorphic dark/light mode themes).
- **Backend**: Node.js, Express.js REST API, JWT Authentication, bcryptjs password hashing, Multer file upload.
- **Document Generation**: PDFKit (PDF rendering engine).
- **Excel & Spreadsheet**: ExcelJS.
- **Email Delivery**: Nodemailer (SMTP protocol & attachments).
- **Database**:
  - **SQLite (Default Zero-Config)**: Auto-creates `data/recruitment.db` on startup for instant execution without local database server dependencies.
  - **MySQL Supported**: Full `schema.sql` database script provided. Set `DB_TYPE=mysql` in `.env` to connect to a live MySQL instance.

---

## Project Structure

```
recruitment-email-automation/
├── backend/
│   ├── config/
│   │   ├── database.js       # Dual SQLite & MySQL database adapter
│   │   └── initDb.js         # Database auto-schema initializer & seeder
│   ├── controllers/          # Auth, Candidate, Document, Email, Template, Settings, Dashboard
│   ├── middleware/           # Auth JWT verification
│   ├── routes/               # Express REST API routes
│   ├── services/             # PDFKit generator, Nodemailer automation, ExcelJS processor
│   ├── uploads/              # Generated PDFs & temp upload files
│   ├── server.js             # Main backend server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── pages/            # Login, Dashboard, Candidates, Import, Documents, Templates, Composer, History, Settings, Profile
│   │   ├── App.jsx
│   │   ├── index.css         # Custom modern design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env.example
├── schema.sql
└── README.md
```

---

## Quick Start & Installation

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### 1. Environment Setup
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```

Default `.env` configuration:
```env
PORT=5000
JWT_SECRET=recruitment_super_secret_jwt_key_2026
DB_TYPE=sqlite
```

---

### 2. Backend Setup & Run

Navigate to the `backend/` directory:
```bash
cd backend
npm install
npm start
```
*The backend server will run on `http://localhost:5000`. On startup, it will automatically initialize the database schema and seed the default HR Admin account (`admin@hr.com` / `admin123`), 5 sample candidates, default email templates, and initial settings.*

---

### 3. Frontend Setup & Run

In a separate terminal, navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
*The frontend web application will run on `http://localhost:3000`.*

---

## Step-by-Step HR Workflow Verification

1. **HR Admin Login**:
   - Open `http://localhost:3000`.
   - Click **"Fill Admin Credentials"** (`admin@hr.com` / `admin123`) and click **Sign In**.

2. **Dashboard Overview**:
   - View KPI metric cards for candidates, selected candidates, and email logs.
   - Inspect recent candidate and email logs feeds.

3. **Candidate Management**:
   - Go to **Candidates** page.
   - Click **Add Candidate** to add a new candidate, or search/filter by status.
   - Click the **PDF Icon** on any candidate row to generate and download an official Offer Letter PDF or Certificate PDF.

4. **Import Candidates from Excel**:
   - Go to **Import Candidates** page.
   - Click **Download Excel Template** to get the standard format.
   - Select an Excel/CSV file and click **Upload & Validate File**.
   - Review valid records vs invalid/duplicate email warnings, then click **Confirm & Import**.

5. **Document Studio**:
   - Go to **Document Studio**.
   - Select candidate and document type (Offer Letter / Certificate).
   - Click **Generate PDF Document** to inspect live preview and download.

6. **Email Templates**:
   - Go to **Email Templates**.
   - Customize template subject and body text using click-to-insert placeholder tags (`{{CandidateName}}`, `{{JoiningDate}}`, `{{Salary}}`).

7. **Bulk Email Automation**:
   - Go to **Email Composer** (or select candidates from Candidates page and click **Send Email**).
   - Select candidates, pick template, choose **Auto-Generate & Attach Offer Letter PDF**.
   - Click **Preview Email & Confirm Dispatch**, review resolved previews, and click **Confirm & Send Emails Now**.

8. **Email History & Retry**:
   - Go to **Email History**.
   - Filter by status (`Sent`, `Failed`). Click **Eye Icon** to inspect email contents or click **Retry Icon** to re-send failed emails.

9. **SMTP Settings & Testing**:
   - Go to **Settings**.
   - Configure SMTP host/port/credentials or click **Test SMTP Connection** to verify mail server connectivity.

---

## Default Credentials
- **Role**: HR Administrator
- **Email**: `admin@hr.com`
- **Password**: `admin123`
