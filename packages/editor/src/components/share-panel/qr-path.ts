/**
 * SVG-Pfad aus einer QR-Matrix: ein Quadrat pro dunklem Modul, zeilenweise zu
 * Laeufen zusammengefasst, damit der Pfad kurz bleibt.
 *
 * @param modules - Zeilen der Matrix, true = dunkel.
 * @returns Pfaddaten in Modul-Einheiten.
 */
export function qrPath(modules: readonly (readonly boolean[])[]): string {
  const commands: string[] = [];
  modules.forEach((row, rowIndex) => {
    let start = -1;
    row.forEach((dark, column) => {
      if (dark && start < 0) start = column;
      const endsRun = start >= 0 && (!dark || column === row.length - 1);
      if (!endsRun) return;
      const end = dark ? column + 1 : column;
      commands.push(`M${start} ${rowIndex}h${end - start}v1h${start - end}z`);
      start = -1;
    });
  });
  return commands.join('');
}
