class SonataController {
  constructor(x,y){
    this.isBoss=true;this.bossWord='SONATA';this.name='??????';
    this.profile={key:'ORPHEUS',name:this.name,domain:'THE FORBIDDEN SONATA',color:'#f3d49c',altitude:4400,coreTune:'HIGH',attackATune:'HIGH',attackBTune:'MID'};
    this.anchor=new Orpheus(x,y);this.prisoner=new Musician(400,175);this.prisoner.abducted=true;
    this.seals=Array.from({length:4},(_,i)=>new RuneSeal(400,100,i));
    this.points=[];this.initialPointCount=SONATA.particles;
    this.phase='ENTRANCE';this.phaseTimer=0;this.age=0;this.act=1;this.cycle=0;this.voice=0;
    this.hp=100;this.maxHp=100;this.coreHits=0;this.coreHitsRequired=100;
    this.focus={x:400,y:585};this.shapeDef={contactDamage:9,resonance:'LOW'};
    this.isDead=false;this.isCleared=false;this.tookDamage=false;this.hitCooldown=0;this.hitFlash=0;this.contactCooldown=0;
    for(let i=0;i<this.initialPointCount;i++){
      const p=new SwarmPoint(x+(i%16-8)*6,y+Math.floor(i/16)*4,{x:0,y:0},this.anchor,'LOW');
      p.boss=this;p.homeTarget={x,y};p.maxSpeed=7;p.maxForce=.48;p.r=3.7;p.dangerous=false;
      this.points.push(p);
    }
  }
  getLivePoints(){return this.points.filter(p=>!p.isDead&&!p.isConverted);}
  getAct(){return this.act;}
  setPhase(phase){this.phase=phase;this.phaseTimer=0;this.anchor.phase=phase;for(const p of this.points)p.dangerous=false;}
  regenerate(amount){
    let restored=0;
    for(const p of this.points){if(restored>=amount)break;if(!p.isDead&&!p.isConverted)continue;
      p.isDead=false;p.isConverted=false;p.state='HOMED';p.stunTimer=0;p.dangerous=false;restored++;}
    return restored;
  }
  damagePoint(point){
    if(!point||point.isDead||['OVERWHELM','SACRIFICE','DEFEAT'].includes(this.phase))return false;
    point.isDead=true;point.dangerous=false;
    if(this.getLivePoints().length<18&&!['EXPOSED','ENTRANCE'].includes(this.phase))this.setPhase('EXPOSED');
    return true;
  }
  // One damaging contact per attack window even when many steered points overlap.
  canContactPlayer(){return this.phase==='ACTIVE'&&this.contactCooldown<=0;}
  onPlayerHit(){this.contactCooldown=1.5;}
  finishIfEmpty(){
    if(this.getLivePoints().length<18&&!['ENTRANCE','OVERWHELM','SACRIFICE','DEFEAT','EXPOSED'].includes(this.phase))this.setPhase('EXPOSED');
  }
  triggerOverwhelm(){
    if(this.act!==1||['OVERWHELM','SACRIFICE'].includes(this.phase))return;
    this.voice=1;this.setPhase('OVERWHELM');
  }
  triggerBreak(){
    if(this.act!==1||this.phase==='SACRIFICE')return;
    this.setPhase('SACRIFICE');
  }
  directHit(wave){
    if(!['WARNING','ACTIVE','RECOVER','EXPOSED'].includes(this.phase)||this.hitCooldown>0||!calculateBlastForce(this.anchor,wave))return 0;
    wave.directBossHits=wave.directBossHits||new Set();if(wave.directBossHits.has(this))return 0;
    wave.directBossHits.add(this);
    const open=['RECOVER','EXPOSED'].includes(this.phase),damage=open?(wave.awakened?16:12):(wave.awakened?4:3);
    this.hp=Math.max(this.act===1?28:0,this.hp-damage);this.coreHits=this.maxHp-this.hp;this.hitCooldown=.7;this.hitFlash=.24;
    if(this.act===1&&this.hp<=28)this.triggerOverwhelm();
    else if(this.act===2&&this.hp===0)this.setPhase('DEFEAT');
    return damage;
  }
  beginFinalAct(){
    this.act=2;this.name='ORPHEUS';this.profile.name=this.name;this.profile.domain='THE MAN WHO LOOKED BACK';
    this.maxHp=140;this.hp=140;this.coreHitsRequired=140;this.coreHits=0;this.contactCooldown=0;
    this.anchor.act=2;this.regenerate(this.initialPointCount);this.setPhase('ENTRANCE');
  }
  update(dt,guitar,shaft){
    this.age+=dt;this.phaseTimer+=dt;this.hitCooldown=Math.max(0,this.hitCooldown-dt);this.contactCooldown=Math.max(0,this.contactCooldown-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);
    if(this.phase==='SACRIFICE')return;
    if(this.phase==='OVERWHELM'&&this.phaseTimer>1.65){this.triggerBreak();return;}
    if(this.phase==='DEFEAT'){if(this.isCleared&&this.bonusAwarded)this.isDead=true;return;}
    const pose={x:400+Math.sin(this.age*.47)*90,y:['RECOVER','EXPOSED'].includes(this.phase)?350:290};
    this.anchor.poseTime=this.phaseTimer;this.anchor.voice=this.voice;this.anchor.step(dt,pose);
    if(this.act===1){
      this.prisoner.target={x:400,y:185};this.prisoner.updateScene(dt);
      for(const seal of this.seals){const a=seal.index*Math.PI/2+this.age*.18;seal.step(dt,{x:400+Math.cos(a)*105,y:110+Math.sin(a)*65});}
    }
    if(this.phase==='ENTRANCE'&&this.phaseTimer>3.8)this.startWarning(guitar);
    else if(this.phase==='WARNING'&&this.phaseTimer>SONATA.warning)this.setPhase('ACTIVE');
    else if(this.phase==='ACTIVE'&&this.phaseTimer>SONATA.active)this.setPhase('RECOVER');
    else if(this.phase==='RECOVER'&&this.phaseTimer>SONATA.recovery){this.regenerate(64);this.startWarning(guitar);}
    else if(this.phase==='EXPOSED'&&this.phaseTimer>6){this.regenerate(this.initialPointCount);this.startWarning(guitar);}
    const live=this.getLivePoints();
    for(let i=0;i<live.length;i++){
      const p=live[i],mixed=this.act===2&&i>=Math.ceil(live.length/2),voice=(this.voice+(mixed?1:0))%4;
      const count=this.act===2?Math.ceil(live.length/2):live.length,index=mixed?i-Math.ceil(live.length/2):i;
      const attacking=['WARNING','ACTIVE','OVERWHELM'].includes(this.phase);
      p.resonance=SONATA.tunes[voice];p.sonataVoice=voice;
      if(attacking)p.homeTarget=sonataSlot(this.phase==='OVERWHELM'?'CHAINS':SONATA.patterns[voice],index,count,this.phase==='WARNING'?0:this.phase==='OVERWHELM'?this.phaseTimer*1.6:this.phaseTimer,this.focus,this.anchor.pos,this.act);
      else{const a=i/live.length*Math.PI*2+this.age*.25;p.homeTarget={x:this.anchor.pos.x+Math.cos(a)*90,y:this.anchor.pos.y+Math.sin(a)*115};}
      p.dangerous=this.phase==='ACTIVE'&&this.phaseTimer>.25&&Math.hypot(p.pos.x-p.homeTarget.x,p.pos.y-p.homeTarget.y)<48;
    }
  }
  startWarning(guitar){
    this.voice=this.cycle++%4;this.focus={x:Math.max(260,Math.min(540,guitar.pos.x)),y:Math.max(520,Math.min(650,guitar.pos.y))};
    this.setPhase('WARNING');
  }
  completeEpilogue(){
    if(this.act!==2||this.phase!=='DEFEAT'||this.isCleared)return false;
    this.isCleared=true;return true;
  }
  getGuide(){
    if(this.phase==='OVERWHELM')return {kicker:'THE SCORE FRACTURES',action:'THE CONDUCTOR UNLEASHES HIS TRUE VOICE',detail:'The bindings crack. One final strike is coming.',progress:this.phaseTimer/1.65};
    const names=['COUNTER-ROTATING CROWNS','RUNES OF SEPARATION','BLUE-FIRE REFRAIN','TWIN METRONOMES'];
    if(this.phase==='EXPOSED'||this.phase==='RECOVER')return {kicker:'THE SCORE BREAKS',action:'HIGH · STRIKE THE CONDUCTOR',detail:'His core is open. Charge, release, then prepare to dodge.',progress:this.phaseTimer/(this.phase==='EXPOSED'?6:SONATA.recovery)};
    return {kicker:this.act===2?'ACT II · TWO VOICES AT ONCE':'ACT I · '+names[this.voice],action:this.phase==='WARNING'?'READ THE GOLD WARNING':names[this.voice],detail:this.act===2?'Break the matching colours. Wait for his recovery to strike.':'Destroy the swarm to create a longer opening. Direct shots still chip him.',progress:this.phase==='WARNING'?this.phaseTimer/SONATA.warning:1};
  }
  show(){
    const c=drawingContext;
    if(this.act===1&&this.phase!=='SACRIFICE'){this.prisoner.show();for(const seal of this.seals)seal.show(this.prisoner);}
    if(this.phase==='WARNING'||this.phase==='OVERWHELM'){
      c.save();c.strokeStyle='#ffe3a5';c.globalAlpha=.5;c.lineWidth=1.5;c.setLineDash([5,9]);
      const live=this.getLivePoints();for(let i=0;i<live.length;i+=12){const p=live[i];c.beginPath();c.moveTo(p.pos.x,p.pos.y);c.lineTo(p.homeTarget.x,p.homeTarget.y);c.stroke();}
      c.setLineDash([]);c.restore();
    }
    if(this.phase!=='SACRIFICE')for(const p of this.points)p.show();
    c.save();if(this.phase==='DEFEAT')c.globalAlpha=Math.max(0,1-this.phaseTimer/4);
    this.anchor.show();c.restore();
    if(this.hitFlash){c.save();c.strokeStyle='#fff4d9';c.globalAlpha=this.hitFlash/.24;c.lineWidth=3;c.beginPath();c.arc(this.anchor.pos.x,this.anchor.pos.y,65,0,Math.PI*2);c.stroke();c.restore();}
  }
}
if(typeof module!=='undefined')module.exports={SonataController};
