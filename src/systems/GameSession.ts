export interface GameSessionState {
  activeLevelKey: string;
  activeLevelName: string;
  collectedCoins: number;
  currentLives: number;
  elapsedTimeMs: number;
  maxLives: number;
  outcomeReason: GameSessionOutcomeReason | null;
  score: number;
  status: GameSessionStatus;
  totalCoins: number;
}

export interface CreateGameSessionOptions {
  readonly initialLives: number;
  readonly levelKey: string;
  readonly levelName: string;
  readonly totalCoins: number;
}

export const GAME_SESSION_STATUSES = {
  lost: "lost",
  playing: "playing",
  won: "won",
} as const;

export const GAME_SESSION_OUTCOME_REASONS = {
  enemy: "enemy",
  fall: "fall",
  finish: "finish",
} as const;

export type GameSessionStatus =
  (typeof GAME_SESSION_STATUSES)[keyof typeof GAME_SESSION_STATUSES];

export type GameSessionOutcomeReason =
  (typeof GAME_SESSION_OUTCOME_REASONS)[keyof typeof GAME_SESSION_OUTCOME_REASONS];

export type EnemyHitResolution = "ignored" | "damaged" | "lost";

export const createGameSession = ({
  initialLives,
  levelKey,
  levelName,
  totalCoins,
}: CreateGameSessionOptions): GameSessionState => ({
  activeLevelKey: levelKey,
  activeLevelName: levelName,
  collectedCoins: 0,
  currentLives: initialLives,
  elapsedTimeMs: 0,
  maxLives: initialLives,
  outcomeReason: null,
  score: 0,
  status: GAME_SESSION_STATUSES.playing,
  totalCoins,
});

export const isSessionActive = (session: GameSessionState): boolean =>
  session.status === GAME_SESSION_STATUSES.playing;

export const advanceSessionTime = (
  session: GameSessionState,
  deltaMs: number,
): void => {
  if (!isSessionActive(session) || !Number.isFinite(deltaMs) || deltaMs <= 0) {
    return;
  }

  session.elapsedTimeMs += deltaMs;
};

export const collectCoinInSession = (
  session: GameSessionState,
  scoreDelta: number,
): boolean => {
  if (
    !isSessionActive(session) ||
    !Number.isFinite(scoreDelta) ||
    scoreDelta <= 0 ||
    session.collectedCoins >= session.totalCoins
  ) {
    return false;
  }

  session.collectedCoins += 1;
  session.score += scoreDelta;

  return true;
};

export const applyEnemyHitToSession = (
  session: GameSessionState,
): EnemyHitResolution => {
  if (!isSessionActive(session) || session.currentLives <= 0) {
    return "ignored";
  }

  session.currentLives -= 1;

  if (session.currentLives > 0) {
    return "damaged";
  }

  session.status = GAME_SESSION_STATUSES.lost;
  session.outcomeReason = GAME_SESSION_OUTCOME_REASONS.enemy;

  return "lost";
};

export const markSessionWon = (session: GameSessionState): boolean => {
  if (!isSessionActive(session)) {
    return false;
  }

  session.status = GAME_SESSION_STATUSES.won;
  session.outcomeReason = GAME_SESSION_OUTCOME_REASONS.finish;

  return true;
};

export const markSessionLost = (
  session: GameSessionState,
  reason:
    | typeof GAME_SESSION_OUTCOME_REASONS.enemy
    | typeof GAME_SESSION_OUTCOME_REASONS.fall,
): boolean => {
  if (!isSessionActive(session)) {
    return false;
  }

  session.status = GAME_SESSION_STATUSES.lost;
  session.outcomeReason = reason;

  return true;
};

export const formatElapsedTime = (elapsedTimeMs: number): string => {
  const totalSeconds = Math.floor(elapsedTimeMs / 1000);
  const centiseconds = Math.floor((elapsedTimeMs % 1000) / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}:${centiseconds.toString().padStart(2, "0")}`;
};
