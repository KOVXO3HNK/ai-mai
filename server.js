import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

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
