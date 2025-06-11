"use client";

import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea as user types
  const handleTextareaChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  return (
    <div className="relative bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
      <textarea
        ref={textareaRef}
        className="w-full bg-transparent resize-none px-4 py-3 pr-14 text-white placeholder-gray-400 focus:outline-none"
        placeholder="Ask anything..."
        rows={1}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTextareaChange();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{ maxHeight: '150px' }}
      />
      <button
        className={`absolute right-2 bottom-2 p-2 rounded-lg ${
          message.trim() && !disabled
            ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        } transition-colors`}
        onClick={handleSubmit}
        disabled={!message.trim() || disabled}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
