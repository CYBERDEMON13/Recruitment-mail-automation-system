const fs = require('fs');
const path = require('path');
const { query, queryOne } = require('../config/database');

const backupFilePath = path.join(__dirname, '../data/candidates_store.json');

/**
 * Save current candidates from DB to candidates_store.json
 */
async function autoBackupCandidates() {
    try {
        const candidates = await query('SELECT * FROM candidates ORDER BY id ASC');
        if (!candidates || candidates.length === 0) return;

        const dataDir = path.dirname(backupFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(backupFilePath, JSON.stringify(candidates, null, 2), 'utf8');
        console.log(`[Auto-Backup] Saved ${candidates.length} candidate(s) to ${backupFilePath}`);
    } catch (err) {
        console.error('[Auto-Backup Error]', err.message);
    }
}

/**
 * Restore candidates from candidates_store.json if DB candidates count is low/zero
 */
async function autoRestoreCandidates() {
    try {
        if (!fs.existsSync(backupFilePath)) return;

        const raw = fs.readFileSync(backupFilePath, 'utf8');
        const candidates = JSON.parse(raw);

        if (!Array.isArray(candidates) || candidates.length === 0) return;

        let restored = 0;
        for (const c of candidates) {
            const exists = await queryOne('SELECT id FROM candidates WHERE candidate_id = ? OR email = ?', [c.candidate_id, c.email]);
            if (!exists) {
                await query(
                    `INSERT INTO candidates 
                    (candidate_id, full_name, email, phone, job_position, department, company_name, joining_date, salary, address, application_status, offer_letter_status, email_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        c.candidate_id,
                        c.full_name,
                        c.email,
                        c.phone || '',
                        c.job_position,
                        c.department,
                        c.company_name || 'TechVision Global Inc.',
                        c.joining_date,
                        c.salary,
                        c.address || '',
                        c.application_status || 'Pending',
                        c.offer_letter_status || 'Not Generated',
                        c.email_status || 'Pending',
                        c.is_deleted || 0
                    ]
                );
                restored++;
            }
        }
        if (restored > 0) {
            console.log(`[Auto-Restore] Successfully restored ${restored} candidate(s) from persistent backup file.`);
        }
    } catch (err) {
        console.error('[Auto-Restore Error]', err.message);
    }
}

module.exports = {
    autoBackupCandidates,
    autoRestoreCandidates
};
