import { useState } from 'react';
import { api } from '../../api.js';

const LANGS = [['python', 'Python'], ['javascript', 'JavaScript'], ['sql', 'SQL'], ['java', 'Java'], ['kotlin', 'Kotlin']];

export default function CourseForm({ course, onSaved }) {
  const [f, setF] = useState(() => ({
    title: course?.title || '', slug: course?.slug || '', language: course?.language || 'python', locale: course?.locale || 'id', level: course?.level || 'Pemula',
    kind: course?.kind || 'course', price_idr: course?.price_idr ?? 0, status: course?.status || 'draft', position: course?.position ?? 100,
    summary: course?.summary || '', perks: (course?.perks || []).join('\n'), certificate: course?.certificate ?? true,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const set = (key) => (e) => { setSaved(false); setF((s) => ({ ...s, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        ...f, slug: f.slug.trim(), price_idr: Number(f.price_idr) || 0, position: Number(f.position) || 0,
        perks: f.perks.split('\n').map((x) => x.trim()).filter(Boolean),
      };
      const out = course ? await api(`/api/admin/courses/${course.id}`, { method: 'PUT', body }) : await api('/api/admin/courses', { method: 'POST', body });
      setSaved(true);
      onSaved(out.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card panel" onSubmit={submit} aria-label={course ? 'Pengaturan kursus' : 'Kursus baru'}>
      <span className="tab">{course ? 'Pengaturan' : 'Kursus baru'}</span>
      <label htmlFor="c-title">Judul</label>
      <input id="c-title" type="text" value={f.title} onChange={set('title')} required maxLength={120} />
      <div className="two-col">
        <div>
          <label htmlFor="c-lang">Bahasa</label>
          <select id="c-lang" value={f.language} onChange={set('language')}>{LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
        <div>
          <label htmlFor="c-locale">Bahasa kursus <small>(bahasa tulisan materinya)</small></label>
          <select id="c-locale" value={f.locale} onChange={set('locale')}><option value="id">Indonesia</option><option value="en">English</option></select>
        </div>
        <div>
          <label htmlFor="c-level">Level</label>
          <input id="c-level" type="text" value={f.level} onChange={set('level')} required maxLength={40} />
        </div>
      </div>
      <label htmlFor="c-summary">Ringkasan</label>
      <textarea id="c-summary" value={f.summary} onChange={set('summary')} rows={3} required maxLength={600} />
      <label htmlFor="c-perks">Yang didapat peserta <small>(satu baris satu manfaat)</small></label>
      <textarea id="c-perks" value={f.perks} onChange={set('perks')} rows={4} />
      <div className="two-col">
        <div>
          <label htmlFor="c-kind">Jenis</label>
          <select id="c-kind" value={f.kind} onChange={set('kind')}><option value="course">Kursus</option><option value="module">Modul</option></select>
        </div>
        <div>
          <label htmlFor="c-price">Harga (rupiah, 0 = gratis)</label>
          <input id="c-price" type="number" min="0" step="1000" value={f.price_idr} onChange={set('price_idr')} />
        </div>
        <div>
          <label htmlFor="c-status">Status</label>
          <select id="c-status" value={f.status} onChange={set('status')}><option value="draft">Draf (tersembunyi)</option><option value="published">Terbit</option></select>
        </div>
        <div>
          <label htmlFor="c-pos">Urutan di katalog</label>
          <input id="c-pos" type="number" value={f.position} onChange={set('position')} />
        </div>
      </div>
      <label htmlFor="c-slug">Slug <small>(kosongkan agar dibuat dari judul)</small></label>
      <input id="c-slug" type="text" value={f.slug} onChange={set('slug')} />
      <label className="check pad"><input type="checkbox" checked={f.certificate} onChange={set('certificate')} /> Terbitkan sertifikat penyelesaian</label>
      {error && <p className="flash err" role="alert">{error}</p>}
      {saved && <p className="flash ok" role="status">Tersimpan.</p>}
      <div className="row"><button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kursus'}</button></div>
    </form>
  );
}
