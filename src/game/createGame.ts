import * as Phaser from "phaser";

import { createGameConfig } from "@/config/gameConfig";

let game: Phaser.Game | null = null;

export const createGame = (parentId: string): Phaser.Game => {
  if (game) {
    return game;
  }

  game = new Phaser.Game(createGameConfig(parentId));
  return game;
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game?.destroy(true);
    game = null;
  });
}
