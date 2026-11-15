import { useEffect, useRef, useState } from 'react';
import { useT } from '../lang.jsx';
import { createRunner, RUNNERS } from './codeRunner.js';

// One runner per language per page (Python unless the course is SQL). Workers are stopped when the page is left.
export function useRunner(language = 'python') {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t; // messages follow the language chosen right now
  const [status, setStatus] = useState('idle'); // idle | loading | ready | running
  const runners = useRef({});
  const key = RUNNERS[language] ? language : 'python';
  if (!runners.current[key]) runners.current[key] = createRunner(key, { onStatus: setStatus, t: (text, vars) => tRef.current(text, vars) });
  useEffect(() => () => Object.values(runners.current).forEach((r) => r.reset()), []);
  return [runners.current[key], status];
}
