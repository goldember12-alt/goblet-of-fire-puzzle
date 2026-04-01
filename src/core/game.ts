import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './theme';
import { BootScene } from '../scenes/BootScene';
import { TitleScene } from '../scenes/TitleScene';
import { IntroScene } from '../scenes/IntroScene';
import { MiniPuzzleScene } from '../scenes/MiniPuzzleScene';
import { MazeScene } from '../scenes/MazeScene';
import { ResultsScene } from '../scenes/ResultsScene';

export const createGame = (): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#07110d',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT
    },
    scene: [
      BootScene,
      TitleScene,
      IntroScene,
      MiniPuzzleScene,
      MazeScene,
      ResultsScene
    ]
  });
