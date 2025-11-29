import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { TelegramWebApp, InvoiceStatus } from '../types/telegram.d';

interface PaymentContextType {
  isPaid: boolean;
  isLoading: boolean;
  error: string | null;
  telegramUserId: number | null;
  initiatePayment: () => Promise<void>;
  checkPaymentStatus: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const PAYMENT_AMOUNT = 10; // Amount in Telegram Stars

// Helper to get Telegram WebApp
const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Initialize Telegram WebApp and check payment status
  useEffect(() => {
    const webApp = getTelegramWebApp();
    
    if (webApp) {
      webApp.ready();
      webApp.expand();
      
      const userId = webApp.initDataUnsafe.user?.id;
      if (userId) {
        setTelegramUserId(userId);
      }
    }
  }, []);

  // Check payment status when we have userId
  const checkPaymentStatus = useCallback(async () => {
    if (!telegramUserId || !backendUrl) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${backendUrl}/payment/status?userId=${telegramUserId}`);
      
      if (!response.ok) {
        throw new Error('Не удалось проверить статус оплаты');
      }
      
      const data = await response.json();
      setIsPaid(data.isPaid === true);
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError(err instanceof Error ? err.message : 'Ошибка проверки оплаты');
      setIsPaid(false);
    } finally {
      setIsLoading(false);
    }
  }, [telegramUserId, backendUrl]);

  useEffect(() => {
    if (telegramUserId) {
      checkPaymentStatus();
    } else {
      // If no Telegram user (e.g., testing in browser), allow access
      const webApp = getTelegramWebApp();
      if (!webApp) {
        setIsPaid(true);
        setIsLoading(false);
      }
    }
  }, [telegramUserId, checkPaymentStatus]);

  const initiatePayment = useCallback(async () => {
    const webApp = getTelegramWebApp();
    
    if (!webApp) {
      setError('Telegram WebApp не доступен');
      return;
    }

    if (!telegramUserId || !backendUrl) {
      setError('Не удалось инициализировать оплату');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request invoice from backend
      const response = await fetch(`${backendUrl}/payment/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: telegramUserId,
          amount: PAYMENT_AMOUNT,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось создать счёт для оплаты');
      }

      const data = await response.json();
      
      if (!data.invoiceLink) {
        throw new Error('Не получена ссылка на оплату');
      }

      // Open the invoice
      webApp.openInvoice(data.invoiceLink, (status: InvoiceStatus) => {
        if (status === 'paid') {
          setIsPaid(true);
          setError(null);
        } else if (status === 'cancelled') {
          setError('Оплата отменена');
        } else if (status === 'failed') {
          setError('Ошибка оплаты. Попробуйте ещё раз.');
        }
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err instanceof Error ? err.message : 'Ошибка инициализации оплаты');
      setIsLoading(false);
    }
  }, [telegramUserId, backendUrl]);

  return (
    <PaymentContext.Provider
      value={{
        isPaid,
        isLoading,
        error,
        telegramUserId,
        initiatePayment,
        checkPaymentStatus,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
