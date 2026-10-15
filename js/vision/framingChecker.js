/**
 * framingChecker.js
 * Checks if student is positioned at the proper distance before starting exercise.
 * Confirms full-body visibility (head, shoulders, hips, knees, ankles).
 */

import { LANDMARK_INDEX } from "./postureRules.js";

export class FramingChecker {
  constructor() {
    this.requiredHoldTimeMs = 1500; // Must hold proper framing for 1.5 seconds
    this.holdStartTime = null;
    this.isCalibrated = false;
  }

  reset() {
    this.holdStartTime = null;
    this.isCalibrated = false;
  }

  check(landmarks, exerciseId = null) {
    if (!landmarks || landmarks.length < 29) {
      this.holdStartTime = null;
      return {
        isReady: false,
        percentReady: 0,
        message: "ไม่พบผู้เล่น กรุณาเข้ามายืนหน้ากล้อง"
      };
    }

    const L = LANDMARK_INDEX;
    const nose = landmarks[L.NOSE];
    const lAnkle = landmarks[L.LEFT_ANKLE];
    const rAnkle = landmarks[L.RIGHT_ANKLE];
    const lShoulder = landmarks[L.LEFT_SHOULDER];
    const rShoulder = landmarks[L.RIGHT_SHOULDER];
    const lHip = landmarks[L.LEFT_HIP];
    const rHip = landmarks[L.RIGHT_HIP];

    // Check if key landmarks exist and are in reasonable frame bounds (0.03 to 0.95)
    const hasHead = nose && nose.y > 0.03 && nose.y < 0.85;
    const hasShoulder = lShoulder || rShoulder;
    const hasHip = lHip || rHip;

    // For serve exercises: upper-body framing (Head to Waist/Hip) is sufficient
    const isServeExercise = exerciseId === "volleyball_serve_under" || exerciseId === "volleyball_serve_over";
    const hasLowerBody = (lAnkle && lAnkle.y > 0.60 && lAnkle.y < 0.98) ||
                         (rAnkle && rAnkle.y > 0.60 && rAnkle.y < 0.98);

    if (!hasHead) {
      this.holdStartTime = null;
      return {
        isReady: false,
        percentReady: 0,
        message: "ไม่เห็นศีรษะ กรุณาปรับมุมกล้อง"
      };
    }

    if (!isServeExercise && !hasLowerBody) {
      this.holdStartTime = null;
      return {
        isReady: false,
        percentReady: 0,
        message: "กรุณาถอยหลังให้เห็นข้อเท้า/ปลายเท้า"
      };
    } else if (isServeExercise && !hasShoulder) {
      this.holdStartTime = null;
      return {
        isReady: false,
        percentReady: 0,
        message: "กรุณาให้เห็นช่วงหัวไหล่และแขนชัดเจน"
      };
    }

    // Both head and feet are visible! Check hold duration
    const now = Date.now();
    if (!this.holdStartTime) {
      this.holdStartTime = now;
    }

    const elapsed = now - this.holdStartTime;
    const percentReady = Math.min(100, Math.round((elapsed / this.requiredHoldTimeMs) * 100));

    if (percentReady >= 100) {
      this.isCalibrated = true;
      return {
        isReady: true,
        percentReady: 100,
        message: "พร้อมแล้ว! ทรงตัวนิ่งๆ ไว้..."
      };
    }

    return {
      isReady: false,
      percentReady,
      message: `ล็อกตำแหน่ง... ${Math.ceil((this.requiredHoldTimeMs - elapsed) / 1000)} วินาที`
    };
  }
}
