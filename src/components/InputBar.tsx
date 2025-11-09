
import React, { useState, useRef } from 'react';
import { PaperclipIcon, SendIcon } from './icons';

interface InputBarProps {
  onGenerate: (imageFile: File, text: string) => void;
  isLoading: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onGenerate, isLoading }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (imageFile && !isLoading) {
      onGenerate(imageFile, text);
      setText('');
      handleRemoveImage();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
       {imagePreview && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center bg-gray-700 rounded-full p-2 shadow-inner">
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Attach image"
        >
          <PaperclipIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Добавьте детали (материал, размер...)"
          disabled={isLoading}
          className="flex-1 bg-transparent text-gray-200 placeholder-gray-400 px-4 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!imageFile || isLoading}
          className="bg-purple-600 text-white rounded-full p-3 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-purple-500"
          aria-label="Generate description"
        >
          {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SendIcon />}
        </button>
      </div>
    </form>
  );
};

export default InputBar;