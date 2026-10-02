# Faltstudio

Papierflieger in 3D Schritt für Schritt nachfalten – und die Tutorials dafür in
einem Editor bauen. Rigid Origami: Das Blatt zerfällt entlang der Faltlinien in
starre Flächen; jede Faltung ist eine Rotation um eine Achse im aktuellen Zustand.

**Ausprobieren:** [heartcoders.github.io/faltstudio](https://heartcoders.github.io/faltstudio/)

## Pakete

| Paket                | Inhalt                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `@faltstudio/core`   | Geometrie, Faltengine, Validierung, Dateiformat, Store. Frei von DOM; three.js nur unter `core/three`. |
| `@faltstudio/ui`     | Lit-Komponenten im Blueprint-Design (`fl-button`, `fl-dial`, `fl-scene`, …) und Tokens.                |
| `@faltstudio/editor` | Editor: Foto entzerren, Linien zeichnen, Schritte planen, Vorschau, JSON/FOLD.                         |
| `@faltstudio/viewer` | Viewer `<fl-viewer>`: als Seite oder eingebettet, Falten per Ziehen.                                   |

## Loslegen

```sh
pnpm install
pnpm dev            # Studio :5173 (Start, Editor, Ansicht), Viewer-Entwicklung :5174
pnpm test           # Core (Node), UI (Chromium), Editor
pnpm typecheck && pnpm lint && pnpm format:check
pnpm build
```

UI-Tests laufen im Browser-Modus von Vitest; einmalig
`npx playwright install chromium` im Paket `packages/ui`.

## Studio

- `/` – Startseite: eigene Modelle und Beispiele, ansehen, bearbeiten, neu, Datei öffnen.
- `/editor.html?model=…` · `?example=…` · `?new` – Editor. Er speichert laufend in die lokale
  Bibliothek (IndexedDB); Beispiele werden nie überschrieben, sondern als Kopie bearbeitet.
- `/view.html?model=…` – Ansicht im Viewer, mit Links zurück und zum Bearbeiten.

Unter 48 rem Breite (Handy) schaltet das Studio auf die mobile Anordnung (Design v2, M1–M8):
Werkzeugleiste und Sheet unten im Daumenbereich, Datei und Befunde als Sheets. Auf der
Zeichenfläche zielt eine Lupe 60 px über dem Finger, gesetzt wird beim Loslassen; zwei Finger
zoomen und verschieben.

Alle drei Seiten liegen unter einem Ursprung, sonst sähen sie nicht dieselbe Bibliothek.
Ohne Backend bleiben Modelle im Browser. Zum Weitergeben _Fertig · Teilen · QR-Code_ (auch
im Kartenmenü ⋯ und unter _Datei_): Der Link `view.html#m=…` enthält das ganze Modell,
komprimiert (deflate-raw, base64url), ohne Foto. Das Fragment geht an keinen Server. Wer den
Link öffnet, sieht die Anleitung; _Bearbeiten_ legt eine eigene Kopie in der Bibliothek an.
Bis etwa 2,9 kB passt der Link in einen QR-Code, darüber gibt es nur den Link.

## Beispiel

`examples/dart-a4.json` ist der klassische Pfeil auf A4 in acht Schritten. Die
Datei wird erzeugt, nicht von Hand gepflegt:

```sh
pnpm --filter @faltstudio/core example:dart
```

Die Linien der Schritte 1–6 sind hergeleitet (`packages/core/test/fixtures/dart.ts`),
die Flügellinien entstehen aus dem gefalteten Zustand, indem eine Gerade durch
alle Lagen verfolgt wird.

## Weiter

- [Viewer einbetten](docs/embedding.md)
- Design: Blueprint, strikt schwarz/grau; Zustände über Helligkeit, Strichstärke,
  Strichmuster und Invertierung, nie über Farbe.

## Lizenz

[MIT](LICENSE) © 2026 Philipp Jordan (heartcoders)
