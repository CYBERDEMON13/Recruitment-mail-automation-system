const { query } = require('../config/database');

/**
 * Log structured security activity into the activity_logs table with IST Kolkata Time
 * @param {Object} req - Express Request object (optional)
 * @param {Object} options
 * @param {string} options.action - Short descriptor (e.g. 'LOGIN_SUCCESS', 'LOGIN_FAILED')
 * @param {string} [options.severity='info'] - 'info' | 'warning' | 'danger' | 'security'
 * @param {string} [options.user_email='system'] - Email of user performing action
 * @param {number} [options.user_id=null] - User ID if available
 * @param {string|Object} [options.details=''] - Additional contextual metadata
 */
async function logActivity(req, options = {}) {
    try {
        const {
            action,
            severity = 'info',
            user_email,
            user_id,
            details
        } = options;

        let ipAddress = '127.0.0.1';
        let userAgent = 'System Process';
        let effectiveEmail = user_email || 'anonymous';
        let effectiveUserId = user_id || null;

        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
            userAgent = req.headers['user-agent'] || 'Unknown Agent';

            if (req.user) {
                effectiveEmail = req.user.email || effectiveEmail;
                effectiveUserId = req.user.id || effectiveUserId;
            }
        }

        const detailsString = typeof details === 'object' ? JSON.stringify(details) : (details || '');

        // Formatted timestamp explicitly in IST (Asia/Kolkata)
        const istTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '');

        await query(
            `INSERT INTO activity_logs (user_id, user_email, action, severity, ip_address, user_agent, details, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [effectiveUserId, effectiveEmail, action, severity, ipAddress, userAgent, detailsString, istTimestamp]
        );
    } catch (err) {
        console.error('[Audit Logger Error]', err.message);
    }
}

module.exports = {
    logActivity
};
