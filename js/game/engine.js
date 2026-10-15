/**
 * engine.js
 * Retro 2D Map Game Engine (ZEP QUIZ Style).
 * Runs the loop, renders world, handles player movement, and handles interaction triggers.
 */

import { Player } from "./player.js";
import { GymMap } from "./map.js";
import { VirtualControls } from "./joystick.js";

export class GameEngine {
  constructor(canvasElement, onInteract) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.onInteract = onInteract;

    // Set internal resolution for crisp retro pixel art
    this.internalWidth = 360;
    this.internalHeight = 360;
    this.canvas.width = this.internalWidth;
    this.canvas.height = this.internalHeight;

    // Map and Player
    this.map = new GymMap(this.internalWidth, this.internalHeight);
    this.player = new Player(180, 260); // Starts near bottom entrance
    this.controls = new VirtualControls();

    this.currentActiveZone = null;
    this.isPaused = false;
    this.animationId = null;

    // Bind action button press
    this.controls.onActionPress = () => {
      if (this.currentActiveZone && this.onInteract && !this.isPaused) {
        this.onInteract(this.currentActiveZone);
      }
    };
  }

  start() {
    this.isPaused = false;
    this.loop();
  }

  pause() {
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.loop();
    }
  }

  loop() {
    if (this.isPaused) return;

    this.update();
    this.render();

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  update() {
    // Update player position with boundaries
    this.player.update(this.controls, {
      minX: 10,
      maxX: this.internalWidth - 10,
      minY: 40,
      maxY: this.internalHeight - 10
    });

    // Check nearby interactive zones
    this.currentActiveZone = this.map.checkNearbyZone(this.player.x, this.player.y);
    this.player.activeZone = this.currentActiveZone;
  }

  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false; // Keep pixel art sharp!

    // Clear
    ctx.clearRect(0, 0, this.internalWidth, this.internalHeight);

    // Draw Map
    this.map.draw(ctx);

    // Draw Player
    this.player.draw(ctx);

    // Draw Interaction Banner if standing near a zone
    if (this.currentActiveZone) {
      this.drawInteractionPrompt(ctx, this.currentActiveZone.prompt);
    }
  }

  drawInteractionPrompt(ctx, text) {
    ctx.save();
    const bannerH = 26;
    const bannerY = 8;
    const bannerW = 240;
    const bannerX = (this.internalWidth - bannerW) / 2;

    // Floating pill shadow
    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.beginPath();
    ctx.roundRect(bannerX + 1, bannerY + 2, bannerW, bannerH, 14);
    ctx.fill();

    // Dark slate rounded pill container
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 14);
    ctx.fill();

    // Vibrant border with subtle pulse
    const pulseAlpha = 0.7 + Math.sin(Date.now() / 200) * 0.3;
    ctx.strokeStyle = `rgba(255, 107, 0, ${pulseAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Action Key Pill Badge '[A]'
    ctx.fillStyle = "#FF6B00";
    ctx.beginPath();
    ctx.roundRect(bannerX + 6, bannerY + 4, 22, 20, 6);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 9px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", bannerX + 17, bannerY + 14.5);

    // Clean Prompt Text
    // Remove the leading '[A] ' if already present since we rendered the [A] badge
    const cleanText = text.replace(/^\[A\]\s*/, "");
    ctx.fillStyle = "#F8FAFC";
    ctx.font = "bold 10px 'Prompt', 'Nunito', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(cleanText, bannerX + 34, bannerY + 14.5);

    ctx.restore();
  }
}
