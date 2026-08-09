const bcrypt = require('bcryptjs');
const { query, queryOne, dbType } = require('./database');

async function initDb() {
    try {
        console.log('[Database Init] Checking and creating database tables...');

        if (dbType === 'sqlite') {
            // Enable Foreign Keys for SQLite
            await query('PRAGMA foreign_keys = ON;');

            await query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'staff',
                    status TEXT DEFAULT 'pending',
                    avatar TEXT DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Migration for existing tables: check if status column exists
            const userPragma = await query(`PRAGMA table_info("users")`);
            const hasStatus = userPragma.some(c => c.name === 'status');
            if (!hasStatus) {
                await query(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved';`);
            }

            await query(`
                CREATE TABLE IF NOT EXISTS candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    phone TEXT,
                    job_position TEXT NOT NULL,
                    department TEXT NOT NULL,
                    company_name TEXT NOT NULL DEFAULT 'TechVision Global Inc.',
                    joining_date TEXT NOT NULL,
                    salary TEXT NOT NULL,
                    address TEXT,
                    application_status TEXT DEFAULT 'Pending',
                    offer_letter_status TEXT DEFAULT 'Not Generated',
                    email_status TEXT DEFAULT 'Pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS email_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    body TEXT NOT NULL,
                    template_type TEXT DEFAULT 'offer_letter',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS generated_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id INTEGER NOT NULL,
                    document_type TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    filepath TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                );
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS email_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id INTEGER NOT NULL,
                    template_id INTEGER,
                    recipient_email TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    body TEXT NOT NULL,
                    attachment_path TEXT,
                    status TEXT NOT NULL DEFAULT 'Pending',
                    error_message TEXT,
                    sent_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                );
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    setting_key TEXT PRIMARY KEY,
                    setting_value TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } else {
            // MySQL table creation
            await query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'staff',
                    status VARCHAR(30) DEFAULT 'pending',
                    avatar VARCHAR(255) DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS candidates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id VARCHAR(50) UNIQUE NOT NULL,
                    full_name VARCHAR(120) NOT NULL,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    phone VARCHAR(30),
                    job_position VARCHAR(100) NOT NULL,
                    department VARCHAR(100) NOT NULL,
                    company_name VARCHAR(120) NOT NULL DEFAULT 'TechVision Global Inc.',
                    joining_date DATE NOT NULL,
                    salary VARCHAR(50) NOT NULL,
                    address TEXT,
                    application_status VARCHAR(30) DEFAULT 'Pending',
                    offer_letter_status VARCHAR(30) DEFAULT 'Not Generated',
                    email_status VARCHAR(30) DEFAULT 'Pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS email_templates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    body TEXT NOT NULL,
                    template_type VARCHAR(50) DEFAULT 'offer_letter',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS generated_documents (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT NOT NULL,
                    document_type VARCHAR(50) NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    filepath VARCHAR(255) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS email_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidate_id INT NOT NULL,
                    template_id INT,
                    recipient_email VARCHAR(150) NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    body TEXT NOT NULL,
                    attachment_path VARCHAR(255),
                    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
                    error_message TEXT,
                    sent_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            `);

            await query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    setting_key VARCHAR(100) PRIMARY KEY,
                    setting_value TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
            `);
        }

        // Seed default HR Admin user
        const existingAdmin = await queryOne('SELECT * FROM users WHERE email = ?', ['admin@hr.com']);
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await query(
                'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                ['HR Administrator', 'admin@hr.com', hashedPassword, 'admin', 'approved']
            );
            console.log('[Database Init] Created default HR Admin: admin@hr.com / admin123 (Approved)');
        } else {
            // Ensure existing admin@hr.com has admin role and approved status
            await query('UPDATE users SET role = ?, status = ? WHERE email = ?', ['admin', 'approved', 'admin@hr.com']);
        }

        // Seed default Email Templates
        const templatesCount = await queryOne('SELECT COUNT(*) as count FROM email_templates');
        const count = templatesCount ? (templatesCount.count || templatesCount['COUNT(*)']) : 0;

        if (count === 0) {
            await query(`
                INSERT INTO email_templates (name, subject, body, template_type) VALUES 
                (
                    'Job Offer Letter Template',
                    'Congratulations! Job Offer from {{CompanyName}}',
                    'Dear {{CandidateName}},\n\nWe are pleased to offer you the position of {{JobPosition}} in the {{Department}} department.\n\nYour tentative joining date will be {{JoiningDate}}.\nYour offered package is {{Salary}}.\n\nPlease find your official Offer Letter attached to this email.\n\nWe look forward to having you join our organization.\n\nRegards,\nHR Department\n{{CompanyName}}',
                    'offer_letter'
                ),
                (
                    'Selection Certificate Template',
                    'Official Selection Certificate - {{CompanyName}}',
                    'Dear {{CandidateName}},\n\nCongratulations! We are delighted to award you this Selection Certificate for the {{JobPosition}} position at {{CompanyName}}.\n\nPlease find your certificate attached herewith.\n\nWarm regards,\nHR Department\n{{CompanyName}}',
                    'certificate'
                ),
                (
                    'Application Rejection Notice',
                    'Update regarding your application for {{JobPosition}} at {{CompanyName}}',
                    'Dear {{CandidateName}},\n\nThank you for taking the time to interview for the position of {{JobPosition}} at {{CompanyName}}.\n\nAfter careful consideration, we regret to inform you that we have decided to proceed with another candidate whose qualifications more closely fit our current requirements.\n\nWe appreciate your interest in {{CompanyName}} and wish you the best in your career journey.\n\nRegards,\nHR Team\n{{CompanyName}}',
                    'rejection'
                )
            `);
            console.log('[Database Init] Seeded default email templates.');
        }

        // Seed default Settings
        const defaultSettings = [
            ['smtp_host', process.env.SMTP_HOST || 'smtp.ethereal.email'],
            ['smtp_port', process.env.SMTP_PORT || '587'],
            ['smtp_secure', process.env.SMTP_SECURE || 'false'],
            ['sender_name', process.env.SENDER_NAME || 'HR Recruitment Team'],
            ['sender_email', process.env.SENDER_EMAIL || 'hr@techvision.com'],
            ['smtp_user', process.env.SMTP_USER || ''],
            ['smtp_pass', process.env.SMTP_PASS || ''],
            ['company_name', process.env.COMPANY_NAME || 'TechVision Global Inc.']
        ];

        for (const [key, val] of defaultSettings) {
            const existingSetting = await queryOne('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
            if (!existingSetting) {
                await query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', [key, val]);
            }
        }

        // Seed Sample Candidates if empty
        const candidatesCount = await queryOne('SELECT COUNT(*) as count FROM candidates');
        const cCount = candidatesCount ? (candidatesCount.count || candidatesCount['COUNT(*)']) : 0;
        if (cCount === 0) {
            await query(`
                INSERT INTO candidates (candidate_id, full_name, email, phone, job_position, department, company_name, joining_date, salary, address, application_status, offer_letter_status, email_status) VALUES
                ('CAND-1001', 'Alexander Wright', 'alex.wright@example.com', '+1 555-0192', 'Senior Software Engineer', 'Engineering', 'TechVision Global Inc.', '2026-09-01', '$120,000 / year', '123 Innovation Way, San Francisco, CA', 'Selected', 'Not Generated', 'Pending'),
                ('CAND-1002', 'Sophia Chen', 'sophia.chen@example.com', '+1 555-0144', 'Product Marketing Manager', 'Marketing', 'TechVision Global Inc.', '2026-08-25', '$95,000 / year', '456 Market St, New York, NY', 'Selected', 'Not Generated', 'Pending'),
                ('CAND-1003', 'Marcus Vance', 'marcus.vance@example.com', '+1 555-0188', 'UX/UI Designer', 'Design', 'TechVision Global Inc.', '2026-09-15', '$88,000 / year', '789 Design Blvd, Austin, TX', 'Pending', 'Not Generated', 'Pending'),
                ('CAND-1004', 'Elena Rostova', 'elena.rostova@example.com', '+1 555-0122', 'Data Scientist', 'Analytics', 'TechVision Global Inc.', '2026-09-10', '$110,000 / year', '321 Data Lane, Seattle, WA', 'On Hold', 'Not Generated', 'Pending'),
                ('CAND-1005', 'David Miller', 'david.miller@example.com', '+1 555-0177', 'DevOps Specialist', 'Engineering', 'TechVision Global Inc.', '2026-08-20', '$105,000 / year', '654 Cloud Ave, Chicago, IL', 'Rejected', 'Not Generated', 'Pending')
            `);
            console.log('[Database Init] Seeded 5 sample candidates.');
        }

        console.log('[Database Init] Database initializations completed successfully.');
    } catch (error) {
        console.error('[Database Init Error]', error);
    }
}

module.exports = initDb;
