import type { GameFlowState } from "@/shared/types";

export const GAME_FLOW_STATES = {
  booting: "booting",
  lost: "lost",
  loading: "loading",
  paused: "paused",
  start: "start",
  playing: "playing",
  won: "won",
} as const;

export type GameFlowListener = (
  currentState: GameFlowState,
  previousState: GameFlowState,
) => void;

const ALLOWED_TRANSITIONS: Record<GameFlowState, readonly GameFlowState[]> = {
  booting: [GAME_FLOW_STATES.loading],
  loading: [GAME_FLOW_STATES.start],
  lost: [],
  paused: [GAME_FLOW_STATES.playing],
  playing: [
    GAME_FLOW_STATES.paused,
    GAME_FLOW_STATES.won,
    GAME_FLOW_STATES.lost,
  ],
  start: [GAME_FLOW_STATES.playing],
  won: [],
};

export class GameFlowController {
  private currentState: GameFlowState;
  private readonly listeners = new Set<GameFlowListener>();

  public constructor(initialState: GameFlowState = GAME_FLOW_STATES.booting) {
    this.currentState = initialState;
  }

  public getState(): GameFlowState {
    return this.currentState;
  }

  public subscribe(listener: GameFlowListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public canUpdateGameplay(): boolean {
    return this.currentState === GAME_FLOW_STATES.playing;
  }

  public canTransitionTo(nextState: GameFlowState): boolean {
    return ALLOWED_TRANSITIONS[this.currentState].includes(nextState);
  }

  public enterLoading(): GameFlowState {
    this.setState(GAME_FLOW_STATES.loading, [GAME_FLOW_STATES.booting]);

    return this.currentState;
  }

  public enterStart(): GameFlowState {
    this.setState(GAME_FLOW_STATES.start, [GAME_FLOW_STATES.loading]);

    return this.currentState;
  }

  public enterPlaying(): GameFlowState {
    this.setState(GAME_FLOW_STATES.playing, [GAME_FLOW_STATES.start]);

    return this.currentState;
  }

  public pause(): boolean {
    return this.setState(GAME_FLOW_STATES.paused, [GAME_FLOW_STATES.playing]);
  }

  public resume(): boolean {
    return this.setState(GAME_FLOW_STATES.playing, [GAME_FLOW_STATES.paused]);
  }

  public finishAsWon(): boolean {
    return this.setState(GAME_FLOW_STATES.won, [GAME_FLOW_STATES.playing]);
  }

  public finishAsLost(): boolean {
    return this.setState(GAME_FLOW_STATES.lost, [GAME_FLOW_STATES.playing]);
  }

  private setState(
    nextState: GameFlowState,
    allowedCurrentStates: readonly GameFlowState[],
  ): boolean {
    const previousState = this.currentState;

    if (
      !allowedCurrentStates.includes(previousState) ||
      !this.canTransitionTo(nextState)
    ) {
      return false;
    }

    this.currentState = nextState;

    for (const listener of this.listeners) {
      listener(this.currentState, previousState);
    }

    return true;
  }
}
