/** Bietet Text als Datei-Download an. */
export function downloadText(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

/** Dateiname aus dem Titel: "Pfeil (Dart)" -> "pfeil-dart.json". */
export function fileNameFor(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'faltmuster'}.json`;
}

/** Oeffnet den Dateidialog und liefert den Text der gewaehlten Datei, oder undefined bei Abbruch. */
export function pickTextFile(accept = '.json,application/json'): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(undefined);
      file.text().then(resolve, reject);
    });
    input.addEventListener('cancel', () => resolve(undefined));
    input.click();
  });
}

/** Dateidialog fuer eine einzelne Datei; undefined bei Abbruch. */
export function pickFile(
  accept: string,
  capture?: 'environment' | 'user',
): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept });
    // Mobil: direkt die Kamera oeffnen statt der Dateiauswahl.
    if (capture) input.setAttribute('capture', capture);
    input.addEventListener('change', () => resolve(input.files?.[0]));
    input.addEventListener('cancel', () => resolve(undefined));
    input.click();
  });
}
