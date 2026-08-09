const { query, queryOne } = require('../config/database');

async function getTemplates(req, res) {
    try {
        const templates = await query('SELECT * FROM email_templates ORDER BY id DESC');
        return res.json({ success: true, templates });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error fetching email templates: ' + err.message });
    }
}

async function getTemplateById(req, res) {
    try {
        const template = await queryOne('SELECT * FROM email_templates WHERE id = ?', [req.params.id]);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }
        return res.json({ success: true, template });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createTemplate(req, res) {
    try {
        const { name, subject, body, template_type } = req.body;

        if (!name || !subject || !body) {
            return res.status(400).json({ success: false, message: 'Name, subject, and body content are required.' });
        }

        const result = await query(
            'INSERT INTO email_templates (name, subject, body, template_type) VALUES (?, ?, ?, ?)',
            [name, subject, body, template_type || 'offer_letter']
        );

        const newTemplate = await queryOne('SELECT * FROM email_templates WHERE id = ?', [result.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Email template created successfully.',
            template: newTemplate
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Template creation failed: ' + err.message });
    }
}

async function updateTemplate(req, res) {
    try {
        const { id } = req.params;
        const { name, subject, body, template_type } = req.body;

        const template = await queryOne('SELECT * FROM email_templates WHERE id = ?', [id]);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        await query(
            'UPDATE email_templates SET name = ?, subject = ?, body = ?, template_type = ? WHERE id = ?',
            [name || template.name, subject || template.subject, body || template.body, template_type || template.template_type, id]
        );

        const updated = await queryOne('SELECT * FROM email_templates WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Template updated successfully.', template: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Template update failed: ' + err.message });
    }
}

async function deleteTemplate(req, res) {
    try {
        const { id } = req.params;
        const template = await queryOne('SELECT * FROM email_templates WHERE id = ?', [id]);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        await query('DELETE FROM email_templates WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Email template deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Delete failed: ' + err.message });
    }
}

module.exports = {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate
};
