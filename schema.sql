-- Recruitment Email Automation System - Database Schema (MySQL & SQLite Compatible)

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    avatar VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    job_position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    company_name VARCHAR(120) NOT NULL DEFAULT 'Acme Corporation',
    joining_date DATE NOT NULL,
    salary VARCHAR(50) NOT NULL,
    address TEXT,
    application_status VARCHAR(30) DEFAULT 'Pending', -- Selected, Rejected, On Hold, Pending
    offer_letter_status VARCHAR(30) DEFAULT 'Not Generated', -- Not Generated, Generated, Sent
    email_status VARCHAR(30) DEFAULT 'Pending', -- Pending, Sent, Failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'offer_letter', -- offer_letter, rejection, certificate, general
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generated_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- offer_letter, certificate
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    template_id INT,
    recipient_email VARCHAR(150) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    attachment_path VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending', -- Pending, Sent, Failed
    error_message TEXT,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Default Admin User (Password: admin123)
-- bcrypt hash for 'admin123': $2a$10$wN7YwL/9Vb0y44P9p3JmROdG6Pq9Q3g0Kk4T2yX8a/J5Y4y5h9e7G
INSERT INTO users (name, email, password, role) 
SELECT 'HR Administrator', 'admin@hr.com', '$2a$10$wN7YwL/9Vb0y44P9p3JmROdG6Pq9Q3g0Kk4T2yX8a/J5Y4y5h9e7G', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@hr.com');

-- Seed Default Email Templates
INSERT INTO email_templates (name, subject, body, template_type)
SELECT 
    'Job Offer Letter Template',
    'Congratulations! Job Offer from {{CompanyName}}',
    'Dear {{CandidateName}},\n\nCongratulations! We are delighted to extend an offer for the position of {{JobPosition}} in the {{Department}} department at {{CompanyName}}.\n\nYour offered package is {{Salary}} and your tentative joining date will be {{JoiningDate}}.\n\nPlease find your official Offer Letter attached to this email.\n\nKindly review and let us know if you have any questions.\n\nBest regards,\nHR Department\n{{CompanyName}}',
    'offer_letter'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Job Offer Letter Template');

INSERT INTO email_templates (name, subject, body, template_type)
SELECT 
    'Selection Certificate Template',
    'Official Selection Certificate - {{CompanyName}}',
    'Dear {{CandidateName}},\n\nWe are pleased to issue your official Selection Certificate for the {{JobPosition}} position at {{CompanyName}}.\n\nPlease download your certificate from the attachment.\n\nWarm regards,\nHR Team\n{{CompanyName}}',
    'certificate'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Selection Certificate Template');

INSERT INTO email_templates (name, subject, body, template_type)
SELECT 
    'Application Rejection Notice',
    'Update regarding your application for {{JobPosition}} at {{CompanyName}}',
    'Dear {{CandidateName}},\n\nThank you for giving us the opportunity to consider your application for the position of {{JobPosition}} at {{CompanyName}}.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe wish you all the best in your career endeavors.\n\nRegards,\nRecruitment Team\n{{CompanyName}}',
    'rejection'
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE name = 'Application Rejection Notice');

-- Seed Default System Settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
('smtp_host', 'smtp.ethereal.email'),
('smtp_port', '587'),
('smtp_secure', 'false'),
('sender_name', 'HR Recruitment Team'),
('sender_email', 'hr@company.com'),
('smtp_user', ''),
('smtp_pass', ''),
('company_name', 'TechVision Global Inc.')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
