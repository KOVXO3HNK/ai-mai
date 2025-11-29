
import React from 'react';
import { PaymentProvider } from './context/PaymentContext';
import PaymentGate from './components/PaymentGate';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <PaymentProvider>
      <PaymentGate>
        <div className="flex flex-col h-screen bg-gray-800 text-gray-100 font-sans">
          <Header />
          <main className="flex-1 overflow-hidden">
            <ChatInterface />
          </main>
        </div>
      </PaymentGate>
    </PaymentProvider>
  );
};

export default App;