

import React, { useState, useRef, useEffect } from 'react';

type Mode = 'code' | 'plan' | 'chat';

interface ChatInputProps {
  onSendMessage: (message: string, mode: Mode) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('code');
  const [showDropdown, setShowDropdown] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modes = [
    { value: 'code' as Mode, label: 'Code', icon: '⚡', color: 'bg-blue-600 hover:bg-blue-500' },
    { value: 'plan' as Mode, label: 'Plan', icon: '📋', color: 'bg-amber-600 hover:bg-amber-500' },
    { value: 'chat' as Mode, label: 'Chat', icon: '💬', color: 'bg-purple-600 hover:bg-purple-500' },
  ];

  const currentMode = modes.find(m => m.value === mode)!;

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), mode);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="p-4 border-t border-gray-700 bg-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Input Container */}
        <div className="bg-gray-700 border border-gray-600 rounded-xl p-4">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'AI is thinking...' : `Type your message (${mode} mode)...`}
            disabled={isLoading}
            rows={1}
            className="w-full resize-none bg-transparent text-gray-100 placeholder-gray-400 text-sm focus:outline-none scrollbar-thin"
          />

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            {/* Mode Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => !isLoading && setShowDropdown(prev => !prev)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs tracking-wider shadow-md transition-all
                  ${currentMode.color} text-white`}
              >
                <span>{currentMode.icon}</span>
                {currentMode.label}
                <svg
                  className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute bottom-full mb-2 left-0 w-44 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden z-50">
                  {modes.map(m => (
                    <button
                      key={m.value}
                      onClick={() => {
                        setMode(m.value);
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${m.color} text-white font-medium`}
                    >
                      <span>{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`w-11 h-11 rounded-xl shadow-lg flex items-center justify-center transition-all
                ${isLoading || !input.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
            >
              <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
