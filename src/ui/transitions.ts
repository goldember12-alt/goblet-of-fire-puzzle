import Phaser from 'phaser';

const FADE_RGB = { r: 7, g: 17, b: 13 };

export const playSceneEnter = (scene: Phaser.Scene, duration = 180): void => {
  scene.cameras.main.fadeIn(duration, FADE_RGB.r, FADE_RGB.g, FADE_RGB.b);
};

export const fadeToScene = (
  scene: Phaser.Scene,
  targetScene: string,
  beforeStart?: () => void,
  duration = 180
): void => {
  const camera = scene.cameras.main;

  if (camera.fadeEffect.isRunning) {
    return;
  }

  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    beforeStart?.();
    scene.scene.start(targetScene);
  });

  camera.fadeOut(duration, FADE_RGB.r, FADE_RGB.g, FADE_RGB.b);
};
