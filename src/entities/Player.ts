import * as Phaser from "phaser";

import {
  CAMERA_FOLLOW_CONFIG,
  PLAYER_BODY_CONFIG,
  PLAYER_MOTION_CONFIG,
} from "@/config/physicsConfig";
import { PLAYER_FRAME_KEYS } from "@/content/assets";
import { PLAYER_ANIMATION_KEYS, RENDER_DEPTHS } from "@/shared/constants";
import { applyNormalizedBodyConfig } from "@/shared/physics/applyNormalizedBodyConfig";

import type { Point2D } from "@/shared/types";
import type { PlayerInputState } from "@/systems/InputController";

export class Player extends Phaser.Physics.Arcade.Sprite {
  public constructor(scene: Phaser.Scene, spawnPoint: Point2D) {
    super(scene, spawnPoint.x, spawnPoint.y, PLAYER_FRAME_KEYS[0]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    Player.ensureAnimations(scene);

    this.setScale(PLAYER_BODY_CONFIG.scale);
    this.setDepth(RENDER_DEPTHS.player);
    this.setCollideWorldBounds(true);

    const body = this.getBody();

    body.setMaxVelocity(
      PLAYER_MOTION_CONFIG.runSpeed,
      PLAYER_MOTION_CONFIG.maxFallSpeed,
    );

    this.configureBody();
    this.playAnimation(PLAYER_ANIMATION_KEYS.idle);
  }

  public updateFromInput(input: PlayerInputState): void {
    const body = this.getBody();

    body.setVelocityX(input.horizontal * PLAYER_MOTION_CONFIG.runSpeed);

    if (input.jumpRequested && this.isGrounded()) {
      body.setVelocityY(PLAYER_MOTION_CONFIG.jumpVelocity);
    }

    if (input.horizontal !== 0) {
      this.setFlipX(input.horizontal < 0);
    }

    this.updateAnimationState();
  }

  public freezeMotion(): void {
    const body = this.getBody();

    body.setVelocity(0, 0);
    this.playAnimation(PLAYER_ANIMATION_KEYS.idle);
  }

  public respawnAt(spawnPoint: Point2D): void {
    const body = this.getBody();

    this.setPosition(spawnPoint.x, spawnPoint.y);
    body.reset(spawnPoint.x, spawnPoint.y);
    body.setVelocity(0, 0);
    this.clearTint();
    this.setAlpha(1);
    this.playAnimation(PLAYER_ANIMATION_KEYS.idle);
  }

  public configureCamera(camera: Phaser.Cameras.Scene2D.Camera): void {
    camera.startFollow(
      this,
      false,
      CAMERA_FOLLOW_CONFIG.lerpX,
      CAMERA_FOLLOW_CONFIG.lerpY,
    );
    camera.setDeadzone(
      CAMERA_FOLLOW_CONFIG.deadzoneWidth,
      CAMERA_FOLLOW_CONFIG.deadzoneHeight,
    );
    camera.setRoundPixels(true);
  }

  public static ensureAnimations(scene: Phaser.Scene): void {
    if (scene.anims.get(PLAYER_ANIMATION_KEYS.idle)) {
      return;
    }

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.idle,
      frames: [{ key: PLAYER_FRAME_KEYS[0] }],
      frameRate: 1,
      repeat: -1,
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.run,
      frames: PLAYER_FRAME_KEYS.map((key) => ({ key })),
      frameRate: PLAYER_MOTION_CONFIG.runAnimationFrameRate,
      repeat: -1,
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.jump,
      frames: [{ key: PLAYER_FRAME_KEYS[1] }],
      frameRate: 1,
      repeat: -1,
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.fall,
      frames: [{ key: PLAYER_FRAME_KEYS[2] }],
      frameRate: 1,
      repeat: -1,
    });
  }

  private configureBody(): void {
    applyNormalizedBodyConfig(this, PLAYER_BODY_CONFIG);
  }

  private updateAnimationState(): void {
    const body = this.getBody();

    if (body.velocity.y < -1) {
      this.playAnimation(PLAYER_ANIMATION_KEYS.jump);
      return;
    }

    if (!this.isGrounded()) {
      this.playAnimation(PLAYER_ANIMATION_KEYS.fall);
      return;
    }

    if (
      Math.abs(body.velocity.x) > PLAYER_MOTION_CONFIG.idleVelocityThreshold
    ) {
      this.playAnimation(PLAYER_ANIMATION_KEYS.run);
      return;
    }

    this.playAnimation(PLAYER_ANIMATION_KEYS.idle);
  }

  private isGrounded(): boolean {
    const body = this.getBody();

    return body.blocked.down || body.touching.down;
  }

  private playAnimation(key: string): void {
    if (this.anims.currentAnim?.key === key) {
      return;
    }

    this.anims.play(key, true);
  }

  private getBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }
}
