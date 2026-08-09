const jwt = require('jsonwebtoken');

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
            return res.status(403).json({ success: false, message: 'Unauthorized. Higher privilege required.' });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRole,
    JWT_SECRET
};
