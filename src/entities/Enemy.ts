import * as Phaser from "phaser";

import { ENEMY_CONFIG } from "@/config/gameplayConfig";
import type { LevelEnemyDefinition } from "@/content/levels/types";
import { RENDER_DEPTHS } from "@/shared/constants";
import { applyNormalizedBodyConfig } from "@/shared/physics/applyNormalizedBodyConfig";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private direction: -1 | 1 = 1;
  private readonly initialX: number;
  private readonly patrolDistance: number;
  private readonly patrolSpeed: number;

  public constructor(scene: Phaser.Scene, definition: LevelEnemyDefinition) {
    super(scene, definition.x, definition.y, definition.textureKey);

    this.initialX = definition.x;
    this.patrolDistance =
      definition.patrolDistance ?? ENEMY_CONFIG.defaultPatrolDistance;
    this.patrolSpeed = definition.speed ?? ENEMY_CONFIG.defaultSpeed;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(definition.scale ?? ENEMY_CONFIG.defaultScale);
    this.setDepth(RENDER_DEPTHS.enemies);
    this.setCollideWorldBounds(true);

    const body = this.getBody();

    body.setBounce(0, 0);
    body.setMaxVelocity(this.patrolSpeed, ENEMY_CONFIG.maxFallSpeed);
    applyNormalizedBodyConfig(this, {
      heightRatio: ENEMY_CONFIG.bodyHeightRatio,
      offsetXRatio: ENEMY_CONFIG.offsetXRatio,
      offsetYRatio: ENEMY_CONFIG.offsetYRatio,
      widthRatio: ENEMY_CONFIG.bodyWidthRatio,
    });
  }

  public freezeMotion(): void {
    this.getBody().setVelocity(0, 0);
  }

  public updatePatrol(): void {
    if (!this.active) {
      return;
    }

    const leftBoundary = this.initialX - this.patrolDistance;
    const rightBoundary = this.initialX + this.patrolDistance;

    if (this.x >= rightBoundary) {
      this.direction = -1;
    } else if (this.x <= leftBoundary) {
      this.direction = 1;
    }

    this.syncFacingDirection();
    this.getBody().setVelocityX(this.direction * this.patrolSpeed);
  }

  private getBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private syncFacingDirection(): void {
    // The reference enemy art faces left by default, so moving right needs mirroring.
    this.setFlipX(this.direction > 0);
  }
}
