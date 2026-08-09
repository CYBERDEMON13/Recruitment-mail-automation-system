const nodemailer = require('nodemailer');
const { query, queryOne } = require('../config/database');
const path = require('path');
const fs = require('fs');

/**
 * Fetch SMTP Transporter dynamically from DB settings or process.env
 * Configured for maximum compatibility on local & Cloud hosts like Render.
 */
async function getTransporter() {
    const settingsRows = await query('SELECT * FROM system_settings');
    const settings = {};
    settingsRows.forEach(row => {
        settings[row.setting_key] = row.setting_value;
    });

    const host = settings.smtp_host || process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(settings.smtp_port || process.env.SMTP_PORT || '587', 10);
    const secure = (settings.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true' || port === 465;
    const user = settings.smtp_user || process.env.SMTP_USER || '';
    const pass = settings.smtp_pass || process.env.SMTP_PASS || '';

    // If no user credentials provided or using Ethereal test server
    if (!user || host.includes('ethereal')) {
        let testAccount;
        try {
            testAccount = await nodemailer.createTestAccount();
        } catch (e) {
            testAccount = { user: 'test@ethereal.email', pass: 'testpass' };
        }
        return {
            transporter: nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                },
                family: 4
            }),
            senderEmail: settings.sender_email || testAccount.user,
            senderName: settings.sender_name || 'HR Recruitment Team',
            isEthereal: true
        };
    }

    // Gmail Service or Custom Host Transport with Cloud IPv4 Enforcement
    const transportOptions = {
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { 
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        family: 4, // Force IPv4 to prevent Cloud container IPv6 connection timeouts
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    };

    if (host.includes('gmail.com')) {
        // Additional Gmail optimization for cloud hosting
        transportOptions.service = 'gmail';
    }

    const transporter = nodemailer.createTransport(transportOptions);
    return {
        transporter,
        senderEmail: settings.sender_email || process.env.SENDER_EMAIL || user || 'hr@company.com',
        senderName: settings.sender_name || process.env.SENDER_NAME || 'HR Recruitment Team',
        isEthereal: false
    };
}

/**
 * Replace placeholders in template text
 */
function replacePlaceholders(templateText, candidate, companyName = 'TechVision Global Inc.') {
    if (!templateText) return '';
    return templateText
        .replace(/\{\{CandidateName\}\}/g, candidate.full_name || '')
        .replace(/\{\{CandidateEmail\}\}/g, candidate.email || '')
        .replace(/\{\{JobPosition\}\}/g, candidate.job_position || '')
        .replace(/\{\{Department\}\}/g, candidate.department || '')
        .replace(/\{\{JoiningDate\}\}/g, candidate.joining_date || '')
        .replace(/\{\{Salary\}\}/g, candidate.salary || '')
        .replace(/\{\{CompanyName\}\}/g, candidate.company_name || companyName);
}

/**
 * Send personalized email to candidate
 */
async function sendPersonalizedEmail({ candidateId, templateId, customSubject, customBody, attachmentPath }) {
    const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [candidateId]);
    if (!candidate) {
        throw new Error(`Candidate with ID ${candidateId} not found.`);
    }

    let subject = customSubject;
    let body = customBody;
    let template = null;

    if (templateId) {
        template = await queryOne('SELECT * FROM email_templates WHERE id = ?', [templateId]);
        if (template) {
            subject = subject || template.subject;
            body = body || template.body;
        }
    }

    const companySetting = await queryOne("SELECT setting_value FROM system_settings WHERE setting_key = 'company_name'");
    const companyName = companySetting ? companySetting.setting_value : candidate.company_name;

    const resolvedSubject = replacePlaceholders(subject, candidate, companyName);
    const resolvedBody = replacePlaceholders(body, candidate, companyName);

    // Initial email log insertion with Pending status
    const logRes = await query(
        `INSERT INTO email_logs (candidate_id, template_id, recipient_email, subject, body, attachment_path, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [candidate.id, templateId || null, candidate.email, resolvedSubject, resolvedBody, attachmentPath || null]
    );

    const logId = logRes.insertId;

    try {
        const { transporter, senderEmail, senderName, isEthereal } = await getTransporter();

        const attachments = [];
        if (attachmentPath) {
            const absolutePath = path.isAbsolute(attachmentPath) 
                ? attachmentPath 
                : path.join(__dirname, '..', attachmentPath.replace(/^\//, ''));

            if (fs.existsSync(absolutePath)) {
                attachments.push({
                    filename: path.basename(absolutePath),
                    path: absolutePath
                });
            }
        }

        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to: candidate.email,
            subject: resolvedSubject,
            text: resolvedBody,
            html: resolvedBody.replace(/\n/g, '<br/>'),
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        let previewUrl = null;

        if (isEthereal) {
            previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`[Email Service] Ethereal Captured Test Preview URL: ${previewUrl}`);
        }

        console.log(`[Email Service] Sent email to ${candidate.email}. MessageId: ${info.messageId}`);

        // Update Log to Sent
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        await query(
            `UPDATE email_logs SET status = 'Sent', sent_at = ?, error_message = ? WHERE id = ?`,
            [now, previewUrl ? `Test Preview Link: ${previewUrl}` : null, logId]
        );

        // Update candidate email_status & offer_letter_status if attached
        let offerStatusUpdate = candidate.offer_letter_status;
        if (attachmentPath && attachmentPath.includes('Offer_Letter')) {
            offerStatusUpdate = 'Sent';
        }
        await query(
            `UPDATE candidates SET email_status = 'Sent', offer_letter_status = ? WHERE id = ?`,
            [offerStatusUpdate, candidate.id]
        );

        return {
            success: true,
            logId,
            recipient: candidate.email,
            status: 'Sent',
            messageId: info.messageId,
            previewUrl
        };
    } catch (err) {
        console.error(`[Email Service Error] Failed to send email to ${candidate.email}:`, err.message);

        await query(
            `UPDATE email_logs SET status = 'Failed', error_message = ? WHERE id = ?`,
            [err.message, logId]
        );

        await query(
            `UPDATE candidates SET email_status = 'Failed' WHERE id = ?`,
            [candidate.id]
        );

        return {
            success: false,
            logId,
            recipient: candidate.email,
            status: 'Failed',
            error: err.message
        };
    }
}

/**
 * Verify / Test SMTP Configuration
 */
async function testSMTPConfig(config = {}) {
    const host = config.smtp_host || process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(config.smtp_port || process.env.SMTP_PORT || '587', 10);
    const secure = (config.smtp_secure || 'false') === 'true' || port === 465;
    const user = config.smtp_user || process.env.SMTP_USER || '';
    const pass = config.smtp_pass || process.env.SMTP_PASS || '';

    if (!user || !pass) {
        throw new Error('Please enter both SMTP Username and Password/App Password to test real email sending.');
    }

    const transportOptions = {
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { 
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        family: 4,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    };

    if (host.includes('gmail.com')) {
        transportOptions.service = 'gmail';
    }

    const transporter = nodemailer.createTransport(transportOptions);

    try {
        await transporter.verify();
        return { success: true, message: `Successfully authenticated with SMTP server ${host}:${port} as ${user}` };
    } catch (err) {
        let hint = '';
        if (host.includes('gmail')) {
            hint = ' For Gmail on Cloud hosts: Ensure 2-Step Verification is ON, use 16-char App Password, and try Port 465 (SSL) if Port 587 is blocked by your cloud provider.';
        }
        throw new Error(`SMTP Connection Failed: ${err.message}.${hint}`);
    }
}

module.exports = {
    getTransporter,
    replacePlaceholders,
    sendPersonalizedEmail,
    testSMTPConfig
};
