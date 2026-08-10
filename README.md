# Recruitify | Smart HR Automation & Document Studio

A complete full-stack **Recruitify** platform designed for HR departments to streamline candidate management, generate personalized PDF Offer Letters and Certificates, customize email templates, automate bulk email sending with PDF attachments, track delivery logs, and retry failed dispatches.

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
   - Support for **Resend / Brevo Cloud HTTPS API (Port 443)** for zero-block deployment on Render cloud servers.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Lucide React icons, Custom CSS Design System (Glassmorphic dark/light mode themes).
- **Backend**: Node.js, Express.js REST API, JWT Authentication, bcryptjs password hashing, Multer file upload.
- **Document Generation**: PDFKit (PDF rendering engine).
- **Excel & Spreadsheet**: ExcelJS.
- **Email Delivery**: Nodemailer (SMTP protocol) & Resend / Brevo (HTTPS API Port 443).
- **Database**:
  - **SQLite (Default Zero-Config)**: Auto-creates `data/recruitment.db` on startup for instant execution.
  - **Render Persistent Storage**: Mounts `/var/data` persistent disk on Render cloud deployments.
  - **MySQL Supported**: Full `schema.sql` database script provided.

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
│   ├── services/             # PDFKit generator, Nodemailer & HTTPS API automation, ExcelJS processor
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
├── LICENSE
├── render.yaml
├── schema.sql
└── README.md
```

---

## Quick Start & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Environment Setup
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```

---

### 2. Backend Setup & Run

Navigate to the `backend/` directory:
```bash
cd backend
npm install
npm start
```
*The backend server will run on `http://localhost:5000`.*

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

## Default Credentials
- **Role**: HR Administrator
- **Email**: `admin@hr.com`
- **Password**: `admin123`

---

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for full details.

```text
MIT License

Copyright (c) 2026 CYBERDEMON13

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so.
```

Developed with ❤️ by [CYBERDEMON13](https://github.com/CYBERDEMON13).
