const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { sendAdminAccessNotification } = require('../services/emailService');
const { logActivity } = require('../services/auditLogger');

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email address and password.' });
        }

        const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            logActivity(req, {
                action: 'LOGIN_FAILED',
                severity: 'danger',
                user_email: email,
                details: 'Authentication failed: User account does not exist'
            });
            return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logActivity(req, {
                action: 'LOGIN_FAILED',
                severity: 'danger',
                user_email: email,
                user_id: user.id,
                details: 'Authentication failed: Incorrect password'
            });
            return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
        }

        // Check user approval status
        if (user.status === 'pending') {
            logActivity(req, {
                action: 'LOGIN_BLOCKED_PENDING',
                severity: 'warning',
                user_email: email,
                user_id: user.id,
                details: 'Login blocked: Account pending Admin approval'
            });
            return res.status(403).json({
                success: false,
                pending: true,
                message: 'Your account access request is pending approval by the HR Administrator. An email notification has been sent to the admin.'
            });
        }

        if (user.status === 'rejected') {
            logActivity(req, {
                action: 'LOGIN_BLOCKED_REJECTED',
                severity: 'danger',
                user_email: email,
                user_id: user.id,
                details: 'Login blocked: Access request was rejected by Administrator'
            });
            return res.status(403).json({
                success: false,
                message: 'Your access request was declined by the HR Administrator.'
            });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        logActivity(req, {
            action: 'LOGIN_SUCCESS',
            severity: 'info',
            user_email: user.email,
            user_id: user.id,
            details: `User logged in successfully with role '${user.role}'`
        });

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('[Auth Error]', err);
        return res.status(500).json({ success: false, message: 'Server error during login: ' + err.message });
    }
}

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const existingUser = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, 'staff', 'pending']
        );

        logActivity(req, {
            action: 'ACCESS_REQUESTED',
            severity: 'warning',
            user_email: email,
            user_id: result.insertId,
            details: `New access request registered by ${name}`
        });

        // Send Email Notification to Admin
        sendAdminAccessNotification({ userName: name, userEmail: email, userRole: 'staff' });

        return res.json({
            success: true,
            pending: true,
            message: 'Access Request Submitted! An email notification has been sent to the HR Administrator. You will receive access once approved.'
        });
    } catch (err) {
        console.error('[Register Error]', err);
        return res.status(500).json({ success: false, message: 'Error submitting access request: ' + err.message });
    }
}

async function googleLogin(req, res) {
    try {
        const { email, name, avatar, clerkUserId } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Google account email is required.' });
        }

        const authProviderNote = clerkUserId ? ` (Clerk Auth User ID: ${clerkUserId})` : '';

        // Check if user already exists by email
        let user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            // Auto-create User account with PENDING approval for Google Sign-In
            const dummyPassword = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);
            const insertRes = await query(
                'INSERT INTO users (name, email, password, role, status, avatar) VALUES (?, ?, ?, ?, ?, ?)',
                [name || email.split('@')[0], email, dummyPassword, 'staff', 'pending', avatar || null]
            );
            user = await queryOne('SELECT * FROM users WHERE id = ?', [insertRes.insertId]);
            console.log(`[Google Auth] Created new user access request for Google account: ${email}${authProviderNote}`);

            logActivity(req, {
                action: 'GOOGLE_ACCESS_REQUESTED',
                severity: 'warning',
                user_email: email,
                user_id: user.id,
                details: `New Google access request submitted by ${name || email}${authProviderNote}`
            });

            // Dispatch notification email to Administrator
            sendAdminAccessNotification({ userName: name || email.split('@')[0], userEmail: email, userRole: 'staff' });

            return res.json({
                success: true,
                pending: true,
                message: `Access Request Submitted for ${email}! An email notification has been dispatched to the HR Administrator. You will be granted access once the admin approves your account.`
            });
        }

        // Check existing user status
        if (user.status === 'pending') {
            logActivity(req, {
                action: 'GOOGLE_LOGIN_BLOCKED_PENDING',
                severity: 'warning',
                user_email: email,
                user_id: user.id,
                details: 'Google login blocked: Pending admin approval'
            });
            return res.status(403).json({
                success: false,
                pending: true,
                message: 'Your account access request is pending approval by the HR Administrator.'
            });
        }

        if (user.status === 'rejected') {
            logActivity(req, {
                action: 'GOOGLE_LOGIN_BLOCKED_REJECTED',
                severity: 'danger',
                user_email: email,
                user_id: user.id,
                details: 'Google login blocked: Access request rejected'
            });
            return res.status(403).json({
                success: false,
                message: 'Your access request was declined by the HR Administrator.'
            });
        }

        if (avatar && !user.avatar) {
            await query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, user.id]);
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        logActivity(req, {
            action: 'GOOGLE_LOGIN_SUCCESS',
            severity: 'info',
            user_email: user.email,
            user_id: user.id,
            details: `Google login successful for ${user.email} (${user.role})`
        });

        return res.json({
            success: true,
            message: 'Google Sign-In successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: user.avatar || avatar
            }
        });
    } catch (err) {
        console.error('[Google Auth Error]', err);
        return res.status(500).json({ success: false, message: 'Server error during Google login: ' + err.message });
    }
}

async function getProfile(req, res) {
    try {
        const user = await queryOne('SELECT id, name, email, role, status, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User profile not found.' });
        }

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
    }
}

async function updateProfile(req, res) {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let updatedPassword = user.password;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password does not match.' });
            }
            updatedPassword = await bcrypt.hash(newPassword, 10);
        }

        await query(
            'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
            [name || user.name, email || user.email, updatedPassword, userId]
        );

        logActivity(req, {
            action: 'PROFILE_UPDATED',
            severity: 'info',
            user_email: email || user.email,
            user_id: userId,
            details: 'User updated profile credentials'
        });

        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                id: userId,
                name: name || user.name,
                email: email || user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error updating profile: ' + err.message });
    }
}

module.exports = {
    login,
    register,
    googleLogin,
    getProfile,
    updateProfile
};
