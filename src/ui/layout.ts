import Phaser from 'phaser';

export const OVERLAY_STACK_BREAKPOINT = 1180;

export type WorldFrameMetrics = {
  width: number;
  height: number;
  padding: number;
  gap: number;
  isStacked: boolean;
  sidebarWidth: number;
  contentLeft: number;
  contentRight: number;
  contentTop: number;
  contentBottom: number;
  contentWidth: number;
  contentHeight: number;
  centerX: number;
  centerY: number;
};

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

export const fitIntoBox = (
  baseWidth: number,
  baseHeight: number,
  targetWidth: number,
  targetHeight: number,
  maxScale = 1
): number => Math.min(targetWidth / baseWidth, targetHeight / baseHeight, maxScale);

export const getWorldFrame = (
  scene: Phaser.Scene | { scale: { width: number; height: number } },
  options: { reserveSidebar?: boolean } = {}
): WorldFrameMetrics => {
  const { width, height } = scene.scale;
  const padding = Phaser.Math.Clamp(Math.round(width * 0.022), 20, 30);
  const gap = Phaser.Math.Clamp(Math.round(width * 0.015), 18, 24);
  const isStacked = width < OVERLAY_STACK_BREAKPOINT;
  const sidebarWidth = options.reserveSidebar && !isStacked ? Phaser.Math.Clamp(Math.round(width * 0.31), 340, 440) : 0;

  const contentLeft = padding;
  const contentRight = width - padding - sidebarWidth - (sidebarWidth > 0 ? gap : 0);
  const contentTop = padding;
  const contentBottom = height - padding;
  const contentWidth = Math.max(280, contentRight - contentLeft);
  const contentHeight = Math.max(280, contentBottom - contentTop);

  return {
    width,
    height,
    padding,
    gap,
    isStacked,
    sidebarWidth,
    contentLeft,
    contentRight,
    contentTop,
    contentBottom,
    contentWidth,
    contentHeight,
    centerX: contentLeft + contentWidth / 2,
    centerY: contentTop + contentHeight / 2
  };
};

export const getSceneLayoutMetrics = (
  scene: Phaser.Scene | { scale: { width: number; height: number } }
): SceneLayoutMetrics => {
  const frame = getWorldFrame(scene);
  const headerHeight = Phaser.Math.Clamp(Math.round(frame.height * 0.15), 120, 170);
  const footerHeight = Phaser.Math.Clamp(Math.round(frame.height * 0.11), 92, 128);

  return {
    width: frame.width,
    height: frame.height,
    padding: frame.padding,
    gap: frame.gap,
    headerHeight,
    footerHeight,
    contentTop: frame.padding + headerHeight,
    contentBottom: frame.height - frame.padding - footerHeight,
    usableWidth: frame.width - frame.padding * 2,
    usableHeight: frame.height - frame.padding * 2,
    isCompact: frame.width < 1360 || frame.height < 860
  };
};
