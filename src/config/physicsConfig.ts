import type * as Phaser from "phaser";

export const ARCADE_PHYSICS_CONFIG = {
  gravity: { x: 0, y: 1800 },
  debug: false,
} as const satisfies Phaser.Types.Physics.Arcade.ArcadeWorldConfig;

export const PHYSICS_CONFIG = {
  default: "arcade",
  arcade: ARCADE_PHYSICS_CONFIG,
} as const satisfies Phaser.Types.Core.PhysicsConfig;

export const PLAYER_MOTION_CONFIG = {
  idleVelocityThreshold: 8,
  runSpeed: 460,
  jumpVelocity: -980,
  maxFallSpeed: 1600,
  runAnimationFrameRate: 10,
} as const;

export const PLAYER_BODY_CONFIG = {
  scale: 0.2,
  widthRatio: 0.62,
  heightRatio: 0.6,
  offsetXRatio: 0.14,
  offsetYRatio: 0.34,
} as const;

export const CAMERA_FOLLOW_CONFIG = {
  lerpX: 0.14,
  lerpY: 0.18,
  deadzoneWidth: 360,
  deadzoneHeight: 220,
} as const;
