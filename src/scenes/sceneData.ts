import type { GameFlowState } from "@/shared/types";
import type { GameFlowController } from "@/systems/GameFlowController";
import type { GameSessionState } from "@/systems/GameSession";

export interface GameplayBootstrapData {
  readonly flowState: GameFlowState;
  readonly session: GameSessionState;
}

export interface UiActionHandlers {
  readonly backToStart: () => void;
  readonly restart: () => void;
  readonly resume: () => void;
  readonly start: () => void;
}

export interface UiSceneData {
  readonly actionHandlers: UiActionHandlers;
  readonly flowController: GameFlowController;
  readonly session: GameSessionState;
}
