import '@faltstudio/ui/button';
import '@faltstudio/ui/panel';
import '@faltstudio/ui/locale-switch';
import '@faltstudio/ui/step-track';
import { define } from '@faltstudio/ui';
import { Viewer } from './viewer.js';

define('viewer', Viewer);

/** three.js und die Szene kommen als eigener Chunk nach; die Oberflaeche steht vorher. */
void import('@faltstudio/ui/scene');

export { Viewer };
