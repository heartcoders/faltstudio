import { nothing } from 'lit';
import { OPEN } from '../config.js';

/**
 * Die EINZIGE Datei, in der `part=`-Namen erzeugt werden. Im Lockdown liefert
 * das `nothing` und Lit entfernt das Attribut komplett.
 */
export const part = (...names: readonly string[]) => (OPEN ? names.join(' ') : nothing);
