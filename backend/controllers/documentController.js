const { query, queryOne } = require('../config/database');
const { generateOfferLetterPDF, generateCertificatePDF } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

async function generateOfferLetter(req, res) {
    try {
        const { candidate_id } = req.body;

        if (!candidate_id) {
            return res.status(400).json({ success: false, message: 'Candidate ID is required.' });
        }

        const candidate = await queryOne('SELECT * FROM candidates WHERE id = ? OR candidate_id = ?', [candidate_id, candidate_id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found.' });
        }

        const companySetting = await queryOne("SELECT setting_value FROM system_settings WHERE setting_key = 'company_name'");
        const companyName = companySetting ? companySetting.setting_value : candidate.company_name;

        const docResult = await generateOfferLetterPDF(candidate, { company_name: companyName });

        // Save generated document record in DB
        await query(
            `INSERT INTO generated_documents (candidate_id, document_type, filename, filepath) VALUES (?, 'offer_letter', ?, ?)`,
            [candidate.id, docResult.filename, docResult.relativePath]
        );

        // Update candidate offer letter status
        await query("UPDATE candidates SET offer_letter_status = 'Generated' WHERE id = ?", [candidate.id]);

        return res.json({
            success: true,
            message: `Offer Letter PDF generated successfully for ${candidate.full_name}.`,
            document: {
                filename: docResult.filename,
                downloadUrl: `/api/documents/download/${docResult.filename}`,
                relativePath: docResult.relativePath
            }
        });
    } catch (err) {
        console.error('[Document Generator Error]', err);
        return res.status(500).json({ success: false, message: 'Offer letter generation failed: ' + err.message });
    }
}

async function generateCertificate(req, res) {
    try {
        const { candidate_id, certificate_title, date } = req.body;

        if (!candidate_id) {
            return res.status(400).json({ success: false, message: 'Candidate ID is required.' });
        }

        const candidate = await queryOne('SELECT * FROM candidates WHERE id = ? OR candidate_id = ?', [candidate_id, candidate_id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found.' });
        }

        const companySetting = await queryOne("SELECT setting_value FROM system_settings WHERE setting_key = 'company_name'");
        const companyName = companySetting ? companySetting.setting_value : candidate.company_name;

        const docResult = await generateCertificatePDF(candidate, {
            company_name: companyName,
            certificate_title: certificate_title || 'CERTIFICATE OF SELECTION',
            date: date || candidate.joining_date
        });

        await query(
            `INSERT INTO generated_documents (candidate_id, document_type, filename, filepath) VALUES (?, 'certificate', ?, ?)`,
            [candidate.id, docResult.filename, docResult.relativePath]
        );

        return res.json({
            success: true,
            message: `Certificate PDF generated successfully for ${candidate.full_name}.`,
            document: {
                filename: docResult.filename,
                downloadUrl: `/api/documents/download/${docResult.filename}`,
                relativePath: docResult.relativePath
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Certificate generation failed: ' + err.message });
    }
}

async function downloadDocument(req, res) {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads/documents', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Requested PDF document file not found.' });
        }

        return res.download(filePath, filename);
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Download error: ' + err.message });
    }
}

async function getCandidateDocuments(req, res) {
    try {
        const { candidate_id } = req.params;
        const docs = await query('SELECT * FROM generated_documents WHERE candidate_id = ? ORDER BY id DESC', [candidate_id]);
        return res.json({ success: true, documents: docs });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    generateOfferLetter,
    generateCertificate,
    downloadDocument,
    getCandidateDocuments
};
