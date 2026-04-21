import type * as Phaser from "phaser";

import { Coin } from "@/entities/Coin";
import { Enemy } from "@/entities/Enemy";
import type {
  LevelAreaDefinition,
  LevelBackgroundDefinition,
  LevelCoinDefinition,
  LevelDefinition,
  LevelEnemyDefinition,
  LevelPlatformDefinition,
  LevelTexturePlacementDefinition,
} from "@/content/levels/types";
import { assertValidLevelDefinition } from "@/content/levels/validation";
import type { Point2D, Size2D } from "@/shared/types";
import { RENDER_DEPTHS } from "@/shared/constants";

export interface BuiltLevelResult {
  readonly coins: Phaser.Physics.Arcade.Group;
  readonly enemies: Phaser.Physics.Arcade.Group;
  readonly finishZone: Phaser.GameObjects.Zone;
  readonly platforms: Phaser.Physics.Arcade.StaticGroup;
  readonly worldSize: Size2D;
  readonly spawnPoint: Point2D;
}

export class LevelFactory {
  public constructor(private readonly scene: Phaser.Scene) {}

  public build(level: LevelDefinition): BuiltLevelResult {
    assertValidLevelDefinition(level);
    this.scene.cameras.main.setBackgroundColor(level.background.color);
    this.scene.cameras.main.setBounds(
      0,
      0,
      level.worldSize.width,
      level.worldSize.height,
    );
    this.scene.physics.world.setBounds(
      0,
      0,
      level.worldSize.width,
      level.worldSize.height,
    );

    this.createBackground(level.background, level.worldSize);

    if (level.debugGrid) {
      this.createDebugGrid(level.debugGrid, level.worldSize);
    }

    const platforms = this.createPlatforms(level.platforms);
    const coins = this.createCoins(level.coins);
    const enemies = this.createEnemies(level.enemies);
    const finishZone = this.createFinishZone(level.finishZone);

    return {
      coins,
      enemies,
      finishZone,
      platforms,
      worldSize: level.worldSize,
      spawnPoint: level.spawnPoint,
    };
  }

  private createBackground(
    backgroundConfig: LevelBackgroundDefinition,
    worldSize: Size2D,
  ): void {
    if (!backgroundConfig.textureKey) {
      return;
    }

    const targetHeight = worldSize.height;
    const background = this.scene.add
      .image(0, 0, backgroundConfig.textureKey)
      .setOrigin(0, 0)
      .setAlpha(backgroundConfig.alpha ?? 1)
      .setDepth(RENDER_DEPTHS.background);

    const proportionalWidth =
      (background.width / background.height) * targetHeight;

    background.setDisplaySize(proportionalWidth, targetHeight);
    background.setScrollFactor(1);
  }

  private createDebugGrid(
    debugGrid: LevelDefinition["debugGrid"],
    worldSize: Size2D,
  ): void {
    if (!debugGrid) {
      return;
    }

    const graphics = this.scene.add.graphics();
    const { cellSize, color, alpha } = debugGrid;
    const { width, height } = worldSize;

    graphics.lineStyle(1, color, alpha);

    for (let x = 0; x <= width; x += cellSize) {
      graphics.lineBetween(x, 0, x, height);
    }

    for (let y = 0; y <= height; y += cellSize) {
      graphics.lineBetween(0, y, width, y);
    }

    graphics.lineStyle(3, color, 1);
    graphics.strokeRect(0, 0, width, height);
    graphics.setDepth(RENDER_DEPTHS.grid);
  }

  private createPlatforms(
    platformsData: readonly LevelPlatformDefinition[],
  ): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.scene.physics.add.staticGroup();

    for (const platform of platformsData) {
      const sprite = platforms.create(
        platform.x,
        platform.y,
        platform.textureKey,
      );

      this.applyDisplaySize(sprite, platform);

      sprite
        .setDepth(RENDER_DEPTHS.platforms)
        .setOrigin(0.5, 0.5)
        .refreshBody();
    }

    return platforms;
  }

  private createCoins(
    coinsData: readonly LevelCoinDefinition[],
  ): Phaser.Physics.Arcade.Group {
    const coins = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    for (const coinData of coinsData) {
      coins.add(new Coin(this.scene, coinData));
    }

    return coins;
  }

  private createEnemies(
    enemiesData: readonly LevelEnemyDefinition[],
  ): Phaser.Physics.Arcade.Group {
    const enemies = this.scene.physics.add.group();

    for (const enemyData of enemiesData) {
      enemies.add(new Enemy(this.scene, enemyData));
    }

    return enemies;
  }

  private createFinishZone(
    finishZone: LevelAreaDefinition,
  ): Phaser.GameObjects.Zone {
    const zone = this.scene.add.zone(
      finishZone.x + finishZone.width / 2,
      finishZone.y + finishZone.height / 2,
      finishZone.width,
      finishZone.height,
    );

    this.scene.physics.add.existing(zone, true);

    return zone;
  }

  private applyDisplaySize(
    sprite: Phaser.Physics.Arcade.Sprite,
    platform: LevelPlatformDefinition,
  ): void {
    if (!platform.width && !platform.height) {
      return;
    }

    const resolvedSize: LevelTexturePlacementDefinition = {
      width: platform.width ?? sprite.width,
      height: platform.height ?? sprite.height,
    };

    sprite.setDisplaySize(resolvedSize.width, resolvedSize.height);
  }
}
