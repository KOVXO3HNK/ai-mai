import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
// Render sets the PORT environment variable.
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Check for API key
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Check for Telegram Bot Token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN is not set. Payment features will not work.");
}

// WARNING: In-memory storage for paid users - NOT suitable for production!
// Data will be lost on server restart, causing users to lose access after payment.
// TODO: Replace with a persistent database (PostgreSQL, MongoDB, etc.) before production deployment.
const paidUsers = new Set();

// Helper function to validate Telegram init data
function validateTelegramInitData(initData) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  if (!initData) {
    console.error('initData is empty');
    return false;
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      console.error('No hash in initData');
      return false;
    }
    
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();
    
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating init data:', error);
    return false;
  }
}

// Endpoint to create invoice
app.post('/create-invoice', async (req, res) => {
  try {
    const { userId, initData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Validate init data
    if (!validateTelegramInitData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    // Create invoice using Telegram Bot API
    const invoicePayload = {
      title: 'Премиум доступ к генератору описаний',
      description: 'Неограниченная генерация описаний для handmade изделий',
      payload: `user_${userId}`,
      currency: 'XTR', // Telegram Stars currency code
      prices: [{ label: 'Премиум доступ', amount: 100 }], // 100 Stars
    };

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ error: 'Failed to create invoice' });
    }

    res.json({ invoiceLink: data.result });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Endpoint to verify payment
app.post('/verify-payment', async (req, res) => {
  try {
    const { userId, initData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Validate init data
    if (!validateTelegramInitData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Check if user has paid (in memory for now)
    const hasPaid = paidUsers.has(userId);
    res.json({ hasPaid });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Endpoint to check payment status
app.post('/check-payment-status', async (req, res) => {
  try {
    const { userId, initData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Validate init data
    if (!validateTelegramInitData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Check if user has paid
    const hasPaid = paidUsers.has(userId);
    res.json({ hasPaid });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Webhook endpoint for Telegram payment notifications
// IMPORTANT: For production, set up webhook secret token verification
// Set webhook with: curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" 
//                       -d "url=YOUR_URL&secret_token=YOUR_SECRET"
app.post('/telegram-webhook', express.json(), async (req, res) => {
  try {
    // Verify webhook secret token if configured
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secretToken = req.headers['x-telegram-bot-api-secret-token'];
      if (secretToken !== TELEGRAM_WEBHOOK_SECRET) {
        console.error('Invalid webhook secret token');
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const update = req.body;

    // Handle successful payment
    if (update.pre_checkout_query) {
      const { id } = update.pre_checkout_query;
      
      // Answer pre-checkout query
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pre_checkout_query_id: id, ok: true }),
        }
      );
    }

    // Handle successful payment completion
    if (update.message?.successful_payment) {
      const userId = update.message.from.id;
      const payload = update.message.successful_payment.invoice_payload;
      
      // Extract user ID from payload
      const payloadUserId = payload.replace('user_', '');
      
      if (String(userId) === String(payloadUserId)) {
        // Add user to paid users
        paidUsers.add(userId);
        console.log(`User ${userId} has paid successfully`);
      } else {
        console.error(`User ID mismatch: ${userId} vs ${payloadUserId}`);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook error' });
  }
});


app.post('/generate', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  try {
    const { userText } = req.body;
    
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const finalPrompt = `
Задание: Создай привлекательное и подробное товарное описание на русском языке для handmade-изделия, изображенного на фото.

Стиль: Дружелюбный, теплый, подчеркивающий уникальность и ценность ручной работы.

Структура описания:
1.  **Яркий заголовок:** Придумай запоминающееся название для товара.
2.  **Введение:** Кратко опиши изделие и эмоции, которые оно вызывает.
3.  **Детали и материалы:** Расскажи о материалах, из которых сделано изделие (если их можно определить по фото), о техниках, которые могли быть использованы. Обрати внимание на мелкие детали.
4.  **Идеальный подарок/применение:** Подскажи, для кого или для какого случая это изделие станет идеальным подарком или как его можно использовать.
5.  **Завершение:** Заверши описание теплым призывом к покупке или упоминанием о душе, вложенной в работу.

Дополнительная информация от пользователя: "${userText || 'Нет'}"

Сгенерируй только текст описания, без лишних вступлений вроде "Конечно, вот описание:". Ответ должен быть хорошо отформатирован с использованием абзацев.
`;

    const contents = { parts: [imagePart, { text: finalPrompt }] };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });
    
    res.json({ description: response.text });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: 'Не удалось сгенерировать описание. Пожалуйста, попробуйте еще раз.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
