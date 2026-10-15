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
  DAILY_STREAK: "ku_volley_daily_streak"
};

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
  saveExerciseResult({ exerciseId, reps, targetReps, xpEarned, durationSeconds, accuracy, grade, snapshot }) {
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
      timestamp: new Date().toISOString()
    };

    const allRecords = this.getAllScoreRecords();
    allRecords.push(record);
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
    return localStorage.getItem(STORAGE_KEYS.CLOUD_WEBHOOK) || "";
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
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WARDROBE);
      if (data) return JSON.parse(data);
    } catch (e) {}

    // Default starting skin
    return {
      equipped: {
        jerseyColor: "#006837", // KU Green
        headbandColor: "#e53e3e", // Red Headband
        hasKneepads: false,
        hasPet: false
      },
      unlocked: ["jersey_green", "headband_red"]
    };
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
  }
};
