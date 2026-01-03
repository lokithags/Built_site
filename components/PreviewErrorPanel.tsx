
import React, { useState } from 'react';
import { PreviewError } from '../utils/usePreviewErrors';

interface Props {
  errors: PreviewError[];
}

const typeDot: Record<string, string> = {
  runtime: 'bg-red-500',
  promise: 'bg-orange-400',
  console: 'bg-yellow-400',
  resource: 'bg-purple-400',
};

const typeLabel: Record<string, string> = {
  runtime: 'Runtime Error',
  promise: 'Promise Rejection',
  console: 'Console Error',
  resource: 'Resource Error',
};

const formatError = (e: PreviewError, index?: number) => {
  return `
${index !== undefined ? `[${index + 1}] ` : ''}${typeLabel[e.type]}
Message: ${e.message}
${e.file ? `File: ${e.file}${e.line ? `:${e.line}` : ''}${e.column ? `:${e.column}` : ''}` : ''}
${e.stack ? `Stack:\n${e.stack}` : ''}
`.trim();
};

const PreviewErrorPanel: React.FC<Props> = ({ errors }) => {
  const [open, setOpen] = useState(false);

  if (!errors.length) return null;

  const copyOne = async (e: PreviewError) => {
    await navigator.clipboard.writeText(formatError(e));
  };

  const copyAll = async () => {
    const text = `
=== PREVIEW ERRORS (${errors.length}) ===

${errors.map((e, i) => formatError(e, i)).join('\n\n----------------------\n\n')}
`.trim();

    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="select-none">
      {/* HEADER */}
      <div
        onClick={() => setOpen(o => !o)}
        className="h-10 flex items-center justify-between px-3
                   bg-[#1e1e1e] border-t border-[#333]
                   cursor-pointer hover:bg-[#252525]"
      >
        <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
          <span>●</span>
          <span>{errors.length} Error{errors.length > 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#aaa]">
          {open && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyAll();
              }}
              className="hover:text-white"
            >
              Copy All
            </button>
          )}
          <span>{open ? 'Hide' : 'Show'}</span>
        </div>
      </div>

      {/* BODY */}
      {open && (
        <div className="max-h-56 overflow-auto bg-[#1e1e1e] border-t border-[#333] font-mono text-sm">
          {errors.map((e) => (
            <div
              key={e.id}
              className="px-3 py-2 border-b border-[#2a2a2a]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${typeDot[e.type]}`} />
                  <span className="text-[#f48771]">
                    {e.message}
                  </span>
                </div>

                <button
                  onClick={() => copyOne(e)}
                  className="text-xs text-[#aaa] hover:text-white"
                >
                  Copy
                </button>
              </div>

              {(e.file || e.line) && (
                <div className="text-[#888] mt-1 ml-4">
                  {e.file}
                  {e.line ? `:${e.line}` : ''}
                  {e.column ? `:${e.column}` : ''}
                </div>
              )}

              {e.stack && (
                <pre className="mt-1 ml-4 text-[#777] whitespace-pre-wrap">
                  {e.stack}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewErrorPanel;
