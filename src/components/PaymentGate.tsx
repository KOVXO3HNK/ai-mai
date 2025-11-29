import React from 'react';
import { usePayment } from '../context/PaymentContext';
import { StarIcon } from './icons';
import Spinner from './Spinner';

const PaymentGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPaid, isLoading, error, initiatePayment } = usePayment();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-800 text-gray-100">
        <Spinner />
        <p className="mt-4 text-gray-400">Проверка доступа...</p>
      </div>
    );
  }

  if (isPaid) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-800 text-gray-100 p-6">
      <div className="bg-gray-700/50 p-8 rounded-2xl max-w-md text-center shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full shadow-lg">
            <StarIcon className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Доступ к генератору описаний
        </h2>
        
        <p className="text-gray-300 mb-6 leading-relaxed">
          Получите неограниченный доступ к AI-генератору описаний для ваших handmade-изделий. 
          Создавайте продающие тексты за секунды!
        </p>

        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <StarIcon className="h-6 w-6 text-yellow-400" />
            <span className="text-3xl font-bold text-white">10</span>
            <span className="text-gray-400">Telegram Stars</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Одноразовая оплата</p>
        </div>

        <button
          onClick={initiatePayment}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl 
                   hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] 
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800
                   shadow-lg hover:shadow-xl"
        >
          <span className="flex items-center justify-center gap-2">
            <StarIcon className="h-5 w-5" />
            Оплатить и получить доступ
          </span>
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Оплата производится через Telegram Stars — безопасная внутренняя валюта Telegram
        </p>
      </div>
    </div>
  );
};

export default PaymentGate;
