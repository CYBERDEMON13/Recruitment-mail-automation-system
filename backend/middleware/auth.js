const jwt = require('jsonwebtoken');
const { logActivity } = require('../services/auditLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'recruitment_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired session token. Please log in again.' });
    }
}

function authorizeRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            // Log security violation attempt to SOC activity log
            logActivity(req, {
                action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                severity: 'security',
                user_email: req.user ? req.user.email : 'unauthenticated',
                user_id: req.user ? req.user.id : null,
                details: `Unauthorized write/access attempt (${req.user?.role || 'guest'}) on restricted route: ${req.originalUrl}`
            });

            const message = req.user?.role === 'staff'
                ? 'Forbidden: Staff accounts have Read-Only access. Higher privilege (HR Recruiter, HR Manager, or Admin) is required to perform edit/write operations.'
                : 'Forbidden: Higher privilege required for this action.';

            return res.status(403).json({ success: false, message });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRole,
    JWT_SECRET
};
