
// src/components/FileExplorer.tsx
import React, { useRef, useState } from 'react';
import { FileNode } from '../types';
import { Folder, FileText, ChevronDown, ChevronRight, Upload, Plus, Trash2, FolderPlus } from 'lucide-react';

interface Props {
  files: FileNode[];
  setFiles: (files: FileNode[]) => void;
  openFileIds: string[];
  setOpenFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeFileId: string | null;
  setActiveFileId: (id: string) => void;
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  onSave: (files: FileNode[]) => void;
}

const FileExplorer: React.FC<Props> = ({
  files,
  setFiles,
  openFileIds,
  setOpenFileIds,
  activeFileId,
  setActiveFileId,
  expandedFolders,
  setExpandedFolders,
  onSave,
}) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [name, setName] = useState('');
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);

  const generateId = () => crypto.randomUUID();

  // ---------------- Protected files ----------------
  const isProtected = (node: FileNode) =>
    ['index.html', 'styles.css', 'script.js', 'data.json'].includes(node.name);

  // ---------------- Add file/folder node ----------------
  const addNode = (node: FileNode, parentId?: string) => {
    let newFiles: FileNode[];
    if (!parentId) {
      newFiles = [...files, node];
    } else {
      const insert = (arr: FileNode[]): FileNode[] =>
        arr.map(f => {
          if (f.id === parentId && f.type === 'folder') {
            f.children = f.children ? [...f.children, node] : [node];
          } else if (f.children) f.children = insert(f.children);
          return f;
        });
      newFiles = insert(files);
      setExpandedFolders(prev => new Set(prev).add(parentId));
    }
    setFiles(newFiles);
    setActiveFileId(node.id);
    setOpenFileIds(prev => [...prev, node.id]);
    onSave(newFiles);
  };

  // ---------------- Upload file ----------------
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, parentId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      addNode(
        {
          id: generateId(),
          name: file.name,
          type: 'file',
          content: reader.result as string,
          fileType: file.type,
        },
        parentId
      );
    };

    file.type.startsWith('image/') ? reader.readAsDataURL(file) : reader.readAsText(file);
  };

  // ---------------- Delete file/folder ----------------
  const handleDelete = (node: FileNode) => {
    if (isProtected(node)) return;

    const remove = (arr: FileNode[]): FileNode[] =>
      arr.filter(f => {
        if (f.id === node.id) return false;
        if (f.children) f.children = remove(f.children);
        return true;
      });

    const newFiles = remove(files);
    setFiles(newFiles);
    onSave(newFiles);
  };

  // ---------------- Drag-and-drop ----------------
  const moveNode = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;

    let movingNode: FileNode | null = null;

    const remove = (arr: FileNode[]): FileNode[] =>
      arr.filter(f => {
        if (f.id === dragId) {
          movingNode = f;
          return false;
        }
        if (f.children) f.children = remove(f.children);
        return true;
      });

    const treeWithoutNode = remove(files);
    if (!movingNode) return;

    const insert = (arr: FileNode[]): FileNode[] =>
      arr.map(f => {
        if (f.id === targetId && f.type === 'folder') {
          f.children = f.children ? [...f.children, movingNode!] : [movingNode!];
        } else if (f.children) f.children = insert(f.children);
        return f;
      });

    const updatedFiles = insert(treeWithoutNode);
    setFiles(updatedFiles);
    onSave(updatedFiles);
  };

  // ---------------- Render file/folder nodes ----------------
  const renderNode = (node: FileNode, depth = 0) => {
    const protectedFile = isProtected(node);

    if (node.type === 'folder') {
      const open = expandedFolders.has(node.id);

      return (
        <div
          key={node.id}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (draggedFileId) moveNode(draggedFileId, node.id);
          }}
        >
          <div
            className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700"
            style={{ paddingLeft: depth * 14 }}
            onClick={() =>
              setExpandedFolders(prev => {
                const n = new Set(prev);
                open ? n.delete(node.id) : n.add(node.id);
                return n;
              })
            }
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} />
            {node.name}
          </div>
          {open && node.children?.map(c => renderNode(c, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={node.id}
        draggable={!protectedFile}
        onDragStart={() => !protectedFile && setDraggedFileId(node.id)}
        onDragEnd={() => setDraggedFileId(null)}
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-700 ${
          activeFileId === node.id ? 'bg-blue-900' : ''
        }`}
        style={{ paddingLeft: depth * 14 + 18 }}
      >
        <FileText size={14} />
        <span
          className="flex-1"
          onClick={() => {
            setActiveFileId(node.id);
            if (!openFileIds.includes(node.id)) setOpenFileIds([...openFileIds, node.id]);
          }}
        >
          {node.name}
        </span>
        {!protectedFile && (
          <button title="Delete" onClick={() => handleDelete(node)}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  };

  // ---------------- Create folder ----------------
  const handleCreateFolder = (parentId?: string) => {
    if (!name.trim()) return;
    addNode({ id: generateId(), name, type: 'folder', children: [] }, parentId);
    setName('');
    setCreatingFolder(false);
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 h-full flex flex-col">
      <div className="flex justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-xs">EXPLORER</span>
        <div className="flex gap-1">
          <button onClick={() => fileInput.current?.click()}>
            <Upload size={14} />
          </button>
          <button onClick={() => setCreatingFile(true)}>
            <Plus size={14} />
          </button>
          <button onClick={() => setCreatingFolder(true)}>
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <input ref={fileInput} type="file" className="hidden" onChange={handleUpload} />

      {creatingFile && (
        <input
          autoFocus
          className="w-full bg-gray-800 px-2 py-1 text-sm"
          placeholder="filename.txt"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) {
              addNode({ id: generateId(), name, type: 'file', content: '' });
              setName('');
              setCreatingFile(false);
            }
          }}
        />
      )}

      {creatingFolder && (
        <input
          autoFocus
          className="w-full bg-gray-800 px-2 py-1 text-sm"
          placeholder="Folder name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCreateFolder();
          }}
        />
      )}

      <div className="flex-1 overflow-auto p-1">{files.map(f => renderNode(f))}</div>
    </div>
  );
};

export default FileExplorer;
