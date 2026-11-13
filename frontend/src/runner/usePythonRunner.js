import { useEffect, useRef, useState } from 'react';
import { useT } from '../lang.jsx';
import { createPythonRunner } from './pythonRunner.js';

// One runner per page. The worker is stopped when the page is left.
export function usePythonRunner() {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t; // messages follow the language chosen right now
  const [status, setStatus] = useState('idle'); // idle | loading | ready | running
  const ref = useRef(null);
  if (!ref.current) ref.current = createPythonRunner({ onStatus: setStatus, t: (text, vars) => tRef.current(text, vars) });
  useEffect(() => () => ref.current.reset(), []);
  return [ref.current, status];
}
