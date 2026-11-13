import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AuthProvider } from '../auth.jsx';
import { LangProvider } from '../lang.jsx';

// The editor and the Python worker need a real browser; the tests replace them.
vi.mock('../components/CodeEditor.jsx', () => ({
  default: ({ value, onChange }) => <textarea data-testid="editor" value={value} onChange={(e) => onChange(e.target.value)} />,
}));
const runnerMock = { runOnce: vi.fn(), runTests: vi.fn(), reset: vi.fn() };
vi.mock('../runner/usePythonRunner.js', () => ({ usePythonRunner: () => [runnerMock, 'ready'] }));

const USER = { id: 7, name: 'Budi', email: 'budi@example.test', role: 'student', verified: true };

const COURSE = { slug: 'python-dasar', title: 'Python Dasar untuk Warung Kopi', language: 'python', level: 'Pemula', kind: 'course', price_idr: 0, summary: 'Belajar dari nol.' };

function lessonPayload(over = {}) {
  return {
    course: { slug: 'python-dasar', title: COURSE.title, language: 'python' },
    lesson: { id: 11, slug: 'halo-warung', title: 'Halo, Warung!', position: 1, total: 3, html: '<h2>Menampilkan teks</h2><p>Gunakan <code>print</code>.</p>', done: false },
    exercises: [
      { id: 21, slug: 'sapa', type: 'code', title: 'Sapa pelanggan', prompt_html: '<p>Cetak sapaan.</p>', required: true, passed: false, attempts: 0,
        code: { language: 'python', starter: '# tulis di sini', hint: 'Pakai print.', tests: [{ input: '', output: 'Halo' }], saved: null } },
      { id: 22, slug: 'kuis', type: 'choice', title: 'Apa yang tampil?', prompt_html: '<p>Pilih satu.</p>', required: true, passed: false, attempts: 0,
        choice: { options_html: ['Satu baris', '<code>Halo</code> di baris sendiri', 'Error'], multiple: false } },
    ],
    prev: null,
    next: { slug: 'harga-dan-angka', title: 'Harga dan angka' },
    trail: [{ slug: 'halo-warung', title: 'Halo, Warung!', done: false }, { slug: 'harga-dan-angka', title: 'Harga dan angka', done: false }, { slug: 'struk', title: 'Struk', done: false }],
    signed_in: true,
    ...over,
  };
}

let routes;
const calls = [];
function mockApi(table) {
  routes = table;
  calls.length = 0;
  global.fetch = vi.fn(async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    calls.push({ url, method, body: opts.body ? JSON.parse(opts.body) : undefined, headers: opts.headers });
    const key = `${method} ${url}`;
    const handler = routes[key] ?? routes[`${method} ${url.split('?')[0]}`];
    if (!handler) return { ok: false, status: 404, json: async () => ({ error: `no mock for ${key}` }) };
    const res = typeof handler === 'function' ? handler(opts) : handler;
    const status = res.status || 200;
    return { ok: status < 400, status, json: async () => res.body };
  });
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LangProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LangProvider>
    </MemoryRouter>
  );
}

const signedIn = { 'GET /api/session': { body: { user: USER, csrf: 'tok', verification: false } } };
const signedOut = { 'GET /api/session': { body: { user: null, csrf: 'tok', verification: false } } };

beforeEach(() => {
  runnerMock.runOnce.mockReset();
  runnerMock.runTests.mockReset();
});

describe('catalog', () => {
  it('lists courses with their size and price', async () => {
    mockApi({ ...signedOut, 'GET /api/courses': { body: { courses: [{ ...COURSE, lesson_count: 8, exercise_count: 25, progress: null, access: true }] } } });
    renderAt('/');
    expect(await screen.findByRole('link', { name: COURSE.title })).toHaveAttribute('href', '/kursus/python-dasar');
    expect(screen.getByText(/8 pelajaran/)).toBeInTheDocument();
    expect(screen.getByText('Gratis')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Masuk' })).toBeInTheDocument();
  });

  it('shows progress and a Continue button for a learner who started', async () => {
    mockApi({ ...signedIn, 'GET /api/courses': { body: { courses: [{ ...COURSE, lesson_count: 8, exercise_count: 25, progress: { done: 3, total: 8, percent: 38, next: 'diskon' }, access: true }] } } });
    renderAt('/');
    expect(await screen.findByRole('link', { name: 'Lanjutkan' })).toBeInTheDocument();
    expect(screen.getByText('3 dari 8 pelajaran selesai')).toBeInTheDocument();
    expect(screen.getByText('Budi')).toBeInTheDocument();
  });
});

describe('course page', () => {
  const lessons = [
    { slug: 'halo-warung', title: 'Halo, Warung!', position: 1, exercise_count: 3, done: true, locked: false },
    { slug: 'harga-dan-angka', title: 'Harga dan angka', position: 2, exercise_count: 4, done: false, locked: false },
  ];
  it('shows lit lanterns and continues from the next lesson', async () => {
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar': { body: { course: COURSE, access: true, progress: { done: 1, total: 2, percent: 50, next: 'harga-dan-angka' }, lessons } } });
    renderAt('/kursus/python-dasar');
    expect(await screen.findByRole('link', { name: 'Lanjutkan belajar' })).toHaveAttribute('href', '/kursus/python-dasar/harga-dan-angka');
    expect(screen.getByText(/selesai/, { selector: '.meta' })).toBeInTheDocument();
    expect(document.querySelectorAll('.lamp.on')).toHaveLength(1);
  });

  it('fetches the course once, after the sign-in state is known (no flicker)', async () => {
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar': { body: { course: COURSE, access: true, progress: { done: 0, total: 2, percent: 0, next: 'halo-warung' }, lessons } } });
    renderAt('/kursus/python-dasar');
    await screen.findByRole('link', { name: 'Mulai belajar' });
    await new Promise((r) => setTimeout(r, 50));
    expect(calls.filter((c) => c.url === '/api/courses/python-dasar')).toHaveLength(1);
    expect(calls[0].url).toBe('/api/session');
  });

  it('locks the lessons of a paid module', async () => {
    mockApi({ ...signedIn, 'GET /api/courses/modul': { body: { course: { ...COURSE, slug: 'modul', price_idr: 100000 }, access: false, progress: { done: 0, total: 2, percent: 0, next: 'halo-warung' }, lessons: lessons.map((l) => ({ ...l, done: false, locked: true })) } } });
    renderAt('/kursus/modul');
    expect(await screen.findByText(/Modul berbayar/)).toBeInTheDocument();
    expect(screen.getAllByText('Terkunci')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /Halo, Warung/ })).toBeNull();
  });

  it('shows a not-found page for an unknown course', async () => {
    mockApi({ ...signedIn, 'GET /api/courses/nope': { status: 404, body: { error: 'Tidak ditemukan.' } } });
    renderAt('/kursus/nope');
    expect(await screen.findByText('Halaman ini tidak ada')).toBeInTheDocument();
  });
});

describe('sign in and sign up', () => {
  it('registers and lands on the learner page', async () => {
    const user = userEvent.setup();
    mockApi({
      ...signedOut,
      'POST /api/register': { status: 201, body: { user: USER, csrf: 'tok2' } },
      'GET /api/me/courses': { body: { courses: [], user: USER } },
    });
    renderAt('/masuk?daftar=1');
    await user.type(await screen.findByLabelText('Nama'), 'Budi');
    await user.type(screen.getByLabelText('Email'), 'budi@example.test');
    await user.type(screen.getByLabelText(/Password/), 'a long password');
    await user.click(screen.getByRole('button', { name: 'Daftar' }));
    expect(await screen.findByText('Halo, Budi')).toBeInTheDocument();
    const post = calls.find((c) => c.url === '/api/register');
    expect(post.body).toEqual({ name: 'Budi', email: 'budi@example.test', password: 'a long password' });
    expect(post.headers['X-CSRF-Token']).toBe('tok');
  });

  it('shows the server message when login fails', async () => {
    const user = userEvent.setup();
    mockApi({ ...signedOut, 'POST /api/login': { status: 401, body: { error: 'Email atau password tidak cocok.' } } });
    renderAt('/masuk');
    await user.type(await screen.findByLabelText('Email'), 'x@y.co');
    await user.type(screen.getByLabelText(/Password/), 'wrong wrong wrong');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau password tidak cocok.');
  });

  it('does not follow an outside address in ?next', async () => {
    const user = userEvent.setup();
    mockApi({ ...signedOut, 'POST /api/login': { body: { user: USER, csrf: 't' } }, 'GET /api/me/courses': { body: { courses: [], user: USER } } });
    renderAt('/masuk?next=//evil.example');
    await user.type(await screen.findByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText(/Password/), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('Halo, Budi')).toBeInTheDocument();
  });
});

describe('lesson: code exercise', () => {
  it('runs the tests, reports the result and lights the lantern when it passes', async () => {
    const user = userEvent.setup();
    runnerMock.runTests.mockResolvedValue({ results: [{ index: 0, ok: true, input: '', expected: 'Halo', actual: 'Halo\n' }], passed: 1, total: 1 });
    mockApi({
      ...signedIn,
      'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload() },
      'POST /api/exercises/21/result': { body: { recorded: true, passed: true, lesson_done: false, course_done: false, progress: { done: 0, total: 3 } } },
    });
    renderAt('/kursus/python-dasar/halo-warung');
    expect(await screen.findByRole('heading', { name: 'Halo, Warung!' })).toBeInTheDocument();
    expect(screen.getByText('Menampilkan teks')).toBeInTheDocument();
    expect(screen.getByTestId('editor')).toHaveValue('# tulis di sini');
    await user.clear(screen.getByTestId('editor'));
    await user.type(screen.getByTestId('editor'), 'print("Halo")');
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('Semua 1 tes lulus.')).toBeInTheDocument();
    await waitFor(() => expect(calls.find((c) => c.url === '/api/exercises/21/result')).toBeTruthy());
    const sent = calls.find((c) => c.url === '/api/exercises/21/result').body;
    expect(sent).toEqual({ code: 'print("Halo")', passed: 1, total: 1 });
    expect(await screen.findByText('Sudah selesai.')).toBeInTheDocument();
  });

  it('shows what differed when a test fails and does not mark it done', async () => {
    const user = userEvent.setup();
    runnerMock.runTests.mockResolvedValue({
      results: [{ index: 0, ok: false, input: '', expected: 'Halo', actual: 'Hai\n', error: '', diff: { line: 1, expectedLine: 'Halo', actualLine: 'Hai' } }],
      passed: 0, total: 1,
    });
    mockApi({
      ...signedIn,
      'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload() },
      'POST /api/exercises/21/result': { body: { recorded: true, passed: false } },
    });
    renderAt('/kursus/python-dasar/halo-warung');
    await user.click(await screen.findByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('0 dari 1 tes lulus.')).toBeInTheDocument();
    expect(screen.getByText('Beda di baris 1')).toBeInTheDocument();
    expect(screen.queryByText('Sudah selesai.')).toBeNull();
    expect(screen.queryByText(/Pelajaran selesai/)).toBeNull();
  });

  it('shows the error message of a crashing program', async () => {
    const user = userEvent.setup();
    runnerMock.runTests.mockResolvedValue({
      results: [{ index: 0, ok: false, input: '', expected: 'Halo', actual: '', error: 'Traceback (most recent call last):\n  File "main.py", line 1\nNameError: x' }],
      passed: 0, total: 1,
    });
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload() }, 'POST /api/exercises/21/result': { body: { recorded: true, passed: false } } });
    renderAt('/kursus/python-dasar/halo-warung');
    await user.click(await screen.findByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText(/NameError: x/)).toBeInTheDocument();
    expect(screen.getByText('(tidak mencetak apa pun)')).toBeInTheDocument();
  });

  it('runs the code with the learner\'s own input on Coba', async () => {
    const user = userEvent.setup();
    runnerMock.runOnce.mockResolvedValue({ stdout: '30000\n', stderr: '', error: '', exitCode: 0, truncated: false });
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload() } });
    renderAt('/kursus/python-dasar/halo-warung');
    await user.click(await screen.findByText('Input untuk tombol Coba (opsional)'));
    await user.type(screen.getByLabelText(/Input untuk programmu/), '15000{Enter}2');
    await user.click(screen.getByRole('button', { name: 'Coba' }));
    expect(await screen.findByText('30000')).toBeInTheDocument();
    expect(runnerMock.runOnce).toHaveBeenCalledWith('# tulis di sini', '15000\n2');
  });

  it('restores the code the learner saved last time', async () => {
    const p = lessonPayload();
    p.exercises[0].code.saved = 'print("draf")';
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: p } });
    renderAt('/kursus/python-dasar/halo-warung');
    expect(await screen.findByTestId('editor')).toHaveValue('print("draf")');
  });

  it('works without an account but says progress is not saved', async () => {
    const user = userEvent.setup();
    runnerMock.runTests.mockResolvedValue({ results: [{ index: 0, ok: true, input: '', expected: 'Halo', actual: 'Halo' }], passed: 1, total: 1 });
    mockApi({ ...signedOut, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload({ signed_in: false }) } });
    renderAt('/kursus/python-dasar/halo-warung');
    expect(await screen.findByText(/kemajuan tidak tersimpan/, { selector: '.flash' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('Semua 1 tes lulus.')).toBeInTheDocument();
    expect(calls.some((c) => c.url.includes('/result'))).toBe(false);
  });
});

describe('lesson: multiple choice', () => {
  async function openQuiz(user, table = {}) {
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload() }, ...table });
    renderAt('/kursus/python-dasar/halo-warung');
    await user.click(await screen.findByRole('button', { name: /Pilihan ganda/ }));
  }

  it('grades on the server and shows the explanation when right', async () => {
    const user = userEvent.setup();
    await openQuiz(user, {
      'POST /api/exercises/22/answer': { body: { correct: true, attempts: 1, explanation_html: '<p>Setiap print menulis satu baris.</p>', correct_options: [1], lesson_done: false, course_done: false } },
    });
    expect(screen.getByRole('button', { name: 'Periksa jawaban' })).toBeDisabled();
    await user.click(screen.getByLabelText(/Halo di baris sendiri/));
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('Benar.')).toBeInTheDocument();
    expect(screen.getByText('Setiap print menulis satu baris.')).toBeInTheDocument();
    expect(calls.find((c) => c.url === '/api/exercises/22/answer').body).toEqual({ choice: [1] });
    expect(screen.getByRole('radio', { name: /Halo di baris sendiri/ }).closest('label')).toHaveClass('right');
  });

  it('shows the hint on a wrong answer and lets the learner try again', async () => {
    const user = userEvent.setup();
    let n = 0;
    await openQuiz(user, {
      'POST /api/exercises/22/answer': () => (++n === 1
        ? { body: { correct: false, attempts: 1, hint: 'Ingat, tiap print satu baris.' } }
        : { body: { correct: true, attempts: 2, explanation_html: '<p>Betul.</p>', correct_options: [1] } }),
    });
    await user.click(screen.getByLabelText('Error'));
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText(/Belum tepat\. Ingat, tiap print satu baris\./)).toBeInTheDocument();
    expect(screen.queryByText('Betul.')).toBeNull();
    await user.click(screen.getByLabelText(/Halo di baris sendiri/));
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('Benar.')).toBeInTheDocument();
  });

  it('marks the right option after the answer is revealed', async () => {
    const user = userEvent.setup();
    await openQuiz(user, {
      'POST /api/exercises/22/answer': { body: { correct: false, attempts: 3, explanation_html: '<p>Penjelasan.</p>', correct_options: [1] } },
    });
    await user.click(screen.getByLabelText('Error'));
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText(/Jawaban yang benar sudah ditandai/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Halo di baris sendiri/ }).closest('label')).toHaveClass('right');
    expect(screen.getByRole('radio', { name: 'Error' }).closest('label')).toHaveClass('wrong');
  });

  it('asks signed-out learners to sign in instead of grading', async () => {
    const user = userEvent.setup();
    mockApi({ ...signedOut, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload({ signed_in: false }) } });
    renderAt('/kursus/python-dasar/halo-warung');
    await user.click(await screen.findByRole('button', { name: /Pilihan ganda/ }));
    expect(screen.getByText(/perlu/, { selector: '.flash' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Periksa jawaban' })).toBeNull();
  });

  it('uses checkboxes for multiple-select questions', async () => {
    const user = userEvent.setup();
    const p = lessonPayload();
    p.exercises[1].choice = { options_html: ['<code>42</code>', 'teks', '<code>int("42")</code>'], multiple: true };
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: p }, 'POST /api/exercises/22/answer': { body: { correct: true, attempts: 1, explanation_html: '<p>Ya.</p>', correct_options: [0, 2] } } });
    renderAt('/kursus/python-dasar/halo-warung');
    await user.click(await screen.findByRole('button', { name: /Pilihan ganda/ }));
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(3);
    await user.click(boxes[2]);
    await user.click(boxes[0]);
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    await screen.findByText('Benar.');
    expect(calls.find((c) => c.url === '/api/exercises/22/answer').body).toEqual({ choice: [2, 0] });
  });

  it('finishing the last exercise completes the lesson and offers the next one', async () => {
    const user = userEvent.setup();
    const p = lessonPayload();
    p.exercises = [p.exercises[1]];
    await (async () => {
      mockApi({
        ...signedIn,
        'GET /api/courses/python-dasar/lessons/halo-warung': { body: p },
        'POST /api/exercises/22/answer': { body: { correct: true, attempts: 1, explanation_html: '<p>Ya.</p>', correct_options: [1], lesson_done: true, course_done: false } },
      });
      renderAt('/kursus/python-dasar/halo-warung');
    })();
    await user.click(await screen.findByLabelText(/Halo di baris sendiri/));
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    const banner = await screen.findByRole('status');
    expect(within(banner).getByText('Pelajaran selesai.')).toBeInTheDocument();
    expect(within(banner).getByRole('link', { name: /Pelajaran berikutnya: Harga dan angka/ })).toHaveAttribute('href', '/kursus/python-dasar/harga-dan-angka');
    expect(document.querySelectorAll('.lamp.on')).toHaveLength(1);
  });
});

describe('lesson: other states', () => {
  it('lets the learner mark a reading-only lesson as done', async () => {
    const user = userEvent.setup();
    mockApi({
      ...signedIn,
      'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload({ exercises: [] }) },
      'POST /api/lessons/11/complete': { body: { lesson_done: true, course_done: false, progress: { done: 1, total: 3 } } },
    });
    renderAt('/kursus/python-dasar/halo-warung');
    await user.click(await screen.findByRole('button', { name: 'Tandai selesai' }));
    expect(await screen.findByText('Pelajaran selesai.')).toBeInTheDocument();
  });

  it('explains that a paid module is locked', async () => {
    mockApi({ ...signedIn, 'GET /api/courses/modul/lessons/x': { status: 403, body: { error: 'Modul ini berbayar. Buka aksesnya untuk melihat pelajaran.', locked: true } } });
    renderAt('/kursus/modul/x');
    expect(await screen.findByRole('heading', { name: 'Modul berbayar' })).toBeInTheDocument();
    expect(screen.queryByTestId('editor')).toBeNull();
  });

  it('opens on the first exercise that is not done yet', async () => {
    const p = lessonPayload();
    p.exercises[0].passed = true;
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: p } });
    renderAt('/kursus/python-dasar/halo-warung');
    expect(await screen.findByText('Apa yang tampil?', { selector: 'h2' })).toBeInTheDocument();
  });

  it('shows the lantern trail with the current lesson marked', async () => {
    mockApi({ ...signedIn, 'GET /api/courses/python-dasar/lessons/halo-warung': { body: lessonPayload() } });
    renderAt('/kursus/python-dasar/halo-warung');
    await screen.findByRole('heading', { name: 'Halo, Warung!' });
    expect(document.querySelectorAll('.lamps .lamp')).toHaveLength(3);
    expect(document.querySelectorAll('.lamp.current')).toHaveLength(1);
  });
});
