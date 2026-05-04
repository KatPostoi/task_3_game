import * as Phaser from "phaser";

import { LIVES_CONFIG } from "@/config/gameplayConfig";
import { IMAGE_ASSETS } from "@/content/assets";
import { level1 } from "@/content/levels/level1";
import type { GameplayBootstrapData } from "@/scenes/sceneData";
import {
  GAME_DIMENSIONS,
  GAME_TITLE,
  SCENE_ACCENT_COLOR,
  SCENE_BACKGROUND_COLOR,
  SCENE_KEYS,
  SCENE_MUTED_COLOR,
  SCENE_TEXT_COLOR,
} from "@/shared/constants";
import { GameFlowController } from "@/systems/GameFlowController";
import { createGameSession } from "@/systems/GameSession";

export class PreloadScene extends Phaser.Scene {
  private readonly flowController = new GameFlowController();

  public constructor() {
    super(SCENE_KEYS.preload);
  }

  public init(): void {
    this.flowController.enterLoading();
  }

  public preload(): void {
    this.cameras.main.setBackgroundColor(SCENE_BACKGROUND_COLOR);

    const { width, height } = GAME_DIMENSIONS;
    const progressLabel = this.add
      .text(width / 2, height / 2 - 64, GAME_TITLE, {
        color: SCENE_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: "52px",
      })
      .setOrigin(0.5);

    const statusLabel = this.add
      .text(width / 2, height / 2 + 8, "Loading reference assets... 0%", {
        color: SCENE_ACCENT_COLOR,
        fontFamily: "monospace",
        fontSize: "24px",
      })
      .setOrigin(0.5);

    const detailsLabel = this.add
      .text(
        width / 2,
        height / 2 + 56,
        `${IMAGE_ASSETS.length} assets queued for ${level1.name} bootstrap`,
        {
          color: SCENE_MUTED_COLOR,
          fontFamily: "monospace",
          fontSize: "18px",
        },
      )
      .setOrigin(0.5);

    const handleProgress = (value: number): void => {
      statusLabel.setText(
        `Loading reference assets... ${Math.round(value * 100)}%`,
      );
    };

    const handleFileProgress = (file: { readonly key?: string }): void => {
      if (!file.key) {
        return;
      }

      detailsLabel.setText(`Preparing ${file.key}`);
    };

    this.load.on("progress", handleProgress);
    this.load.on("fileprogress", handleFileProgress);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.load.off("progress", handleProgress);
      this.load.off("fileprogress", handleFileProgress);
    });

    for (const asset of IMAGE_ASSETS) {
      this.load.image(asset.key, asset.path);
    }

    progressLabel.setAlpha(1);
  }

  public create(): void {
    const session = createGameSession({
      initialLives: LIVES_CONFIG.initialLives,
      levelKey: level1.key,
      levelName: level1.name,
      totalCoins: level1.coins.length,
    });

    const data: GameplayBootstrapData = {
      flowState: this.flowController.enterStart(),
      session,
    };

    this.scene.start(SCENE_KEYS.intro, data);
  }
}
