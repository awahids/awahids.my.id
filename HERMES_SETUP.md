# Hermes AI Assistant Integration Setup

Integrasi Hermes AI Assistant ke dalam portfolio website awahids.my.id untuk menyediakan chat AI yang lebih powerful dengan kemampuan tool use dan konteks yang lebih baik.

## Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Browser                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           FloatingFAQ Component                         │   │
│  │         (React + Framer Motion)                         │   │
│  └──────────────────┬──────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      │ POST /api/ai-assistant (atau /api/ai-faq)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Vercel Serverless Functions                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/ai-assistant.js  →  Hermes Integration           │   │
│  │  /api/ai-faq.js        →  SumoPod (existing)            │   │
│  └──────────────────┬──────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────┘
                      │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│   Hermes via     │  │   SumoPod        │
│   n8n Webhook    │  │   (Fallback)     │
└────────┬─────────┘  └──────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  n8n Workflow (di VPS 43.x.x.x)  │
│  - Terima request dari Vercel   │
│  - Forward ke Hermes Gateway    │
│  - Atau langsung ke Telegram    │
└─────────────────────────────────┘
```

## File yang Dibuat/Modifikasi

### Backend (Vercel Functions)
1. **`/api/ai-assistant.js`** - Endpoint baru untuk Hermes
2. **`/api/ai-faq.js`** - Existing (SumoPod) - tidak diubah
3. **`/api/_lib/n8n.js`** - Existing - tidak diubah

### Frontend
4. **`/src/components/FloatingFAQ.jsx.patch`** - Patch untuk support Hermes toggle

### n8n Workflows
5. **`/n8n/workflows/hermes-assistant-template.json`** - Template workflow n8n

### Dokumentasi
6. **`HERMES_SETUP.md`** - File ini

## Setup Instructions

### Step 1: Environment Variables

Tambahkan ke `.env.local` (untuk local dev) dan Vercel Environment Variables:

```bash
# Existing SumoPod config (keep as is)
SUMOPOD_API_KEY=your_sumopod_key
SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
SUMOPOD_MODEL=["gpt-4o-mini","gpt-4.1-mini"]

# Hermes Integration (NEW)
HERMES_WEBHOOK_ENABLED=true
HERMES_WEBHOOK_URL=https://your-n8n-instance.com/webhook/hermes-assistant
HERMES_TIMEOUT_MS=30000

# Rate limiting
AI_ASSISTANT_RATE_WINDOW_MS=60000
AI_ASSISTANT_RATE_MAX=10

# Frontend endpoints
VITE_AI_ASSISTANT_ENDPOINT=/api/ai-assistant
VITE_AI_FAQ_ENDPOINT=/api/ai-faq
```

### Step 2: Deploy Backend API

```bash
# Deploy ke Vercel
vercel --prod
```

### Step 3: Setup n8n Workflow

1. **Import workflow** ke n8n instance Anda:
   - Buka n8n
   - Workflow → Import from File
   - Pilih `n8n/workflows/hermes-assistant-template.json`

2. **Configure credentials**:
   - Setup environment variables di n8n:
     ```
     HERMES_GATEWAY_URL=http://43.157.213.220:8765/chat
     ```

3. **Activate workflow**:
   - Klik "Active" toggle
   - Webhook URL akan tersedia di: `https://your-n8n.com/webhook/hermes-assistant`

### Step 4: Setup Hermes Gateway di VPS (Opsional)

Jika Anda ingin Hermes Gateway langsung di VPS (bukan via Telegram):

```bash
# SSH ke VPS
ssh awahids@43.157.213.220

# Install dependencies
cd ~/hermes-portfolio
pip3 install fastapi uvicorn httpx pydantic

# Create systemd service
sudo tee /etc/systemd/system/hermes-portfolio.service << EOF
[Unit]
Description=Hermes Portfolio Gateway
After=network.target

[Service]
Type=simple
User=awahids
WorkingDirectory=/home/awahids/hermes-portfolio
Environment="TELEGRAM_BOT_TOKEN=your_bot_token"
Environment="TELEGRAM_CHAT_ID=your_chat_id"
ExecStart=/usr/bin/python3 hermes_gateway.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable hermes-portfolio
sudo systemctl start hermes-portfolio

# Check status
sudo systemctl status hermes-portfolio
```

### Step 5: Update Frontend (FloatingFAQ)

Apply patch ke `FloatingFAQ.jsx`:

```bash
cd /path/to/awahids.my.id

# Backup original
cp src/components/FloatingFAQ.jsx src/components/FloatingFAQ.jsx.backup

# Apply modifications (manual merge based on patch file)
# Lihat FloatingFAQ.jsx.patch untuk detail perubahan
```

### Step 6: Test Integration

1. **Test API directly**:
   ```bash
   curl -X POST https://awahids.my.id/api/ai-assistant \
     -H "Content-Type: application/json" \
     -d '{
       "question": "What is Wahid experience?",
       "source": "test"
     }'
   ```

2. **Test via n8n webhook**:
   ```bash
   curl -X POST https://your-n8n.com/webhook/hermes-assistant \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Hello Hermes",
       "context": {"source": "test"}
     }'
   ```

3. **Test UI**:
   - Buka https://awahids.my.id
   - Klik chat icon
   - Toggle "Hermes Mode" (jika ada)
   - Kirim pesan test

## Troubleshooting

### Issue: API returns 500

**Check:**
```bash
# Check Vercel logs
vercel logs --all

# Check environment variables
vercel env ls
```

### Issue: n8n webhook not responding

**Check:**
```bash
# Test webhook directly
curl -X POST https://your-n8n.com/webhook/hermes-assistant \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check n8n execution logs
# Buka n8n UI → Executions
```

### Issue: Hermes Gateway timeout

**Check:**
```bash
# Check if service running
sudo systemctl status hermes-portfolio

# Check logs
sudo journalctl -u hermes-portfolio -f

# Restart if needed
sudo systemctl restart hermes-portfolio
```

## Security Considerations

1. **API Keys**: Jangan hardcode API keys di kode. Selalu gunakan environment variables.

2. **Rate Limiting**: Semua endpoint sudah memiliki rate limiting default (10 req/minute per IP).

3. **CORS**: API hanya menerima request dari domain yang sama (Vercel domain).

4. **Input Validation**: Semua input divalidasi sebelum diproses.

5. **n8n Webhook**: Gunakan API key atau auth token untuk webhook n8n.

## Monitoring & Logging

### Vercel Logs
```bash
vercel logs --all --since=1h
```

### n8n Execution Logs
- Buka n8n UI
- Menu "Executions"
- Lihat status dan detail setiap execution

### VPS Logs (Hermes Gateway)
```bash
sudo journalctl -u hermes-portfolio -f
```

## Summary

Integrasi Hermes AI Assistant ke portfolio website telah selesai dibuat dengan fitur:

✅ **Backend API**: `/api/ai-assistant` endpoint  
✅ **n8n Workflow**: Template untuk routing ke Hermes  
✅ **Fallback**: SumoPod sebagai backup  
✅ **Frontend Patch**: Support Hermes toggle di UI  
✅ **Rate Limiting**: Protection dari abuse  
✅ **Monitoring**: Event logging ke n8n  

Langkah selanjutnya: Deploy dan test! 🚀
