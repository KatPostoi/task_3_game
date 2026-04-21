const REFERENCE_ASSET_ROOT = "/assets";
const REFERENCE_IMAGE_ASSET_ROOT = `${REFERENCE_ASSET_ROOT}/images`;
const REFERENCE_VIDEO_ASSET_ROOT = `${REFERENCE_ASSET_ROOT}/videos`;

const IMAGE_ASSET_PATHS = {
  arrow: `${REFERENCE_IMAGE_ASSET_ROOT}/arrow.png`,
  background: `${REFERENCE_IMAGE_ASSET_ROOT}/background.png`,
  coin: `${REFERENCE_IMAGE_ASSET_ROOT}/coin.png`,
  enemy1: `${REFERENCE_IMAGE_ASSET_ROOT}/enemy1.png`,
  enemy2: `${REFERENCE_IMAGE_ASSET_ROOT}/enemy2.png`,
  enemy3: `${REFERENCE_IMAGE_ASSET_ROOT}/enemy3.png`,
  enemy4: `${REFERENCE_IMAGE_ASSET_ROOT}/enemy4.png`,
  home: `${REFERENCE_IMAGE_ASSET_ROOT}/home.png`,
  lives: `${REFERENCE_IMAGE_ASSET_ROOT}/lives.png`,
  loss: `${REFERENCE_IMAGE_ASSET_ROOT}/loss.jpg`,
  notLives: `${REFERENCE_IMAGE_ASSET_ROOT}/not_lives.png`,
  platform1: `${REFERENCE_IMAGE_ASSET_ROOT}/platform1.png`,
  platform2: `${REFERENCE_IMAGE_ASSET_ROOT}/platform2.png`,
  platform3: `${REFERENCE_IMAGE_ASSET_ROOT}/platform3.png`,
  platform4: `${REFERENCE_IMAGE_ASSET_ROOT}/platform4.png`,
  platform5: `${REFERENCE_IMAGE_ASSET_ROOT}/platform5.png`,
  platform6: `${REFERENCE_IMAGE_ASSET_ROOT}/platform6.png`,
  platform7: `${REFERENCE_IMAGE_ASSET_ROOT}/platform7.png`,
  platform8: `${REFERENCE_IMAGE_ASSET_ROOT}/platform8.png`,
  platform9: `${REFERENCE_IMAGE_ASSET_ROOT}/platform9.png`,
  platform10: `${REFERENCE_IMAGE_ASSET_ROOT}/platform10.png`,
  platform11: `${REFERENCE_IMAGE_ASSET_ROOT}/platform11.png`,
  player1: `${REFERENCE_IMAGE_ASSET_ROOT}/player1.png`,
  player2: `${REFERENCE_IMAGE_ASSET_ROOT}/player2.png`,
  player3: `${REFERENCE_IMAGE_ASSET_ROOT}/player3.png`,
  player4: `${REFERENCE_IMAGE_ASSET_ROOT}/player4.png`,
  restart: `${REFERENCE_IMAGE_ASSET_ROOT}/restart.png`,
  win: `${REFERENCE_IMAGE_ASSET_ROOT}/win.jpg`,
} as const;

export const VIDEO_ASSET_PATHS = {
  intro: `${REFERENCE_VIDEO_ASSET_ROOT}/VID_20260420_115538.mp4`,
} as const;

export type AssetKey = keyof typeof IMAGE_ASSET_PATHS;

export const ASSET_KEYS = Object.freeze(
  Object.fromEntries(
    Object.keys(IMAGE_ASSET_PATHS).map((key) => [key, key]),
  ) as { readonly [K in AssetKey]: K },
);

export const PLAYER_FRAME_KEYS = [
  ASSET_KEYS.player1,
  ASSET_KEYS.player2,
  ASSET_KEYS.player3,
  ASSET_KEYS.player4,
] as const;

export interface ImageAssetDefinition {
  readonly key: AssetKey;
  readonly path: string;
}

export const IMAGE_ASSETS: readonly ImageAssetDefinition[] = Object.entries(
  IMAGE_ASSET_PATHS,
).map(([key, path]) => ({
  key: key as AssetKey,
  path,
}));

export type VideoAssetKey = keyof typeof VIDEO_ASSET_PATHS;

export const VIDEO_ASSET_KEYS = Object.freeze(
  Object.fromEntries(
    Object.keys(VIDEO_ASSET_PATHS).map((key) => [key, key]),
  ) as { readonly [K in VideoAssetKey]: K },
);

export interface VideoAssetDefinition {
  readonly key: VideoAssetKey;
  readonly path: string;
}

export const VIDEO_ASSETS: readonly VideoAssetDefinition[] = Object.entries(
  VIDEO_ASSET_PATHS,
).map(([key, path]) => ({
  key: key as VideoAssetKey,
  path,
}));
