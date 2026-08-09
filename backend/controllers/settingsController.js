const { query, queryOne } = require('../config/database');
const { testSMTPConfig } = require('../services/emailService');

async function getSettings(req, res) {
    try {
        const rows = await query('SELECT * FROM system_settings');
        const settings = {};
        rows.forEach(r => {
            if (r.setting_key === 'smtp_pass' && r.setting_value) {
                settings[r.setting_key] = '********'; // Mask sensitive password
            } else {
                settings[r.setting_key] = r.setting_value;
            }
        });

        return res.json({ success: true, settings });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch settings: ' + err.message });
    }
}

async function updateSettings(req, res) {
    try {
        const settingsMap = req.body;

        for (const [key, value] of Object.entries(settingsMap)) {
            if (key === 'smtp_pass' && value === '********') {
                continue; // Do not overwrite with masked asterisks
            }

            const existing = await queryOne('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
            if (existing) {
                await query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
            } else {
                await query('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
            }
        }

        return res.json({ success: true, message: 'System settings saved successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update settings: ' + err.message });
    }
}

async function testSMTP(req, res) {
    try {
        const config = req.body;
        
        // If password is masked, load real stored password
        if (config.smtp_pass === '********') {
            const passSetting = await queryOne("SELECT setting_value FROM system_settings WHERE setting_key = 'smtp_pass'");
            config.smtp_pass = passSetting ? passSetting.setting_value : '';
        }

        const testRes = await testSMTPConfig(config);
        return res.json(testRes);
    } catch (err) {
        return res.status(400).json({ success: false, message: 'SMTP Test Failed: ' + err.message });
    }
}

module.exports = {
    getSettings,
    updateSettings,
    testSMTP
};
