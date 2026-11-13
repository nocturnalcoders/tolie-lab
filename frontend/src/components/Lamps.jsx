// A string of small lanterns: one per lesson, lit when the lesson is done.
// This is how progress looks everywhere in the lab (catalog, course page, lesson page).
import { Link } from 'react-router-dom';
import { useT } from '../lang.jsx';

export function Lamp({ on, current = false, title }) {
  return <i className={`lamp${on ? ' on' : ''}${current ? ' current' : ''}`} title={title} aria-hidden="true" />;
}

export default function Lamps({ items, courseSlug, currentSlug, label }) {
  const t = useT();
  const done = items.filter((x) => x.done).length;
  return (
    <ol className="lamps" aria-label={label || t('{done} dari {total} pelajaran selesai', { done, total: items.length })}>
      {items.map((x, i) => {
        const inner = (
          <>
            <Lamp on={x.done} current={x.slug === currentSlug} title={`${i + 1}. ${x.title}`} />
            <span className="sr">{`${i + 1}. ${x.title}${x.done ? ` (${t('selesai')})` : ''}`}</span>
          </>
        );
        return (
          <li key={x.slug}>
            {courseSlug ? (
              <Link to={`/kursus/${courseSlug}/${x.slug}`} aria-current={x.slug === currentSlug ? 'page' : undefined}>
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
