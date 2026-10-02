/** Bis zu so vielen Blaettern liegt der Faecher auf dem Desktop fest, darueber folgt er der Auswahl. */
export const DESKTOP_FIXED_FAN = 8;
/** Mobil sind nur so viele Nachbarn je Seite sichtbar. */
const MOBILE_REACH = 3;
const DESKTOP_REACH = 4.5;

/** Lage eines Blatts im Faecher, als Zahlen fuer die CSS-Rechnung. */
export interface FanPlacement {
  /** Abstand zur Auswahl, mobil: der Faecher wandert mit. */
  readonly shift: number;
  /** Abstand zur Mitte des Faechers, Desktop. */
  readonly spread: number;
  readonly zMobile: number;
  readonly zDesktop: number;
  readonly hiddenMobile: boolean;
  readonly hiddenDesktop: boolean;
}

function desktopCenter(count: number, selected: number): number {
  return count <= DESKTOP_FIXED_FAN ? (count - 1) / 2 : selected;
}

/**
 * Lage eines Blatts im Faecher der Startseite (Design R1/D1).
 *
 * @param index - Position des Blatts.
 * @param selected - Position des gewaehlten Blatts.
 * @param count - Anzahl der Blaetter im Faecher.
 * @returns Versatz, Stapelhoehe und Sichtbarkeit fuer mobil und Desktop.
 */
export function fanPlacement(index: number, selected: number, count: number): FanPlacement {
  const shift = index - selected;
  const spread = index - desktopCenter(count, selected);
  const lifted = shift === 0;
  return {
    shift,
    spread,
    zMobile: 40 - Math.abs(shift) * 5,
    zDesktop: lifted ? 30 + count : 10 + index,
    hiddenMobile: Math.abs(shift) > MOBILE_REACH,
    hiddenDesktop: Math.abs(spread) > DESKTOP_REACH,
  };
}

/**
 * Naechste Auswahl nach Taste oder Wischen, an den Enden festgehalten.
 *
 * @param selected - Bisher gewaehltes Blatt.
 * @param delta - Schritt, negativ nach links.
 * @param count - Anzahl der Blaetter.
 * @returns Neue Position zwischen 0 und count - 1.
 */
export const clampSelection = (selected: number, delta: number, count: number): number =>
  Math.max(0, Math.min(count - 1, selected + delta));
