import Phaser from 'phaser';
import { THEME } from '../core/theme';

export const drawSceneBackdrop = (scene: Phaser.Scene): void => {
  const { width, height } = scene.scale;

  const background = scene.add.graphics();
  background.fillGradientStyle(
    THEME.colors.midnight,
    THEME.colors.midnight,
    THEME.colors.canopy,
    0x030705,
    1
  );
  background.fillRect(0, 0, width, height);

  for (let index = 0; index < 7; index += 1) {
    const hedgeWidth = width / 2.2 + index * 44;
    const hedgeHeight = 210 + index * 30;
    const hedgeX = width * 0.16 + index * 170;
    const hedgeY = height * 0.82 + (index % 2) * 14;

    scene.add
      .ellipse(hedgeX, hedgeY, hedgeWidth, hedgeHeight, THEME.colors.moss, 0.14)
      .setAngle(index * 5 - 12);
  }

  scene.add
    .ellipse(width * 0.18, height * 0.2, 360, 180, THEME.colors.mist, 0.06)
    .setBlendMode(Phaser.BlendModes.SCREEN);
  scene.add
    .ellipse(width * 0.82, height * 0.18, 300, 200, THEME.colors.gold, 0.05)
    .setBlendMode(Phaser.BlendModes.SCREEN);
  scene.add
    .ellipse(width * 0.74, height * 0.72, 420, 180, THEME.colors.mist, 0.04)
    .setBlendMode(Phaser.BlendModes.SCREEN);

  scene.add.rectangle(width / 2, height / 2, width - 26, height - 26).setStrokeStyle(
    2,
    THEME.colors.gold,
    0.16
  );
};
