# Quick Reference Card

## Deployment URLs
- **Frontend**: https://ai-mai-bqyd.onrender.com/
- **Backend**: https://ai-mai-backend.onrender.com/
- **Telegram Bot**: @handmadedescriptionbot

## Environment Variables

### Backend (Required)
```bash
API_KEY=your_google_genai_api_key
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=your_random_secret  # Recommended
PORT=3001  # Auto-set by Render
```

### Frontend (Required)
```bash
VITE_BACKEND_URL=https://ai-mai-backend.onrender.com
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/create-invoice` | POST | Create Telegram Stars invoice |
| `/verify-payment` | POST | Verify user payment status |
| `/check-payment-status` | POST | Check if user has paid |
| `/telegram-webhook` | POST | Receive Telegram payment notifications |
| `/generate` | POST | Generate description (existing) |

## Payment Flow

```
User opens app
    ↓
Check payment status
    ↓
[Not Paid] → Show Paywall → Click Pay → Telegram Invoice → Payment → Update Status → Access Granted
[Already Paid] → Access Granted
```

## Key Components

- **PaywallModal.tsx**: Payment UI and logic
- **App.tsx**: Payment status checking
- **server.js**: Payment endpoints and webhook
- **telegram.d.ts**: TypeScript definitions

## Testing Locally

1. Start backend:
   ```bash
   node server.js
   ```

2. Start frontend:
   ```bash
   npm run dev
   ```

3. In development, paywall is bypassed for non-Telegram environments

## Common Commands

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Run linter
npm run lint

# Check server syntax
node -c server.js

# Build and preview
npm run build && npm run preview
```

## Troubleshooting

### Issue: "Payment system not configured"
**Solution**: Set `TELEGRAM_BOT_TOKEN` in backend environment variables

### Issue: "Invalid Telegram data"
**Solution**: Ensure app is opened through Telegram Mini App, not directly in browser

### Issue: Payment successful but access denied
**Solution**: This is expected with in-memory storage after server restart. Implement database.

### Issue: Webhook not receiving events
**Solution**: 
1. Check webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
2. Verify webhook secret matches environment variable
3. Check backend logs for errors

## Security Checklist

- ✅ HMAC validation for Telegram data
- ✅ Webhook secret token support
- ✅ Environment variables for secrets
- ⚠️ Replace in-memory storage with database before production

## Pricing

**Cost**: 100 Telegram Stars (≈ $2 USD)
**Access**: Lifetime, unlimited generations

## Support Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Stars Documentation](https://core.telegram.org/bots/payments#stars)
- [Telegram Web Apps Documentation](https://core.telegram.org/bots/webapps)
- [Google GenAI Documentation](https://ai.google.dev/docs)

## Important Notes

⚠️ **CRITICAL**: Current implementation uses in-memory storage. Data is lost on server restart. Replace with PostgreSQL, MongoDB, or Redis before production.

🔒 **SECURITY**: Always use `TELEGRAM_WEBHOOK_SECRET` in production to prevent unauthorized webhook calls.

💡 **TIP**: Test payment flow thoroughly in Telegram test environment before going live.
