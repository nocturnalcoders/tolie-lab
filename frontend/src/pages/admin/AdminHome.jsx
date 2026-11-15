import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import CourseForm from '../../components/admin/CourseForm.jsx';
import { api } from '../../api.js';
import { useApi, useDocumentTitle } from '../../hooks.js';
import { priceLabel, rupiah } from '../../utils.js';

const pct = (part, whole) => (whole ? Math.round((100 * part) / whole) : 0);

// Who is learning, where they stop, and which exercises are hardest.
function Dashboard() {
  const { data, error } = useApi('/api/admin/stats');
  if (error) return <p className="flash err" role="alert">{error.message}</p>;
  if (!data) return null;
  const { totals, days, lessons, hardest } = data;
  const peak = Math.max(1, ...days.map((d) => Math.max(d.users, d.active)));
  const started = lessons.filter((l) => l.started > 0);
  return (
    <>
      <section className="card panel" aria-label="Ringkasan">
        <span className="tab">Ringkasan</span>
        <div className="stat-grid">
          <div className="stat"><b>{totals.users}</b>peserta terdaftar</div>
          <div className="stat"><b>{totals.new_users_7d}</b>pendaftar baru, 7 hari</div>
          <div className="stat"><b>{totals.active_7d}</b>peserta aktif, 7 hari</div>
          <div className="stat"><b>{totals.submissions_7d}</b>jawaban dikirim, 7 hari</div>
          <div className="stat"><b>{totals.certificates}</b>sertifikat terbit</div>
          <div className="stat"><b>{rupiah(totals.revenue_idr)}</b>dari {totals.paid_orders} pembelian</div>
        </div>
        <div className="table-scroll"><table className="posts">
          <caption className="sr">Pendaftar dan peserta aktif per hari, 14 hari terakhir</caption>
          <thead><tr><th>Hari</th><th>Pendaftar baru</th><th>Peserta aktif</th></tr></thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day}>
                <td>{new Date(`${d.day}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td>{d.users}<span className="bar" style={{ width: `${pct(d.users, peak)}%` }} /></td>
                <td>{d.active}<span className="bar" style={{ width: `${pct(d.active, peak)}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <section className="card table-card" aria-label="Pelajaran yang ditinggalkan">
        <span className="tab">Pelajaran yang ditinggalkan</span>
        {started.length === 0 ? <p className="muted">Belum ada peserta yang mengerjakan latihan.</p> : (
          <div className="table-scroll"><table className="posts">
            <thead><tr><th>Pelajaran</th><th>Mulai</th><th>Selesai</th><th>Menyelesaikan</th></tr></thead>
            <tbody>
              {started.map((l) => (
                <tr key={l.id}>
                  <td><Link to={`/admin/pelajaran/${l.id}`}>{l.position}. {l.title}</Link><br /><small>{l.course_title}</small></td>
                  <td>{l.started}</td>
                  <td>{l.finished}</td>
                  <td>{pct(l.finished, l.started)}%<span className={`bar${pct(l.finished, l.started) < 50 ? ' low' : ''}`} style={{ width: `${pct(l.finished, l.started)}%` }} /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>

      <section className="card table-card" aria-label="Latihan tersulit">
        <span className="tab">Latihan tersulit</span>
        {hardest.length === 0 ? <p className="muted">Belum ada jawaban yang masuk.</p> : (
          <div className="table-scroll"><table className="posts">
            <thead><tr><th>Latihan</th><th>Mencoba</th><th>Lulus</th><th>Rata-rata percobaan</th></tr></thead>
            <tbody>
              {hardest.map((x) => (
                <tr key={x.id}>
                  <td><Link to={`/admin/pelajaran/${x.lesson_id}`}>{x.title}</Link><br /><small>{x.course_title} · {x.lesson_title} · {x.type === 'choice' ? 'pilihan ganda' : 'kode'}</small></td>
                  <td>{x.learners}</td>
                  <td>{x.passed} ({pct(x.passed, x.learners)}%)</td>
                  <td>{x.avg_attempts}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}

export default function AdminHome() {
  useDocumentTitle('Admin · Lab');
  const navigate = useNavigate();
  const [reload, setReload] = useState(0);
  const { data, error, loading } = useApi('/api/admin/overview', reload);
  const [creating, setCreating] = useState(false);
  const [grant, setGrant] = useState({ email: '', course_slug: '' });
  const [msg, setMsg] = useState({ kind: '', text: '' });

  async function certAction(id, action) {
    try {
      await api(`/api/admin/certificates/${id}/${action}`, { method: 'POST' });
      setReload((n) => n + 1);
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    }
  }

  async function submitGrant(e) {
    e.preventDefault();
    setMsg({ kind: '', text: '' });
    try {
      await api('/api/admin/grants', { method: 'POST', body: grant });
      setMsg({ kind: 'ok', text: 'Akses diberikan.' });
      setGrant({ email: '', course_slug: grant.course_slug });
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    }
  }

  return (
    <Layout wide>
      <div className="admin-top">
        <h1>Admin</h1>
        <button type="button" onClick={() => setCreating((v) => !v)}>{creating ? 'Tutup' : 'Kursus baru'}</button>
      </div>
      {creating && <CourseForm onSaved={(c) => navigate(`/admin/kursus/${c.id}`)} />}
      <Dashboard />
      {loading && <p className="note">Memuat…</p>}
      {error && <p className="flash err" role="alert">{error.message}</p>}
      {data && (
        <>
          <section className="card table-card">
            <span className="tab">Kursus dan modul</span>
            <div className="table-scroll"><table className="posts">
              <thead><tr><th>Judul</th><th>Isi</th><th>Peserta</th><th>Harga</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data.courses.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/admin/kursus/${c.id}`}>{c.title}</Link><br /><small>{c.slug} · {c.locale === 'en' ? 'English' : 'Indonesia'}{c.source === 'file' ? ' · dari file' : ''}</small></td>
                    <td>{c.lessons} pelajaran<br /><small>{c.exercises} latihan</small></td>
                    <td>{c.learners}<br /><small>{c.certificates} sertifikat</small></td>
                    <td>{priceLabel(c)}</td>
                    <td><span className={`badge ${c.status}`}>{c.status === 'published' ? 'terbit' : 'draf'}</span></td>
                    <td className="acts"><Link to={`/admin/kursus/${c.id}`}>Kelola</Link></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </section>

          <section className="card panel">
            <span className="tab">Beri akses modul</span>
            <form onSubmit={submitGrant} className="two-col grant">
              <div>
                <label htmlFor="g-email">Email peserta</label>
                <input id="g-email" type="text" value={grant.email} onChange={(e) => setGrant({ ...grant, email: e.target.value })} required />
              </div>
              <div>
                <label htmlFor="g-course">Modul</label>
                <select id="g-course" value={grant.course_slug} onChange={(e) => setGrant({ ...grant, course_slug: e.target.value })} required>
                  <option value="">Pilih…</option>
                  {data.courses.map((c) => <option key={c.id} value={c.slug}>{c.title}</option>)}
                </select>
              </div>
              <div className="row"><button type="submit">Beri akses</button></div>
            </form>
            {msg.text && <p className={`flash ${msg.kind}`} role="status">{msg.text}</p>}
          </section>

          <section className="card table-card">
            <span className="tab">Sertifikat terbaru</span>
            {data.certificates.length === 0 ? <p className="muted">Belum ada sertifikat yang terbit.</p> : (
              <div className="table-scroll"><table className="posts">
                <thead><tr><th>Nama</th><th>Kursus</th><th>Nomor</th><th /></tr></thead>
                <tbody>
                  {data.certificates.map((c) => (
                    <tr key={c.public_id}>
                      <td>{c.holder_name}<br /><small>{c.email}</small></td>
                      <td>{c.course_title}</td>
                      <td><Link to={`/verifikasi/${c.public_id}`}><code>{c.public_id}</code></Link>{c.revoked && <><br /><span className="badge draft">dicabut</span></>}</td>
                      <td className="acts">
                        <button type="button" className={`link${c.revoked ? '' : ' danger'}`} onClick={() => certAction(c.public_id, c.revoked ? 'restore' : 'revoke')}>
                          {c.revoked ? 'Pulihkan' : 'Cabut'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
