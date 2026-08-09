const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email address and password.' });
        }

        const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('[Auth Error]', err);
        return res.status(500).json({ success: false, message: 'Server error during login: ' + err.message });
    }
}

async function googleLogin(req, res) {
    try {
        const { email, name, avatar, googleId } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Google account email is required.' });
        }

        // Check if user already exists by email
        let user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            // Auto-create HR user account for Google Sign-In
            const dummyPassword = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);
            const insertRes = await query(
                'INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)',
                [name || email.split('@')[0], email, dummyPassword, 'admin', avatar || null]
            );
            user = await queryOne('SELECT * FROM users WHERE id = ?', [insertRes.insertId]);
            console.log(`[Google Auth] Created new user account via Google Sign-In: ${email}`);
        } else if (avatar && !user.avatar) {
            // Update avatar if missing
            await query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, user.id]);
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            message: 'Google Sign-In successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
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
        const user = await queryOne('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
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

        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                id: userId,
                name: name || user.name,
                email: email || user.email,
                role: user.role
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error updating profile: ' + err.message });
    }
}

module.exports = {
    login,
    googleLogin,
    getProfile,
    updateProfile
};
