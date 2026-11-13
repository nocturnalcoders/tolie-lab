import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { setCurrentLang } from '../i18n.js';
import { cleanup, configure } from '@testing-library/react';

// The pages fetch and render asynchronously; give a busy machine more than the default second.
configure({ asyncUtilTimeout: 4000 });

beforeEach(() => {
  localStorage.setItem('lab-lang', 'id'); // the older tests read the Indonesian texts
  setCurrentLang('id');
});

afterEach(() => {
  cleanup();
  document.documentElement.setAttribute('data-theme', 'night');
});

// jsdom does not implement scrolling
window.scrollTo = () => {};
