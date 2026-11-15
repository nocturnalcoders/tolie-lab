import { useEffect, useRef } from 'react';
import { basicSetup, EditorView } from 'codemirror';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { sql, SQLite } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

const themeFor = (theme) => (theme === 'day' ? [] : oneDark);

// A code editor with Python or SQL highlighting. Ctrl/Cmd+Enter runs the tests; Esc lets go of the
// keyboard focus (Tab indents inside the editor, so Esc is the way out for keyboard users).
export default function CodeEditor({ value, onChange, theme = 'night', onRun, language = 'python', label = 'Editor kode' }) {
  const host = useRef(null);
  const view = useRef(null);
  const themeSlot = useRef(null);
  if (!themeSlot.current) themeSlot.current = new Compartment();
  const latest = useRef({ onChange, onRun });
  latest.current = { onChange, onRun };

  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        Prec.highest(
          keymap.of([
            { key: 'Mod-Enter', run: () => { if (latest.current.onRun) latest.current.onRun(); return true; } },
            { key: 'Escape', run: (v) => { v.contentDOM.blur(); return true; } },
          ])
        ),
        basicSetup,
        keymap.of([indentWithTab]),
        language === 'sql' ? sql({ dialect: SQLite }) : python(),
        themeSlot.current.of(themeFor(theme)),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && latest.current.onChange) latest.current.onChange(u.state.doc.toString());
        }),
        EditorView.contentAttributes.of({ 'aria-label': label }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return () => {
      view.current.destroy();
      view.current = null;
    };
    // The editor is created once; later changes arrive through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    if (view.current) view.current.dispatch({ effects: themeSlot.current.reconfigure(themeFor(theme)) });
  }, [theme]);

  return <div className="editor-host" ref={host} />;
}
