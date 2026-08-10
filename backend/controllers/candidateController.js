const { query, queryOne } = require('../config/database');
const { parseAndValidateCandidateExcel, generateCandidateImportTemplate, exportCandidatesToExcel, isValidEmail } = require('../services/excelService');
const fs = require('fs');

async function getCandidates(req, res) {
    try {
        const { search, status, department, position, view = 'active', page = 1, limit = 50 } = req.query;

        let sql = 'SELECT * FROM candidates WHERE 1=1';
        const params = [];

        if (view === 'deleted') {
            sql += ' AND is_deleted = 1';
        } else if (view === 'all') {
            // Include active & soft-deleted
        } else {
            // Default: active candidates only
            sql += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
        }

        if (search) {
            sql += ' AND (full_name LIKE ? OR email LIKE ? OR candidate_id LIKE ? OR job_position LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (status) {
            sql += ' AND application_status = ?';
            params.push(status);
        }

        if (department) {
            sql += ' AND department = ?';
            params.push(department);
        }

        if (position) {
            sql += ' AND job_position = ?';
            params.push(position);
        }

        sql += ' ORDER BY id DESC';

        const allRows = await query(sql, params);
        const total = allRows.length;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const paginatedRows = allRows.slice(offset, offset + parseInt(limit, 10));

        // Get distinct departments and positions for filter dropdowns
        const departments = (await query('SELECT DISTINCT department FROM candidates WHERE department IS NOT NULL')).map(d => d.department);
        const positions = (await query('SELECT DISTINCT job_position FROM candidates WHERE job_position IS NOT NULL')).map(p => p.job_position);

        return res.json({
            success: true,
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(total / limit),
            departments,
            positions,
            candidates: paginatedRows
        });
    } catch (err) {
        console.error('[Candidates Error]', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch candidates: ' + err.message });
    }
}

async function getCandidateById(req, res) {
    try {
        const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found.' });
        }
        return res.json({ success: true, candidate });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createCandidate(req, res) {
    try {
        const {
            candidate_id,
            full_name,
            email,
            phone,
            job_position,
            department,
            company_name,
            joining_date,
            salary,
            address,
            application_status
        } = req.body;

        if (!full_name || !email || !job_position || !department || !joining_date || !salary) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (Name, Email, Job Position, Department, Joining Date, Salary).' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address syntax.' });
        }

        const existingEmail = await queryOne('SELECT id FROM candidates WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: `Candidate with email "${email}" already exists.` });
        }

        const safeCandidateId = candidate_id || `CAND-${Math.floor(1000 + Math.random() * 9000)}`;
        const company = company_name || 'TechVision Global Inc.';
        const status = application_status || 'Pending';

        const result = await query(
            `INSERT INTO candidates 
            (candidate_id, full_name, email, phone, job_position, department, company_name, joining_date, salary, address, application_status, offer_letter_status, email_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not Generated', 'Pending')`,
            [safeCandidateId, full_name, email, phone || '', job_position, department, company, joining_date, salary, address || '', status]
        );

        const newCandidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [result.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Candidate added successfully.',
            candidate: newCandidate
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to add candidate: ' + err.message });
    }
}

async function updateCandidate(req, res) {
    try {
        const { id } = req.params;
        const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [id]);

        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found.' });
        }

        const {
            full_name,
            email,
            phone,
            job_position,
            department,
            company_name,
            joining_date,
            salary,
            address,
            application_status
        } = req.body;

        if (email && email !== candidate.email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email address.' });
            }
            const existingEmail = await queryOne('SELECT id FROM candidates WHERE email = ? AND id != ?', [email, id]);
            if (existingEmail) {
                return res.status(400).json({ success: false, message: `Email "${email}" is already assigned to another candidate.` });
            }
        }

        await query(
            `UPDATE candidates SET 
            full_name = ?, email = ?, phone = ?, job_position = ?, department = ?, 
            company_name = ?, joining_date = ?, salary = ?, address = ?, application_status = ?
            WHERE id = ?`,
            [
                full_name || candidate.full_name,
                email || candidate.email,
                phone !== undefined ? phone : candidate.phone,
                job_position || candidate.job_position,
                department || candidate.department,
                company_name || candidate.company_name,
                joining_date || candidate.joining_date,
                salary || candidate.salary,
                address !== undefined ? address : candidate.address,
                application_status || candidate.application_status,
                id
            ]
        );

        const updatedCandidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Candidate updated successfully.', candidate: updatedCandidate });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Update failed: ' + err.message });
    }
}

async function deleteCandidate(req, res) {
    try {
        const { id } = req.params;
        const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found.' });
        }

        // Soft delete: keep record in database, update is_deleted flag
        await query('UPDATE candidates SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        return res.json({ success: true, message: `Candidate ${candidate.full_name} moved to Trash (data safely preserved in database).` });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Delete failed: ' + err.message });
    }
}

async function bulkDeleteCandidates(req, res) {
    try {
        const { candidateIds } = req.body;
        if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select candidates to delete.' });
        }

        const placeholders = candidateIds.map(() => '?').join(',');
        // Soft delete: keep records in database, update is_deleted flag
        await query(`UPDATE candidates SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`, candidateIds);

        return res.json({ 
            success: true, 
            message: `Successfully moved ${candidateIds.length} candidate(s) to Trash (data safely preserved in database).`,
            deletedCount: candidateIds.length 
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Bulk delete failed: ' + err.message });
    }
}

async function restoreCandidate(req, res) {
    try {
        const { id } = req.params;
        const candidate = await queryOne('SELECT * FROM candidates WHERE id = ?', [id]);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found.' });
        }

        await query('UPDATE candidates SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [id]);
        return res.json({ success: true, message: `Candidate ${candidate.full_name} restored successfully.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Restore failed: ' + err.message });
    }
}

async function previewExcelImport(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an Excel or CSV file.' });
        }

        const parseResult = await parseAndValidateCandidateExcel(req.file.path);

        // Remove temp file after parsing
        fs.unlink(req.file.path, () => {});

        return res.json({
            success: true,
            message: `File parsed successfully. Found ${parseResult.validCount} valid records and ${parseResult.invalidCount} invalid/duplicate records.`,
            data: parseResult
        });
    } catch (err) {
        if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, message: 'Import parsing error: ' + err.message });
    }
}

async function confirmExcelImport(req, res) {
    try {
        const { candidates } = req.body;
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid candidate records provided to import.' });
        }

        let importedCount = 0;
        let skippedCount = 0;

        for (const c of candidates) {
            try {
                // Double check email uniqueness
                const exists = await queryOne('SELECT id FROM candidates WHERE email = ?', [c.email]);
                if (exists) {
                    skippedCount++;
                    continue;
                }

                const safeId = c.candidate_id || `CAND-${Math.floor(1000 + Math.random() * 9000)}`;

                await query(
                    `INSERT INTO candidates 
                    (candidate_id, full_name, email, phone, job_position, department, company_name, joining_date, salary, address, application_status, offer_letter_status, email_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not Generated', 'Pending')`,
                    [
                        safeId,
                        c.full_name,
                        c.email,
                        c.phone || '',
                        c.job_position,
                        c.department,
                        c.company_name || 'TechVision Global Inc.',
                        c.joining_date,
                        c.salary,
                        c.address || '',
                        c.application_status || 'Pending'
                    ]
                );
                importedCount++;
            } catch (e) {
                skippedCount++;
            }
        }

        return res.json({
            success: true,
            message: `Successfully imported ${importedCount} candidates. ${skippedCount} records skipped due to duplicates or errors.`,
            importedCount,
            skippedCount
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Import confirmation failed: ' + err.message });
    }
}

async function downloadImportTemplate(req, res) {
    try {
        const buffer = await generateCandidateImportTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Candidate_Import_Template.xlsx"');
        return res.send(buffer);
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to generate template file.' });
    }
}

async function exportCandidates(req, res) {
    try {
        const candidates = await query('SELECT * FROM candidates ORDER BY id DESC');
        const buffer = await exportCandidatesToExcel(candidates);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Candidates_Export_${Date.now()}.xlsx"`);
        return res.send(buffer);
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
    }
}

module.exports = {
    getCandidates,
    getCandidateById,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    bulkDeleteCandidates,
    restoreCandidate,
    previewExcelImport,
    confirmExcelImport,
    downloadImportTemplate,
    exportCandidates
};
