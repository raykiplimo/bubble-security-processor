const fetch = require('node-fetch'); // NOTE: Assuming node-fetch is available or using built-in fetch in newer Node
// In Node 18+ global 'fetch' is available. If using older node, this might fail without install.
// We'll assume Node 18+ for this environment.

const API_URL = 'http://localhost:3000/ingest';
const API_SECRET = 'super_secret_key_123';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function sendEvent(event) {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_SECRET}`
            },
            body: JSON.stringify(event)
        });
        const data = await res.json();
        console.log(`Sent ${event.type}:`, data);
    } catch (e) {
        console.error('Error sending event:', e.message);
    }
}

async function simulate() {
    console.log("Starting Traffic Simulation...");

    // 1. Normal Traffic
    await sendEvent({
        type: 'page_view',
        source_app: 'my-bubble-app',
        source_ip: '192.168.1.1',
        user_id: 'user_1'
    });

    // 2. Brute Force Attack
    console.log("\nSimulating Brute Force...");
    for (let i = 0; i < 5; i++) {
        await sendEvent({
            type: 'login_failed',
            source_app: 'my-bubble-app',
            source_ip: '10.0.0.66', // Attacker IP
            user_id: `unknown_user_${i}`
        });
        await sleep(100);
    }

    // 3. Admin Abuse
    console.log("\nSimulating Admin Abuse...");
    await sendEvent({
        type: 'admin_action',
        source_app: 'my-bubble-app',
        source_ip: '192.168.1.50',
        user_id: 'rogue_intern',
        is_admin_context: false, // malicious!
        action: 'delete_database'
    });

    console.log("\n[VERIFICATION] Fetching Alerts from API...");
    try {
        const res = await fetch('http://localhost:3000/alerts', {
            headers: { 'Authorization': `Bearer ${API_SECRET}` }
        });
        const data = await res.json();
        console.log(`Retrieved ${data.count} alerts.`);
        if (data.count > 0) {
            console.log("Latest Alert:", data.alerts[0].title);
        } else {
            console.error("TEST FAILED: No alerts found!");
        }
    } catch (e) {
        console.error("Error fetching alerts:", e.message);
    }

    console.log("\nSimulation Complete.");
}

simulate();
