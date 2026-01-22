const memoryStore = {
    ip_counts: {}, // key: IP, val: { count, timestamp }
    failed_logins: {} // key: IP, val: count
};

const alertStore = []; // Array of { id, timestamp, ...alert }
let config = {
    webhook_url: null
};

// Clean up old counters every minute
setInterval(() => {
    const now = Date.now();
    for (const ip in memoryStore.ip_counts) {
        if (now - memoryStore.ip_counts[ip].timestamp > 60000) {
            delete memoryStore.ip_counts[ip];
        }
    }
    for (const ip in memoryStore.failed_logins) {
        delete memoryStore.failed_logins[ip];
    }
}, 60000);

/**
 * Update global configuration
 */
function setConfig(newConfig) {
    config = { ...config, ...newConfig };
    console.log('[CONFIG] Updated:', config);
}

/**
 * Retrieve alerts with optional filtering
 */
function getAlerts(filters = {}) {
    let results = alertStore;

    if (filters.severity) {
        results = results.filter(a => a.severity === filters.severity);
    }
    // Simple pagination / limit
    if (filters.limit) {
        results = results.slice(0, parseInt(filters.limit));
    }

    return results;
}

/**
 * Process an event and return any generated alerts
 * @param {Object} event 
 * @returns {Array} alerts
 */
function processEvent(event) {
    const alerts = [];
    const ip = event.source_ip || 'unknown';
    const now = Date.now();

    // 1. Velocity Check (Global Rate Limit)
    // ------------------------------------------------
    if (!memoryStore.ip_counts[ip]) {
        memoryStore.ip_counts[ip] = { count: 0, timestamp: now };
    }
    memoryStore.ip_counts[ip].count++;

    if (memoryStore.ip_counts[ip].count > 20) { // Threshold: 20 per minute
        alerts.push({
            title: "High Velocity Detected",
            severity: "Medium",
            description: `IP ${ip} sent >20 requests in 1 minute.`,
            source_ip: ip
        });
    }

    // 2. Brute Force Login Detection
    // ------------------------------------------------
    if (event.type === 'login_failed') {
        if (!memoryStore.failed_logins[ip]) memoryStore.failed_logins[ip] = 0;
        memoryStore.failed_logins[ip]++;

        if (memoryStore.failed_logins[ip] > 3) {
            alerts.push({
                title: "Potential Brute Force",
                severity: "High",
                description: `IP ${ip} failed login 3+ times.`,
                source_ip: ip
            });
        }
    }

    // 3. Admin Abuse / Sensitive Action
    // ------------------------------------------------
    if (event.type === 'admin_action' && event.is_admin_context === false) {
        alerts.push({
            title: "Unauthorized Admin Action",
            severity: "Critical",
            description: `User ${event.user_id || 'unknown'} attempted admin action without context.`,
            source_ip: ip
        });
    }

    // Capture and Store Alerts
    alerts.forEach(alert => {
        const fullAlert = {
            id: `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            ...alert
        };
        alertStore.unshift(fullAlert); // Add to beginning (newest first)

        // Mock Trigger Webhook if configured (Pseudo-code for now)
        if (config.webhook_url && (alert.severity === 'High' || alert.severity === 'Critical')) {
            console.log(`[WEBHOOK] Sending ${alert.title} to ${config.webhook_url}`);
            // In real app: fetch(config.webhook_url, { method: 'POST', body: JSON.stringify(fullAlert) ... })
        }
    });

    return alerts;
}

module.exports = { processEvent, getAlerts, setConfig };
