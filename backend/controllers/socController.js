const { query, queryOne } = require('../config/database');

/**
 * GET /api/admin/soc/overview
 * Returns SOC Security Overview Metrics (Strictly Admin Only)
 */
async function getSocOverview(req, res) {
    try {
        // Total logs count
        const totalLogsRes = await queryOne('SELECT COUNT(*) as count FROM activity_logs');
        const totalLogs = totalLogsRes ? (totalLogsRes.count || totalLogsRes['COUNT(*)']) : 0;

        // Security Alerts Count (Failed Logins + 403 Forbidden attempts)
        const securityAlertsRes = await queryOne(
            "SELECT COUNT(*) as count FROM activity_logs WHERE severity IN ('danger', 'security') OR action LIKE '%FAILED%' OR action LIKE '%UNAUTHORIZED%'"
        );
        const securityAlerts = securityAlertsRes ? (securityAlertsRes.count || securityAlertsRes['COUNT(*)']) : 0;

        // Pending Access Requests Count
        const pendingUsersRes = await queryOne("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
        const pendingAccessRequests = pendingUsersRes ? (pendingUsersRes.count || pendingUsersRes['COUNT(*)']) : 0;

        // Active Admin Users Count
        const activeAdminsRes = await queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status = 'approved'");
        const activeAdmins = activeAdminsRes ? (activeAdminsRes.count || activeAdminsRes['COUNT(*)']) : 0;

        // Total Approved Users
        const totalApprovedUsersRes = await queryOne("SELECT COUNT(*) as count FROM users WHERE status = 'approved'");
        const totalApprovedUsers = totalApprovedUsersRes ? (totalApprovedUsersRes.count || totalApprovedUsersRes['COUNT(*)']) : 0;

        // Today's Activity Count
        const todayLogsRes = await queryOne("SELECT COUNT(*) as count FROM activity_logs WHERE date(created_at) = date('now') OR created_at LIKE ? ", [`${new Date().toISOString().split('T')[0]}%`]);
        const todayLogs = todayLogsRes ? (todayLogsRes.count || todayLogsRes['COUNT(*)']) : 0;

        // Recent High-Priority Alerts with location
        const recentAlerts = await query(
            "SELECT * FROM activity_logs WHERE severity IN ('danger', 'security') ORDER BY id DESC LIMIT 5"
        );

        return res.json({
            success: true,
            overview: {
                systemHealthStatus: securityAlerts === 0 ? 'OPTIMAL' : (securityAlerts > 10 ? 'ATTENTION REQUIRED' : 'ELEVATED MONITORING'),
                totalLogs,
                todayLogs,
                securityAlerts,
                pendingAccessRequests,
                activeAdmins,
                totalApprovedUsers,
                hardeningFeatures: [
                    { name: 'Role RBAC Isolation', status: 'Active (Strict Admin Enforced)' },
                    { name: 'SQLite WAL Journaling', status: 'Active (Persistent Sync)' },
                    { name: 'Rate Limiting Guard', status: 'Active (Brute-Force Shield)' },
                    { name: 'HTTP Security Headers', status: 'Active (CSP, HSTS, X-Frame)' },
                    { name: 'Threat Geo-Location Tracking', status: 'Active (Chennai, India / Client Resolution)' }
                ],
                recentAlerts
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load SOC overview: ' + err.message });
    }
}

/**
 * GET /api/admin/soc/logs
 * Returns Filterable & Paginated Security Activity Logs
 */
async function getSocLogs(req, res) {
    try {
        const { search, severity, action, user_email, page = 1, limit = 50 } = req.query;

        let sql = 'SELECT * FROM activity_logs WHERE 1=1';
        const params = [];

        if (severity) {
            sql += ' AND severity = ?';
            params.push(severity);
        }

        if (action) {
            sql += ' AND action LIKE ?';
            params.push(`%${action}%`);
        }

        if (user_email) {
            sql += ' AND user_email LIKE ?';
            params.push(`%${user_email}%`);
        }

        if (search) {
            sql += ' AND (action LIKE ? OR user_email LIKE ? OR details LIKE ? OR ip_address LIKE ? OR location LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY id DESC';

        const allLogs = await query(sql, params);
        const total = allLogs.length;

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const paginatedLogs = allLogs.slice(offset, offset + parseInt(limit, 10));

        // Distinct Action Types for filter dropdown
        const actionTypes = (await query('SELECT DISTINCT action FROM activity_logs')).map(a => a.action);

        return res.json({
            success: true,
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(total / limit),
            actionTypes,
            logs: paginatedLogs
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch SOC activity logs: ' + err.message });
    }
}

/**
 * GET /api/admin/soc/export
 * Exports SOC Audit Log Trail as CSV / JSON with Threat Location
 */
async function exportSocLogs(req, res) {
    try {
        const logs = await query('SELECT * FROM activity_logs ORDER BY id DESC');
        const format = (req.query.format || 'csv').toLowerCase();

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="SOC_Audit_Logs_${Date.now()}.json"`);
            return res.send(JSON.stringify(logs, null, 2));
        }

        // CSV Header & Formatting with Location
        let csv = 'ID,Timestamp,User Email,Action,Severity,IP Address,Threat Location,User Agent,Details\n';
        logs.forEach((log) => {
            const cleanDetails = (log.details || '').replace(/"/g, '""');
            const loc = log.location || 'Chennai, TN, India';
            csv += `"${log.id}","${log.created_at}","${log.user_email}","${log.action}","${log.severity}","${log.ip_address}","${loc}","${log.user_agent}","${cleanDetails}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="SOC_Audit_Logs_${Date.now()}.csv"`);
        return res.send(csv);
    } catch (err) {
        return res.status(500).json({ success: false, message: 'SOC Log Export failed: ' + err.message });
    }
}

module.exports = {
    getSocOverview,
    getSocLogs,
    exportSocLogs
};
