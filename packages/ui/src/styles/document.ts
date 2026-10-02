import { css } from 'lit';
import { t } from '../internal/tokens.js';

/**
 * Grundstil fuer das Dokument einer App (Editor, Viewer-Standalone). Nicht fuer
 * die eingebettete Variante: dort gehoert das Dokument der Gastseite.
 */
const documentStyles = css`
  html,
  body {
    margin: 0;
    block-size: 100%;
    background-color: ${t('fill')};
    color: ${t('text')};
    font-family: ${t('font-mono')};
    font-size: ${t('text-body')};
    line-height: ${t('line-height')};
    -webkit-font-smoothing: antialiased;
    color-scheme: dark;
  }
`;

export function applyDocumentStyles(target: Document = document): void {
  const sheet = documentStyles.styleSheet;
  if (!sheet || target.adoptedStyleSheets.includes(sheet)) return;
  target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
}
