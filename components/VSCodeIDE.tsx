
import React, { useState, useEffect, useMemo } from 'react';
import FileExplorer from './FileExplorer';
import EditorTabs from './EditorTabs';
import MonacoEditor from './MonacoEditor';
import { storageService } from '../services/storageService';
import { codeBundleToFiles } from '../utils/parseCode';
import { FileNode } from '../types';

interface VSCodeIDEProps {
  projectId: string;
  onFilesChange?: (files: FileNode[]) => void;
}

const CORE_FILES = ['index.html', 'styles.css', 'script.js', 'data.json'];

const VSCodeIDE: React.FC<VSCodeIDEProps> = ({ projectId, onFilesChange }) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  /* ---------------- HELPERS ---------------- */

  const findFile = (id: string, nodes: FileNode[] = files): FileNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findFile(id, n.children);
        if (found) return found;
      }
    }
    return null;
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const n of nodes) {
      if (n.type === 'file') return n;
      if (n.children) {
        const f = findFirstFile(n.children);
        if (f) return f;
      }
    }
    return null;
  };

  const flattenFiles = (nodes: FileNode[]): FileNode[] =>
    nodes.flatMap(n =>
      n.type === 'file'
        ? [n]
        : n.children
        ? flattenFiles(n.children)
        : []
    );

  /* ---------------- LOAD FILES ---------------- */

  useEffect(() => {
    const project = storageService.getProject(projectId);
    if (!project) return;

    let tree: FileNode[] = [];

    if (project.versions[0]) {
      const { html, css, js, json, extraFiles = [] } = project.versions[0].code;

      const coreTree = codeBundleToFiles({ html, css, js, json });

      // ✅ FIX: merge extra files into root folder
      tree = coreTree.map(node => {
        if (node.type === 'folder' && node.children) {
          return {
            ...node,
            children: [...node.children, ...extraFiles],
          };
        }
        return node;
      });
    } else {
      tree = codeBundleToFiles({
        html: '<!DOCTYPE html><html><body><h1>Welcome</h1></body></html>',
        css: 'body { font-family: system-ui; }',
        js: '',
        json: '{}',
      });
    }

    setFiles(tree);
    onFilesChange?.(tree);

    const first = findFirstFile(tree);
    if (first) {
      setActiveFileId(first.id);
      setOpenFileIds([first.id]);
    }
  }, [projectId]);

  /* ---------------- KEEP ACTIVE FILE VALID ---------------- */

  useEffect(() => {
    if (activeFileId && !findFile(activeFileId)) {
      const fallback = findFirstFile(files);
      setActiveFileId(fallback?.id || null);
      setOpenFileIds(fallback ? [fallback.id] : []);
    }
  }, [files, activeFileId]);

  /* ---------------- SAVE TO STORAGE ---------------- */

  const saveExtraFiles = (allFiles: FileNode[]) => {
    const project = storageService.getProject(projectId);
    if (!project || !project.versions[0]) return;

    const flat = flattenFiles(allFiles);

    const coreFiles = flat.filter(f => CORE_FILES.includes(f.name));
    const extraFiles = flat.filter(f => !CORE_FILES.includes(f.name));

    const coreCode: any = {};
    coreFiles.forEach(f => {
      if (f.name === 'index.html') coreCode.html = f.content || '';
      if (f.name === 'styles.css') coreCode.css = f.content || '';
      if (f.name === 'script.js') coreCode.js = f.content || '';
      if (f.name === 'data.json') coreCode.json = f.content || '{}';
    });

    storageService.addCodeVersion(projectId, {
      id: crypto.randomUUID(),
      code: {
        html: coreCode.html ?? project.versions[0].code.html,
        css: coreCode.css ?? project.versions[0].code.css,
        js: coreCode.js ?? project.versions[0].code.js,
        json: coreCode.json ?? project.versions[0].code.json,
        extraFiles,
      },
      prompt: 'Manual file edit / upload',
      timestamp: Date.now(),
    });

    const updatedTree = codeBundleToFiles(coreCode).map(node => {
      if (node.type === 'folder' && node.children) {
        return { ...node, children: [...node.children, ...extraFiles] };
      }
      return node;
    });

    setFiles(updatedTree);
    onFilesChange?.(updatedTree);
  };

  /* ---------------- UPDATE FILE CONTENT ---------------- */

  const updateFileContent = (id: string, content: string) => {
    const update = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => {
        if (n.id === id && n.type === 'file') {
          return { ...n, content };
        }
        if (n.children) {
          return { ...n, children: update(n.children) };
        }
        return n;
      });

    const updated = update(files);
    setFiles(updated);
    onFilesChange?.(updated);
    saveExtraFiles(updated);
  };

  const handleFilesChange = (newFiles: FileNode[]) => {
    setFiles(newFiles);
    onFilesChange?.(newFiles);
    saveExtraFiles(newFiles);
  };

  /* ---------------- DERIVED ---------------- */

  const activeFile = useMemo(
    () => (activeFileId ? findFile(activeFileId) : null),
    [activeFileId, files]
  );

  /* ---------------- RENDER ---------------- */

  return (
    <div className="flex h-full bg-black">
      <FileExplorer
        files={files}
        setFiles={handleFilesChange}
        openFileIds={openFileIds}
        setOpenFileIds={setOpenFileIds}
        activeFileId={activeFileId}
        setActiveFileId={setActiveFileId}
        expandedFolders={expandedFolders}
        setExpandedFolders={setExpandedFolders}
        onSave={() => saveExtraFiles(files)}
      />

      <div className="flex-1 flex flex-col">
        <EditorTabs
          openFileIds={openFileIds}
          files={files}
          activeFileId={activeFileId}
          setActiveFileId={setActiveFileId}
          setOpenFileIds={setOpenFileIds}
        />

        {activeFile ? (
          <MonacoEditor
            key={activeFile.id}
            file={activeFile}
            onChange={(value) =>
              updateFileContent(activeFile.id, value ?? '')
            }
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select or upload a file to edit
          </div>
        )}
      </div>
    </div>
  );
};

export default VSCodeIDE;
