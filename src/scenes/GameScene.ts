import * as Phaser from "phaser";

import { GAMEPLAY_RULES, LIVES_CONFIG } from "@/config/gameplayConfig";
import { level1 } from "@/content/levels/level1";
import { Player } from "@/entities/Player";
import type {
  GameplayBootstrapData,
  UiActionHandlers,
  UiSceneData,
} from "@/scenes/sceneData";
import type { GameFlowState, Size2D } from "@/shared/types";
import { SCENE_KEYS } from "@/shared/constants";
import {
  GAME_FLOW_STATES,
  GameFlowController,
} from "@/systems/GameFlowController";
import { InputController } from "@/systems/InputController";
import { LevelFactory } from "@/systems/LevelFactory";
import {
  advanceSessionTime,
  applyEnemyHitToSession,
  collectCoinInSession,
  createGameSession,
  GAME_SESSION_OUTCOME_REASONS,
  isSessionActive,
  markSessionLost,
  markSessionWon,
} from "@/systems/GameSession";

import type { Coin } from "@/entities/Coin";
import type { Enemy } from "@/entities/Enemy";
import type { GameSessionState } from "@/systems/GameSession";
import type { Point2D } from "@/shared/types";

interface FlowHotkeys {
  readonly backToStart: Phaser.Input.Keyboard.Key;
  readonly confirm: Phaser.Input.Keyboard.Key;
  readonly confirmAlt: Phaser.Input.Keyboard.Key;
  readonly pause: Phaser.Input.Keyboard.Key;
  readonly pauseAlt: Phaser.Input.Keyboard.Key;
  readonly restart: Phaser.Input.Keyboard.Key;
}

export class GameScene extends Phaser.Scene {
  private enemyHitInvulnerableUntilMs = 0;
  private enemies!: Phaser.Physics.Arcade.Group;
  private flowController = new GameFlowController(GAME_FLOW_STATES.start);
  private flowHotkeys!: FlowHotkeys;
  private inputController!: InputController;
  private player!: Player;
  private spawnPoint: Point2D = level1.spawnPoint;
  private session: GameSessionState = this.createFreshSession();
  private worldSize: Size2D = level1.worldSize;

  public constructor() {
    super(SCENE_KEYS.game);
  }

  public init(data: Partial<GameplayBootstrapData>): void {
    this.flowController = new GameFlowController(
      data.flowState ?? GAME_FLOW_STATES.start,
    );
    this.session = data.session ?? this.createFreshSession();
  }

  public create(): void {
    const levelFactory = new LevelFactory(this);
    const builtLevel = levelFactory.build(level1);

    this.enemyHitInvulnerableUntilMs = 0;
    this.spawnPoint = builtLevel.spawnPoint;
    this.worldSize = builtLevel.worldSize;
    this.inputController = new InputController(this);
    this.flowHotkeys = this.createFlowHotkeys();
    this.input.keyboard?.resetKeys();
    this.player = new Player(this, builtLevel.spawnPoint);
    this.enemies = builtLevel.enemies;

    this.physics.world.setBounds(
      0,
      0,
      builtLevel.worldSize.width,
      builtLevel.worldSize.height + GAMEPLAY_RULES.physicsWorldBottomPadding,
    );

    this.physics.add.collider(this.player, builtLevel.platforms);
    this.physics.add.collider(this.enemies, builtLevel.platforms);
    this.physics.add.overlap(
      this.player,
      builtLevel.coins,
      this.handleCoinOverlap,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyOverlap,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      builtLevel.finishZone,
      this.handleFinishZoneOverlap,
      undefined,
      this,
    );

    this.player.configureCamera(this.cameras.main);
    this.registerLifecycle();
    this.launchUiScene();
    this.applyFlowState();
  }

  private applyFlowState(): void {
    if (this.flowController.canUpdateGameplay()) {
      this.resumeWorld();
      return;
    }

    this.suspendWorld();
  }

  private createFlowHotkeys(): FlowHotkeys {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable for the current scene.");
    }

    return keyboard.addKeys({
      backToStart: Phaser.Input.Keyboard.KeyCodes.B,
      confirm: Phaser.Input.Keyboard.KeyCodes.ENTER,
      confirmAlt: Phaser.Input.Keyboard.KeyCodes.SPACE,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC,
      pauseAlt: Phaser.Input.Keyboard.KeyCodes.P,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
    }) as FlowHotkeys;
  }

  private createFreshSession(): GameSessionState {
    return createGameSession({
      initialLives: LIVES_CONFIG.initialLives,
      levelKey: level1.key,
      levelName: level1.name,
      totalCoins: level1.coins.length,
    });
  }

  private createSceneData(flowState: GameFlowState): GameplayBootstrapData {
    return {
      flowState,
      session: this.createFreshSession(),
    };
  }

  private createUiActionHandlers(): UiActionHandlers {
    return {
      backToStart: () => {
        this.returnToStart();
      },
      restart: () => {
        this.restartLevel();
      },
      resume: () => {
        this.resumeGameplay();
      },
      start: () => {
        this.startGameplay();
      },
    };
  }

  private forEachEnemy(callback: (enemy: Enemy) => void): void {
    for (const enemy of this.enemies.getChildren()) {
      callback(enemy as Enemy);
    }
  }

  private finishAsLost(
    reason:
      | typeof GAME_SESSION_OUTCOME_REASONS.enemy
      | typeof GAME_SESSION_OUTCOME_REASONS.fall,
  ): void {
    if (!markSessionLost(this.session, reason)) {
      return;
    }

    if (!this.flowController.finishAsLost()) {
      return;
    }

    this.freezeCompletedGameplay(0xf87171);
  }

  private freezeCompletedGameplay(playerTint: number): void {
    this.player.setTint(playerTint);
    this.player.setAlpha(1);
    this.suspendWorld();
  }

  private handleCoinOverlap(_playerObject: unknown, coinObject: unknown): void {
    if (
      !this.flowController.canUpdateGameplay() ||
      !isSessionActive(this.session)
    ) {
      return;
    }

    const scoreDelta = (coinObject as Coin).collect();

    if (scoreDelta > 0) {
      collectCoinInSession(this.session, scoreDelta);
    }
  }

  private handleEnemyOverlap(): void {
    if (
      !this.flowController.canUpdateGameplay() ||
      !isSessionActive(this.session) ||
      this.isPlayerInvulnerable()
    ) {
      return;
    }

    const resolution = applyEnemyHitToSession(this.session);

    if (resolution === "ignored") {
      return;
    }

    if (resolution === "damaged") {
      this.respawnAfterEnemyHit();
      return;
    }

    if (!this.flowController.finishAsLost()) {
      return;
    }

    this.freezeCompletedGameplay(0xf87171);
  }

  private handleFinishZoneOverlap(): void {
    if (!this.flowController.finishAsWon()) {
      return;
    }

    markSessionWon(this.session);
    this.freezeCompletedGameplay(0x86efac);
  }

  private handleFlowHotkeys(): void {
    const confirmRequested =
      Phaser.Input.Keyboard.JustDown(this.flowHotkeys.confirm) ||
      Phaser.Input.Keyboard.JustDown(this.flowHotkeys.confirmAlt);
    const pauseRequested =
      Phaser.Input.Keyboard.JustDown(this.flowHotkeys.pause) ||
      Phaser.Input.Keyboard.JustDown(this.flowHotkeys.pauseAlt);
    const restartRequested = Phaser.Input.Keyboard.JustDown(
      this.flowHotkeys.restart,
    );
    const backToStartRequested = Phaser.Input.Keyboard.JustDown(
      this.flowHotkeys.backToStart,
    );

    switch (this.flowController.getState()) {
      case GAME_FLOW_STATES.start:
        if (confirmRequested) {
          this.startGameplay();
        }
        break;
      case GAME_FLOW_STATES.playing:
        if (pauseRequested) {
          this.pauseGameplay();
        }
        break;
      case GAME_FLOW_STATES.paused:
        if (confirmRequested || pauseRequested) {
          this.resumeGameplay();
        } else if (restartRequested) {
          this.restartLevel();
        } else if (backToStartRequested) {
          this.returnToStart();
        }
        break;
      case GAME_FLOW_STATES.won:
      case GAME_FLOW_STATES.lost:
        if (confirmRequested || restartRequested) {
          this.restartLevel();
        } else if (backToStartRequested) {
          this.returnToStart();
        }
        break;
      default:
        break;
    }
  }

  private handleUpdate(_time: number, delta: number): void {
    this.handleFlowHotkeys();

    this.syncPlayerDamageFeedback();

    if (!this.flowController.canUpdateGameplay()) {
      return;
    }

    advanceSessionTime(this.session, delta);
    this.player.updateFromInput(this.inputController.readState());
    this.forEachEnemy((enemy) => {
      enemy.updatePatrol();
    });

    if (
      this.player.y >
      this.worldSize.height + GAMEPLAY_RULES.fallLoseThreshold
    ) {
      this.finishAsLost(GAME_SESSION_OUTCOME_REASONS.fall);
    }
  }

  private launchUiScene(): void {
    this.scene.stop(SCENE_KEYS.ui);
    this.scene.launch(SCENE_KEYS.ui, {
      actionHandlers: this.createUiActionHandlers(),
      flowController: this.flowController,
      session: this.session,
    } satisfies UiSceneData);
  }

  private pauseGameplay(): void {
    if (!this.flowController.pause()) {
      return;
    }

    this.suspendWorld();
  }

  private registerLifecycle(): void {
    this.events.on(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);
      this.scene.stop(SCENE_KEYS.ui);
    });
  }

  private restartLevel(): void {
    this.restartScene(GAME_FLOW_STATES.playing);
  }

  private resumeGameplay(): void {
    if (!this.flowController.resume()) {
      return;
    }

    this.resumeWorld();
  }

  private resumeWorld(): void {
    this.physics.resume();
    this.tweens.resumeAll();
    this.syncPlayerDamageFeedback();
  }

  private returnToStart(): void {
    this.restartScene(GAME_FLOW_STATES.start);
  }

  private restartScene(flowState: GameFlowState): void {
    this.scene.stop(SCENE_KEYS.ui);
    this.scene.restart(this.createSceneData(flowState));
  }

  private startGameplay(): void {
    if (this.flowController.enterPlaying() !== GAME_FLOW_STATES.playing) {
      return;
    }

    this.resumeWorld();
  }

  private suspendWorld(): void {
    this.physics.pause();
    this.tweens.pauseAll();
    this.player.freezeMotion();
    this.forEachEnemy((enemy) => {
      enemy.freezeMotion();
    });
  }

  private isPlayerInvulnerable(currentTime: number = this.time.now): boolean {
    return currentTime < this.enemyHitInvulnerableUntilMs;
  }

  private respawnAfterEnemyHit(): void {
    this.enemyHitInvulnerableUntilMs =
      this.time.now + LIVES_CONFIG.enemyHitInvulnerabilityMs;
    this.player.respawnAt(this.spawnPoint);
    this.syncPlayerDamageFeedback();
  }

  private syncPlayerDamageFeedback(currentTime: number = this.time.now): void {
    const flowState = this.flowController.getState();

    if (
      flowState === GAME_FLOW_STATES.won ||
      flowState === GAME_FLOW_STATES.lost
    ) {
      return;
    }

    if (this.isPlayerInvulnerable(currentTime)) {
      this.player.setAlpha(0.7);
      this.player.setTint(0xfacc15);
      return;
    }

    this.player.setAlpha(1);
    this.player.clearTint();
  }
}
