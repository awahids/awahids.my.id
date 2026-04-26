# n8n Workflow Template (Portfolio AI Relay)

Template ini menerima event dari backend:
- `/api/ai-faq`
- `/api/ai-brief`

File workflow:
- `n8n/workflows/portfolio-ai-events-relay-template.json`

## Alur Workflow
1. `Portfolio Event Webhook`
2. `Normalize Event`: normalisasi payload backend
3. `Filter Authorized`: validasi header token (opsional)
4. Jalur log:
   - `Prepare Log Payload`
   - `Has Log Sink`
   - `Send To Log Sink` (opsional, HTTP ke endpoint log)
5. Jalur error alert:
   - `Filter Failed Events`
   - `Build Alert Message`
   - `Has Telegram Config` -> `Telegram Alert` (opsional)
   - `Has Resend Config` -> `Email Alert (Resend)` (opsional)

## Env Backend (Project Ini)
Set di project backend kamu:

```env
N8N_WEBHOOK_ENABLED=true
N8N_WEBHOOK_URL=https://<your-n8n-host>/webhook/portfolio-ai-events
N8N_WEBHOOK_TIMEOUT_MS=1500
N8N_WEBHOOK_AUTH_HEADER=x-api-key
N8N_WEBHOOK_AUTH_TOKEN=<shared-secret>
```

## Env di n8n
Set environment variables di instance n8n:

```env
# Wajib jika mau verifikasi token dari backend
N8N_WEBHOOK_AUTH_HEADER=x-api-key
N8N_WEBHOOK_AUTH_TOKEN=<shared-secret>

# Opsional: sink logging (contoh endpoint ingestion internal, Apps Script, dsb)
N8N_EVENT_LOG_URL=

# Opsional: Telegram alert
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Opsional: Email alert via Resend
RESEND_API_KEY=
ALERT_EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=you@yourdomain.com
```

## Cara Pakai
1. Import JSON workflow ke n8n.
2. Aktifkan workflow.
3. Set env backend dan n8n sesuai bagian di atas.
4. Trigger dari UI AI Lab (`/ai-lab`) atau panggil endpoint API project.

## Payload Event yang Diterima n8n
Event dari backend berbentuk:

```json
{
  "eventType": "portfolio.faq.success",
  "outcome": "success",
  "occurredAt": "2026-04-26T10:00:00.000Z",
  "source": "awahids-portfolio-api",
  "request": {
    "method": "POST",
    "route": "/api/ai-faq",
    "ip": "x.x.x.x",
    "requestId": "..."
  },
  "payload": {
    "source": "portfolio-ai-faq",
    "submittedAt": "2026-04-26T10:00:00.000Z",
    "languageHint": "id",
    "provider": "sumopod",
    "model": "gpt-4o-mini",
    "latencyMs": 450
  }
}
```

## Test Cepat Manual
Gunakan endpoint webhook n8n langsung:

```bash
curl -X POST "https://<your-n8n-host>/webhook/portfolio-ai-events" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <shared-secret>" \
  -d '{
    "eventType":"portfolio.faq.failed",
    "outcome":"error",
    "occurredAt":"2026-04-26T10:00:00.000Z",
    "source":"awahids-portfolio-api",
    "request":{"route":"/api/ai-faq","method":"POST","ip":"127.0.0.1","requestId":"manual-test"},
    "payload":{"errorCode":"AI_TIMEOUT","errorMessage":"AI provider timeout","latencyMs":1400}
  }'
```

Jika env Telegram/Resend sudah diisi, event `outcome=error` akan mengirim alert otomatis.
