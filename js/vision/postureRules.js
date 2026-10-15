/**
 * postureRules.js
 * Rule-based joint angle calculations and repetition state machine.
 * Supports:
 * - Volleyball Bump (Underhand)
 * - Volleyball Set (Overhead)
 * - Squat Warmup
 * - Jumping Jacks
 */

export const LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
};

export function calculateAngle(pointA, pointB, pointC) {
  if (!pointA || !pointB || !pointC) return 0;
  const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

export function calculateDistance(pointA, pointB) {
  if (!pointA || !pointB) return 0;
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

export class PostureEvaluator {
  constructor(exerciseConfig) {
    this.config = exerciseConfig;
    this.state = "START"; // "START", "DOWN", "UP"
    this.reps = 0;
    this.lastFormOk = true;
    this.formFeedback = "";
    this.totalFrames = 0;
    this.correctFrames = 0;
    this.lastRepTime = 0; // Cooldown timer to prevent double counting
    this.standingConfirmed = false; // Must confirm standing before squats/reps start
    this.holdProgressMs = 0; // Accumulated hold duration for static stretching
    this.lastFrameTime = Date.now();
  }

  reset() {
    this.state = "START";
    this.reps = 0;
    this.lastFormOk = true;
    this.formFeedback = "";
    this.totalFrames = 0;
    this.correctFrames = 0;
    this.lastRepTime = 0;
    this.standingConfirmed = false;
    this.holdProgressMs = 0;
    this.lastFrameTime = Date.now();
  }

  getAccuracy() {
    if (this.totalFrames === 0) return 100;
    return Math.min(100, Math.round((this.correctFrames / this.totalFrames) * 100));
  }

  getGrade() {
    const acc = this.getAccuracy();
    if (acc >= 90) return { grade: "A+", badge: "🥇 ยอดเยี่ยมสมบูรณ์แบบ!", color: "text-amber-400" };
    if (acc >= 80) return { grade: "A", badge: "🥈 ฟอร์มดีมาก!", color: "text-emerald-400" };
    if (acc >= 70) return { grade: "B", badge: "🥉 ผ่านเกณฑ์มาตรฐาน", color: "text-blue-400" };
    return { grade: "C", badge: "💪 พยายามอีกนิดนะ!", color: "text-rose-400" };
  }

  evaluate(landmarks) {
    if (!landmarks || landmarks.length < 29) {
      return { isFormCorrect: false, feedback: "ไม่พบโครงร่าง", reps: this.reps };
    }

    const L = LANDMARK_INDEX;
    const nose = landmarks[L.NOSE];
    const lShoulder = landmarks[L.LEFT_SHOULDER];
    const rShoulder = landmarks[L.RIGHT_SHOULDER];
    const lElbow = landmarks[L.LEFT_ELBOW];
    const rElbow = landmarks[L.RIGHT_ELBOW];
    const lWrist = landmarks[L.LEFT_WRIST];
    const rWrist = landmarks[L.RIGHT_WRIST];
    const lHip = landmarks[L.LEFT_HIP];
    const rHip = landmarks[L.RIGHT_HIP];
    const lKnee = landmarks[L.LEFT_KNEE];
    const rKnee = landmarks[L.RIGHT_KNEE];
    const lAnkle = landmarks[L.LEFT_ANKLE];
    const rAnkle = landmarks[L.RIGHT_ANKLE];

    const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
    const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);
    const avgElbowAngle = Math.round((leftElbowAngle + rightElbowAngle) / 2);

    const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
    const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
    const avgKneeAngle = Math.round((leftKneeAngle + rightKneeAngle) / 2);

    const shoulderWidth = calculateDistance(lShoulder, rShoulder);
    const wristDist = calculateDistance(lWrist, rWrist);

    let isFormCorrect = true;
    let feedback = "";
    let repCounted = false;

    const now = Date.now();
    const timeDelta = Math.min(200, Math.max(16, now - (this.lastFrameTime || now)));
    this.lastFrameTime = now;

    // PREVENT SITTING CHEAT:
    // If exercise requires full body or squats, user MUST be standing upright first!
    const requiresStanding = this.config.requiresFullBody ||
                             this.config.id === "volleyball_bump" ||
                             this.config.id === "squat_warmup" ||
                             this.config.rules?.repetition?.type === "knee_bend";

    if (requiresStanding) {
      if (avgKneeAngle >= 155) {
        this.standingConfirmed = true;
      }
      if (!this.standingConfirmed) {
        return {
          isFormCorrect: false,
          feedback: "⚠️ กรุณายืนขึ้นตรงก่อนเริ่มฝึก",
          repCounted: false,
          reps: this.reps,
          accuracy: this.getAccuracy(),
          angles: { elbow: avgElbowAngle, knee: avgKneeAngle }
        };
      }
    }

    // ==========================================
    // 0. STATIC STRETCHING (ยืดเหยียดกล้ามเนื้อ 10 ท่า - ค้างท่า 2.5 วินาทีต่อนับ 1 ครั้ง)
    // ==========================================
    if (this.config.sport === "Stretching" || (this.config.id && this.config.id.startsWith("stretch_"))) {
      let isHoldingProperly = true;
      let postureTip = "ค้างท่าไว้...";

      if (this.config.id === "stretch_triceps") {
        const hasArmUp = (lElbow.y < lShoulder.y) || (rElbow.y < rShoulder.y);
        if (!hasArmUp) {
          isHoldingProperly = false;
          postureTip = "ยกข้อศอกพับไปข้างหลัง!";
        }
      } else if (this.config.id === "stretch_shoulder_cross") {
        const armCrossing = (lWrist.x > rShoulder.x && lWrist.x < lShoulder.x + 0.2) ||
                            (rWrist.x < lShoulder.x && rWrist.x > rShoulder.x - 0.2);
        if (!armCrossing && wristDist > shoulderWidth * 0.85) {
          isHoldingProperly = false;
          postureTip = "ดึงแขนพาดขวางหน้าอก!";
        }
      } else if (this.config.id === "stretch_side_bend") {
        const armHigh = (lWrist.y < nose.y) || (rWrist.y < nose.y);
        if (!armHigh) {
          isHoldingProperly = false;
          postureTip = "ชูแขนขึ้นแล้วเอียงลำตัว!";
        }
      }

      if (isHoldingProperly) {
        this.holdProgressMs += timeDelta;
        const requiredHoldMs = 2500; // 2.5 seconds hold per rep
        const progressSec = (this.holdProgressMs / 1000).toFixed(1);
        const remainSec = Math.max(1, Math.ceil((requiredHoldMs - this.holdProgressMs) / 1000));

        if (this.holdProgressMs >= requiredHoldMs) {
          if (now - this.lastRepTime > 800) {
            this.reps += 1;
            repCounted = true;
            this.lastRepTime = now;
            this.holdProgressMs = 0;
            feedback = `ยอดเยี่ยม! ครบ ${this.reps} ครั้ง 🧘`;
          }
        } else {
          feedback = `ค้างท่าไว้... อีก ${remainSec} วินาที (${progressSec}s) ⏱️`;
        }
      } else {
        this.holdProgressMs = Math.max(0, this.holdProgressMs - timeDelta * 1.5);
        feedback = postureTip;
        isFormCorrect = false;
      }
    }

    // ==========================================
    // 1. VOLLEYBALL BUMP (อันเดอร์บอล)
    // ==========================================
    else if (this.config.id === "volleyball_bump") {
      const minArmAngle = this.config.rules?.armsStraight?.minAngle || 148;
      const armsStraight = leftElbowAngle >= minArmAngle && rightElbowAngle >= minArmAngle;
      const handsTogether = shoulderWidth > 0 ? (wristDist / shoulderWidth) <= 0.40 : false;

      if (!armsStraight) {
        isFormCorrect = false;
        feedback = "เหยียดแขนตึง!";
      } else if (!handsTogether) {
        isFormCorrect = false;
        feedback = "ประกบมือชิดกัน!";
      } else {
        feedback = "ฟอร์มดีมาก!";
      }

      const downAngle = this.config.rules?.repetition?.downAngle || 120;
      const upAngle = this.config.rules?.repetition?.upAngle || 158;

      if (this.state === "START" || this.state === "UP") {
        if (avgKneeAngle <= downAngle) {
          this.state = "DOWN";
          feedback = "ส่งแรงขึ้น!";
        }
      } else if (this.state === "DOWN") {
        if (avgKneeAngle >= upAngle) {
          if (armsStraight && (now - this.lastRepTime > 750)) {
            this.reps += 1;
            repCounted = true;
            this.lastRepTime = now;
            this.state = "UP";
            feedback = `ยอดเยี่ยม! ครั้งที่ ${this.reps} 🏐`;
          } else if (!armsStraight) {
            feedback = "แขนงอตอนส่งลูก! ลองใหม่";
            this.state = "UP";
          }
        }
      }
    }

    // ==========================================
    // 2. VOLLEYBALL SET (เซ็ตบอลเหนือศีรษะ)
    // ==========================================
    else if (this.config.id === "volleyball_set") {
      // Hands must be above shoulder level (smaller y in canvas means higher up)
      const handsAboveShoulders = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;
      // Hands should be held close together forming setting cup/window
      const handsCup = shoulderWidth > 0 ? (wristDist / shoulderWidth) <= 0.58 : false;

      if (!handsAboveShoulders) {
        isFormCorrect = false;
        feedback = "ยกมือขึ้นระดับหน้าผาก!";
      } else if (!handsCup) {
        isFormCorrect = false;
        feedback = "มือชิดกันเป็นรูปถ้วย!";
      } else {
        feedback = "เตรียมเซ็ตบอล!";
      }

      // Setting motion state machine:
      // Preparation: Elbows bent (< 120°) while hands stay up and knees dip (< 135°)
      if (this.state === "START" || this.state === "UP") {
        if (handsAboveShoulders && avgElbowAngle <= 125 && avgKneeAngle <= 138) {
          this.state = "DOWN";
          feedback = "สปริงตัวผลักบอลขึ้น!";
        }
      }
      // Push / Extension: Elbows extend (> 145°) and knees straighten (> 155°)
      else if (this.state === "DOWN") {
        if (avgElbowAngle >= 142 && avgKneeAngle >= 152) {
          if (handsAboveShoulders && (now - this.lastRepTime > 750)) {
            this.reps += 1;
            repCounted = true;
            this.lastRepTime = now;
            this.state = "UP";
            feedback = `เซ็ตสวยงาม! ครั้งที่ ${this.reps} 🙌`;
          } else {
            feedback = "อย่าลดมือลงต่ำ!";
            this.state = "UP";
          }
        }
      }
    }

    // ==========================================
    // 3. SQUAT / KNEE BEND WARMUP (สควอท / ย่อเข่า)
    // ==========================================
    else if (this.config.id === "squat_warmup" || this.config.rules?.repetition?.type === "knee_bend") {
      const downAngle = this.config.rules?.repetition?.downAngle || 118;
      const upAngle = this.config.rules?.repetition?.upAngle || 158;
      const cueDown = this.config.rules?.repetition?.cueDown || "ย่อเข่าลง!";
      const cueUp = this.config.rules?.repetition?.cueUp || "ยืนขึ้นตรง!";

      if (this.state === "START" || this.state === "UP") {
        if (avgKneeAngle <= downAngle) {
          this.state = "DOWN";
          feedback = cueUp;
        } else {
          feedback = cueDown;
        }
      } else if (this.state === "DOWN") {
        if (avgKneeAngle >= upAngle) {
          if (now - this.lastRepTime > 750) {
            this.reps += 1;
            repCounted = true;
            this.lastRepTime = now;
            this.state = "UP";
            feedback = `ครบ 1 ครั้ง! (${this.reps}) 🦵`;
          }
        }
      }
    }

    // ==========================================
    // 4. JUMPING JACKS / ARM SPREAD (กระโดดตบ / กางแขน)
    // ==========================================
    else if (this.config.id === "jumping_jacks" || this.config.rules?.repetition?.type === "jumping_jack" || this.config.rules?.repetition?.type === "arm_spread") {
      const lArmSpread = calculateAngle(lHip, lShoulder, lWrist);
      const rArmSpread = calculateAngle(rHip, rShoulder, rWrist);
      const avgArmSpread = (lArmSpread + rArmSpread) / 2;
      const targetSpread = this.config.rules?.repetition?.armSpreadAngle || 125;

      if (this.state === "START" || this.state === "DOWN") {
        if (avgArmSpread > targetSpread) {
          this.state = "UP";
          feedback = "หุบแขนลง!";
        } else {
          feedback = "กางแขนออก!";
        }
      } else if (this.state === "UP") {
        if (avgArmSpread < 55 && (now - this.lastRepTime > 550)) {
          this.reps += 1;
          repCounted = true;
          this.lastRepTime = now;
          this.state = "DOWN";
          feedback = `เยี่ยม! (${this.reps}) ⭐`;
        }
      }
    }

    // ==========================================
    // 4.1 HIGH KNEES / MARCHING (ยกเข่าสูง / วิ่งย่ำเท้า)
    // ==========================================
    else if (this.config.rules?.repetition?.type === "high_knees") {
      const now = Date.now();
      const leftKneeLifted = lKnee.y < (lHip.y + 0.16);
      const rightKneeLifted = rKnee.y < (rHip.y + 0.16);
      const isKneeUp = leftKneeLifted || rightKneeLifted;

      if (this.state === "START" || this.state === "DOWN") {
        if (isKneeUp) {
          this.state = "UP";
          feedback = "สลับขา!";
        } else {
          feedback = "ยกเข่าขึ้นสูง!";
        }
      } else if (this.state === "UP") {
        if (!isKneeUp && (now - this.lastRepTime > 350)) {
          this.reps += 1;
          repCounted = true;
          this.lastRepTime = now;
          this.state = "DOWN";
          feedback = `ดีมาก! (${this.reps}) 🏃`;
        }
      }
    }

    // ==========================================
    // 4.2 OVERHEAD REACH / SKY STRETCH (ยืดแขนแตะฟ้า)
    // ==========================================
    else if (this.config.rules?.repetition?.type === "overhead_reach") {
      const now = Date.now();
      const isReachingUp = lWrist.y < nose.y && rWrist.y < nose.y;

      if (this.state === "START" || this.state === "DOWN") {
        if (isReachingUp) {
          this.state = "UP";
          feedback = "ยืดตัวสุดแขน!";
        } else {
          feedback = "ชูมือขึ้นฟ้า!";
        }
      } else if (this.state === "UP") {
        const isLowered = lWrist.y > lShoulder.y && rWrist.y > rShoulder.y;
        if (isLowered && (now - this.lastRepTime > 380)) {
          this.reps += 1;
          repCounted = true;
          this.lastRepTime = now;
          this.state = "DOWN";
          feedback = `ยืดเหยียดสำเร็จ! (${this.reps}) 🙌`;
        }
      }
    }

    // ==========================================
    // 4.3 ARM SWING / WINDMILLS (แกว่งแขน / หมุนไหล่)
    // ==========================================
    else if (this.config.rules?.repetition?.type === "arm_swing") {
      const now = Date.now();
      const avgWristY = (lWrist.y + rWrist.y) / 2;
      const avgShoulderY = (lShoulder.y + rShoulder.y) / 2;
      const isUp = avgWristY < (avgShoulderY + 0.12);
      const isDown = avgWristY > (lHip.y + 0.05);

      if (this.state === "START" || this.state === "DOWN") {
        if (isUp) {
          this.state = "UP";
          feedback = "ทิ้งแขนลง!";
        } else {
          feedback = "แกว่งแขนขึ้น!";
        }
      } else if (this.state === "UP") {
        if (isDown && (now - this.lastRepTime > 380)) {
          this.reps += 1;
          repCounted = true;
          this.lastRepTime = now;
          this.state = "DOWN";
          feedback = `แกว่งแขนสวยงาม! (${this.reps}) ⚡`;
        }
      }
    }

    // ==========================================
    // 5. VOLLEYBALL SERVE UNDER (เสิร์ฟลูกมือล่าง - โหมดเด็กประถม เล่นง่าย สนุก)
    // ==========================================
    else if (this.config.id === "volleyball_serve_under") {
      const now = Date.now();
      const rShoulderAngle = calculateAngle(rHip, rShoulder, rWrist);
      const lShoulderAngle = calculateAngle(lHip, lShoulder, lWrist);

      // เลือกแขนข้างที่ขยับชัดเจนกว่า
      const isRightActive = rShoulderAngle >= lShoulderAngle;
      const wrist = isRightActive ? rWrist : lWrist;
      const shoulder = isRightActive ? rShoulder : lShoulder;
      const hip = isRightActive ? rHip : lHip;
      const elbow = isRightActive ? rElbow : lElbow;
      const elbowAngle = calculateAngle(shoulder, elbow, wrist);

      // ผ่อนปรนข้อศอก (เด็กๆ ไม่ต้องเกร็งตึง 100% ก็ผ่าน)
      const isArmStraight = elbowAngle >= 100;
      feedback = isArmStraight ? "ดีมาก!" : "เหยียดแขนอีกนิด!";

      // จังหวะที่ 1 (ง้าง): แค่มือง้างลงต่ำกว่าระดับครึ่งลำตัว (ไม่จำเป็นต้องดึงไปข้างหลังลึก)
      const isArmLow = wrist.y > (shoulder.y + 0.10);

      // จังหวะที่ 2 (ตี/เสย): เหวี่ยงมือขึ้นพ้นระดับกลางอก/ไหล่
      const isArmSwungUp = wrist.y < (shoulder.y + 0.18);

      if (this.state === "START" || this.state === "SERVED") {
        if (isArmLow) {
          this.state = "READY_TO_HIT";
          feedback = "เหวี่ยงแขนส่งบอลเลย!";
        } else {
          feedback = "ลดมือลงเตรียมเสิร์ฟ";
        }
      } else if (this.state === "READY_TO_HIT") {
        if (isArmSwungUp && (now - this.lastRepTime > 450)) {
          this.reps += 1;
          repCounted = true;
          this.lastRepTime = now;
          this.state = "SERVED";
          feedback = `เยี่ยมมาก! ครั้งที่ ${this.reps} ⭐`;
        }
      }
    }

    // ==========================================
    // 6. VOLLEYBALL SERVE OVER (เสิร์ฟลูกมือบน - โหมดเด็กประถม)
    // ==========================================
    else if (this.config.id === "volleyball_serve_over") {
      const now = Date.now();
      const activeRight = rWrist.y <= lWrist.y;
      const servingWrist = activeRight ? rWrist : lWrist;
      const servingElbow = activeRight ? rElbow : lElbow;
      const servingShoulder = activeRight ? rShoulder : lShoulder;
      const servingElbowAngle = calculateAngle(servingShoulder, servingElbow, servingWrist);

      // จังหวะที่ 1 (ง้าง): มือหรือศอกยกขึ้นระดับอก/ไหล่
      const isCocked = servingWrist.y < (servingShoulder.y + 0.15);

      // จังหวะที่ 2 (ฟาด/ยกสูง): ฟาดมือขึ้นสูงระดับหน้าหรือเหนือหัว
      const isHitHigh = servingWrist.y < (nose.y + 0.05);

      if (this.state === "START" || this.state === "SERVED") {
        if (isCocked) {
          this.state = "READY_TO_HIT";
          feedback = "ฟาดบอลขึ้นสูง!";
        } else {
          feedback = "ยกมือเตรียมตีบอล";
        }
      } else if (this.state === "READY_TO_HIT") {
        if (isHitHigh && (now - this.lastRepTime > 450)) {
          this.reps += 1;
          repCounted = true;
          this.lastRepTime = now;
          this.state = "SERVED";
          feedback = `สุดยอด! ครั้งที่ ${this.reps} ⚡`;
        }
      }
    }

    this.totalFrames++;
    if (isFormCorrect) {
      this.correctFrames++;
    }

    this.lastFormOk = isFormCorrect;
    this.formFeedback = feedback;

    return {
      isFormCorrect,
      feedback,
      repCounted,
      reps: this.reps,
      accuracy: this.getAccuracy(),
      angles: {
        elbow: avgElbowAngle,
        knee: avgKneeAngle
      }
    };
  }
}
