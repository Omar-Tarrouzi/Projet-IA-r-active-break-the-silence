// Acoustic Noise Analyzer & Classifier:
// - Sharp transient pulse (< 0.25s) => MID Cone Blast (👏 Clap)
// - Sustained sharp noise (>= 0.35s) => HIGH Piercing Laser Beam (🗣️/🌬️ Long Noise)

class ClapDetector {
  constructor(options = {}) {
    this.threshold = options.threshold ?? 0.18; // Noise amplitude threshold
    this.onsetDelta = options.onsetDelta ?? 0.08; // Spike jump
    this.sustainedMinTime = options.sustainedMinTime || 0.35; // Seconds required for long noise
    this.maxSustainTime = 1.0; // Max charge duration
    this.cooldownDuration = 0.25;

    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.dataArray = null;

    this.isListening = false;
    this.hasPermission = false;
    this.permissionDenied = false;

    this.currentLevel = 0; // Smoothed volume [0, 1]
    this.rollingAverage = 0;
    this.cooldownTimer = 0;

    // Sustained tracking state
    this.isNoiseActive = false;
    this.noiseTimer = 0;
    this.burstPeak = 0;
    this.isSustainedMode = false;

    // Callbacks
    this.onClapCallback = null; // Triggers MID attack
    this.onSustainedStartCallback = null; // Starts HIGH charge
    this.onSustainedProgressCallback = null; // Updates HIGH charge
    this.onSustainedReleaseCallback = null; // Fires HIGH beam
  }

  async start() {
    if (this.isListening) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.2;

      source.connect(this.analyser);

      this.dataArray = new Float32Array(this.analyser.fftSize);
      this.isListening = true;
      this.hasPermission = true;
      this.permissionDenied = false;
    } catch (err) {
      console.warn('Microphone permission / access error:', err);
      this.permissionDenied = true;
      this.isListening = false;
    }
  }

  stop() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isListening = false;
  }

  update(dt) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }

    if (!this.isListening || !this.analyser) {
      this.currentLevel = 0;
      return null;
    }

    this.analyser.getFloatTimeDomainData(this.dataArray);

    // Calculate RMS loudness
    let sumSquares = 0, peak = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const val = this.dataArray[i];
      sumSquares += val * val;
      peak = Math.max(peak,Math.abs(val));
    }
    const rms = Math.sqrt(sumSquares / this.dataArray.length);
    const level = Math.max(rms, peak * 0.4);
    this.currentLevel = level;
    const gate = Math.max(this.threshold, this.rollingAverage * 2.2 + 0.015);
    const isLoud = level >= gate;
    let eventType = null;

    if (isLoud) {
      if (!this.isNoiseActive && this.cooldownTimer <= 0) {
        this.isNoiseActive = true;
        this.noiseTimer = 0;
        this.isSustainedMode = false;
      }

      if (this.isNoiseActive) {
        this.noiseTimer += dt;
        this.burstPeak = Math.max(this.burstPeak,level);

        // Has noise been held long enough to become a LONG SHARP NOISE?
        if (this.noiseTimer >= this.sustainedMinTime) {
          if (!this.isSustainedMode) {
            this.isSustainedMode = true;
            if (this.onSustainedStartCallback) {
              this.onSustainedStartCallback();
            }
          }

          const chargeProgress = Math.min(1.0, (this.noiseTimer - this.sustainedMinTime) / (this.maxSustainTime - this.sustainedMinTime));
          if (this.onSustainedProgressCallback) {
            this.onSustainedProgressCallback(chargeProgress);
          }

          // Auto-release if sustained to maximum duration
          if (this.noiseTimer >= this.maxSustainTime + 0.3) {
            eventType = 'HIGH_BEAM';
            if (this.onSustainedReleaseCallback) {
              this.onSustainedReleaseCallback(1.0);
            }
            this.isNoiseActive = false;
            this.isSustainedMode = false;
            this.cooldownTimer = this.cooldownDuration;
          }
        }
      }
    } else {
      // Noise dropped back below threshold
      if (this.isNoiseActive) {
        if (this.isSustainedMode) {
          // Finished long sharp noise => Fire HIGH attack!
          const chargeRatio = Math.max(0.5, Math.min(1.0, this.noiseTimer / this.maxSustainTime));
          eventType = 'HIGH_BEAM';
          if (this.onSustainedReleaseCallback) {
            this.onSustainedReleaseCallback(chargeRatio);
          }
        } else if (this.noiseTimer < this.sustainedMinTime && this.noiseTimer > 0 && this.cooldownTimer <= 0) {
          // Short transient burst => Fire MID clap attack!
          eventType = 'MID_CLAP';
          const clapPower = Math.min(1.0, 0.5 + (this.burstPeak / (this.threshold * 2.0)) * 0.5);
          if (this.onClapCallback) {
            this.onClapCallback(clapPower);
          }
        }

        this.isNoiseActive = false;
        this.isSustainedMode = false;
        this.cooldownTimer = this.cooldownDuration;
      }
    }

    // Update rolling background noise average
    if(!this.isNoiseActive && level<this.threshold) this.rollingAverage = this.rollingAverage * 0.98 + rms * 0.02;

    return eventType;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClapDetector };
}
