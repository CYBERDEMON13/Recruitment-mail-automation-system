/**
 * Custom Security Headers & Rate Limiting Middleware
 */

// Simple in-memory rate-limiter store
const rateLimitStore = new Map();

/**
 * Express middleware to attach hardened HTTP security headers
 */
function applySecurityHeaders(req, res, next) {
    // Prevent MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking / frame embedding
    res.setHeader('X-Frame-Options', 'DENY');

    // Cross-Site Scripting (XSS) Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // HTTP Strict Transport Security (HSTS)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https:;");

    next();
}

/**
 * Rate limiting middleware for sensitive endpoints (Auth / Admin)
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (e.g. 15 * 60 * 1000)
 * @param {number} options.maxRequests - Max allowed requests within window
 */
function createRateLimiter(options = { windowMs: 15 * 60 * 1000, maxRequests: 30 }) {
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
        const now = Date.now();

        if (!rateLimitStore.has(ip)) {
            rateLimitStore.set(ip, { count: 1, resetTime: now + options.windowMs });
            return next();
        }

        const clientData = rateLimitStore.get(ip);

        if (now > clientData.resetTime) {
            clientData.count = 1;
            clientData.resetTime = now + options.windowMs;
            return next();
        }

        clientData.count += 1;

        if (clientData.count > options.maxRequests) {
            const retryAfterSec = Math.ceil((clientData.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            return res.status(429).json({
                success: false,
                message: `Security Rate Limit Exceeded. Too many authentication attempts from your IP. Please try again in ${retryAfterSec} seconds.`
            });
        }

        next();
    };
}

module.exports = {
    applySecurityHeaders,
    createRateLimiter
};
