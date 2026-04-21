import { ASSET_KEYS } from "@/content/assets";
import { GAME_DIMENSIONS, LEVEL_KEYS } from "@/shared/constants";

import type {
  LevelCoinDefinition,
  LevelDefinition,
  LevelEnemyDefinition,
  LevelPlatformDefinition,
} from "./types";

const REFERENCE_WORLD_WIDTH = 5760;
const REFERENCE_FINISH_X = 5100;

const fromReferenceY = (arcadeY: number): number =>
  GAME_DIMENSIONS.height - arcadeY;

const createPlatform = (
  x: number,
  arcadeY: number,
  textureKey: LevelPlatformDefinition["textureKey"],
): LevelPlatformDefinition => ({
  x,
  y: fromReferenceY(arcadeY),
  textureKey,
});

const createCoin = (x: number, arcadeY: number): LevelCoinDefinition => ({
  x,
  y: fromReferenceY(arcadeY),
  textureKey: ASSET_KEYS.coin,
});

const createEnemy = (
  x: number,
  arcadeY: number,
  speed: number,
  patrolDistance: number,
): LevelEnemyDefinition => ({
  x,
  y: fromReferenceY(arcadeY),
  patrolDistance,
  speed,
  textureKey: ASSET_KEYS.enemy1,
});

export const level1: LevelDefinition = {
  key: LEVEL_KEYS.level1,
  name: "Level 1",
  worldSize: {
    width: REFERENCE_WORLD_WIDTH,
    height: GAME_DIMENSIONS.height,
  },
  background: {
    color: "#0f172a",
    textureKey: ASSET_KEYS.background,
  },
  spawnPoint: {
    x: 155,
    y: fromReferenceY(290),
  },
  finishZone: {
    x: REFERENCE_FINISH_X,
    y: 0,
    width: REFERENCE_WORLD_WIDTH - REFERENCE_FINISH_X,
    height: GAME_DIMENSIONS.height,
  },
  platforms: [
    createPlatform(395, 155, ASSET_KEYS.platform1),
    createPlatform(1200, 155, ASSET_KEYS.platform2),
    createPlatform(1550, 335, ASSET_KEYS.platform3),
    createPlatform(2100, 335, ASSET_KEYS.platform4),
    createPlatform(2000, 698, ASSET_KEYS.platform5),
    createPlatform(2550, 515, ASSET_KEYS.platform6),
    createPlatform(2550, 875, ASSET_KEYS.platform7),
    createPlatform(3050, 694, ASSET_KEYS.platform8),
    createPlatform(3250, 335, ASSET_KEYS.platform9),
    createPlatform(4050, 335, ASSET_KEYS.platform10),
    createPlatform(5180, 153, ASSET_KEYS.platform11),
  ],
  coins: [
    createCoin(1550, 435),
    createCoin(2000, 798),
    createCoin(2350, 615),
    createCoin(2550, 975),
    createCoin(3250, 435),
    createCoin(3750, 435),
  ],
  enemies: [createEnemy(2650, 580, 110, 120), createEnemy(4200, 400, 140, 140)],
};
