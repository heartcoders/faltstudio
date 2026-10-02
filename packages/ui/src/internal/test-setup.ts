import { applyDocumentStyles } from '../styles/document.js';
import { setLocale } from '../i18n/locale.js';

/** Die Komponenten sind fuer den dunklen Blueprint-Grund gebaut, axe prueft Kontrast dagegen. */
applyDocumentStyles();

/** Tests pruefen die deutschen Texte, unabhaengig von der Sprache des Test-Browsers. */
setLocale('de');
