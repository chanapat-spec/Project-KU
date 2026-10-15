/**
 * poseDetector.js
 * MediaPipe PoseLandmarker integration with retro 8-bit skeleton renderer.
 * Loads @mediapipe/tasks-vision via CDN.
 */

export class PoseDetector {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.landmarker = null;
    this.isLoaded = false;
    this.isRunning = false;
    this.lastVideoTime = -1;
    this.animationId = null;
    this.onFrameCallback = null;
  }

  async init(onProgress) {
    if (this.isLoaded && this.landmarker) return true;

    try {
      if (onProgress) onProgress("กำลังดาวน์โหลดโมเดล MediaPipe AI...");
      
      // Dynamic import from CDN
      const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
      const { FilesetResolver, PoseLandmarker } = vision;

      if (onProgress) onProgress("กำลังตั้งค่า WASM Runtime...");
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      if (onProgress) onProgress("กำลังโหลดโมเดล Pose Landmark (Lite)...");
      this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isLoaded = true;
      if (onProgress) onProgress("โมเดล AI พร้อมทำงาน!");
      return true;
    } catch (err) {
      console.error("Failed to load PoseLandmarker:", err);
      throw new Error("ไม่สามารถโหลดโมเดล AI ได้ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง");
    }
  }

  start(onFrame) {
    this.onFrameCallback = onFrame;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  loop() {
    if (!this.isRunning) return;

    if (this.video && this.video.readyState >= 2 && this.landmarker) {
      // Sync canvas dimensions to video
      if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      }

      const currentTime = this.video.currentTime;
      if (currentTime !== this.lastVideoTime) {
        this.lastVideoTime = currentTime;
        const timestampMs = performance.now();

        try {
          const result = this.landmarker.detectForVideo(this.video, timestampMs);
          const landmarks = result.landmarks && result.landmarks.length > 0 ? result.landmarks[0] : null;

          // Clear previous overlay
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

          let frameAnalysis = null;
          if (this.onFrameCallback) {
            frameAnalysis = this.onFrameCallback(landmarks);
          }

          if (landmarks) {
            this.drawRetroSkeleton(landmarks, frameAnalysis?.isFormCorrect ?? true);
          }
        } catch (e) {
          console.warn("Detection frame error:", e);
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  // Draw chunky 8-bit arcade style skeleton
  drawRetroSkeleton(landmarks, isCorrect) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const jointColor = isCorrect ? "#48bb78" : "#f56565"; // retro green vs retro red
    const lineColor = isCorrect ? "rgba(72, 187, 120, 0.65)" : "rgba(245, 101, 101, 0.65)";

    // Define skeleton connections
    const CONNECTIONS = [
      [11, 12], // shoulders
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], // torso
      [23, 24], // hips
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28]  // right leg
    ];

    // Draw chunky pixelated lines
    ctx.lineWidth = 6;
    ctx.lineCap = "square";
    ctx.strokeStyle = lineColor;

    CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    });

    // Draw square pixel joints
    const pixelSize = 10;
    ctx.fillStyle = jointColor;
    landmarks.forEach((p, idx) => {
      // Draw key joints: head, shoulders, elbows, wrists, hips, knees, ankles
      if ([0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx)) {
        if (p && p.visibility > 0.4) {
          const x = p.x * w;
          const y = p.y * h;
          // 8-bit square pixel
          ctx.fillRect(x - pixelSize / 2, y - pixelSize / 2, pixelSize, pixelSize);
        }
      }
    });
  }

  // Capture composite snapshot (mirrored video + skeleton + retro stamp overlay)
  captureSnapshot(student, exercise, grade, reps) {
    if (!this.video || this.video.videoWidth === 0) return null;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = 480;
    snapCanvas.height = 640;
    const sCtx = snapCanvas.getContext("2d");

    // 1. Draw mirrored camera frame
    sCtx.save();
    sCtx.translate(snapCanvas.width, 0);
    sCtx.scale(-1, 1);
    sCtx.drawImage(this.video, 0, 0, snapCanvas.width, snapCanvas.height);
    // Draw canvas overlay (skeleton)
    sCtx.drawImage(this.canvas, 0, 0, snapCanvas.width, snapCanvas.height);
    sCtx.restore();

    // 2. Retro Watermark Card at Bottom
    const cardH = 90;
    const cardY = snapCanvas.height - cardH - 12;
    sCtx.fillStyle = "rgba(15, 23, 42, 0.90)";
    sCtx.fillRect(12, cardY, snapCanvas.width - 24, cardH);
    sCtx.strokeStyle = "#ecc94b";
    sCtx.lineWidth = 3;
    sCtx.strokeRect(12, cardY, snapCanvas.width - 24, cardH);

    // Card Content
    sCtx.fillStyle = "#ecc94b";
    sCtx.font = "bold 12px 'Press Start 2P', monospace, sans-serif";
    sCtx.fillText("KU VOLLEY QUEST 🏐", 26, cardY + 24);

    sCtx.fillStyle = "#ffffff";
    sCtx.font = "bold 13px 'Prompt', sans-serif";
    const studentInfo = `${student?.name || 'นักเรียน'} (${student?.room || 'ห้อง 1'} เลขที่ ${student?.studentNumber || '-'})`;
    sCtx.fillText(studentInfo, 26, cardY + 46);

    sCtx.fillStyle = "#48bb78";
    sCtx.font = "12px 'Prompt', sans-serif";
    sCtx.fillText(`${exercise?.name || 'แบบฝึกหัด'}: ทำได้ ${reps} ครั้ง | เกรด ${grade?.grade || 'A'}`, 26, cardY + 68);

    sCtx.fillStyle = "#94a3b8";
    sCtx.font = "10px sans-serif";
    sCtx.textAlign = "right";
    sCtx.fillText(new Date().toLocaleDateString('th-TH'), snapCanvas.width - 24, cardY + 24);

    return snapCanvas.toDataURL("image/jpeg", 0.85);
  }
}
