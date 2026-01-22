require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const detection = require('./detection');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.json());

// Middleware: Authentication Check
const authenticate = (req, res, next) => {
    // For MVP/Demo purposes, we allow bypassing if env var is default, 
    // but in prod this would be strict.
    const authHeader = req.headers['authorization'];
    if (process.env.BUBBLE_API_SECRET && process.env.BUBBLE_API_SECRET !== 'changeme') {
        if (!authHeader || authHeader !== `Bearer ${process.env.BUBBLE_API_SECRET}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }
    next();
};

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /alerts - For Bubble Dashboard "Pull"
app.get('/alerts', authenticate, (req, res) => {
    const filters = {
        severity: req.query.severity,
        limit: req.query.limit || 50
    };
    const alerts = detection.getAlerts(filters);
    res.json({ count: alerts.length, alerts });
});

// POST /config - For Bubble Admin "Push" configuration
app.post('/config', authenticate, (req, res) => {
    const config = req.body;
    detection.setConfig(config);
    res.json({ status: 'updated', config });
});

// Ingestion Endpoint
app.post('/ingest', authenticate, async (req, res) => {
    try {
        const event = req.body;

        if (!event.type || !event.source_app) {
            return res.status(400).json({ error: 'Missing type or source_app' });
        }

        console.log(`[INGEST] ${event.type} from ${event.source_ip || 'unknown'}`);

        // Run Detection
        const alerts = detection.processEvent(event);

        if (alerts.length > 0) {
            console.log(`[ALERT] Generated ${alerts.length} alerts for event.`);
            alerts.forEach(a => console.log(`   !!! ${a.severity}: ${a.title}`));
            // TODO: In production, POST these alerts back to Bubble API
        }

        res.status(200).json({
            status: 'processed',
            alerts_generated: alerts.length
        });

    } catch (error) {
        console.error('Ingestion Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Security Processor running on port ${PORT}`);
    });
}
module.exports = app;
