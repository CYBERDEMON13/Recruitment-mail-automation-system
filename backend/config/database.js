const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let dbPool = null;
let sqliteDb = null;

if (dbType === 'mysql') {
    const mysql = require('mysql2/promise');
    dbPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'recruitment_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('[Database] Configured Remote MySQL connection pool.');
} else {
    // SQLite with Multi-Cloud Persistent Volume Auto-Detection
    const sqlite3 = require('sqlite3').verbose();
    
    // Priority persistent directory resolution
    let dataDir = path.join(__dirname, '../data');

    if (process.env.DB_PATH) {
        dataDir = path.dirname(process.env.DB_PATH);
    } else if (process.env.SQLITE_DB_PATH) {
        dataDir = path.dirname(process.env.SQLITE_DB_PATH);
    } else if (process.env.PERSISTENT_DIR && fs.existsSync(process.env.PERSISTENT_DIR)) {
        dataDir = process.env.PERSISTENT_DIR;
    } else if (fs.existsSync('/var/data')) {
        // Render Persistent Disk
        dataDir = '/var/data';
    } else if (fs.existsSync('/data')) {
        // Railway / Docker Persistent Volume
        dataDir = '/data';
    } else if (fs.existsSync('/mnt/data')) {
        // Fly.io / K8s Volume
        dataDir = '/mnt/data';
    }

    if (!fs.existsSync(dataDir)) {
        try {
            fs.mkdirSync(dataDir, { recursive: true });
        } catch (e) {
            dataDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
        }
    }

    const dbPath = process.env.DB_PATH || process.env.SQLITE_DB_PATH || path.join(dataDir, 'recruitment.db');
    
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('[SQLite Connection Error]', err);
        } else {
            console.log(`[Database] Persistent SQLite active at: ${dbPath}`);
            // Enable WAL mode & foreign keys for high performance & instant disk persistence
            sqliteDb.run('PRAGMA journal_mode = WAL;');
            sqliteDb.run('PRAGMA synchronous = NORMAL;');
            sqliteDb.run('PRAGMA foreign_keys = ON;');
        }
    });
}

/**
 * Universal async query function for SQLite & MySQL
 */
async function query(sql, params = []) {
    if (dbType === 'mysql') {
        const [rows] = await dbPool.execute(sql, params);
        return rows;
    } else {
        return new Promise((resolve, reject) => {
            const trimmedSql = sql.trim().toLowerCase();
            if (trimmedSql.startsWith('select') || trimmedSql.startsWith('pragma') || trimmedSql.startsWith('with') || trimmedSql.startsWith('show')) {
                sqliteDb.all(sql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                });
            } else {
                sqliteDb.run(sql, params, function (err) {
                    if (err) return reject(err);
                    resolve({
                        insertId: this.lastID,
                        affectedRows: this.changes
                    });
                });
            }
        });
    }
}

/**
 * Helper to get a single row
 */
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows && rows.length > 0 ? rows[0] : null;
}

module.exports = {
    query,
    queryOne,
    dbType
};
