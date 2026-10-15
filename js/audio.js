/**
 * audio.js
 * Retro 8-bit sound effects using Web Audio API synthesis
 * + Voice coaching using Web Speech API (supports Thai speech)
 */

class SoundSystem {
  constructor() {
    this.audioCtx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.isMuted = false;
    this.thaiVoice = null;
    this.lastVoiceTime = 0;

    // Load available voices
    if (this.speechSynth) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  initVoices() {
    if (!this.speechSynth) return;
    const voices = this.speechSynth.getVoices();
    // Prioritize Thai voice
    this.thaiVoice = voices.find(v => v.lang.includes("th") || v.lang.includes("TH")) || null;
  }

  // Speak a coaching message (with throttling so it doesn't overlap excessively)
  speak(text, priority = false) {
    if (this.isMuted || !this.speechSynth) return;
    const now = Date.now();
    // Prevent spamming speech (at least 1.4s between cues unless priority)
    if (!priority && now - this.lastVoiceTime < 1400) return;
    this.lastVoiceTime = now;

    try {
      this.speechSynth.cancel(); // cancel pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.thaiVoice) {
        utterance.voice = this.thaiVoice;
        utterance.lang = "th-TH";
      } else {
        utterance.lang = "th-TH";
      }
      utterance.rate = 1.1; // slightly brisk for sports coaching
      utterance.pitch = 1.0;
      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  // 8-bit Retro Jump sound
  playJump() {
    if (this.isMuted) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  // 8-bit Coin / Rep counted sound
  playCoin() {
    if (this.isMuted) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "square";
    osc2.type = "square";

    osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc1.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);
  }

  // Beep for countdown (3, 2, 1)
  playBeep(isHigh = false) {
    if (this.isMuted) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isHigh ? 880 : 440, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + (isHigh ? 0.3 : 0.15));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isHigh ? 0.3 : 0.15));
  }

  // Warning / Incorrect Form Buzzer
  playBuzzer() {
    if (this.isMuted) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // Victory Fanfare
  playFanfare() {
    if (this.isMuted) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
    });
  }
}

export const sound = new SoundSystem();
