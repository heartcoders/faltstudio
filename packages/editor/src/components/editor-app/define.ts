import '@faltstudio/ui/button';
import '@faltstudio/ui/segmented';
import '@faltstudio/ui/slider';
import '@faltstudio/ui/dial';
import '@faltstudio/ui/step-card';
import '@faltstudio/ui/issue';
import '@faltstudio/ui/readout';
import '@faltstudio/ui/panel';
import '@faltstudio/ui/legend';
import '@faltstudio/ui/text-field';
import '@faltstudio/ui/checkbox';
import '@faltstudio/ui/step-track';
import { define } from '@faltstudio/ui';
import { EditorApp } from './editor-app.js';
import '../editor-header/define.js';
import '../status-bar/define.js';
import '../issues-panel/define.js';
import '../mobile-head/define.js';
import '../done-sheet/define.js';
import '@faltstudio/ui/sheet';
import '../mode-photo/define.js';
import '../mode-lines/define.js';
import '../mode-steps/define.js';
import '../mode-preview/define.js';

define('editor-app', EditorApp);

/** three.js und die Szene als eigener Chunk; der Editor steht vorher. */
void import('@faltstudio/ui/scene');

export { EditorApp };
