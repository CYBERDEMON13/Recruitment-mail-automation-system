const { query, queryOne } = require('../config/database');

async function getDashboardStats(req, res) {
    try {
        const totalCandidatesRes = await queryOne('SELECT COUNT(*) as count FROM candidates');
        const totalCandidates = totalCandidatesRes ? (totalCandidatesRes.count || totalCandidatesRes['COUNT(*)']) : 0;

        const selectedRes = await queryOne("SELECT COUNT(*) as count FROM candidates WHERE application_status = 'Selected'");
        const selectedCandidates = selectedRes ? (selectedRes.count || selectedRes['COUNT(*)']) : 0;

        const rejectedRes = await queryOne("SELECT COUNT(*) as count FROM candidates WHERE application_status = 'Rejected'");
        const rejectedCandidates = rejectedRes ? (rejectedRes.count || rejectedRes['COUNT(*)']) : 0;

        const pendingRes = await queryOne("SELECT COUNT(*) as count FROM candidates WHERE application_status = 'Pending'");
        const pendingCandidates = pendingRes ? (pendingRes.count || pendingRes['COUNT(*)']) : 0;

        const onHoldRes = await queryOne("SELECT COUNT(*) as count FROM candidates WHERE application_status = 'On Hold'");
        const onHoldCandidates = onHoldRes ? (onHoldRes.count || onHoldRes['COUNT(*)']) : 0;

        // Email Stats
        const emailsSentRes = await queryOne("SELECT COUNT(*) as count FROM email_logs WHERE status = 'Sent'");
        const emailsSent = emailsSentRes ? (emailsSentRes.count || emailsSentRes['COUNT(*)']) : 0;

        const emailsPendingRes = await queryOne("SELECT COUNT(*) as count FROM email_logs WHERE status = 'Pending'");
        const emailsPending = emailsPendingRes ? (emailsPendingRes.count || emailsPendingRes['COUNT(*)']) : 0;

        const emailsFailedRes = await queryOne("SELECT COUNT(*) as count FROM email_logs WHERE status = 'Failed'");
        const emailsFailed = emailsFailedRes ? (emailsFailedRes.count || emailsFailedRes['COUNT(*)']) : 0;

        // Recent Candidates
        const recentCandidates = await query('SELECT * FROM candidates ORDER BY id DESC LIMIT 5');

        // Recent Email Logs
        const recentLogs = await query(`
            SELECT el.*, c.full_name as candidate_name 
            FROM email_logs el 
            LEFT JOIN candidates c ON el.candidate_id = c.id 
            ORDER BY el.id DESC LIMIT 5
        `);

        // Department Breakdown
        const deptBreakdown = await query(`
            SELECT department, COUNT(*) as count 
            FROM candidates 
            WHERE department IS NOT NULL AND department != '' 
            GROUP BY department
        `);

        return res.json({
            success: true,
            stats: {
                totalCandidates,
                selectedCandidates,
                rejectedCandidates,
                pendingCandidates,
                onHoldCandidates,
                emailsSent,
                emailsPending,
                emailsFailed
            },
            departmentBreakdown: deptBreakdown,
            recentCandidates,
            recentLogs
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Dashboard stats error: ' + err.message });
    }
}

module.exports = {
    getDashboardStats
};
