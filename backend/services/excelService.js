const ExcelJS = require('exceljs');
const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

/**
 * Validate email address syntax
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Parse & validate uploaded candidate Excel/CSV file
 */
async function parseAndValidateCandidateExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv') {
        await workbook.csv.readFile(filePath);
    } else {
        await workbook.xlsx.readFile(filePath);
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
        throw new Error('Spreadsheet worksheet is empty or invalid.');
    }

    // Get existing emails from DB for duplicate checking
    const existingCandidates = await query('SELECT email, candidate_id FROM candidates');
    const existingEmails = new Set(existingCandidates.map(c => String(c.email).toLowerCase()));
    const existingIds = new Set(existingCandidates.map(c => String(c.candidate_id).toLowerCase()));

    const validRecords = [];
    const invalidRecords = [];
    const seenFileEmails = new Set();

    let headerRow = null;
    const headerMap = {};

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
            // Read Headers
            headerRow = row.values.map(val => String(val || '').trim());
            headerRow.forEach((colName, index) => {
                const rawKey = colName.toLowerCase().trim();
                const cleanKey = rawKey.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                const alphaOnlyKey = rawKey.replace(/[^a-z0-9]/g, '');
                headerMap[cleanKey] = index;
                headerMap[alphaOnlyKey] = index;
                headerMap[rawKey] = index;
            });
            return;
        }

        const getVal = (colNames) => {
            for (const name of colNames) {
                const idx = headerMap[name];
                if (idx !== undefined && row.values[idx] !== undefined && row.values[idx] !== null) {
                    const raw = row.values[idx];
                    if (typeof raw === 'object' && raw.text) return raw.text.trim();
                    if (typeof raw === 'object' && raw.result) return String(raw.result).trim();
                    return String(raw).trim();
                }
            }
            return '';
        };

        const candidateId = getVal(['candidate_id', 'candidateid', 'id', 'emp_id']) || `CAND-${Math.floor(1000 + Math.random() * 9000)}`;
        const fullName = getVal(['full_name', 'fullname', 'name', 'candidate_name']);
        const email = getVal(['email', 'email_address', 'emailaddress']);
        const phone = getVal(['phone', 'phone_number', 'mobile', 'phonenumber']);
        const jobPosition = getVal(['job_position', 'jobposition', 'position', 'role', 'designation']);
        const department = getVal(['department', 'dept']);
        const companyName = getVal(['company_name', 'company', 'companyname']) || 'TechVision Global Inc.';
        let joiningDate = getVal(['joining_date', 'joiningdate', 'start_date', 'startdate', 'joiningdateyyyymmdd']);
        const salary = getVal(['salary', 'package', 'salary_package', 'salarypackage', 'offered_package', 'ctc', 'pay', 'compensation']);
        const address = getVal(['address', 'location']);
        const rawStatus = getVal(['application_status', 'applicationstatus', 'status']);
        const validStatuses = ['Selected', 'Rejected', 'Pending', 'On Hold'];
        const matchedStatus = validStatuses.find(s => s.toLowerCase() === String(rawStatus || '').trim().toLowerCase());
        const applicationStatus = matchedStatus || 'Pending';

        // Clean & Format Joining Date
        if (joiningDate) {
            if (!isNaN(Date.parse(joiningDate))) {
                joiningDate = new Date(joiningDate).toISOString().split('T')[0];
            }
        } else {
            joiningDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        }

        const candidateData = {
            candidate_id: candidateId,
            full_name: fullName,
            email: email,
            phone: phone,
            job_position: jobPosition,
            department: department,
            company_name: companyName,
            joining_date: joiningDate,
            salary: salary,
            address: address,
            application_status: applicationStatus
        };

        const errors = [];

        if (!fullName) errors.push('Full Name is required');
        if (!email) {
            errors.push('Email is required');
        } else if (!isValidEmail(email)) {
            errors.push(`Invalid email format: "${email}"`);
        } else if (existingEmails.has(email.toLowerCase())) {
            errors.push(`Email already exists in system database`);
        } else if (seenFileEmails.has(email.toLowerCase())) {
            errors.push(`Duplicate email found within upload file`);
        }

        if (!jobPosition) errors.push('Job Position is required');
        if (!department) errors.push('Department is required');
        if (!salary) errors.push('Salary/Package is required');

        if (errors.length > 0) {
            invalidRecords.push({
                rowNumber,
                candidate: candidateData,
                errors
            });
        } else {
            seenFileEmails.add(email.toLowerCase());
            validRecords.push(candidateData);
        }
    });

    return {
        totalRows: validRecords.length + invalidRecords.length,
        validCount: validRecords.length,
        invalidCount: invalidRecords.length,
        validRecords,
        invalidRecords
    };
}

/**
 * Generate Sample Excel Template for Download
 */
async function generateCandidateImportTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidate Import Template');

    worksheet.columns = [
        { header: 'Candidate ID', key: 'candidate_id', width: 15 },
        { header: 'Full Name', key: 'full_name', width: 22 },
        { header: 'Email Address', key: 'email', width: 28 },
        { header: 'Phone Number', key: 'phone', width: 18 },
        { header: 'Job Position', key: 'job_position', width: 25 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Company Name', key: 'company_name', width: 22 },
        { header: 'Joining Date (YYYY-MM-DD)', key: 'joining_date', width: 22 },
        { header: 'Salary / Package', key: 'salary', width: 18 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Application Status', key: 'application_status', width: 18 }
    ];

    // Style Header Row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E3A8A' }
    };

    // Add Sample Rows
    worksheet.addRow({
        candidate_id: 'CAND-2001',
        full_name: 'Robert Fox',
        email: 'robert.fox@example.com',
        phone: '+1 555-0199',
        job_position: 'Backend Developer',
        department: 'Engineering',
        company_name: 'TechVision Global Inc.',
        joining_date: '2026-09-01',
        salary: '$115,000 / year',
        address: '100 Tech Blvd, Silicon Valley, CA',
        application_status: 'Selected'
    });

    worksheet.addRow({
        candidate_id: 'CAND-2002',
        full_name: 'Emily Watson',
        email: 'emily.watson@example.com',
        phone: '+1 555-0133',
        job_position: 'HR Specialist',
        department: 'Human Resources',
        company_name: 'TechVision Global Inc.',
        joining_date: '2026-09-15',
        salary: '$78,000 / year',
        address: '250 Corporate Way, New York, NY',
        application_status: 'Pending'
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

/**
 * Export Candidate List to Excel Buffer
 */
async function exportCandidatesToExcel(candidates) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates Data');

    worksheet.columns = [
        { header: 'Candidate ID', key: 'candidate_id', width: 15 },
        { header: 'Full Name', key: 'full_name', width: 22 },
        { header: 'Email Address', key: 'email', width: 28 },
        { header: 'Phone Number', key: 'phone', width: 18 },
        { header: 'Job Position', key: 'job_position', width: 24 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Company Name', key: 'company_name', width: 22 },
        { header: 'Joining Date', key: 'joining_date', width: 15 },
        { header: 'Salary/Package', key: 'salary', width: 18 },
        { header: 'Application Status', key: 'application_status', width: 18 },
        { header: 'Offer Letter Status', key: 'offer_letter_status', width: 18 },
        { header: 'Email Status', key: 'email_status', width: 15 },
        { header: 'Date Added', key: 'created_at', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E3A8A' }
    };

    candidates.forEach(c => {
        worksheet.addRow({
            candidate_id: c.candidate_id,
            full_name: c.full_name,
            email: c.email,
            phone: c.phone || '',
            job_position: c.job_position,
            department: c.department,
            company_name: c.company_name,
            joining_date: c.joining_date,
            salary: c.salary,
            application_status: c.application_status,
            offer_letter_status: c.offer_letter_status,
            email_status: c.email_status,
            created_at: c.created_at
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = {
    isValidEmail,
    parseAndValidateCandidateExcel,
    generateCandidateImportTemplate,
    exportCandidatesToExcel
};
