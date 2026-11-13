import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AuthProvider } from '../auth.jsx';
import { LangProvider } from '../lang.jsx';

vi.mock('../components/CodeEditor.jsx', () => ({
  default: ({ value, onChange }) => <textarea data-testid="editor" value={value} onChange={(e) => onChange(e.target.value)} />,
}));
const runnerMock = { runOnce: vi.fn(), runTests: vi.fn(), reset: vi.fn() };
vi.mock('../runner/usePythonRunner.js', () => ({ usePythonRunner: () => [runnerMock, 'ready'] }));

const USER = { id: 7, name: 'Siti Aminah', email: 's@example.test', role: 'student', verified: true };
const ADMIN = { id: 1, name: 'Chris', email: 'c@example.test', role: 'admin', verified: true };
const COURSE = { slug: 'python-dasar', title: 'Python Dasar untuk Warung Kopi', language: 'python', level: 'Pemula', kind: 'course', price_idr: 0, summary: 'Belajar dari nol.',
  perks: ['8 pelajaran', 'Sertifikat dari tolie.space'], certificate: true };
const LESSONS = [{ slug: 'a', title: 'A', position: 1, exercise_count: 1, done: true, locked: false }];
const CERT = { id: 'LAB-7K2M-X9QP-4RTD', name: 'Siti Aminah', issued_at: '2026-11-13T05:00:00Z', revoked: false, lessons: 8, exercises: 25,
  course: { slug: 'python-dasar', title: COURSE.title, language: 'python', level: 'Pemula' }, verify_url: 'https://lab.tolie.space/verifikasi/LAB-7K2M-X9QP-4RTD', pdf_url: '/api/certificates/LAB-7K2M-X9QP-4RTD/pdf' };

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
const as = (user) => ({ 'GET /api/session': { body: { user, csrf: 'tok', verification: false } } });
const courseBody = (progress) => ({ course: COURSE, access: true, progress, lessons: LESSONS });

beforeEach(() => { runnerMock.runTests.mockReset(); });

describe('perks and plans', () => {
  it('shows the free and paid plans side by side on the home page', async () => {
    mockApi({
      ...as(null),
      'GET /api/courses': { body: { courses: [] } },
      'GET /api/plans': { body: { plans: [
        { id: 'gratis', name: 'Gratis', price: 'Rp0', tagline: 'Untuk belajar.', perks: ['Semua kursus gratis', 'Sertifikat penyelesaian'], highlight: false },
        { id: 'modul', name: 'Modul berbayar', price: 'Mulai Rp100.000 per modul', tagline: 'Kasus sulit.', perks: ['Penilaian di server'], highlight: true },
      ] } },
    });
    renderAt('/');
    const plans = await screen.findByRole('region', { name: 'Gratis dan berbayar' });
    expect(within(plans).getByText('Semua kursus gratis')).toBeInTheDocument();
    expect(within(plans).getByText('Mulai Rp100.000 per modul')).toBeInTheDocument();
    expect(plans.querySelectorAll('.plan')).toHaveLength(2);
    expect(plans.querySelector('.plan.hot')).toHaveTextContent('Modul berbayar');
  });

  it('lists what a course gives you', async () => {
    mockApi({ ...as(null), 'GET /api/courses/python-dasar': { body: courseBody(null) } });
    renderAt('/kursus/python-dasar');
    const box = await screen.findByRole('region', { name: 'Yang kamu dapat' });
    expect(within(box).getByText('Sertifikat dari tolie.space')).toBeInTheDocument();
  });
});

describe('certificate card on a course page', () => {
  const course = { 'GET /api/courses/python-dasar': { body: courseBody({ done: 1, total: 1, percent: 100, next: null }) } };

  it('explains what is still needed', async () => {
    mockApi({ ...as(USER), 'GET /api/courses/python-dasar': { body: courseBody({ done: 3, total: 8, percent: 38, next: 'x' }) },
      'GET /api/courses/python-dasar/certificate': { body: { enabled: true, eligible: false, needs_verification: false, certificate: null, default_name: 'Siti Aminah' } } });
    renderAt('/kursus/python-dasar');
    expect(await screen.findByText(/Kamu sudah 3 dari 8/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Terbitkan sertifikat' })).toBeNull();
  });

  it('lets an eligible learner claim with the name she wants printed', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(USER), ...course,
      'GET /api/courses/python-dasar/certificate': { body: { enabled: true, eligible: true, needs_verification: false, certificate: null, default_name: 'Siti Aminah' } },
      'POST /api/courses/python-dasar/certificate': { status: 201, body: { certificate: CERT, created: true } } });
    renderAt('/kursus/python-dasar');
    const input = await screen.findByLabelText('Nama di sertifikat');
    expect(input).toHaveValue('Siti Aminah');
    await user.clear(input);
    await user.type(input, 'Siti Aminah Putri');
    await user.click(screen.getByRole('button', { name: 'Terbitkan sertifikat' }));
    expect(await screen.findByText('Sertifikatmu sudah terbit')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST').body).toEqual({ name: 'Siti Aminah Putri' });
    expect(screen.getByRole('link', { name: 'Unduh PDF' })).toHaveAttribute('href', CERT.pdf_url);
    expect(screen.getByRole('link', { name: 'Halaman verifikasi' })).toHaveAttribute('href', `/verifikasi/${CERT.id}`);
    expect(screen.getByText(CERT.id)).toBeInTheDocument();
  });

  it('shows the server message when claiming fails', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(USER), ...course,
      'GET /api/courses/python-dasar/certificate': { body: { enabled: true, eligible: true, needs_verification: false, certificate: null, default_name: 'S' } },
      'POST /api/courses/python-dasar/certificate': { status: 400, body: { error: 'Tulis nama lengkapmu untuk sertifikat (2 sampai 80 karakter).' } } });
    renderAt('/kursus/python-dasar');
    await user.click(await screen.findByRole('button', { name: 'Terbitkan sertifikat' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tulis nama lengkapmu');
  });

  it('asks for email verification first when the server requires it', async () => {
    mockApi({ ...as(USER), ...course,
      'GET /api/courses/python-dasar/certificate': { body: { enabled: true, eligible: true, needs_verification: true, certificate: null, default_name: 'S' } } });
    renderAt('/kursus/python-dasar');
    expect(await screen.findByText(/Verifikasi emailmu dulu/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nama di sertifikat')).toBeNull();
  });

  it('shows an already issued certificate, and a revoked one without a download', async () => {
    mockApi({ ...as(USER), ...course,
      'GET /api/courses/python-dasar/certificate': { body: { enabled: true, eligible: true, needs_verification: false, certificate: { ...CERT, revoked: true }, default_name: 'S' } } });
    renderAt('/kursus/python-dasar');
    expect(await screen.findByText('Sertifikat ini sudah dicabut')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Unduh PDF' })).toBeNull();
  });

  it('is not shown to signed-out visitors', async () => {
    mockApi({ ...as(null), ...course });
    renderAt('/kursus/python-dasar');
    await screen.findByRole('heading', { name: COURSE.title });
    expect(screen.queryByText('Sertifikat penyelesaian')).toBeNull();
    expect(calls.some((c) => c.url.endsWith('/certificate'))).toBe(false);
  });
});

describe('public certificate page', () => {
  it('shows a valid certificate to anyone', async () => {
    mockApi({ ...as(null), [`GET /api/certificates/${CERT.id}`]: { body: { certificate: CERT } } });
    renderAt(`/verifikasi/${CERT.id}`);
    expect(await screen.findByRole('heading', { name: 'Sertifikat ini asli' })).toBeInTheDocument();
    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
    expect(screen.getByText(COURSE.title)).toBeInTheDocument();
    expect(screen.getByText(/13 November 2026/)).toBeInTheDocument();
    expect(screen.getByText(/bukan akreditasi resmi/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat PDF sertifikat' })).toHaveAttribute('href', CERT.pdf_url);
  });

  it('says so when a certificate was revoked', async () => {
    mockApi({ ...as(null), [`GET /api/certificates/${CERT.id}`]: { body: { certificate: { ...CERT, revoked: true } } } });
    renderAt(`/verifikasi/${CERT.id}`);
    expect(await screen.findByRole('heading', { name: 'Sertifikat ini sudah dicabut' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Lihat PDF sertifikat' })).toBeNull();
  });

  it('says clearly when the number does not exist', async () => {
    mockApi({ ...as(null), 'GET /api/certificates/LAB-AAAA-AAAA-AAAA': { status: 404, body: { error: 'Tidak ditemukan.' } } });
    renderAt('/verifikasi/LAB-AAAA-AAAA-AAAA');
    expect(await screen.findByRole('heading', { name: 'Nomor ini tidak ditemukan' })).toBeInTheDocument();
  });

  it('lets someone type a number to check', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(null), [`GET /api/certificates/${CERT.id}`]: { body: { certificate: CERT } } });
    renderAt('/verifikasi');
    await user.type(await screen.findByLabelText('Nomor sertifikat'), CERT.id);
    await user.click(screen.getByRole('button', { name: 'Periksa' }));
    expect(await screen.findByRole('heading', { name: 'Sertifikat ini asli' })).toBeInTheDocument();
  });
});

describe('admin access', () => {
  it('sends signed-out visitors to the login page', async () => {
    mockApi({ ...as(null) });
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Masuk ke Lab' })).toBeInTheDocument();
  });

  it('keeps learners out', async () => {
    mockApi({ ...as(USER) });
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Hanya untuk admin' })).toBeInTheDocument();
    expect(calls.some((c) => c.url.includes('/api/admin'))).toBe(false);
  });

  it('shows the Admin link only to admins', async () => {
    mockApi({ ...as(ADMIN), 'GET /api/courses': { body: { courses: [] } } });
    renderAt('/');
    expect(await screen.findByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });
});

describe('admin overview', () => {
  const overview = { courses: [
    { id: 1, slug: 'python-dasar', title: 'Python Dasar untuk Warung Kopi', language: 'python', level: 'Pemula', kind: 'course', price_idr: 0, status: 'published', position: 1, source: 'file', lessons: 8, exercises: 25, learners: 12, certificates: 3 },
    { id: 2, slug: 'modul', title: 'Modul Laporan', language: 'python', level: 'Menengah', kind: 'module', price_idr: 100000, status: 'draft', position: 20, source: 'admin', lessons: 1, exercises: 2, learners: 0, certificates: 0 },
  ], certificates: [{ public_id: CERT.id, holder_name: 'Siti Aminah', issued_at: '2026-11-13T05:00:00Z', course_title: COURSE.title, email: 's@example.test', revoked: false }] };

  it('lists courses with counts and status', async () => {
    mockApi({ ...as(ADMIN), 'GET /api/admin/overview': { body: overview } });
    renderAt('/admin');
    const row = (await screen.findByRole('link', { name: 'Python Dasar untuk Warung Kopi' })).closest('tr');
    expect(within(row).getByText('8 pelajaran')).toBeInTheDocument();
    expect(within(row).getByText('3 sertifikat')).toBeInTheDocument();
    expect(within(row).getByText('terbit')).toBeInTheDocument();
    expect(screen.getByText('draf')).toBeInTheDocument();
    expect(screen.getByText('Rp100.000')).toBeInTheDocument();
  });

  it('revokes a certificate', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(ADMIN), 'GET /api/admin/overview': { body: overview }, [`POST /api/admin/certificates/${CERT.id}/revoke`]: { body: { ok: true, revoked: true } } });
    renderAt('/admin');
    await user.click(await screen.findByRole('button', { name: 'Cabut' }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith('/revoke'))).toBe(true));
  });

  it('grants a module to a learner by email', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(ADMIN), 'GET /api/admin/overview': { body: overview }, 'POST /api/admin/grants': { body: { ok: true } } });
    renderAt('/admin');
    await user.type(await screen.findByLabelText('Email peserta'), 'dewi@example.test');
    await user.selectOptions(screen.getByLabelText('Modul'), 'modul');
    await user.click(screen.getByRole('button', { name: 'Beri akses' }));
    expect(await screen.findByText('Akses diberikan.')).toBeInTheDocument();
    expect(calls.find((c) => c.url === '/api/admin/grants').body).toEqual({ email: 'dewi@example.test', course_slug: 'modul' });
  });

  it('creates a course and opens it', async () => {
    const user = userEvent.setup();
    mockApi({ ...as(ADMIN), 'GET /api/admin/overview': { body: overview },
      'POST /api/admin/courses': { status: 201, body: { course: { id: 9, slug: 'baru', title: 'Baru', language: 'python', level: 'Pemula', kind: 'course', price_idr: 0, status: 'draft', position: 100, summary: 's', perks: [], certificate: true, source: 'admin' } } },
      'GET /api/admin/courses/9': { body: { course: { id: 9, slug: 'baru', title: 'Baru', language: 'python', level: 'Pemula', kind: 'course', price_idr: 0, status: 'draft', position: 100, summary: 's', perks: [], certificate: true, source: 'admin' }, lessons: [] } } });
    renderAt('/admin');
    await user.click(await screen.findByRole('button', { name: 'Kursus baru' }));
    await user.type(screen.getByLabelText('Judul'), 'Baru');
    await user.type(screen.getByLabelText('Ringkasan'), 'Ringkas');
    await user.type(screen.getByLabelText(/Yang didapat peserta/), 'Sertifikat{Enter}Latihan kode');
    await user.click(screen.getByRole('button', { name: 'Simpan kursus' }));
    expect(await screen.findByRole('heading', { name: 'Baru' })).toBeInTheDocument();
    const body = calls.find((c) => c.method === 'POST' && c.url === '/api/admin/courses').body;
    expect(body).toMatchObject({ title: 'Baru', language: 'python', price_idr: 0, status: 'draft', certificate: true, perks: ['Sertifikat', 'Latihan kode'] });
  });
});

describe('admin: adding questions', () => {
  const lessonBody = (exercises = []) => ({
    lesson: { id: 5, course_id: 2, slug: 'data', title: 'Mengenal data', position: 1, body: 'Isi', source: 'admin' },
    course: { id: 2, title: 'Modul Laporan', language: 'python' }, exercises,
  });
  const base = { ...as(ADMIN), 'GET /api/admin/lessons/5': { body: lessonBody() } };

  it('adds a multiple-choice question', async () => {
    const user = userEvent.setup();
    mockApi({ ...base, 'POST /api/admin/lessons/5/exercises': { status: 201, body: { exercise: { id: 70 } } } });
    renderAt('/admin/pelajaran/5');
    await user.click(await screen.findByRole('button', { name: 'Soal pilihan ganda baru' }));
    await user.type(screen.getByLabelText('Judul soal'), 'Mana yang int?');
    await user.type(screen.getByLabelText(/Pertanyaan/), 'Mana yang bertipe `int`?');
    await user.type(screen.getByLabelText('Teks pilihan 1'), '`42`');
    await user.type(screen.getByLabelText('Teks pilihan 2'), '`"42"`');
    await user.click(screen.getByLabelText('Pilihan 1 benar'));
    await user.type(screen.getByLabelText(/Penjelasan/), '42 adalah int.');
    await user.click(screen.getByRole('button', { name: 'Simpan soal' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/exercises'))).toBe(true));
    const sent = calls.find((c) => c.method === 'POST' && c.url.endsWith('/exercises')).body;
    expect(sent).toMatchObject({ type: 'choice', title: 'Mana yang int?', options: ['`42`', '`"42"`'], correct: [0], multiple: false, explanation: '42 adalah int.', required: true });
  });

  it('switches to checkboxes for several correct answers', async () => {
    const user = userEvent.setup();
    mockApi(base);
    renderAt('/admin/pelajaran/5');
    await user.click(await screen.findByRole('button', { name: 'Soal pilihan ganda baru' }));
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    await user.click(screen.getByLabelText(/Boleh lebih dari satu jawaban benar/));
    expect(screen.getAllByRole('checkbox', { name: /Pilihan \d benar/ })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Tambah pilihan' }));
    expect(screen.getAllByLabelText(/Teks pilihan/)).toHaveLength(3);
  });

  it('removing an option keeps the right answer pointing at the same text', async () => {
    const user = userEvent.setup();
    const existing = { id: 71, slug: 'q', position: 1, type: 'choice', title: 'Q', prompt: 'P', required: true, source: 'admin', submissions: 0,
      config: { options: ['a', 'b', 'c'], correct: [2], multiple: false, hint: '', explanation: 'E' } };
    mockApi({ ...as(ADMIN), 'GET /api/admin/lessons/5': { body: lessonBody([existing]) }, 'PUT /api/admin/exercises/71': { body: { exercise: { id: 71 } } } });
    renderAt('/admin/pelajaran/5');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.click(screen.getAllByRole('button', { name: 'Hapus' }).filter((b) => b.closest('.opt-row'))[0]);
    await user.click(screen.getByRole('button', { name: 'Simpan soal' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true));
    expect(calls.find((c) => c.method === 'PUT').body).toMatchObject({ options: ['b', 'c'], correct: [1] });
  });

  async function openCodeForm(user) {
    mockApi({ ...base, 'POST /api/admin/lessons/5/exercises': { status: 201, body: { exercise: { id: 72 } } } });
    renderAt('/admin/pelajaran/5');
    await user.click(await screen.findByRole('button', { name: 'Latihan kode baru' }));
    await user.type(screen.getByLabelText('Judul soal'), 'Hitung pajak');
    await user.type(screen.getByLabelText(/Perintah/), 'Cetak pajak 10%.');
    await user.type(screen.getByLabelText(/Kode awal/), 'harga = int(input())');
    await user.type(screen.getByLabelText(/Solusi/), 'print(1)');
    await user.type(screen.getByLabelText('Keluaran tes 1'), '10000');
  }

  it('refuses to save a code exercise whose solution fails its own tests', async () => {
    const user = userEvent.setup();
    await openCodeForm(user);
    runnerMock.runTests.mockResolvedValueOnce({ results: [{ index: 0, ok: false, input: '', expected: '10000', actual: '1\n', diff: { line: 1, expectedLine: '10000', actualLine: '1' } }], passed: 0, total: 1 });
    await user.click(screen.getByRole('button', { name: 'Simpan soal' }));
    expect(await screen.findByText(/Solusimu belum lulus semua tes \(0 dari 1\)/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/exercises'))).toBe(false);
  });

  it('refuses a starter that already passes every test', async () => {
    const user = userEvent.setup();
    await openCodeForm(user);
    runnerMock.runTests
      .mockResolvedValueOnce({ results: [{ index: 0, ok: true }], passed: 1, total: 1 })
      .mockResolvedValueOnce({ results: [{ index: 0, ok: true }], passed: 1, total: 1 });
    await user.click(screen.getByRole('button', { name: 'Simpan soal' }));
    expect(await screen.findByText(/Kode awal sudah lulus semua tes/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/exercises'))).toBe(false);
  });

  it('saves a code exercise once the solution passes and the starter does not', async () => {
    const user = userEvent.setup();
    await openCodeForm(user);
    runnerMock.runTests
      .mockResolvedValueOnce({ results: [{ index: 0, ok: true }], passed: 1, total: 1 })
      .mockResolvedValueOnce({ results: [{ index: 0, ok: false }], passed: 0, total: 1 });
    await user.click(screen.getByRole('button', { name: 'Simpan soal' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/exercises'))).toBe(true));
    const sent = calls.find((c) => c.method === 'POST' && c.url.endsWith('/exercises')).body;
    expect(sent).toMatchObject({ type: 'code', language: 'python', starter: 'harga = int(input())', solution: 'print(1)', tests: [{ input: '', output: '10000' }] });
    expect(runnerMock.runTests.mock.calls[0][0]).toBe('print(1)');
    expect(runnerMock.runTests.mock.calls[1][0]).toBe('harga = int(input())');
  });

  it('can test a code exercise without saving it', async () => {
    const user = userEvent.setup();
    await openCodeForm(user);
    runnerMock.runTests
      .mockResolvedValueOnce({ results: [{ index: 0, ok: true }], passed: 1, total: 1 })
      .mockResolvedValueOnce({ results: [{ index: 0, ok: false }], passed: 0, total: 1 });
    await user.click(screen.getByRole('button', { name: 'Uji solusi dan kode awal' }));
    expect(await screen.findByText(/Soal ini layak disimpan/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/exercises'))).toBe(false);
  });

  it('shows the server message when saving fails', async () => {
    const user = userEvent.setup();
    mockApi({ ...base, 'POST /api/admin/lessons/5/exercises': { status: 409, body: { error: 'Sudah ada latihan dengan slug itu di pelajaran ini.' } } });
    renderAt('/admin/pelajaran/5');
    await user.click(await screen.findByRole('button', { name: 'Soal pilihan ganda baru' }));
    await user.type(screen.getByLabelText('Judul soal'), 'X');
    await user.type(screen.getByLabelText(/Pertanyaan/), 'P');
    await user.type(screen.getByLabelText('Teks pilihan 1'), 'a');
    await user.type(screen.getByLabelText('Teks pilihan 2'), 'b');
    await user.click(screen.getByLabelText('Pilihan 2 benar'));
    await user.type(screen.getByLabelText(/Penjelasan/), 'E');
    await user.click(screen.getByRole('button', { name: 'Simpan soal' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sudah ada latihan dengan slug itu');
  });

  it('asks before deleting a question that learners have answered', async () => {
    const user = userEvent.setup();
    const answered = { id: 73, slug: 'q', position: 1, type: 'choice', title: 'Sudah dijawab', prompt: 'P', required: true, source: 'admin', submissions: 4,
      config: { options: ['a', 'b'], correct: [0], multiple: false, hint: '', explanation: 'E' } };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let n = 0;
    mockApi({ ...as(ADMIN), 'GET /api/admin/lessons/5': { body: lessonBody([answered]) },
      'DELETE /api/admin/exercises/73': () => (++n === 1 ? { status: 409, body: { error: 'Latihan ini sudah punya 4 jawaban peserta.', submissions: 4 } } : { body: { ok: true } }) });
    renderAt('/admin/pelajaran/5');
    await user.click(await screen.findByRole('button', { name: 'Hapus' }));
    await waitFor(() => expect(calls.some((c) => c.url === '/api/admin/exercises/73?force=1')).toBe(true));
    expect(window.confirm).toHaveBeenCalled();
  });

  it('previews the lesson text', async () => {
    const user = userEvent.setup();
    mockApi({ ...base, 'POST /api/admin/preview': { body: { html: '<h2>Judul materi</h2>' } } });
    renderAt('/admin/pelajaran/5');
    await user.click(await screen.findByRole('button', { name: 'Pratinjau' }));
    expect(await screen.findByRole('heading', { name: 'Judul materi' })).toBeInTheDocument();
  });
});
