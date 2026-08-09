const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const initDb = require('./config/initDb');
const apiRoutes = require('./routes/api');
const { applySecurityHeaders } = require('./middleware/securityMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Global Security Headers Middleware
app.use(applySecurityHeaders);

// Enable CORS & Body Parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static document files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Recruitment Email Automation Backend', timestamp: new Date() });
});

// Serve Frontend Static Build in Production / Render
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            res.sendFile(path.join(frontendDistPath, 'index.html'));
        }
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Unhandled Server Error]', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error: ' + (err.message || 'Unknown error occurred.')
    });
});

// Start Server after Database Initialization
async function startServer() {
    await initDb();
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` recruitment Email Automation API Server Running`);
        console.log(` URL: http://localhost:${PORT}`);
        console.log(` Health Check: http://localhost:${PORT}/health`);
        console.log(`====================================================`);
    });
}

startServer();
