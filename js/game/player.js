/**
 * player.js
 * 2D Top-Down Retro Pixel Art Avatar (ZEP QUIZ Style).
 * Features:
 * - Crisp 2D pixel proportions with clean outlines for contrast against wood parquet
 * - Expressive 2x3 pixel sparkling eyes, blush, headband with animated ribbon tails
 * - Dynamic 4-directional walk cycle with arm swings and 1-pixel bounce
 * - Animated floating quest status bubble ('!' or '[A]') above head when near interactive zones
 * - Floating cute 2D pixel flying Volleyball Mascot pet
 */

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.speed = 2.8;
    this.direction = "down"; // down, up, left, right
    this.isMoving = false;
    this.animFrame = 0;
    this.animTimer = 0;

    // Skin & Wardrobe Customization
    this.jerseyColor = "#006837"; // default KU Green
    this.headbandColor = "#e53e3e"; // default Red headband
    this.hasKneepads = false;
    this.hasPet = false; // Flying 8-bit Volleyball Pet
    this.petFloatTimer = 0;

    // Nearby interaction zone for floating status icon
    this.activeZone = null;
  }

  setSkin({ jerseyColor, headbandColor, hasKneepads, hasPet }) {
    if (jerseyColor) this.jerseyColor = jerseyColor;
    if (headbandColor) this.headbandColor = headbandColor;
    if (hasKneepads !== undefined) this.hasKneepads = hasKneepads;
    if (hasPet !== undefined) this.hasPet = hasPet;
  }

  update(controls, mapBounds) {
    const keys = controls.getState();
    let dx = 0;
    let dy = 0;

    if (keys.up) { dy -= 1; this.direction = "up"; }
    if (keys.down) { dy += 1; this.direction = "down"; }
    if (keys.left) { dx -= 1; this.direction = "left"; }
    if (keys.right) { dx += 1; this.direction = "right"; }

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      this.animTimer++;
      if (this.animTimer % 8 === 0) {
        this.animFrame = (this.animFrame + 1) % 4;
      }

      const newX = this.x + dx * this.speed;
      const newY = this.y + dy * this.speed;

      if (mapBounds) {
        if (newX >= mapBounds.minX && newX <= mapBounds.maxX - this.width) {
          this.x = newX;
        }
        if (newY >= mapBounds.minY && newY <= mapBounds.maxY - this.height) {
          this.y = newY;
        }
      } else {
        this.x = newX;
        this.y = newY;
      }
    } else {
      this.animFrame = 0;
    }

    this.petFloatTimer += 0.08;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Shadow underneath character
    ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
    ctx.beginPath();
    ctx.ellipse(12, 30, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle 1-pixel bounce when walking
    const bounce = this.isMoving && (this.animFrame === 1 || this.animFrame === 3) ? 1 : 0;
    const legOffset = this.isMoving ? Math.sin((this.animFrame * Math.PI) / 2) * 3 : 0;

    // --- LEGS & SHOES (2D PIXEL WITH CLEAR OUTLINE) ---
    if (this.direction === "up" || this.direction === "down") {
      // Dark pixel outline for legs
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(4, 21 + legOffset + bounce, 6, 9);
      ctx.fillRect(14, 21 - legOffset + bounce, 6, 9);

      // Left leg socks
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(5, 22 + legOffset + bounce, 4, 6);
      // Right leg socks
      ctx.fillRect(15, 22 - legOffset + bounce, 4, 6);

      // Kneepads if equipped
      if (this.hasKneepads) {
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(4, 21 + legOffset + bounce, 6, 3);
        ctx.fillRect(14, 21 - legOffset + bounce, 6, 3);
      }

      // Shoes / Sneakers (Dark sole with crisp pixel upper)
      ctx.fillStyle = "#334155";
      ctx.fillRect(4, 27 + legOffset + bounce, 6, 3);
      ctx.fillRect(14, 27 - legOffset + bounce, 6, 3);
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(4, 26 + legOffset + bounce, 5, 2);
      ctx.fillRect(14, 26 - legOffset + bounce, 5, 2);
    } else {
      // Side walking outline
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(8, 21 + legOffset + bounce, 8, 9);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(9, 22 + legOffset + bounce, 6, 6);

      if (this.hasKneepads) {
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(8, 21 + legOffset + bounce, 8, 3);
      }

      ctx.fillStyle = "#334155";
      ctx.fillRect(7, 27 + legOffset + bounce, 9, 3);
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(7, 26 + legOffset + bounce, 8, 2);
    }

    // --- SHORTS (WHITE SPORTS SHORTS WITH OUTLINE) ---
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(5, 16 + bounce, 14, 8);
    ctx.fillStyle = "#F1F5F9";
    ctx.fillRect(6, 17 + bounce, 12, 6);
    ctx.fillStyle = "#CBD5E1";
    ctx.fillRect(6, 22 + bounce, 12, 1);

    // --- JERSEY / TORSO (CUSTOM VIBRANT OUTFIT) ---
    // Outer outline
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(4, 10 + bounce, 16, 9);
    // Jersey fill
    ctx.fillStyle = this.jerseyColor;
    ctx.fillRect(5, 11 + bounce, 14, 7);

    // Jersey Collar Trim (White)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(9, 11 + bounce, 6, 2);

    // Jersey Number 7 (Front/Back)
    if (this.direction === "down" || this.direction === "up") {
      ctx.fillStyle = "#FCD34D"; // Bright gold number
      ctx.fillRect(11, 13 + bounce, 3, 1);
      ctx.fillRect(13, 14 + bounce, 1, 3);
      ctx.fillRect(12, 15 + bounce, 2, 1);
    }

    // --- ARMS / HANDS (SWING WITH WALK) ---
    const armSwing = this.isMoving ? Math.sin((this.animFrame * Math.PI) / 2) * 3 : 0;
    ctx.fillStyle = this.jerseyColor; // Sleeves
    if (this.direction === "down") {
      // Outline for hands
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(2, 11 + bounce + armSwing, 5, 8);
      ctx.fillRect(17, 11 + bounce - armSwing, 5, 8);

      ctx.fillStyle = this.jerseyColor;
      ctx.fillRect(3, 12 + bounce + armSwing, 3, 3);
      ctx.fillRect(18, 12 + bounce - armSwing, 3, 3);
      // Skin hands
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(3, 15 + bounce + armSwing, 3, 3);
      ctx.fillRect(18, 15 + bounce - armSwing, 3, 3);
    } else if (this.direction === "up") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(2, 11 + bounce - armSwing, 5, 8);
      ctx.fillRect(17, 11 + bounce + armSwing, 5, 8);

      ctx.fillStyle = this.jerseyColor;
      ctx.fillRect(3, 12 + bounce - armSwing, 3, 3);
      ctx.fillRect(18, 12 + bounce + armSwing, 3, 3);
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(3, 15 + bounce - armSwing, 3, 3);
      ctx.fillRect(18, 15 + bounce + armSwing, 3, 3);
    } else if (this.direction === "left") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(9 - armSwing, 11 + bounce, 5, 8);

      ctx.fillStyle = this.jerseyColor;
      ctx.fillRect(10 - armSwing, 12 + bounce, 3, 3);
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(10 - armSwing, 15 + bounce, 3, 3);
    } else if (this.direction === "right") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(10 + armSwing, 11 + bounce, 5, 8);

      ctx.fillStyle = this.jerseyColor;
      ctx.fillRect(10 + armSwing, 12 + bounce, 4, 3);
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(11 + armSwing, 15 + bounce, 3, 3);
    }

    // --- HEAD & FACE (2D PIXEL) ---
    // Dark outline for head
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(5, 3 + bounce, 14, 10);

    // Skin Tone Base
    ctx.fillStyle = "#FBD38D";
    ctx.fillRect(6, 4 + bounce, 12, 8);

    // Cute Ears
    if (this.direction === "down" || this.direction === "up") {
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(4, 7 + bounce, 2, 3);
      ctx.fillRect(18, 7 + bounce, 2, 3);
    }

    // --- HAIR (LAYERED 2D PIXEL WITH HIGHLIGHTS) ---
    ctx.fillStyle = "#1E293B"; // Dark base
    ctx.fillRect(5, 1 + bounce, 14, 4);
    ctx.fillRect(4, 2 + bounce, 16, 3);

    // Hair mid-tones & bangs
    ctx.fillStyle = "#334155";
    ctx.fillRect(6, 1 + bounce, 12, 3);
    ctx.fillRect(5, 3 + bounce, 2, 3);
    ctx.fillRect(17, 3 + bounce, 2, 3);

    // Hair highlight pixels
    ctx.fillStyle = "#64748B";
    ctx.fillRect(8, 2 + bounce, 3, 1);

    // --- HEADBAND (SPORTS HEADBAND) ---
    ctx.fillStyle = this.headbandColor;
    ctx.fillRect(4, 4 + bounce, 16, 2);

    // Headband ribbon tails flapping when facing UP or moving
    if (this.direction === "up") {
      ctx.fillStyle = this.headbandColor;
      ctx.fillRect(11, 6 + bounce, 2, 2);
      ctx.fillRect(10, 8 + bounce + (this.isMoving ? 1 : 0), 2, 3);
      ctx.fillRect(12, 8 + bounce - (this.isMoving ? 1 : 0), 2, 3);
    }

    // --- FACIAL FEATURES (2D PIXEL ART) ---
    if (this.direction === "down") {
      // Big 2D Pixel Eyes (2x3 dark with white reflection pixel)
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(8, 7 + bounce, 2, 3);
      ctx.fillRect(14, 7 + bounce, 2, 3);

      // Eye Sparkle / White Reflection (1x1 pixel)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(8, 7 + bounce, 1, 1);
      ctx.fillRect(14, 7 + bounce, 1, 1);

      // Cute Pink Pixel Blush (Cheeks)
      ctx.fillStyle = "rgba(244, 114, 182, 0.85)";
      ctx.fillRect(6, 9 + bounce, 2, 1);
      ctx.fillRect(16, 9 + bounce, 2, 1);

      // Cute Mouth (smile)
      ctx.fillStyle = "#C2410C";
      ctx.fillRect(11, 10 + bounce, 2, 1);
    } else if (this.direction === "left") {
      // Profile Eye
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(6, 7 + bounce, 2, 3);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(6, 7 + bounce, 1, 1);
      // Profile Blush
      ctx.fillStyle = "rgba(244, 114, 182, 0.85)";
      ctx.fillRect(5, 9 + bounce, 2, 1);
    } else if (this.direction === "right") {
      // Profile Eye
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(16, 7 + bounce, 2, 3);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(16, 7 + bounce, 1, 1);
      // Profile Blush
      ctx.fillStyle = "rgba(244, 114, 182, 0.85)";
      ctx.fillRect(17, 9 + bounce, 2, 1);
    }

    // ----------------------------------------------------
    // ANIMATED FLOATING STATUS ICON (ZEP QUIZ Style)
    // ----------------------------------------------------
    if (this.activeZone) {
      this.drawFloatingStatus(ctx, bounce);
    }

    // Flying Volleyball Pet Mascot
    if (this.hasPet) {
      this.drawPet(ctx);
    }

    ctx.restore();
  }

  drawFloatingStatus(ctx, bounce) {
    const floatOffset = Math.sin(Date.now() / 160) * 2.5;
    const bx = 12;
    const by = -8 + floatOffset + bounce;

    ctx.save();
    // Shadow under bubble
    ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
    ctx.beginPath();
    ctx.ellipse(bx, -1, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2D Pixel Status Bubble (Vibrant ZEP Orange with white border)
    ctx.fillStyle = "#FF6B00";
    ctx.beginPath();
    ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Downward pointer tail
    ctx.fillStyle = "#FF6B00";
    ctx.beginPath();
    ctx.moveTo(bx - 3, by + 5);
    ctx.lineTo(bx + 3, by + 5);
    ctx.lineTo(bx, by + 8);
    ctx.closePath();
    ctx.fill();

    // White 8-bit '!' or '[A]'
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 8px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", bx, by);

    ctx.restore();
  }

  drawPet(ctx) {
    const floatY = Math.sin(this.petFloatTimer) * 3 - 10;
    const petX = -12;

    ctx.save();
    ctx.translate(petX, floatY);

    // Tiny 2D Pixel Wings
    const wingFlap = Math.sin(this.petFloatTimer * 3) > 0 ? 1 : -1;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-2, 2 - wingFlap, 3, 2);
    ctx.fillRect(9, 2 - wingFlap, 3, 2);

    // 2D Pixel Volleyball Body (Circle in pixels)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(2, 1, 6, 6);
    ctx.fillRect(1, 2, 8, 4);

    // Blue & Yellow Volleyball Stripe Pixels
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(3, 2, 2, 2);
    ctx.fillRect(5, 4, 2, 2);
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(5, 2, 2, 2);
    ctx.fillRect(3, 4, 2, 2);

    // Cute Pixel Eyes
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(3, 3, 1, 1);
    ctx.fillRect(6, 3, 1, 1);

    ctx.restore();
  }
}
