import "@/styles/global.css";

import { createGame } from "@/game/createGame";
import { GAME_CONTAINER_ID } from "@/shared/constants";

const appRoot = document.querySelector<HTMLDivElement>(`#${GAME_CONTAINER_ID}`);

if (!appRoot) {
  throw new Error(`Unable to find the game container "#${GAME_CONTAINER_ID}".`);
}

createGame(GAME_CONTAINER_ID);
