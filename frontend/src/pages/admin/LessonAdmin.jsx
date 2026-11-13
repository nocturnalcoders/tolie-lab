import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import Prose from '../../components/Prose.jsx';
import ExerciseForm from '../../components/admin/ExerciseForm.jsx';
import { api } from '../../api.js';
import { useApi, useDocumentTitle } from '../../hooks.js';
import { usePythonRunner } from '../../runner/usePythonRunner.js';

function LessonForm({ lesson, onSaved }) {
  const [f, setF] = useState({ title: lesson.title, slug: lesson.slug, position: lesson.position, body: lesson.body });
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState({ kind: '', text: '' });
  const set = (key) => (e) => { setMsg({ kind: '', text: '' }); setF((s) => ({ ...s, [key]: e.target.value })); };

  async function save(e) {
    e.preventDefault();
    try {
      await api(`/api/admin/lessons/${lesson.id}`, { method: 'PUT', body: { ...f, position: Number(f.position) || 0 } });
      setMsg({ kind: 'ok', text: 'Tersimpan.' });
      onSaved();
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    }
  }
  async function showPreview() {
    try {
      setPreview((await api('/api/admin/preview', { method: 'POST', body: { markdown: f.body } })).html);
    } catch (err) {
      setMsg({ kind: 'err', text: err.message });
    }
  }

  return (
    <form className="card panel" onSubmit={save} aria-label="Pelajaran">
      <span className="tab">Materi</span>
      <label htmlFor="l-title">Judul pelajaran</label>
      <input id="l-title" type="text" value={f.title} onChange={set('title')} required maxLength={120} />
      <div className="two-col">
        <div><label htmlFor="l-slug">Slug</label><input id="l-slug" type="text" value={f.slug} onChange={set('slug')} required /></div>
        <div><label htmlFor="l-pos">Urutan</label><input id="l-pos" type="number" value={f.position} onChange={set('position')} /></div>
      </div>
      <label htmlFor="l-body">Materi <small>(Markdown)</small></label>
      <textarea id="l-body" className="mono" value={f.body} onChange={set('body')} rows={14} required />
      {msg.text && <p className={`flash ${msg.kind}`} role="status">{msg.text}</p>}
      <div className="row">
        <button type="submit">Simpan materi</button>
        <button type="button" className="ghost" onClick={showPreview}>Pratinjau</button>
      </div>
      {preview !== null && <div className="preview"><Prose html={preview} /></div>}
    </form>
  );
}

export default function LessonAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reload, setReload] = useState(0);
  const { data, error, loading } = useApi(`/api/admin/lessons/${id}`, reload);
  const [editing, setEditing] = useState(null); // { exercise?, type }
  const [runner, status] = usePythonRunner();
  const [msg, setMsg] = useState('');
  useDocumentTitle(data ? `${data.lesson.title} · Admin` : 'Admin · Lab');
  useEffect(() => { setEditing(null); }, [id]);

  async function remove(ex) {
    setMsg('');
    try {
      await api(`/api/admin/exercises/${ex.id}`, { method: 'DELETE' });
      setReload((n) => n + 1);
    } catch (err) {
      if (err.status === 409 && window.confirm(`${err.message}\n\nHapus tetap?`)) {
        await api(`/api/admin/exercises/${ex.id}?force=1`, { method: 'DELETE' });
        setReload((n) => n + 1);
      } else if (err.status !== 409) {
        setMsg(err.message);
      }
    }
  }

  async function removeLesson() {
    try {
      await api(`/api/admin/lessons/${id}`, { method: 'DELETE' });
    } catch (err) {
      if (err.status === 409 && window.confirm(`${err.message}\n\nHapus tetap?`)) await api(`/api/admin/lessons/${id}?force=1`, { method: 'DELETE' });
      else { setMsg(err.message); return; }
    }
    navigate(`/admin/kursus/${data.course.id}`);
  }

  if (loading && !data) return <Layout><p className="note">Memuat…</p></Layout>;
  if (error) return <Layout><p className="flash err" role="alert">{error.message}</p></Layout>;
  const { lesson, course, exercises } = data;

  return (
    <Layout wide>
      <div className="admin-top">
        <div>
          <p className="meta"><Link to="/admin">Admin</Link> · <Link to={`/admin/kursus/${course.id}`}>{course.title}</Link> · pelajaran</p>
          <h1>{lesson.title}</h1>
        </div>
        <button type="button" className="ghost" onClick={removeLesson}>Hapus pelajaran</button>
      </div>
      <LessonForm key={`${lesson.id}-${reload}`} lesson={lesson} onSaved={() => setReload((n) => n + 1)} />

      <section className="card table-card">
        <span className="tab">Soal</span>
        {exercises.length === 0 && <p className="muted">Belum ada soal di pelajaran ini.</p>}
        {exercises.length > 0 && (
          <table className="posts">
            <thead><tr><th>#</th><th>Soal</th><th>Jenis</th><th>Jawaban peserta</th><th /></tr></thead>
            <tbody>
              {exercises.map((e) => (
                <tr key={e.id}>
                  <td>{e.position}</td>
                  <td>{e.title}<br /><small>{e.slug}{e.source === 'file' ? ' · dari file' : ''}{e.required ? '' : ' · opsional'}</small></td>
                  <td>{e.type === 'choice' ? 'Pilihan ganda' : 'Kode'}</td>
                  <td>{e.submissions}</td>
                  <td className="acts">
                    <button type="button" className="link" onClick={() => setEditing({ exercise: e, type: e.type })}>Edit</button>
                    <button type="button" className="link danger" onClick={() => remove(e)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {msg && <p className="flash err" role="alert">{msg}</p>}
        <div className="row">
          <button type="button" onClick={() => setEditing({ type: 'choice' })}>Soal pilihan ganda baru</button>
          <button type="button" className="ghost" onClick={() => setEditing({ type: 'code' })}>Latihan kode baru</button>
        </div>
      </section>

      {editing && (
        <ExerciseForm
          key={editing.exercise ? editing.exercise.id : `new-${editing.type}`}
          exercise={editing.exercise}
          type={editing.type}
          lessonId={lesson.id}
          language={course.language}
          runner={runner}
          status={status}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); setReload((n) => n + 1); }}
        />
      )}
    </Layout>
  );
}
