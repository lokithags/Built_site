
import Editor from '@monaco-editor/react';
import { FileNode } from '../types';

interface Props {
  file: FileNode;
  onChange: (value?: string) => void;
}

const MonacoEditor: React.FC<Props> = ({ file, onChange }) => {
  if (file.fileType?.startsWith('image/')) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <img src={file.content} className="max-w-full max-h-full" />
      </div>
    );
  }

  const language =
    file.name.endsWith('.json') ? 'json' :
    file.name.endsWith('.css') ? 'css' :
    file.name.endsWith('.js') ? 'javascript' :
    file.name.endsWith('.html') ? 'html' :
    'plaintext';

  return (
    <Editor
      theme="vs-dark"
      language={language}
      value={file.content || ''}
      onChange={onChange}
      options={{ fontSize: 14 }}
    />
  );
};

export default MonacoEditor;
