import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import CourseForm from '../../components/admin/CourseForm.jsx';
import { api } from '../../api.js';
import { useApi, useDocumentTitle } from '../../hooks.js';

export default function CourseAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reload, setReload] = useState(0);
  const { data, error, loading } = useApi(`/api/admin/courses/${id}`, reload);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  useDocumentTitle(data ? `${data.course.title} · Admin` : 'Admin · Lab');

  async function addLesson(e) {
    e.preventDefault();
    setMsg('');
    try {
      const out = await api(`/api/admin/courses/${id}/lessons`, { method: 'POST', body: { title, body: 'Tulis materi pelajaran di sini.' } });
      navigate(`/admin/pelajaran/${out.id}`);
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (loading && !data) return <Layout><p className="note">Memuat…</p></Layout>;
  if (error) return <Layout><p className="flash err" role="alert">{error.message}</p></Layout>;
  const { course, lessons } = data;
  return (
    <Layout wide>
      <div className="admin-top">
        <div>
          <p className="meta"><Link to="/admin">Admin</Link> · kursus</p>
          <h1>{course.title}</h1>
        </div>
        <Link className="btn ghost" to={`/kursus/${course.slug}`}>Lihat sebagai peserta</Link>
      </div>
      {course.source === 'file' && (
        <p className="flash err">Kursus ini berasal dari file di repo. Begitu kamu menyimpan perubahan di sini, file tidak lagi menimpanya.</p>
      )}
      <CourseForm key={course.id} course={course} onSaved={() => setReload((n) => n + 1)} />

      <section className="card table-card">
        <span className="tab">Pelajaran</span>
        <table className="posts">
          <thead><tr><th>#</th><th>Judul</th><th>Latihan</th><th /></tr></thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id}>
                <td>{l.position}</td>
                <td><Link to={`/admin/pelajaran/${l.id}`}>{l.title}</Link><br /><small>{l.slug}{l.source === 'file' ? ' · dari file' : ''}</small></td>
                <td>{l.exercises}</td>
                <td className="acts"><Link to={`/admin/pelajaran/${l.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        <form className="add-lesson" onSubmit={addLesson}>
          <label htmlFor="new-lesson">Pelajaran baru</label>
          <div className="row">
            <input id="new-lesson" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul pelajaran" required maxLength={120} />
            <button type="submit">Tambah</button>
          </div>
          {msg && <p className="flash err" role="alert">{msg}</p>}
        </form>
      </section>
    </Layout>
  );
}
