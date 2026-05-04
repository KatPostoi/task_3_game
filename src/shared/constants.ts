export const GAME_TITLE = "CatNap";
export const GAME_CONTAINER_ID = "app";
export const GAME_BACKGROUND_COLOR = "#020617";
export const SCENE_BACKGROUND_COLOR = "#0f172a";
export const SCENE_ACCENT_COLOR = "#38bdf8";
export const SCENE_MUTED_COLOR = "#94a3b8";
export const SCENE_TEXT_COLOR = "#e2e8f0";

export const GAME_DIMENSIONS = {
  width: 1920,
  height: 1080,
} as const;

export const PLAYER_ANIMATION_KEYS = {
  idle: "player-idle",
  run: "player-run",
  jump: "player-jump",
  fall: "player-fall",
} as const;

export const RENDER_DEPTHS = {
  background: -2,
  grid: -1,
  platforms: 1,
  collectibles: 2,
  enemies: 3,
  player: 4,
} as const;

export const SCENE_KEYS = {
  boot: "boot",
  preload: "preload",
  intro: "intro",
  game: "game",
  ui: "ui",
} as const;

export const LEVEL_KEYS = {
  level1: "level1",
} as const;
