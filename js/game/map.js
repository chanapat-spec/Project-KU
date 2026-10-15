/**
 * map.js
 * 2D Top-Down Retro Pixel Art Gymnasium & Sports Arena (ZEP QUIZ Style).
 * Features:
 * - 32x32 polished parquet wood plank floor with glossy sheen
 * - Delineated international volleyball court with attack lines & 2D pixel net
 * - Warm-up stretching mats with cute 2D pixel flame icon & animated pixel-dotted pulse
 * - Cardio running lane with cute 2D pixel sneaker/star icon & animated pixel-dotted pulse
 * - Volleyball stations (Bump, Set, Underhand Serve, Overhand Serve) with cute 2D pixel icons
 * - Coach Soon NPC with animated floating quest bubble '!'
 * - Championship podium with 2D pixel golden trophy & twinkling sparkles
 */

export class GymMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Interactive Trigger Zones (Preserve exact IDs, types, and coordinates)
    this.zones = [
      {
        id: "zone_volleyball_bump",
        type: "exercise",
        exerciseId: "volleyball_bump",
        name: "สนามอันเดอร์บอล (Bump)",
        x: 145,
        y: 200,
        radius: 35,
        prompt: "[A] เริ่มภารกิจ: อันเดอร์บอล 🏐",
        badge: "🏐 อันเดอร์"
      },
      {
        id: "zone_volleyball_set",
        type: "exercise",
        exerciseId: "volleyball_set",
        name: "สนามเซ็ตบอล (Set)",
        x: 215,
        y: 200,
        radius: 35,
        prompt: "[A] เริ่มภารกิจ: เซ็ตบอล 🙌",
        badge: "🙌 เซ็ตบอล"
      },
      {
        id: "zone_stretching",
        type: "exercise",
        exerciseId: "stretch_neck",
        name: "โซนยืดเหยียดกล้ามเนื้อ (Stretching 10 ท่า)",
        x: 60,
        y: 110,
        radius: 38,
        prompt: "[A] ท่ายืดเหยียดกล้ามเนื้อ 10 ท่า (Stretching) 🧘",
        badge: "🧘 STRETCH"
      },
      {
        id: "zone_warmup",
        type: "exercise",
        exerciseId: "dynamic_high_knees",
        name: "โซนวอร์มอัพ Dynamic Warm-up (10 ท่า)",
        x: 300,
        y: 110,
        radius: 38,
        prompt: "[A] อบอุ่นร่างกาย Dynamic Warm-up (10 ท่า) 🔥",
        badge: "🔥 WARM UP"
      },
      {
        id: "zone_volleyball_serve_under",
        type: "exercise",
        exerciseId: "volleyball_serve_under",
        name: "สนามเสิร์ฟมือล่าง (Underhand Serve)",
        x: 135,
        y: 280,
        radius: 35,
        prompt: "[A] เริ่มภารกิจ: เสิร์ฟมือล่าง 🎯",
        badge: "🎯 เสิร์ฟล่าง"
      },
      {
        id: "zone_volleyball_serve_over",
        type: "exercise",
        exerciseId: "volleyball_serve_over",
        name: "สนามเสิร์ฟมือบน (Overhand Serve)",
        x: 225,
        y: 280,
        radius: 35,
        prompt: "[A] เริ่มภารกิจ: เสิร์ฟมือบน ⚡",
        badge: "⚡ เสิร์ฟบน"
      },
      {
        id: "zone_coach",
        type: "npc",
        name: "ครูซูน (Teacher Soon)",
        x: 180,
        y: 70,
        radius: 35,
        prompt: "[A] คุยกับครูซูน 💬",
        dialog: [
          "ยินดีต้อนรับนักเรียนทุกคนสู่คลาส PECLASS! ครูซูนจะพาพวกเรามาฝึกทักษะวอลเลย์บอลกัน",
          "1. อันเดอร์บอล: แขนต้องเหยียดตึงเสมอ แล้วใช้แรงย่อ-ยืดจากข้อเข่า!",
          "2. เซ็ตบอล: ยกมือขึ้นเหนือหน้าผาก กางนิ้วเป็นรูปถ้วย แล้วสปริงตัวผลักบอลขึ้นด้านบน!",
          "3. เสิร์ฟมือล่าง: ถือบอลระดับเอว ง้างแขนไปข้างหลังแล้วเหวี่ยงสวิงเสยส่งบอลข้ามเน็ต!",
          "4. เสิร์ฟมือบน: ยกศอกง้างระดับใบหู แล้วกระโดดฟาดบอลที่จุดสูงสุดเหนือศีรษะ!",
          "พร้อมแล้วเลือกจุดฝึกซ้อมในสนามวอลเลย์บอลได้เลยนะ!"
        ]
      },
      {
        id: "zone_trophy",
        type: "leaderboard",
        name: "หอเกียรติยศ (Leaderboard)",
        x: 60,
        y: 280,
        radius: 35,
        prompt: "[A] ดูอันดับคะแนน 🏆",
        badge: "🏆 อันดับ"
      },
      {
        id: "zone_health_station",
        type: "health",
        name: "ห้องตรวจสุขภาพ & วัด BMI (Health Room)",
        x: 300,
        y: 280,
        radius: 35,
        prompt: "[A] ตรวจสุขภาพ & วัดค่า BMI 🏥",
        badge: "🏥 วัด BMI"
      }
    ];

    // Pre-create offscreen 32x32 polished wood tile pattern
    this.woodPatternCanvas = null;
    this.createWoodPattern();
  }

  createWoodPattern() {
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext("2d");

    // Base polished maple wood
    pCtx.fillStyle = "#E5A962";
    pCtx.fillRect(0, 0, 32, 32);

    // Staggered planks (16px high, alternating offsets)
    // Plank 1: y 0 to 16
    pCtx.fillStyle = "#EDBA76";
    pCtx.fillRect(0, 0, 16, 16);
    pCtx.fillStyle = "#D99B52";
    pCtx.fillRect(16, 0, 16, 16);

    // Plank 2: y 16 to 32 (staggered)
    pCtx.fillStyle = "#D99B52";
    pCtx.fillRect(0, 16, 24, 16);
    pCtx.fillStyle = "#EDBA76";
    pCtx.fillRect(24, 16, 8, 16);

    // 1-pixel polished specular highlight lines
    pCtx.fillStyle = "#F8D49E";
    pCtx.fillRect(0, 1, 32, 1);
    pCtx.fillRect(0, 17, 32, 1);

    // 1-pixel plank grain flecks
    pCtx.fillStyle = "#C8863A";
    pCtx.fillRect(4, 5, 8, 1);
    pCtx.fillRect(20, 9, 6, 1);
    pCtx.fillRect(8, 22, 10, 1);
    pCtx.fillRect(24, 26, 5, 1);

    // 1-pixel dark seam lines between planks
    pCtx.fillStyle = "#A36622";
    pCtx.fillRect(0, 15, 32, 1);
    pCtx.fillRect(0, 31, 32, 1);
    pCtx.fillRect(15, 0, 1, 16);
    pCtx.fillRect(23, 16, 1, 16);

    // Subtle 1-pixel peg nail dots
    pCtx.fillStyle = "#804810";
    pCtx.fillRect(1, 2, 1, 1);
    pCtx.fillRect(17, 2, 1, 1);
    pCtx.fillRect(1, 18, 1, 1);
    pCtx.fillRect(25, 18, 1, 1);

    this.woodPatternCanvas = pCanvas;
  }

  // Check if player is near any interactive zone
  checkNearbyZone(playerX, playerY) {
    const pCenter = { x: playerX + 12, y: playerY + 16 };
    for (const zone of this.zones) {
      const dist = Math.hypot(pCenter.x - zone.x, pCenter.y - zone.y);
      if (dist <= zone.radius) {
        return zone;
      }
    }
    return null;
  }

  draw(ctx) {
    const now = Date.now();

    // ----------------------------------------------------
    // 1. GYM COURT WOOD FLOOR (32x32 Polished Plank Grid)
    // ----------------------------------------------------
    if (this.woodPatternCanvas) {
      const pattern = ctx.createPattern(this.woodPatternCanvas, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#D99B52";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Outer gym wall perimeter border
    ctx.strokeStyle = "#804810";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);

    // Polished floor gloss reflection (soft diagonal light beam)
    ctx.save();
    const glossGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
    glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    glossGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.16)");
    glossGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.04)");
    glossGrad.addColorStop(1, "rgba(255, 255, 255, 0.12)");
    ctx.fillStyle = glossGrad;
    ctx.fillRect(4, 4, this.width - 8, this.height - 8);
    ctx.restore();

    // ----------------------------------------------------
    // 2. VOLLEYBALL COURT (ZEP International Arena)
    // ----------------------------------------------------
    const courtX = 100;
    const courtY = 145;
    const courtW = 160;
    const courtH = 110;

    // Court safety outer border (Sky blue apron)
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(courtX - 6, courtY - 6, courtW + 12, courtH + 12);
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 2;
    ctx.strokeRect(courtX - 6, courtY - 6, courtW + 12, courtH + 12);

    // Inner Court Surface (Vibrant Warm Amber / Orange)
    ctx.fillStyle = "#FB923C";
    ctx.fillRect(courtX, courtY, courtW, courtH);

    // 2D Pixel court floor plank lines
    ctx.strokeStyle = "rgba(194, 65, 12, 0.35)";
    ctx.lineWidth = 1;
    for (let py = courtY + 16; py < courtY + courtH; py += 16) {
      ctx.beginPath();
      ctx.moveTo(courtX, py);
      ctx.lineTo(courtX + courtW, py);
      ctx.stroke();
    }

    // Boundary Lines (Solid 2px Crisp Pure White)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(courtX, courtY, courtW, courtH);

    // Center Line
    const netY = courtY + courtH / 2;
    ctx.beginPath();
    ctx.moveTo(courtX, netY);
    ctx.lineTo(courtX + courtW, netY);
    ctx.stroke();

    // 3-Meter Attack Lines (Front Zone)
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    // Top side attack line
    ctx.moveTo(courtX, netY - 24);
    ctx.lineTo(courtX + courtW, netY - 24);
    // Bottom side attack line
    ctx.moveTo(courtX, netY + 24);
    ctx.lineTo(courtX + courtW, netY + 24);
    ctx.stroke();
    ctx.restore();

    // ----------------------------------------------------
    // 3. 2D TOP-DOWN VOLLEYBALL NET & POSTS
    // ----------------------------------------------------
    // Shadow under net
    ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
    ctx.fillRect(courtX - 4, netY + 2, courtW + 8, 3);

    // Net mesh (2D pixel cross-hatch)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(courtX, netY - 2, courtW, 4);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    for (let nx = courtX; nx <= courtX + courtW; nx += 8) {
      ctx.beginPath();
      ctx.moveTo(nx, netY - 2);
      ctx.lineTo(nx, netY + 2);
      ctx.stroke();
    }

    // Antennae (Red & White striped rods at sidelines)
    // Left antenna
    this.drawAntenna(ctx, courtX + 2, netY);
    // Right antenna
    this.drawAntenna(ctx, courtX + courtW - 4, netY);

    // Metal net posts with blue safety padding pads
    this.drawNetPost(ctx, courtX - 8, netY);
    this.drawNetPost(ctx, courtX + courtW + 2, netY);

    // ----------------------------------------------------
    // 4. WARM-UP ZONE (Stretching Mats & Cute Pixel Flame)
    // ----------------------------------------------------
    this.drawWarmupMats(ctx, 35, 78, 52, 64);

    // ----------------------------------------------------
    // 5. CARDIO TRACK ZONE (Tartan Lane & Pixel Sneaker)
    // ----------------------------------------------------
    this.drawCardioTrack(ctx, 273, 78, 52, 64);

    // ----------------------------------------------------
    // 6. TROPHY PODIUM (Leaderboard Stand)
    // ----------------------------------------------------
    this.drawTrophyPodium(ctx, 45, 265);

    // ----------------------------------------------------
    // 7. COACH SOON NPC (Top Center)
    // ----------------------------------------------------
    this.drawCoach(ctx, 180, 68);

    // ----------------------------------------------------
    // 8. INTERACTIVE ZONE MARKERS (Cute 2D Pixel Art Icons)
    // ----------------------------------------------------
    this.drawZoneMarkers(ctx, now);
  }

  drawAntenna(ctx, x, y) {
    // Red & white 2px striped rod
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(x, y - 5, 2, 3);
    ctx.fillRect(x, y + 2, 2, 3);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y - 2, 2, 4);
  }

  drawNetPost(ctx, x, y) {
    // Base floor plate
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(x - 1, y - 5, 8, 10);
    // Safety padding (Blue)
    ctx.fillStyle = "#2563EB";
    ctx.fillRect(x, y - 4, 6, 8);
    // Highlight
    ctx.fillStyle = "#60A5FA";
    ctx.fillRect(x + 1, y - 3, 2, 6);
  }

  drawWarmupMats(ctx, x, y, w, h) {
    // Floor area border
    ctx.fillStyle = "#0F766E";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

    // 2 Pastel Green / Mint Foam Mats side-by-side
    const matW = (w - 4) / 2;
    for (let i = 0; i < 2; i++) {
      const mx = x + i * (matW + 4);
      ctx.fillStyle = "#10B981";
      ctx.fillRect(mx, y, matW, h);
      ctx.fillStyle = "#34D399";
      ctx.fillRect(mx + 1, y + 1, matW - 2, h - 2);

      // Ribbed mat lines
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 1;
      for (let my = y + 8; my < y + h - 4; my += 8) {
        ctx.beginPath();
        ctx.moveTo(mx + 3, my);
        ctx.lineTo(mx + matW - 3, my);
        ctx.stroke();
      }
    }

    // Mini Gym Towel & Water Bottle
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(x + 3, y + h - 14, 8, 10);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(x + 15, y + h - 12, 4, 8);
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(x + 16, y + h - 14, 2, 2);

    // Pixel Pill Tag
    this.drawPixelPillBadge(ctx, x + w / 2, y + 10, "STRETCH", "#065F46", "#D1FAE5");
  }

  drawCardioTrack(ctx, x, y, w, h) {
    // Terracotta Running Track Base
    ctx.fillStyle = "#991B1B";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(x, y, w, h);

    // Running lane lines
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();

    // Starting line block markings
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 4, y + h - 8, w / 2 - 8, 3);
    ctx.fillRect(x + w / 2 + 4, y + h - 8, w / 2 - 8, 3);

    // Lane Numbers in 8-bit style
    ctx.fillStyle = "#FEE2E2";
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("1", x + w / 4, y + h - 14);
    ctx.fillText("2", x + (w * 3) / 4, y + h - 14);

    // Pixel Pill Tag
    this.drawPixelPillBadge(ctx, x + w / 2, y + 10, "WARM UP", "#7F1D1D", "#FEE2E2");
  }

  drawTrophyPodium(ctx, x, y) {
    // Wooden & Gold Podium Base
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(x - 2, y + 10, 34, 16);
    ctx.fillStyle = "#334155";
    ctx.fillRect(x, y + 8, 30, 16);

    // Gold trim band
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(x, y + 8, 30, 3);

    // 2D Pixel Golden Trophy Cup
    const tx = x + 15;
    const ty = y - 2;

    // Trophy Handles
    ctx.fillStyle = "#D97706";
    ctx.fillRect(tx - 10, ty + 1, 3, 6);
    ctx.fillRect(tx + 7, ty + 1, 3, 6);

    // Trophy Cup Body
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(tx - 7, ty, 14, 8);
    ctx.fillStyle = "#FDE68A";
    ctx.fillRect(tx - 6, ty + 1, 4, 6); // Golden reflection highlight

    // Trophy Stem & Base
    ctx.fillStyle = "#D97706";
    ctx.fillRect(tx - 2, ty + 8, 4, 4);
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(tx - 5, ty + 12, 10, 3);

    // Twinkling sparkle star ⭐
    const sparkle = (Math.sin(Date.now() / 150) + 1) / 2;
    if (sparkle > 0.4) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(tx + 4, ty - 3, 2, 2);
      ctx.fillRect(tx + 3, ty - 2, 4, 1);
      ctx.fillRect(tx + 4, ty - 4, 1, 4);
    }

    // Pill label
    this.drawPixelPillBadge(ctx, x + 15, y + 27, "RANK", "#78350F", "#FEF3C7");
  }

  drawCoach(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Idle breathing bounce
    const idleBounce = Math.sin(Date.now() / 350) > 0 ? 1 : 0;

    // Shadow underneath Coach
    ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoes
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(-7, 12, 5, 4);
    ctx.fillRect(2, 12, 5, 4);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-7, 11, 4, 2);
    ctx.fillRect(2, 11, 4, 2);

    // Dark Tracksuit Pants with white side stripes
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(-7, 4, 14, 8);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-7, 4, 1, 8);
    ctx.fillRect(6, 4, 1, 8);

    // Tracksuit Jacket (KU Royal Blue)
    ctx.fillStyle = "#1D4ED8";
    ctx.fillRect(-8, -6 + idleBounce, 16, 11);
    ctx.fillStyle = "#3B82F6";
    ctx.fillRect(-6, -6 + idleBounce, 12, 3); // Shoulder highlight

    // White Center Zip & Collar
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-1, -6 + idleBounce, 2, 11);
    ctx.fillRect(-4, -6 + idleBounce, 8, 2);

    // Silver Whistle on necklace
    ctx.fillStyle = "#94A3B8";
    ctx.fillRect(-1, -1 + idleBounce, 2, 3);
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(-2, -3 + idleBounce, 4, 1);

    // Face / Skin
    ctx.fillStyle = "#FBD38D";
    ctx.fillRect(-5, -13 + idleBounce, 10, 7);

    // Friendly 2D Pixel Eyes & Smile
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(-4, -10 + idleBounce, 2, 2);
    ctx.fillRect(2, -10 + idleBounce, 2, 2);
    ctx.fillStyle = "#C2410C";
    ctx.fillRect(-1, -8 + idleBounce, 2, 1);

    // KU Coach Sports Cap (Green Visor)
    ctx.fillStyle = "#006837";
    ctx.fillRect(-6, -17 + idleBounce, 12, 5);
    ctx.fillStyle = "#047857";
    ctx.fillRect(-8, -13 + idleBounce, 16, 2); // Cap visor forward

    // ----------------------------------------------------
    // Animated Floating Quest Bubble '!' (ZEP QUIZ Style)
    // ----------------------------------------------------
    const floatY = Math.sin(Date.now() / 200) * 2.5;
    const bubbleY = -28 + floatY;

    // Speech bubble background
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, bubbleY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bubble pointer tail
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(-3, bubbleY + 6);
    ctx.lineTo(3, bubbleY + 6);
    ctx.lineTo(0, bubbleY + 10);
    ctx.closePath();
    ctx.fill();

    // Red Exclamation Mark '!'
    ctx.fillStyle = "#DC2626";
    ctx.font = "bold 9px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", 0, bubbleY);

    ctx.restore();
  }

  drawZoneMarkers(ctx, now) {
    this.zones.forEach((z) => {
      // Skip coach and trophy (drawn separately with customized models)
      if (z.id === "zone_coach" || z.id === "zone_trophy") return;

      const pulse = Math.sin(now / 200) * 2;
      const rotOffset = (now / 60) % 360;

      // 1. Subtle Animated Pixel-Dotted Circle Outline
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -now / 50;

      let ringColor = "rgba(124, 58, 237, 0.65)";
      let fillColor = "rgba(124, 58, 237, 0.12)";
      if (z.id.includes("serve")) {
        ringColor = "rgba(245, 158, 11, 0.75)";
        fillColor = "rgba(245, 158, 11, 0.12)";
      } else if (z.id.includes("bump") || z.id.includes("set")) {
        ringColor = "rgba(56, 189, 248, 0.75)";
        fillColor = "rgba(56, 189, 248, 0.12)";
      }

      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.restore();

      // 2. Central 2D Pixel Icon & Platform
      ctx.save();
      ctx.translate(z.x, z.y);

      // Shadow
      ctx.fillStyle = "rgba(15, 23, 42, 0.2)";
      ctx.beginPath();
      ctx.ellipse(0, 10, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floor Marker Decal (Circular 2D Pixel Pad)
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Specific Cute 2D Pixel Icon
      if (z.id === "zone_volleyball_bump") {
        this.drawPixelVolleyballIcon(ctx, 0, -1);
      } else if (z.id === "zone_volleyball_set") {
        this.drawPixelSetIcon(ctx, 0, -1);
      } else if (z.id === "zone_volleyball_serve_under") {
        this.drawPixelTargetIcon(ctx, 0, 0);
      } else if (z.id === "zone_volleyball_serve_over") {
        this.drawPixelLightningIcon(ctx, 0, 0);
      } else if (z.id === "zone_stretching" || z.id === "zone_squat") {
        this.drawPixelStretchIcon(ctx, 0, -1);
      } else if (z.id === "zone_warmup" || z.id === "zone_jumping") {
        this.drawPixelFlameIcon(ctx, 0, -1);
      } else if (z.id === "zone_health_station") {
        this.drawPixelHealthIcon(ctx, 0, 0);
      }

      // 3. Cute Floating Pill Label
      this.drawPixelPillBadge(ctx, 0, 18, z.badge, "#1E293B", "#FFFFFF");

      ctx.restore();
    });
  }

  // --- Cute 2D Pixel Art Icons ---
  drawPixelHealthIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Green Cross on White Base
    ctx.fillStyle = "#10B981";
    ctx.fillRect(-6, -2, 12, 4);
    ctx.fillRect(-2, -6, 4, 12);
    ctx.restore();
  }
  drawPixelVolleyballIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // White ball body
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-6, -6, 12, 12);
    // Yellow & Blue curvy stripes
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(-4, -4, 4, 4);
    ctx.fillRect(1, 1, 4, 4);
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(1, -4, 4, 4);
    ctx.fillRect(-4, 1, 4, 4);
    // Outline
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1;
    ctx.strokeRect(-6, -6, 12, 12);
    ctx.restore();
  }

  drawPixelSetIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Mini Volleyball above
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-4, -8, 8, 8);
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(-2, -6, 4, 4);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -8, 8, 8);
    // Dual uplifted hands 🙌
    ctx.fillStyle = "#FBD38D";
    ctx.fillRect(-7, 2, 4, 5);
    ctx.fillRect(3, 2, 4, 5);
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(-7, 1, 3, 1);
    ctx.fillRect(4, 1, 3, 1);
    ctx.restore();
  }

  drawPixelTargetIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Concentric Bullseye Rings 🎯
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPixelLightningIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Golden Lightning Bolt ⚡
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.moveTo(1, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(-2, 8);
    ctx.lineTo(6, -1);
    ctx.lineTo(1, -1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawPixelStretchIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Cute 2D Pixel Stretching Figure 🧘
    ctx.fillStyle = "#10B981";
    ctx.fillRect(-2, -7, 4, 4); // Head
    ctx.fillStyle = "#059669";
    ctx.fillRect(-3, -3, 6, 6); // Torso
    ctx.fillStyle = "#34D399";
    ctx.fillRect(-6, -1, 3, 2); // Left arm
    ctx.fillRect(3, -1, 3, 2);  // Right arm
    ctx.fillStyle = "#047857";
    ctx.fillRect(-4, 3, 3, 3);  // Left folded leg
    ctx.fillRect(1, 3, 3, 3);   // Right folded leg
    ctx.restore();
  }

  drawPixelFlameIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Cute Warm Flame 🔥
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(-4, -6, 8, 10);
    ctx.fillStyle = "#F97316";
    ctx.fillRect(-3, -4, 6, 8);
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(-2, -1, 4, 5);
    ctx.restore();
  }

  drawPixelStarIcon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Cardio Star ⭐
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = "#FBBF24";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = "#FEF3C7";
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  drawPixelPillBadge(ctx, x, y, text, textColor, bgColor) {
    ctx.save();
    ctx.font = "8px 'Prompt', 'Nunito', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textMetrics = ctx.measureText(text);
    const badgeW = textMetrics.width + 10;
    const badgeH = 13;

    // Pill background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x - badgeW / 2, y - badgeH / 2, badgeW, badgeH, 6);
    ctx.fill();

    // Border & subtle shadow
    ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y + 0.5);
    ctx.restore();
  }
}
