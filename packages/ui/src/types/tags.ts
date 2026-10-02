import type { Button } from '../components/button/button.js';
import type { Scene } from '../components/scene/scene.js';
import type { Segmented } from '../components/segmented/segmented.js';
import type { Segment } from '../components/segmented/segment.js';
import type { Slider } from '../components/slider/slider.js';
import type { Dial } from '../components/dial/dial.js';
import type { StepCard } from '../components/step-card/step-card.js';
import type { Issue } from '../components/issue/issue.js';
import type { Readout } from '../components/readout/readout.js';
import type { Panel } from '../components/panel/panel.js';
import type { Legend } from '../components/legend/legend.js';
import type { TextField } from '../components/text-field/text-field.js';
import type { Checkbox } from '../components/checkbox/checkbox.js';
import type { StepTrack } from '../components/step-track/step-track.js';
import type { Sheet } from '../components/sheet/sheet.js';
import type { LocaleSwitch } from '../components/locale-switch/locale-switch.js';

declare global {
  interface HTMLElementTagNameMap {
    'fl-button': Button;
    'fl-scene': Scene;
    'fl-segmented': Segmented;
    'fl-segment': Segment;
    'fl-slider': Slider;
    'fl-dial': Dial;
    'fl-step-card': StepCard;
    'fl-issue': Issue;
    'fl-readout': Readout;
    'fl-panel': Panel;
    'fl-legend': Legend;
    'fl-text-field': TextField;
    'fl-checkbox': Checkbox;
    'fl-step-track': StepTrack;
    'fl-sheet': Sheet;
    'fl-locale-switch': LocaleSwitch;
  }
}

export type FlElementTagNameMap = Pick<
  HTMLElementTagNameMap,
  | 'fl-button'
  | 'fl-scene'
  | 'fl-segmented'
  | 'fl-segment'
  | 'fl-slider'
  | 'fl-dial'
  | 'fl-step-card'
  | 'fl-issue'
  | 'fl-readout'
  | 'fl-panel'
  | 'fl-legend'
  | 'fl-text-field'
  | 'fl-checkbox'
  | 'fl-step-track'
  | 'fl-sheet'
  | 'fl-locale-switch'
>;
