import { afterEach, describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh } from 'three';
import { expectAccessible, mount } from '../../internal/testing.js';
import './define.js';
import type { Scene } from './scene.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('fl-scene', () => {
  it('rendert ein Canvas mit zugaenglichem Namen', async () => {
    const el = await mount<Scene>('<fl-scene></fl-scene>');
    expect(el.shadowRoot?.querySelector('canvas')).toBeTruthy();
    await expectAccessible(el);
  });

  it('hat als einzige Komponente eine eigene Box', async () => {
    const el = await mount<Scene>('<fl-scene></fl-scene>');
    expect(getComputedStyle(el).display).toBe('block');
  });

  it('klemmt ungueltige Blattmasse auf den Default', async () => {
    const el = await mount<Scene>('<fl-scene sheet-width="abc" sheet-height="0"></fl-scene>');
    expect(el.sheetWidth).toBe(210);
    expect(el.sheetHeight).toBe(1);
  });

  it('nimmt eigenen Inhalt an und passt die Kamera ein, auch vor dem ersten Rendern', async () => {
    const el = document.createElement('fl-scene');
    const content = new Mesh(new BoxGeometry(10, 10, 10));
    el.setContent(content);
    document.body.append(el);
    await el.updateComplete;
    expect(content.parent).toBeTruthy();
    expect(() => el.fitContent()).not.toThrow();
  });
});
