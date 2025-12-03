
import React, { useEffect, useState } from 'react';

interface PaywallModalProps {
  onPaymentSuccess: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ onPaymentSuccess }) => {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Expand the Telegram Web App to full screen
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const handlePayment = async () => {
    setError(null);
    setIsPaying(true);

    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        throw new Error('Telegram Web App не доступен');
      }

      const userId = tg.initDataUnsafe.user?.id;
      if (!userId) {
        throw new Error('Не удалось получить ID пользователя');
      }

      // Get backend URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ai-mai-backend.onrender.com';
      
      // Request invoice from backend
      const response = await fetch(`${backendUrl}/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          initData: tg.initData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
        throw new Error(errorData.error || 'Не удалось создать счет');
      }

      const { invoiceLink } = await response.json();

      // Open invoice using Telegram Web App
      tg.openInvoice(invoiceLink, async (status) => {
        if (status === 'paid') {
          // Verify payment on backend
          const verifyResponse = await fetch(`${backendUrl}/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              initData: tg.initData,
            }),
          });

          if (verifyResponse.ok) {
            const { hasPaid } = await verifyResponse.json();
            if (hasPaid) {
              localStorage.setItem('telegram_stars_paid', 'true');
              onPaymentSuccess();
            } else {
              setError('Платеж не подтвержден. Попробуйте еще раз.');
            }
          } else {
            setError('Не удалось проверить платеж');
          }
        } else if (status === 'cancelled') {
          setError('Платеж отменен');
        } else {
          setError('Не удалось завершить платеж');
        }
        setIsPaying(false);
      });
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при оплате');
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700">
        <div className="text-center">
          {/* Star icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Премиум доступ
          </h2>
          
          <p className="text-gray-300 mb-6 text-lg">
            Оплатите доступ к генератору описаний для ваших handmade изделий с помощью Telegram Stars
          </p>

          <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold text-yellow-400 mb-2">⭐ 100 Stars</div>
            <p className="text-gray-400 text-sm">Единоразовая оплата • Пожизненный доступ</p>
          </div>

          <ul className="text-left mb-8 space-y-3">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Неограниченная генерация описаний</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Качественные продающие тексты на русском</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">AI-анализ фотографий изделий</span>
            </li>
          </ul>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isPaying}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {isPaying ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Обработка...
              </span>
            ) : (
              'Оплатить 100 ⭐'
            )}
          </button>

          <p className="text-gray-500 text-xs mt-4">
            Безопасная оплата через Telegram
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
