/**
 * storage.js
 * Handles student registration (Name, Student Number, Room 1-20),
 * scores, form accuracy, letter grades, cloud submission (Google Sheets Webhook),
 * wardrobe customizations, and daily streak tracking.
 */

import { supabase } from "./supabaseClient.js";
import { getAllExercises } from "./config/sportsConfig.js";

const STORAGE_KEYS = {
  CURRENT_STUDENT: "ku_volley_student",
  STUDENT_SCORES: "ku_volley_scores",
  LEADERBOARD: "ku_volley_leaderboard",
  CLOUD_WEBHOOK: "ku_google_sheets_webhook",
  WARDROBE: "ku_volley_wardrobe",
  DAILY_STREAK: "ku_volley_daily_streak",
  HEALTH_RECORDS: "ku_volley_health_records"
};

export const DEFAULT_GOOGLE_SHEETS_WEBHOOK = "https://script.google.com/macros/s/AKfycbyqO3IcOOIdHraO0BRWRBmAAal9StUL8NvVrF3Wx0SBGz7FEmdKNXNOS7a5TAZ4Ug4N/exec";

export const storage = {
  // Get current logged in student
  getStudent() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Save current student (accumulates XP with previous sessions for the same student ID)
  saveStudent(student) {
    const id = `${student.room || 'ห้อง 1'}_${student.studentNumber || '1'}_${student.name.trim()}`;
    
    // Check if this student already has existing XP saved
    let currentXP = student.totalXP;
    if (currentXP === undefined || currentXP === null) {
      // 1. Look up in Leaderboard
      const leaderboard = this.getLeaderboard();
      const existingInLeaderboard = leaderboard.find(s => s.id === id);
      if (existingInLeaderboard && typeof existingInLeaderboard.totalXP === 'number') {
        currentXP = existingInLeaderboard.totalXP;
      } else {
        // 2. Sum up all historical score records for this student
        const allRecords = this.getAllScoreRecords();
        const studentScores = allRecords.filter(r => r.studentId === id);
        if (studentScores.length > 0) {
          currentXP = studentScores.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
        } else {
          currentXP = 0;
        }
      }
    }

    const studentData = {
      id,
      name: student.name.trim(),
      studentNumber: String(student.studentNumber || '').trim(),
      room: (student.room || 'ห้อง 1').trim(),
      subject: (student.subject || 'volleyball').trim(),
      totalXP: Math.max(0, currentXP || 0),
      hasBmiXpClaimed: Boolean(student.hasBmiXpClaimed),
      createdAt: student.createdAt || new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(studentData));
    this.updateLeaderboardEntry(studentData);

    // Sync to Supabase in the background
    if (supabase.isConfigured()) {
      supabase.upsertStudent(studentData);
    }

    return studentData;
  },

  // Load server config (Supabase + Google Sheets Webhook)
  async syncConfigFromServer() {
    try {
      const res = await fetch("/api/supabase-config");
      if (res.ok) {
        const data = await res.json();
        if (data && data.webhook) {
          localStorage.setItem(STORAGE_KEYS.CLOUD_WEBHOOK, data.webhook);
        }
      }
    } catch (e) {}
  },

  async syncStudentWithCloud(student) {
    if (!student || !supabase.isConfigured()) return student;
    try {
      const client = await supabase.initClient();
      if (client) {
        const { data } = await client
          .from("students")
          .select("total_xp")
          .eq("id", student.id)
          .single();
        if (data && typeof data.total_xp === "number" && data.total_xp > student.totalXP) {
          student.totalXP = data.total_xp;
          localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(student));
          this.updateLeaderboardEntry(student);
          console.log("☁️ Synced higher accumulated XP from Supabase:", data.total_xp);
        }
      }
    } catch (e) {
      // Offline fallback
    }
    return student;
  },

  // Get list of distinct completed exercises for this student
  getCompletedExerciseIds(studentId) {
    const allRecords = this.getAllScoreRecords();
    const myRecords = allRecords.filter(r => r.studentId === studentId);
    return Array.from(new Set(myRecords.map(r => r.exerciseId)));
  },

  // Get full performance breakdown for each completed exercise
  getStudentExerciseSummary(studentId) {
    const allRecords = this.getAllScoreRecords();
    const myRecords = allRecords.filter(r => r.studentId === studentId);

    const breakdown = {};
    myRecords.forEach(r => {
      if (!breakdown[r.exerciseId] || (r.xpEarned || 0) > (breakdown[r.exerciseId].xpEarned || 0)) {
        breakdown[r.exerciseId] = r;
      }
    });

    // 6 Core Classroom Missions:
    // 1. Underhand Bump, 2. Overhead Set, 3. Underhand Serve, 4. Overhand Serve, 5. Stretching, 6. Warm-up
    const hasBump = Boolean(breakdown["volleyball_bump"]);
    const hasSet = Boolean(breakdown["volleyball_set"]);
    const hasServeUnder = Boolean(breakdown["volleyball_serve_under"]);
    const hasServeOver = Boolean(breakdown["volleyball_serve_over"]);
    const hasStretching = Object.keys(breakdown).some(id => id.startsWith("stretch_") || id === "squat_warmup");
    const hasWarmup = Object.keys(breakdown).some(id => id.startsWith("dynamic_") || id === "jumping_jacks" || id.includes("warmup"));

    const coreMissions = [hasBump, hasSet, hasServeUnder, hasServeOver, hasStretching, hasWarmup];
    const completedCoreCount = coreMissions.filter(Boolean).length;
    const isAllCompleted = completedCoreCount >= 6;

    return {
      breakdown,
      completedCount: completedCoreCount,
      totalCore: 6,
      isAllCompleted,
      allAttemptsCount: myRecords.length,
      hasStretching,
      hasWarmup
    };
  },

  clearStudent() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
  },

  // Record a completed exercise session
  saveExerciseResult({ exerciseId, reps, targetReps, xpEarned, durationSeconds, accuracy, grade, snapshot, clipFrames }) {
    const student = this.getStudent();
    if (!student) return null;

    const record = {
      studentId: student.id,
      studentNumber: student.studentNumber,
      studentName: student.name,
      room: student.room,
      subject: student.subject || 'volleyball',
      exerciseId,
      reps,
      targetReps,
      xpEarned,
      durationSeconds,
      accuracy: accuracy || 100,
      grade: grade?.grade || 'A',
      snapshot: snapshot || null,
      clipFrames: (clipFrames && clipFrames.length > 0) ? clipFrames : null,
      timestamp: new Date().toISOString()
    };

    const allRecords = this.getAllScoreRecords();
    allRecords.push(record);
    
    // Prune clipFrames from records older than 15 attempts to prevent exceeding localStorage quota
    if (allRecords.length > 15) {
      for (let i = 0; i < allRecords.length - 15; i++) {
        if (allRecords[i].clipFrames) delete allRecords[i].clipFrames;
      }
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_SCORES, JSON.stringify(allRecords));

    // Update Student Total XP
    student.totalXP = (student.totalXP || 0) + xpEarned;
    this.saveStudent(student);

    // Auto-sync to Supabase Cloud & Storage
    let syncPromise = null;
    if (supabase.isConfigured()) {
      syncPromise = supabase.submitScore({ ...record, currentTotalXP: student.totalXP - xpEarned }, snapshot);
    }

    // Auto-sync to Google Sheets Cloud if webhook is configured
    this.submitRecordToCloud(record);

    return { record, syncPromise };
  },

  getAllScoreRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENT_SCORES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Leaderboard operations
  getLeaderboard() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (!data) {
        return this.getSeededLeaderboard();
      }
      return JSON.parse(data);
    } catch (e) {
      return this.getSeededLeaderboard();
    }
  },

  async refreshLeaderboardFromSupabase(roomFilter = "ALL") {
    if (supabase.isConfigured()) {
      const onlineList = await supabase.fetchLeaderboard(roomFilter);
      if (onlineList && onlineList.length > 0) {
        localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(onlineList));
        return onlineList;
      }
    }
    return this.getLeaderboard();
  },

  updateLeaderboardEntry(student) {
    const list = this.getLeaderboard();
    const index = list.findIndex(item => item.id === student.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...student };
    } else {
      list.push(student);
    }
    list.sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0));
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(list));
  },

  getSeededLeaderboard() {
    const seeded = [
      { id: "ห้อง 1_12_น้องพลอย", name: "ด.ญ. พลอย ยอดตบ", studentNumber: "12", room: "ห้อง 1", totalXP: 420 },
      { id: "ห้อง 1_5_น้องวิน", name: "ด.ช. วิน เซ็ตบอลไว", studentNumber: "5", room: "ห้อง 1", totalXP: 360 },
      { id: "ห้อง 2_8_น้องเบส", name: "ด.ช. เบส ขุดบอลเก่ง", studentNumber: "8", room: "ห้อง 2", totalXP: 310 },
      { id: "ห้อง 2_19_น้องมายด์", name: "ด.ญ. มายด์ เสิร์ฟแม่น", studentNumber: "19", room: "ห้อง 2", totalXP: 280 }
    ];
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(seeded));
    return seeded;
  },

  // ==========================================
  // GOOGLE SHEETS CLOUD SYNC
  // ==========================================
  getCloudWebhook() {
    const saved = localStorage.getItem(STORAGE_KEYS.CLOUD_WEBHOOK);
    if (saved === "OFFLINE") return "";
    return saved || DEFAULT_GOOGLE_SHEETS_WEBHOOK;
  },

  saveCloudWebhook(url) {
    localStorage.setItem(STORAGE_KEYS.CLOUD_WEBHOOK, url.trim());
  },

  async submitRecordToCloud(record) {
    const webhookUrl = this.getCloudWebhook();
    if (!webhookUrl) return false;

    try {
      const payload = {
        timestamp: record.timestamp,
        room: record.room,
        studentNumber: record.studentNumber,
        studentName: record.studentName,
        exerciseId: record.exerciseId,
        reps: record.reps,
        targetReps: record.targetReps,
        xpEarned: record.xpEarned,
        accuracy: `${record.accuracy}%`,
        grade: record.grade,
        durationSeconds: record.durationSeconds
      };

      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      console.log("☁️ Successfully sent record to Google Sheets Cloud!");
      return true;
    } catch (err) {
      console.warn("Cloud sync failed (will retry locally):", err);
      return false;
    }
  },

  // ==========================================
  // WARDROBE & SKINS CUSTOMIZATION
  // ==========================================
  getWardrobe() {
    const defaultWardrobe = {
      equipped: {
        jerseyColor: "#006837", // KU Green
        headbandColor: "#e53e3e", // Red Headband
        headwear: "headband", // "headband", "witch_hat", "astronaut", "bear_hood", "crown"
        outfit: "jersey", // "jersey", "witch_robe", "astronaut", "bear_onesie", "champion_gold"
        hasKneepads: false,
        hasPet: false,
        petType: "volleyball"
      },
      unlocked: ["jersey_green", "headband_red", "witch_hat", "astronaut", "bear_hood", "crown"]
    };

    try {
      const data = localStorage.getItem(STORAGE_KEYS.WARDROBE);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          equipped: { ...defaultWardrobe.equipped, ...(parsed.equipped || {}) },
          unlocked: parsed.unlocked || defaultWardrobe.unlocked
        };
      }
    } catch (e) {}

    return defaultWardrobe;
  },

  saveWardrobe(wardrobe) {
    localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(wardrobe));
  },

  // ==========================================
  // DAILY STREAK TRACKING
  // ==========================================
  getStreakInfo() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_STREAK);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return { streak: 1, lastDate: new Date().toISOString().slice(0, 10) };
  },

  updateDailyStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const info = this.getStreakInfo();

    if (info.lastDate === today) {
      return info;
    }

    const last = new Date(info.lastDate);
    const current = new Date(today);
    const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      info.streak += 1;
    } else {
      info.streak = 1;
    }
    info.lastDate = today;
    localStorage.setItem(STORAGE_KEYS.DAILY_STREAK, JSON.stringify(info));
    return info;
  },

  // Export all scores to CSV format for teacher grading (UTF-8 with BOM)
  async exportScoresToCSV() {
    let records = [];
    if (supabase.isConfigured()) {
      try {
        const cloudScores = await supabase.fetchAllScores("ALL");
        if (cloudScores && cloudScores.length > 0) {
          records = cloudScores.map(c => ({
            timestamp: c.created_at,
            room: c.room,
            studentNumber: c.student_number,
            studentName: c.student_name,
            exerciseId: c.exercise_id,
            reps: c.reps,
            targetReps: c.target_reps,
            accuracy: c.accuracy,
            grade: c.grade,
            xpEarned: c.xp_earned,
            durationSeconds: c.duration_seconds,
            snapshotUrl: c.snapshot_url
          }));
        }
      } catch (err) {
        console.warn("Supabase CSV fetch fallback to local:", err);
      }
    }

    if (records.length === 0) {
      records = this.getAllScoreRecords();
    }

    if (records.length === 0) {
      alert("ยังไม่มีข้อมูลคะแนนให้นำออก");
      return null;
    }

    const headers = [
      "วันเวลาที่ทดสอบ",
      "ห้อง",
      "เลขที่",
      "ชื่อ-นามสกุล",
      "รหัสท่าทาง",
      "จำนวนครั้งที่ทำได้",
      "เป้าหมาย",
      "ความเป๊ะของฟอร์ม (%)",
      "เกรด",
      "คะแนน XP ที่ได้",
      "เวลาที่ใช้ (วินาที)",
      "ลิงก์รูปถ่ายหลักฐาน"
    ];

    const rows = records.map(r => [
      r.timestamp,
      `"${r.room || '-'}"`,
      `"${r.studentNumber || '-'}"`,
      `"${r.studentName || '-'}"`,
      `"${r.exerciseId}"`,
      r.reps,
      r.targetReps,
      `"${r.accuracy || 100}%"`,
      `"${r.grade || 'A'}"`,
      r.xpEarned,
      r.durationSeconds,
      `"${r.snapshotUrl || (r.snapshot ? 'มีภาพในเครื่อง' : '-')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KU_PE_Volleyball_Scores_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  },

  // ==========================================
  // STUDENT HEALTH & BMI ASSESSMENT (แผ่นงานที่ 2)
  // ==========================================
  calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  },

  getBMICategory(bmi) {
    if (!bmi || bmi <= 0) return { category: "ไม่ระบุ", color: "text-slate-400", badge: "bg-slate-700 text-slate-300", advice: "-" };
    if (bmi < 18.5) {
      return {
        category: "ผอม (น้ำหนักน้อยกว่าเกณฑ์)",
        color: "text-sky-400",
        badge: "bg-sky-500/20 text-sky-400 border border-sky-500/40",
        advice: "ควรรับประทานอาหารให้ครบ 5 หมู่ และเพิ่มพลังงานให้เพียงพอต่อการเจริญเติบโต",
        zone: "blue"
      };
    } else if (bmi <= 22.9) {
      return {
        category: "สมส่วน (น้ำหนักตามเกณฑ์มาตรฐาน)",
        color: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
        advice: "สุขภาพดีมาก! ควรรักษาระดับกิจกรรมทางกายและการรับประทานอาหารที่ดีนี้ไว้ต่อเนื่อง",
        zone: "green"
      };
    } else if (bmi <= 24.9) {
      return {
        category: "ท้วม (น้ำหนักเกินเกณฑ์เล็กน้อย)",
        color: "text-amber-400",
        badge: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
        advice: "ควรเพิ่มกิจกรรมเคลื่อนไหวร่างกาย เล่นกีฬาอย่างน้อย 45-60 นาทีต่อวัน และลดของทอดของหวาน",
        zone: "yellow"
      };
    } else if (bmi <= 29.9) {
      return {
        category: "เริ่มอ้วน (ภาวะอ้วนระดับ 1)",
        color: "text-orange-400",
        badge: "bg-orange-500/20 text-orange-400 border border-orange-500/40",
        advice: "ควรควบคุมปริมาณน้ำตาล ขนมกรุบกรอบ และร่วมกิจกรรมกีฬาหรือแอโรบิกเป็นประจำ",
        zone: "orange"
      };
    } else {
      return {
        category: "อ้วนมาก (ภาวะอ้วนระดับ 2)",
        color: "text-rose-400",
        badge: "bg-rose-500/20 text-rose-400 border border-rose-500/40",
        advice: "ควรปรึกษาครูพละและผู้ปกครองเพื่อวางแผนโภชนาการ และออกกำลังกายแบบไม่กระแทกข้อต่อ เช่น ว่ายน้ำหรือเดินเร็ว",
        zone: "red"
      };
    }
  },

  getAllHealthRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
      if (data) {
        const records = JSON.parse(data);
        if (records.length > 0) return records;
      }
      return this.getSeededHealthRecords();
    } catch (e) {
      return this.getSeededHealthRecords();
    }
  },

  getSeededHealthRecords() {
    const seeded = [
      {
        id: "ห้อง 1_12_ด.ญ. พลอย ยอดตบ",
        studentId: "ห้อง 1_12_ด.ญ. พลอย ยอดตบ",
        room: "ห้อง 1",
        studentNumber: "12",
        name: "ด.ญ. พลอย ยอดตบ",
        gender: "female",
        age: 10,
        weight: 32.5,
        height: 138,
        bmi: 17.1,
        classification: "ผอม (น้ำหนักน้อยกว่าเกณฑ์)",
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString("th-TH")
      },
      {
        id: "ห้อง 1_5_ด.ช. วิน เซ็ตบอลไว",
        studentId: "ห้อง 1_5_ด.ช. วิน เซ็ตบอลไว",
        room: "ห้อง 1",
        studentNumber: "5",
        name: "ด.ช. วิน เซ็ตบอลไว",
        gender: "male",
        age: 11,
        weight: 38.0,
        height: 142,
        bmi: 18.8,
        classification: "สมส่วน (น้ำหนักตามเกณฑ์มาตรฐาน)",
        timestamp: new Date(Date.now() - 3600000 * 5).toLocaleString("th-TH")
      },
      {
        id: "ห้อง 2_8_ด.ช. เบส ขุดบอลเก่ง",
        studentId: "ห้อง 2_8_ด.ช. เบส ขุดบอลเก่ง",
        room: "ห้อง 2",
        studentNumber: "8",
        name: "ด.ช. เบส ขุดบอลเก่ง",
        gender: "male",
        age: 10,
        weight: 45.0,
        height: 139,
        bmi: 23.3,
        classification: "ท้วม (น้ำหนักเกินเกณฑ์เล็กน้อย)",
        timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString("th-TH")
      },
      {
        id: "ห้อง 2_19_ด.ญ. มายด์ เสิร์ฟแม่น",
        studentId: "ห้อง 2_19_ด.ญ. มายด์ เสิร์ฟแม่น",
        room: "ห้อง 2",
        studentNumber: "19",
        name: "ด.ญ. มายด์ เสิร์ฟแม่น",
        gender: "female",
        age: 11,
        weight: 39.5,
        height: 144,
        bmi: 19.0,
        classification: "สมส่วน (น้ำหนักตามเกณฑ์มาตรฐาน)",
        timestamp: new Date(Date.now() - 3600000 * 48).toLocaleString("th-TH")
      }
    ];
    localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(seeded));
    return seeded;
  },

  getHealthRecordByStudent(studentId) {
    const all = this.getAllHealthRecords();
    return all.find(r => r.studentId === studentId || r.id === studentId);
  },

  hasStudentClaimedBmiXP(studentId) {
    if (!studentId) return false;
    const student = this.getStudent();
    if (student && (student.id === studentId || studentId.includes(student.name)) && student.hasBmiXpClaimed) {
      return true;
    }
    // Check if this student already has a non-dummy health record saved
    const existing = this.getHealthRecordByStudent(studentId);
    if (existing && !["ด.ญ. พลอย", "ด.ช. วิน", "ด.ช. เบส", "ด.ญ. มายด์"].some(n => existing.id?.includes(n))) {
      return true;
    }
    return false;
  },

  saveHealthRecord(data) {
    const studentId = `${data.room || 'ห้อง 1'}_${data.studentNumber || '1'}_${data.name.trim()}`;
    const weight = parseFloat(data.weight);
    const height = parseFloat(data.height);
    const bmi = this.calculateBMI(weight, height);
    const info = this.getBMICategory(bmi);

    const record = {
      id: studentId,
      studentId: studentId,
      name: data.name.trim(),
      studentNumber: String(data.studentNumber || '').trim(),
      room: (data.room || 'ห้อง 1').trim(),
      gender: data.gender || 'male',
      age: parseInt(data.age, 10) || 10,
      weight: weight,
      height: height,
      bmi: bmi,
      classification: info.category,
      timestamp: new Date().toLocaleString("th-TH")
    };

    const all = this.getAllHealthRecords();
    const idx = all.findIndex(r => r.studentId === studentId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...record };
    } else {
      all.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(all));

    // 1. Auto-sync to Supabase Cloud
    let supabasePromise = null;
    if (supabase.isConfigured()) {
      supabasePromise = supabase.upsertHealthRecord(record);
    }

    // 2. Auto-sync to Local Server (for offline local WiFi testing)
    this.syncHealthRecordToServer(record);

    // 3. Submit to Google Sheets Cloud (Sheet 2)
    this.submitHealthRecordToCloud(record);

    record.supabasePromise = supabasePromise;
    return record;
  },

  async syncHealthRecordToServer(record) {
    try {
      await fetch("/api/health-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
    } catch (e) {
      // offline / standalone
    }
  },

  async syncHealthRecordsFromSupabase(roomFilter = "ALL") {
    let cloudRecords = null;

    // 1. Try Supabase Cloud
    if (supabase.isConfigured()) {
      try {
        cloudRecords = await supabase.fetchAllHealthRecords(roomFilter);
      } catch (err) {
        console.warn("Supabase health sync error:", err);
      }
    }

    // 2. Try Local Server fallback if Supabase returned nothing
    if (!cloudRecords || cloudRecords.length === 0) {
      try {
        const res = await fetch("/api/health-records");
        if (res.ok) {
          const srv = await res.json();
          if (Array.isArray(srv) && srv.length > 0) {
            cloudRecords = srv;
          }
        }
      } catch (e) {}
    }

    // 3. If online/cloud records exist, merge and update local cache
    if (cloudRecords && Array.isArray(cloudRecords) && cloudRecords.length > 0) {
      const localRecords = this.getAllHealthRecords();
      // Filter out demo seeded records if we have real student records
      const isSeeded = (id) => ["ด.ญ. พลอย", "ด.ช. วิน", "ด.ช. เบส", "ด.ญ. มายด์"].some(n => id?.includes(n));
      const cleanLocal = localRecords.filter(r => !isSeeded(r.id));

      const mergedMap = new Map();
      cleanLocal.forEach(r => mergedMap.set(r.studentId, r));
      cloudRecords.forEach(r => mergedMap.set(r.studentId, r));
      const mergedList = Array.from(mergedMap.values());

      // If we have any real student records, save them and remove seeders
      if (mergedList.length > 0) {
        localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(mergedList));
        return roomFilter === "ALL" ? mergedList : mergedList.filter(r => r.room === roomFilter);
      }
    }

    const currentLocal = this.getAllHealthRecords();
    return roomFilter === "ALL" ? currentLocal : currentLocal.filter(r => r.room === roomFilter);
  },

  async submitHealthRecordToCloud(record) {
    const webhookUrl = this.getCloudWebhook();
    if (!webhookUrl) return false;

    try {
      const payload = {
        type: "health_bmi", // Indicator for Google Apps Script to write into Sheet 2
        timestamp: record.timestamp,
        room: record.room,
        studentNumber: record.studentNumber,
        studentName: record.name,
        gender: record.gender === "female" ? "หญิง" : "ชาย",
        age: record.age,
        weight: record.weight,
        height: record.height,
        bmi: record.bmi,
        classification: record.classification
      };

      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      console.log("🏥 Successfully sent Health & BMI record to Google Sheets (Tab 2)!");
      return true;
    } catch (err) {
      console.warn("Health cloud sync failed:", err);
      return false;
    }
  },

  // ==========================================
  // BULK SYNC TO GOOGLE SHEETS (ONE-CLICK EXPORT)
  // ==========================================
  async syncAllHealthRecordsToGoogleSheets(roomFilter = "ALL", onProgress = null) {
    const webhookUrl = this.getCloudWebhook();
    if (!webhookUrl) {
      throw new Error("ยังไม่ได้ระบุ Google Sheets Webhook URL");
    }

    // 1. Fetch fresh records from Supabase / server cache
    let records = await this.syncHealthRecordsFromSupabase(roomFilter);
    if (!records || records.length === 0) {
      records = this.getAllHealthRecords();
      if (roomFilter !== "ALL") {
        records = records.filter(r => r.room === roomFilter);
      }
    }

    // 2. Filter out demo seeded records if real records exist
    const isSeeded = (id) => ["ด.ญ. พลอย", "ด.ช. วิน", "ด.ช. เบส", "ด.ญ. มายด์"].some(n => id?.includes(n));
    const realRecords = records.filter(r => !isSeeded(r.id));
    const finalRecords = realRecords.length > 0 ? realRecords : records;

    if (finalRecords.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    // Sort by room, then student number (asc)
    finalRecords.sort((a, b) => {
      const roomComp = (a.room || "").localeCompare(b.room || "");
      if (roomComp !== 0) return roomComp;
      return (parseInt(a.studentNumber, 10) || 0) - (parseInt(b.studentNumber, 10) || 0);
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < finalRecords.length; i++) {
      const r = finalRecords[i];
      if (onProgress) {
        onProgress(i + 1, finalRecords.length, r);
      }

      const payload = {
        type: "health_bmi",
        timestamp: r.timestamp || new Date().toLocaleString("th-TH"),
        room: r.room || "-",
        studentNumber: r.studentNumber || "-",
        studentName: r.name || r.studentName || "-",
        gender: r.gender === "female" ? "หญิง" : (r.gender === "male" ? "ชาย" : (r.gender || "-")),
        age: r.age || 10,
        weight: r.weight,
        height: r.height,
        bmi: r.bmi,
        classification: r.classification
      };

      try {
        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
        successCount++;
      } catch (err) {
        console.warn("Failed sending health record to Google Sheets:", r.name, err);
        failCount++;
      }

      // Small throttle between requests (120ms) to ensure smooth delivery
      if (i < finalRecords.length - 1) {
        await new Promise(res => setTimeout(res, 120));
      }
    }

    return { total: finalRecords.length, success: successCount, failed: failCount };
  },

  async syncAllScoresToGoogleSheets(roomFilter = "ALL", onProgress = null) {
    const webhookUrl = this.getCloudWebhook();
    if (!webhookUrl) {
      throw new Error("ยังไม่ได้ระบุ Google Sheets Webhook URL");
    }

    let records = [];
    if (supabase.isConfigured()) {
      try {
        const cloudScores = await supabase.fetchAllScores(roomFilter);
        if (cloudScores && cloudScores.length > 0) {
          records = cloudScores.map(c => ({
            timestamp: c.created_at,
            room: c.room,
            studentNumber: c.student_number,
            studentName: c.student_name,
            exerciseId: c.exercise_id,
            reps: c.reps,
            targetReps: c.target_reps,
            accuracy: c.accuracy,
            grade: c.grade,
            xpEarned: c.xp_earned,
            durationSeconds: c.duration_seconds,
            snapshotUrl: c.snapshot_url
          }));
        }
      } catch (err) {
        console.warn("Supabase fetch fallback:", err);
      }
    }

    if (records.length === 0) {
      records = this.getAllScoreRecords();
      if (roomFilter !== "ALL") {
        records = records.filter(r => r.room === roomFilter);
      }
    }

    if (records.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (onProgress) {
        onProgress(i + 1, records.length, r);
      }

      const payload = {
        type: "score",
        timestamp: r.timestamp || new Date().toLocaleString("th-TH"),
        room: r.room || "-",
        studentNumber: r.studentNumber || "-",
        studentName: r.studentName || "-",
        exerciseId: r.exerciseId || "-",
        reps: r.reps || 0,
        targetReps: r.targetReps || 0,
        accuracy: r.accuracy || 100,
        grade: r.grade || "A",
        xpEarned: r.xpEarned || 0,
        durationSeconds: r.durationSeconds || 0,
        snapshotUrl: r.snapshotUrl || ""
      };

      try {
        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
        successCount++;
      } catch (err) {
        console.warn("Failed sending score record to Google Sheets:", r.studentName, err);
        failCount++;
      }

      if (i < records.length - 1) {
        await new Promise(res => setTimeout(res, 120));
      }
    }

    return { total: records.length, success: successCount, failed: failCount };
  }
};
