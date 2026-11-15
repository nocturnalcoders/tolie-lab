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
    expect([code, sentTests, extra]).toEqual(['-- tulis query', tests, { setup }]);
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
