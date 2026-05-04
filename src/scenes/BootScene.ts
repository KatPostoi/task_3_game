import * as Phaser from "phaser";

import { SCENE_BACKGROUND_COLOR, SCENE_KEYS } from "@/shared/constants";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super(SCENE_KEYS.boot);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(SCENE_BACKGROUND_COLOR);
    this.input.setDefaultCursor("default");
    this.scene.start(SCENE_KEYS.preload);
  }
}
