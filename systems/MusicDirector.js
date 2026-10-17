// Web Audio step sequencer. Scheduling follows audio time, never simulation speed.
class MusicDirector {
 constructor(synth){this.synth=synth;this.scene='';this.step=0;this.nextTime=0;this.bus=null;this.active=false;this.volume=.30;this.oldBuses=[];this.scheduled=0;}
 static midi(n){return 440*Math.pow(2,(n-69)/12);}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));if(this.synth.ctx&&this.synth.musicBus)this.synth.musicBus.gain.setTargetAtTime(this.volume,this.synth.ctx.currentTime,.04);}
 setScene(scene){
  if(scene===this.scene&&this.bus)return;
  this.scene=scene in MUSIC_THEMES?scene:'';this.step=0;this.nextTime=0;
  const ctx=this.synth.ctx;if(!ctx)return;
  if(this.bus){this.bus.gain.cancelScheduledValues(ctx.currentTime);this.bus.gain.setTargetAtTime(0,ctx.currentTime,.10);this.oldBuses.push({node:this.bus,until:ctx.currentTime+2});}
  this.bus=null;
  if(this.scene){this.bus=ctx.createGain();this.bus.gain.setValueAtTime(0,ctx.currentTime);this.bus.gain.setTargetAtTime(this.active?1:0,ctx.currentTime,.16);this.bus.connect(this.synth.musicBus);}
 }
 pause(yes){
  if(this.active===!yes)return;this.active=!yes;
  const ctx=this.synth.ctx;if(!ctx||!this.bus)return;
  this.bus.gain.setTargetAtTime(yes?0:1,ctx.currentTime,yes?.035:.10);
  if(!yes)this.nextTime=ctx.currentTime+.07;
 }
 tick(){
  if(!this.scene||!this.active||!this.synth.enabled)return;
  const ctx=this.synth.ctx;if(!ctx||ctx.state!=='running')return;
  if(!this.bus)this.setScene(this.scene);
  for(const entry of this.oldBuses.filter(e=>e.until<ctx.currentTime)){entry.node.disconnect();}
  this.oldBuses=this.oldBuses.filter(e=>e.until>=ctx.currentTime);
  if(this.nextTime<ctx.currentTime-.2)this.nextTime=ctx.currentTime+.04;
  if(!this.nextTime)this.nextTime=ctx.currentTime+.06;
  const theme=MUSIC_THEMES[this.scene],beat=60/theme.bpm,unit=beat/4;
  let count=0;while(this.nextTime<ctx.currentTime+.13&&count++<4){this._step(theme,this.step,this.nextTime,unit);this.nextTime+=unit;this.step=(this.step+1)%64;this.scheduled++;}
 }
 _tone(midi,at,duration,level,type='triangle',filter=1600,echo=false){
  const ctx=this.synth.ctx;if(!ctx||!this.bus)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain(),low=ctx.createBiquadFilter();
  osc.type=type;osc.frequency.setValueAtTime(MusicDirector.midi(midi),at);
  low.type='lowpass';low.frequency.setValueAtTime(filter,at);
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level),at+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(low);low.connect(gain);gain.connect(this.bus);osc.start(at);osc.stop(at+duration+.02);
  if(echo&&at+duration+.18<this.nextTime+4){this._tone(midi,at+.23,Math.max(.12,duration*.65),level*.24,'sine',1200,false);}
 }
 _noise(at,duration,level,highpass){
  const ctx=this.synth.ctx;if(!ctx||!this.bus)return;
  if(!this.noise){const buffer=ctx.createBuffer(1,ctx.sampleRate*.3,ctx.sampleRate),out=buffer.getChannelData(0);let seed=77;for(let i=0;i<out.length;i++){seed=(seed*16807)%2147483647;out[i]=(seed/1073741824-1);}this.noise=buffer;}
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=this.noise;filter.type='highpass';filter.frequency.setValueAtTime(highpass,at);
  gain.gain.setValueAtTime(level,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  src.connect(filter);filter.connect(gain);gain.connect(this.bus);src.start(at);src.stop(at+duration+.01);
 }
 _step(theme,step,at,unit){
  const bar=Math.floor(step/16),pos=step%16,root=theme.root+theme.chords[bar],feel=theme.feel;
  if(pos%4===0){const bass=theme.bass[(pos/2)%8];if(bass>=0)this._tone(root-12+bass,at,unit*3.6,.18,feel==='discord'?'sawtooth':'triangle',260);}
  if(pos%2===0){const arp=theme.arp[(pos/2)%8];if(arp>=0)this._tone(root+12+arp,at,unit*1.65,feel==='silence'?.045:.065,feel==='clock'?'square':'sine',2100);}
  const lead=theme.lead[pos];if(lead>=0&&((bar+pos)%2===0||feel==='victory'))this._tone(root+lead,at,unit*(feel==='silence'?3.1:1.85),feel==='victory'?.12:.095,feel==='discord'?'sawtooth':'triangle',feel==='discord'?1800:2800,feel==='echo');
  if(pos===0||pos===8)this._tone(root+12,at,unit*7,feel==='silence'?.038:.026,'sine',900);
  const drum=theme.drums[pos];if(drum==='K'){this._tone(32,at,.18,feel==='silence'?.11:.18,'sine',180);}
  if(drum==='S')this._noise(at,.13,feel==='silence'?.035:.07,950);
  if(drum==='h'&&feel!=='silence')this._noise(at,.035,.018,5500);
 }
}
if(typeof module!=='undefined')module.exports={MusicDirector};
