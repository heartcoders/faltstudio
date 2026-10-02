import { afterEach, describe, expect, it } from 'vitest';
import { SHEET_A4, createDocument } from '@faltstudio/core';
import { setLocale } from '@faltstudio/ui';
import { Editor } from './editor.js';
import { collectIssues } from './issues.js';

const editorWithLooseLine = (): Editor => {
  const editor = new Editor(createDocument(SHEET_A4, 'Test', '2026-10-02'));
  editor.updateUi({ symmetry: false });
  editor.drawLine([20, 100], [60, 150]);
  return editor;
};

const looseTitles = (editor: Editor): readonly string[] =>
  collectIssues(editor)
    .filter((issue) => issue.key.startsWith('pattern-'))
    .map((issue) => issue.title);

afterEach(() => setLocale('de'));

describe('collectIssues', () => {
  it('uebersetzt Muster-Befunde aus core nach Code', () => {
    const editor = editorWithLooseLine();
    expect(looseTitles(editor)).toContain('L1 offen');
    setLocale('en');
    expect(looseTitles(editor)).toContain('L1 loose');
    expect(collectIssues(editor).find((issue) => issue.title === 'L1 loose')?.message).toBe(
      'Ends freely and bounds no area',
    );
  });

  it('legt neue Schritte mit Platzhalter in der aktuellen Sprache an', () => {
    setLocale('en');
    const editor = editorWithLooseLine();
    editor.steps.add();
    expect(editor.steps.step?.title).toBe('New step');
  });
});
