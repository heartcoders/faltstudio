import '@faltstudio/ui/locale-switch';
import '@faltstudio/ui/sheet';
import { define } from '@faltstudio/ui';
import { StartPage } from './start-page.js';
import { StartPicker } from './start-picker.js';
import '../crease-canvas/define.js';
import '../model-turntable/define.js';
import '../share-panel/define.js';

define('start-picker', StartPicker);
define('start-page', StartPage);

export { StartPage, StartPicker };
