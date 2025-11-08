
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import InputBar from './InputBar';
import MessageBubble from './Message';
import Spinner from './Spinner';
import { generateDescription } from '../services/geminiService';

const WelcomeMessage = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
    <div className="bg-gray-700/50 p-8 rounded-2xl max-w-md">
      <h2 className="text-3xl font-bold mb-4 text-gray-200">Создайте Идеальное Описание</h2>
      <p>Загрузите фотографию вашего handmade-изделия, добавьте краткий комментарий (по желанию), и я помогу составить красивое и продающее описание на русском языке.</p>
    </div>
  </div>
);

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleGenerate = async (imageFile: File, text: string) => {
    setError(null);
    setIsLoading(true);

    const userMessageContent = (
      <div className="flex flex-col gap-2">
        <img src={URL.createObjectURL(imageFile)} alt="Handmade item" className="rounded-lg max-w-xs max-h-64 object-cover" />
        {text && <p>{text}</p>}
      </div>
    );

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessageContent }]);

    try {
      const description = await generateDescription(imageFile, text);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: <div className="whitespace-pre-wrap">{description}</div> }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
      setError(errorMessage);
       setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'system', content: `Ошибка: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && !isLoading && <WelcomeMessage />}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-center items-center p-4">
               <div className="flex items-center gap-3 text-gray-400">
                 <Spinner />
                 <span>Генерирую описание...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="px-4 md:px-6 py-4 bg-gray-800 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          <InputBar onGenerate={handleGenerate} isLoading={isLoading} />
           {error && !isLoading && (
            <p className="text-red-400 text-center text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
