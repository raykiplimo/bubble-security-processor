# Bubble.io Security Processor

This is the external microservice for the Bubble.io Security Platform. It handles log ingestion, threat detection, and alerting.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configuration**
    Copy `.env` and adjust settings directly if needed (default: Port 3000).

## Running the Service

Start the server:
```bash
npm start
```

The server will listen on `http://localhost:3000`.

## API Endpoints

### `POST /ingest`
Receives security events.
**Headers**:
- `Authorization`: `Bearer super_secret_key_123`
- `Content-Type`: `application/json`

**Body**:
```json
{
  "type": "login_failed",
  "source_app": "my-app",
  "source_ip": "1.2.3.4",
  "user_id": "user_123"
}
```

## Testing & Simulation

You can simulate traffic (including attacks) using the included script:

```bash
node scripts/simulate_traffic.js
```

This will run a scenario with:
1. Normal traffic
2. A Brute Force attack (should trigger High Severity alert)
3. An Unauthorized Admin Action (should trigger Critical alert)
