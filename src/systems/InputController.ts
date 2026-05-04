import * as Phaser from "phaser";

export interface PlayerInputState {
  readonly horizontal: -1 | 0 | 1;
  readonly jumpRequested: boolean;
}

interface MovementKeys {
  readonly left: Phaser.Input.Keyboard.Key;
  readonly right: Phaser.Input.Keyboard.Key;
  readonly jump: Phaser.Input.Keyboard.Key;
  readonly jumpAlt: Phaser.Input.Keyboard.Key;
}

export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly movementKeys: MovementKeys;

  public constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable for the current scene.");
    }

    this.cursors = keyboard.createCursorKeys();
    this.movementKeys = keyboard.addKeys({
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      jumpAlt: Phaser.Input.Keyboard.KeyCodes.SPACE,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MovementKeys;
  }

  public readState(): PlayerInputState {
    const isMovingLeft =
      this.cursors.left.isDown || this.movementKeys.left.isDown;
    const isMovingRight =
      this.cursors.right.isDown || this.movementKeys.right.isDown;

    const horizontal =
      isMovingLeft === isMovingRight ? 0 : isMovingLeft ? -1 : 1;

    return {
      horizontal,
      jumpRequested:
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.movementKeys.jump) ||
        Phaser.Input.Keyboard.JustDown(this.movementKeys.jumpAlt),
    };
  }
}
