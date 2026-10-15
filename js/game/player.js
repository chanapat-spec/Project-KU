/**
 * player.js
 * 2D Top-Down Chibi Sprite Avatar & Character Renderer (ZEP QUIZ Style).
 * Features:
 * - Cute Chibi proportions (large expressive head, sparkling anime eyes, cute blush)
 * - 4-directional walk cycle with arm swings, leg stepping, and 1-pixel bounce
 * - Full Wardrobe:
 *   - Headwear: Sports Headband, Witch Hat 🧙‍♀️, Astronaut Helmet 🧑‍🚀, Bear Hoodie 🐻, Golden Crown 👑
 *   - Outfits: KU PE Jersey, Witch Robe, Astronaut Suit, Cozy Bear Onesie, Champion Gold Armor
 *   - Pets: Flying 8-bit Volleyball or Lucky Kitten 🐱
 * - Floating crisp Name Tag above head: [No. X] Name (Room)
 * - Static renderAvatar() helper used for rendering peers & Top 3 champions on the podium
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

    // Student identity for Name Tag
    this.name = "";
    this.studentNumber = "";
    this.room = "";

    // Skin & Wardrobe Customization
    this.jerseyColor = "#006837"; // default KU Green
    this.headbandColor = "#e53e3e"; // default Red headband
    this.headwear = "headband"; // "headband", "witch_hat", "astronaut", "bear_hood", "crown"
    this.outfit = "jersey"; // "jersey", "witch_robe", "astronaut", "bear_onesie", "champion_gold"
    this.hasKneepads = false;
    this.hasPet = false;
    this.petType = "volleyball"; // "volleyball" or "cat"
    this.petFloatTimer = 0;

    // Nearby interaction zone for floating status icon
    this.activeZone = null;
  }

  setIdentity({ name, studentNumber, room }) {
    if (name) this.name = name;
    if (studentNumber) this.studentNumber = String(studentNumber);
    if (room) this.room = room;
  }

  setSkin({ jerseyColor, headbandColor, headwear, outfit, hasKneepads, hasPet, petType }) {
    if (jerseyColor) this.jerseyColor = jerseyColor;
    if (headbandColor) this.headbandColor = headbandColor;
    if (headwear) this.headwear = headwear;
    if (outfit) this.outfit = outfit;
    if (hasKneepads !== undefined) this.hasKneepads = hasKneepads;
    if (hasPet !== undefined) this.hasPet = hasPet;
    if (petType) this.petType = petType;
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
    Player.renderAvatar(ctx, Math.round(this.x), Math.round(this.y), {
      direction: this.direction,
      isMoving: this.isMoving,
      animFrame: this.animFrame,
      jerseyColor: this.jerseyColor,
      headbandColor: this.headbandColor,
      headwear: this.headwear,
      outfit: this.outfit,
      hasKneepads: this.hasKneepads,
      hasPet: this.hasPet,
      petType: this.petType,
      petFloatTimer: this.petFloatTimer,
      name: this.name,
      studentNumber: this.studentNumber,
      room: this.room,
      showNameTag: true,
      activeZone: this.activeZone
    });
  }

  /**
   * Static Chibi Avatar Renderer
   * Can render:
   * - Local Player
   * - Live Classmates (Multiplayer peers)
   * - Podium Top 3 Champions
   */
  static renderAvatar(ctx, x, y, options = {}) {
    const {
      direction = "down",
      isMoving = false,
      animFrame = 0,
      jerseyColor = "#006837",
      headbandColor = "#e53e3e",
      headwear = "headband",
      outfit = "jersey",
      hasKneepads = false,
      hasPet = false,
      petFloatTimer = 0,
      name = "",
      studentNumber = "",
      room = "",
      showNameTag = true,
      isRank1 = false,
      isRank2 = false,
      isRank3 = false,
      activeZone = null
    } = options;

    ctx.save();
    ctx.translate(x, y);

    // 1. Soft Shadow
    ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
    ctx.beginPath();
    ctx.ellipse(12, 30, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const bounce = isMoving && (animFrame === 1 || animFrame === 3) ? 1 : 0;
    const legOffset = isMoving ? Math.sin((animFrame * Math.PI) / 2) * 3 : 0;

    // 2. LEGS & SHOES
    if (direction === "up" || direction === "down") {
      ctx.fillStyle = "#0F172A"; // Outline
      ctx.fillRect(4, 21 + legOffset + bounce, 6, 9);
      ctx.fillRect(14, 21 - legOffset + bounce, 6, 9);

      // Pants / Socks based on outfit
      const legColor = outfit === "astronaut" ? "#E2E8F0" : (outfit === "bear_onesie" ? "#9A3412" : "#FFFFFF");
      ctx.fillStyle = legColor;
      ctx.fillRect(5, 22 + legOffset + bounce, 4, 6);
      ctx.fillRect(15, 22 - legOffset + bounce, 4, 6);

      if (hasKneepads && outfit === "jersey") {
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(4, 21 + legOffset + bounce, 6, 3);
        ctx.fillRect(14, 21 - legOffset + bounce, 6, 3);
      }

      // Shoes
      ctx.fillStyle = outfit === "astronaut" ? "#0284C7" : "#334155";
      ctx.fillRect(4, 27 + legOffset + bounce, 6, 3);
      ctx.fillRect(14, 27 - legOffset + bounce, 6, 3);
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(4, 26 + legOffset + bounce, 5, 2);
      ctx.fillRect(14, 26 - legOffset + bounce, 5, 2);
    } else {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(8, 21 + legOffset + bounce, 8, 9);

      const legColor = outfit === "astronaut" ? "#E2E8F0" : (outfit === "bear_onesie" ? "#9A3412" : "#FFFFFF");
      ctx.fillStyle = legColor;
      ctx.fillRect(9, 22 + legOffset + bounce, 6, 6);

      ctx.fillStyle = outfit === "astronaut" ? "#0284C7" : "#334155";
      ctx.fillRect(7, 27 + legOffset + bounce, 9, 3);
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(7, 26 + legOffset + bounce, 8, 2);
    }

    // 3. TORSO / OUTFIT
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(4, 10 + bounce, 16, 10);

    let torsoColor = jerseyColor;
    if (outfit === "witch_robe") torsoColor = "#581C87";
    else if (outfit === "astronaut") torsoColor = "#F1F5F9";
    else if (outfit === "bear_onesie") torsoColor = "#B45309";
    else if (outfit === "champion_gold" || isRank1) torsoColor = "#EAB308";

    ctx.fillStyle = torsoColor;
    ctx.fillRect(5, 11 + bounce, 14, 8);

    // Outfit Accents
    if (outfit === "witch_robe") {
      ctx.fillStyle = "#FACC15"; // Gold clasp
      ctx.fillRect(11, 12 + bounce, 2, 2);
    } else if (outfit === "astronaut") {
      ctx.fillStyle = "#0284C7"; // Chest control panel
      ctx.fillRect(9, 13 + bounce, 6, 3);
      ctx.fillStyle = "#38BDF8";
      ctx.fillRect(10, 14 + bounce, 2, 1);
    } else if (outfit === "bear_onesie") {
      ctx.fillStyle = "#FDE68A"; // Bear belly patch
      ctx.fillRect(8, 13 + bounce, 8, 5);
    } else {
      // Sports Jersey collar & number 7
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(9, 11 + bounce, 6, 2);
      if (direction === "down" || direction === "up") {
        ctx.fillStyle = "#FCD34D";
        ctx.fillRect(11, 13 + bounce, 3, 1);
        ctx.fillRect(13, 14 + bounce, 1, 3);
        ctx.fillRect(12, 15 + bounce, 2, 1);
      }
    }

    // 4. ARMS / HANDS
    const armSwing = isMoving ? Math.sin((animFrame * Math.PI) / 2) * 3 : 0;
    ctx.fillStyle = "#0F172A";
    if (direction === "down") {
      ctx.fillRect(2, 11 + bounce + armSwing, 5, 8);
      ctx.fillRect(17, 11 + bounce - armSwing, 5, 8);
      ctx.fillStyle = torsoColor;
      ctx.fillRect(3, 12 + bounce + armSwing, 3, 3);
      ctx.fillRect(18, 12 + bounce - armSwing, 3, 3);
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(3, 15 + bounce + armSwing, 3, 3);
      ctx.fillRect(18, 15 + bounce - armSwing, 3, 3);
    } else if (direction === "up") {
      ctx.fillRect(2, 11 + bounce - armSwing, 5, 8);
      ctx.fillRect(17, 11 + bounce + armSwing, 5, 8);
      ctx.fillStyle = torsoColor;
      ctx.fillRect(3, 12 + bounce - armSwing, 3, 3);
      ctx.fillRect(18, 12 + bounce + armSwing, 3, 3);
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(3, 15 + bounce - armSwing, 3, 3);
      ctx.fillRect(18, 15 + bounce + armSwing, 3, 3);
    } else if (direction === "left") {
      ctx.fillRect(9 - armSwing, 11 + bounce, 5, 8);
      ctx.fillStyle = torsoColor;
      ctx.fillRect(10 - armSwing, 12 + bounce, 3, 3);
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(10 - armSwing, 15 + bounce, 3, 3);
    } else if (direction === "right") {
      ctx.fillRect(10 + armSwing, 11 + bounce, 5, 8);
      ctx.fillStyle = torsoColor;
      ctx.fillRect(10 + armSwing, 12 + bounce, 4, 3);
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(11 + armSwing, 15 + bounce, 3, 3);
    }

    // 5. CHIBI HEAD (ROUND CHIBI FACE)
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(4, 2 + bounce, 16, 11);
    ctx.fillStyle = "#FBD38D"; // Skin tone
    ctx.fillRect(5, 3 + bounce, 14, 9);

    // Chibi Ears
    if (direction === "down" || direction === "up") {
      ctx.fillStyle = "#FBD38D";
      ctx.fillRect(3, 7 + bounce, 2, 3);
      ctx.fillRect(19, 7 + bounce, 2, 3);
    }

    // Hair Base
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(4, 1 + bounce, 16, 4);
    ctx.fillStyle = "#334155";
    ctx.fillRect(5, 2 + bounce, 14, 3);

    // 6. FACIAL FEATURES (ANIME CHIBI EYES & BLUSH)
    if (direction === "down") {
      // Big sparkling 2x3 anime eyes
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(7, 7 + bounce, 2, 3);
      ctx.fillRect(15, 7 + bounce, 2, 3);

      // White sparkle reflections
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(7, 7 + bounce, 1, 1);
      ctx.fillRect(15, 7 + bounce, 1, 1);

      // Cute Pink Blush
      ctx.fillStyle = "rgba(244, 114, 182, 0.9)";
      ctx.fillRect(5, 9 + bounce, 2, 1);
      ctx.fillRect(17, 9 + bounce, 2, 1);

      // Smile
      ctx.fillStyle = "#C2410C";
      ctx.fillRect(11, 10 + bounce, 2, 1);
    } else if (direction === "left") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(6, 7 + bounce, 2, 3);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(6, 7 + bounce, 1, 1);
      ctx.fillStyle = "rgba(244, 114, 182, 0.9)";
      ctx.fillRect(5, 9 + bounce, 2, 1);
    } else if (direction === "right") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(16, 7 + bounce, 2, 3);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(16, 7 + bounce, 1, 1);
      ctx.fillStyle = "rgba(244, 114, 182, 0.9)";
      ctx.fillRect(17, 9 + bounce, 2, 1);
    }

    // 7. HEADWEAR / COSTUME HATS
    if (headwear === "witch_hat") {
      // Purple Witch Hat with wide brim & yellow buckle
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(2, 2 + bounce, 20, 3);
      ctx.fillStyle = "#581C87";
      ctx.fillRect(3, 2 + bounce, 18, 2);
      ctx.fillRect(7, -2 + bounce, 10, 4);
      ctx.fillRect(9, -5 + bounce, 6, 3);
      ctx.fillRect(11, -7 + bounce, 3, 2);
      // Gold Buckle
      ctx.fillStyle = "#FACC15";
      ctx.fillRect(10, 0 + bounce, 4, 2);
    } else if (headwear === "astronaut") {
      // Clear Blue Visor Helmet
      ctx.fillStyle = "#0284C7";
      ctx.fillRect(5, 4 + bounce, 14, 6);
      ctx.fillStyle = "#38BDF8";
      ctx.fillRect(7, 5 + bounce, 10, 3);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(7, 5 + bounce, 3, 1);
    } else if (headwear === "bear_hood") {
      // Bear Ears
      ctx.fillStyle = "#B45309";
      ctx.fillRect(4, -1 + bounce, 4, 4);
      ctx.fillRect(16, -1 + bounce, 4, 4);
      ctx.fillStyle = "#FDE68A";
      ctx.fillRect(5, 0 + bounce, 2, 2);
      ctx.fillRect(17, 0 + bounce, 2, 2);
    } else if (headwear === "crown" || isRank1) {
      // 3-Point Sparkling Gold Crown
      ctx.fillStyle = "#EAB308";
      ctx.fillRect(6, -3 + bounce, 12, 3);
      ctx.fillRect(6, -6 + bounce, 2, 3);
      ctx.fillRect(11, -7 + bounce, 2, 4);
      ctx.fillRect(16, -6 + bounce, 2, 3);
      // Jewels
      ctx.fillStyle = "#EF4444";
      ctx.fillRect(11, -4 + bounce, 2, 2);
      ctx.fillStyle = "#3B82F6";
      ctx.fillRect(7, -3 + bounce, 1, 1);
      ctx.fillRect(16, -3 + bounce, 1, 1);
    } else {
      // Sports Headband
      ctx.fillStyle = headbandColor;
      ctx.fillRect(4, 4 + bounce, 16, 2);
      if (direction === "up") {
        ctx.fillRect(11, 6 + bounce, 2, 2);
        ctx.fillRect(10, 8 + bounce + (isMoving ? 1 : 0), 2, 3);
        ctx.fillRect(12, 8 + bounce - (isMoving ? 1 : 0), 2, 3);
      }
    }

    // 8. PET MASCOT (Flying volleyball or cat)
    if (hasPet) {
      Player.renderPet(ctx, petFloatTimer);
    }

    // 9. FLOATING NAME TAG (Above head, e.g. "ธนวรรธน์ 2/1")
    if (showNameTag && name) {
      Player.renderNameTag(ctx, name, studentNumber, room, isRank1, isRank2, isRank3);
    }

    // 10. Floating Interaction Bubble '!'
    if (activeZone) {
      Player.renderFloatingBubble(ctx, bounce);
    }

    ctx.restore();
  }

  static renderNameTag(ctx, name, studentNumber, room, isRank1, isRank2, isRank3) {
    ctx.save();
    const cleanName = name.length > 9 ? name.slice(0, 8) + "…" : name;
    let label = cleanName;
    if (room && studentNumber) {
      label = `${studentNumber}. ${cleanName} (${room.replace("ห้อง ", "")})`;
    } else if (room) {
      label = `${cleanName} (${room.replace("ห้อง ", "")})`;
    }

    // Medal prefix for podium champions
    let medalPrefix = "";
    if (isRank1) medalPrefix = "🥇 ";
    else if (isRank2) medalPrefix = "🥈 ";
    else if (isRank3) medalPrefix = "🥉 ";

    const fullText = medalPrefix + label;

    ctx.font = "bold 8.5px 'Prompt', sans-serif";
    const textWidth = ctx.measureText(fullText).width;
    const badgeW = Math.max(textWidth + 10, 36);
    const badgeH = 14;
    const badgeX = 12 - badgeW / 2;
    const badgeY = -12;

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(badgeX + 1, badgeY + 1, badgeW, badgeH, 7);
    ctx.fill();

    // Background pill
    if (isRank1) {
      ctx.fillStyle = "#FEF3C7"; // Gold pill
      ctx.strokeStyle = "#F59E0B";
    } else if (isRank2) {
      ctx.fillStyle = "#F1F5F9"; // Silver pill
      ctx.strokeStyle = "#94A3B8";
    } else if (isRank3) {
      ctx.fillStyle = "#FFEDD5"; // Bronze pill
      ctx.strokeStyle = "#EA580C";
    } else {
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // Dark slate pill
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    }

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 7);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = (isRank1 || isRank2 || isRank3) ? "#78350F" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fullText, 12, badgeY + 7);

    ctx.restore();
  }

  static renderPet(ctx, petTimer) {
    const floatY = Math.sin(petTimer) * 3 - 10;
    const petX = -12;

    ctx.save();
    ctx.translate(petX, floatY);

    // Wings
    const wingFlap = Math.sin(petTimer * 3) > 0 ? 1 : -1;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-2, 2 - wingFlap, 3, 2);
    ctx.fillRect(9, 2 - wingFlap, 3, 2);

    // Volleyball Body
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(2, 1, 6, 6);
    ctx.fillRect(1, 2, 8, 4);

    // Stripes
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(3, 2, 2, 2);
    ctx.fillRect(5, 4, 2, 2);
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(5, 2, 2, 2);
    ctx.fillRect(3, 4, 2, 2);

    // Eyes
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(3, 3, 1, 1);
    ctx.fillRect(6, 3, 1, 1);

    ctx.restore();
  }

  static renderFloatingBubble(ctx, bounce) {
    const floatOffset = Math.sin(Date.now() / 160) * 2.5;
    const bx = 12;
    const by = -20 + floatOffset + bounce;

    ctx.save();
    ctx.fillStyle = "#FF6B00";
    ctx.beginPath();
    ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 8px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", bx, by);
    ctx.restore();
  }
}
