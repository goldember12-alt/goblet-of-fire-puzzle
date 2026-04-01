import Phaser from 'phaser';
import { THEME } from '../core/theme';

export type PanelOptions = {
  fillColor?: number;
  fillAlpha?: number;
  strokeColor?: number;
  strokeAlpha?: number;
  label?: string;
  labelColor?: string;
};

export const createPanel = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: PanelOptions = {}
): Phaser.GameObjects.Rectangle => {
  const panel = scene.add
    .rectangle(
      x,
      y,
      width,
      height,
      options.fillColor ?? THEME.colors.panel,
      options.fillAlpha ?? 0.88
    )
    .setStrokeStyle(2, options.strokeColor ?? THEME.colors.gold, options.strokeAlpha ?? 0.3);

  if (options.label) {
    scene.add
      .text(x - width / 2 + 22, y - height / 2 + 18, options.label, {
        fontFamily: THEME.fonts.body,
        fontSize: '20px',
        color: options.labelColor ?? THEME.css.gold,
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);
  }

  return panel;
};
