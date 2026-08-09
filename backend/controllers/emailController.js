const { query, queryOne } = require('../config/database');
const { sendPersonalizedEmail, replacePlaceholders } = require('../services/emailService');
const { generateOfferLetterPDF, generateCertificatePDF } = require('../services/pdfService');
const { generateAIEmail } = require('../services/aiService');

async function aiGenerateEmail(req, res) {
    try {
        const { prompt, templateType, tone, candidateId } = req.body;

        const aiResult = await generateAIEmail({
            prompt,
            templateType,
            tone: tone || 'Professional',
            candidateId
        });

        return res.json({
            success: true,
            message: 'AI email content generated successfully according to status.',
            aiResult
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'AI email generation failed: ' + err.message });
    }
}

async function previewEmails(req, res) {
    try {
        const { candidateIds, templateId, customSubject, customBody, attachDocumentType, autoStatusMode } = req.body;

        if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one candidate for email preview.' });
        }

        let defaultTemplate = null;
        if (templateId && templateId !== 'auto_status') {
            defaultTemplate = await queryOne('SELECT * FROM email_templates WHERE id = ?', [templateId]);
        }

        const rejectionTemplate = await queryOne("SELECT * FROM email_templates WHERE template_type = 'rejection' OR name LIKE '%rejection%' LIMIT 1");
        const offerTemplate = await queryOne("SELECT * FROM email_templates WHERE template_type = 'offer_letter' OR name LIKE '%offer%' LIMIT 1");

        const companySetting = await queryOne("SELECT setting_value FROM system_settings WHERE setting_key = 'company_name'");
        const companyName = companySetting ? companySetting.setting_value : 'TechVision Global Inc.';

        const previews = [];

        for (const cId of candidateIds) {
            const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [cId]);
            if (candidate) {
                let subjectRaw = customSubject;
                let bodyRaw = customBody;
                let effectiveAttach = attachDocumentType;

                // Smart Auto-Status Logic
                if (autoStatusMode || templateId === 'auto_status' || (!customSubject && !customBody && !templateId)) {
                    if (candidate.application_status === 'Rejected') {
                        const tpl = rejectionTemplate || defaultTemplate;
                        subjectRaw = tpl ? tpl.subject : `Update regarding your application for {{JobPosition}} at {{CompanyName}}`;
                        bodyRaw = tpl ? tpl.body : `Dear {{CandidateName}},\n\nThank you for applying for the position of {{JobPosition}} at {{CompanyName}}.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nRegards,\nHR Department\n{{CompanyName}}`;
                        effectiveAttach = 'none';
                    } else if (candidate.application_status === 'Selected') {
                        const tpl = offerTemplate || defaultTemplate;
                        subjectRaw = tpl ? tpl.subject : `Congratulations! Job Offer from {{CompanyName}}`;
                        bodyRaw = tpl ? tpl.body : `Dear {{CandidateName}},\n\nWe are pleased to offer you the position of {{JobPosition}} in the {{Department}} department.\n\nPlease find your official Offer Letter attached.\n\nRegards,\nHR Department\n{{CompanyName}}`;
                        effectiveAttach = attachDocumentType || 'offer_letter';
                    }
                }

                if (!subjectRaw && defaultTemplate) subjectRaw = defaultTemplate.subject;
                if (!bodyRaw && defaultTemplate) bodyRaw = defaultTemplate.body;

                const resolvedSubject = replacePlaceholders(subjectRaw || 'Recruitment Notice from {{CompanyName}}', candidate, companyName);
                const resolvedBody = replacePlaceholders(bodyRaw || 'Dear {{CandidateName}},\n\nPlease contact HR for updates.', candidate, companyName);

                previews.push({
                    candidateId: candidate.id,
                    candidateName: candidate.full_name,
                    email: candidate.email,
                    applicationStatus: candidate.application_status,
                    jobPosition: candidate.job_position,
                    subject: resolvedSubject,
                    body: resolvedBody,
                    attachment: effectiveAttach || (candidate.application_status === 'Selected' ? 'offer_letter' : 'None')
                });
            }
        }

        return res.json({
            success: true,
            total: previews.length,
            previews
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Preview generation failed: ' + err.message });
    }
}

async function sendEmails(req, res) {
    try {
        const { candidateIds, templateId, customSubject, customBody, attachDocumentType, autoStatusMode } = req.body;

        if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select candidates to send email.' });
        }

        const rejectionTemplate = await queryOne("SELECT * FROM email_templates WHERE template_type = 'rejection' OR name LIKE '%rejection%' LIMIT 1");
        const offerTemplate = await queryOne("SELECT * FROM email_templates WHERE template_type = 'offer_letter' OR name LIKE '%offer%' LIMIT 1");
        let defaultTemplate = null;

        if (templateId && templateId !== 'auto_status') {
            defaultTemplate = await queryOne('SELECT * FROM email_templates WHERE id = ?', [templateId]);
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const cId of candidateIds) {
            const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [cId]);
            if (!candidate) continue;

            let subjectRaw = customSubject;
            let bodyRaw = customBody;
            let effectiveAttach = attachDocumentType;
            let effectiveTemplateId = templateId;

            // Auto-Status Smart Routing
            if (autoStatusMode || templateId === 'auto_status' || (!customSubject && !customBody && !templateId)) {
                if (candidate.application_status === 'Rejected') {
                    const tpl = rejectionTemplate || defaultTemplate;
                    subjectRaw = tpl ? tpl.subject : `Update regarding your application for {{JobPosition}} at {{CompanyName}}`;
                    bodyRaw = tpl ? tpl.body : `Dear {{CandidateName}},\n\nThank you for applying. We regret to inform you that we are not moving forward.`;
                    effectiveAttach = 'none';
                    effectiveTemplateId = tpl ? tpl.id : null;
                } else if (candidate.application_status === 'Selected') {
                    const tpl = offerTemplate || defaultTemplate;
                    subjectRaw = tpl ? tpl.subject : `Congratulations! Job Offer from {{CompanyName}}`;
                    bodyRaw = tpl ? tpl.body : `Dear {{CandidateName}},\n\nWe are pleased to offer you the position of {{JobPosition}}.`;
                    effectiveAttach = attachDocumentType || 'offer_letter';
                    effectiveTemplateId = tpl ? tpl.id : null;
                }
            }

            // --- AUTOMATIC PDF GENERATION & ATTACHMENT ENGINE ---
            let attachmentPath = null;

            if (effectiveAttach === 'offer_letter' || (candidate.application_status === 'Selected' && effectiveAttach !== 'none')) {
                // First check if document was already generated
                const existingDoc = await queryOne("SELECT * FROM generated_documents WHERE candidate_id = ? AND document_type = 'offer_letter' ORDER BY id DESC LIMIT 1", [candidate.id]);
                if (existingDoc && existingDoc.filepath) {
                    attachmentPath = existingDoc.filepath;
                } else {
                    // Generate new executive Offer Letter PDF on the fly!
                    try {
                        const pdfRes = await generateOfferLetterPDF(candidate);
                        attachmentPath = pdfRes.relativePath;
                        await query("INSERT INTO generated_documents (candidate_id, document_type, filename, filepath) VALUES (?, 'offer_letter', ?, ?)",
                            [candidate.id, pdfRes.filename, pdfRes.relativePath]
                        );
                        await query("UPDATE candidates SET offer_letter_status = 'Generated' WHERE id = ?", [candidate.id]);
                        console.log(`[Auto Attachment Engine] Automatically generated & attached Offer Letter PDF for candidate ${candidate.full_name}`);
                    } catch (docErr) {
                        console.error('[Doc Gen Attachment Error]', docErr);
                    }
                }
            } else if (effectiveAttach === 'certificate') {
                const existingDoc = await queryOne("SELECT * FROM generated_documents WHERE candidate_id = ? AND document_type = 'certificate' ORDER BY id DESC LIMIT 1", [candidate.id]);
                if (existingDoc && existingDoc.filepath) {
                    attachmentPath = existingDoc.filepath;
                } else {
                    try {
                        const pdfRes = await generateCertificatePDF(candidate);
                        attachmentPath = pdfRes.relativePath;
                        await query("INSERT INTO generated_documents (candidate_id, document_type, filename, filepath) VALUES (?, 'certificate', ?, ?)",
                            [candidate.id, pdfRes.filename, pdfRes.relativePath]
                        );
                        console.log(`[Auto Attachment Engine] Automatically generated & attached Certificate PDF for candidate ${candidate.full_name}`);
                    } catch (docErr) {
                        console.error('[Doc Gen Attachment Error]', docErr);
                    }
                }
            }

            const sendRes = await sendPersonalizedEmail({
                candidateId: candidate.id,
                templateId: effectiveTemplateId || null,
                customSubject: subjectRaw,
                customBody: bodyRaw,
                attachmentPath
            });

            if (sendRes.success) {
                successCount++;
            } else {
                failureCount++;
            }

            results.push(sendRes);
        }

        return res.json({
            success: true,
            message: `Email automation complete. Sent ${successCount} emails successfully with automatic PDF attachments. ${failureCount} failed.`,
            summary: {
                total: candidateIds.length,
                successCount,
                failureCount
            },
            results
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Email dispatch failed: ' + err.message });
    }
}

async function getEmailHistory(req, res) {
    try {
        const { candidate, status, template, search, page = 1, limit = 50 } = req.query;

        let sql = `
            SELECT 
                el.*, 
                c.full_name as candidate_name, 
                c.job_position,
                t.name as template_name 
            FROM email_logs el
            LEFT JOIN candidates c ON el.candidate_id = c.id
            LEFT JOIN email_templates t ON el.template_id = t.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND el.status = ?';
            params.push(status);
        }

        if (candidate) {
            sql += ' AND (c.full_name LIKE ? OR el.recipient_email LIKE ?)';
            params.push(`%${candidate}%`, `%${candidate}%`);
        }

        if (template) {
            sql += ' AND el.template_id = ?';
            params.push(template);
        }

        if (search) {
            sql += ' AND (el.subject LIKE ? OR el.recipient_email LIKE ? OR c.full_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY el.id DESC';

        const logs = await query(sql, params);
        const total = logs.length;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const paginatedLogs = logs.slice(offset, offset + parseInt(limit, 10));

        return res.json({
            success: true,
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(total / limit),
            logs: paginatedLogs
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch email logs: ' + err.message });
    }
}

async function retryFailedEmail(req, res) {
    try {
        const { logId } = req.params;
        const log = await queryOne('SELECT * FROM email_logs WHERE id = ?', [logId]);

        if (!log) {
            return res.status(404).json({ success: false, message: 'Email log record not found.' });
        }

        const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [log.candidate_id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Associated candidate no longer exists.' });
        }

        // Check if attachment path missing, auto-generate if selected
        let attachmentPath = log.attachment_path;
        if (!attachmentPath && candidate.application_status === 'Selected') {
            try {
                const pdfRes = await generateOfferLetterPDF(candidate);
                attachmentPath = pdfRes.relativePath;
            } catch (e) {
                console.error('[Retry Auto Doc Error]', e);
            }
        }

        const sendRes = await sendPersonalizedEmail({
            candidateId: candidate.id,
            templateId: log.template_id,
            customSubject: log.subject,
            customBody: log.body,
            attachmentPath
        });

        if (sendRes.success) {
            return res.json({ success: true, message: `Successfully retried email to ${candidate.email}.` });
        } else {
            return res.status(500).json({ success: false, message: `Retry failed: ${sendRes.error}` });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Retry process encountered error: ' + err.message });
    }
}

module.exports = {
    aiGenerateEmail,
    previewEmails,
    sendEmails,
    getEmailHistory,
    retryFailedEmail
};
