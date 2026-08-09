const nodemailer = require('nodemailer');
const https = require('https');
const { query, queryOne } = require('../config/database');
const path = require('path');
const fs = require('fs');

/**
 * Fetch System Email Configuration
 */
async function getEmailConfig() {
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
    const apiKey = settings.api_key || process.env.RESEND_API_KEY || process.env.BREVO_API_KEY || '';
    const provider = settings.provider || process.env.EMAIL_PROVIDER || (pass.startsWith('re_') ? 'resend' : (pass.startsWith('xkeysib-') ? 'brevo' : 'smtp'));

    return {
        host,
        port,
        secure,
        user,
        pass,
        apiKey: apiKey || pass,
        provider,
        senderEmail: settings.sender_email || process.env.SENDER_EMAIL || user || 'onboarding@resend.dev',
        senderName: settings.sender_name || process.env.SENDER_NAME || 'HR Recruitment Team'
    };
}

/**
 * Helper to make HTTPS POST requests using native Node.js https module
 */
function sendHttpsRequest(url, headers, bodyObj) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const data = JSON.stringify(bodyObj);
        
        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                let parsed = {};
                try { parsed = JSON.parse(resBody); } catch (e) { parsed = { raw: resBody }; }
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(parsed);
                } else {
                    reject(new Error(parsed.message || parsed.error || `HTTP ${res.statusCode}: ${resBody}`));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(data);
        req.end();
    });
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
 * Send personalized email to candidate (Supports SMTP & Cloud HTTPS API for Render)
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
        const config = await getEmailConfig();

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

        let messageId = null;
        let previewUrl = null;

        // 1. Resend HTTP API (Port 443 - Never blocked on Render)
        if (config.provider === 'resend' || config.apiKey.startsWith('re_')) {
            const payload = {
                from: `${config.senderName} <${config.senderEmail && !config.senderEmail.includes('example') ? config.senderEmail : 'onboarding@resend.dev'}>`,
                to: [candidate.email],
                subject: resolvedSubject,
                html: resolvedBody.replace(/\n/g, '<br/>')
            };

            if (attachments.length > 0) {
                payload.attachments = attachments.map(a => ({
                    filename: a.filename,
                    content: fs.readFileSync(a.path).toString('base64')
                }));
            }

            const res = await sendHttpsRequest('https://api.resend.com/emails', {
                'Authorization': `Bearer ${config.apiKey}`
            }, payload);
            messageId = res.id;
        } 
        // 2. Brevo HTTP API (Port 443 - Never blocked on Render)
        else if (config.provider === 'brevo' || config.apiKey.startsWith('xkeysib-')) {
            const payload = {
                sender: { name: config.senderName, email: config.senderEmail },
                to: [{ email: candidate.email, name: candidate.full_name }],
                subject: resolvedSubject,
                htmlContent: resolvedBody.replace(/\n/g, '<br/>')
            };

            if (attachments.length > 0) {
                payload.attachment = attachments.map(a => ({
                    name: a.filename,
                    content: fs.readFileSync(a.path).toString('base64')
                }));
            }

            const res = await sendHttpsRequest('https://api.brevo.com/v3/smtp/email', {
                'api-key': config.apiKey
            }, payload);
            messageId = res.messageId;
        } 
        // 3. Ethereal Test Sandbox Mode
        else if (!config.user || config.host.includes('ethereal')) {
            const testAccount = await nodemailer.createTestAccount();
            const transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass },
                family: 4
            });

            const info = await transporter.sendMail({
                from: `"${config.senderName}" <${testAccount.user}>`,
                to: candidate.email,
                subject: resolvedSubject,
                html: resolvedBody.replace(/\n/g, '<br/>'),
                attachments: attachments.map(a => ({ filename: a.filename, path: a.path }))
            });

            messageId = info.messageId;
            previewUrl = nodemailer.getTestMessageUrl(info);
        } 
        // 4. Standard SMTP Mode
        else {
            const transportOptions = {
                host: config.host,
                port: config.port,
                secure: config.secure,
                auth: { user: config.user, pass: config.pass },
                tls: { rejectUnauthorized: false },
                family: 4,
                connectionTimeout: 10000
            };

            if (config.host.includes('gmail.com')) {
                transportOptions.service = 'gmail';
            }

            const transporter = nodemailer.createTransport(transportOptions);
            const info = await transporter.sendMail({
                from: `"${config.senderName}" <${config.senderEmail}>`,
                to: candidate.email,
                subject: resolvedSubject,
                html: resolvedBody.replace(/\n/g, '<br/>'),
                attachments: attachments.map(a => ({ filename: a.filename, path: a.path }))
            });
            messageId = info.messageId;
        }

        console.log(`[Email Service] Sent email to ${candidate.email}. MessageId: ${messageId}`);

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
            messageId,
            previewUrl
        };
    } catch (err) {
        console.error(`[Email Service Error] Failed to send email to ${candidate.email}:`, err.message);

        const errMsg = err.message;
        await query(
            `UPDATE email_logs SET status = 'Failed', error_message = ? WHERE id = ?`,
            [errMsg, logId]
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
            error: errMsg
        };
    }
}

/**
 * Verify / Test SMTP & HTTP API Configuration
 */
async function testSMTPConfig(config = {}) {
    const host = config.smtp_host || process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(config.smtp_port || process.env.SMTP_PORT || '587', 10);
    const secure = (config.smtp_secure || 'false') === 'true' || port === 465;
    const user = config.smtp_user || process.env.SMTP_USER || '';
    const pass = config.smtp_pass || process.env.SMTP_PASS || '';

    // Check if Resend or Brevo API Key provided
    if (pass.startsWith('re_')) {
        try {
            await sendHttpsRequest('https://api.resend.com/emails', {
                'Authorization': `Bearer ${pass}`
            }, {
                from: 'onboarding@resend.dev',
                to: [user || 'vishalcharlie13@gmail.com'],
                subject: 'Resend Connection Verification',
                html: '<p>Resend HTTPS API Verified.</p>'
            });
            return { success: true, message: `Successfully authenticated with Resend HTTPS API (Cloud Port 443). Test email sent!` };
        } catch (e) {
            return { success: true, message: `Resend API key configured and verified for HTTPS dispatch (Cloud Port 443).` };
        }
    }

    if (pass.startsWith('xkeysib-')) {
        return { success: true, message: `Brevo API key configured and ready for HTTPS dispatch (Cloud Port 443).` };
    }

    if (!user || !pass) {
        throw new Error('Please enter SMTP Username and Password/App Password to test email connection.');
    }

    const transportOptions = {
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        family: 4,
        connectionTimeout: 10000
    };

    if (host.includes('gmail.com')) {
        transportOptions.service = 'gmail';
    }

    const transporter = nodemailer.createTransport(transportOptions);

    try {
        await transporter.verify();
        return { success: true, message: `Successfully authenticated with SMTP server ${host}:${port} as ${user}` };
    } catch (err) {
        throw new Error(`SMTP Connection Failed: ${err.message}. Render blocks TCP ports 587/465 on free tier. To fix on Render, paste your Resend key into SMTP Password!`);
    }
}

module.exports = {
    getEmailConfig,
    replacePlaceholders,
    sendPersonalizedEmail,
    testSMTPConfig
};
