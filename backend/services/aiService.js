const { queryOne } = require('../config/database');

/**
 * Generate AI-written email subject & body auto-tailored to candidate application status
 */
async function generateAIEmail({ prompt, templateType, tone = 'Professional', candidateId = null }) {
    let candidateData = null;
    if (candidateId) {
        candidateData = await queryOne('SELECT * FROM candidates WHERE id = ?', [candidateId]);
    }

    // Auto-detect templateType based on Candidate Application Status if not explicitly set
    let effectiveType = templateType;
    let candidateStatus = candidateData ? candidateData.application_status : null;

    if (!effectiveType && candidateStatus) {
        if (candidateStatus === 'Rejected') effectiveType = 'rejection';
        else if (candidateStatus === 'Selected') effectiveType = 'offer_letter';
        else effectiveType = 'general';
    }

    if (!effectiveType) {
        effectiveType = 'offer_letter';
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const companySetting = await queryOne("SELECT setting_value FROM system_settings WHERE setting_key = 'company_name'");
    const companyName = companySetting ? companySetting.setting_value : (candidateData?.company_name || 'TechVision Global Inc.');

    const statusContext = candidateStatus 
        ? `Candidate Application Status: ${candidateStatus}. Ensure the message outcome accurately reflects this status.`
        : '';

    const systemPrompt = `You are an expert HR Talent Acquisition Specialist at ${companyName}.
Your task is to write a highly professional, well-structured, and persuasive recruitment email.
Use placeholder tags: {{CandidateName}}, {{JobPosition}}, {{Department}}, {{JoiningDate}}, {{Salary}}, {{CompanyName}} wherever appropriate.
Tone requested: ${tone}.
Category/Type: ${effectiveType}.
${statusContext}
User Instruction: ${prompt || `Write a recruitment email matching status ${candidateStatus || effectiveType}.`}

IMPORTANT: Return ONLY a valid JSON object with keys "subject" and "body". Do not wrap in extra markdown or commentary outside JSON.`;

    if (apiKey) {
        try {
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                const text = data.candidates[0].content.parts[0].text;
                const parsed = JSON.parse(text);
                if (parsed.subject && parsed.body) {
                    return parsed;
                }
            }
        } catch (err) {
            console.warn('[AI Service Warning] External Gemini API call fallback triggered:', err.message);
        }
    }

    // Smart Native AI Generator Engine Fallback (Instant zero-dependency AI generation)
    return generateSmartFallbackEmail(effectiveType, tone, prompt, companyName, candidateStatus);
}

/**
 * Native Smart AI Template Generator
 */
function generateSmartFallbackEmail(templateType, tone, userPrompt = '', companyName = 'TechVision Global Inc.', status = null) {
    const promptLower = (userPrompt || '').toLowerCase();

    if (status === 'Rejected' || templateType === 'rejection' || promptLower.includes('reject') || promptLower.includes('regret')) {
        return {
            subject: `Update regarding your application for {{JobPosition}} at {{CompanyName}}`,
            body: `Dear {{CandidateName}},\n\nThank you for giving us the opportunity to consider your application for the {{JobPosition}} position in the {{Department}} department at {{CompanyName}}.\n\nAfter careful evaluation of all candidates, we regret to inform you that we will not be moving forward with your application for this position at this time. Our decision was a difficult one, as we received many applications from highly qualified individuals.\n\nWe genuinely appreciate your interest in {{CompanyName}} and wish you every success in your career journey.\n\nSincerely,\nHR Recruitment Team\n{{CompanyName}}`
        };
    }

    if (templateType === 'certificate' || promptLower.includes('certif') || promptLower.includes('award')) {
        return {
            subject: `Official Selection Certificate & Recognition - {{CompanyName}}`,
            body: `Dear {{CandidateName}},\n\nWe are pleased to issue your official Selection Certificate for the {{JobPosition}} position at {{CompanyName}}.\n\nThis certificate recognizes your outstanding qualifications and successful completion of our selection process. Please find your official certificate attached to this email.\n\nWarm regards,\nHR Department\n{{CompanyName}}`
        };
    }

    if (status === 'Pending' || status === 'On Hold' || promptLower.includes('interview') || promptLower.includes('schedule')) {
        return {
            subject: `Application Status Update for {{JobPosition}} - {{CompanyName}}`,
            body: `Dear {{CandidateName}},\n\nThank you for applying for the {{JobPosition}} position at {{CompanyName}}.\n\nWe wanted to inform you that your application is currently under review by our hiring team in the {{Department}} department. We are reviewing candidates carefully and will reach out with next steps shortly.\n\nThank you for your patience and continued interest in joining {{CompanyName}}.\n\nBest regards,\nRecruitment Team\n{{CompanyName}}`
        };
    }

    // Default Offer Letter AI Generation (Tone-adapted for Selected status)
    if (tone === 'Enthusiastic' || tone === 'Warm & Welcoming') {
        return {
            subject: `🎉 We'd love for you to join us as {{JobPosition}} at {{CompanyName}}!`,
            body: `Dear {{CandidateName}},\n\nWe have fantastic news! Following your interviews, our team at {{CompanyName}} was thoroughly impressed by your background and potential. We are thrilled to offer you the position of {{JobPosition}} in our {{Department}} department!\n\nKey Details of Your Offer:\n• Offered Package: {{Salary}}\n• Target Joining Date: {{JoiningDate}}\n\nPlease review your official Offer Letter attached to this email. We cannot wait to welcome you to {{CompanyName}}!\n\nWarmest regards,\nHR & Leadership Team\n{{CompanyName}}`
        };
    }

    return {
        subject: `Official Job Offer: {{JobPosition}} at {{CompanyName}}`,
        body: `Dear {{CandidateName}},\n\nFollowing our recent hiring discussions, we are pleased to extend a formal offer of employment for the position of {{JobPosition}} in the {{Department}} department at {{CompanyName}}.\n\nYour starting compensation package is {{Salary}}, with an expected start date of {{JoiningDate}}.\n\nPlease review the attached Offer Letter for complete terms and details. Kindly let us know if you have any questions before your start date.\n\nWe look forward to having you join our organization.\n\nBest regards,\nHuman Resources Department\n{{CompanyName}}`
    };
}

module.exports = {
    generateAIEmail
};
