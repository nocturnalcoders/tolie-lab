import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import App from '../App.jsx';
import { AuthProvider } from '../auth.jsx';
import { LangProvider } from '../lang.jsx';
import { detectLang, translate } from '../i18n.js';
import EN from '../locales/en.js';

vi.mock('../components/CodeEditor.jsx', () => ({
  default: ({ value, onChange }) => <textarea data-testid="editor" value={value} onChange={(e) => onChange(e.target.value)} />,
}));
const runnerMock = { runOnce: vi.fn(), runTests: vi.fn(), reset: vi.fn() };
vi.mock('../runner/useRunner.js', () => ({ useRunner: () => [runnerMock, 'ready'] }));

// ---- every text used in the code has an English version, and the dictionary has nothing left over
function sourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!['test', 'locales', 'admin'].includes(name)) sourceFiles(p, out);
    } else if (/\.(js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}
function usedTexts() {
  const used = new Set();
  for (const f of sourceFiles(join(__dirname, '..'))) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) used.add(m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n'));
    for (const m of s.matchAll(/translate\(getLang\(\), '((?:[^'\\]|\\.)*)'/g)) used.add(m[1].replace(/\\'/g, "'"));
  }
  return used;
}

describe('the dictionary', () => {
  it('has an English text for everything the interface says', () => {
    const missing = [...usedTexts()].filter((k) => !(k in EN));
    expect(missing).toEqual([]);
  });
  it('has no entry that the code no longer uses', () => {
    const used = usedTexts();
    expect(Object.keys(EN).filter((k) => !used.has(k))).toEqual([]);
  });
  it('keeps every {placeholder} of the Indonesian text in the English text', () => {
    const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [k, v] of Object.entries(EN)) {
      if (typeof v === 'function') continue;
      expect([k, vars(v)]).toEqual([k, vars(k)]);
    }
  });
  it('fills placeholders and picks the singular or the plural', () => {
    expect(translate('id', 'Halo, {name}', { name: 'Budi' })).toBe('Halo, Budi');
    expect(translate('en', 'Halo, {name}', { name: 'Budi' })).toBe('Hello, Budi');
    expect(translate('en', '{n} latihan', { n: 1 })).toBe('1 exercise');
    expect(translate('en', '{n} latihan', { n: 3 })).toBe('3 exercises');
    expect(translate('id', '{n} latihan', { n: 3 })).toBe('3 latihan');
    expect(translate('en', 'teks yang belum diterjemahkan')).toBe('teks yang belum diterjemahkan');
  });
});

describe('choosing the language', () => {
  it('uses the saved choice first', () => {
    localStorage.setItem('lab-lang', 'en');
    expect(detectLang()).toBe('en');
  });
  it.each([['id-ID', 'id'], ['id', 'id'], ['en-US', 'en'], ['de-DE', 'en'], ['ms-MY', 'en']])('browser language %s gives %s', (nav, want) => {
    localStorage.removeItem('lab-lang');
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(nav);
    expect(detectLang()).toBe(want);
  });
});

// ---- the interface
const calls = [];
function mockApi(table) {
  calls.length = 0;
  global.fetch = vi.fn(async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    calls.push({ url, method, headers: opts.headers || {}, body: opts.body ? JSON.parse(opts.body) : undefined });
    const handler = table[`${method} ${url}`] ?? table[`${method} ${url.split('?')[0]}`];
    if (!handler) return { ok: false, status: 404, json: async () => ({ error: `no mock for ${method} ${url}` }) };
    const res = typeof handler === 'function' ? handler(opts) : handler;
    const status = res.status || 200;
    return { ok: status < 400, status, json: async () => res.body };
  });
}
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LangProvider><AuthProvider><App /></AuthProvider></LangProvider>
    </MemoryRouter>
  );
}
const session = (user = null) => ({ 'GET /api/session': { body: { user, csrf: 'tok', verification: false } } });
const CID = { slug: 'python-dasar', title: 'Python Dasar untuk Warung Kopi', language: 'python', locale: 'id', level: 'Pemula', kind: 'course', price_idr: 0, summary: 'Belajar dari nol.', lesson_count: 8, exercise_count: 25, progress: null, access: true };
const CEN = { slug: 'python-basics', title: 'Python Basics for a Coffee Shop', language: 'python', locale: 'en', level: 'Beginner', kind: 'course', price_idr: 0, summary: 'Learn from scratch.', lesson_count: 8, exercise_count: 25, progress: null, access: true };
const PLANS_EN = [{ id: 'free', name: 'Free', price: 'Rp0', tagline: 'To learn.', perks: ['Every free course'], highlight: false }];
const PLANS_ID = [{ id: 'gratis', name: 'Gratis', price: 'Rp0', tagline: 'Untuk belajar.', perks: ['Semua kursus gratis'], highlight: false }];
const homeApi = () => mockApi({
  ...session(),
  'GET /api/courses?lang=en': { body: { courses: [CEN] } },
  'GET /api/courses?lang=id': { body: { courses: [CID] } },
  'GET /api/courses?lang=all': { body: { courses: [CID, CEN] } },
  'GET /api/plans': (opts) => ({ body: { plans: (opts.headers || {})['X-Lang'] === 'en' ? PLANS_EN : PLANS_ID } }),
});

beforeEach(() => { runnerMock.runTests.mockReset(); });

describe('the interface in English', () => {
  it('renders the catalog in English with the English courses', async () => {
    localStorage.setItem('lab-lang', 'en');
    homeApi();
    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Learn to code with work that really exists' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: CEN.title })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: CID.title })).toBeNull();
    expect(screen.getByText(/8 lessons/)).toBeInTheDocument();
    expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Free and paid' })).toBeInTheDocument();
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('sends the language with every request', async () => {
    localStorage.setItem('lab-lang', 'en');
    homeApi();
    renderAt('/');
    await screen.findByRole('link', { name: CEN.title });
    expect(calls.length).toBeGreaterThan(2);
    for (const c of calls) expect(c.headers['X-Lang']).toBe('en');
    expect(calls.some((c) => c.url === '/api/courses?lang=en')).toBe(true);
  });

  it('switches language with the ID / EN buttons, and remembers it', async () => {
    const user = userEvent.setup();
    homeApi();
    renderAt('/');
    expect(await screen.findByRole('link', { name: CID.title })).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Bahasa tampilan' });
    expect(within(group).getByRole('button', { name: 'ID' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(group).getByRole('button', { name: 'EN' }));
    expect(await screen.findByRole('link', { name: CEN.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Learn to code with work that really exists' })).toBeInTheDocument();
    expect(localStorage.getItem('lab-lang')).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(await screen.findByText('Every free course')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ID' }));
    expect(await screen.findByRole('link', { name: CID.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Belajar coding dengan pekerjaan yang benar-benar ada' })).toBeInTheDocument();
    expect(localStorage.getItem('lab-lang')).toBe('id');
  });

  it('can also list the courses written in the other language', async () => {
    const user = userEvent.setup();
    localStorage.setItem('lab-lang', 'en');
    homeApi();
    renderAt('/');
    await screen.findByRole('link', { name: CEN.title });
    await user.click(screen.getByRole('button', { name: 'Also show courses in other languages' }));
    expect(await screen.findByRole('link', { name: CID.title })).toBeInTheDocument();
    expect(screen.getByText('Bahasa Indonesia')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show only courses in your chosen language' }));
    await screen.findByRole('button', { name: 'Also show courses in other languages' });
    expect(screen.queryByRole('link', { name: CID.title })).toBeNull();
  });

  it('shows messages from the server as they come', async () => {
    const user = userEvent.setup();
    localStorage.setItem('lab-lang', 'en');
    mockApi({ ...session(), 'POST /api/login': { status: 401, body: { error: 'The email or password does not match.' } } });
    renderAt('/masuk');
    await user.type(await screen.findByLabelText('Email'), 'x@y.co');
    await user.type(screen.getByLabelText(/Password/), 'wrong wrong wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password does not match.');
    expect(calls.find((c) => c.url === '/api/login').headers['X-Lang']).toBe('en');
  });

  it('renders the lesson page, the tests and the quiz in English', async () => {
    const user = userEvent.setup();
    localStorage.setItem('lab-lang', 'en');
    runnerMock.runTests.mockResolvedValue({ results: [{ index: 0, ok: false, input: '', expected: 'Hello', actual: 'Hi\n', diff: { line: 1, expectedLine: 'Hello', actualLine: 'Hi' } }], passed: 0, total: 1 });
    mockApi({
      ...session({ id: 7, name: 'Siti', email: 's@x.co', role: 'student', verified: true }),
      'GET /api/courses/python-basics/lessons/hello': { body: {
        course: { slug: 'python-basics', title: CEN.title, language: 'python' },
        lesson: { id: 1, slug: 'hello', title: 'Hello, Coffee Shop!', position: 1, total: 8, html: '<p>Welcome.</p>', done: false },
        exercises: [
          { id: 5, slug: 'greet', type: 'code', title: 'Greet', prompt_html: '<p>Say hello.</p>', required: true, passed: false, attempts: 0, code: { language: 'python', starter: '', hints: ['Use print.'], tests: [{ input: '', output: 'Hello' }], saved: null } },
          { id: 6, slug: 'quiz', type: 'choice', title: 'Quiz', prompt_html: '<p>Pick.</p>', required: true, passed: false, attempts: 0, choice: { options_html: ['A', 'B'], multiple: false } },
        ],
        prev: null, next: null, trail: [{ slug: 'hello', title: 'Hello', done: false }], signed_in: true } },
    });
    renderAt('/kursus/python-basics/hello');
    expect(await screen.findByText(/lesson 1 of 8/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeInTheDocument();
    expect(screen.getByText('Python ready')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(await screen.findByText('0 of 1 tests passed.')).toBeInTheDocument();
    expect(screen.getByText('Differs on line 1')).toBeInTheDocument();
    expect(screen.getByText('Your program printed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Multiple choice/ }));
    expect(screen.getByText('Choose one answer.')).toBeInTheDocument();
  });

  it('shows the certificate verification page in English with an English date', async () => {
    localStorage.setItem('lab-lang', 'en');
    const cert = { id: 'LAB-7K2M-X9QP-4RTD', name: 'Siti Aminah', issued_at: '2026-11-13T05:00:00Z', revoked: false, lessons: 8, exercises: 25,
      course: { slug: 'python-basics', title: CEN.title, language: 'python', level: 'Beginner', locale: 'en' }, verify_url: 'x', pdf_url: '/api/certificates/LAB-7K2M-X9QP-4RTD/pdf' };
    mockApi({ ...session(), [`GET /api/certificates/${cert.id}`]: { body: { certificate: cert } } });
    renderAt(`/verifikasi/${cert.id}`);
    expect(await screen.findByRole('heading', { name: 'This certificate is genuine' })).toBeInTheDocument();
    expect(screen.getByText('8 lessons, 25 exercises, Python, Beginner')).toBeInTheDocument();
    expect(screen.getByText('13 November 2026 by tolie.space Lab')).toBeInTheDocument();
    expect(screen.getByText(/not an official accreditation/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View certificate PDF' })).toBeInTheDocument();
  });

  it('keeps Indonesian dates for the Indonesian interface', async () => {
    const cert = { id: 'LAB-7K2M-X9QP-4RTD', name: 'Siti Aminah', issued_at: '2026-11-13T05:00:00Z', revoked: false, lessons: 8, exercises: 25,
      course: { slug: 'python-dasar', title: CID.title, language: 'python', level: 'Pemula', locale: 'id' }, verify_url: 'x', pdf_url: '/p' };
    mockApi({ ...session(), [`GET /api/certificates/${cert.id}`]: { body: { certificate: cert } } });
    renderAt(`/verifikasi/${cert.id}`);
    expect(await screen.findByText('13 November 2026 oleh tolie.space Lab')).toBeInTheDocument();
    expect(screen.getByText('8 pelajaran, 25 latihan, Python, Pemula')).toBeInTheDocument();
  });
});
