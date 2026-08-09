const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate Professional Executive Offer Letter PDF
 */
function generateOfferLetterPDF(candidate, companyInfo = {}) {
    return new Promise((resolve, reject) => {
        try {
            const companyName = companyInfo.company_name || candidate.company_name || 'TechVision Global Inc.';
            const safeCandidateId = candidate.candidate_id || `CAND-${candidate.id}`;
            const filename = `Offer_Letter_${safeCandidateId}_${Date.now()}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            // A4 dimensions: 595.28 x 841.89 points
            const doc = new PDFDocument({ margin: 45, size: 'A4' });
            const writeStream = fs.createWriteStream(filepath);

            doc.pipe(writeStream);

            // Premium Corporate Palette
            const primaryColor = '#0f172a';   // Deep Slate Navy
            const accentBlue = '#2563eb';     // Vibrant Sapphire Blue
            const lightAccent = '#f8fafc';    // Soft Off-White Background
            const textDark = '#1e293b';       // Dark Charcoal Body Text
            const textMuted = '#64748b';      // Muted Slate Text
            const borderGray = '#cbd5e1';     // Light Gray Border

            // --- 1. TOP BRAND ACCENT BARS ---
            doc.rect(0, 0, 595, 8).fill(accentBlue);
            doc.rect(0, 8, 595, 4).fill(primaryColor);

            // --- 2. EXECUTIVE COMPANY HEADER ---
            doc.fillColor(primaryColor)
                .fontSize(22)
                .font('Helvetica-Bold')
                .text(companyName.toUpperCase(), 45, 40);

            doc.fillColor(accentBlue)
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('GLOBAL HUMAN CAPITAL MANAGEMENT & RECRUITMENT DIVISION', 45, 66);

            doc.fillColor(textMuted)
                .fontSize(8)
                .font('Helvetica')
                .text('Corporate HQ • Innovation Parkway, Building A • www.techvision.com', 45, 78);

            // Header Separator Line
            doc.strokeColor(accentBlue).lineWidth(1.5).moveTo(45, 94).lineTo(550, 94).stroke();

            // --- 3. DOCUMENT METADATA BLOCK ---
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold')
                .text(`DATE: ${currentDate}`, 45, 110)
                .text(`REF ID: HR-OFFER-${safeCandidateId}`, 380, 110, { align: 'right' });

            // --- 4. RECIPIENT ADDRESS BLOCK ---
            let currentY = 135;
            doc.fillColor(textMuted).fontSize(8.5).font('Helvetica-Bold').text('STRICTLY CONFIDENTIAL', 45, currentY);
            currentY += 14;

            doc.fillColor(textDark).fontSize(9.5).font('Helvetica-Bold').text('PREPARED FOR:', 45, currentY);
            currentY += 14;

            doc.fillColor(accentBlue).fontSize(12).font('Helvetica-Bold').text(candidate.full_name, 45, currentY);
            currentY += 16;

            doc.fillColor(textDark).fontSize(9).font('Helvetica')
                .text(`Email: ${candidate.email}`, 45, currentY);
            currentY += 12;

            if (candidate.phone) {
                doc.text(`Phone: ${candidate.phone}`, 45, currentY);
                currentY += 12;
            }

            if (candidate.address) {
                doc.text(`Address: ${candidate.address}`, 45, currentY, { width: 350 });
                currentY += 14;
            }

            currentY += 10;

            // --- 5. SUBJECT HEADER BOX ---
            doc.rect(45, currentY, 505, 30).fill(lightAccent).strokeColor(accentBlue).lineWidth(1).stroke();
            doc.fillColor(primaryColor)
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(`OFFICIAL OFFER OF EMPLOYMENT: ${candidate.job_position.toUpperCase()}`, 55, currentY + 9);

            currentY += 45;

            // --- 6. FORMAL SALUTATION & OPENING ---
            doc.fillColor(textDark).font('Helvetica').fontSize(9.5);

            doc.text(`Dear ${candidate.full_name},`, 45, currentY);
            currentY += 18;

            doc.text(
                `On behalf of ${companyName}, it is our distinct pleasure to formally extend to you an offer of employment for the position of `,
                45, currentY, { continued: true }
            ).font('Helvetica-Bold').fillColor(accentBlue).text(`${candidate.job_position}`, { continued: true })
                .font('Helvetica').fillColor(textDark).text(` within our `)
                .font('Helvetica-Bold').text(`${candidate.department}`, { continued: true })
                .font('Helvetica').text(` team.`);

            currentY += 32;

            doc.text(
                `Following our rigorous selection process, your exceptional professional background, technical acumen, and leadership capabilities distinguished you as the ideal candidate to drive our organization's strategic vision forward.`,
                45, currentY, { width: 505, align: 'justify', lineGap: 3 }
            );

            currentY += 42;

            // --- 7. COMPENSATION & TERMS TABLE ---
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10)
                .text('SUMMARY OF EMPLOYMENT TERMS & COMPENSATION', 45, currentY);
            currentY += 15;

            // Outer Table Container
            const tableY = currentY;
            const tableHeight = 110;
            doc.rect(45, tableY, 505, tableHeight).fill('#ffffff').strokeColor(borderGray).lineWidth(1).stroke();

            // Alternating Row Backgrounds
            doc.rect(46, tableY + 1, 503, 27).fill('#f1f5f9');
            doc.rect(46, tableY + 55, 503, 27).fill('#f1f5f9');

            // Table Grid Data
            const rows = [
                { label: 'Designation / Role:', value: candidate.job_position },
                { label: 'Department / Division:', value: candidate.department },
                { label: 'Tentative Start Date:', value: candidate.joining_date },
                { label: 'Annual Compensation Package:', value: candidate.salary }
            ];

            let rowY = tableY + 8;
            rows.forEach((r) => {
                doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9)
                    .text(r.label, 60, rowY);
                doc.fillColor(textDark).font('Helvetica-Bold').fontSize(9)
                    .text(r.value, 230, rowY);
                rowY += 27;
            });

            currentY = tableY + tableHeight + 25;

            // --- 8. EMPLOYMENT CONTINGENCIES & BENEFITS ---
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10)
                .text('KEY TERMS & BENEFIT HIGHLIGHTS', 45, currentY);
            currentY += 16;

            const bulletPoints = [
                'Comprehensive Health, Dental, Vision & Life Insurance coverage starting on Day 1.',
                'Flexible Paid Time Off (PTO) package and standard annual corporate holidays.',
                '401(k) / Retirement Savings Plan with immediate employer matching contribution.',
                'This offer is contingent upon successful completion of standard background checks and verification of work authorization.'
            ];

            doc.fillColor(textDark).font('Helvetica').fontSize(9);
            bulletPoints.forEach((pt) => {
                doc.fillColor(accentBlue).text('▪ ', 45, currentY, { continued: true })
                    .fillColor(textDark).text(pt, { width: 490, align: 'left' });
                currentY += 16;
            });

            currentY += 15;

            doc.text(
                `To confirm your acceptance of this offer, please sign, date, and return this document to the Human Resources department on or before your scheduled start date.`,
                45, currentY, { width: 505, align: 'justify' }
            );

            currentY += 35;

            // --- 9. FORMAL SIGNATURE BLOCK ---
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9.5)
                .text('FOR AND ON BEHALF OF:', 45, currentY)
                .text('ACCEPTANCE & ACKNOWLEDGEMENT:', 330, currentY);

            currentY += 35;

            // Signature Lines
            doc.strokeColor(primaryColor).lineWidth(1)
                .moveTo(45, currentY).lineTo(220, currentY).stroke()
                .moveTo(330, currentY).lineTo(520, currentY).stroke();

            currentY += 8;

            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9.5)
                .text('Director of Human Resources', 45, currentY)
                .text(candidate.full_name, 330, currentY);

            currentY += 14;

            doc.fillColor(textMuted).font('Helvetica').fontSize(8.5)
                .text(`${companyName} Executive Office`, 45, currentY)
                .text('Candidate Signature & Date', 330, currentY);

            // --- 10. EXECUTIVE FOOTER ---
            doc.rect(0, 805, 595, 37).fill(primaryColor);
            doc.fillColor('#ffffff').fontSize(8).font('Helvetica')
                .text(`${companyName.toUpperCase()} • CONFIDENTIAL EMPLOYMENT DOCUMENT • ALL RIGHTS RESERVED`, 45, 818, { align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                resolve({ filename, filepath, relativePath: `/uploads/documents/${filename}` });
            });

            writeStream.on('error', (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Generate Professional Certificate PDF
 */
function generateCertificatePDF(candidate, certificateData = {}) {
    return new Promise((resolve, reject) => {
        try {
            const companyName = certificateData.company_name || candidate.company_name || 'TechVision Global Inc.';
            const certificateTitle = certificateData.certificate_title || 'CERTIFICATE OF SELECTION';
            const safeCandidateId = candidate.candidate_id || `CAND-${candidate.id}`;
            const filename = `Certificate_${safeCandidateId}_${Date.now()}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            // Landscape A4 orientation
            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            const writeStream = fs.createWriteStream(filepath);

            doc.pipe(writeStream);

            // Colors
            const goldColor = '#d97706';
            const navyColor = '#0f172a';
            const darkColor = '#1f2937';

            // Outer & Inner Decorative Borders
            doc.rect(20, 20, 782, 555).strokeColor(goldColor).lineWidth(4).stroke();
            doc.rect(28, 28, 766, 539).strokeColor(navyColor).lineWidth(1.5).stroke();

            // Corner Accents
            doc.rect(32, 32, 20, 20).fill(goldColor);
            doc.rect(770, 32, 20, 20).fill(goldColor);
            doc.rect(32, 540, 20, 20).fill(goldColor);
            doc.rect(770, 540, 20, 20).fill(goldColor);

            // Company Header
            doc.fillColor(navyColor).fontSize(22).font('Helvetica-Bold').text(companyName.toUpperCase(), 0, 70, { align: 'center' });
            doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text('RECRUITMENT & TALENT ACQUISITION DIVISION', 0, 96, { align: 'center' });

            doc.strokeColor(goldColor).lineWidth(1.5).moveTo(250, 115).lineTo(570, 115).stroke();

            // Certificate Title
            doc.fillColor(goldColor).fontSize(28).font('Helvetica-Bold').text(certificateTitle.toUpperCase(), 0, 145, { align: 'center' });

            // Presentation text
            doc.fillColor(darkColor).fontSize(12).font('Helvetica-Oblique').text('This certificate is proudly presented to', 0, 195, { align: 'center' });

            // Candidate Name
            doc.fillColor(navyColor).fontSize(32).font('Helvetica-Bold').text(candidate.full_name, 0, 225, { align: 'center' });
            doc.strokeColor(goldColor).lineWidth(1.5).moveTo(200, 265).lineTo(620, 265).stroke();

            // Certificate Description
            doc.fillColor(darkColor).fontSize(12).font('Helvetica')
                .text(
                    `In official recognition of successful selection and appointment for the role of ${candidate.job_position} in the ${candidate.department} Department at ${companyName}.`,
                    100, 290, { width: 620, align: 'center', lineGap: 6 }
                );

            const certDate = certificateData.date || candidate.joining_date || new Date().toLocaleDateString('en-US');
            doc.fontSize(11).text(`Issued on: ${certDate}`, 0, 350, { align: 'center' });

            // Signatures & Stamp
            doc.strokeColor('#9ca3af').lineWidth(1)
                .moveTo(150, 460).lineTo(320, 460).stroke()
                .moveTo(500, 460).lineTo(670, 460).stroke();

            doc.fillColor(navyColor).fontSize(11).font('Helvetica-Bold')
                .text('Head of Human Resources', 150, 470, { width: 170, align: 'center' })
                .text('Director of Operations', 500, 470, { width: 170, align: 'center' });

            doc.fillColor('#6b7280').fontSize(9).font('Helvetica')
                .text(companyName, 150, 485, { width: 170, align: 'center' })
                .text(companyName, 500, 485, { width: 170, align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                resolve({ filename, filepath, relativePath: `/uploads/documents/${filename}` });
            });

            writeStream.on('error', (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    generateOfferLetterPDF,
    generateCertificatePDF
};
