import Phaser from 'phaser';
import { THEME } from '../core/theme';

export type ButtonOptions = {
  fillColor?: number;
  hoverColor?: number;
  disabledColor?: number;
  textColor?: string;
  fontSize?: string;
};

export type TextButton = Phaser.GameObjects.Container & {
  setEnabled: (enabled: boolean) => void;
  setLabel: (label: string) => void;
};

export const createTextButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  options: ButtonOptions = {}
): TextButton => {
  const fillColor = options.fillColor ?? THEME.colors.panelAlt;
  const hoverColor = options.hoverColor ?? THEME.colors.moss;
  const disabledColor = options.disabledColor ?? THEME.colors.stone;

  const glow = scene.add.rectangle(0, 0, width + 10, height + 10, THEME.colors.gold, 0.07);
  const background = scene.add
    .rectangle(0, 0, width, height, fillColor, 0.96)
    .setStrokeStyle(2, THEME.colors.gold, 0.4);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: THEME.fonts.body,
      fontSize: options.fontSize ?? '24px',
      color: options.textColor ?? THEME.css.parchment,
      align: 'center',
      wordWrap: { width: width - 28 }
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [glow, background, text]) as TextButton;
  container.setSize(width, height);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );

  let enabled = true;

  const applyVisualState = (state: 'default' | 'hover' | 'disabled') => {
    if (state === 'hover') {
      background.setFillStyle(hoverColor, 0.98);
      background.setStrokeStyle(2, THEME.colors.gold, 0.75);
      glow.setAlpha(0.16);
      return;
    }

    if (state === 'disabled') {
      background.setFillStyle(disabledColor, 0.8);
      background.setStrokeStyle(2, THEME.colors.gold, 0.16);
      glow.setAlpha(0.03);
      return;
    }

    background.setFillStyle(fillColor, 0.96);
    background.setStrokeStyle(2, THEME.colors.gold, 0.4);
    glow.setAlpha(0.07);
  };

  container.on('pointerover', () => {
    if (enabled) {
      applyVisualState('hover');
    }
  });

  container.on('pointerout', () => {
    if (enabled) {
      applyVisualState('default');
    }
  });

  container.on('pointerdown', () => {
    if (!enabled) {
      return;
    }

    scene.tweens.add({
      targets: container,
      scaleX: 0.985,
      scaleY: 0.985,
      yoyo: true,
      duration: 90
    });
    onClick();
  });

  container.setEnabled = (nextEnabled: boolean) => {
    enabled = nextEnabled;

    if (container.input) {
      container.input.enabled = nextEnabled;
    }

    container.setAlpha(nextEnabled ? 1 : 0.68);
    applyVisualState(nextEnabled ? 'default' : 'disabled');
  };

  container.setLabel = (nextLabel: string) => {
    text.setText(nextLabel);
  };

  applyVisualState('default');

  return container;
};
