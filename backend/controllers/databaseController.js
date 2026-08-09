const { query, queryOne, dbType } = require('../config/database');

/**
 * Get all database tables with row counts and schemas
 * Restricted strictly to Admin users.
 */
async function getTables(req, res) {
    try {
        let tables = [];

        if (dbType === 'mysql') {
            const mysqlTables = await query(`SHOW TABLES`);
            const keyName = Object.keys(mysqlTables[0] || {})[0] || 'Tables_in_recruitment_db';
            
            for (const t of mysqlTables) {
                const tableName = t[keyName];
                const countRes = await query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                const columns = await query(`SHOW COLUMNS FROM \`${tableName}\``);
                tables.push({
                    name: tableName,
                    rowCount: countRes[0]?.count || 0,
                    columns: columns.map(c => ({ name: c.Field, type: c.Type, isPrimary: c.Key === 'PRI' }))
                });
            }
        } else {
            // SQLite Tables
            const sqliteTables = await query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`);
            
            for (const t of sqliteTables) {
                const tableName = t.name;
                const countRes = await query(`SELECT COUNT(*) as count FROM "${tableName}"`);
                const pragmaCols = await query(`PRAGMA table_info("${tableName}")`);
                tables.push({
                    name: tableName,
                    rowCount: countRes[0]?.count || 0,
                    columns: pragmaCols.map(c => ({ name: c.name, type: c.type, isPrimary: c.pk === 1 }))
                });
            }
        }

        return res.json({
            success: true,
            dbType,
            tables
        });
    } catch (err) {
        console.error('[Admin DB Error]', err);
        return res.status(500).json({ success: false, message: 'Failed to inspect database tables: ' + err.message });
    }
}

/**
 * Get paginated rows from a specific database table
 * Restricted strictly to Admin users.
 */
async function getTableData(req, res) {
    try {
        const { tableName } = req.params;
        const limit = parseInt(req.query.limit || '50', 10);
        const offset = parseInt(req.query.offset || '0', 10);

        // Sanitize Table Name
        const allowedTables = ['users', 'candidates', 'email_templates', 'generated_documents', 'email_logs', 'system_settings'];
        if (!allowedTables.includes(tableName)) {
            return res.status(400).json({ success: false, message: 'Invalid or restricted database table name.' });
        }

        const countRes = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const total = countRes[0]?.count || countRes[0]?.['COUNT(*)'] || 0;

        let rows = [];
        if (dbType === 'mysql') {
            rows = await query(`SELECT * FROM \`${tableName}\` LIMIT ? OFFSET ?`, [limit, offset]);
            // Hide hashed passwords in user table
            if (tableName === 'users') {
                rows = rows.map(r => ({ ...r, password: '•••••••• (Hashed Password)' }));
            }
        } else {
            rows = await query(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`, [limit, offset]);
            if (tableName === 'users') {
                rows = rows.map(r => ({ ...r, password: '•••••••• (Hashed Password)' }));
            }
        }

        return res.json({
            success: true,
            tableName,
            total,
            limit,
            offset,
            rows
        });
    } catch (err) {
        console.error('[Admin DB Table Data Error]', err);
        return res.status(500).json({ success: false, message: 'Error loading table data: ' + err.message });
    }
}

module.exports = {
    getTables,
    getTableData
};
