const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/securityMiddleware');

// Controllers
const authController = require('../controllers/authController');
const candidateController = require('../controllers/candidateController');
const documentController = require('../controllers/documentController');
const templateController = require('../controllers/templateController');
const emailController = require('../controllers/emailController');
const dashboardController = require('../controllers/dashboardController');
const settingsController = require('../controllers/settingsController');
const databaseController = require('../controllers/databaseController');
const userController = require('../controllers/userController');
const socController = require('../controllers/socController');

// Multer Upload Setup
const uploadsDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `import_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// Security Rate Limiters for Auth & Sensitive Operations
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 30 });

// --- AUTH ROUTES ---
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/google-login', authLimiter, authController.googleLogin);
router.get('/auth/me', authenticateToken, authController.getProfile);
router.put('/auth/profile', authenticateToken, authController.updateProfile);

// --- DASHBOARD ROUTES ---
router.get('/dashboard/stats', authenticateToken, dashboardController.getDashboardStats);

// --- CANDIDATE ROUTES ---
router.get('/candidates', authenticateToken, candidateController.getCandidates);
router.get('/candidates/export', authenticateToken, candidateController.exportCandidates);
router.get('/candidates/import/template', authenticateToken, candidateController.downloadImportTemplate);
router.post('/candidates/import/preview', authenticateToken, upload.single('file'), candidateController.previewExcelImport);
router.post('/candidates/import/confirm', authenticateToken, candidateController.confirmExcelImport);
router.post('/candidates', authenticateToken, candidateController.createCandidate);
router.get('/candidates/:id', authenticateToken, candidateController.getCandidateById);
router.put('/candidates/:id', authenticateToken, candidateController.updateCandidate);
router.delete('/candidates/:id', authenticateToken, candidateController.deleteCandidate);

// --- DOCUMENT GENERATOR ROUTES ---
router.post('/documents/generate-offer-letter', authenticateToken, documentController.generateOfferLetter);
router.post('/documents/generate-certificate', authenticateToken, documentController.generateCertificate);
router.get('/documents/download/:filename', documentController.downloadDocument);
router.get('/documents/candidate/:candidate_id', authenticateToken, documentController.getCandidateDocuments);

// --- EMAIL TEMPLATE ROUTES ---
router.get('/email-templates', authenticateToken, templateController.getTemplates);
router.get('/email-templates/:id', authenticateToken, templateController.getTemplateById);
router.post('/email-templates', authenticateToken, templateController.createTemplate);
router.put('/email-templates/:id', authenticateToken, templateController.updateTemplate);
router.delete('/email-templates/:id', authenticateToken, templateController.deleteTemplate);

// --- EMAIL AUTOMATION & AI WRITER ROUTES ---
router.post('/emails/ai-generate', authenticateToken, emailController.aiGenerateEmail);
router.post('/emails/preview', authenticateToken, emailController.previewEmails);
router.post('/emails/send', authenticateToken, emailController.sendEmails);
router.get('/emails/history', authenticateToken, emailController.getEmailHistory);
router.post('/emails/retry/:logId', authenticateToken, emailController.retryFailedEmail);

// --- SETTINGS ROUTES ---
router.get('/settings', authenticateToken, settingsController.getSettings);
router.put('/settings', authenticateToken, settingsController.updateSettings);
router.post('/settings/test-smtp', authenticateToken, settingsController.testSMTP);

// --- ADMIN USER ACCESS & ROLE MANAGEMENT (STRICTLY ADMIN ONLY) ---
router.get('/admin/users', authenticateToken, authorizeRole('admin'), userController.getUsers);
router.put('/admin/users/:id/approve', authenticateToken, authorizeRole('admin'), userController.approveUser);
router.put('/admin/users/:id/reject', authenticateToken, authorizeRole('admin'), userController.rejectUser);
router.delete('/admin/users/:id', authenticateToken, authorizeRole('admin'), userController.deleteUser);

// --- ADMIN DATABASE EXPLORER (STRICTLY ADMIN ONLY) ---
router.get('/admin/database/tables', authenticateToken, authorizeRole('admin'), databaseController.getTables);
router.get('/admin/database/tables/:tableName', authenticateToken, authorizeRole('admin'), databaseController.getTableData);

// --- ADMIN SOC SECURITY CENTER & AUDIT LOGS (STRICTLY ADMIN ONLY) ---
router.get('/admin/soc/overview', authenticateToken, authorizeRole('admin'), socController.getSocOverview);
router.get('/admin/soc/logs', authenticateToken, authorizeRole('admin'), socController.getSocLogs);
router.get('/admin/soc/export', authenticateToken, authorizeRole('admin'), socController.exportSocLogs);

module.exports = router;
