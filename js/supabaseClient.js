/**
 * supabaseClient.js
 * Supabase client manager using official ES Module CDN (Zero-build).
 * Handles Realtime Leaderboard, Database sync, and Cloud Storage for snapshots.
 */

const STORAGE_KEYS = {
  SUPABASE_URL: "ku_supabase_url",
  SUPABASE_KEY: "ku_supabase_anon_key"
};

export const DEFAULT_SUPABASE_CONFIG = {
  url: "https://qlcxxphorfkivfweaoyv.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsY3h4cGhvcmZraXZmd2Vhb3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzU4MTAsImV4cCI6MjEwNzU1MTgxMH0.G42pQhN4tnv_HCelKBYePfnQQZjn4FyYM2GV6Ay8n_g"
};

class SupabaseManager {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.realtimeChannel = null;
    this.initPromise = this.initClient();
  }

  getCredentials() {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
    const savedKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY);
    if (savedUrl === "OFFLINE") {
      return { url: "", key: "" };
    }
    return {
      url: savedUrl || DEFAULT_SUPABASE_CONFIG.url,
      key: savedKey || DEFAULT_SUPABASE_CONFIG.key
    };
  }

  async loadConfigFromServer() {
    try {
      const res = await fetch("/api/supabase-config");
      if (res.ok) {
        const data = await res.json();
        if (data && data.url && data.key) {
          let cleanUrl = data.url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
          localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, cleanUrl);
          localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, data.key);
          console.log("☁️ Loaded Supabase config from server automatically!");
          return { url: cleanUrl, key: data.key };
        }
      }
    } catch (e) {
      // In offline / standalone mode
    }
    return null;
  }

  async saveCredentials(url, key) {
    let cleanUrl = (url || "").trim();
    if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }
    // Clean trailing /rest/v1 or trailing slashes (e.g. copied from Data API page)
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

    const cleanKey = (key || "").trim();
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, cleanKey);

    // Sync to server so any mobile/tablet connecting gets the config automatically
    try {
      await fetch("/api/supabase-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, key: cleanKey })
      });
      console.log("⚡ Supabase config saved to server for all devices!");
    } catch (err) {
      console.warn("Could not sync config to server (offline):", err);
    }

    this.client = null;
    this.isInitialized = false;
    return this.initClient();
  }

  isConfigured() {
    const { url, key } = this.getCredentials();
    return Boolean(url && key && url.startsWith("https://"));
  }

  async initClient() {
    if (!this.isConfigured()) {
      await this.loadConfigFromServer();
    }
    if (!this.isConfigured()) return null;

    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.48.1");
      const { url, key } = this.getCredentials();
      this.client = createClient(url, key);
      this.isInitialized = true;
      console.log("⚡ Supabase Client initialized successfully!");
      return this.client;
    } catch (err) {
      console.warn("Failed to load Supabase SDK from CDN:", err);
      return null;
    }
  }

  async testConnection(urlOverride, keyOverride) {
    if (urlOverride || keyOverride) {
      await this.saveCredentials(urlOverride || "", keyOverride || "");
    }
    const client = await this.initClient();
    if (!client) throw new Error("ยังไม่ได้ระบุ Supabase URL หรือ Anon Key");

    const { data, error } = await client.from("students").select("count", { count: "exact", head: true });
    if (error) {
      if (error.code === '42P01' || error.message?.includes("students") || error.message?.includes("does not exist")) {
        throw new Error("เชื่อมต่อสำเร็จ แต่ยังไม่ได้รัน SQL Schema (กรุณานำโค้ดใน supabase_schema.sql ไปวางใน SQL Editor แล้วกด Run)");
      }
      throw error;
    }
    return true;
  }

  // Sync / Upsert Student in Supabase
  async upsertStudent(student) {
    if (!this.client) await this.initClient();
    if (!this.client) return null;

    try {
      const payload = {
        id: student.id,
        name: student.name,
        student_number: String(student.studentNumber),
        room: student.room,
        total_xp: student.totalXP || 0,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from("students")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase upsertStudent error:", err);
      return null;
    }
  }

  // Upload Base64 Snapshot to Supabase Storage bucket 'homework-snapshots'
  async uploadSnapshot(base64DataUrl, filename) {
    if (!this.client) await this.initClient();
    if (!this.client || !base64DataUrl) return null;

    try {
      // Convert base64 DataURL to Blob
      const res = await fetch(base64DataUrl);
      const blob = await res.blob();

      const filePath = `snapshots/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.jpg`;

      const { data, error } = await this.client.storage
        .from("homework-snapshots")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: true
        });

      if (error) {
        console.warn("Storage upload error:", error);
        return null;
      }

      // Get Public URL
      const { data: publicUrlData } = this.client.storage
        .from("homework-snapshots")
        .getPublicUrl(filePath);

      return publicUrlData?.publicUrl || null;
    } catch (err) {
      console.warn("Snapshot upload exception:", err);
      return null;
    }
  }

  // Record completed score to Supabase
  async submitScore(record, base64Snapshot) {
    if (!this.client) await this.initClient();
    if (!this.client) return null;

    try {
      // 1. Upload snapshot if present
      let publicSnapshotUrl = null;
      if (base64Snapshot) {
        const fname = `${record.room}_no${record.studentNumber}_${record.exerciseId}`;
        publicSnapshotUrl = await this.uploadSnapshot(base64Snapshot, fname);
      }

      // 2. Insert into 'scores' table
      const scorePayload = {
        student_id: record.studentId,
        student_name: record.studentName,
        student_number: String(record.studentNumber),
        room: record.room,
        exercise_id: record.exerciseId,
        reps: record.reps,
        target_reps: record.targetReps,
        accuracy: record.accuracy || 100,
        grade: record.grade || 'A',
        xp_earned: record.xpEarned,
        duration_seconds: record.durationSeconds,
        snapshot_url: publicSnapshotUrl,
        created_at: new Date().toISOString()
      };

      const { data: scoreData, error: scoreErr } = await this.client
        .from("scores")
        .insert(scorePayload)
        .select()
        .single();

      if (scoreErr) console.warn("Score insert error:", scoreErr);

      // 3. Update total_xp on student record
      const student = {
        id: record.studentId,
        name: record.studentName,
        studentNumber: record.studentNumber,
        room: record.room,
        totalXP: (record.currentTotalXP || 0) + record.xpEarned
      };
      await this.upsertStudent(student);

      return { scoreData, publicSnapshotUrl };
    } catch (err) {
      console.warn("Supabase submitScore failed:", err);
      return null;
    }
  }

  // Fetch Leaderboard from Supabase
  async fetchLeaderboard(roomFilter = "ALL") {
    if (!this.client) await this.initClient();
    if (!this.client) return null;

    try {
      let query = this.client
        .from("students")
        .select("id, name, student_number, room, total_xp")
        .order("total_xp", { ascending: false })
        .limit(50);

      if (roomFilter && roomFilter !== "ALL") {
        query = query.eq("room", roomFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        name: s.name,
        studentNumber: s.student_number,
        room: s.room,
        totalXP: s.total_xp
      }));
    } catch (err) {
      console.warn("Supabase fetchLeaderboard error:", err);
      return null;
    }
  }

  // Fetch all score records for Admin Dashboard
  async fetchAllScores(roomFilter = "ALL") {
    if (!this.client) await this.initClient();
    if (!this.client) return null;

    try {
      let query = this.client
        .from("scores")
        .select("*")
        .order("created_at", { ascending: false });

      if (roomFilter && roomFilter !== "ALL") {
        query = query.eq("room", roomFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase fetchAllScores error:", err);
      return null;
    }
  }

  // Upsert Health & BMI Record in Supabase
  async upsertHealthRecord(healthData) {
    if (!this.client) await this.initClient();
    if (!this.client) return null;

    try {
      const payload = {
        id: healthData.studentId || `${healthData.room}_${healthData.studentNumber}_${healthData.name}`,
        student_id: healthData.studentId || `${healthData.room}_${healthData.studentNumber}_${healthData.name}`,
        name: healthData.name,
        student_number: String(healthData.studentNumber || ''),
        room: healthData.room || 'ห้อง 1',
        gender: healthData.gender || 'male',
        age: parseInt(healthData.age, 10) || 10,
        weight: parseFloat(healthData.weight) || 0,
        height: parseFloat(healthData.height) || 0,
        bmi: parseFloat(healthData.bmi) || 0,
        classification: healthData.classification || '',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from("health_records")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01' || error.message?.includes("health_records")) {
          console.warn("⚠️ Supabase health_records table not found. Please run the SQL schema in Supabase SQL editor.");
        } else {
          console.warn("Supabase upsertHealthRecord error:", error);
        }
        return null;
      }

      console.log("🏥 Successfully synced Health & BMI record to Supabase!", data);
      return data;
    } catch (err) {
      console.warn("Supabase upsertHealthRecord exception:", err);
      return null;
    }
  }

  // Fetch all health records for Admin Dashboard
  async fetchAllHealthRecords(roomFilter = "ALL") {
    if (!this.client) await this.initClient();
    if (!this.client) return null;

    try {
      let query = this.client
        .from("health_records")
        .select("*")
        .order("updated_at", { ascending: false });

      if (roomFilter && roomFilter !== "ALL") {
        query = query.eq("room", roomFilter);
      }

      const { data, error } = await query;
      if (error) {
        if (error.code === '42P01' || error.message?.includes("health_records")) {
          console.warn("⚠️ Supabase health_records table does not exist yet.");
          return null;
        }
        throw error;
      }

      return (data || []).map(r => ({
        id: r.id,
        studentId: r.student_id || r.id,
        name: r.name,
        studentNumber: r.student_number,
        room: r.room,
        gender: r.gender,
        age: r.age,
        weight: r.weight,
        height: r.height,
        bmi: r.bmi,
        classification: r.classification,
        timestamp: new Date(r.updated_at || r.created_at || Date.now()).toLocaleString("th-TH")
      }));
    } catch (err) {
      console.warn("Supabase fetchAllHealthRecords error:", err);
      return null;
    }
  }

  // Realtime subscription for live leaderboard, score updates & health records
  subscribeToLeaderboard(onUpdate) {
    if (!this.client) return;

    if (this.realtimeChannel) {
      this.client.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.client
      .channel("public-db-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        (payload) => {
          console.log("⚡ Realtime students update received!", payload);
          if (onUpdate) onUpdate(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        (payload) => {
          console.log("⚡ Realtime scores update received!", payload);
          if (onUpdate) onUpdate(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "health_records" },
        (payload) => {
          console.log("⚡ Realtime health_records update received!", payload);
          if (onUpdate) onUpdate(payload);
        }
      )
      .subscribe();
  }
}

export const supabase = new SupabaseManager();
