const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate Offer Letter PDF
 */
function generateOfferLetterPDF(candidate, companyInfo = {}) {
    return new Promise((resolve, reject) => {
        try {
            const companyName = companyInfo.company_name || candidate.company_name || 'TechVision Global Inc.';
            const safeCandidateId = candidate.candidate_id || `CAND-${candidate.id}`;
            const filename = `Offer_Letter_${safeCandidateId}_${Date.now()}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const writeStream = fs.createWriteStream(filepath);

            doc.pipe(writeStream);

            // Primary Colors
            const primaryColor = '#1e3a8a'; // Deep Navy
            const secondaryColor = '#3b82f6'; // Bright Blue
            const textColor = '#1f2937'; // Dark Gray

            // Header Banner / Logo Decorative Accent
            doc.rect(0, 0, 600, 15).fill(primaryColor);

            // Company Name Header
            doc.fillColor(primaryColor)
                .fontSize(22)
                .font('Helvetica-Bold')
                .text(companyName, 50, 45);

            doc.fillColor('#6b7280')
                .fontSize(9)
                .font('Helvetica')
                .text('Human Resources Department | Official Employment Documentation', 50, 70);

            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 85).lineTo(545, 85).stroke();

            // Date & Reference
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.fillColor(textColor)
                .fontSize(10)
                .font('Helvetica')
                .text(`Date: ${currentDate}`, 50, 105)
                .text(`Ref: ${safeCandidateId}`, 400, 105, { align: 'right' });

            // Recipient Info Block
            doc.font('Helvetica-Bold').fontSize(11).text(`To,`, 50, 135);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor).text(candidate.full_name, 50, 150);
            doc.font('Helvetica').fontSize(10).fillColor(textColor)
                .text(`Email: ${candidate.email}`, 50, 166)
                .text(`Phone: ${candidate.phone || 'N/A'}`, 50, 180);

            if (candidate.address) {
                doc.text(`Address: ${candidate.address}`, 50, 194, { width: 400 });
            }

            // Subject Title Box
            doc.rect(50, 230, 495, 32).fill('#f3f4f6');
            doc.fillColor(primaryColor)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text(`SUBJECT: OFFICIAL OFFER OF EMPLOYMENT - ${candidate.job_position.toUpperCase()}`, 65, 240);

            // Body Paragraphs
            let currentY = 280;

            doc.fillColor(textColor).font('Helvetica').fontSize(10);

            doc.text(`Dear ${candidate.full_name},`, 50, currentY);
            currentY += 20;

            doc.text(
                `On behalf of ${companyName}, we are absolutely thrilled to extend an offer of employment for the position of `,
                50, currentY, { continued: true }
            ).font('Helvetica-Bold').text(`${candidate.job_position}`, { continued: true })
                .font('Helvetica').text(` in our `)
                .font('Helvetica-Bold').text(`${candidate.department}`, { continued: true })
                .font('Helvetica').text(` department.`);

            currentY += 40;

            doc.text(
                `After reviewing your background and interview performances, we believe your skills, expertise, and background make you a fantastic fit for our growing organization. Below are the terms and details of your employment offer:`,
                50, currentY, { width: 495, align: 'justify' }
            );

            currentY += 45;

            // Details Table Box
            doc.rect(50, currentY, 495, 110).fill('#f8fafc').strokeColor('#cbd5e1').lineWidth(1).stroke();

            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10)
                .text('Position / Role:', 65, currentY + 15)
                .text('Department:', 65, currentY + 38)
                .text('Tentative Start Date:', 65, currentY + 61)
                .text('Offered Compensation:', 65, currentY + 84);

            doc.fillColor(textColor).font('Helvetica')
                .text(candidate.job_position, 220, currentY + 15)
                .text(candidate.department, 220, currentY + 38)
                .text(candidate.joining_date, 220, currentY + 61)
                .text(candidate.salary, 220, currentY + 84);

            currentY += 130;

            doc.text(
                `Please review the attached terms of employment carefully. To accept this offer, please sign and return a copy of this letter on or before your start date.`,
                50, currentY, { width: 495 }
            );

            currentY += 40;

            doc.text(`We look forward to welcoming you to the ${companyName} team!`, 50, currentY);

            currentY += 50;

            // Signatures
            doc.font('Helvetica-Bold').text('Sincerely,', 50, currentY);
            doc.text('Accepted & Agreed:', 350, currentY);

            currentY += 35;

            doc.strokeColor('#9ca3af').lineWidth(1)
                .moveTo(50, currentY).lineTo(200, currentY).stroke()
                .moveTo(350, currentY).lineTo(500, currentY).stroke();

            currentY += 8;

            doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor)
                .text('HR Department', 50, currentY)
                .text(candidate.full_name, 350, currentY);

            doc.font('Helvetica').fontSize(9).fillColor('#6b7280')
                .text(companyName, 50, currentY + 14)
                .text('Candidate Signature & Date', 350, currentY + 14);

            // Footer
            doc.rect(0, 800, 600, 42).fill(primaryColor);
            doc.fillColor('#ffffff').fontSize(8).font('Helvetica')
                .text(`${companyName} • Confidential Employment Offer Letter • Page 1 of 1`, 50, 815, { align: 'center' });

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
 * Generate Certificate PDF
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
            const navyColor = '#1e3a8a';
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
            doc.fillColor(navyColor).fontSize(20).font('Helvetica-Bold').text(companyName, 0, 70, { align: 'center' });
            doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text('RECRUITMENT & TALENT ACQUISITION', 0, 96, { align: 'center' });

            doc.strokeColor(goldColor).lineWidth(1).moveTo(250, 115).lineTo(570, 115).stroke();

            // Certificate Title
            doc.fillColor(goldColor).fontSize(28).font('Helvetica-Bold').text(certificateTitle.toUpperCase(), 0, 145, { align: 'center' });

            // Presentation text
            doc.fillColor(darkColor).fontSize(12).font('Helvetica-Oblique').text('This certificate is proudly presented to', 0, 195, { align: 'center' });

            // Candidate Name
            doc.fillColor(navyColor).fontSize(30).font('Helvetica-Bold').text(candidate.full_name, 0, 225, { align: 'center' });
            doc.strokeColor(goldColor).lineWidth(1).moveTo(200, 265).lineTo(620, 265).stroke();

            // Certificate Description
            doc.fillColor(darkColor).fontSize(12).font('Helvetica')
                .text(
                    `In recognition of successful selection for the role of ${candidate.job_position} in the ${candidate.department} Department at ${companyName}.`,
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
