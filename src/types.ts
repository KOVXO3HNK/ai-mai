
import type React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: React.ReactNode;
}