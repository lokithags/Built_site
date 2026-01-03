// src/components/EditorTabs.tsx
import React from 'react';
import { FileNode } from '../types';
import { X } from 'lucide-react';

interface EditorTabsProps {
  openFileIds: string[];
  files: FileNode[];
  activeFileId: string | null;
  setActiveFileId: (id: string) => void;
  setOpenFileIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const findFileById = (id: string, files: FileNode[]): FileNode | undefined => {
  for (const node of files) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(id, node.children);
      if (found) return found;
    }
  }
  return undefined;
};

const EditorTabs: React.FC<EditorTabsProps> = ({
  openFileIds,
  files,
  activeFileId,
  setActiveFileId,
  setOpenFileIds,
}) => {
  return (
    <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
      {openFileIds.map((id) => {
        const file = findFileById(id, files);
        if (!file || file.type !== 'file') return null;

        return (
          <div
            key={id}
            onClick={() => setActiveFileId(id)}
            className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer whitespace-nowrap transition ${
              activeFileId === id ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="text-sm font-medium">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenFileIds((prev) => {
                  const filtered = prev.filter((fid) => fid !== id);
                  if (activeFileId === id && filtered.length > 0) {
                    setActiveFileId(filtered[filtered.length - 1]);
                  }
                  return filtered;
                });
              }}
              className="hover:bg-gray-600 rounded p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      {openFileIds.length === 0 && (
        <div className="px-4 py-2 text-gray-500 text-sm">No files open</div>
      )}
    </div>
  );
};

export default EditorTabs;