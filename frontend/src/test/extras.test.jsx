import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AuthProvider } from '../auth.jsx';
import { LangProvider } from '../lang.jsx';

// Password reset, buying a module, staged hints, SQL exercises, the learning streak and the admin numbers.
vi.mock('../components/CodeEditor.jsx', () => ({
  default: ({ value, onChange, language }) => <textarea data-testid="editor" data-language={language} value={value} onChange={(e) => onChange(e.target.value)} />,
}));
const runnerMock = { runOnce: vi.fn(), runTests: vi.fn(), reset: vi.fn() };
const useRunnerMock = vi.fn(() => [runnerMock, 'ready']);
vi.mock('../runner/useRunner.js', () => ({ useRunner: (...args) => useRunnerMock(...args) }));

const USER = { id: 7, name: 'Budi', email: 'budi@example.test', role: 'student', verified: true };
const ADMIN = { id: 1, name: 'Chris', email: 'c@example.test', role: 'admin', verified: true };
const MODULE = { slug: 'modul-laporan', title: 'Modul Laporan', language: 'python', locale: 'id', level: 'Menengah', kind: 'module', price_idr: 100000, summary: 'Kasus nyata.', perks: [], certificate: true };
const LOCKED = [{ slug: 'a', title: 'A', position: 1, exercise_count: 1, done: false, locked: true }];

const calls = [];
function mockApi(table) {
  calls.length = 0;
  global.fetch = vi.fn(async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    calls.push({ url, method, body: opts.body ? JSON.parse(opts.body) : undefined });
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
const as = (user, extra = {}) => ({ 'GET /api/session': { body: { user, csrf: 'tok', verification: false, payments: false, ...extra } } });

beforeEach(() => {
  runnerMock.runOnce.mockReset();
  runnerMock.runTests.mockReset();
  useRunnerMock.mockClear();
});

describe('forgotten password', () => {
  it('links from the sign-in page and sends the email address', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(null), 'POST /api/password/forgot': { body: { ok: true } } });
    renderAt('/masuk');
    await user.click(await screen.findByRole('link', { name: 'Lupa password?' }));
    await user.type(await screen.findByLabelText('Email'), 'budi@example.test');
    await user.click(screen.getByRole('button', { name: 'Kirim tautan' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Kalau email itu terdaftar');
    expect(calls.find((c) => c.url === '/api/password/forgot').body).toEqual({ email: 'budi@example.test' });
  });

  it('shows the server message when the request is refused', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(null), 'POST /api/password/forgot': { status: 429, body: { error: 'Terlalu banyak permintaan.' } } });
    renderAt('/lupa-password');
    await user.type(await screen.findByLabelText('Email'), 'budi@example.test');
    await user.click(screen.getByRole('button', { name: 'Kirim tautan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Terlalu banyak permintaan.');
  });

  it('refuses two different passwords without asking the server', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(null) });
    renderAt('/reset?token=abc');
    await user.type(await screen.findByLabelText(/^Password baru/), 'a brand new password');
    await user.type(screen.getByLabelText('Ulangi password baru'), 'a different password');
    await user.click(screen.getByRole('button', { name: 'Simpan password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Kedua password tidak sama.');
    expect(calls.some((c) => c.url === '/api/password/reset')).toBe(false);
  });

  it('sets the new password with the token and signs the learner in', async () => {
    const user = userEvent.setup();
    mockApi({
      ...as(null),
      'POST /api/password/reset': { body: { user: USER, csrf: 'tok2' } },
      'GET /api/me/courses': { body: { courses: [], user: USER } },
      'GET /api/me/certificates': { body: { certificates: [] } },
    });
    renderAt('/reset?token=abc123');
    await user.type(await screen.findByLabelText(/^Password baru/), 'a brand new password');
    await user.type(screen.getByLabelText('Ulangi password baru'), 'a brand new password');
    await user.click(screen.getByRole('button', { name: 'Simpan password' }));
    expect(await screen.findByText('Halo, Budi')).toBeInTheDocument();
    expect(calls.find((c) => c.url === '/api/password/reset').body).toEqual({ token: 'abc123', password: 'a brand new password' });
  });

  it('shows an expired link as an error', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(null), 'POST /api/password/reset': { status: 400, body: { error: 'Tautan atur ulang password tidak berlaku lagi. Minta tautan baru.' } } });
    renderAt('/reset?token=old');
    await user.type(await screen.findByLabelText(/^Password baru/), 'a brand new password');
    await user.type(screen.getByLabelText('Ulangi password baru'), 'a brand new password');
    await user.click(screen.getByRole('button', { name: 'Simpan password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('tidak berlaku lagi');
    expect(screen.getByRole('link', { name: 'Minta tautan baru' })).toHaveAttribute('href', '/lupa-password');
  });
});

describe('buying a paid module', () => {
  const page = (access) => ({ 'GET /api/courses/modul-laporan': { body: { course: MODULE, access, progress: null, lessons: access ? [{ ...LOCKED[0], locked: false }] : LOCKED } } });

  it('says purchases open soon while payments are off', async () => {
    mockApi({ ...as(USER), ...page(false) });
    renderAt('/kursus/modul-laporan');
    expect(await screen.findByText('Modul berbayar. Pembelian akan dibuka segera.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Beli modul ini/ })).toBeNull();
  });

  it('asks a visitor to sign in first, and brings them back', async () => {
    mockApi({ ...as(null, { payments: true }), ...page(false) });
    renderAt('/kursus/modul-laporan');
    expect(await screen.findByRole('link', { name: 'Masuk untuk membeli' })).toHaveAttribute('href', '/masuk?next=%2Fkursus%2Fmodul-laporan');
  });

  it('sends the learner to the payment page', async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    mockApi({ ...as(USER, { payments: true }), ...page(false), 'POST /api/courses/modul-laporan/checkout': { body: { url: 'https://checkout.stripe.com/c/pay/cs_test_1' } } });
    renderAt('/kursus/modul-laporan');
    await user.click(await screen.findByRole('button', { name: 'Beli modul ini · Rp100.000' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_1'));
    vi.unstubAllGlobals();
  });

  it('shows why a payment could not start', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(USER, { payments: true }), ...page(false), 'POST /api/courses/modul-laporan/checkout': { status: 502, body: { error: 'Pembayaran belum bisa dimulai.' } } });
    renderAt('/kursus/modul-laporan');
    await user.click(await screen.findByRole('button', { name: /Beli modul ini/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Pembayaran belum bisa dimulai.');
    expect(screen.getByRole('button', { name: /Beli modul ini/ })).toBeEnabled();
  });

  it('waits for the confirmation after coming back from the payment page', async () => {
    mockApi({ ...as(USER, { payments: true }), ...page(false) });
    renderAt('/kursus/modul-laporan?paid=1');
    expect(await screen.findByRole('status')).toHaveTextContent('sedang dikonfirmasi');
    expect(screen.queryByRole('button', { name: /Beli modul ini/ })).toBeNull();
  });

  it('opens the module once the payment is confirmed', async () => {
    mockApi({ ...as(USER, { payments: true }), ...page(true), 'GET /api/courses/modul-laporan/certificate': { body: { enabled: true, eligible: false, needs_verification: false, certificate: null, default_name: 'Budi' } } });
    renderAt('/kursus/modul-laporan?paid=1');
    expect(await screen.findByText('Pembayaran diterima. Modul ini sudah terbuka untukmu.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1. A' })).toBeInTheDocument();
  });
});

function lessonWith(code, course = { slug: 'python-dasar', title: 'Python Dasar', language: 'python' }) {
  return {
    course,
    lesson: { id: 11, slug: 'l', title: 'Pelajaran', position: 1, total: 1, html: '<p>Materi.</p>', done: false },
    exercises: [{ id: 21, slug: 'x', type: 'code', title: 'Latihan', prompt_html: '<p>Kerjakan.</p>', required: true, passed: false, attempts: 0, code: { saved: null, ...code } }],
    prev: null, next: null, trail: [{ slug: 'l', title: 'Pelajaran', done: false }], signed_in: true,
  };
}

describe('hints, one at a time', () => {
  const hints = ['Mulai dari input().', 'Ubah ke angka dengan int().', 'print(int(input()) * 2)'];
  const api = (list) => mockApi({ ...as(USER), 'GET /api/courses/python-dasar/lessons/l': { body: lessonWith({ language: 'python', starter: '', hints: list, tests: [{ input: '2', output: '4' }] }) } });

  it('reveals the next hint on each click and hides them all at the end', async () => {
    const user = userEvent.setup();
    api(hints);
    renderAt('/kursus/python-dasar/l');
    await user.click(await screen.findByRole('button', { name: 'Petunjuk' }));
    expect(screen.getByText('Mulai dari input().')).toBeInTheDocument();
    expect(screen.getByText('Petunjuk 1 dari 3:')).toBeInTheDocument();
    expect(screen.queryByText('Ubah ke angka dengan int().')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Petunjuk berikutnya' }));
    expect(screen.getByText('Ubah ke angka dengan int().')).toBeInTheDocument();
    expect(screen.queryByText('print(int(input()) * 2)')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Petunjuk berikutnya' }));
    expect(screen.getAllByRole('note').filter((n) => n.classList.contains('hint-box'))).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Sembunyikan petunjuk' }));
    expect(screen.queryByText('Mulai dari input().')).toBeNull();
    expect(screen.getByRole('button', { name: 'Petunjuk' })).toBeInTheDocument();
  });

  it('shows a single hint without numbering', async () => {
    const user = userEvent.setup();
    api(['Pakai print.']);
    renderAt('/kursus/python-dasar/l');
    await user.click(await screen.findByRole('button', { name: 'Petunjuk' }));
    expect(screen.getByText('Pakai print.')).toBeInTheDocument();
    expect(screen.queryByText(/Petunjuk 1 dari/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Sembunyikan petunjuk' })).toBeInTheDocument();
  });

  it('has no hint button when there are no hints', async () => {
    api([]);
    renderAt('/kursus/python-dasar/l');
    await screen.findByRole('button', { name: 'Periksa jawaban' });
    expect(screen.queryByRole('button', { name: 'Petunjuk' })).toBeNull();
  });
});

describe('SQL exercises', () => {
  const setup = "CREATE TABLE menu (nama TEXT, harga INTEGER);\nINSERT INTO menu VALUES ('Kopi', 15000);";
  const tests = [{ input: '', output: 'nama\nKopi' }];
  const sqlLesson = lessonWith({ language: 'sql', starter: '-- tulis query', hints: [], tests, setup }, { slug: 'sql-dasar', title: 'SQL Dasar', language: 'sql' });

  it('uses the SQL runner and editor, and shows the tables instead of an input box', async () => {
    mockApi({ ...as(USER), 'GET /api/courses/sql-dasar/lessons/l': { body: sqlLesson } });
    renderAt('/kursus/sql-dasar/l');
    expect(await screen.findByText('query.sql')).toBeInTheDocument();
    expect(useRunnerMock).toHaveBeenCalledWith('sql');
    expect(screen.getByTestId('editor')).toHaveAttribute('data-language', 'sql');
    expect(screen.getByText('SQL siap')).toBeInTheDocument();
    expect(screen.getByText('Tabel yang tersedia').closest('details')).toHaveTextContent('CREATE TABLE menu');
    expect(screen.queryByText('Input untuk tombol Coba (opsional)')).toBeNull();
  });

  it('runs the tests against the tables of the exercise and reports the result', async () => {
    const user = userEvent.setup();
    runnerMock.runTests.mockResolvedValue({ results: [{ index: 0, ok: true, input: '', expected: 'nama\nKopi', actual: 'nama\nKopi\n' }], passed: 1, total: 1 });
    mockApi({
      ...as(USER),
      'GET /api/courses/sql-dasar/lessons/l': { body: sqlLesson },
      'POST /api/exercises/21/result': { body: { recorded: true, passed: true, lesson_done: true, course_done: true, progress: { done: 1, total: 1 } } },
    });
    renderAt('/kursus/sql-dasar/l');
    await user.click(await screen.findByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('Semua 1 tes lulus.')).toBeInTheDocument();
    const [code, sentTests, , extra] = runnerMock.runTests.mock.calls[0];
    expect([code, sentTests, extra]).toEqual(['-- tulis query', tests, { setup, check: '' }]);
    await waitFor(() => expect(calls.find((c) => c.url === '/api/exercises/21/result').body).toEqual({ code: '-- tulis query', passed: 1, total: 1 }));
  });

  it('runs a query with Coba and says so when it returns no rows', async () => {
    const user = userEvent.setup();
    runnerMock.runOnce.mockResolvedValue({ stdout: '', stderr: '', error: '', exitCode: 0, truncated: false });
    mockApi({ ...as(USER), 'GET /api/courses/sql-dasar/lessons/l': { body: sqlLesson } });
    renderAt('/kursus/sql-dasar/l');
    await user.click(await screen.findByRole('button', { name: 'Coba' }));
    expect(await screen.findByText('(query-mu tidak menghasilkan baris apa pun)')).toBeInTheDocument();
    expect(runnerMock.runOnce).toHaveBeenCalledWith('-- tulis query', '', { setup });
  });

  it('keeps Python lessons on the Python runner', async () => {
    mockApi({ ...as(USER), 'GET /api/courses/python-dasar/lessons/l': { body: lessonWith({ language: 'python', starter: '', hints: [], tests }) } });
    renderAt('/kursus/python-dasar/l');
    expect(await screen.findByText('main.py')).toBeInTheDocument();
    expect(useRunnerMock).toHaveBeenCalledWith('python');
    expect(screen.getByText('Python siap')).toBeInTheDocument();
    expect(screen.queryByText('Tabel yang tersedia')).toBeNull();
  });
});

describe('learning streak', () => {
  const week = (active) => active.map((a, i) => ({ date: `2026-11-${String(9 + i).padStart(2, '0')}`, active: a }));
  const mine = (streak) => mockApi({ ...as(USER), 'GET /api/me/courses': { body: { courses: [], user: USER, streak } }, 'GET /api/me/certificates': { body: { certificates: [] } } });

  it('shows the days in a row and the last seven days', async () => {
    mine({ current: 3, best: 5, today: true, week: week([false, true, false, false, true, true, true]) });
    renderAt('/belajar');
    const box = await screen.findByRole('region', { name: 'Runtun belajar' });
    expect(within(box).getByText('3 hari berturut-turut')).toBeInTheDocument();
    expect(within(box).getByText(/terpanjang 5 hari/)).toBeInTheDocument();
    expect(box.querySelectorAll('.lamp')).toHaveLength(7);
    expect(box.querySelectorAll('.lamp.on')).toHaveLength(4);
    expect(within(box).getByText('Hari ini sudah belajar. Sampai besok.')).toBeInTheDocument();
  });

  it('nudges when today has no practice yet', async () => {
    mine({ current: 2, best: 2, today: false, week: week([false, false, false, false, true, true, false]) });
    renderAt('/belajar');
    expect(await screen.findByText('Kerjakan satu latihan hari ini supaya runtunmu tidak putus.')).toBeInTheDocument();
  });

  it('invites a new start after a broken streak', async () => {
    mine({ current: 0, best: 4, today: false, week: week([true, false, false, false, false, false, false]) });
    renderAt('/belajar');
    expect(await screen.findByText('Kerjakan satu latihan hari ini untuk memulai runtun baru.')).toBeInTheDocument();
    expect(screen.getByText('0 hari berturut-turut')).toBeInTheDocument();
  });

  it('stays out of the way for someone who never practised', async () => {
    mine({ current: 0, best: 0, today: false, week: week([false, false, false, false, false, false, false]) });
    renderAt('/belajar');
    expect(await screen.findByText('Kamu belum memulai kursus apa pun.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Runtun belajar' })).toBeNull();
  });
});

describe('admin dashboard numbers', () => {
  const stats = {
    totals: { users: 42, new_users_7d: 9, active_7d: 17, submissions_7d: 230, certificates: 4, paid_orders: 2, revenue_idr: 200000 },
    days: [{ day: '2026-11-14', users: 2, active: 5 }, { day: '2026-11-15', users: 4, active: 10 }],
    lessons: [
      { course_id: 1, course_title: 'Python Dasar', id: 31, position: 1, title: 'Halo, Warung!', started: 20, finished: 18 },
      { course_id: 1, course_title: 'Python Dasar', id: 32, position: 2, title: 'Diskon', started: 10, finished: 3 },
      { course_id: 1, course_title: 'Python Dasar', id: 33, position: 3, title: 'Belum dibuka', started: 0, finished: 0 },
    ],
    hardest: [{ id: 5, title: 'Hitung diskon', type: 'code', lesson_id: 32, lesson_title: 'Diskon', course_title: 'Python Dasar', learners: 10, passed: 3, avg_attempts: 4.2 }],
  };

  it('shows the totals, where learners stop and the hardest exercises', async () => {
    mockApi({ ...as(ADMIN), 'GET /api/admin/overview': { body: { courses: [], certificates: [] } }, 'GET /api/admin/stats': { body: stats } });
    renderAt('/admin');
    const summary = await screen.findByRole('region', { name: 'Ringkasan' });
    expect(within(summary).getByText('42').closest('.stat')).toHaveTextContent('peserta terdaftar');
    expect(within(summary).getByText('Rp200.000').closest('.stat')).toHaveTextContent('dari 2 pembelian');
    const drop = screen.getByRole('region', { name: 'Pelajaran yang ditinggalkan' });
    const row = within(drop).getByRole('link', { name: '2. Diskon' }).closest('tr');
    expect(row).toHaveTextContent('30%');
    expect(row.querySelector('.bar.low')).not.toBeNull();
    expect(within(drop).getByRole('link', { name: '1. Halo, Warung!' }).closest('tr')).toHaveTextContent('90%');
    expect(within(drop).queryByText(/Belum dibuka/)).toBeNull();
    const hard = screen.getByRole('region', { name: 'Latihan tersulit' });
    expect(within(hard).getByRole('link', { name: 'Hitung diskon' }).closest('tr')).toHaveTextContent('3 (30%)');
    expect(within(hard).getByText('4.2')).toBeInTheDocument();
  });
});

describe('JavaScript exercises', () => {
  const tests = [{ input: 'console.log(total(15000, 2));', output: '30000' }];
  const jsLesson = lessonWith({ language: 'javascript', starter: '// tulis fungsi total', hints: [], tests }, { slug: 'javascript-dasar', title: 'JavaScript Dasar', language: 'javascript' });

  it('uses the JavaScript runner and editor, without an input box', async () => {
    mockApi({ ...as(USER), 'GET /api/courses/javascript-dasar/lessons/l': { body: jsLesson } });
    renderAt('/kursus/javascript-dasar/l');
    expect(await screen.findByText('main.js')).toBeInTheDocument();
    expect(useRunnerMock).toHaveBeenCalledWith('javascript');
    expect(screen.getByTestId('editor')).toHaveAttribute('data-language', 'javascript');
    expect(screen.getByText('JavaScript siap')).toBeInTheDocument();
    expect(screen.queryByText('Input untuk tombol Coba (opsional)')).toBeNull();
    expect(screen.queryByText('Tabel yang tersedia')).toBeNull();
  });

  it('runs the tests and reports the result', async () => {
    const user = userEvent.setup();
    runnerMock.runTests.mockResolvedValue({ results: [{ index: 0, ok: true, input: tests[0].input, expected: '30000', actual: '30000\n' }], passed: 1, total: 1 });
    mockApi({
      ...as(USER),
      'GET /api/courses/javascript-dasar/lessons/l': { body: jsLesson },
      'POST /api/exercises/21/result': { body: { recorded: true, passed: true, lesson_done: true, course_done: false, progress: { done: 1, total: 1 } } },
    });
    renderAt('/kursus/javascript-dasar/l');
    await user.click(await screen.findByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('Semua 1 tes lulus.')).toBeInTheDocument();
    const [code, sentTests, , extra] = runnerMock.runTests.mock.calls[0];
    expect([code, sentTests, extra]).toEqual(['// tulis fungsi total', tests, {}]);
  });
});

describe('Java and Kotlin exercises run on the server', () => {
  const tests = [{ input: '5', output: 'Rp10' }];
  const javaLesson = lessonWith({ language: 'java', runs: 'server', starter: 'public class Main {}', hints: [], tests }, { slug: 'java-basics', title: 'Java Dasar', language: 'java' });
  const page = { 'GET /api/courses/java-basics/lessons/l': { body: javaLesson } };

  it('sends the code to the server and shows its verdict', async () => {
    const user = userEvent.setup();
    mockApi({
      ...as(USER, { judge: true }), ...page,
      'POST /api/exercises/21/judge': { body: { results: [{ index: 0, ok: true, input: '5', expected: 'Rp10', actual: 'Rp10\n', error: '' }], passed: 1, total: 1, recorded: true, all_passed: true, credits_left: 17, lesson_done: true, course_done: false } },
    });
    renderAt('/kursus/java-basics/l');
    expect(await screen.findByText('Main.java')).toBeInTheDocument();
    expect(screen.getByText('Dijalankan di server')).toBeInTheDocument();
    expect(screen.getByTestId('editor')).toHaveAttribute('data-language', 'java');
    expect(screen.queryByRole('button', { name: 'Coba' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('Semua 1 tes lulus.')).toBeInTheDocument();
    expect(screen.getByText(/Sisa jatah situs hari ini: 17\./)).toBeInTheDocument();
    expect(await screen.findByText('Sudah selesai.')).toBeInTheDocument();
    expect(calls.find((c) => c.url === '/api/exercises/21/judge').body).toEqual({ code: 'public class Main {}' });
    expect(runnerMock.runTests).not.toHaveBeenCalled();
    expect(calls.some((c) => c.url === '/api/exercises/21/result')).toBe(false);
  });

  it('shows a failed test with the compiler message', async () => {
    const user = userEvent.setup();
    mockApi({
      ...as(USER, { judge: true }), ...page,
      'POST /api/exercises/21/judge': { body: { results: [{ index: 0, ok: false, input: '5', expected: 'Rp10', actual: '', error: 'Main.java:3: error: missing return statement' }], passed: 0, total: 1, recorded: true, all_passed: false, credits_left: 3 } },
    });
    renderAt('/kursus/java-basics/l');
    await user.click(await screen.findByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByText('0 dari 1 tes lulus.')).toBeInTheDocument();
    expect(screen.getByText('Main.java:3: error: missing return statement')).toBeInTheDocument();
    expect(screen.queryByText('Sudah selesai.')).toBeNull();
  });

  it('says so when the daily allowance is used up', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(USER, { judge: true }), ...page, 'POST /api/exercises/21/judge': { status: 429, body: { error: 'Jatah harian situs untuk menjalankan kode sudah habis. Coba lagi besok.' } } });
    renderAt('/kursus/java-basics/l');
    await user.click(await screen.findByRole('button', { name: 'Periksa jawaban' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Jatah harian situs');
    expect(screen.getByRole('button', { name: 'Periksa jawaban' })).toBeEnabled();
  });

  it('cannot be run while the site has no compiler keys', async () => {
    mockApi({ ...as(USER), ...page });
    renderAt('/kursus/java-basics/l');
    expect(await screen.findByRole('button', { name: 'Periksa jawaban' })).toBeDisabled();
    expect(screen.getByText(/Menjalankan kode Java belum dibuka/)).toBeInTheDocument();
  });

  it('asks a visitor to sign in first', async () => {
    mockApi({ ...as(null, { judge: true }), ...page });
    renderAt('/kursus/java-basics/l');
    expect(await screen.findByRole('button', { name: 'Periksa jawaban' })).toBeDisabled();
    expect(screen.getByText(/Masuk untuk menjalankan kode Java/)).toBeInTheDocument();
  });
});

describe('one course, two languages', () => {
  const inLang = (id, en) => (opts) => ({ body: (opts.headers || {})['X-Lang'] === 'en' ? en : id });
  const course = (title, lessonTitle, locale) => ({
    course: { slug: 'python-dasar', title, language: 'python', locale, locales: ['id', 'en'], level: 'Pemula', kind: 'course', price_idr: 0, summary: 'S', perks: [], certificate: false },
    access: true, progress: null, lessons: [{ slug: 'halo-warung', title: lessonTitle, position: 1, exercise_count: 1, done: false, locked: false }],
  });

  it('shows the same course page in the other language when the visitor switches', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(null), 'GET /api/courses/python-dasar': inLang(course('Python Dasar untuk Warung Kopi', 'Halo, Warung!', 'id'), course('Python Basics for a Coffee Shop', 'Hello, Coffee Shop!', 'en')) });
    renderAt('/kursus/python-dasar');
    expect(await screen.findByRole('heading', { name: 'Python Dasar untuk Warung Kopi' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByRole('heading', { name: 'Python Basics for a Coffee Shop' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1. Hello, Coffee Shop!' })).toHaveAttribute('href', '/kursus/python-dasar/halo-warung');
    await user.click(screen.getByRole('button', { name: 'ID' }));
    expect(await screen.findByRole('link', { name: '1. Halo, Warung!' })).toBeInTheDocument();
  });

  it('keeps the code being written when a lesson switches language', async () => {
    const user = userEvent.setup();
    const lesson = (title, prompt, starter, output) => ({
      ...lessonWith({ language: 'python', starter, hints: [], tests: [{ input: '', output }] }),
      lesson: { id: 11, slug: 'l', title, position: 1, total: 1, html: `<p>${prompt}</p>`, done: false },
    });
    mockApi({ ...as(USER), 'GET /api/courses/python-dasar/lessons/l': inLang(lesson('Halo, Warung!', 'Cetak sapaan.', '# tulis di sini', 'Halo'), lesson('Hello, Coffee Shop!', 'Print a greeting.', '# write here', 'Hello')) });
    renderAt('/kursus/python-dasar/l');
    expect(await screen.findByRole('heading', { name: 'Halo, Warung!' })).toBeInTheDocument();
    await user.clear(screen.getByTestId('editor'));
    await user.type(screen.getByTestId('editor'), 'print(1)');
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByRole('heading', { name: 'Hello, Coffee Shop!' })).toBeInTheDocument();
    expect(screen.getByText('Print a greeting.')).toBeInTheDocument();
    expect(screen.getByTestId('editor')).toHaveValue('print(1)');
    runnerMock.runTests.mockResolvedValue({ results: [], passed: 0, total: 1 });
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await waitFor(() => expect(runnerMock.runTests).toHaveBeenCalled());
    expect(runnerMock.runTests.mock.calls[0][1]).toEqual([{ input: '', output: 'Hello' }]);
  });
});

describe('starter code and the language switch', () => {
  it('swaps untouched starter code for the one in the new language', async () => {
    const user = userEvent.setup();
    const lesson = (starter) => lessonWith({ language: 'python', starter, hints: [], tests: [{ input: '', output: '1' }] });
    mockApi({ ...as(USER), 'GET /api/courses/python-dasar/lessons/l': (opts) => ({ body: lesson((opts.headers || {})['X-Lang'] === 'en' ? '# write here' : '# tulis di sini') }) });
    renderAt('/kursus/python-dasar/l');
    expect(await screen.findByTestId('editor')).toHaveValue('# tulis di sini');
    await user.click(screen.getByRole('button', { name: 'EN' }));
    await waitFor(() => expect(screen.getByTestId('editor')).toHaveValue('# write here'));
    expect(calls.some((c) => c.url.endsWith('/draft'))).toBe(false);
  });
});

describe('catalog filter', () => {
  const card = (slug, title, language) => ({ slug, title, language, locale: 'id', locales: ['id'], level: 'Pemula', kind: 'course', price_idr: 0, summary: 'S', lesson_count: 6, exercise_count: 18, progress: null, access: true });
  const catalog = [card('python-dasar', 'Python Dasar', 'python'), card('sql-dasar', 'SQL Dasar', 'sql'), card('kotlin-dasar', 'Kotlin Dasar', 'kotlin')];

  it('narrows the catalog to one programming language and back', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(null), 'GET /api/courses': { body: { courses: catalog } }, 'GET /api/plans': { body: { plans: [] } } });
    renderAt('/');
    const group = await screen.findByRole('group', { name: 'Saring menurut bahasa pemrograman' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['Semua', 'Python', 'SQL', 'Kotlin']);
    await user.click(within(group).getByRole('button', { name: 'SQL' }));
    expect(screen.getByRole('link', { name: 'SQL Dasar' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Python Dasar' })).toBeNull();
    await user.click(within(group).getByRole('button', { name: 'Semua' }));
    expect(screen.getByRole('link', { name: 'Python Dasar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kotlin Dasar' })).toBeInTheDocument();
  });

  it('has no filter when every course uses the same language', async () => {
    mockApi({ ...as(null), 'GET /api/courses': { body: { courses: [catalog[0]] } }, 'GET /api/plans': { body: { plans: [] } } });
    renderAt('/');
    expect(await screen.findByRole('link', { name: 'Python Dasar' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Saring menurut bahasa pemrograman' })).toBeNull();
  });
});
