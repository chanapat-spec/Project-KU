/**
 * engine.js
 * Hybrid 2D Map Game Engine (ZEP QUIZ Style).
 * Runs the 60 FPS loop, camera scrolling, multiplayer classmates, and interaction triggers.
 */

import { Player } from "./player.js";
import { GymMap } from "./map.js";
import { VirtualControls } from "./joystick.js";
import { multiplayer } from "./multiplayer.js";
import { storage } from "../storage.js";
import { supabase } from "../supabaseClient.js";

export class GameEngine {
  constructor(canvasElement, onInteract) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.onInteract = onInteract;

    // Viewport Resolution (Crisp retro ratio)
    this.internalWidth = 360;
    this.internalHeight = 360;
    this.canvas.width = this.internalWidth;
    this.canvas.height = this.internalHeight;

    // Smooth Following Camera
    this.camera = { x: 0, y: 380 };

    // Hybrid Map (Forest Camp y:0-360 + Volleyball Arena y:360-740)
    this.map = new GymMap(this.internalWidth, 740);

    // Player spawns near the Volleyball court entrance
    this.player = new Player(180, 520);
    this.controls = new VirtualControls();
    this.multiplayer = multiplayer;

    this.currentActiveZone = null;
    this.isPaused = false;
    this.animationId = null;

    // Load Top 3 Champions for the Podium
    this.loadPodiumChampions();

    // Bind action button press
    this.controls.onActionPress = () => {
      if (this.currentActiveZone && this.onInteract && !this.isPaused) {
        this.onInteract(this.currentActiveZone);
      }
    };
  }

  async loadPodiumChampions() {
    try {
      const student = storage.getStudent();
      const room = student?.room || "ALL";
      let topList = [];

      if (supabase.isConfigured()) {
        const cloudLB = await supabase.fetchLeaderboard(room);
        if (cloudLB && cloudLB.length > 0) topList = cloudLB;
      }

      if (topList.length === 0) {
        topList = storage.getLeaderboard();
      }

      this.map.setTopChampions(topList.slice(0, 3));
    } catch (e) {
      // Fallback
    }
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
    if (this.multiplayer) {
      this.multiplayer.pause();
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      if (this.multiplayer) {
        this.multiplayer.resume();
      }
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
    // 1. Update player position across full 740px hybrid map
    this.player.update(this.controls, {
      minX: 12,
      maxX: this.internalWidth - 12,
      minY: 28,
      maxY: this.map.height - 24
    });

    // 2. Smooth Camera Tracking (Follows player Y with LERP damping)
    const targetCameraY = Math.max(
      0,
      Math.min(this.map.height - this.internalHeight, this.player.y - this.internalHeight / 2)
    );
    this.camera.y += (targetCameraY - this.camera.y) * 0.12;

    // 3. Update Multiplayer Peers (Interpolation & broadcast)
    this.multiplayer.update();
    this.multiplayer.sendPlayerState(this.player);

    // 4. Check nearby interactive zones
    this.currentActiveZone = this.map.checkNearbyZone(this.player.x, this.player.y);
    this.player.activeZone = this.currentActiveZone;
  }

  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // Clear Screen
    ctx.clearRect(0, 0, this.internalWidth, this.internalHeight);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(0, -Math.round(this.camera.y));

    // 1. Draw Map (Forest Camp + Gateway + Volleyball Arena)
    this.map.draw(ctx, Player);

    // 2. Draw Live Multiplayer Classmates (Peers)
    for (const peer of this.multiplayer.peers.values()) {
      Player.renderAvatar(ctx, Math.round(peer.x), Math.round(peer.y), {
        direction: peer.direction || "down",
        isMoving: peer.isMoving,
        animFrame: peer.animFrame || 0,
        jerseyColor: peer.wardrobe?.jerseyColor || "#006837",
        headbandColor: peer.wardrobe?.headbandColor || "#e53e3e",
        headwear: peer.wardrobe?.headwear || "headband",
        outfit: peer.wardrobe?.outfit || "jersey",
        hasPet: peer.wardrobe?.hasPet || false,
        petFloatTimer: Date.now() / 220,
        name: peer.name,
        studentNumber: peer.studentNumber,
        room: peer.room,
        showNameTag: true
      });
    }

    // 3. Draw Local Player Character (with Chibi Avatar & Name Tag)
    this.player.draw(ctx);

    ctx.restore();

    // 4. Draw Interaction Prompt Banner (Screen Space, always visible!)
    if (this.currentActiveZone) {
      this.drawInteractionPrompt(ctx, this.currentActiveZone.prompt);
    }
  }

  drawInteractionPrompt(ctx, text) {
    ctx.save();
    const bannerH = 26;
    const bannerY = 8;
    const bannerW = 250;
    const bannerX = (this.internalWidth - bannerW) / 2;

    // Shadow
    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.beginPath();
    ctx.roundRect(bannerX + 1, bannerY + 2, bannerW, bannerH, 14);
    ctx.fill();

    // Dark slate rounded container
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 14);
    ctx.fill();

    // Pulse stroke
    const pulseAlpha = 0.7 + Math.sin(Date.now() / 200) * 0.3;
    ctx.strokeStyle = `rgba(255, 107, 0, ${pulseAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Action Key Pill '[A]'
    ctx.fillStyle = "#FF6B00";
    ctx.beginPath();
    ctx.roundRect(bannerX + 6, bannerY + 4, 22, 18, 6);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 9px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", bannerX + 17, bannerY + 13.5);

    // Prompt Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px 'Prompt', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text.replace(/\[A\]\s*/, ""), bannerX + 34, bannerY + 13.5);

    ctx.restore();
  }
}
