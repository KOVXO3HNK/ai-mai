
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import PaywallModal from './components/PaywallModal';

const App: React.FC = () => {
  const [hasPaid, setHasPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Check if running in Telegram Web App
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        // Not in Telegram, allow access for development
        if (import.meta.env.DEV) {
          setHasPaid(true);
        }
        setIsLoading(false);
        return;
      }

      tg.ready();
      
      // Check local storage first
      const localPaid = localStorage.getItem('telegram_stars_paid') === 'true';
      if (localPaid) {
        setHasPaid(true);
        setIsLoading(false);
        return;
      }

      // Check with backend
      const userId = tg.initDataUnsafe.user?.id;
      if (userId) {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ai-mai-backend.onrender.com';
          const response = await fetch(`${backendUrl}/check-payment-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              initData: tg.initData,
            }),
          });

          if (response.ok) {
            const { hasPaid: paidStatus } = await response.json();
            setHasPaid(paidStatus);
            if (paidStatus) {
              localStorage.setItem('telegram_stars_paid', 'true');
            }
          }
        } catch (error) {
          console.error('Failed to check payment status:', error);
        }
      }
      
      setIsLoading(false);
    };

    checkPaymentStatus();
  }, []);

  const handlePaymentSuccess = () => {
    setHasPaid(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!hasPaid) {
    return <PaywallModal onPaymentSuccess={handlePaymentSuccess} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-gray-100 font-sans">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
};

export default App;