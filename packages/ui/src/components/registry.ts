import { Button } from './button/button.js';
import { Scene } from './scene/scene.js';
import { Segmented } from './segmented/segmented.js';
import { Segment } from './segmented/segment.js';
import { Slider } from './slider/slider.js';
import { Dial } from './dial/dial.js';
import { StepCard } from './step-card/step-card.js';
import { Issue } from './issue/issue.js';
import { Readout } from './readout/readout.js';
import { Panel } from './panel/panel.js';
import { Legend } from './legend/legend.js';
import { TextField } from './text-field/text-field.js';
import { Checkbox } from './checkbox/checkbox.js';
import { StepTrack } from './step-track/step-track.js';
import { Sheet } from './sheet/sheet.js';
import { LocaleSwitch } from './locale-switch/locale-switch.js';

/**
 * Alle Komponenten, Tagname OHNE Prefix -> Klasse. Seiteneffektfrei.
 * Neue Komponenten hier, in `types/tags.ts`, `define.ts` und der Exports-Map eintragen.
 */
export const components = {
  button: Button,
  scene: Scene,
  segmented: Segmented,
  segment: Segment,
  slider: Slider,
  dial: Dial,
  'step-card': StepCard,
  issue: Issue,
  readout: Readout,
  panel: Panel,
  legend: Legend,
  'text-field': TextField,
  checkbox: Checkbox,
  'step-track': StepTrack,
  sheet: Sheet,
  'locale-switch': LocaleSwitch,
} as const;

export type ComponentName = keyof typeof components;
