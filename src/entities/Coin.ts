import * as Phaser from "phaser";

import { COIN_CONFIG } from "@/config/gameplayConfig";
import type { LevelCoinDefinition } from "@/content/levels/types";
import { RENDER_DEPTHS } from "@/shared/constants";
import { applyNormalizedBodyConfig } from "@/shared/physics/applyNormalizedBodyConfig";

export class Coin extends Phaser.Physics.Arcade.Sprite {
  private readonly scoreValue: number;

  public constructor(scene: Phaser.Scene, definition: LevelCoinDefinition) {
    super(scene, definition.x, definition.y, definition.textureKey);

    this.scoreValue = definition.scoreValue ?? COIN_CONFIG.defaultScoreValue;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(COIN_CONFIG.scale);
    this.setDepth(RENDER_DEPTHS.collectibles);

    const body = this.getBody();

    body.setAllowGravity(false);
    body.setImmovable(true);
    applyNormalizedBodyConfig(this, {
      heightRatio: COIN_CONFIG.bodyHeightRatio,
      offsetXRatio: COIN_CONFIG.offsetXRatio,
      offsetYRatio: COIN_CONFIG.offsetYRatio,
      widthRatio: COIN_CONFIG.bodyWidthRatio,
    });

    scene.tweens.add({
      duration: COIN_CONFIG.floatDurationMs,
      ease: "Sine.easeInOut",
      repeat: -1,
      targets: this,
      y: this.y - COIN_CONFIG.floatOffset,
      yoyo: true,
    });
  }

  public collect(): number {
    if (!this.active) {
      return 0;
    }

    this.scene.tweens.killTweensOf(this);
    this.disableBody(true, true);

    return this.scoreValue;
  }

  private getBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }
}
