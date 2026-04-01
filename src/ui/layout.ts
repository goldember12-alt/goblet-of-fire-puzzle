import Phaser from 'phaser';

export type SceneLayoutMetrics = {
  width: number;
  height: number;
  padding: number;
  gap: number;
  headerHeight: number;
  footerHeight: number;
  contentTop: number;
  contentBottom: number;
  usableWidth: number;
  usableHeight: number;
  isCompact: boolean;
};

export const getSceneLayoutMetrics = (
  scene: Phaser.Scene | { scale: { width: number; height: number } }
): SceneLayoutMetrics => {
  const { width, height } = scene.scale;
  const padding = Phaser.Math.Clamp(Math.round(width * 0.03), 22, 42);
  const gap = Phaser.Math.Clamp(Math.round(width * 0.016), 16, 28);
  const headerHeight = Phaser.Math.Clamp(Math.round(height * 0.16), 126, 156);
  const footerHeight = Phaser.Math.Clamp(Math.round(height * 0.12), 96, 124);

  return {
    width,
    height,
    padding,
    gap,
    headerHeight,
    footerHeight,
    contentTop: padding + headerHeight,
    contentBottom: height - padding - footerHeight,
    usableWidth: width - padding * 2,
    usableHeight: height - padding * 2,
    isCompact: width < 1260 || height < 820
  };
};

export const fitIntoBox = (
  baseWidth: number,
  baseHeight: number,
  targetWidth: number,
  targetHeight: number,
  maxScale = 1
): number => Math.min(targetWidth / baseWidth, targetHeight / baseHeight, maxScale);
