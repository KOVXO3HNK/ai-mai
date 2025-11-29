import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Render sets the PORT environment variable.
const port = process.env.PORT || 3001;

// In-memory storage for paid users
// NOTE: In production, use a persistent database (PostgreSQL, Redis, etc.)
// This in-memory storage will lose data on server restart
const paidUsers = new Set();

// Check if running in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

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

// Telegram Bot Token for payment verification (optional, for webhook support)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Payment status endpoint
app.get('/payment/status', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const isPaid = paidUsers.has(String(userId));
  res.json({ isPaid });
});

// Create invoice endpoint
app.post('/payment/create-invoice', async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    // Demo mode - only available in development
    if (isDevelopment) {
      console.warn('Development mode: Creating demo invoice (TELEGRAM_BOT_TOKEN not set)');
      paidUsers.add(String(userId));
      return res.json({ 
        invoiceLink: `https://t.me/$pay?slug=demo_${userId}_${Date.now()}`,
        demoMode: true 
      });
    } else {
      return res.status(503).json({ 
        error: 'Payment service not configured. Please set TELEGRAM_BOT_TOKEN.' 
      });
    }
  }

  try {
    // Create invoice using Telegram Bot API
    const invoicePayload = {
      title: 'Доступ к генератору описаний',
      description: 'Неограниченный доступ к AI-генератору описаний для handmade-изделий',
      payload: JSON.stringify({ userId: String(userId), timestamp: Date.now() }),
      currency: 'XTR', // Telegram Stars currency code
      prices: [{ label: 'Доступ к боту', amount: amount }],
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      throw new Error(data.description || 'Failed to create invoice');
    }

    res.json({ invoiceLink: data.result });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Не удалось создать счёт для оплаты' });
  }
});

// Webhook endpoint for Telegram payment updates
app.post('/payment/webhook', (req, res) => {
  const update = req.body;

  // Handle pre-checkout query (required to approve payment)
  if (update.pre_checkout_query) {
    const preCheckoutQueryId = update.pre_checkout_query.id;
    
    // Answer pre-checkout query to approve the payment
    if (TELEGRAM_BOT_TOKEN) {
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pre_checkout_query_id: preCheckoutQueryId,
          ok: true,
        }),
      }).catch(err => console.error('Error answering pre-checkout query:', err));
    }

    return res.json({ ok: true });
  }

  // Handle successful payment
  if (update.message?.successful_payment) {
    try {
      const paymentInfo = update.message.successful_payment;
      const payload = JSON.parse(paymentInfo.invoice_payload);
      const userId = payload.userId;
      
      if (userId) {
        paidUsers.add(String(userId));
        console.log(`Payment successful for user ${userId}`);
      }
    } catch (err) {
      console.error('Error processing payment webhook:', err);
    }

    return res.json({ ok: true });
  }

  res.json({ ok: true });
});

// Manual payment confirmation endpoint (for development/testing only)
app.post('/payment/confirm', (req, res) => {
  // Only allow in development mode or with proper admin authentication
  if (!isDevelopment) {
    const { adminKey } = req.body;
    // Simple admin key check - in production, use proper authentication (JWT, OAuth, etc.)
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  paidUsers.add(String(userId));
  console.log(`Manual payment confirmation for user ${userId}`);
  res.json({ success: true, message: `User ${userId} marked as paid` });
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
