
// src/utils/parseCode.ts — FINAL VERSION WITH data.json ALWAYS INCLUDED
import { FileNode, CodeBundle } from '../types';

export const codeBundleToFiles = (bundle: CodeBundle): FileNode[] => {
  const root: FileNode = {
    id: 'root',
    name: 'my-project',
    type: 'folder',
    children: [],
  };

  const src: FileNode = {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [],
  };

  root.children!.push(src);

  // Always create these 4 files — even if empty
  src.children!.push(
    {
      id: 'index-html',
      name: 'index.html',
      type: 'file',
      content: bundle.html?.trim() || '<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><title>My App</title><link rel="stylesheet" href="styles.css"></head><body><h1>Hello World</h1><script src="script.js"></script></body></html>',
      language: 'html',
    },
    {
      id: 'styles-css',
      name: 'styles.css',
      type: 'file',
      content: bundle.css?.trim() || '/* Your styles here */\nbody { font-family: system-ui, sans-serif; }',
      language: 'css',
    },
    {
      id: 'script-js',
      name: 'script.js',
      type: 'file',
      content: bundle.js?.trim() || '// Your JavaScript here\nconsole.log("Ready!");',
      language: 'javascript',
    },
    {
      id: 'data-json',
      name: 'data.json',
      type: 'file',
      content: bundle.json?.trim() || '{\n  "siteTitle": "My AI App",\n  "welcome": "Edit me in data.json!"\n}',
      language: 'json',
    }
  );

  return [root];
};