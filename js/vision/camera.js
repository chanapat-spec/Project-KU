/**
 * camera.js
 * Mobile-optimized WebRTC camera stream manager.
 * Uses 480p portrait stream for high FPS and low thermal throttling on smartphones.
 */

export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.facingMode = "user"; // selfie camera by default so students can see themselves
    this.isActive = false;
  }

  async start() {
    if (this.isActive && this.stream) return true;

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("กล้องไม่พร้อมใช้งาน: เบราว์เซอร์นี้ไม่รองรับ getUserMedia หรือไม่ได้เปิดผ่าน HTTPS");
    }

    // Mobile-friendly constraints: 640x480 or 480x640 is optimal for mobile AI inference
    const constraints = {
      audio: false,
      video: {
        facingMode: this.facingMode,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.video.setAttribute("playsinline", "true"); // Crucial for iOS Safari
      this.video.setAttribute("autoplay", "true");
      this.video.muted = true;

      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(resolve);
        };
      });

      this.isActive = true;
      return true;
    } catch (err) {
      console.error("Camera access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("กรุณากด 'อนุญาต' (Allow) ให้เข้าถึงกล้อง เพื่อเล่นมินิเกมจับท่าทาง");
      } else if (err.name === "NotFoundError") {
        throw new Error("ไม่พบอุปกรณ์กล้องบนเครื่องนี้");
      } else {
        throw new Error(`เปิดกล้องไม่สำเร็จ: ${err.message}`);
      }
    }
  }

  switchCamera() {
    this.facingMode = this.facingMode === "user" ? "environment" : "user";
    this.stop();
    return this.start();
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isActive = false;
  }
}
