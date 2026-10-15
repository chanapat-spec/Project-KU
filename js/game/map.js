/**
 * map.js
 * 2D Hybrid Retro Map: ZEP Fairy Tale Forest Camp & Volleyball Action Arena.
 * Features:
 * - Upper Zone: Fairy Tale Forest Camp & Podium (y: 0 - 360)
 *   - Wooden "FINISH / CHAMPIONS" Billboard Stage
 *   - 1st, 2nd, 3rd Place Podiums (🥇, 🥈, 🥉) with live top champion statues
 *   - 20 Classroom Tree Stumps for live classmate gathering & seating
 *   - Treehouse with ladder, wooden swing, pond with lily pads & garden crops
 * - Middle Gateway: Wooden Archway & Cobblestone Path (y: 360 - 410)
 * - Lower Zone: Polished Parquet Volleyball Arena (y: 410 - 740)
 *   - Volleyball court lines, net, 6 exercise training stations
 *   - Coach Soon NPC, Health Station & Hall of Fame
 */

export class GymMap {
  constructor(width = 360, height = 740) {
    this.width = width;
    this.height = height;

    // Interactive Trigger Zones (Coordinates updated for expanded 740px height)
    this.zones = [
      // --- UPPER CAMP ZONES ---
      {
        id: "zone_podium_stage",
        type: "leaderboard",
        name: "เวทีโพเดียมรับรางวัล (Victory Stage)",
        x: 180,
        y: 115,
        radius: 45,
        prompt: "[A] เปิดดูโพเดียมแชมเปี้ยน 🏆",
        badge: "👑 แชมเปี้ยน"
      },
      {
        id: "zone_treehouse",
        type: "leaderboard",
        name: "บ้านต้นไม้พักผ่อน (Treehouse)",
        x: 305,
        y: 75,
        radius: 35,
        prompt: "[A] ชมวิวบ้านต้นไม้ 🌲",
        badge: "🏡 บ้านต้นไม้"
      },

      // --- LOWER GYM ARENA ZONES ---
      {
        id: "zone_coach",
        type: "npc",
        name: "ครูซูน (Teacher Soon)",
        x: 180,
        y: 450,
        radius: 35,
        prompt: "[A] คุยกับครูซูน 💬",
        dialog: [
          "ยินดีต้อนรับสู่ลานกิจกรรม PECLASS! ด้านบนคือลานโพเดียมและแคมป์รับรางวัล ส่วนด้านล่างคือสนามฝึกซ้อมวอลเลย์บอล",
          "1. อันเดอร์บอล: แขนต้องเหยียดตึงเสมอ แล้วใช้แรงย่อ-ยืดจากข้อเข่า!",
          "2. เซ็ตบอล: ยกมือขึ้นเหนือหน้าผาก กางนิ้วเป็นรูปถ้วย แล้วสปริงตัวผลักบอลขึ้นด้านบน!",
          "3. เสิร์ฟมือล่าง & บน: เล็งเป้าหมายแล้วส่งบอลข้ามตาข่าย!",
          "สะสมแต้ม XP ให้ติด 1 ใน 3 เพื่อขึ้นไปยืนบนโพเดียมทองคำด้านบนนะ!"
        ]
      },
      {
        id: "zone_stretching",
        type: "exercise",
        exerciseId: "stretch_neck",
        name: "โซนยืดเหยียดกล้ามเนื้อ (Stretching 10 ท่า)",
        x: 60,
        y: 465,
        radius: 38,
        prompt: "[A] ท่ายืดเหยียดกล้ามเนื้อ 10 ท่า 🧘",
        badge: "🧘 STRETCH"
      },
      {
        id: "zone_warmup",
        type: "exercise",
        exerciseId: "dynamic_high_knees",
        name: "โซนวอร์มอัพ Dynamic Warm-up (10 ท่า)",
        x: 300,
        y: 465,
        radius: 38,
        prompt: "[A] อบอุ่นร่างกาย Dynamic Warm-up 🔥",
        badge: "🔥 WARM UP"
      },
      {
        id: "zone_volleyball_bump",
        type: "exercise",
        exerciseId: "volleyball_bump",
        name: "สนามอันเดอร์บอล (Bump)",
        x: 135,
        y: 535,
        radius: 35,
        prompt: "[A] เริ่มภารกิจ: อันเดอร์บอล 🏐",
        badge: "🏐 อันเดอร์"
      },
      {
        id: "zone_volleyball_set",
        type: "exercise",
        exerciseId: "volleyball_set",
        name: "สนามเซ็ตบอล (Set)",
        x: 225,
        y: 535,
        radius: 35,
        prompt: "[A] เริ่มภารกิจ: เซ็ตบอล 🙌",
        badge: "🙌 เซ็ตบอล"
      },
      {
        id: "zone_volleyball_serve_under",
        type: "exercise",
        exerciseId: "volleyball_serve_under",
        name: "สนามเสิร์ฟมือล่าง (Underhand Serve)",
        x: 135,
        y: 635,
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
        y: 635,
        radius: 35,
        prompt: "[A] เริ่มภารกิจ: เสิร์ฟมือบน ⚡",
        badge: "⚡ เสิร์ฟบน"
      },
      {
        id: "zone_trophy",
        type: "leaderboard",
        name: "หอเกียรติยศ (Leaderboard)",
        x: 60,
        y: 640,
        radius: 35,
        prompt: "[A] ดูอันดับคะแนน 🏆",
        badge: "🏆 อันดับ"
      },
      {
        id: "zone_health_station",
        type: "health",
        name: "ห้องตรวจสุขภาพ & วัด BMI (Health Room)",
        x: 300,
        y: 640,
        radius: 35,
        prompt: "[A] ตรวจสุขภาพ & วัดค่า BMI 🏥",
        badge: "🏥 วัด BMI"
      }
    ];

    // Classroom Tree Stumps Grid (20 seats in Camp Zone)
    this.stumps = [];
    this.initClassroomStumps();

    // Wood pattern for gym floor
    this.woodPattern = null;
    this.createWoodPattern();

    // Top Champions data for rendering on podiums
    this.topChampions = [];
  }

  setTopChampions(list) {
    if (Array.isArray(list)) {
      this.topChampions = list.slice(0, 3);
    }
  }

  initClassroomStumps() {
    this.stumps = [];
    const rows = 4;
    const cols = 5;
    const startX = 70;
    const startY = 175;
    const spacingX = 55;
    const spacingY = 38;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.stumps.push({
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          radius: 12
        });
      }
    }
  }

  createWoodPattern() {
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext("2d");

    pCtx.fillStyle = "#E5A962";
    pCtx.fillRect(0, 0, 32, 32);

    pCtx.fillStyle = "#EDBA76";
    pCtx.fillRect(0, 0, 16, 16);
    pCtx.fillStyle = "#D99B52";
    pCtx.fillRect(16, 0, 16, 16);

    pCtx.fillStyle = "#D99B52";
    pCtx.fillRect(0, 16, 24, 16);
    pCtx.fillStyle = "#EDBA76";
    pCtx.fillRect(24, 16, 8, 16);

    pCtx.fillStyle = "rgba(100, 50, 0, 0.15)";
    pCtx.fillRect(0, 15, 32, 1);
    pCtx.fillRect(0, 31, 32, 1);
    pCtx.fillRect(15, 0, 1, 16);
    pCtx.fillRect(23, 16, 1, 16);

    this.woodPattern = pCanvas;
  }

  checkNearbyZone(playerX, playerY) {
    for (const zone of this.zones) {
      const dist = Math.hypot(playerX - zone.x, playerY - zone.y);
      if (dist <= zone.radius) {
        return zone;
      }
    }
    return null;
  }

  draw(ctx, PlayerClass) {
    // ==========================================
    // 1. UPPER ZONE: FAIRY TALE FOREST CAMP (y: 0 - 370)
    // ==========================================
    this.drawForestCamp(ctx, PlayerClass);

    // ==========================================
    // 2. MIDDLE GATEWAY: ARCHWAY & PATH (y: 350 - 410)
    // ==========================================
    this.drawConnectingGateway(ctx);

    // ==========================================
    // 3. LOWER ZONE: VOLLEYBALL ARENA (y: 410 - 740)
    // ==========================================
    this.drawGymArena(ctx);
  }

  // --- FAIRY TALE FOREST CAMP & PODIUMS ---
  drawForestCamp(ctx, PlayerClass) {
    ctx.save();

    // 1. Lush Pastel Green Grass Background
    ctx.fillStyle = "#72B347";
    ctx.fillRect(0, 0, this.width, 365);

    // Subtle grassy texture dots & clovers
    ctx.fillStyle = "#65A03D";
    for (let x = 15; x < this.width; x += 35) {
      for (let y = 15; y < 350; y += 30) {
        ctx.fillRect(x + (y % 20), y, 2, 2);
        ctx.fillRect(x + (y % 20) + 2, y - 1, 2, 2);
      }
    }

    // 2. Wooden Perimeter Fence with Logs
    ctx.fillStyle = "#854D0E";
    ctx.fillRect(10, 15, this.width - 20, 4);
    for (let fx = 15; fx < this.width; fx += 25) {
      ctx.fillRect(fx, 11, 4, 12);
    }

    // 3. Treehouse on Top-Right
    this.drawTreehouse(ctx, 305, 55);

    // 4. Wooden Swing on Top-Left
    this.drawSwing(ctx, 45, 55);

    // 5. Pond with animated water ripples & lily pad
    this.drawPond(ctx, 310, 200);

    // 6. Cute Garden Patch / Veggies on Left
    this.drawGardenPatch(ctx, 25, 200);

    // 7. BIG WOODEN "FINISH / VICTORY STAGE" SIGNBOARD
    this.drawStageSignboard(ctx, 180, 52);

    // 8. 1ST, 2ND, 3RD PLACE PODIUM STANDS
    this.drawPodiums(ctx, PlayerClass);

    // 9. CLASSROOM TREE STUMPS (Audience Grid)
    this.drawStumps(ctx);

    ctx.restore();
  }

  drawStageSignboard(ctx, cx, cy) {
    ctx.save();
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.roundRect(cx - 65, cy - 2, 134, 44, 8);
    ctx.fill();

    // Wooden Board Frame
    ctx.fillStyle = "#78350F";
    ctx.beginPath();
    ctx.roundRect(cx - 67, cy - 5, 134, 42, 8);
    ctx.fill();

    // Inner Board (Dark Slate Chalkboard)
    ctx.fillStyle = "#1E3A2F"; // Dark forest chalkboard green
    ctx.fillRect(cx - 62, cy, 124, 32);

    // Golden Board Text
    ctx.fillStyle = "#FEF08A";
    ctx.font = "bold 11px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("FINISH", cx, cy + 16);

    ctx.fillStyle = "#86EFAC";
    ctx.font = "bold 8px 'Prompt', sans-serif";
    ctx.fillText("★ ลานเกียรติยศแชมเปี้ยน ★", cx, cy + 27);

    // Green ivy / vines on corners
    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.arc(cx - 62, cy, 5, 0, Math.PI * 2);
    ctx.arc(cx + 62, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPodiums(ctx, PlayerClass) {
    // 1st Place Podium (Center - Gold)
    this.drawSinglePodium(ctx, 180, 115, 38, 24, "#F59E0B", "#B45309", "1", "🥇");

    // 2nd Place Podium (Left - Silver)
    this.drawSinglePodium(ctx, 125, 122, 34, 18, "#94A3B8", "#475569", "2", "🥈");

    // 3rd Place Podium (Right - Bronze)
    this.drawSinglePodium(ctx, 235, 126, 34, 14, "#EA580C", "#9A3412", "3", "🥉");

    // Render Real Top 3 Champion Avatars on the Podiums!
    if (PlayerClass && this.topChampions.length > 0) {
      const c1 = this.topChampions[0];
      const c2 = this.topChampions[1];
      const c3 = this.topChampions[2];

      if (c1) {
        PlayerClass.renderAvatar(ctx, 180 - 12, 115 - 34, {
          direction: "down",
          name: c1.name,
          studentNumber: c1.studentNumber,
          room: c1.room,
          isRank1: true,
          outfit: "champion_gold",
          headwear: "crown",
          hasPet: true,
          petFloatTimer: Date.now() / 200
        });
      }

      if (c2) {
        PlayerClass.renderAvatar(ctx, 125 - 12, 122 - 32, {
          direction: "down",
          name: c2.name,
          studentNumber: c2.studentNumber,
          room: c2.room,
          isRank2: true,
          outfit: "witch_robe",
          headwear: "witch_hat"
        });
      }

      if (c3) {
        PlayerClass.renderAvatar(ctx, 235 - 12, 126 - 30, {
          direction: "down",
          name: c3.name,
          studentNumber: c3.studentNumber,
          room: c3.room,
          isRank3: true,
          outfit: "bear_onesie",
          headwear: "bear_hood"
        });
      }
    }
  }

  drawSinglePodium(ctx, cx, cy, w, h, topColor, sideColor, num, medal) {
    ctx.save();
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + h / 2 + 2, w / 2 + 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Side 3D base
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2 + 5, w, h, 6);
    ctx.fill();

    // Top surface
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h - 3, 6);
    ctx.fill();

    // Number & Medal
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 9px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(num, cx, cy);

    ctx.restore();
  }

  drawStumps(ctx) {
    ctx.save();
    this.stumps.forEach((s) => {
      // Stump shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 6, s.radius + 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stump 3D bark body
      ctx.fillStyle = "#78350F";
      ctx.beginPath();
      ctx.roundRect(s.x - s.radius, s.y - 4, s.radius * 2, 12, 6);
      ctx.fill();

      // Top wood cut surface
      ctx.fillStyle = "#FDE68A"; // Pale wood
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 4, s.radius, s.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tree rings
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 4, s.radius * 0.6, s.radius * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 4, s.radius * 0.25, s.radius * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawTreehouse(ctx, cx, cy) {
    ctx.save();
    // Tree trunk & foliage
    ctx.fillStyle = "#78350F";
    ctx.fillRect(cx - 8, cy, 16, 35);

    ctx.fillStyle = "#15803D";
    ctx.beginPath();
    ctx.arc(cx, cy - 15, 24, 0, Math.PI * 2);
    ctx.fill();

    // Wooden hut
    ctx.fillStyle = "#B45309";
    ctx.fillRect(cx - 14, cy - 20, 28, 22);

    // Roof
    ctx.fillStyle = "#DC2626"; // Red roof
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 20);
    ctx.lineTo(cx, cy - 34);
    ctx.lineTo(cx + 18, cy - 20);
    ctx.closePath();
    ctx.fill();

    // Hut window
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(cx - 4, cy - 14, 8, 8);

    // Wooden ladder
    ctx.strokeStyle = "#92400E";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 2);
    ctx.lineTo(cx - 5, cy + 32);
    ctx.moveTo(cx + 5, cy + 2);
    ctx.lineTo(cx + 5, cy + 32);
    for (let ly = cy + 6; ly < cy + 32; ly += 6) {
      ctx.moveTo(cx - 5, ly);
      ctx.lineTo(cx + 5, ly);
    }
    ctx.stroke();

    ctx.restore();
  }

  drawSwing(ctx, cx, cy) {
    ctx.save();
    // Tree
    ctx.fillStyle = "#15803D";
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#78350F";
    ctx.fillRect(cx - 8, cy + 5, 16, 30);

    // Wooden Branch
    ctx.fillRect(cx - 25, cy + 5, 30, 5);

    // Swing ropes & seat
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 8);
    ctx.lineTo(cx - 20, cy + 28);
    ctx.moveTo(cx - 10, cy + 8);
    ctx.lineTo(cx - 10, cy + 28);
    ctx.stroke();

    // Wooden seat
    ctx.fillStyle = "#B45309";
    ctx.fillRect(cx - 23, cy + 28, 16, 4);

    ctx.restore();
  }

  drawPond(ctx, cx, cy) {
    ctx.save();
    // Water
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Water ripple
    const ripple = (Date.now() / 300) % 15;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10 + ripple, 6 + ripple * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Lily pad
    ctx.fillStyle = "#16A34A";
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 4, 6, 0, Math.PI * 1.8);
    ctx.fill();

    // Pink Lotus flower
    ctx.fillStyle = "#F472B6";
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawGardenPatch(ctx, cx, cy) {
    ctx.save();
    // Soil
    ctx.fillStyle = "#854D0E";
    ctx.beginPath();
    ctx.roundRect(cx - 15, cy - 15, 30, 30, 6);
    ctx.fill();

    // Pumpkins / Veggies
    for (let ox of [-8, 8]) {
      for (let oy of [-8, 8]) {
        ctx.fillStyle = "#EA580C"; // Pumpkin orange
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#16A34A"; // Stem
        ctx.fillRect(cx + ox - 1, cy + oy - 7, 2, 3);
      }
    }
    ctx.restore();
  }

  // --- CONNECTING ARCHWAY & PATH ---
  drawConnectingGateway(ctx) {
    ctx.save();
    const gy = 365;

    // Cobblestone pathway
    ctx.fillStyle = "#94A3B8";
    ctx.fillRect(140, gy - 15, 80, 50);

    ctx.fillStyle = "#CBD5E1";
    for (let py = gy - 12; py < gy + 32; py += 12) {
      for (let px = 145; px < 215; px += 18) {
        ctx.beginPath();
        ctx.roundRect(px, py, 14, 8, 3);
        ctx.fill();
      }
    }

    // Wooden Torii / Archway Gate Pillars
    ctx.fillStyle = "#78350F";
    ctx.fillRect(130, gy - 10, 10, 42); // Left pillar
    ctx.fillRect(220, gy - 10, 10, 42); // Right pillar

    // Archway Roof / Crossbeam
    ctx.fillStyle = "#B45309";
    ctx.fillRect(122, gy - 16, 116, 8);
    ctx.fillStyle = "#92400E";
    ctx.fillRect(126, gy - 20, 108, 5);

    // Archway Signboard
    ctx.fillStyle = "#FEF3C7";
    ctx.fillRect(145, gy - 12, 70, 10);
    ctx.fillStyle = "#92400E";
    ctx.font = "bold 7px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("สนามวอลเลย์บอล ▼", 180, gy - 4.5);

    // Animated Arrow Indicator pointing down to court
    const arrowBounce = Math.sin(Date.now() / 180) * 3;
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.moveTo(180, gy + 15 + arrowBounce);
    ctx.lineTo(185, gy + 10 + arrowBounce);
    ctx.lineTo(175, gy + 10 + arrowBounce);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- VOLLEYBALL ARENA (y: 400 - 740) ---
  drawGymArena(ctx) {
    ctx.save();

    // 1. Polished Wood Floor Pattern
    if (this.woodPattern) {
      const pattern = ctx.createPattern(this.woodPattern, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 400, this.width, 340);
    } else {
      ctx.fillStyle = "#E5A962";
      ctx.fillRect(0, 400, this.width, 340);
    }

    // Border walls around gym
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 396, this.width, 4); // Top gym border
    ctx.fillRect(0, 396, 6, 344); // Left wall
    ctx.fillRect(this.width - 6, 396, 6, 344); // Right wall
    ctx.fillRect(0, 736, this.width, 4); // Bottom border

    // 2. Volleyball Court Boundary Lines (Official Orange Infield)
    const courtX = 85;
    const courtY = 475;
    const courtW = 190;
    const courtH = 210;

    // Orange Court Floor
    ctx.fillStyle = "rgba(255, 138, 0, 0.28)";
    ctx.fillRect(courtX, courtY, courtW, courtH);

    // White Boundary Lines
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(courtX, courtY, courtW, courtH);

    // Center Attack Lines & Center Net
    const netY = courtY + courtH / 2;
    ctx.beginPath();
    ctx.moveTo(courtX, courtY + 45); // Attack line top
    ctx.lineTo(courtX + courtW, courtY + 45);
    ctx.moveTo(courtX, courtY + courtH - 45); // Attack line bottom
    ctx.lineTo(courtX + courtW, courtY + courtH - 45);
    ctx.stroke();

    // 3. Volleyball Net (Center Net at y = 580)
    ctx.fillStyle = "#0F172A"; // Net posts
    ctx.fillRect(courtX - 6, netY - 5, 6, 10);
    ctx.fillRect(courtX + courtW, netY - 5, 6, 10);

    // Net mesh
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(courtX - 6, netY);
    ctx.lineTo(courtX + courtW + 6, netY);
    ctx.stroke();

    // Net Antennae (Red/White poles)
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(courtX + 10, netY - 14, 2, 14);
    ctx.fillRect(courtX + courtW - 12, netY - 14, 2, 14);

    // 4. Exercise Mats & Trigger Zones
    this.drawTrainingStations(ctx);

    ctx.restore();
  }

  drawTrainingStations(ctx) {
    ctx.save();
    const time = Date.now();
    const pulse = 0.8 + Math.sin(time / 200) * 0.2;

    this.zones.forEach((z) => {
      if (z.y < 400) return; // Skip upper zones, handled separately

      ctx.save();
      // Glowing Station Circle
      let glowColor = "rgba(99, 102, 241, 0.45)"; // Indigo default
      let icon = "⭐";

      if (z.id.includes("bump")) {
        glowColor = "rgba(16, 185, 129, 0.55)";
        icon = "🏐";
      } else if (z.id.includes("set")) {
        glowColor = "rgba(59, 130, 246, 0.55)";
        icon = "🙌";
      } else if (z.id.includes("serve")) {
        glowColor = "rgba(245, 158, 11, 0.55)";
        icon = "⚡";
      } else if (z.id === "zone_stretching") {
        glowColor = "rgba(168, 85, 247, 0.55)";
        icon = "🧘";
      } else if (z.id === "zone_warmup") {
        glowColor = "rgba(239, 68, 68, 0.55)";
        icon = "🔥";
      } else if (z.id === "zone_coach") {
        glowColor = "rgba(255, 255, 255, 0.6)";
        icon = "🧢";
      } else if (z.id === "zone_trophy") {
        glowColor = "rgba(234, 179, 8, 0.6)";
        icon = "🏆";
      } else if (z.id === "zone_health_station") {
        glowColor = "rgba(20, 184, 166, 0.6)";
        icon = "🏥";
      }

      // Outer Pulse Ring
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius * 0.85 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Station Mat Base
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.beginPath();
      ctx.arc(z.x, z.y, 16, 0, Math.PI * 2);
      ctx.fill();

      // Station Icon
      ctx.font = "14px 'Segoe UI Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, z.x, z.y);

      // Station Name Pill
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(z.x - 30, z.y + 16, 60, 14, 5);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 8px 'Prompt', sans-serif";
      ctx.fillText(z.badge || z.name.split(" ")[0], z.x, z.y + 24);

      ctx.restore();
    });

    ctx.restore();
  }
}
