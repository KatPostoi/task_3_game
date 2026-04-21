import * as Phaser from "phaser";

import { PHYSICS_CONFIG } from "@/config/physicsConfig";
import { BootScene } from "@/scenes/BootScene";
import { GameScene } from "@/scenes/GameScene";
import { IntroScene } from "@/scenes/IntroScene";
import { PreloadScene } from "@/scenes/PreloadScene";
import { UiScene } from "@/scenes/UiScene";
import {
  GAME_BACKGROUND_COLOR,
  GAME_DIMENSIONS,
  GAME_TITLE,
} from "@/shared/constants";

export const createGameConfig = (
  parentId: string,
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  title: GAME_TITLE,
  parent: parentId,
  width: GAME_DIMENSIONS.width,
  height: GAME_DIMENSIONS.height,
  backgroundColor: GAME_BACKGROUND_COLOR,
  render: {
    antialias: true,
    pixelArt: false,
  },
  physics: PHYSICS_CONFIG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_DIMENSIONS.width,
    height: GAME_DIMENSIONS.height,
  },
  scene: [BootScene, PreloadScene, IntroScene, GameScene, UiScene],
});
