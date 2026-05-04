export const COIN_CONFIG = {
  bodyHeightRatio: 0.64,
  bodyWidthRatio: 0.64,
  defaultScoreValue: 75,
  floatDurationMs: 850,
  floatOffset: 10,
  offsetXRatio: 0.18,
  offsetYRatio: 0.18,
  scale: 0.2,
} as const;

export const ENEMY_CONFIG = {
  bodyHeightRatio: 0.74,
  bodyWidthRatio: 0.42,
  defaultPatrolDistance: 110,
  defaultScale: 0.13,
  defaultSpeed: 120,
  maxFallSpeed: 1500,
  offsetXRatio: 0.3,
  offsetYRatio: 0.16,
} as const;

export const LIVES_CONFIG = {
  enemyHitInvulnerabilityMs: 1000,
  initialLives: 3,
} as const;

export const GAMEPLAY_RULES = {
  fallLoseThreshold: 160,
  physicsWorldBottomPadding: 720,
} as const;
