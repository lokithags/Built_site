

import React, { useEffect, useRef, useState } from 'react';
import { FileNode } from '../types';
import { usePreviewErrors } from '../utils/usePreviewErrors';
import PreviewErrorPanel from './PreviewErrorPanel';

interface PreviewPaneProps {
  files: FileNode[];
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ files }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameKey, setFrameKey] = useState(0);

  const { errors, addError, clearErrors } = usePreviewErrors();

  /* ===================== FILE HELPERS ===================== */
  const findFile = (name: string): string => {
    const walk = (nodes: FileNode[]): string | null => {
      for (const n of nodes) {
        if (n.type === 'file' && n.name === name) return n.content || '';
        if (n.children) {
          const r = walk(n.children);
          if (r !== null) return r;
        }
      }
      return null;
    };
    return walk(files) || '';
  };

  /* ===================== MESSAGE LISTENER ===================== */
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data?.__PREVIEW_ERROR__) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      const { type, payload } = event.data;

      const id = JSON.stringify({ type, payload });

      addError({
        id,
        type,
        message: payload.message || payload.args?.join(' ') || 'Error',
        file: payload.source || payload.file,
        line: payload.lineno,
        column: payload.colno,
        stack: payload.stack,
      });
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [addError]);

  /* ===================== RENDER PREVIEW ===================== */
  useEffect(() => {
    if (!iframeRef.current || !files.length) return;

    clearErrors();

    const html = findFile('index.html');
    const css = findFile('styles.css') || findFile('style.css');
    const js = findFile('script.js') || findFile('app.js');
    const dataJson = findFile('data.json') || '{}';

    if (!html) {
      iframeRef.current.srcdoc = `<h2>index.html missing</h2>`;
      return;
    }

    const cleanedHTML = html
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '');

    const finalHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
body { margin:0; font-family:system-ui; }
${css}
</style>
</head>
<body>
<div id="__root__">${cleanedHTML}</div>

<script>
/* ===== ERROR BRIDGE ===== */
(function () {
  const send = (type, payload) =>
    parent.postMessage({ __PREVIEW_ERROR__: true, type, payload }, '*');

  window.onerror = (m, s, l, c, e) =>
    send('runtime', { message: m, source: s, lineno: l, colno: c, stack: e?.stack });

  window.onunhandledrejection = e =>
    send('promise', { message: e.reason?.message || String(e.reason), stack: e.reason?.stack });

  const origErr = console.error;
  console.error = (...args) => {
    send('console', { args });
    origErr(...args);
  };

  window.addEventListener('error', e => {
    if (e.target && e.target !== window) {
      send('resource', {
        message: 'Resource failed to load',
        file: e.target.src || e.target.href
      });
    }
  }, true);
})();
</script>

<script>
//# sourceURL=script.js
try {
  window.__VFS__ = { 'data.json': ${JSON.stringify(dataJson)} };
  const _fetch = fetch;
  fetch = (u, o) => window.__VFS__[u]
    ? Promise.resolve(new Response(window.__VFS__[u]))
    : _fetch(u, o);

  ${js}
} catch (e) {
  console.error(e);
}
</script>

</body>
</html>
`;

    iframeRef.current.srcdoc = finalHTML;
  }, [files, frameKey]);

  useEffect(() => {
    setFrameKey(k => k + 1);
  }, [files]);

  return (
    <div className="flex flex-col h-full">
      <iframe
        ref={iframeRef}
        key={frameKey}
        className="flex-1 border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
      />
      <PreviewErrorPanel errors={errors} />
    </div>
  );
};

export default PreviewPane;
