import { GoogleGenAI } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateDescription = async (imageFile: File, userText: string): Promise<string> => {
  // FIX: Adhere to the API key guidelines by using process.env.API_KEY. This also resolves the TypeScript error.
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(imageFile);

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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating description with Gemini API:", error);
    throw new Error("Не удалось сгенерировать описание. Пожалуйста, попробуйте еще раз.");
  }
};
