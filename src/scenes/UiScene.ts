import * as Phaser from "phaser";

import { LIVES_CONFIG } from "@/config/gameplayConfig";
import { ASSET_KEYS } from "@/content/assets";
import type { UiActionHandlers, UiSceneData } from "@/scenes/sceneData";
import {
  GAME_DIMENSIONS,
  SCENE_ACCENT_COLOR,
  SCENE_KEYS,
  SCENE_MUTED_COLOR,
  SCENE_TEXT_COLOR,
} from "@/shared/constants";
import {
  GAME_FLOW_STATES,
  GameFlowController,
} from "@/systems/GameFlowController";
import { HUD_ACTION_IDS, presentHud } from "@/systems/HudPresenter";
import { createGameSession } from "@/systems/GameSession";

import type { GameSessionState } from "@/systems/GameSession";
import type {
  HudActionId,
  HudActionViewModel,
  HudCardViewModel,
  HudStatusStripViewModel,
} from "@/systems/HudPresenter";
import type { GameFlowState } from "@/shared/types";

interface OverlayButton {
  readonly background: Phaser.GameObjects.Rectangle;
  readonly container: Phaser.GameObjects.Container;
  currentActionId: HudActionId | null;
  readonly icon: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
}

interface OverlayLayout {
  readonly buttonWidth: number;
  readonly bodyY: number;
  readonly bodyTextColor: string;
  readonly centerX: number;
  readonly frameFillColor: number;
  readonly frameHeight: number;
  readonly frameWidth: number;
  readonly iconMaxHeight: number;
  readonly iconMaxWidth: number;
  readonly iconRotation: number;
  readonly primaryButtonX: number;
  readonly primaryButtonY: number;
  readonly secondaryButtonX: number;
  readonly secondaryButtonY: number;
  readonly textWrapWidth: number;
  readonly titleY: number;
  readonly useActionIcons: boolean;
}

const NOOP_ACTION_HANDLERS: UiActionHandlers = {
  backToStart: () => undefined,
  restart: () => undefined,
  resume: () => undefined,
  start: () => undefined,
};

const HUD_CARD_LAYOUT = {
  minWidth: 0,
  paddingX: 20,
  paddingY: 18,
  right: 0,
  sectionGap: 14,
  top: 0,
} as const;

const RESULT_OVERLAY_LEFT_MARGIN_PX = 8 * 16;
const STATUS_STRIP_LAYOUT = {
  backgroundAlpha: 1,
  backgroundColor: 0xffffff,
  coinGap: 18,
  coinIconHeight: 56,
  coinIconWidth: 56,
  dividerGap: 20,
  heartGap: 12,
  heartHeight: 70,
  heartWidth: 70,
  paddingX: 18,
  paddingY: 12,
  textGap: 14,
  x: 0,
  y: 0,
} as const;
const STATUS_STRIP_TEXT_COLOR = "#111111";

export class UiScene extends Phaser.Scene {
  private actionHandlers: UiActionHandlers = NOOP_ACTION_HANDLERS;
  private controlsText!: Phaser.GameObjects.Text;
  private flowController = new GameFlowController(GAME_FLOW_STATES.start);
  private hudPanel!: Phaser.GameObjects.Graphics;
  private hudTitleText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private overlayBackdrop!: Phaser.GameObjects.Rectangle;
  private overlayBodyText!: Phaser.GameObjects.Text;
  private overlayFrame!: Phaser.GameObjects.Graphics;
  private overlayResultImage!: Phaser.GameObjects.Image;
  private overlayPrimaryButton!: OverlayButton;
  private overlaySecondaryButton!: OverlayButton;
  private overlayTitleText!: Phaser.GameObjects.Text;
  private session: GameSessionState = createGameSession({
    initialLives: LIVES_CONFIG.initialLives,
    levelKey: "unknown",
    levelName: "Unknown level",
    totalCoins: 0,
  });
  private statusCoinIcon!: Phaser.GameObjects.Image;
  private statusCoinText!: Phaser.GameObjects.Text;
  private statusDividerText!: Phaser.GameObjects.Text;
  private readonly statusLifeIcons: Phaser.GameObjects.Image[] = [];
  private statusStripPanel!: Phaser.GameObjects.Graphics;
  private unsubscribeFlowListener: (() => void) | null = null;

  public constructor() {
    super(SCENE_KEYS.ui);
  }

  public init(data: Partial<UiSceneData>): void {
    if (data.actionHandlers) {
      this.actionHandlers = data.actionHandlers;
    }

    if (data.flowController) {
      this.flowController = data.flowController;
    }

    if (data.session) {
      this.session = data.session;
    }
  }

  public create(): void {
    this.createHud();
    this.createOverlay();

    this.unsubscribeFlowListener = this.flowController.subscribe(() => {
      this.refreshView();
    });

    this.refreshView();
    this.events.on(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);
      this.unsubscribeFlowListener?.();
      this.unsubscribeFlowListener = null;
    });
  }

  private bindButton(
    button: OverlayButton,
    action: HudActionViewModel | null,
    layout: OverlayLayout,
    toneColor: string,
  ): void {
    if (!action) {
      button.container.setVisible(false);
      button.currentActionId = null;
      this.resetButtonInteractivity(button);
      return;
    }

    const labelText = `${action.label} · ${action.hotkeyLabel}`;
    const iconKey = this.getButtonIconKey(action.id, layout.useActionIcons);
    const flowState = this.flowController.getState();

    if (
      button.currentActionId === action.id &&
      (iconKey
        ? button.icon.texture.key === iconKey
        : button.label.text === labelText) &&
      button.container.visible
    ) {
      return;
    }

    button.currentActionId = action.id;
    button.container.setVisible(true);
    button.background.setSize(layout.buttonWidth, 56);
    button.label.setText(labelText);
    button.background.setStrokeStyle(2, this.toColorNumber(toneColor), 0.9);
    button.container.setSize(
      iconKey ? layout.iconMaxWidth : layout.buttonWidth,
      iconKey ? layout.iconMaxHeight : 56,
    );
    this.resetButtonInteractivity(button);

    if (iconKey) {
      button.background.setVisible(false);
      button.label.setVisible(false);
      button.icon.setTexture(iconKey);
      this.fitImageToBox(
        button.icon,
        layout.iconMaxWidth,
        layout.iconMaxHeight,
      );
      button.icon.setRotation(this.getButtonIconRotation(action.id, layout));
      button.icon.setVisible(true);
      this.applyButtonIconAppearance(button.icon, action.id, flowState);
      button.icon.setInteractive({ useHandCursor: true });
    } else {
      button.background.setVisible(true);
      button.label.setVisible(true);
      button.icon.setRotation(0);
      button.icon.setVisible(false);
      button.background.setInteractive({ useHandCursor: true });
    }

    const hitTarget = iconKey ? button.icon : button.background;

    hitTarget.on("pointerdown", () => {
      this.invokeAction(action.id);
    });
    hitTarget.on("pointerover", () => {
      if (iconKey) {
        this.applyButtonIconAppearance(
          button.icon,
          action.id,
          flowState,
          SCENE_ACCENT_COLOR,
        );
        return;
      }

      button.background.setFillStyle(0x1e293b, 0.96);
    });
    hitTarget.on("pointerout", () => {
      if (iconKey) {
        this.applyButtonIconAppearance(button.icon, action.id, flowState);
        return;
      }

      button.background.setFillStyle(0x0f172a, 0.94);
    });
  }

  private createHudPanel(): void {
    this.statusLifeIcons.length = 0;
    this.hudPanel = this.add.graphics();
    this.statusStripPanel = this.add.graphics();

    for (let index = 0; index < LIVES_CONFIG.initialLives; index += 1) {
      this.statusLifeIcons.push(this.add.image(0, 0, ASSET_KEYS.lives));
    }

    this.statusDividerText = this.add
      .text(0, 0, "/", {
        color: STATUS_STRIP_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: "54px",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.statusCoinIcon = this.add.image(0, 0, ASSET_KEYS.coin);
    this.statusCoinText = this.add
      .text(0, 0, "0", {
        color: STATUS_STRIP_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: "42px",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);

    this.hudTitleText = this.add.text(0, 0, "CatNap", {
      color: "#000000",
      fontFamily: "monospace",
      fontSize: "28px",
      fontStyle: "bold",
    });

    this.infoText = this.add.text(0, 0, "", {
      color: "#000000",
      fontFamily: "monospace",
      fontSize: "15px",
      lineSpacing: 4,
    });

    this.controlsText = this.add.text(0, 0, "", {
      color: "#000000",
      fontFamily: "monospace",
      fontSize: "15px",
      lineSpacing: 4,
    });
  }

  private createHud(): void {
    this.createHudPanel();
  }

  private createOverlay(): void {
    const { height, width } = GAME_DIMENSIONS;

    this.overlayResultImage = this.add
      .image(width / 2, height / 2, ASSET_KEYS.win)
      .setVisible(false);
    this.fitImageToViewport(this.overlayResultImage);

    this.overlayBackdrop = this.add
      .rectangle(width / 2, height / 2, width, height, 0x020617, 0.72)
      .setVisible(false);

    this.overlayFrame = this.add.graphics().setVisible(false);

    this.overlayTitleText = this.add
      .text(width / 2, height / 2 - 132, "", {
        color: SCENE_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: "42px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.overlayBodyText = this.add
      .text(width / 2, height / 2 - 28, "", {
        align: "center",
        color: SCENE_MUTED_COLOR,
        fontFamily: "monospace",
        fontSize: "22px",
        lineSpacing: 12,
        wordWrap: { width: 580 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.overlayPrimaryButton = this.createOverlayButton(height / 2 + 102);
    this.overlaySecondaryButton = this.createOverlayButton(height / 2 + 172);
  }

  private createOverlayButton(y: number): OverlayButton {
    const { width } = GAME_DIMENSIONS;
    const background = this.add.rectangle(0, 0, 300, 56, 0x0f172a, 0.94);
    const icon = this.add.image(0, 0, ASSET_KEYS.restart).setVisible(false);
    const label = this.add
      .text(0, 0, "", {
        color: SCENE_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const container = this.add
      .container(width / 2, y, [background, icon, label])
      .setSize(300, 56)
      .setVisible(false);

    return {
      background,
      container,
      currentActionId: null,
      icon,
      label,
    };
  }

  private drawOverlayFrame(layout: OverlayLayout, strokeColor: string): void {
    const { height } = GAME_DIMENSIONS;

    this.overlayFrame.clear();
    this.overlayFrame.fillStyle(layout.frameFillColor, 0.92);
    this.overlayFrame.fillRoundedRect(
      layout.centerX - layout.frameWidth / 2,
      height / 2 - layout.frameHeight / 2,
      layout.frameWidth,
      layout.frameHeight,
      28,
    );
    this.overlayFrame.lineStyle(2, this.toColorNumber(strokeColor), 0.9);
    this.overlayFrame.strokeRoundedRect(
      layout.centerX - layout.frameWidth / 2,
      height / 2 - layout.frameHeight / 2,
      layout.frameWidth,
      layout.frameHeight,
      28,
    );
  }

  private fitImageToViewport(image: Phaser.GameObjects.Image): void {
    const { height, width } = GAME_DIMENSIONS;
    const coverScale = Math.max(
      width / image.frame.width,
      height / image.frame.height,
    );

    image.setScale(coverScale);
  }

  private fitImageToBox(
    image: Phaser.GameObjects.Image,
    maxWidth: number,
    maxHeight: number,
  ): void {
    const containScale = Math.min(
      maxWidth / image.frame.width,
      maxHeight / image.frame.height,
    );

    image.setScale(containScale);
  }

  private resetButtonInteractivity(button: OverlayButton): void {
    button.container.removeAllListeners();
    button.background.removeAllListeners();
    button.icon.removeAllListeners();
    button.background.disableInteractive();
    button.icon.disableInteractive();
  }

  private getButtonIconKey(
    actionId: HudActionId,
    useActionIcons: boolean,
  ):
    | typeof ASSET_KEYS.arrow
    | typeof ASSET_KEYS.home
    | typeof ASSET_KEYS.restart
    | null {
    if (!useActionIcons) {
      return null;
    }

    if (actionId === HUD_ACTION_IDS.start) {
      return ASSET_KEYS.arrow;
    }

    if (actionId === HUD_ACTION_IDS.resume) {
      return ASSET_KEYS.arrow;
    }

    if (actionId === HUD_ACTION_IDS.restart) {
      return ASSET_KEYS.restart;
    }

    if (actionId === HUD_ACTION_IDS.backToStart) {
      return ASSET_KEYS.home;
    }

    return null;
  }

  private getButtonIconRotation(
    actionId: HudActionId,
    layout: OverlayLayout,
  ): number {
    if (
      this.flowController.getState() === GAME_FLOW_STATES.paused &&
      actionId === HUD_ACTION_IDS.resume
    ) {
      return Phaser.Math.DegToRad(90);
    }

    return layout.iconRotation;
  }

  private applyButtonIconAppearance(
    icon: Phaser.GameObjects.Image,
    actionId: HudActionId,
    flowState: GameFlowState,
    tintColor: string | null = null,
  ): void {
    const useFillTint =
      flowState === GAME_FLOW_STATES.paused &&
      actionId === HUD_ACTION_IDS.restart;

    icon.setTintMode(
      useFillTint ? Phaser.TintModes.FILL : Phaser.TintModes.MULTIPLY,
    );

    if (tintColor) {
      icon.setTint(this.toColorNumber(tintColor));
      return;
    }

    if (useFillTint) {
      icon.setTint(0xffffff);
      return;
    }

    icon.clearTint();
  }

  private handleUpdate(): void {
    this.refreshView();
  }

  private layoutHudCard(viewModel: HudCardViewModel): void {
    const { minWidth, paddingX, paddingY, right, sectionGap, top } =
      HUD_CARD_LAYOUT;

    this.hudTitleText.setText(viewModel.title);
    this.infoText.setText(viewModel.infoLines.join("\n"));
    this.controlsText.setText(viewModel.controlsLines.join("\n"));

    const titleY = top + paddingY;

    const contentWidth = Math.max(
      this.hudTitleText.width,
      this.infoText.width,
      this.controlsText.width,
    );
    const panelWidth = Math.max(
      minWidth,
      Math.ceil(contentWidth + paddingX * 2),
    );
    const x = GAME_DIMENSIONS.width - right - panelWidth;
    const textX = x + paddingX;

    this.hudTitleText.setPosition(textX, titleY);
    this.infoText.setPosition(
      textX,
      titleY + this.hudTitleText.height + sectionGap,
    );
    this.controlsText.setPosition(
      textX,
      this.infoText.y + this.infoText.height + sectionGap,
    );

    const panelHeight = Math.ceil(
      this.controlsText.y + this.controlsText.height - top + paddingY,
    );

    this.hudPanel.clear();
    this.hudPanel.fillStyle(0xffffff, 1);
    this.hudPanel.fillRect(x, top, panelWidth, panelHeight);
  }

  private layoutStatusStrip(viewModel: HudStatusStripViewModel): void {
    const {
      backgroundAlpha,
      backgroundColor,
      coinGap,
      coinIconHeight,
      coinIconWidth,
      dividerGap,
      heartGap,
      heartHeight,
      heartWidth,
      paddingX,
      paddingY,
      textGap,
      x,
      y,
    } = STATUS_STRIP_LAYOUT;
    const contentCenterY = y + paddingY + heartHeight / 2;
    let cursorX = x + paddingX;

    for (const [index, icon] of this.statusLifeIcons.entries()) {
      const lifeState = viewModel.lives[index] ?? "empty";
      const textureKey =
        lifeState === "full" ? ASSET_KEYS.lives : ASSET_KEYS.notLives;

      icon.setTexture(textureKey);
      this.fitImageToBox(icon, heartWidth, heartHeight);
      icon.setPosition(cursorX + icon.displayWidth / 2, contentCenterY);
      cursorX += icon.displayWidth + heartGap;
    }

    cursorX -= heartGap;
    cursorX += dividerGap;

    this.statusDividerText.setPosition(cursorX, contentCenterY);
    cursorX += this.statusDividerText.width + dividerGap;

    this.fitImageToBox(this.statusCoinIcon, coinIconWidth, coinIconHeight);
    this.statusCoinIcon.setPosition(
      cursorX + this.statusCoinIcon.displayWidth / 2,
      contentCenterY,
    );
    cursorX += this.statusCoinIcon.displayWidth + coinGap;

    this.statusCoinText.setText(viewModel.coinText);
    this.statusCoinText.setPosition(cursorX + textGap, contentCenterY);

    const contentHeight = Math.max(
      heartHeight,
      this.statusDividerText.height,
      this.statusCoinIcon.displayHeight,
      this.statusCoinText.height,
    );
    const panelWidth = Math.ceil(
      this.statusCoinText.x + this.statusCoinText.width - x + paddingX,
    );
    const panelHeight = Math.ceil(contentHeight + paddingY * 2);

    this.statusStripPanel.clear();
    this.statusStripPanel.fillStyle(backgroundColor, backgroundAlpha);
    this.statusStripPanel.fillRect(x, y, panelWidth, panelHeight);
  }

  private getOverlayLayout(flowState: GameFlowState): OverlayLayout {
    if (flowState === GAME_FLOW_STATES.start) {
      const frameWidth = 520;
      const sectionGap = 92;
      const sectionCenterY = GAME_DIMENSIONS.height / 2;

      return {
        buttonWidth: 272,
        bodyY: sectionCenterY,
        bodyTextColor: SCENE_TEXT_COLOR,
        centerX: GAME_DIMENSIONS.width / 2,
        frameFillColor: 0x000000,
        frameHeight: 420,
        frameWidth,
        iconMaxHeight: 104,
        iconMaxWidth: 104,
        iconRotation: Phaser.Math.DegToRad(90),
        primaryButtonX: GAME_DIMENSIONS.width / 2,
        primaryButtonY: sectionCenterY + sectionGap,
        secondaryButtonX: GAME_DIMENSIONS.width / 2,
        secondaryButtonY: sectionCenterY + sectionGap,
        textWrapWidth: 420,
        titleY: sectionCenterY - sectionGap,
        useActionIcons: true,
      };
    }

    if (flowState === GAME_FLOW_STATES.paused) {
      const frameWidth = 680;
      const iconRowHalfGap = 96;

      return {
        buttonWidth: 272,
        bodyY: GAME_DIMENSIONS.height / 2 - 28,
        bodyTextColor: "#ffffff",
        centerX: GAME_DIMENSIONS.width / 2,
        frameFillColor: 0x000000,
        frameHeight: 420,
        frameWidth,
        iconMaxHeight: 96,
        iconMaxWidth: 116,
        iconRotation: 0,
        primaryButtonX: GAME_DIMENSIONS.width / 2 - iconRowHalfGap,
        primaryButtonY: GAME_DIMENSIONS.height / 2 + 112,
        secondaryButtonX: GAME_DIMENSIONS.width / 2 + iconRowHalfGap,
        secondaryButtonY: GAME_DIMENSIONS.height / 2 + 112,
        textWrapWidth: 580,
        titleY: GAME_DIMENSIONS.height / 2 - 132,
        useActionIcons: true,
      };
    }

    if (
      flowState === GAME_FLOW_STATES.won ||
      flowState === GAME_FLOW_STATES.lost
    ) {
      const frameWidth = 552;
      const iconRowHalfGap = 86;

      return {
        buttonWidth: 272,
        bodyY: GAME_DIMENSIONS.height / 2 - 15,
        bodyTextColor: "#000000",
        centerX: RESULT_OVERLAY_LEFT_MARGIN_PX + frameWidth / 2,
        frameFillColor: 0xffffff,
        frameHeight: 404,
        frameWidth,
        iconMaxHeight: 96,
        iconMaxWidth: 116,
        iconRotation: 0,
        primaryButtonX:
          RESULT_OVERLAY_LEFT_MARGIN_PX + frameWidth / 2 - iconRowHalfGap,
        primaryButtonY: GAME_DIMENSIONS.height / 2 + 95,
        secondaryButtonX:
          RESULT_OVERLAY_LEFT_MARGIN_PX + frameWidth / 2 + iconRowHalfGap,
        secondaryButtonY: GAME_DIMENSIONS.height / 2 + 95,
        textWrapWidth: 440,
        titleY: GAME_DIMENSIONS.height / 2 - 102,
        useActionIcons: true,
      };
    }

    return {
      buttonWidth: 300,
      bodyY: GAME_DIMENSIONS.height / 2 - 28,
      bodyTextColor: SCENE_MUTED_COLOR,
      centerX: GAME_DIMENSIONS.width / 2,
      frameFillColor: 0x020617,
      frameHeight: 440,
      frameWidth: 680,
      iconMaxHeight: 96,
      iconMaxWidth: 116,
      iconRotation: 0,
      primaryButtonX: GAME_DIMENSIONS.width / 2,
      primaryButtonY: GAME_DIMENSIONS.height / 2 + 102,
      secondaryButtonX: GAME_DIMENSIONS.width / 2,
      secondaryButtonY: GAME_DIMENSIONS.height / 2 + 172,
      textWrapWidth: 580,
      titleY: GAME_DIMENSIONS.height / 2 - 132,
      useActionIcons: false,
    };
  }

  private invokeAction(actionId: HudActionId): void {
    if (actionId === HUD_ACTION_IDS.start) {
      this.actionHandlers.start();
      return;
    }

    if (actionId === HUD_ACTION_IDS.resume) {
      this.actionHandlers.resume();
      return;
    }

    if (actionId === HUD_ACTION_IDS.restart) {
      this.actionHandlers.restart();
      return;
    }

    this.actionHandlers.backToStart();
  }

  private refreshOverlay(
    viewModel: ReturnType<typeof presentHud>["overlay"],
  ): void {
    const isResultOverlay = Boolean(viewModel.backgroundAssetKey);
    const flowState = this.flowController.getState();
    const overlayLayout = this.getOverlayLayout(flowState);

    this.overlayResultImage.setVisible(isResultOverlay);

    this.overlayBackdrop.setVisible(viewModel.isVisible);
    this.overlayFrame.setVisible(viewModel.isVisible);
    this.overlayTitleText.setPosition(
      overlayLayout.centerX,
      overlayLayout.titleY,
    );
    this.overlayTitleText.setVisible(viewModel.isVisible);
    this.overlayBodyText.setPosition(
      overlayLayout.centerX,
      overlayLayout.bodyY,
    );
    this.overlayBodyText.setColor(overlayLayout.bodyTextColor);
    this.overlayBodyText.setWordWrapWidth(overlayLayout.textWrapWidth);
    this.overlayBodyText.setVisible(viewModel.isVisible);
    this.overlayPrimaryButton.container.setPosition(
      overlayLayout.primaryButtonX,
      overlayLayout.primaryButtonY,
    );
    this.overlaySecondaryButton.container.setPosition(
      overlayLayout.secondaryButtonX,
      overlayLayout.secondaryButtonY,
    );

    if (viewModel.backgroundAssetKey) {
      this.overlayResultImage.setTexture(viewModel.backgroundAssetKey);
      this.fitImageToViewport(this.overlayResultImage);
      this.overlayBackdrop.setFillStyle(0x020617, 0.36);
    } else {
      this.overlayBackdrop.setFillStyle(0x020617, 0.72);
    }

    if (!viewModel.isVisible) {
      this.bindButton(
        this.overlayPrimaryButton,
        null,
        overlayLayout,
        SCENE_ACCENT_COLOR,
      );
      this.bindButton(
        this.overlaySecondaryButton,
        null,
        overlayLayout,
        SCENE_ACCENT_COLOR,
      );
      return;
    }

    this.drawOverlayFrame(overlayLayout, viewModel.toneColor);
    this.overlayTitleText
      .setColor(viewModel.toneColor)
      .setText(viewModel.title);
    this.overlayBodyText.setText(viewModel.description);
    this.bindButton(
      this.overlayPrimaryButton,
      viewModel.primaryAction,
      overlayLayout,
      viewModel.toneColor,
    );
    this.bindButton(
      this.overlaySecondaryButton,
      viewModel.secondaryAction,
      overlayLayout,
      SCENE_MUTED_COLOR,
    );
  }

  private refreshView(): void {
    const viewModel = presentHud({
      flowState: this.flowController.getState(),
      session: this.session,
    });

    this.layoutHudCard(viewModel.hudCard);
    this.layoutStatusStrip(viewModel.statusStrip);
    this.refreshOverlay(viewModel.overlay);
  }

  private toColorNumber(hexColor: string): number {
    return Phaser.Display.Color.HexStringToColor(hexColor).color;
  }
}
