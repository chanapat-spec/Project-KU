/**
 * app.js
 * Main Application Coordinator.
 * Coordinates:
 * - Student Login (Name, Number, Room 1-20)
 * - 8-Bit World & Wardrobe Skin Customization
 * - Daily Streak tracking
 * - 8-Bit Animated Tutorial in Mission Briefing
 * - Action Cam Session with Pose AI & Form Accuracy
 * - Evidence Snapshot capture & Google Sheets Cloud Sync
 */

import { storage } from "./storage.js";
import { supabase } from "./supabaseClient.js";
import { sound } from "./audio.js";
import { getExerciseById, getDefaultRooms, getAllExercises, syncExercisesFromServer } from "./config/sportsConfig.js";
import { GameEngine } from "./game/engine.js";
import { TutorialAnimation } from "./game/tutorialAnim.js";
import { CameraManager } from "./vision/camera.js";
import { PoseDetector } from "./vision/poseDetector.js";
import { PostureEvaluator } from "./vision/postureRules.js";
import { FramingChecker } from "./vision/framingChecker.js";

class App {
  constructor() {
    this.currentStudent = null;
    this.gameEngine = null;
    this.cameraManager = null;
    this.poseDetector = null;
    this.currentExercise = null;
    this.postureEvaluator = null;
    this.framingChecker = new FramingChecker();
    this.tutorialAnim = null;

    // Minigame session state
    this.sessionActive = false;
    this.isCalibrated = false;
    this.countdownTimer = null;
    this.gameTimer = null;
    this.remainingTime = 0;
    this.sessionStartTime = 0;

    this.initDOMElements();
    this.populateRoomDropdown();
    this.init();
  }

  initDOMElements() {
    // Screens
    this.screenLogin = document.getElementById("screen-login");
    this.screenGame = document.getElementById("screen-game");
    this.screenMinigame = document.getElementById("screen-minigame");

    // Modals
    this.modalBrief = document.getElementById("modal-brief");
    this.modalSummary = document.getElementById("modal-summary");
    this.modalLeaderboard = document.getElementById("modal-leaderboard");
    this.modalDialog = document.getElementById("modal-dialog");
    this.modalWardrobe = document.getElementById("modal-wardrobe");

    // Canvases & Video
    this.gameCanvas = document.getElementById("game-canvas");
    this.videoElement = document.getElementById("webcam-video");
    this.poseCanvas = document.getElementById("pose-canvas");
    this.tutorialCanvas = document.getElementById("tutorial-canvas");

    // UI Headers & Badges
    this.playerBadge = document.getElementById("player-badge");
    this.playerXP = document.getElementById("player-xp");
    this.badgeStreak = document.getElementById("badge-streak");

    // Minigame UI
    this.camStatus = document.getElementById("cam-status");
    this.camFeedback = document.getElementById("cam-feedback");
    this.camReps = document.getElementById("cam-reps");
    this.camTimer = document.getElementById("cam-timer");
    this.camProgressBar = document.getElementById("cam-progress-bar");
    this.camBorder = document.getElementById("cam-border-indicator");
  }

  getSubjectDisplayName(subjectKey) {
    const subjects = {
      "volleyball": "🏐 วอลเลย์บอล",
      "fitness": "🏃 กายบริหาร & คาร์ดิโอ",
      "badminton": "🏸 แบดมินตัน",
      "basketball": "🏀 บาสเกตบอล",
      "football": "⚽ ฟุตบอล"
    };
    return subjects[subjectKey] || "🏐 วอลเลย์บอล";
  }

  populateRoomDropdown() {
    const roomSelect = document.getElementById("input-room");
    if (!roomSelect) return;

    const rooms = getDefaultRooms();
    roomSelect.innerHTML = rooms.map(room => `<option value="${room}">${room}</option>`).join("");

    // Check URL query param ?subject=...
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get("subject");
    const subjectSelect = document.getElementById("input-subject");
    if (subjectSelect && subjectParam) {
      subjectSelect.value = subjectParam;
    }

    const updateSubjectBanner = () => {
      const bannerName = document.getElementById("subject-banner-name");
      const bannerIcon = document.getElementById("subject-banner-icon");
      if (subjectSelect && bannerName && bannerIcon) {
        const val = subjectSelect.value;
        const iconMap = {
          "volleyball": "🏐",
          "fitness": "🏃",
          "badminton": "🏸",
          "basketball": "🏀",
          "football": "⚽"
        };
        const nameMap = {
          "volleyball": "วิชาพลศึกษา: วอลเลย์บอล",
          "fitness": "วิชาพลศึกษา: กายบริหาร & คาร์ดิโอ",
          "badminton": "วิชาพลศึกษา: แบดมินตัน",
          "basketball": "วิชาพลศึกษา: บาสเกตบอล",
          "football": "วิชาพลศึกษา: ฟุตบอล"
        };
        bannerName.textContent = nameMap[val] || val;
        bannerIcon.textContent = iconMap[val] || "🏐";
      }
    };

    updateSubjectBanner();
    if (subjectSelect) {
      subjectSelect.addEventListener("change", updateSubjectBanner);
    }

    const btnToggleSubject = document.getElementById("btn-toggle-subject-select");
    const subjectWrapper = document.getElementById("subject-select-wrapper");
    if (btnToggleSubject && subjectWrapper) {
      btnToggleSubject.addEventListener("click", () => {
        subjectWrapper.classList.toggle("hidden");
      });
    }
  }

  async init() {
    // Sync configurations (Supabase & Google Sheets Webhook) from server
    await storage.syncConfigFromServer();
    // Sync custom exercises configured by teacher from server
    await syncExercisesFromServer();

    // Check Daily Streak
    const streakInfo = storage.updateDailyStreak();
    if (this.badgeStreak) {
      this.badgeStreak.textContent = `🔥 ${streakInfo.streak} วัน`;
    }

    // Check if student already registered
    this.currentStudent = storage.getStudent();
    if (this.currentStudent) {
      this.showScreen("game");
      this.initGameWorld();
      this.setupRealtimeLeaderboard();
      this.updateProgressHUD();

      // Background cloud sync
      storage.syncStudentWithCloud(this.currentStudent).then(synced => {
        if (synced && synced.totalXP !== this.currentStudent.totalXP) {
          this.currentStudent = synced;
          this.playerXP.textContent = `${this.currentStudent.totalXP} XP`;
          this.updateProgressHUD();
        }
      });
    } else {
      this.showScreen("login");
    }

    this.bindEvents();
  }

  setupRealtimeLeaderboard() {
    if (supabase.isConfigured()) {
      supabase.subscribeToLeaderboard(async () => {
        console.log("⚡ Realtime update: refreshing leaderboard...");
        const updated = await storage.refreshLeaderboardFromSupabase();
        if (this.modalLeaderboard && !this.modalLeaderboard.classList.contains("hidden")) {
          this.renderLeaderboardTable(updated);
        }
      });
    }
  }

  bindEvents() {
    // 1. Login Form Submit
    const loginForm = document.getElementById("form-login");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const studentName = document.getElementById("input-student-name").value.trim();
        const studentNumber = document.getElementById("input-student-number").value.trim();
        const room = document.getElementById("input-room").value;
        const subject = document.getElementById("input-subject")?.value || "volleyball";

        if (!studentName || !studentNumber) {
          alert("กรุณากรอกชื่อและเลขที่");
          return;
        }

        sound.ensureAudioContext();
        sound.playCoin();
        this.currentStudent = storage.saveStudent({ name: studentName, studentNumber, room, subject });
        this.showScreen("game");
        this.initGameWorld();
        this.setupRealtimeLeaderboard();
        this.updateProgressHUD();

        // Greet returning student if they already have accumulated XP
        if (this.currentStudent.totalXP > 0) {
          this.showNotificationToast(
            "👋 ยินดีต้อนรับกลับมา!",
            `น้อง ${this.currentStudent.name} มีคะแนนสะสมเดิม: ${this.currentStudent.totalXP} XP 🏆`,
            "⭐"
          );
          sound.speak(`ยินดีต้อนรับ ${this.currentStudent.name} คะแนนสะสมเดิม ${this.currentStudent.totalXP} แต้ม`);
        }

        // Background cloud sync check
        storage.syncStudentWithCloud(this.currentStudent).then(synced => {
          if (synced && synced.totalXP !== this.currentStudent.totalXP) {
            this.currentStudent = synced;
            this.playerXP.textContent = `${this.currentStudent.totalXP} XP`;
            this.updateProgressHUD();
          }
        });
      });
    }

    // 2. Logout
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        if (confirm("ต้องการเปลี่ยนผู้เล่น / ล็อกเอาท์หรือไม่?")) {
          storage.clearStudent();
          location.reload();
        }
      });
    }

    // 3. Sound Toggle
    const btnSound = document.getElementById("btn-sound");
    if (btnSound) {
      btnSound.addEventListener("click", () => {
        sound.isMuted = !sound.isMuted;
        btnSound.textContent = sound.isMuted ? "🔇" : "🔊";
      });
    }

    // 4. Modal Close Buttons
    document.querySelectorAll(".btn-close-modal").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".app-modal");
        if (modal) modal.classList.add("hidden");
        if (this.tutorialAnim) this.tutorialAnim.stop();
        if (this.gameEngine) this.gameEngine.resume();
      });
    });

    // 5. Start Mission from Briefing
    const btnStartMission = document.getElementById("btn-start-mission");
    if (btnStartMission) {
      btnStartMission.addEventListener("click", () => {
        if (this.tutorialAnim) this.tutorialAnim.stop();
        this.modalBrief.classList.add("hidden");
        this.startActionCamSession();
      });
    }

    // 6. Exit Camera Minigame (Top & Bottom buttons for kids)
    const btnExitCam = document.getElementById("btn-exit-cam");
    if (btnExitCam) {
      btnExitCam.addEventListener("click", () => {
        this.stopActionCamSession();
      });
    }
    const btnExitCamBottom = document.getElementById("btn-exit-cam-bottom");
    if (btnExitCamBottom) {
      btnExitCamBottom.addEventListener("click", () => {
        this.stopActionCamSession();
      });
    }

    // 7. Finish & Return to Map from Summary
    const btnSummaryReturn = document.getElementById("btn-summary-return");
    if (btnSummaryReturn) {
      btnSummaryReturn.addEventListener("click", () => {
        this.stopClipLooper();
        this.modalSummary.classList.add("hidden");
        this.showScreen("game");
        if (this.gameEngine) this.gameEngine.resume();
      });
    }

    // Mini-Clip Controls in Summary Modal
    const btnToggleClip = document.getElementById("btn-toggle-clip-view");
    const btnToggleSnap = document.getElementById("btn-toggle-snap-view");
    const clipScreenBox = document.getElementById("clip-screen-box");
    const snapScreenBox = document.getElementById("snap-screen-box");
    const btnClipSpeed = document.getElementById("btn-clip-speed");
    const labelClipSpeed = document.getElementById("label-clip-speed");
    const btnClipPlayPause = document.getElementById("btn-clip-playpause");
    const labelClipPlayPause = document.getElementById("label-clip-playpause");

    if (btnToggleClip && btnToggleSnap) {
      btnToggleClip.addEventListener("click", () => {
        btnToggleClip.className = "px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold cursor-pointer";
        btnToggleSnap.className = "px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-semibold cursor-pointer";
        if (clipScreenBox) clipScreenBox.classList.remove("hidden");
        if (snapScreenBox) snapScreenBox.classList.add("hidden");
      });

      btnToggleSnap.addEventListener("click", () => {
        btnToggleSnap.className = "px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold cursor-pointer";
        btnToggleClip.className = "px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-semibold cursor-pointer";
        if (clipScreenBox) clipScreenBox.classList.add("hidden");
        if (snapScreenBox) snapScreenBox.classList.remove("hidden");
      });
    }

    if (btnClipSpeed) {
      btnClipSpeed.addEventListener("click", () => {
        const newSpeed = this.clipSpeedMultiplier === 1.0 ? 0.5 : 1.0;
        if (labelClipSpeed) {
          labelClipSpeed.textContent = newSpeed === 0.5 ? "🐢 0.5x สโลว์" : "⚡ 1.0x ปกติ";
        }
        if (this.currentClipFrames) {
          this.startClipLooper(this.currentClipFrames, newSpeed);
        }
      });
    }

    if (btnClipPlayPause) {
      btnClipPlayPause.addEventListener("click", () => {
        this.isClipPlaying = !this.isClipPlaying;
        if (labelClipPlayPause) {
          labelClipPlayPause.textContent = this.isClipPlaying ? "⏸️ หยุด" : "▶️ เล่น";
        }
      });
    }

    // 8. Open Leaderboard
    const btnOpenLeaderboard = document.getElementById("btn-open-leaderboard");
    if (btnOpenLeaderboard) {
      btnOpenLeaderboard.addEventListener("click", () => {
        this.showLeaderboardModal();
      });
    }

    // 9. Open Wardrobe (แต่งตัว)
    const btnOpenWardrobe = document.getElementById("btn-open-wardrobe");
    if (btnOpenWardrobe) {
      btnOpenWardrobe.addEventListener("click", () => {
        this.openWardrobeModal();
      });
    }

    // 9.1 Open Health & BMI Modal
    const btnOpenHealthBMI = document.getElementById("btn-open-health-bmi");
    if (btnOpenHealthBMI) {
      btnOpenHealthBMI.addEventListener("click", () => {
        this.showHealthBMIModal();
      });
    }

    // Live BMI calculation listeners
    const inputHWeight = document.getElementById("input-health-weight");
    const inputHHeight = document.getElementById("input-health-height");
    if (inputHWeight) inputHWeight.addEventListener("input", () => this.updateLiveBMICalculation());
    if (inputHHeight) inputHHeight.addEventListener("input", () => this.updateLiveBMICalculation());

    // Submit Health Form
    const formHealthBMI = document.getElementById("form-health-bmi");
    if (formHealthBMI) {
      formHealthBMI.addEventListener("submit", (e) => {
        e.preventDefault();
        const student = this.currentStudent || storage.getStudent();
        if (!student) {
          alert("ไม่พบข้อมูลนักเรียน กรุณาล็อกอินใหม่");
          return;
        }

        const genderRadio = document.querySelector('input[name="health-gender"]:checked');
        const gender = genderRadio ? genderRadio.value : "male";
        const age = parseInt(document.getElementById("input-health-age").value, 10) || 10;
        const weight = parseFloat(document.getElementById("input-health-weight").value);
        const height = parseFloat(document.getElementById("input-health-height").value);

        if (!weight || !height) {
          alert("กรุณากรอกน้ำหนักและส่วนสูงให้ถูกต้อง");
          return;
        }

        const record = storage.saveHealthRecord({
          name: student.name,
          studentNumber: student.studentNumber,
          room: student.room,
          gender,
          age,
          weight,
          height
        });

        // Award +10 XP Bonus
        student.totalXP = (student.totalXP || 0) + 10;
        storage.saveStudent(student);
        this.currentStudent = student;
        if (this.playerXP) this.playerXP.textContent = `${student.totalXP} XP`;
        sound.playCoin();
        sound.speak(`บันทึกข้อมูลสุขภาพเรียบร้อย คุณมีค่า บีเอ็มไอ ${record.bmi} ${record.classification}`);

        this.showNotificationToast(
          "🏥 บันทึกข้อมูลสุขภาพ & BMI สำเร็จ!",
          `ค่า BMI: ${record.bmi} (${record.classification}) รับโบนัสรักสุขภาพ +10 XP! ⭐`,
          "❤️"
        );

        document.getElementById("modal-health-bmi").classList.add("hidden");
        if (this.gameEngine) this.gameEngine.resume();
      });

      // Quick Test Sheet Button inside Game Health Modal
      const btnGameTestSheet = document.getElementById("btn-game-test-sheet");
      if (btnGameTestSheet) {
        btnGameTestSheet.addEventListener("click", async () => {
          const student = storage.getStudent() || { name: "นักเรียนทดสอบ (Game Test)", studentNumber: "99", room: "ห้อง 1" };
          const webhookUrl = storage.getCloudWebhook();
          
          if (!webhookUrl) {
            alert("⚠️ ยังไม่ได้ตั้งค่า Webhook URL ในระบบ กรุณาให้อาจารย์ใส่ URL ในหน้า Admin Dashboard ก่อนครับ");
            return;
          }

          this.showNotificationToast("⏳ กำลังส่งข้อมูล...", "กำลังส่งข้อมูลทดสอบไปยัง Google Sheets...", "☁️");

          const testHealth = {
            name: (student.name || "นักเรียนทดสอบ") + " [เทส]",
            studentNumber: student.studentNumber || "99",
            room: student.room || "ห้อง 1",
            gender: "male",
            age: 10,
            weight: 35.0,
            height: 140.0
          };

          storage.saveHealthRecord(testHealth);
          sound.playCoin();
          
          this.showNotificationToast(
            "🚀 ส่งข้อมูลทดสอบเรียบร้อย!",
            `ส่งข้อมูลสุขภาพของ "${testHealth.name}" ไปยัง Google Sheets (แผ่นที่ 2) แล้ว! กรุณาเปิดดูในชีต`,
            "✅"
          );
        });
      }
    }

    // 10. Wardrobe Item Buttons
    document.querySelectorAll(".btn-skin-jersey").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const color = btn.getAttribute("data-color");
        const wardrobe = storage.getWardrobe();
        wardrobe.equipped.jerseyColor = color;
        storage.saveWardrobe(wardrobe);
        if (this.gameEngine) {
          this.gameEngine.player.setSkin(wardrobe.equipped);
        }
        sound.playCoin();
      });
    });

    const checkKneepads = document.getElementById("check-kneepads");
    if (checkKneepads) {
      checkKneepads.addEventListener("change", (e) => {
        const wardrobe = storage.getWardrobe();
        wardrobe.equipped.hasKneepads = e.target.checked;
        storage.saveWardrobe(wardrobe);
        if (this.gameEngine) {
          this.gameEngine.player.setSkin(wardrobe.equipped);
        }
        sound.playCoin();
      });
    }

    const checkPet = document.getElementById("check-pet");
    if (checkPet) {
      checkPet.addEventListener("change", (e) => {
        const wardrobe = storage.getWardrobe();
        wardrobe.equipped.hasPet = e.target.checked;
        storage.saveWardrobe(wardrobe);
        if (this.gameEngine) {
          this.gameEngine.player.setSkin(wardrobe.equipped);
        }
        sound.playCoin();
      });
    }

    // 11. Open Final Report (ใบสรุปผลและส่งคะแนนรวม)
    const btnOpenFinalReport = document.getElementById("btn-open-final-report");
    if (btnOpenFinalReport) {
      btnOpenFinalReport.addEventListener("click", () => {
        this.openFinalReportModal();
      });
    }

    const btnSummaryToReport = document.getElementById("btn-summary-to-report");
    if (btnSummaryToReport) {
      btnSummaryToReport.addEventListener("click", () => {
        this.stopClipLooper();
        this.modalSummary.classList.add("hidden");
        this.openFinalReportModal();
      });
    }

    const btnConfirmFinalSubmit = document.getElementById("btn-confirm-final-submit");
    if (btnConfirmFinalSubmit) {
      btnConfirmFinalSubmit.addEventListener("click", async () => {
        sound.playFanfare();
        sound.speak("บันทึกและส่งผลคะแนนรวมให้ครูซูนเรียบร้อยแล้ว ยอดเยี่ยมมาก");

        // Sync and refresh
        storage.saveStudent(this.currentStudent);
        await storage.refreshLeaderboardFromSupabase();

        this.showNotificationToast(
          "💾 บันทึกสำเร็จ!",
          `ส่งผลการทดสอบของ ${this.currentStudent.name} ให้ครูซูนเรียบร้อย (${this.currentStudent.totalXP} XP)`,
          "🏅"
        );

        const modal = document.getElementById("modal-final-report");
        if (modal) modal.classList.add("hidden");
        if (this.gameEngine) this.gameEngine.resume();
      });
    }
  }

  showScreen(screenName) {
    this.screenLogin.classList.toggle("hidden", screenName !== "login");
    this.screenGame.classList.toggle("hidden", screenName !== "game");
    this.screenMinigame.classList.toggle("hidden", screenName !== "minigame");

    if (this.currentStudent) {
      const roomText = this.currentStudent.room || 'ห้อง 1';
      const noText = this.currentStudent.studentNumber ? `เลขที่ ${this.currentStudent.studentNumber}` : '';
      this.playerBadge.textContent = `${this.currentStudent.name} (${roomText} ${noText})`;
      this.playerXP.textContent = `${this.currentStudent.totalXP || 0} XP`;

      const badgeSubject = document.getElementById("badge-subject");
      if (badgeSubject) {
        badgeSubject.textContent = this.getSubjectDisplayName(this.currentStudent.subject);
      }
    }
  }

  initGameWorld() {
    if (!this.gameEngine) {
      this.gameEngine = new GameEngine(this.gameCanvas, (zone) => this.handleZoneInteraction(zone));

      // Apply saved wardrobe skin to player
      const wardrobe = storage.getWardrobe();
      this.gameEngine.player.setSkin(wardrobe.equipped);

      // Bind Virtual Touch D-Pad
      const dpad = {
        up: document.getElementById("dpad-up"),
        down: document.getElementById("dpad-down"),
        left: document.getElementById("dpad-left"),
        right: document.getElementById("dpad-right")
      };
      const actionBtn = document.getElementById("btn-action-a");
      this.gameEngine.controls.bindTouchButtons(dpad, actionBtn);
    }
    this.gameEngine.start();
  }

  handleZoneInteraction(zone) {
    sound.ensureAudioContext();
    sound.playJump();

    if (zone.type === "exercise") {
      // 1. STRETCHING ZONE (10 basic stretching poses)
      if (zone.id === "zone_stretching" || zone.id === "zone_squat") {
        const stretches = getAllExercises().filter(ex => ex.sport === "Stretching" || ex.id.startsWith("stretch_"));
        if (stretches.length > 0) {
          this.showStretchingSelectionModal(stretches);
          return;
        }
      }

      // 2. WARM-UP ZONE (10 dynamic warm-up exercises)
      if (zone.id === "zone_warmup" || zone.id === "zone_jumping") {
        const warmups = getAllExercises().filter(ex => ex.sport === "Warm-up" || ex.id.startsWith("dynamic_") || ex.id.includes("warmup"));
        if (warmups.length > 0) {
          this.showWarmupSelectionModal(warmups);
          return;
        }
      }

      this.openExerciseBriefing(zone.exerciseId);
    } else if (zone.type === "health" || zone.id === "zone_health_station") {
      this.showHealthBMIModal();
    } else if (zone.type === "npc") {
      this.showCoachDialog(zone.dialog);
    } else if (zone.type === "leaderboard") {
      this.showLeaderboardModal();
    }
  }

  showStretchingSelectionModal(stretches) {
    if (this.gameEngine) this.gameEngine.pause();
    const modal = document.getElementById("modal-stretching-select");
    const container = document.getElementById("stretching-options-list");
    if (!modal || !container) {
      this.openExerciseBriefing(stretches[0].id);
      return;
    }

    container.innerHTML = stretches.map((s, idx) => `
      <button class="btn-select-stretch w-full p-2.5 sm:p-3 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-left transition-all hover:scale-[1.01] shadow-xs active:scale-95" data-id="${s.id}">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-white border border-emerald-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <img src="assets/poses/${s.id}.svg" alt="${s.name}" class="w-full h-full object-contain" onerror="this.src='assets/poses/stretch_neck.svg'">
          </div>
          <div>
            <div class="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
              <span>${idx + 1}. ${s.name}</span>
            </div>
            <div class="text-[10px] text-slate-500 line-clamp-1">${s.description || '-'}</div>
          </div>
        </div>
        <div class="text-right flex flex-col items-end gap-0.5 shrink-0 ml-2">
          <span class="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full font-mono shadow-xs">+5 EXP</span>
          <span class="text-[9px] text-emerald-800 font-semibold">${s.targetReps} ครั้ง • ${s.timeLimit}s</span>
        </div>
      </button>
    `).join("");

    container.querySelectorAll(".btn-select-stretch").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        modal.classList.add("hidden");
        this.openExerciseBriefing(id);
      });
    });

    modal.classList.remove("hidden");
  }

  showWarmupSelectionModal(warmups) {
    if (this.gameEngine) this.gameEngine.pause();
    const modal = document.getElementById("modal-warmup-select");
    const container = document.getElementById("warmup-options-list");
    if (!modal || !container) {
      this.openExerciseBriefing(warmups[0].id);
      return;
    }

    container.innerHTML = warmups.map((w, idx) => `
      <button class="btn-select-warmup w-full p-2.5 sm:p-3 bg-amber-50/70 hover:bg-amber-100 border border-amber-200/90 rounded-2xl flex items-center justify-between text-left transition-all hover:scale-[1.01] shadow-xs active:scale-95" data-id="${w.id}">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-white border border-amber-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <img src="assets/poses/${w.id}.svg" alt="${w.name}" class="w-full h-full object-contain" onerror="this.src='assets/poses/dynamic_squats.svg'">
          </div>
          <div>
            <div class="font-bold text-xs text-amber-950 flex items-center gap-1.5">
              <span>${idx + 1}. ${w.name}</span>
            </div>
            <div class="text-[10px] text-slate-500 line-clamp-1">${w.description || '-'}</div>
          </div>
        </div>
        <div class="text-right flex flex-col items-end gap-0.5 shrink-0 ml-2">
          <span class="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full font-mono shadow-xs">+5 EXP</span>
          <span class="text-[9px] text-amber-900 font-semibold">${w.targetReps} ครั้ง • ${w.timeLimit}s</span>
        </div>
      </button>
    `).join("");

    container.querySelectorAll(".btn-select-warmup").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        modal.classList.add("hidden");
        this.openExerciseBriefing(id);
      });
    });

    modal.classList.remove("hidden");
  }

  // --- COACH SOON DIALOG MODAL ---
  showCoachDialog(dialogLines) {
    if (this.gameEngine) this.gameEngine.pause();
    const content = document.getElementById("dialog-content");
    content.innerHTML = dialogLines.map(line => `<p class="mb-3 text-xs leading-relaxed">${line}</p>`).join("");
    this.modalDialog.classList.remove("hidden");
  }

  // --- WARDROBE MODAL ---
  openWardrobeModal() {
    if (this.gameEngine) this.gameEngine.pause();
    const wardrobe = storage.getWardrobe();
    const checkKneepads = document.getElementById("check-kneepads");
    const checkPet = document.getElementById("check-pet");

    if (checkKneepads) checkKneepads.checked = !!wardrobe.equipped.hasKneepads;
    if (checkPet) checkPet.checked = !!wardrobe.equipped.hasPet;

    this.modalWardrobe.classList.remove("hidden");
  }

  // --- LEADERBOARD MODAL ---
  async showLeaderboardModal() {
    if (this.gameEngine) this.gameEngine.pause();
    this.renderLeaderboardTable(storage.getLeaderboard());
    this.modalLeaderboard.classList.remove("hidden");

    if (supabase.isConfigured()) {
      try {
        const fresh = await storage.refreshLeaderboardFromSupabase();
        if (fresh && fresh.length > 0) {
          this.renderLeaderboardTable(fresh);
        }
      } catch (err) {
        console.warn("Could not fetch latest Supabase leaderboard:", err);
      }
    }
  }

  renderLeaderboardTable(list) {
    const tbody = document.getElementById("leaderboard-tbody");
    if (!tbody) return;
    tbody.innerHTML = list.map((item, idx) => `
      <tr class="${item.id === this.currentStudent?.id ? 'bg-yellow-900/40 font-bold text-yellow-300' : 'border-b border-gray-700'}">
        <td class="p-2 text-center">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
        <td class="p-2 font-medium">${item.name}</td>
        <td class="p-2 text-center text-xs text-gray-300">${item.room || '-'}</td>
        <td class="p-2 text-center text-xs text-yellow-300 font-mono">${item.studentNumber || '-'}</td>
        <td class="p-2 text-right text-emerald-400 font-bold font-mono">${item.totalXP || 0}</td>
      </tr>
    `).join("");
  }

  // --- HEALTH & BMI ASSESSMENT MODAL ---
  showHealthBMIModal() {
    if (this.gameEngine) this.gameEngine.pause();
    const modal = document.getElementById("modal-health-bmi");
    if (!modal) return;

    const student = this.currentStudent || storage.getStudent();
    if (student) {
      document.getElementById("health-student-name").textContent = student.name;
      document.getElementById("health-student-room").textContent = student.room || "ห้อง 1";
      document.getElementById("health-student-number").textContent = `เลขที่ ${student.studentNumber || '1'}`;

      // Pre-fill existing record if available
      const existing = storage.getHealthRecordByStudent(student.id);
      if (existing) {
        if (existing.age) document.getElementById("input-health-age").value = existing.age;
        if (existing.weight) document.getElementById("input-health-weight").value = existing.weight;
        if (existing.height) document.getElementById("input-health-height").value = existing.height;
        if (existing.gender) {
          const radio = document.querySelector(`input[name="health-gender"][value="${existing.gender}"]`);
          if (radio) radio.checked = true;
        }
      }
      this.updateLiveBMICalculation();
    }

    modal.classList.remove("hidden");
  }

  updateLiveBMICalculation() {
    const weightEl = document.getElementById("input-health-weight");
    const heightEl = document.getElementById("input-health-height");
    const previewBmi = document.getElementById("health-preview-bmi");
    const previewBadge = document.getElementById("health-preview-badge");
    if (!weightEl || !heightEl || !previewBmi || !previewBadge) return;

    const w = parseFloat(weightEl.value);
    const h = parseFloat(heightEl.value);
    if (w > 0 && h > 0) {
      const bmi = storage.calculateBMI(w, h);
      const cat = storage.getBMICategory(bmi);
      previewBmi.textContent = bmi;
      previewBadge.textContent = cat.category;
      previewBadge.className = `px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat.badge}`;
    } else {
      previewBmi.textContent = "--";
      previewBadge.textContent = "กรอกข้อมูลเพื่อคำนวณ";
      previewBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700";
    }
  }

  // --- EXERCISE BRIEFING MODAL WITH 8-BIT ANIMATED TUTORIAL ---
  openExerciseBriefing(exerciseId) {
    if (this.gameEngine) this.gameEngine.pause();
    this.currentExercise = getExerciseById(exerciseId);

    document.getElementById("brief-title").textContent = this.currentExercise.name;
    document.getElementById("brief-desc").textContent = this.currentExercise.description;
    document.getElementById("brief-target").textContent = `${this.currentExercise.targetReps} ครั้ง`;
    document.getElementById("brief-time").textContent = `${this.currentExercise.timeLimit} วินาที`;

    const instructionsList = document.getElementById("brief-instructions");
    instructionsList.innerHTML = this.currentExercise.instructions.map(i => `<li class="mb-1 text-xs text-gray-300">${i}</li>`).join("");

    const rewardEl = document.getElementById("brief-reward");
    if (rewardEl) {
      rewardEl.textContent = this.currentExercise.fixedXP ? `+${this.currentExercise.fixedXP} EXP` : `+${this.currentExercise.pointsPerRep || 20} EXP/ครั้ง`;
    }

    // Set Pose Illustrated Demo Image
    const poseImg = document.getElementById("brief-pose-img");
    if (poseImg) {
      poseImg.src = `assets/poses/${this.currentExercise.id}.svg`;
    }
    const badgeType = document.getElementById("brief-badge-type");
    if (badgeType) {
      badgeType.textContent = this.currentExercise.badge || this.currentExercise.sport || "ออกกำลังกาย";
      if (this.currentExercise.sport === "Stretching") {
        badgeType.className = "px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold";
      } else if (this.currentExercise.sport === "Warm-up") {
        badgeType.className = "px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold";
      } else {
        badgeType.className = "px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold";
      }
    }

    this.modalBrief.classList.remove("hidden");
  }

  // --- ACTION CAM MINIGAME LOGIC ---
  async startActionCamSession() {
    this.showScreen("minigame");
    sound.ensureAudioContext();

    this.sessionActive = true;
    this.isCalibrated = false;
    this.postureEvaluator = new PostureEvaluator(this.currentExercise);
    this.framingChecker.reset();

    // Update Floating Mini PIP Pose Guide on Camera
    const pipImg = document.getElementById("cam-pip-img");
    const pipName = document.getElementById("cam-pip-name");
    if (pipImg) pipImg.src = `assets/poses/${this.currentExercise.id}.svg`;
    if (pipName) pipName.textContent = this.currentExercise.name;

    this.camStatus.textContent = "กำลังเชื่อมต่อกล้อง...";
    this.camFeedback.textContent = "กรุณากดอนุญาตกล้อง";
    this.camReps.textContent = `0 / ${this.currentExercise.targetReps}`;
    this.camTimer.textContent = `${this.currentExercise.timeLimit}s`;
    this.camProgressBar.style.width = "0%";

    try {
      if (!this.cameraManager) {
        this.cameraManager = new CameraManager(this.videoElement);
      }
      await this.cameraManager.start();

      if (!this.poseDetector) {
        this.poseDetector = new PoseDetector(this.videoElement, this.poseCanvas);
      }
      await this.poseDetector.init((status) => {
        this.camStatus.textContent = status;
      });

      this.camStatus.textContent = "กรุณาถอยห่างจากกล้อง (ให้เห็นทั้งตัว)";
      sound.speak("กรุณาถอยห่างจากกล้อง ให้เห็นเต็มตัว");

      this.poseDetector.start((landmarks) => this.onPoseFrame(landmarks));
    } catch (err) {
      alert(err.message);
      this.stopActionCamSession();
    }
  }

  onPoseFrame(landmarks) {
    if (!this.sessionActive) return null;

    if (!this.isCalibrated) {
      const frameCheck = this.framingChecker.check(landmarks, this.currentExercise?.id);
      this.camFeedback.textContent = frameCheck.message;
      this.camProgressBar.style.width = `${frameCheck.percentReady}%`;

      if (frameCheck.isReady) {
        this.isCalibrated = true;
        this.startExerciseCountdown();
      }
      return { isFormCorrect: false };
    }

    if (this.sessionStarted) {
      const result = this.postureEvaluator.evaluate(landmarks);

      if (result.isFormCorrect) {
        this.camBorder.className = "cam-border border-4 border-emerald-500 shadow-emerald-500/50 shadow-lg";
      } else {
        this.camBorder.className = "cam-border border-4 border-rose-500 shadow-rose-500/50 shadow-lg";
      }

      this.camFeedback.textContent = result.feedback;
      this.camReps.textContent = `${result.reps} / ${this.currentExercise.targetReps}`;
      const progressPercent = Math.min(100, Math.round((result.reps / this.currentExercise.targetReps) * 100));
      this.camProgressBar.style.width = `${progressPercent}%`;

      if (result.repCounted) {
        sound.playCoin();
        sound.speak(`${result.reps}`);

        // Mark this rep for motion clip ring buffer
        if (this.poseDetector) {
          this.poseDetector.markRepCompleted(result);
        }

        if (result.reps >= this.currentExercise.targetReps) {
          this.finishExerciseSession(true);
        }
      }

      return result;
    }

    return null;
  }

  startExerciseCountdown() {
    // Spoken guidance ONLY before timer starts
    const exerciseName = this.currentExercise?.name || "";
    sound.speak(`พร้อมแล้ว เตรียมตัวฝึก ${exerciseName} เริ่มใน สาม สอง หนึ่ง`, true);
    let count = 3;
    this.camStatus.textContent = `เริ่มใน ${count}...`;
    sound.playBeep(false);

    this.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        this.camStatus.textContent = `เริ่มใน ${count}...`;
        sound.playBeep(false);
      } else {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        sound.playBeep(true);
        this.camStatus.textContent = `ภารกิจ: ${this.currentExercise.name}`;
        this.startSessionTimer();
      }
    }, 1000);
  }

  startSessionTimer() {
    this.sessionStarted = true;
    this.sessionStartTime = Date.now();
    this.remainingTime = this.currentExercise.timeLimit;
    this.camTimer.textContent = `${this.remainingTime}s`;

    // Start rolling motion clip buffer
    if (this.poseDetector) {
      this.poseDetector.startMotionRecording();
    }

    this.gameTimer = setInterval(() => {
      this.remainingTime--;
      this.camTimer.textContent = `${this.remainingTime}s`;

      if (this.remainingTime <= 5 && this.remainingTime > 0) {
        sound.playBeep(false);
      }

      if (this.remainingTime <= 0) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
        this.finishExerciseSession(false);
      }
    }, 1000);
  }

  finishExerciseSession(isGoalAchieved) {
    this.sessionActive = false;
    this.sessionStarted = false;
    if (this.gameTimer) clearInterval(this.gameTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    const reps = this.postureEvaluator?.reps || 0;
    const duration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    const isFixedXP = this.currentExercise.fixedXP !== undefined;
    const xpEarned = isFixedXP
      ? (isGoalAchieved ? this.currentExercise.fixedXP : Math.max(1, Math.round((reps / Math.max(1, this.currentExercise.targetReps)) * this.currentExercise.fixedXP)))
      : (reps * (this.currentExercise.pointsPerRep || 20) + (isGoalAchieved ? 50 : 0));
    const accuracy = this.postureEvaluator?.getAccuracy() || 100;
    const grade = this.postureEvaluator?.getGrade() || { grade: "A", badge: "ดีมาก!" };

    // Capture Composite Evidence Snapshot & 1-Rep Mini Clip
    let snapshotDataUrl = null;
    let clipFrames = null;
    try {
      if (this.poseDetector) {
        snapshotDataUrl = this.poseDetector.captureSnapshot(this.currentStudent, this.currentExercise, grade, reps);
        clipFrames = this.poseDetector.getBestRepClip();
        this.poseDetector.stopMotionRecording();
      }
    } catch (e) {
      console.warn("Snapshot / Clip capture failed:", e);
    }

    // Stop vision & camera to preserve battery
    if (this.poseDetector) this.poseDetector.stop();
    if (this.cameraManager) this.cameraManager.stop();

    sound.playFanfare();
    sound.speak(isGoalAchieved ? "ยอดเยี่ยมมาก ผ่านภารกิจ!" : `หมดเวลา ทำได้ ${reps} ครั้ง`);

    // Save Score & Auto-sync to Supabase Cloud & Google Sheets
    const saveRes = storage.saveExerciseResult({
      exerciseId: this.currentExercise.id,
      reps,
      targetReps: this.currentExercise.targetReps,
      xpEarned,
      durationSeconds: duration,
      accuracy,
      grade,
      snapshot: snapshotDataUrl,
      clipFrames: clipFrames
    });

    // Reload student to get newly accumulated totalXP
    this.currentStudent = storage.getStudent();
    if (this.currentStudent) {
      this.playerXP.textContent = `${this.currentStudent.totalXP || 0} XP`;
    }

    // Populate Summary Modal
    document.getElementById("summary-title").textContent = isGoalAchieved ? "🎉 ภารกิจสำเร็จ!" : "⏱️ หมดเวลา!";
    document.getElementById("summary-reps").textContent = `${reps} ครั้ง`;
    document.getElementById("summary-xp").textContent = `+${xpEarned} XP`;
    document.getElementById("summary-accuracy").textContent = `${accuracy}%`;
    document.getElementById("summary-grade").textContent = `${grade.grade}`;
    document.getElementById("summary-stars").textContent = reps >= this.currentExercise.targetReps ? "⭐⭐⭐" : reps >= Math.floor(this.currentExercise.targetReps / 2) ? "⭐⭐" : "⭐";

    const accumEl = document.getElementById("summary-total-accum-xp");
    if (accumEl) {
      accumEl.textContent = `${this.currentStudent?.totalXP || 0} XP`;
    }

    // Update Progress HUD
    this.updateProgressHUD();

    // Trigger In-Game Notification Toast (Noti แจ้งเตือนเมื่อเสร็จภารกิจ)
    this.showNotificationToast(
      isGoalAchieved ? "🎉 ภารกิจสำเร็จ!" : "⏱️ หมดเวลาการทดสอบ",
      `ผ่านท่า ${this.currentExercise.name} (+${xpEarned} XP) | คะแนนสะสมรวม: ${this.currentStudent?.totalXP || 0} XP`,
      isGoalAchieved ? "🏐" : "⏱️"
    );

    // Show Evidence Snapshot Preview & Mini-Clip Loop
    const snapContainer = document.getElementById("snapshot-container");
    const snapImg = document.getElementById("summary-snapshot-img");
    const clipImg = document.getElementById("summary-clip-img");
    const clipScreenBox = document.getElementById("clip-screen-box");
    const snapScreenBox = document.getElementById("snap-screen-box");
    const snapDownloadBtn = document.getElementById("btn-download-snapshot");
    const snapCloudStatus = document.getElementById("summary-cloud-status");
    const btnToggleClip = document.getElementById("btn-toggle-clip-view");
    const btnToggleSnap = document.getElementById("btn-toggle-snap-view");

    if ((clipFrames && clipFrames.length > 0) || snapshotDataUrl) {
      if (snapContainer) snapContainer.classList.remove("hidden");

      if (snapshotDataUrl && snapImg) {
        snapImg.src = snapshotDataUrl;
      }
      if (snapDownloadBtn && snapshotDataUrl) {
        snapDownloadBtn.href = snapshotDataUrl;
        snapDownloadBtn.download = `KU_Volley_${this.currentStudent?.room || 'Room'}_No${this.currentStudent?.studentNumber || '0'}_${this.currentExercise.id}.jpg`;
      }

      // If we have a mini-clip, start looping it
      if (clipFrames && clipFrames.length >= 4) {
        if (clipScreenBox) clipScreenBox.classList.remove("hidden");
        if (snapScreenBox) snapScreenBox.classList.add("hidden");
        if (btnToggleClip) {
          btnToggleClip.className = "px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold cursor-pointer";
        }
        if (btnToggleSnap) {
          btnToggleSnap.className = "px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-semibold cursor-pointer";
        }
        this.startClipLooper(clipFrames, 1.0);
      } else {
        // Fallback to static snapshot
        if (clipScreenBox) clipScreenBox.classList.add("hidden");
        if (snapScreenBox) snapScreenBox.classList.remove("hidden");
      }

      if (snapCloudStatus) {
        snapCloudStatus.textContent = supabase.isConfigured() ? "⚡ กำลังอัปโหลดขึ้น Supabase Cloud..." : "💾 บันทึกในเครื่องแล้ว";
        snapCloudStatus.className = "text-[10px] text-yellow-400 mt-1";
      }
    } else if (snapContainer) {
      snapContainer.classList.add("hidden");
    }

    // If Supabase sync is running in background, listen for completion
    if (saveRes?.syncPromise) {
      saveRes.syncPromise.then(cloudRes => {
        if (cloudRes?.publicSnapshotUrl) {
          if (snapCloudStatus) {
            snapCloudStatus.textContent = "☁️ ซิงค์คะแนน & รูปขึ้น Supabase สำเร็จ!";
            snapCloudStatus.className = "text-[10px] text-emerald-400 font-bold mt-1";
          }
          if (snapDownloadBtn) {
            snapDownloadBtn.href = cloudRes.publicSnapshotUrl;
          }
        }
      }).catch(err => {
        console.warn("Supabase background upload error:", err);
        if (snapCloudStatus) {
          snapCloudStatus.textContent = "⚠️ ซิงค์คลาวด์ไม่สำเร็จ (บันทึกในเครื่องแล้ว)";
          snapCloudStatus.className = "text-[10px] text-rose-400 mt-1";
        }
      });
    }

    this.modalSummary.classList.remove("hidden");
  }

  // ==========================================
  // MINI-CLIP LOOPER CONTROLLER
  // ==========================================
  startClipLooper(frames, speedMultiplier = 1.0) {
    this.stopClipLooper();
    if (!frames || frames.length === 0) return;

    this.currentClipFrames = frames;
    this.clipFrameIndex = 0;
    this.isClipPlaying = true;
    this.clipSpeedMultiplier = speedMultiplier;

    const clipImg = document.getElementById("summary-clip-img");
    const badgeStatus = document.getElementById("badge-clip-status");
    const playPauseLabel = document.getElementById("label-clip-playpause");
    if (playPauseLabel) playPauseLabel.textContent = "⏸️ หยุด";

    if (badgeStatus) {
      badgeStatus.textContent = `LOOP ● ${speedMultiplier.toFixed(1)}x`;
    }

    const intervalMs = Math.round(125 / speedMultiplier);

    this.clipLoopTimer = setInterval(() => {
      if (!this.isClipPlaying) return;
      if (clipImg && this.currentClipFrames && this.currentClipFrames.length > 0) {
        clipImg.src = this.currentClipFrames[this.clipFrameIndex];
        this.clipFrameIndex = (this.clipFrameIndex + 1) % this.currentClipFrames.length;
      }
    }, intervalMs);
  }

  stopClipLooper() {
    if (this.clipLoopTimer) {
      clearInterval(this.clipLoopTimer);
      this.clipLoopTimer = null;
    }
    this.isClipPlaying = false;
  }

  stopActionCamSession() {
    this.sessionActive = false;
    this.sessionStarted = false;
    if (this.gameTimer) clearInterval(this.gameTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.poseDetector) this.poseDetector.stop();
    if (this.cameraManager) this.cameraManager.stop();

    this.showScreen("game");
    if (this.gameEngine) this.gameEngine.resume();
  }

  // --- IN-GAME NOTIFICATION TOAST ---
  showNotificationToast(title, desc, icon = "🎉") {
    const toast = document.getElementById("app-toast");
    if (!toast) return;
    const titleEl = document.getElementById("toast-title");
    const descEl = document.getElementById("toast-desc");
    const iconEl = document.getElementById("toast-icon");
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (iconEl) iconEl.textContent = icon;

    toast.classList.remove("opacity-0", "-translate-y-4", "pointer-events-none");
    toast.classList.add("opacity-100", "translate-y-0");

    sound.playCoin();

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove("opacity-100", "translate-y-0");
      toast.classList.add("opacity-0", "-translate-y-4", "pointer-events-none");
    }, 4500);
  }

  // --- MINIGAME PROGRESS HUD UPDATE ---
  updateProgressHUD() {
    if (!this.currentStudent) return;
    const summary = storage.getStudentExerciseSummary(this.currentStudent.id);
    const hudText = document.getElementById("progress-hud-text");
    const btnReport = document.getElementById("btn-open-final-report");

    if (hudText) {
      hudText.textContent = `${summary.completedCount} / ${summary.totalCore} ท่า`;
    }

    if (btnReport) {
      if (summary.isAllCompleted) {
        btnReport.className = "px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black font-pixel text-[10px] rounded shadow-lg flex items-center gap-1 font-bold animate-pulse border border-yellow-200";
        btnReport.innerHTML = `<span>🏆</span> ส่งผลครบทุกท่า! (${summary.completedCount}/${summary.totalCore})`;
      } else {
        btnReport.className = "px-2.5 py-1 bg-yellow-500/90 hover:bg-yellow-400 text-black font-pixel text-[10px] rounded shadow flex items-center gap-1 font-bold";
        btnReport.innerHTML = `<span>📝</span> บันทึกคะแนน (${summary.completedCount}/${summary.totalCore})`;
      }
    }
  }

  // --- MODAL: FINAL REPORT & SUMMARY TO TEACHER SOON ---
  openFinalReportModal() {
    if (!this.currentStudent) return;
    if (this.gameEngine) this.gameEngine.pause();

    const summary = storage.getStudentExerciseSummary(this.currentStudent.id);
    const student = this.currentStudent;

    document.getElementById("report-student-name").textContent = student.name;
    const subjectName = this.getSubjectDisplayName(student.subject);
    document.getElementById("report-student-info").textContent = `${student.room} • เลขที่ ${student.studentNumber} • วิชา ${subjectName}`;
    document.getElementById("report-total-xp").textContent = `${student.totalXP || 0} XP`;
    document.getElementById("report-progress-badge").textContent = `ทำแล้ว ${summary.completedCount} / ${summary.totalCore} ท่า`;

    const container = document.getElementById("report-exercises-list");
    const allExercises = getAllExercises();
    const coreIds = ["volleyball_bump", "volleyball_set", "volleyball_serve_under", "volleyball_serve_over"];
    const completedIds = Object.keys(summary.breakdown);
    const exercisesToShow = allExercises.filter(ex => coreIds.includes(ex.id) || completedIds.includes(ex.id));

    container.innerHTML = exercisesToShow.map(ex => {
      const record = summary.breakdown[ex.id];
      if (record) {
        return `
          <div class="flex items-center justify-between p-2 rounded bg-slate-900 border border-emerald-500/40">
            <div class="flex items-center gap-2">
              <span class="text-base">${ex.icon}</span>
              <div>
                <div class="font-bold text-white text-xs">${ex.name}</div>
                <div class="text-[10px] text-gray-400">${record.reps} ครั้ง • ความเป๊ะ ${record.accuracy || 100}%</div>
              </div>
            </div>
            <div class="text-right">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">เกรด ${record.grade || 'A'}</span>
              <div class="text-[10px] text-yellow-300 font-mono mt-0.5">+${record.xpEarned} XP</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-gray-800 opacity-60">
            <div class="flex items-center gap-2">
              <span class="text-base">${ex.icon}</span>
              <div class="font-medium text-gray-400 text-xs">${ex.name}</div>
            </div>
            <span class="text-[10px] text-gray-500 italic">ยังไม่ได้ทดสอบ</span>
          </div>
        `;
      }
    }).join("");

    // Calculate Overall Grade
    const completedRecords = Object.values(summary.breakdown);
    let avgAccuracy = 100;
    if (completedRecords.length > 0) {
      avgAccuracy = Math.round(completedRecords.reduce((sum, r) => sum + (r.accuracy || 100), 0) / completedRecords.length);
    }
    const overallGrade = avgAccuracy >= 88 ? "A+" : avgAccuracy >= 78 ? "A" : avgAccuracy >= 68 ? "B" : "C";
    document.getElementById("report-overall-grade").textContent = summary.completedCount === 0 ? "-" : overallGrade;

    const verdictEl = document.getElementById("report-overall-verdict");
    if (summary.isAllCompleted) {
      verdictEl.textContent = "🎉 ยอดเยี่ยมมาก! ทำครบทุกท่าตามหลักสูตรอย่างสมบูรณ์แบบ";
      verdictEl.className = "text-[10px] text-emerald-300 font-bold";
    } else {
      verdictEl.textContent = `ทำเสร็จแล้ว ${summary.completedCount} จาก ${summary.totalCore} ท่า สามารถฝึกซ้อมต่อได้เรื่อยๆ`;
      verdictEl.className = "text-[10px] text-gray-300";
    }

    const modal = document.getElementById("modal-final-report");
    if (modal) modal.classList.remove("hidden");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
