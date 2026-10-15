/**
 * tutorialAnim.js
 * Animated 8-Bit demonstration loop for Mission Briefing modal.
 * Shows kids how each movement looks visually before starting camera.
 */

export class TutorialAnimation {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.currentExerciseId = null;
    this.animId = null;
    this.timer = 0;
  }

  start(exerciseId) {
    this.currentExerciseId = exerciseId;
    this.timer = 0;
    this.stop();
    this.loop();
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  loop() {
    this.timer += 0.04;
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);

    // Floor line
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, h - 16);
    ctx.lineTo(w - 10, h - 16);
    ctx.stroke();

    const t = (Math.sin(this.timer) + 1) / 2; // oscillates 0 to 1

    if (this.currentExerciseId === "volleyball_bump") {
      this.drawBumpDemo(ctx, w / 2, h - 16, t);
    } else if (this.currentExerciseId === "volleyball_set") {
      this.drawSetDemo(ctx, w / 2, h - 16, t);
    } else if (this.currentExerciseId === "squat_warmup") {
      this.drawSquatDemo(ctx, w / 2, h - 16, t);
    } else if (this.currentExerciseId === "jumping_jacks") {
      this.drawJacksDemo(ctx, w / 2, h - 16, t);
    } else if (this.currentExerciseId === "volleyball_serve_under") {
      this.drawServeUnderDemo(ctx, w / 2, h - 16, t);
    } else if (this.currentExerciseId === "volleyball_serve_over") {
      this.drawServeOverDemo(ctx, w / 2, h - 16, t);
    }
  }

  drawBumpDemo(ctx, cx, groundY, t) {
    // t=0 is Standing, t=1 is Squatting down
    const squatOffset = t * 16;
    const charY = groundY - 50 + squatOffset;

    ctx.save();
    ctx.translate(cx, charY);

    // Head
    ctx.fillStyle = "#fbd38d";
    ctx.fillRect(-6, 0, 12, 10);
    ctx.fillStyle = "#e53e3e";
    ctx.fillRect(-7, 2, 14, 2); // headband

    // Torso (leaning slightly forward)
    ctx.fillStyle = "#006837";
    ctx.fillRect(-7, 10, 14, 14);

    // Arms locked straight reaching forward-down
    ctx.strokeStyle = "#fbd38d";
    ctx.lineWidth = 4;
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.lineTo(12, 22);
    ctx.stroke();

    // Locked hands indicator (flashing green)
    ctx.fillStyle = "#48bb78";
    ctx.fillRect(10, 20, 6, 6);

    // Legs bending at knees
    ctx.fillStyle = "#edf2f7"; // shorts
    ctx.fillRect(-7, 24, 14, 6);

    // Lower legs / feet
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-9, 30, 6, 18 - squatOffset / 2);
    ctx.fillRect(3, 30, 6, 18 - squatOffset / 2);

    ctx.restore();

    // Guidance text
    ctx.fillStyle = t > 0.6 ? "#ecc94b" : "#48bb78";
    ctx.font = "bold 10px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t > 0.6 ? "⬇️ ย่อเข่า แขนตึง!" : "⬆️ ส่งแรงขึ้น!", cx, 20);
  }

  drawSetDemo(ctx, cx, groundY, t) {
    // t=0 hands high pushing, t=1 hands at forehead crouching
    const squatOffset = t * 12;
    const charY = groundY - 50 + squatOffset;

    ctx.save();
    ctx.translate(cx, charY);

    // Head
    ctx.fillStyle = "#fbd38d";
    ctx.fillRect(-6, 4, 12, 10);
    ctx.fillStyle = "#e53e3e";
    ctx.fillRect(-7, 5, 14, 2);

    // Hands raised above forehead (Cup shape)
    const armExtend = (1 - t) * 10;
    ctx.fillStyle = "#fbd38d";
    // Left hand
    ctx.fillRect(-10, -6 - armExtend, 6, 6);
    // Right hand
    ctx.fillRect(4, -6 - armExtend, 6, 6);

    // Triangular cup indicator
    ctx.strokeStyle = "#ecc94b";
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -8 - armExtend, 16, 8);

    // Torso
    ctx.fillStyle = "#006837";
    ctx.fillRect(-7, 14, 14, 14);

    // Legs
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-7, 28, 5, 18 - squatOffset / 2);
    ctx.fillRect(2, 28, 5, 18 - squatOffset / 2);

    ctx.restore();

    ctx.fillStyle = t > 0.5 ? "#ecc94b" : "#48bb78";
    ctx.font = "bold 10px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t > 0.5 ? "🙌 ย่อรับ ตั้งมือเป็นถ้วย" : "🚀 ผลักบอลขึ้นฟ้า!", cx, 20);
  }

  drawSquatDemo(ctx, cx, groundY, t) {
    const squatOffset = t * 20;
    const charY = groundY - 50 + squatOffset;

    ctx.save();
    ctx.translate(cx, charY);
    ctx.fillStyle = "#fbd38d";
    ctx.fillRect(-6, 0, 12, 10);
    ctx.fillStyle = "#006837";
    ctx.fillRect(-7, 10, 14, 14);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-8, 24, 6, 20 - squatOffset / 2);
    ctx.fillRect(2, 24, 6, 20 - squatOffset / 2);
    ctx.restore();

    ctx.fillStyle = t > 0.6 ? "#ecc94b" : "#48bb78";
    ctx.font = "bold 10px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t > 0.6 ? "⬇️ ย่อสะโพกลง" : "⬆️ ดันตัวยืนตรง", cx, 20);
  }

  drawJacksDemo(ctx, cx, groundY, t) {
    ctx.save();
    ctx.translate(cx, groundY - 45);

    // Spreading arms and legs when t > 0.5
    const spread = t * 14;

    ctx.fillStyle = "#fbd38d";
    ctx.fillRect(-5, 0, 10, 10);
    ctx.fillStyle = "#006837";
    ctx.fillRect(-6, 10, 12, 14);

    // Arms
    ctx.strokeStyle = "#fbd38d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, 12);
    ctx.lineTo(-6 - spread, 12 - spread);
    ctx.moveTo(6, 12);
    ctx.lineTo(6 + spread, 12 - spread);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(-4, 24);
    ctx.lineTo(-4 - spread / 1.5, 42);
    ctx.moveTo(4, 24);
    ctx.lineTo(4 + spread / 1.5, 42);
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = t > 0.5 ? "#ecc94b" : "#48bb78";
    ctx.font = "bold 10px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t > 0.5 ? "⭐ กางแขนกางขา!" : "🧍 หุบแขนแนบลำตัว", cx, 20);
  }

  drawServeUnderDemo(ctx, cx, groundY, t) {
    // t=0 is Arm back, t=1 is Arm swinging forward and up
    const charY = groundY - 50;
    ctx.save();
    ctx.translate(cx, charY);

    // Head
    ctx.fillStyle = "#fbd38d";
    ctx.fillRect(-6, 2, 12, 10);
    ctx.fillStyle = "#e53e3e";
    ctx.fillRect(-7, 3, 14, 2);

    // Torso (facing slightly right)
    ctx.fillStyle = "#006837";
    ctx.fillRect(-6, 12, 12, 14);

    // Left hand holding ball out in front (waist level)
    ctx.strokeStyle = "#fbd38d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(12, 18);
    ctx.stroke();

    // Volleyball in front of waist
    ctx.fillStyle = "#ecc94b";
    ctx.beginPath();
    ctx.arc(14, 18, 4, 0, Math.PI * 2);
    ctx.fill();

    // Right hitting arm swinging from back (-15px) to forward (+16px)
    const swingX = -12 + t * 26;
    const swingY = 24 - t * 14;
    ctx.strokeStyle = "#fbd38d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-2, 14);
    ctx.lineTo(swingX, swingY);
    ctx.stroke();

    // Fist hitting indicator
    ctx.fillStyle = "#48bb78";
    ctx.fillRect(swingX - 2, swingY - 2, 5, 5);

    // Legs
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-6, 26, 5, 18);
    ctx.fillRect(2, 26, 5, 18);

    ctx.restore();

    ctx.fillStyle = t < 0.4 ? "#ecc94b" : "#48bb78";
    ctx.font = "bold 10px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t < 0.4 ? "🎯 1. ง้างแขนไปข้างหลัง" : "💥 2. เหวี่ยงเสยส่งบอลข้ามเน็ต!", cx, 20);
  }

  drawServeOverDemo(ctx, cx, groundY, t) {
    // t=0 is Cocked back, t=1 is High Smash
    const charY = groundY - 50;
    ctx.save();
    ctx.translate(cx, charY);

    // Head
    ctx.fillStyle = "#fbd38d";
    ctx.fillRect(-6, 4, 12, 10);
    ctx.fillStyle = "#e53e3e";
    ctx.fillRect(-7, 5, 14, 2);

    // Torso
    ctx.fillStyle = "#006837";
    ctx.fillRect(-6, 14, 12, 14);

    // Left hand tossing ball up
    ctx.strokeStyle = "#fbd38d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 16);
    ctx.lineTo(8, 4);
    ctx.stroke();

    // Volleyball high in air
    const ballY = -6 - t * 8;
    ctx.fillStyle = "#ecc94b";
    ctx.beginPath();
    ctx.arc(8, ballY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Right hitting arm
    // t=0: elbow bent near ear (-6, 0), t=1: arm extended straight up reaching ball (8, -10)
    const armEndX = -6 + t * 14;
    const armEndY = 4 - t * 16;
    ctx.strokeStyle = "#fbd38d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-2, 16);
    ctx.lineTo(armEndX, armEndY);
    ctx.stroke();

    // Smash spark when hitting
    if (t > 0.7) {
      ctx.fillStyle = "#e53e3e";
      ctx.fillText("⚡", armEndX - 4, armEndY - 4);
    }

    // Legs
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-6, 28, 5, 18);
    ctx.fillRect(2, 28, 5, 18);

    ctx.restore();

    ctx.fillStyle = t < 0.5 ? "#ecc94b" : "#e53e3e";
    ctx.font = "bold 10px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t < 0.5 ? "⚡ 1. ยกศอกง้างเตรียมฟาด" : "💥 2. ฟาดลูกบอลจุดสูงสุดเหนือหัว!", cx, 20);
  }
}

