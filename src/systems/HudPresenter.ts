import { ASSET_KEYS } from "@/content/assets";
import {
  GAME_TITLE,
  SCENE_ACCENT_COLOR,
  SCENE_MUTED_COLOR,
} from "@/shared/constants";
import { GAME_FLOW_STATES } from "@/systems/GameFlowController";
import {
  formatElapsedTime,
  GAME_SESSION_OUTCOME_REASONS,
} from "@/systems/GameSession";

import type { AssetKey } from "@/content/assets";
import type { GameFlowState } from "@/shared/types";
import type { GameSessionState } from "@/systems/GameSession";

export const HUD_ACTION_IDS = {
  backToStart: "backToStart",
  restart: "restart",
  resume: "resume",
  start: "start",
} as const;

export type HudActionId = (typeof HUD_ACTION_IDS)[keyof typeof HUD_ACTION_IDS];

export interface HudActionViewModel {
  readonly hotkeyLabel: string;
  readonly id: HudActionId;
  readonly label: string;
}

export interface HudOverlayViewModel {
  readonly backgroundAssetKey: AssetKey | null;
  readonly description: string;
  readonly isVisible: boolean;
  readonly primaryAction: HudActionViewModel | null;
  readonly secondaryAction: HudActionViewModel | null;
  readonly title: string;
  readonly toneColor: string;
}

export interface HudCardViewModel {
  readonly controlsLines: readonly string[];
  readonly infoLines: readonly string[];
  readonly title: string;
}

export interface HudStatusStripViewModel {
  readonly coinText: string;
  readonly lives: readonly ("full" | "empty")[];
}

export interface HudViewModel {
  readonly hudCard: HudCardViewModel;
  readonly overlay: HudOverlayViewModel;
  readonly statusStrip: HudStatusStripViewModel;
}

interface PresentHudOptions {
  readonly flowState: GameFlowState;
  readonly session: GameSessionState;
}

const LOSE_TONE_COLOR = "#f87171";
const SUCCESS_TONE_COLOR = "#86efac";

export function presentHud({
  flowState,
  session,
}: PresentHudOptions): HudViewModel {
  return {
    hudCard: {
      controlsLines: getControlsLines(flowState),
      infoLines: [
        `Level: ${session.activeLevelName}`,
        `Time: ${formatElapsedTime(session.elapsedTimeMs)}`,
      ],
      title: GAME_TITLE,
    },
    overlay: getOverlayViewModel(flowState, session),
    statusStrip: {
      coinText: session.collectedCoins.toString(),
      lives: createLivesViewModel(session.currentLives, session.maxLives),
    },
  };
}

function getControlsLines(flowState: GameFlowState): readonly string[] {
  if (flowState === GAME_FLOW_STATES.playing) {
    return Object.freeze([
      "Move: A/D or Left/Right",
      "Jump: W / Up / Space",
      "Pause: Esc / P",
    ]);
  }

  if (flowState === GAME_FLOW_STATES.paused) {
    return Object.freeze([
      "Resume: Enter / Space / Esc / P",
      "Restart: R",
      "Back to start: B",
    ]);
  }

  if (
    flowState === GAME_FLOW_STATES.won ||
    flowState === GAME_FLOW_STATES.lost
  ) {
    return Object.freeze(["Restart: Enter / Space / R", "Back to start: B"]);
  }

  if (flowState === GAME_FLOW_STATES.start) {
    return Object.freeze([
      "Start: Enter / Space",
      "Move: A/D or Left/Right",
      "Jump: W / Up / Space",
    ]);
  }

  return Object.freeze(["Preparing scene..."]);
}

function getOverlayViewModel(
  flowState: GameFlowState,
  session: GameSessionState,
): HudOverlayViewModel {
  if (flowState === GAME_FLOW_STATES.start) {
    return {
      backgroundAssetKey: null,
      description: `Press start when you are ready to begin ${session.activeLevelName}.`,
      isVisible: true,
      primaryAction: createAction(
        HUD_ACTION_IDS.start,
        "Start game",
        "Enter / Space",
      ),
      secondaryAction: null,
      title: "Ready to play?",
      toneColor: SCENE_ACCENT_COLOR,
    };
  }

  if (flowState === GAME_FLOW_STATES.paused) {
    return {
      backgroundAssetKey: null,
      description:
        "Gameplay is paused. Resume, restart, or return to the start state.",
      isVisible: true,
      primaryAction: createAction(
        HUD_ACTION_IDS.resume,
        "Resume",
        "Enter / Space / Esc / P",
      ),
      secondaryAction: createAction(HUD_ACTION_IDS.restart, "Restart now", "R"),
      title: "Paused",
      toneColor: SCENE_ACCENT_COLOR,
    };
  }

  if (flowState === GAME_FLOW_STATES.won) {
    return {
      backgroundAssetKey: ASSET_KEYS.win,
      description: `Finished in ${formatElapsedTime(
        session.elapsedTimeMs,
      )} with ${session.collectedCoins}/${session.totalCoins} coins collected.`,
      isVisible: true,
      primaryAction: createAction(
        HUD_ACTION_IDS.restart,
        "Restart level",
        "Enter / Space / R",
      ),
      secondaryAction: createAction(
        HUD_ACTION_IDS.backToStart,
        "Back to start",
        "B",
      ),
      title: "You win",
      toneColor: SUCCESS_TONE_COLOR,
    };
  }

  if (flowState === GAME_FLOW_STATES.lost) {
    return {
      backgroundAssetKey: ASSET_KEYS.loss,
      description: getLoseDescription(session),
      isVisible: true,
      primaryAction: createAction(
        HUD_ACTION_IDS.restart,
        "Try again",
        "Enter / Space / R",
      ),
      secondaryAction: createAction(
        HUD_ACTION_IDS.backToStart,
        "Back to start",
        "B",
      ),
      title: "Try again",
      toneColor: LOSE_TONE_COLOR,
    };
  }

  if (
    flowState === GAME_FLOW_STATES.booting ||
    flowState === GAME_FLOW_STATES.loading
  ) {
    return {
      backgroundAssetKey: null,
      description: "Preparing level...",
      isVisible: true,
      primaryAction: null,
      secondaryAction: null,
      title: "Loading",
      toneColor: SCENE_MUTED_COLOR,
    };
  }

  return {
    backgroundAssetKey: null,
    description: "",
    isVisible: false,
    primaryAction: null,
    secondaryAction: null,
    title: "",
    toneColor: SCENE_ACCENT_COLOR,
  };
}

function getLoseDescription(session: GameSessionState): string {
  if (session.outcomeReason === GAME_SESSION_OUTCOME_REASONS.enemy) {
    return "CatNap ran into a patrol. Restart and try a safer route.";
  }

  if (session.outcomeReason === GAME_SESSION_OUTCOME_REASONS.fall) {
    return "CatNap fell out of the level. Restart and try that jump again.";
  }

  return "The run is over. Restart when you are ready.";
}

function createAction(
  id: HudActionId,
  label: string,
  hotkeyLabel: string,
): HudActionViewModel {
  return {
    hotkeyLabel,
    id,
    label,
  };
}

function createLivesViewModel(
  currentLives: number,
  maxLives: number,
): readonly ("full" | "empty")[] {
  return Array.from({ length: maxLives }, (_, index) =>
    index < currentLives ? "full" : "empty",
  );
}
