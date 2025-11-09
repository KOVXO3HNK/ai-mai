
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm shadow-md p-4 border-b border-gray-700">
      <h1 className="text-xl md:text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        Генератор описаний для Handmade
      </h1>
    </header>
  );
};

export default Header;