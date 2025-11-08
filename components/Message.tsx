
import React from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isModel = message.role === 'model';
  const isSystem = message.role === 'system';

  const bubbleClasses = () => {
    if (isUser) return 'bg-purple-600 text-white self-end';
    if (isModel) return 'bg-gray-700 text-gray-200 self-start';
    if (isSystem) return 'bg-red-900/50 text-red-300 self-center w-full text-center';
    return 'bg-gray-600 text-white self-start';
  };

  const containerClasses = () => {
    if (isUser) return 'justify-end';
    if (isModel) return 'justify-start';
    return 'justify-center';
  };

  return (
    <div className={`flex ${containerClasses()} mb-4`}>
      <div className={`max-w-lg md:max-w-2xl rounded-xl p-4 shadow-md ${bubbleClasses()}`}>
        <div className="prose prose-invert prose-sm max-w-none">{message.content}</div>
      </div>
    </div>
  );
};

export default MessageBubble;
