import type * as Phaser from "phaser";

export interface NormalizedBodyConfig {
  readonly heightRatio: number;
  readonly offsetXRatio: number;
  readonly offsetYRatio: number;
  readonly widthRatio: number;
}

export function applyNormalizedBodyConfig(
  sprite: Phaser.Physics.Arcade.Sprite,
  config: NormalizedBodyConfig,
): Phaser.Physics.Arcade.Body {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  const sourceWidth = sprite.width;
  const sourceHeight = sprite.height;

  body.setSize(
    sourceWidth * config.widthRatio,
    sourceHeight * config.heightRatio,
  );
  body.setOffset(
    sourceWidth * config.offsetXRatio,
    sourceHeight * config.offsetYRatio,
  );

  return body;
}
