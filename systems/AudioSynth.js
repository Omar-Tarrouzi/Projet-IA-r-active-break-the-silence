// Web Audio API Synthesizer (Zero asset dependencies, pure oscillators)

class AudioSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastNote=0;
    this.musicBus=null;this.sfxBus=null;this.sfxVolume=.55;
  }

  _ensureContext() {
    if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=9;limiter.attack.value=.003;limiter.release.value=.2;limiter.connect(this.ctx.destination);
      this.sfxBus=this.ctx.createGain();this.sfxBus.gain.value=this.sfxVolume;this.sfxBus.connect(limiter);
      this.musicBus=this.ctx.createGain();this.musicBus.gain.value=.30;this.musicBus.connect(limiter);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCue(frequency,ending,duration,volume=.13){
    if(!this.enabled)return;this._ensureContext();if(!this.ctx)return;
    try{const now=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type='sine';o.frequency.setValueAtTime(frequency,now);
      o.frequency.exponentialRampToValueAtTime(ending,now+duration);
      g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);
      o.connect(g);g.connect(this.sfxBus||this.ctx.destination);o.start(now);o.stop(now+duration+.01);
    }catch(e){}
  }
  init(){this._ensureContext();}
  setSfxVolume(value){this.sfxVolume=Math.max(0,Math.min(1,Number(value)||0));if(this.sfxBus)this.sfxBus.gain.setTargetAtTime(this.sfxVolume,this.ctx.currentTime,.03);}
  _impact(frequency,kind='hit'){
    if(!this.enabled)return;this._ensureContext();if(!this.ctx)return;
    const ctx=this.ctx,t=ctx.currentTime,osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    osc.type=kind==='attack'?'sawtooth':'triangle';osc.frequency.setValueAtTime(frequency,t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(35,frequency*(kind==='attack'?.45:.3)),t+.19);
    filter.type='lowpass';filter.frequency.setValueAtTime(kind==='attack'?1100:2100,t);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(kind==='attack'?.23:.28,t+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.22);
    osc.connect(filter);filter.connect(gain);gain.connect(this.sfxBus);osc.start(t);osc.stop(t+.23);
  }
  playEnemyAttack(kind){this._impact(kind==='ONYX'?170:kind==='NOVA'?310:kind==='CADENCE'?420:120,'attack');}
  playBossReveal(kind){
    const root=kind==='ONYX'?146:kind==='NOVA'?196:kind==='CADENCE'?220:130;
    this._impact(root,'attack');this.playCue(root*2,root*3,.48,.12);
  }
  playCoreBreak(){this._impact(660);this.playCue(880,1760,.4,.10);}
  playWarning(kind){const pitch=kind==='ONYX'?220:kind==='NOVA'?330:440;
    this.playCue(pitch,pitch*.72,.25,.105);}
  playCounter(){this.playCue(392,784,.31,.18);}
  playBossHit(){this._impact(260);this.playCue(440,520,.09,.06);}
  playBeat(){this.playCue(740,530,.10,.075);}

  playBlast(tuningKey = 'LOW', chargeRatio = 0) {
    if (!this.enabled) return;
    this._ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      let baseFreq = 130; // LOW
      if (tuningKey === 'MID') baseFreq = 260;
      if (tuningKey === 'HIGH') baseFreq = 520;
      baseFreq += chargeRatio * 100;

      osc.type = tuningKey === 'HIGH' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxBus||this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  playConversion() {
    const tick=Date.now();if(tick-this.lastNote<55)return;this.lastNote=tick;
    if (!this.enabled) return;
    this._ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pentatonic pitch
      const notes = [440, 493.88, 554.37, 659.25, 739.99];
      const freq = notes[Math.floor(Math.random() * notes.length)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxBus||this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {}
  }

  playDamage() {
    this._impact(110);
    if (!this.enabled) return;
    this._ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxBus||this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playDash() {
    if (!this.enabled) return;
    this._ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Pitch-bent whammy slide down
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxBus||this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playPincerWarning() {
    if (!this.enabled) return;
    this._ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dual oscillator ominous tritone chord
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, now); // A2
      osc2.frequency.setValueAtTime(155.56, now); // D#3 (dissonant tritone)

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxBus||this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.41);
      osc2.stop(now + 0.41);
    } catch (e) {}
  }

  playCombo(comboCount = 1) {
    const tick=Date.now();if(tick-this.lastNote<55)return;this.lastNote=tick;
    if (!this.enabled) return;
    this._ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const noteIdx = Math.min(scale.length - 1, Math.max(0, Math.floor(comboCount / 2)));
      const freq = scale[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxBus||this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioSynth };
}
