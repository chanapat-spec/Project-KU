/**
 * multiplayer.js
 * Supabase Realtime Presence & Broadcast Manager for PECLASS Quest.
 * Features:
 * - Room-isolated multiplayer channels (e.g. pe-room-1)
 * - 10 Hz throttled position broadcast with 60 FPS client-side LERP interpolation
 * - Live classmate avatars with custom Chibi wardrobe & floating name tags
 * - Automatic pause during Action Cam minigames to save mobile battery/CPU
 * - Offline / standalone fallback with simulated classmate avatars on tree stumps
 */

import { supabase } from "../supabaseClient.js";

export class MultiplayerManager {
  constructor() {
    this.channel = null;
    this.currentStudent = null;
    this.peers = new Map(); // id -> Peer state
    this.lastBroadcastTime = 0;
    this.broadcastIntervalMs = 100; // 10 FPS broadcast is optimal for bandwidth & battery
    this.isPaused = false;
    this.isConnected = false;
    this.onlineCount = 1;
    this.onPeerCountChange = null;

    // Offline / Demo classmates when not connected to Supabase
    this.useOfflineSimulation = false;
  }

  async init(student) {
    if (!student) return;
    this.currentStudent = student;
    this.cleanup();

    if (!supabase.isConfigured()) {
      console.log("🎮 Supabase offline: Initializing simulated classmates for campfire lobby.");
      this.initSimulatedClassmates();
      return;
    }

    try {
      const client = await supabase.initClient();
      if (!client) {
        this.initSimulatedClassmates();
        return;
      }

      // Clean room channel name (e.g. "ห้อง 1" -> "pe-room-1")
      const safeRoom = (student.room || "room-1")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const channelName = `pe-room-${safeRoom}`;

      this.channel = client.channel(channelName, {
        config: {
          presence: { key: student.id || student.name },
          broadcast: { ack: false, self: false }
        }
      });

      // 1. Listen for Live Position Broadcasts
      this.channel.on("broadcast", { event: "pos" }, ({ payload }) => {
        if (!payload || payload.id === student.id || this.isPaused) return;
        this.updatePeer(payload);
      });

      // 2. Track Presence (Who is online in the room)
      this.channel.on("presence", { event: "sync" }, () => {
        const state = this.channel.presenceState();
        this.handlePresenceSync(state);
      });

      this.channel.on("presence", { event: "leave" }, ({ key }) => {
        if (key) this.peers.delete(key);
        this.notifyPeerCount();
      });

      // Subscribe to channel
      await this.channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          this.isConnected = true;
          await this.channel.track({
            id: student.id,
            name: student.name,
            studentNumber: student.studentNumber,
            room: student.room,
            onlineAt: new Date().toISOString()
          });
          console.log(`⚡ Connected to Multiplayer room: ${channelName}`);
        } else {
          this.initSimulatedClassmates();
        }
      });
    } catch (err) {
      console.warn("Multiplayer init error, falling back to simulated peers:", err);
      this.initSimulatedClassmates();
    }
  }

  handlePresenceSync(presenceState) {
    let count = 1; // self
    Object.keys(presenceState).forEach((key) => {
      const presenceList = presenceState[key];
      if (presenceList && presenceList[0]) {
        const p = presenceList[0];
        if (p.id !== this.currentStudent?.id) {
          count++;
          if (!this.peers.has(p.id)) {
            // Assign a stump seat or initial position
            this.peers.set(p.id, {
              id: p.id,
              name: p.name || "เพื่อนร่วมห้อง",
              studentNumber: p.studentNumber || "",
              room: p.room || "",
              x: 180 + (Math.random() * 40 - 20),
              y: 180 + (Math.random() * 40 - 20),
              targetX: 180,
              targetY: 180,
              direction: "down",
              isMoving: false,
              animFrame: 0,
              wardrobe: {
                jerseyColor: "#006837",
                headwear: "headband",
                outfit: "jersey"
              },
              lastSeen: Date.now()
            });
          }
        }
      }
    });

    this.onlineCount = Math.max(1, count);
    this.notifyPeerCount();
  }

  notifyPeerCount() {
    if (this.onPeerCountChange) {
      this.onPeerCountChange(this.onlineCount);
    }
  }

  updatePeer(data) {
    let peer = this.peers.get(data.id);
    if (!peer) {
      peer = {
        id: data.id,
        name: data.name,
        studentNumber: data.studentNumber,
        room: data.room,
        x: data.x,
        y: data.y,
        targetX: data.x,
        targetY: data.y,
        direction: data.direction || "down",
        isMoving: Boolean(data.isMoving),
        animFrame: data.animFrame || 0,
        wardrobe: data.wardrobe || {},
        lastSeen: Date.now()
      };
      this.peers.set(data.id, peer);
    } else {
      peer.name = data.name || peer.name;
      peer.studentNumber = data.studentNumber || peer.studentNumber;
      peer.targetX = data.x;
      peer.targetY = data.y;
      peer.direction = data.direction || peer.direction;
      peer.isMoving = Boolean(data.isMoving);
      peer.animFrame = data.animFrame || 0;
      if (data.wardrobe) peer.wardrobe = data.wardrobe;
      peer.lastSeen = Date.now();
    }
  }

  // Broadcast player position to classmates (throttled to 10 FPS)
  sendPlayerState(player, force = false) {
    if (!this.channel || !this.isConnected || this.isPaused || !this.currentStudent) return;

    const now = Date.now();
    if (!force && now - this.lastBroadcastTime < this.broadcastIntervalMs) {
      return;
    }
    this.lastBroadcastTime = now;

    const payload = {
      id: this.currentStudent.id,
      name: this.currentStudent.name,
      studentNumber: this.currentStudent.studentNumber,
      room: this.currentStudent.room,
      x: Math.round(player.x),
      y: Math.round(player.y),
      direction: player.direction,
      isMoving: player.isMoving,
      animFrame: player.animFrame,
      wardrobe: {
        jerseyColor: player.jerseyColor,
        headbandColor: player.headbandColor,
        headwear: player.headwear || "headband",
        outfit: player.outfit || "jersey",
        hasPet: player.hasPet
      }
    };

    this.channel.send({
      type: "broadcast",
      event: "pos",
      payload
    }).catch(() => {});
  }

  // Smooth interpolation update loop (runs at 60 FPS on canvas)
  update() {
    const now = Date.now();

    // 1. Update live peers with LERP smoothing
    for (const [id, peer] of this.peers.entries()) {
      if (this.useOfflineSimulation) {
        // Simulated wander / idle for demo bots
        if (peer.isMoving) {
          peer.x += (peer.targetX - peer.x) * 0.05;
          peer.y += (peer.targetY - peer.y) * 0.05;
          if (Math.hypot(peer.targetX - peer.x, peer.targetY - peer.y) < 2) {
            peer.isMoving = false;
          }
        } else if (Math.random() < 0.005) {
          // Occasional small walk
          peer.targetX = peer.baseX + (Math.random() * 30 - 15);
          peer.targetY = peer.baseY + (Math.random() * 20 - 10);
          peer.isMoving = true;
          peer.direction = peer.targetX > peer.x ? "right" : "left";
        }
      } else {
        // Real online peer LERP
        const dx = peer.targetX - peer.x;
        const dy = peer.targetY - peer.y;
        peer.x += dx * 0.28;
        peer.y += dy * 0.28;

        // Prune peers inactive for > 15s
        if (now - peer.lastSeen > 15000) {
          this.peers.delete(id);
          this.notifyPeerCount();
        }
      }
    }
  }

  // Pause multiplayer when entering Action Cam to save mobile battery and avoid CPU lag
  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  cleanup() {
    if (this.channel) {
      try {
        this.channel.unsubscribe();
      } catch (e) {}
      this.channel = null;
    }
    this.peers.clear();
    this.isConnected = false;
  }

  // Fallback demo classmates sitting on stumps or cheering near court
  initSimulatedClassmates() {
    this.useOfflineSimulation = true;
    this.peers.clear();

    const seededBots = [
      {
        id: "bot_ploy",
        name: "ด.ญ. พลอย",
        studentNumber: "12",
        room: this.currentStudent?.room || "ห้อง 1",
        baseX: 110,
        baseY: 155,
        x: 110,
        y: 155,
        direction: "down",
        wardrobe: { jerseyColor: "#7C3AED", headwear: "witch_hat", outfit: "witch_robe", hasPet: true }
      },
      {
        id: "bot_win",
        name: "ด.ช. วิน",
        studentNumber: "5",
        room: this.currentStudent?.room || "ห้อง 1",
        baseX: 180,
        baseY: 155,
        x: 180,
        y: 155,
        direction: "down",
        wardrobe: { jerseyColor: "#0284C7", headwear: "astronaut", outfit: "astronaut", hasPet: false }
      },
      {
        id: "bot_best",
        name: "ด.ช. เบส",
        studentNumber: "8",
        room: this.currentStudent?.room || "ห้อง 1",
        baseX: 250,
        baseY: 155,
        x: 250,
        y: 155,
        direction: "down",
        wardrobe: { jerseyColor: "#EA580C", headwear: "bear_hood", outfit: "bear_onesie", hasPet: false }
      }
    ];

    seededBots.forEach(b => {
      this.peers.set(b.id, {
        ...b,
        targetX: b.x,
        targetY: b.y,
        isMoving: false,
        animFrame: 0,
        lastSeen: Date.now()
      });
    });

    this.onlineCount = seededBots.length + 1;
    this.notifyPeerCount();
  }
}

export const multiplayer = new MultiplayerManager();
