const { query, queryOne } = require('../config/database');

/**
 * Get all users and access requests (Admin Only)
 */
async function getUsers(req, res) {
    try {
        const users = await query('SELECT id, name, email, role, status, avatar, created_at, updated_at FROM users ORDER BY created_at DESC');
        
        const pendingCount = users.filter(u => u.status === 'pending').length;
        const approvedCount = users.filter(u => u.status === 'approved').length;
        const rejectedCount = users.filter(u => u.status === 'rejected').length;

        return res.json({
            success: true,
            stats: {
                total: users.length,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount
            },
            users
        });
    } catch (err) {
        console.error('[User Management Error]', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch user list: ' + err.message });
    }
}

/**
 * Approve User Access Request & Assign Role (Admin Only)
 */
async function approveUser(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const targetRole = role || 'hr_recruiter';
        const allowedRoles = ['admin', 'hr_manager', 'hr_recruiter', 'staff'];
        if (!allowedRoles.includes(targetRole)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await query('UPDATE users SET status = ?, role = ? WHERE id = ?', ['approved', targetRole, id]);
        console.log(`[User Access Approved] User ${user.email} approved with role '${targetRole}' by Admin.`);

        return res.json({
            success: true,
            message: `User '${user.name}' (${user.email}) has been approved with role '${targetRole}'. Access granted!`
        });
    } catch (err) {
        console.error('[Approve User Error]', err);
        return res.status(500).json({ success: false, message: 'Error approving user: ' + err.message });
    }
}

/**
 * Reject User Access Request (Admin Only)
 */
async function rejectUser(req, res) {
    try {
        const { id } = req.params;

        const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.role === 'admin' && user.email === 'admin@hr.com') {
            return res.status(400).json({ success: false, message: 'Cannot reject primary system administrator account.' });
        }

        await query('UPDATE users SET status = ? WHERE id = ?', ['rejected', id]);

        return res.json({
            success: true,
            message: `Access request for '${user.name}' (${user.email}) has been declined.`
        });
    } catch (err) {
        console.error('[Reject User Error]', err);
        return res.status(500).json({ success: false, message: 'Error rejecting user: ' + err.message });
    }
}

/**
 * Delete User (Admin Only)
 */
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.role === 'admin' && user.email === 'admin@hr.com') {
            return res.status(400).json({ success: false, message: 'Cannot delete primary system administrator account.' });
        }

        await query('DELETE FROM users WHERE id = ?', [id]);

        return res.json({
            success: true,
            message: `User account '${user.name}' has been deleted.`
        });
    } catch (err) {
        console.error('[Delete User Error]', err);
        return res.status(500).json({ success: false, message: 'Error deleting user: ' + err.message });
    }
}

module.exports = {
    getUsers,
    approveUser,
    rejectUser,
    deleteUser
};
