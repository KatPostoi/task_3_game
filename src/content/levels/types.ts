import type { AssetKey } from "@/content/assets";
import type { Point2D, Size2D } from "@/shared/types";

export interface LevelBackgroundDefinition {
  readonly color: string;
  readonly textureKey?: AssetKey;
  readonly alpha?: number;
}

export interface LevelDebugGridDefinition {
  readonly cellSize: number;
  readonly color: number;
  readonly alpha: number;
}

export interface LevelTexturePlacementDefinition {
  readonly width: number;
  readonly height: number;
}

export interface LevelAreaDefinition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LevelSpritePlacementDefinition {
  readonly x: number;
  readonly y: number;
  readonly textureKey: AssetKey;
}

export interface LevelPlatformDefinition
  extends
    LevelSpritePlacementDefinition,
    Partial<LevelTexturePlacementDefinition> {}

export interface LevelCoinDefinition extends LevelSpritePlacementDefinition {
  readonly scoreValue?: number;
}

export interface LevelEnemyDefinition extends LevelSpritePlacementDefinition {
  readonly patrolDistance?: number;
  readonly scale?: number;
  readonly speed?: number;
}

export interface LevelDefinition {
  readonly key: string;
  readonly name: string;
  readonly worldSize: Size2D;
  readonly background: LevelBackgroundDefinition;
  readonly spawnPoint: Point2D;
  readonly finishZone: LevelAreaDefinition;
  readonly platforms: readonly LevelPlatformDefinition[];
  readonly coins: readonly LevelCoinDefinition[];
  readonly enemies: readonly LevelEnemyDefinition[];
  readonly debugGrid?: LevelDebugGridDefinition;
}
