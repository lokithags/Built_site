
// components/ErrorDisplay.tsx
import React from 'react';

interface ErrorDisplayProps {
  errorMessage: string;
  aiAnalysis?: string | null;   // ← Now optional
  onClearError: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage, aiAnalysis, onClearError }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-900 border border-red-600 p-5 rounded-xl shadow-2xl max-w-lg">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-red-100 text-lg">Build Error</h3>
        <button onClick={onClearError} className="text-red-300 hover:text-white text-xl">×</button>
      </div>

      <pre className="text-sm bg-black/30 p-3 rounded overflow-x-auto text-red-200">
        {errorMessage}
      </pre>

      {aiAnalysis && (
        <div className="mt-4 p-4 bg-amber-900/50 border border-amber-600 rounded-lg">
          <p className="font-semibold text-amber-200 mb-2">AI Suggested Fix:</p>
          <p className="text-amber-100 text-sm leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      <button
        onClick={onClearError}
        className="mt-4 w-full py-2 bg-red-700 hover:bg-red-600 rounded-lg font-medium transition"
      >
        Dismiss
      </button>
    </div>
  );
};

export default ErrorDisplay;