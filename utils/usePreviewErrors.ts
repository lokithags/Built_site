import { useCallback, useRef, useState } from 'react';

export type PreviewErrorType =
  | 'runtime'
  | 'promise'
  | 'console'
  | 'resource';

export interface PreviewError {
  id: string;
  type: PreviewErrorType;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export function usePreviewErrors() {
  const [errors, setErrors] = useState<PreviewError[]>([]);
  const seen = useRef(new Set<string>());

  const addError = useCallback((err: PreviewError) => {
    if (seen.current.has(err.id)) return;
    seen.current.add(err.id);
    setErrors(prev => [...prev, err]);
  }, []);

  const clearErrors = useCallback(() => {
    seen.current.clear();
    setErrors([]);
  }, []);

  return { errors, addError, clearErrors };
}
