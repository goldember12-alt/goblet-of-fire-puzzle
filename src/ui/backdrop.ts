import Phaser from 'phaser';
import { THEME } from '../core/theme';

export const drawSceneBackdrop = (scene: Phaser.Scene): void => {
  const background = scene.add.graphics();
  const foreground = scene.add.graphics();
  const mistEllipses = [
    scene.add.ellipse(0, 0, 0, 0, THEME.colors.mist, 0.06).setBlendMode(Phaser.BlendModes.SCREEN),
    scene.add.ellipse(0, 0, 0, 0, THEME.colors.gold, 0.05).setBlendMode(Phaser.BlendModes.SCREEN),
    scene.add.ellipse(0, 0, 0, 0, THEME.colors.mist, 0.04).setBlendMode(Phaser.BlendModes.SCREEN)
  ];

  const redraw = () => {
    const { width, height } = scene.scale;

    background.clear();
    foreground.clear();

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

      foreground.fillStyle(THEME.colors.moss, 0.14);
      foreground.fillEllipse(hedgeX, hedgeY, hedgeWidth, hedgeHeight);
    }

    mistEllipses[0].setPosition(width * 0.18, height * 0.2).setSize(360, 180);
    mistEllipses[1].setPosition(width * 0.82, height * 0.18).setSize(300, 200);
    mistEllipses[2].setPosition(width * 0.74, height * 0.72).setSize(420, 180);

    foreground.lineStyle(2, THEME.colors.gold, 0.16);
    foreground.strokeRect(13, 13, width - 26, height - 26);
  };

  redraw();

  const resizeHandler = () => redraw();
  scene.scale.on(Phaser.Scale.Events.RESIZE, resizeHandler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, resizeHandler);
  });
};
