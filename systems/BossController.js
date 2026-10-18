class BossController {
  constructor(x,y,options={}) {
    this.isBoss=true;this.bossWord=options.bossWord||'HUSH';this.name=VESPER.name;
    this.phase='ENTRANCE';this.phaseTimer=0;this.recoverFrom='';
    this.anchor=new Vesper(x,y);this.arrival=new RulerVision(x-230,y+90,'VESPER');
    this.arrival.maxSpeed=9;this.arrival.maxForce=.72;
    this.initialPointCount=VESPER.particles;this.points=[];
    this.shapeDef={contactDamage:10,resonance:'HIGH'};
    this.isDead=false;this.isCleared=false;this.tookDamage=false;this.defeatTimer=0;this.coreHits=0;this.coreDangerous=false;this.coreContactUsed=false;this.coreAim={x,y};this.coreHitCycle=-1;this.coreVulnerable=false;
    this.cycle=0;this.firstRingGrace=true;this.hitFlash=0;this.ringClock=0;this.aimAngle=Math.PI/2;
    this.regenerationReserve=VESPER.regenerationReserve;this.regeneratedThisRecall=false;this.regeneratedThisEdge=false;this.recallInterrupted=false;this.regenerationFlash=0;
    this.focus={x,y};this.wordCenter={x,y:y+270};this.aim={x,y:y+500};this.missileCount=VESPER.missileCount;this.missiles=[];this.wordCycle=0;this.currentAttackWord='CHUT';
    // Glyph geometry is computed once. Recall can restore a bounded number of missing slots.
    this.introWord=generateProceduralWordPoints('VESPER',VESPER.particles);
    this.throneShape=generateThronePoints(VESPER.particles);
    this.wordShapes={CHUT:generateProceduralWordPoints('CHUT',VESPER.particles),
      SILENCE:generateProceduralWordPoints('SILENCE',VESPER.particles)};
    for(let i=0;i<this.initialPointCount;i++){
      const a=i*2.3999632297,r=50+i*.55;
      const p=new SwarmPoint(x+Math.cos(a)*r,y+Math.sin(a)*r,{x:0,y:0},this.anchor,'HIGH');
      p.boss=this;p.bossSlotIndex=i;p.maxSpeed=8;p.maxForce=.65;p.rayonZoneDeFreinage=34;
      p.homeTarget={x,y};p.r=3.1;this.points.push(p);
    }
  }
  getLivePoints(){return this.points.filter(p=>!p.isDead&&!p.isConverted);}
  getGuide(){
    const kicker='VESPER · SOVEREIGN OF SILENCE';
    const phase=this.phase;
    if(phase==='ENTRANCE')return {kicker,action:'WATCH THE THRONE FORM',detail:'Its points are its finite power.',progress:0};
    if(phase==='EXPOSED'){
      const beat=this.phaseTimer%3.2,cycle=Math.floor(this.phaseTimer/3.2);
      const spent=this.coreHitCycle===cycle;
      return {kicker,action:beat<.9?'MOVE OFF THE MARKED LINE':beat<1.55?'DODGE THE LUNGE':spent?'CORE SEALED · RECHARGE':'HIGH · STRIKE THE OPEN CORE',
        detail:'One core hit per recovery. '+(VESPER.coreHitsRequired-this.coreHits)+' remaining.',progress:beat/3.2};
    }
    if(phase==='DEFEAT')return {kicker,action:'SILENCE BROKEN',detail:'The ascent continues.',progress:1};
    if(phase==='RECALL')return {kicker,action:'INTERRUPT THE RECALL · HIT VESPER',detail:'A direct blast stops him rebuilding the throne.',progress:this.phaseTimer/VESPER.durations.RECALL};
    if(phase.startsWith('ORBIT'))return {kicker,action:'FOLLOW THE ROTATING GAP',detail:'Slip through the opening in his particle rings.',progress:phase==='ORBIT'?this.phaseTimer/VESPER.durations.ORBIT:0};
    if(phase.startsWith('MISSILE'))return {kicker,action:'MATCH THE MISSILE TUNING · PARRY',detail:'MID or HIGH sends his own swarm back.',progress:phase==='MISSILE'?this.phaseTimer/VESPER.durations.MISSILE:0};
    if(phase.startsWith('HAND'))return {kicker,action:'LOW · BREAK THE GRASP',detail:'Move out of the palm before it closes.',progress:phase==='HAND'?this.phaseTimer/VESPER.durations.HAND:0};
    if(phase.startsWith('WORD'))return {kicker,action:'SHATTER THE LIVING WORD',detail:'Use HIGH to pierce the letters.',progress:phase==='WORD_ATTACK'?this.phaseTimer/VESPER.durations.WORD_ATTACK:0};
    if(['SPEAR_WARN','LUNGE','EDGE'].includes(phase))return {kicker,action:'DODGE THE EDGE LUNGE',detail:'He commits to a line. Move after he aims.',progress:0};
    return {kicker,action:'THE THRONE IS OPEN · DIRECT HIT',detail:'Open body shots chip his finite swarm.',progress:0};
  }
  damagePoint(p,source='blast'){
    if(!p||p.isDead||p.isConverted)return false;
    p.isDead=true;this.tookDamage=true;this.finishIfEmpty();return true;
  }
  regenerate(){
    if(this.regenerationReserve<=0||!['RECALL','EDGE'].includes(this.phase)||(this.phase==='RECALL'&&this.recallInterrupted))return 0;
    const live=this.getLivePoints().length;
    const count=Math.min(this.phase==='EDGE'?22:VESPER.regenerationBatch,this.regenerationReserve,Math.max(0,VESPER.regenerationCeiling-live));
    if(!count)return 0;
    let restored=0;
    for(const p of this.points){
      if(!p.isDead||p.isConverted)continue;
      p.isDead=false;p.state='HOMED';p.stunTimer=0;p.dangerous=false;
      p.missileIndex=null;p.missileSlot=null;
      p.homeTarget={x:this.anchor.pos.x,y:this.anchor.pos.y};
      if(++restored===count)break;
    }
    if(!restored)return 0;
    this.regenerationReserve-=restored;this.regenerationFlash=.7;
    if(restored&&typeof hud!=='undefined'&&hud)hud.addPopup('THRONE REFORMS · +'+restored,this.anchor.pos.x,this.anchor.pos.y-105,'#c895ff');
    return restored;
  }
  damage(amount,source='missile',at=this.anchor.pos){
    const victims=this.getLivePoints().sort((p,q)=>
      Math.hypot(p.pos.x-at.x,p.pos.y-at.y)-Math.hypot(q.pos.x-at.x,q.pos.y-at.y)).slice(0,amount);
    for(const p of victims)this.damagePoint(p,source);
    return victims.length;
  }
  finishIfEmpty(){
    if(this.getLivePoints().length)return;
    if(this.phase==='EXPOSED'||this.phase==='DEFEAT'||this.isDead)return;
    this.phase='EXPOSED';this.phaseTimer=0;this.anchor.phase='EXPOSED';this.coreHitCycle=-1;this.coreVulnerable=false;
    for(const m of this.missiles)m.anchor.isDead=true;
    this.missiles=[];
    if(typeof hud!=='undefined'&&hud)hud.addPopup('CORE EXPOSED · CHARGE HIGH',this.anchor.pos.x,this.anchor.pos.y-105,'#f3d6ff');
  }
  directHit(sw){
    if(!['RECOVER','RECALL','EDGE','SPEAR_WARN','LUNGE'].includes(this.phase)||!sw||!calculateBlastForce(this.anchor,sw))return 0;
    if(!sw.directBossHits)sw.directBossHits=new Set();
    if(sw.directBossHits.has(this))return 0;sw.directBossHits.add(this);
    if(this.phase==='RECALL')this.recallInterrupted=true;
    const hits=this.damage(['RECOVER','RECALL'].includes(this.phase)?6:3,'direct hit',this.anchor.pos);
    if(hits){reactRuler(this.anchor,.35);this.hitFlash=.22;
      if(typeof spawnSparks==='function')spawnSparks(this.anchor.pos.x,this.anchor.pos.y,'#f3d6ff',9);
      if(typeof hud!=='undefined'&&hud)hud.addPopup('DIRECT HIT · -'+hits,this.anchor.pos.x,this.anchor.pos.y-120,'#f3d6ff');
      if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playBossHit();
    }
    return hits;
  }
  strikeCore(sw){
    if(this.phase!=='EXPOSED'||!this.coreVulnerable||!sw||sw.tuning?.id!=='HIGH')return false;
    const cycle=Math.floor(this.phaseTimer/3.2);
    if(this.coreHitCycle===cycle)return false;
    if(!calculateBlastForce(this.anchor,sw))return false;
    if(!sw.coreHitBosses)sw.coreHitBosses=new Set();
    if(sw.coreHitBosses.has(this))return false;
    sw.coreHitBosses.add(this);this.coreHitCycle=cycle;this.coreVulnerable=false;this.coreHits++;
    if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playCoreBreak();
    if(typeof spawnSparks==='function')spawnSparks(this.anchor.pos.x,this.anchor.pos.y,'#f3d6ff',24);
    if(this.coreHits>=VESPER.coreHitsRequired){
      this.phase='DEFEAT';this.phaseTimer=0;this.defeatTimer=0;this.anchor.phase='DEFEAT';
      if(typeof hud!=='undefined'&&hud)hud.addPopup('SILENCE / BROKEN',this.anchor.pos.x,this.anchor.pos.y-105,'#f3d6ff');
    }else if(typeof hud!=='undefined'&&hud)hud.addPopup('CORE FRACTURE '+this.coreHits+' / '+VESPER.coreHitsRequired,this.anchor.pos.x,this.anchor.pos.y-105,'#f3d6ff');
    return true;
  }
  launchMissiles(){
    this.missiles=Array.from({length:VESPER.missileCount},(_,i)=>{
      const anchor=new FormationAnchor(this.anchor.pos.x+(i-1.5)*36,this.anchor.pos.y+45);
      anchor.maxSpeed=5.8;anchor.maxForce=.5;anchor.rayonZoneDeFreinage=35;
      return {anchor,index:i,resonance:i%2?'HIGH':'MID',launchDelay:i*.24,reflected:false,exploded:false,age:0};
    });
    const selected=this.getLivePoints().slice(0,VESPER.missileParticlesPerVolley);
    for(const p of this.getLivePoints()){p.missileIndex=null;p.missileSlot=null;}
    selected.forEach((p,i)=>{p.missileIndex=i%VESPER.missileCount;p.missileSlot=Math.floor(i/VESPER.missileCount);});
  }
  reflectMissiles(sw){
    if(!this.missiles.length)return 0;let count=0;
    for(const m of this.missiles){
      if(m.reflected||m.exploded||m.age<m.launchDelay)continue;
      if(sw.tuning.id===m.resonance&&calculateBlastForce(m.anchor,sw)){m.reflected=true;count++;
        if(typeof hud!=='undefined'&&hud)hud.addPopup('PARRY / RETURN TO SENDER',m.anchor.pos.x,m.anchor.pos.y-48,'#00f5d4');
      }
    }return count;
  }
  updateMissiles(dt,guitar,shaft){
    for(const m of this.missiles){
      if(m.exploded)continue;m.age+=dt;
      const a=m.anchor,old={x:a.pos.x,y:a.pos.y};
      const target=m.reflected?this.anchor.pos:guitar.pos;
      const desired=m.reflected?{x:target.x,y:target.y}:m.age<m.launchDelay?
        {x:this.anchor.pos.x+(m.index-1.5)*55,y:this.anchor.pos.y+60}:
        {x:target.x+(m.index-1.5)*24,y:target.y};
      a.maxSpeed=m.reflected?10:5.8;
      a.applyForce(a.seek(createVector(desired.x,desired.y)));a.update();
      if(m.reflected&&segmentDistance(old,a.pos,this.anchor.pos)<VESPER.missileHitRadius){
        m.exploded=true;a.isDead=true;
        this.detachMissile(m.index);
        const hits=this.damage(VESPER.missileDamage,'reflected missile',this.anchor.pos);reactRuler(this.anchor);
        if(typeof spawnSparks==='function')spawnSparks(this.anchor.pos.x,this.anchor.pos.y,'#00f5d4',32);
        if(typeof hud!=='undefined'&&hud)hud.addPopup('PARRIED! -'+hits+' HP',this.anchor.pos.x,this.anchor.pos.y-80,'#00f5d4');
      }else if(m.age>9||a.pos.y>shaft.y+shaft.height+100||a.pos.x<shaft.x-100||a.pos.x>shaft.x+shaft.width+100){
        m.exploded=true;a.isDead=true;this.detachMissile(m.index);
      }
    }
    this.missiles=this.missiles.filter(m=>!m.exploded);
  }
  detachMissile(index){
    for(const p of this.getLivePoints())if(p.missileIndex===index){p.missileIndex=null;p.missileSlot=null;p.dangerous=false;}
  }
  update(dt,guitar,shaft){
    if(this.isDead)return;
    if(this.phase==='DEFEAT'){
      this.defeatTimer+=dt;this.anchor.phase='DEFEAT';
      this.anchor.applyForce(this.anchor.arrive(createVector(shaft.x+shaft.width/2,shaft.y+170)));
      this.anchor.update();
      if(this.defeatTimer>=VESPER.defeatDuration){this.isDead=true;this.isCleared=true;this.anchor.isDead=true;}
      return;
    }
    const live=this.getLivePoints(),ratio=live.length/this.initialPointCount;
    if(!live.length&&this.phase!=='EXPOSED'){this.finishIfEmpty();return;}
    this.phaseTimer+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.regenerationFlash=Math.max(0,this.regenerationFlash-dt);
    if(this.phase==='RECALL'&&!this.regeneratedThisRecall&&this.phaseTimer>=.9){this.regeneratedThisRecall=true;this.regenerate();}
    if(this.phase==='EDGE'&&!this.regeneratedThisEdge&&this.phaseTimer>=.8){this.regeneratedThisEdge=true;this.regenerate();}
    if(this.phase==='ORBIT')this.ringClock+=dt;
    if(this.phase==='EXPOSED'){
      const a=this.anchor,beat=this.phaseTimer%3.2;
      this.coreDangerous=beat>=.9&&beat<1.55;
      this.coreVulnerable=beat>=1.55&&beat<3.05&&this.coreHitCycle!==Math.floor(this.phaseTimer/3.2);
      if(beat<.9)this.coreAim={x:guitar.pos.x,y:guitar.pos.y};
      if(beat<.15)this.coreContactUsed=false;
      a.maxSpeed=this.coreDangerous?11+this.coreHits*1.4:5;
      a.maxForce=this.coreDangerous?.62+this.coreHits*.05:.4;
      if(this.coreDangerous)a.applyForce(a.seek(createVector(this.coreAim.x,this.coreAim.y)));
      else a.applyForce(a.arrive(createVector(shaft.x+shaft.width/2+Math.sin(this.phaseTimer*1.4)*95,shaft.y+shaft.height*.42)));
      a.update();return;
    }
    if(this.phaseTimer>=VESPER.durations[this.phase]){
      const previous=this.phase;if(previous==='ORBIT')this.firstRingGrace=false;
      this.phase=nextBossPhase(previous,ratio,this.recoverFrom);this.phaseTimer=0;
      if(this.phase==='RECOVER')this.recoverFrom=previous;
      if(this.phase==='RECALL'){this.regeneratedThisRecall=false;this.recallInterrupted=false;}
      if(this.phase==='ORBIT_WARN'||this.phase==='HAND_WARN'){
        this.focus={x:Math.max(shaft.x+240,Math.min(shaft.x+shaft.width-240,guitar.pos.x)),
          y:Math.min(shaft.y+shaft.height-220,Math.max(shaft.y+400,guitar.pos.y-40))};
        this.ringClock=0;
      }
      if(this.phase==='EDGE'){this.cycle++;this.regeneratedThisEdge=false;}
      if(this.phase==='SPEAR_WARN'){this.aim={x:guitar.pos.x,y:guitar.pos.y};
        this.aimAngle=Math.atan2(this.aim.y-this.anchor.pos.y,this.aim.x-this.anchor.pos.x);}
      if(this.phase==='MISSILE')this.launchMissiles();
      if(this.phase==='MISSILE_WARN'&&typeof hud!=='undefined'&&hud)hud.addPopup('MATCH MISSILE COLOUR · PARRY',shaft.x+shaft.width/2,shaft.y+145,'#e4be78');
      if(this.phase==='WORD_WARN'){
        this.currentAttackWord=this.wordCycle++%2?'SILENCE':'CHUT';
        if(typeof hud!=='undefined'&&hud)hud.addPopup(this.currentAttackWord+' · SHATTER THE WORD',shaft.x+shaft.width/2,shaft.y+150,'#c895ff');
      }
      if(previous==='MISSILE')for(const m of this.missiles)if(!m.reflected){m.exploded=true;this.detachMissile(m.index);}
    }
    const a=this.anchor;a.phase=this.phase;
    a.maxSpeed=this.phase==='LUNGE'?10:4.5;a.maxForce=this.phase==='LUNGE'?.65:.32;
    let target={x:shaft.x+shaft.width/2,y:shaft.y+170};
    if(['EDGE','SPEAR_WARN'].includes(this.phase))target={x:shaft.x+(this.cycle%2?70:shaft.width-70),y:shaft.y+shaft.height*.52};
    if(this.phase==='LUNGE'){
      target={x:this.aim.x+Math.cos(this.aimAngle)*420,y:this.aim.y+Math.sin(this.aimAngle)*420};
      if(this.phaseTimer<.55)a.applyForce(a.pursue(guitar));
      else a.applyForce(a.seek(createVector(target.x,target.y)));
    }else a.applyForce(a.arrive(createVector(target.x,target.y)));
    a.update();if(this.phase==='ENTRANCE'){
      this.arrival.target={x:a.pos.x,y:Math.max(shaft.y+195,a.pos.y)};this.arrival.updateVision(dt);
    }this.updateMissiles(dt,guitar,shaft);
    if(this.isDead)return;
    for(const p of live){
      if(p.isDead)continue;
      const missile=this.missiles.find(m=>!m.exploded&&m.index===p.missileIndex);
      if(missile){
        const slot=missilePointSlot(p.missileSlot,
          Math.ceil(Math.min(VESPER.missileParticlesPerVolley,live.length)/VESPER.missileCount));
        const heading=Math.atan2(missile.anchor.vel.y,missile.anchor.vel.x)-Math.PI/2;
        p.homeTarget.x=missile.anchor.pos.x+slot.x*Math.cos(heading)-slot.y*Math.sin(heading);
        p.homeTarget.y=missile.anchor.pos.y+slot.x*Math.sin(heading)+slot.y*Math.cos(heading);
        p.dangerous=!missile.reflected&&missile.age>=missile.launchDelay;
        p.resonance=missile.reflected?'LOW':missile.resonance;p.maxSpeed=11;continue;
      }
      const mode=this.phase;let slot,center;
      if(mode==='ENTRANCE'&&this.phaseTimer<1.45){
        const raw=this.introWord[p.bossSlotIndex];
        slot={x:raw.x*190,y:raw.y*80+155};center=a.pos;
      }else if(['ENTRANCE','RECALL','RECOVER','MISSILE_WARN','MISSILE'].includes(mode)){
        const raw=this.throneShape[p.bossSlotIndex];
        const breath=Math.sin(this.phaseTimer*2+raw.x*.014)*1.7;
        slot={x:raw.x,y:raw.y+45+breath};center=a.pos;
      }else if(mode==='WORD_WARN'||mode==='WORD_ATTACK'){
        const raw=this.wordShapes[this.currentAttackWord][p.bossSlotIndex];
        const attack=mode==='WORD_ATTACK',progress=Math.min(1,this.phaseTimer/VESPER.durations.WORD_ATTACK);
        const xScale=this.currentAttackWord==='CHUT'?172:(attack?210-70*progress:210);
        const yBase=this.currentAttackWord==='CHUT'?(attack?shaft.y+350+progress*280:shaft.y+350):
          (attack?shaft.y+390+Math.sin(progress*Math.PI)*90:shaft.y+390);
        const sweep=this.currentAttackWord==='SILENCE'&&attack?Math.sin(progress*Math.PI*2)*80:0;
        slot={x:raw.x*xScale+sweep,y:raw.y*100+(attack?Math.sin(this.phaseTimer*7+raw.x*12)*7:0)};
        center={x:shaft.x+shaft.width/2,y:yBase};this.wordCenter=center;
      }else{
        slot=bossSlot(mode,p.bossSlotIndex,this.initialPointCount,mode==='ORBIT'?this.ringClock:mode==='ORBIT_WARN'?0:this.phaseTimer,this.aimAngle);
        center=['ORBIT','ORBIT_WARN','HAND','HAND_WARN'].includes(mode)?this.focus:a.pos;
      }
      p.homeTarget.x=center.x+slot.x;p.homeTarget.y=center.y+slot.y;
      p.resonance=mode==='HAND'||mode==='HAND_WARN'?'LOW':mode==='SHIELD'||mode==='RECALL'?'MID':'HIGH';
      p.maxSpeed=mode==='LUNGE'?12:mode==='RECALL'?11:mode==='ENTRANCE'?10:mode.startsWith('WORD')?9:8;
      p.dangerous=['ORBIT','HAND','LUNGE','WORD_ATTACK'].includes(mode)&&!(mode==='ORBIT'&&this.firstRingGrace&&this.phaseTimer<1.2);
    }
  }
  show(){
    if(this.isDead)return;const c=drawingContext;
    if(this.phase==='EXPOSED'){
      c.save();const t=this.phaseTimer;const x=this.anchor.pos.x,y=this.anchor.pos.y;
      const beat=t%3.2;c.strokeStyle=this.coreVulnerable?'#ffe5b6':'#b88caf';c.lineWidth=this.coreVulnerable?3:2;
      for(let i=0;i<3-this.coreHits;i++){c.globalAlpha=.8-i*.16;c.beginPath();
        c.arc(x,y+18,45+i*13+Math.sin(t*3+i)*3,0,Math.PI*2);c.stroke();}
      c.globalAlpha=.9;c.fillStyle='#ffe5b6';c.font='bold 14px monospace';c.textAlign='center';
      c.fillText(this.coreVulnerable?'HIGH · CORE OPEN':beat<.9?'LOCKING AIM':beat<1.55?'DODGE':'CORE SEALED',x,y-95);
      if(beat<.9){c.globalAlpha=.5;c.strokeStyle='#ff728f';c.setLineDash([6,7]);
        c.beginPath();c.moveTo(x,y+20);c.lineTo(this.coreAim.x,this.coreAim.y);c.stroke();c.setLineDash([]);}
      if(this.coreVulnerable){c.globalAlpha=.5+.3*Math.sin(t*13)**2;c.strokeStyle='#ffe5b6';c.lineWidth=4;
        c.beginPath();c.arc(x,y+18,31+Math.sin(t*11)*4,0,Math.PI*2);c.stroke();}
      c.restore();
      this.anchor.show();return;
    }
    if(this.phase==='DEFEAT'){
      const q=Math.min(1,this.defeatTimer/VESPER.defeatDuration);
      c.save();c.globalAlpha=(1-q)*.8;c.strokeStyle='#f3d6ff';c.lineWidth=2+q*3;
      for(let i=0;i<12;i++){const a=i*Math.PI/6+q*.35,r=25+q*240;
        c.beginPath();c.moveTo(this.anchor.pos.x+Math.cos(a)*r*.55,this.anchor.pos.y+Math.sin(a)*r*.55);
        c.lineTo(this.anchor.pos.x+Math.cos(a)*r,this.anchor.pos.y+Math.sin(a)*r);c.stroke();}
      c.restore();this.anchor.show();return;
    }
    if(['ORBIT_WARN','ORBIT','HAND_WARN','SPEAR_WARN','MISSILE_WARN','WORD_WARN'].includes(this.phase)){
      c.save();c.strokeStyle='#e4be78';c.lineWidth=1;c.setLineDash([5,9]);
      if(this.phase==='SPEAR_WARN'){c.beginPath();c.moveTo(this.anchor.pos.x,this.anchor.pos.y);
        c.lineTo(this.aim.x+Math.cos(this.aimAngle)*420,this.aim.y+Math.sin(this.aimAngle)*420);c.stroke();}
      else if(this.phase==='ORBIT_WARN'||this.phase==='ORBIT'){
        for(let ring=0;ring<VESPER.ringRadii.length;ring++){
          const gapCenter=Math.PI/2+(this.phase==='ORBIT'?this.ringClock*VESPER.ringSpeeds[ring]:0);
          const r=VESPER.ringRadii[ring];
          c.beginPath();c.arc(this.focus.x,this.focus.y,r,
            gapCenter+VESPER.ringGap/2,gapCenter+Math.PI*2-VESPER.ringGap/2);c.stroke();
          c.setLineDash([]);c.strokeStyle='#5beac6';c.lineWidth=2;
          for(const side of [-1,1]){const angle=gapCenter+side*VESPER.ringGap/2;
            c.beginPath();c.moveTo(this.focus.x+Math.cos(angle)*(r-9),this.focus.y+Math.sin(angle)*(r-9));
            c.lineTo(this.focus.x+Math.cos(angle)*(r+9),this.focus.y+Math.sin(angle)*(r+9));c.stroke();}
          c.setLineDash([5,9]);c.strokeStyle='#e4be78';c.lineWidth=1;
        }
        c.setLineDash([]);
      }else if(this.phase==='HAND_WARN'){c.beginPath();c.arc(this.focus.x,this.focus.y,90,0,Math.PI*2);c.stroke();}
      else if(this.phase==='MISSILE_WARN'){for(let i=0;i<4;i++){
        c.beginPath();c.moveTo(this.anchor.pos.x,this.anchor.pos.y);
        c.lineTo(this.anchor.pos.x+(i-1.5)*70,this.anchor.pos.y+130);c.stroke();}}
      else if(this.phase==='WORD_WARN'){c.setLineDash([]);c.font='18px monospace';c.textAlign='center';
        c.fillStyle='#f0b6df';c.fillText(this.currentAttackWord==='CHUT'?'C H U T':'S I L E N C E',this.wordCenter.x,this.wordCenter.y-120);}
      c.restore();
    }
    if(['ENTRANCE','RECALL','RECOVER'].includes(this.phase)&&this.phaseTimer>1.45){
      c.save();c.strokeStyle='#c895ff';c.globalAlpha=.26;c.lineWidth=1.25;c.beginPath();
      let previous=null;
      for(const p of this.points){
        if(p.isDead||p.isConverted||p.state!=='HOMED'){previous=null;continue;}
        if(previous&&Math.hypot(previous.pos.x-p.pos.x,previous.pos.y-p.pos.y)<15)c.lineTo(p.pos.x,p.pos.y);
        else c.moveTo(p.pos.x,p.pos.y);
        previous=p;
      }
      c.stroke();c.restore();
    }
    for(const p of this.points)p.show();
    if(this.phase==='RECALL'||this.regenerationFlash>0){
      c.save();c.strokeStyle=this.recallInterrupted?'#7b869b':'#c895ff';
      c.globalAlpha=this.recallInterrupted?.28:.25+this.regenerationFlash*.6;
      c.lineWidth=2;c.setLineDash(this.recallInterrupted?[3,9]:[]);
      c.beginPath();c.arc(this.anchor.pos.x,this.anchor.pos.y,64+this.phaseTimer*24,0,Math.PI*2);c.stroke();
      c.setLineDash([]);c.restore();
    }
    drawBossArrival(this,c);
    if(this.hitFlash>0){c.save();c.globalAlpha=this.hitFlash/.22*.8;c.strokeStyle='#f3d6ff';c.lineWidth=4;
      c.beginPath();c.arc(this.anchor.pos.x,this.anchor.pos.y,55+(1-this.hitFlash/.22)*26,0,Math.PI*2);c.stroke();c.restore();}
  }
}
if(typeof module!=='undefined')module.exports={BossController};
