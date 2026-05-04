import * as Phaser from "phaser";

import { VIDEO_ASSET_PATHS } from "@/content/assets";
import type { GameplayBootstrapData } from "@/scenes/sceneData";
import { SCENE_KEYS } from "@/shared/constants";

const INTRO_OVERLAY_ATTRIBUTE = "data-catnap-intro-overlay";

type IntroPlaybackState = "loading" | "awaiting-start" | "playing";

export class IntroScene extends Phaser.Scene {
  private bootstrapData: GameplayBootstrapData | null = null;
  private hasTransitioned = false;
  private overlayRoot: HTMLDivElement | null = null;
  private playbackState: IntroPlaybackState = "loading";
  private statusLabel: HTMLParagraphElement | null = null;
  private videoElement: HTMLVideoElement | null = null;

  private readonly handleOverlayClick = (): void => {
    if (this.playbackState === "awaiting-start") {
      void this.tryStartPlayback();
      return;
    }

    if (this.playbackState === "playing") {
      this.finishIntro();
    }
  };

  private readonly handleVideoEnded = (): void => {
    this.finishIntro();
  };

  private readonly handleVideoError = (): void => {
    this.setStatus("Intro unavailable. Starting game...");
    this.time.delayedCall(250, () => {
      this.finishIntro();
    });
  };

  private readonly handleVideoLoadedData = (): void => {
    void this.tryStartPlayback();
  };

  private readonly handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (!["Space", "Enter", "Escape"].includes(event.code)) {
      return;
    }

    event.preventDefault();

    if (this.playbackState === "awaiting-start") {
      void this.tryStartPlayback();
      return;
    }

    if (this.playbackState === "playing") {
      this.finishIntro();
    }
  };

  public constructor() {
    super(SCENE_KEYS.intro);
  }

  public init(data: GameplayBootstrapData): void {
    this.bootstrapData = data;
    this.hasTransitioned = false;
    this.playbackState = "loading";
  }

  public create(): void {
    if (!this.bootstrapData) {
      throw new Error("IntroScene requires gameplay bootstrap data.");
    }

    this.cameras.main.setBackgroundColor("#000000");
    this.cleanupStaleOverlay();

    const overlayRoot = document.createElement("div");
    const statusLabel = document.createElement("p");
    const videoElement = document.createElement("video");

    overlayRoot.setAttribute(INTRO_OVERLAY_ATTRIBUTE, "true");
    overlayRoot.style.position = "fixed";
    overlayRoot.style.inset = "0";
    overlayRoot.style.zIndex = "9999";
    overlayRoot.style.display = "flex";
    overlayRoot.style.flexDirection = "column";
    overlayRoot.style.alignItems = "center";
    overlayRoot.style.justifyContent = "center";
    overlayRoot.style.gap = "24px";
    overlayRoot.style.padding = "32px";
    overlayRoot.style.backgroundColor = "#000000";
    overlayRoot.style.cursor = "pointer";

    videoElement.src = VIDEO_ASSET_PATHS.intro;
    videoElement.preload = "auto";
    videoElement.playsInline = true;
    videoElement.autoplay = false;
    videoElement.controls = false;
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.style.maxWidth = "100vw";
    videoElement.style.maxHeight = "100vh";
    videoElement.style.objectFit = "contain";
    videoElement.style.backgroundColor = "#000000";

    statusLabel.style.margin = "0";
    statusLabel.style.color = "#e2e8f0";
    statusLabel.style.fontFamily = "monospace";
    statusLabel.style.fontSize = "18px";
    statusLabel.style.letterSpacing = "0.04em";
    statusLabel.style.textAlign = "center";

    overlayRoot.append(videoElement, statusLabel);
    document.body.append(overlayRoot);

    overlayRoot.addEventListener("click", this.handleOverlayClick);
    videoElement.addEventListener("loadeddata", this.handleVideoLoadedData);
    videoElement.addEventListener("ended", this.handleVideoEnded);
    videoElement.addEventListener("error", this.handleVideoError);
    window.addEventListener("keydown", this.handleWindowKeyDown);

    this.overlayRoot = overlayRoot;
    this.statusLabel = statusLabel;
    this.videoElement = videoElement;

    this.setStatus("Loading intro...");

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupIntroDom();
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.cleanupIntroDom();
    });
  }

  private cleanupIntroDom(): void {
    window.removeEventListener("keydown", this.handleWindowKeyDown);

    if (this.videoElement) {
      this.videoElement.removeEventListener(
        "loadeddata",
        this.handleVideoLoadedData,
      );
      this.videoElement.removeEventListener("ended", this.handleVideoEnded);
      this.videoElement.removeEventListener("error", this.handleVideoError);
      this.videoElement.pause();
      this.videoElement.removeAttribute("src");
      this.videoElement.load();
    }

    if (this.overlayRoot) {
      this.overlayRoot.removeEventListener("click", this.handleOverlayClick);
      this.overlayRoot.remove();
    }

    this.overlayRoot = null;
    this.statusLabel = null;
    this.videoElement = null;
  }

  private cleanupStaleOverlay(): void {
    document
      .querySelectorAll<HTMLElement>(`[${INTRO_OVERLAY_ATTRIBUTE}="true"]`)
      .forEach((node) => {
        node.remove();
      });
  }

  private finishIntro(): void {
    if (this.hasTransitioned || !this.bootstrapData) {
      return;
    }

    this.hasTransitioned = true;
    this.scene.start(SCENE_KEYS.game, this.bootstrapData);
  }

  private setStatus(message: string): void {
    if (!this.statusLabel) {
      return;
    }

    this.statusLabel.textContent = message;
  }

  private async tryStartPlayback(): Promise<void> {
    if (!this.videoElement || this.hasTransitioned) {
      return;
    }

    try {
      await this.videoElement.play();
      this.playbackState = "playing";
      this.setStatus("Click, Space, Enter or Esc to skip");
    } catch {
      this.playbackState = "awaiting-start";
      this.setStatus("Click, Space or Enter to start intro");
    }
  }
}
