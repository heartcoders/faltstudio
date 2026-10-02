# Viewer einbetten

Der Viewer ist ein Web Component: `<fl-viewer>`. Er lädt ein Tutorial als JSON,
zeigt es in 3D und lässt es Schritt für Schritt falten – per Ziehen an der
beweglichen Seite oder per „Weiter“.

## Schnellstart

```html
<script type="module" src="https://example.org/faltstudio/fl-viewer.js"></script>

<fl-viewer embedded src="/tutorials/pfeil-dart.json"></fl-viewer>
```

`pnpm --filter @faltstudio/viewer build` erzeugt zwei Dinge:

- `dist/` – die Standalone-Seite (`index.html`) und eine Demo-Einbettung (`embed.html`).
- `dist/embed/` – `fl-viewer.js` für Gastseiten plus nachgeladene Chunks. Den
  ganzen Ordner auf denselben Pfad legen; `fl-viewer.js` lädt die Chunks relativ.

three.js kommt erst, wenn ein Tutorial geladen ist. Der erste Teil ist rund
23 kB (gzip), die Seite steht also, bevor die 3D-Szene da ist.

Die JSON-Datei entsteht im Editor über **Datei · Speichern · JSON**.

## Attribute

| Attribut   | Typ       | Wirkung                                                                                                                      |
| ---------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src`      | URL       | Tutorial-Datei. Wird bei jeder Änderung neu geladen und geprüft.                                                             |
| `embedded` | boolean   | Kompaktes Widget (S7): eigene Kopfzeile, Seitenverhältnis 720 : 440.                                                         |
| `lang`     | `de`/`en` | Sprache der Bedienung für dieses Widget. Ohne Angabe die zuletzt gewählte Sprache, sonst die Browsersprache, sonst Englisch. |

Die Sprache betrifft nur die Bedienung (Knöpfe, Status, Hinweise). Titel und
Texte der Schritte stammen aus der Tutorial-Datei und bleiben, wie sie dort
stehen. `lang` wird nicht gespeichert und ändert nichts an der Gastseite;
Werte wie `de-AT` gelten als `de`, unbekannte Sprachen fallen auf die
Browsersprache zurück.

Ohne `embedded` füllt der Viewer die Höhe des Fensters (`100dvh`) und stellt
sich unter 48rem Breite auf das mobile Layout um (Container Query, nicht
Media Query – er reagiert auf seine eigene Breite).

## Events

Alle Events sind `bubbles` und `composed`, kommen also auch aus Shadow Roots an.

| Event        | `detail`           | Wann                                        |
| ------------ | ------------------ | ------------------------------------------- |
| `stepchange` | `{ index, count }` | Ein Schritt beginnt (auch „Zurück“, Reset). |
| `complete`   | `{ count }`        | Der letzte Schritt ist eingerastet.         |

```js
document.querySelector('fl-viewer').addEventListener('complete', () => {
  analytics.track('flieger-gefaltet');
});
```

## Bedienung

- **Ziehen:** Maus oder ein Finger an der beweglichen Seite oder am Greifring.
  Ab 90 % des Zielwinkels rastet die Faltung beim Loslassen ein, sonst federt sie zurück.
- **Kamera:** Ziehen neben dem Blatt dreht (Maus), Mausrad zoomt. Auf Touch:
  zwei Finger drehen und zoomen, ein Finger faltet.
- **Weiter:** faltet den aktuellen Schritt zu Ende und wechselt dann zum nächsten. Wer schon selbst eingerastet hat, geht direkt weiter. ▶ führt den Schritt vor, ohne weiterzugehen.

## Aussehen anpassen

Die Komponenten laufen im Modus `locked`: Das Innenleben ist gegen fremdes CSS
geschützt, die Gastseite kann aber alle Design-Tokens überschreiben. Namen und
Standardwerte stehen in `packages/ui/src/tokens/tokens.ts`.

```css
fl-viewer {
  --t-fill: #101418;
  --t-paper: #f2efe6;
  --t-font-mono: 'IBM Plex Mono', monospace;
}
```

Das Host-Element selbst ist frei gestaltbar (`margin`, `max-inline-size` usw.).

## Dateiformat

Ein Tutorial ist JSON mit `formatVersion`, `meta`, `sheet` (mm), atomaren
`vertices` und `creases` sowie `steps`. Jede Faltung nennt ihre `creaseIds`,
einen `movingPoint` auf der beweglichen Seite (mm im flachen Blatt) und den
`angle` in Grad (positiv = Tal, negativ = Berg). Flächen und 3D-Zustände werden
beim Laden neu berechnet. `reference` (Foto-Vorlage) ignoriert der Viewer.

Fehlerhafte Dateien zeigt der Viewer mit Pfadangaben an, etwa
`creases[3].kind: muss border | mountain | valley | flat sein`.
