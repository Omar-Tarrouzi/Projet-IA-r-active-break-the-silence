// Three sovereigns use one finite swarm contract and three different player counters.
class RulerBossController {
  constructor(x,y,options={}){
    this.isBoss=true;this.bossWord=options.bossWord||'MUTE';
    this.profile=RULER_BOSSES[this.bossWord];if(!this.profile)throw Error('Unknown ruler');
    this.name=this.profile.name;this.anchor=new RulerBoss(x,y,this.profile.key);
    const side=['ONYX','CADENCE'].includes(this.profile.key)?1:-1;
    this.arrival=new RulerVision(x+side*230,y+90,this.profile.key);
    this.arrival.maxSpeed=9;this.arrival.maxForce=.72;
    this.phase='ENTRANCE';this.phaseTimer=0;this.cycle=0;this.nextAttack='A_WARN';
    this.initialPointCount=this.profile.particles;this.points=[];
    this.shapeDef={contactDamage:10,resonance:this.profile.attackATune};
    this.isDead=false;this.isCleared=false;this.tookDamage=false;
    this.coreHits=0;this.coreHitsRequired=3;this.coreDangerous=false;this.lastCoreHitAt=-Infinity;this.pendingCoreHits=0;
    this.focus={x,y:y+390};this.defeatTimer=0;
    this.chainDarts=[];this.chainBreaks=[0,0,0];this.echoes=[];this.diamonds=[];this.diamondLaunches=0;this.echoTune='HIGH';
    this.echoLaunches=0;this.beatClock=0;this.lastCounterBeat=-1;this.staggerTimer=0;
    this.counterSeen=false;this.lastAct=1;this.hitFlash=0;
    this.regenerationReserve=72;this.regeneratedThisRecovery=false;
    for(let i=0;i<this.initialPointCount;i++){
      const angle=i*2.3999632297,r=30+i*.48;
      const p=new SwarmPoint(x+Math.cos(angle)*r,y+Math.sin(angle)*r,{x:0,y:0},this.anchor,this.profile.attackATune);
      p.boss=this;p.bossSlotIndex=i;p.homeTarget={x,y};p.maxSpeed=9;p.maxForce=.65;
      p.rayonZoneDeFreinage=35;p.r=3;this.points.push(p);
    }
  }
  getLivePoints(){return this.points.filter(p=>!p.isDead&&!p.isConverted);}
  getHazards(){
    if(this.cycle===1&&this.phase==='A'&&this.phaseTimer<1.4)return [];
    if(this.profile.key==='ONYX')return this.chainDarts.filter(d=>!d.isDead&&d.mode==='SEEK'&&!d.hitPlayer);
    if(this.profile.key==='NOVA')return this.echoes.filter(e=>!e.isDead&&e.mode==='SEEK');
    if(this.profile.key==='CADENCE')return this.diamonds.filter(d=>!d.isDead&&d.mode==='SEEK'&&!d.hitPlayer);
    return [];
  }
  damagePoint(p){
    if(!p||p.isDead||p.isConverted)return false;
    p.isDead=true;this.tookDamage=true;
    if(this.profile.key==='ONYX'&&p.chainIndex!=null){
      const dart=this.chainDarts[p.chainIndex];
      if(dart&&!dart.isDead&&dart.mode!=='RETURN'){
        this.chainBreaks[p.chainIndex]=(this.chainBreaks[p.chainIndex]||0)+1;
        if(this.chainBreaks[p.chainIndex]>=Math.min(14,Math.max(5,Math.ceil(this.getLivePoints().filter(q=>q.chainIndex===p.chainIndex).length*.28))))this.returnChain(dart,'LINKS BROKEN');
      }
    }
    this.finishIfEmpty();return true;
  }
  damageReserve(amount,at=this.anchor.pos){
    const victims=this.getLivePoints().sort((a,b)=>
      Math.hypot(a.pos.x-at.x,a.pos.y-at.y)-Math.hypot(b.pos.x-at.x,b.pos.y-at.y)).slice(0,Math.min(28,amount));
    for(const p of victims)this.damagePoint(p);
    return victims.length;
  }
  regenerate(requested=12,forced=false){
    if(!forced&&(this.phase!=='RECOVER'||this.regenerationReserve<=0))return 0;
    const count=Math.min(requested,forced?this.initialPointCount:this.regenerationReserve,Math.max(0,108-this.getLivePoints().length));
    if(!count)return 0;
    let restored=0;
    for(const p of this.points){if(!p.isDead&&!p.isConverted)continue;
      p.isConverted=false;p.isDead=false;p.state='HOMED';p.stunTimer=0;p.dangerous=false;
      p.chainIndex=null;p.chainSlot=null;
      if(++restored===count)break;
    }
    if(!forced)this.regenerationReserve-=restored;
    if(restored&&typeof hud!=='undefined'&&hud)hud.addPopup('SWARM REFORMS · +'+restored,this.anchor.pos.x,this.anchor.pos.y-105,this.profile.color);
    return restored;
  }
  finishIfEmpty(){
    if(this.getLivePoints().length||this.phase==='EXPOSED'||this.phase==='DEFEAT'||this.isDead)return;
    if(this.profile.key==='ONYX'){
      this.phase='DEFEAT';this.phaseTimer=0;this.anchor.phase='DEFEAT';
      this.chainDarts.forEach(d=>d.isDead=true);
      if(typeof hud!=='undefined'&&hud)hud.addPopup('CHAINS BROKEN · DISCORD FALLS',this.anchor.pos.x,this.anchor.pos.y-100,this.profile.color);
      return;
    }
    this.phase='EXPOSED';this.phaseTimer=0;this.lastCoreHitAt=-Infinity;this.anchor.phase='EXPOSED';
    this.echoLaunches=0;this.diamondLaunches=0;
    if(typeof hud!=='undefined'&&hud)hud.addPopup('CORE OPEN · REDIRECT THE ATTACK',
      this.anchor.pos.x,this.anchor.pos.y-100,this.profile.color);
  }
  directHit(sw){
    if(!['A_WARN','A','B_WARN','B','RECOVER'].includes(this.phase)||!sw||!calculateBlastForce(this.anchor,sw))return 0;
    if(!sw.directBossHits)sw.directBossHits=new Set();
    if(sw.directBossHits.has(this))return 0;sw.directBossHits.add(this);
    const hits=this.damageReserve(this.phase==='RECOVER'?6:3,this.anchor.pos);
    if(hits){reactRuler(this.anchor,.35);this.hitFlash=.22;
      if(typeof spawnSparks==='function')spawnSparks(this.anchor.pos.x,this.anchor.pos.y,this.profile.color,9);
      if(typeof hud!=='undefined'&&hud)hud.addPopup('DIRECT HIT · -'+hits,this.anchor.pos.x,this.anchor.pos.y-125,this.profile.color);
      if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playBossHit();
    }
    return hits;
  }
  hitCore(source){
    if(this.phase!=='EXPOSED'||this.phaseTimer-this.lastCoreHitAt<.65)return false;
    this.lastCoreHitAt=this.phaseTimer;this.coreHits++;this.hitFlash=.22;reactRuler(this.anchor);
    if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playCoreBreak();
    if(typeof spawnSparks==='function')spawnSparks(this.anchor.pos.x,this.anchor.pos.y,this.profile.color,20);
    if(this.coreHits>=this.coreHitsRequired){this.phase='DEFEAT';this.phaseTimer=0;this.anchor.phase='DEFEAT';}
    else if(typeof hud!=='undefined'&&hud)hud.addPopup(source+' · CORE '+this.coreHits+'/'+this.coreHitsRequired,
      this.anchor.pos.x,this.anchor.pos.y-90,this.profile.color);
    return true;
  }
  creditCoreReturn(source){
    if(this.phase!=='EXPOSED')return false;
    if(!this.hitCore(source))this.pendingCoreHits=Math.min(this.coreHitsRequired-this.coreHits,this.pendingCoreHits+1);
    return true;
  }
  strikeCore(sw){
    if(this.phase!=='EXPOSED'||sw?.tuning?.id!==this.profile.coreTune||!calculateBlastForce(this.anchor,sw))return false;
    if(!sw.coreHitBosses)sw.coreHitBosses=new Set();
    if(sw.coreHitBosses.has(this))return false;
    if(!this.hitCore('DIRECT HIT'))return false;
    sw.coreHitBosses.add(this);return true;
  }
  launchChains(guitar,shaft={x:20,y:20,width:760,height:860}){
    this.chainDarts=[];this.chainBreaks=[0,0,0];
    for(const p of this.getLivePoints()){p.chainIndex=null;p.chainSlot=null;}
    const number=this.phase==='B'?3:1,per=number===3?30:54;
    const live=this.getLivePoints(),selected=live.slice(0,per*number);
    for(let i=0;i<number;i++){
      const fromEdge=number===3;
      const start=fromEdge?i===0?{x:shaft.x-65,y:guitar.pos.y-195}:
        i===1?{x:guitar.pos.x,y:shaft.y-65}:
        {x:shaft.x+shaft.width+65,y:guitar.pos.y-195}:
        {x:this.anchor.pos.x-40,y:this.anchor.pos.y+70};
      const dart=new ChainDart(start.x,start.y,i);
      dart.mode=fromEdge?'ARC':'SEEK';dart.slotCount=per;
      dart.arcTarget=fromEdge?i===0?{x:shaft.x+135,y:guitar.pos.y-135}:
        i===1?{x:guitar.pos.x+95,y:shaft.y+245}:
        {x:shaft.x+shaft.width-135,y:guitar.pos.y-135}:null;
      dart.target={x:guitar.pos.x+(fromEdge?(i-1)*70:0),y:guitar.pos.y};
      dart.tugProgress=0;dart.hitPlayer=false;this.chainDarts.push(dart);
    }
    selected.forEach((p,i)=>{p.chainIndex=Math.floor(i/per);p.chainSlot=i%per;});
  }
  returnChain(dart,reason){
    if(!dart||dart.isDead||dart.mode==='RETURN')return false;
    dart.mode='RETURN';dart.returnAge=0;dart.tugProgress=1;this.counterSeen=true;
    if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playCounter();
    if(typeof hud!=='undefined'&&hud)hud.addPopup(reason+' · RETURN!',dart.pos.x,dart.pos.y-42,'#ffb4c4');
    return true;
  }
  reflectChains(sw){
    if(this.profile.key!=='ONYX'||!['A','B','RECOVER'].includes(this.phase))return 0;
    let count=0;
    for(const dart of this.chainDarts){
      if(dart.isDead||dart.mode==='RETURN'||dart.tugProgress<.82||sw.chargeRatio<.65)continue;
      if(Math.hypot(sw.pos.x-dart.pos.x,sw.pos.y-dart.pos.y)>sw.radius+75)continue;
      if(this.returnChain(dart,'TUG WON'))count++;
    }
    return count;
  }
  updateChains(dt,guitar,shaft){
    for(const dart of this.chainDarts){
      if(dart.isDead)continue;
      if(dart.mode==='ARC'&&dart.age>.85)dart.mode='SEEK';
      if(dart.mode==='SEEK'){
        dart.target={x:guitar.pos.x,y:guitar.pos.y-42};
        if((dart.age>1.1&&Math.hypot(dart.pos.x-dart.target.x,dart.pos.y-dart.target.y)<145)||dart.age>2.2){
          dart.mode='HOLD';dart.target={x:dart.pos.x,y:dart.pos.y};
        }
      }
      const target=dart.mode==='RETURN'?this.anchor.pos:dart.mode==='ARC'?dart.arcTarget:dart.target;
      dart.updateDart(dt,target);
      if(dart.mode==='HOLD'){
        const near=Math.hypot(guitar.pos.x-dart.pos.x,guitar.pos.y-dart.pos.y)<160;
        dart.tugProgress=Math.max(0,Math.min(1,dart.tugProgress+(guitar.isCharging&&near?dt/0.8:-dt*.45)));
      }
      if(dart.mode==='RETURN'&&Math.hypot(dart.pos.x-this.anchor.pos.x,dart.pos.y-this.anchor.pos.y)<55){
        dart.isDead=true;const hits=this.damageReserve(24,this.anchor.pos);reactRuler(this.anchor);
        this.staggerTimer=Math.max(this.staggerTimer,.75);
        if(typeof spawnSparks==='function')spawnSparks(this.anchor.pos.x,this.anchor.pos.y,'#ff718f',20);
        if(typeof hud!=='undefined'&&hud)hud.addPopup('DISCORD RECOILS · -'+hits,
          this.anchor.pos.x,this.anchor.pos.y-90,'#ff718f');
      }
      if(dart.mode==='RETURN')dart.returnAge=(dart.returnAge||0)+dt;
      if((dart.mode==='RETURN'&&dart.returnAge>4)||(dart.mode!=='RETURN'&&dart.age>6)||
        dart.pos.x<shaft.x-150||dart.pos.x>shaft.x+shaft.width+150)dart.isDead=true;
      if(dart.isDead)for(const link of this.getLivePoints())if(link.chainIndex===dart.index){link.chainIndex=null;link.chainSlot=null;}
    }
  }
  launchEcho(guitar){
    if(this.echoes.filter(e=>!e.isDead).length>=3)return;
    const fan=this.phase==='B'?(this.echoLaunches-1)*125:0;
    const e=new EchoPulse(this.anchor.pos.x,this.anchor.pos.y+70,{x:guitar.pos.x+fan,y:guitar.pos.y},this.echoTune);
    this.echoes.push(e);this.echoLaunches++;
    if(typeof hud!=='undefined'&&hud)hud.addPopup('ECHO · '+e.tuning+' RETURNING',
      guitar.pos.x,guitar.pos.y-80,'#74d9ff');
  }
  reflectEchoes(sw){
    if(this.profile.key!=='NOVA')return 0;
    let count=0;
    for(const e of this.echoes){
      if(e.isDead||e.mode!=='SEEK'||sw.tuning.id!==e.tuning||sw.chargeRatio<.4)continue;
      if(Math.hypot(sw.pos.x-e.pos.x,sw.pos.y-e.pos.y)>sw.radius+e.r+24)continue;
      e.mode='RETURN';count++;this.counterSeen=true;
      if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playCounter();
      if(typeof hud!=='undefined'&&hud)hud.addPopup('ECHO REVERSED',e.pos.x,e.pos.y-35,'#74d9ff');
    }
    return count;
  }
  updateEchoes(dt,guitar){
    for(const e of this.echoes){
      if(e.isDead)continue;e.updatePulse(dt,this.anchor.pos);
      if(e.mode==='RETURN'&&Math.hypot(e.pos.x-this.anchor.pos.x,e.pos.y-this.anchor.pos.y)<55){
        e.isDead=true;const core=this.creditCoreReturn('ECHO RETURN');
        const hits=core?0:this.damageReserve(22,this.anchor.pos);reactRuler(this.anchor);
        this.staggerTimer=Math.max(this.staggerTimer,.75);
        if(typeof hud!=='undefined'&&hud)hud.addPopup('ECHO COLLAPSE · -'+hits,
          this.anchor.pos.x,this.anchor.pos.y-90,'#74d9ff');
      }else if(e.mode==='SEEK'&&Math.hypot(e.pos.x-e.target.x,e.pos.y-e.target.y)<32){
        e.targetReachedTimer=(e.targetReachedTimer||0)+dt;
        if(e.targetReachedTimer>.45)e.isDead=true;
      }
    }
    this.echoes=this.echoes.filter(e=>!e.isDead);
  }
  launchDiamond(guitar){
    const offset=this.diamondLaunches%2?58:-58;
    const d=new CadenceDiamond(this.anchor.pos.x+offset,this.anchor.pos.y+55,guitar.pos);
    this.diamonds.push(d);this.diamondLaunches++;
    if(typeof hud!=='undefined'&&hud)hud.addPopup('DIAMOND LOCK · DODGE TO RETURN',guitar.pos.x,guitar.pos.y-80,'#efd48b');
  }
  updateDiamonds(dt,guitar){
    for(const d of this.diamonds){
      if(d.isDead)continue;
      d.updateDiamond(dt,guitar,this.anchor.pos);
      if(d.mode==='RETURN'&&Math.hypot(d.pos.x-this.anchor.pos.x,d.pos.y-this.anchor.pos.y)<58){
        d.isDead=true;const core=this.creditCoreReturn('DIAMOND RETURN');
        const hits=core?0:this.damageReserve(20,this.anchor.pos);
        this.staggerTimer=Math.max(this.staggerTimer,.7);
        if(typeof hud!=='undefined'&&hud&&!core)hud.addPopup('DIAMOND RETURN · -'+hits,this.anchor.pos.x,this.anchor.pos.y-95,'#efd48b');
      }
    }
    this.diamonds=this.diamonds.filter(d=>!d.isDead);
  }
  onPlayerBlast(sw){
    if(this.phase==='EXPOSED'||this.phase==='DEFEAT')return false;
    if(this.profile.key==='NOVA'){this.echoTune=sw.tuning.id;return false;}
    if(this.profile.key!=='CADENCE'||!['A','B'].includes(this.phase))return false;
    const period=1.2,beat=Math.round(this.beatClock/period);
    const timing=Math.abs(this.beatClock-beat*period);
    const tune=this.phase==='A'?this.profile.attackATune:this.profile.attackBTune;
    if(timing>.24||sw.tuning.id!==tune||sw.chargeRatio<.4||beat===this.lastCounterBeat)return false;
    this.lastCounterBeat=beat;this.staggerTimer=.8;this.counterSeen=true;
    if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playCounter();
    const hits=this.damageReserve(23,this.anchor.pos);reactRuler(this.anchor);
    if(typeof hud!=='undefined'&&hud)hud.addPopup('PERFECT BEAT · -'+hits,
      this.anchor.pos.x,this.anchor.pos.y-90,'#e9cf8b');
    return true;
  }
  getAct(){const ratio=this.getLivePoints().length/this.initialPointCount;return ratio<=1/3?3:ratio<=2/3?2:1;}
  getGuide(){
    const act=this.getAct(),kicker=this.profile.name+' · ACT '+act;
    if(this.phase==='ENTRANCE')return {kicker,action:'READ THE RULER',detail:'The first attack gives you time to learn.',progress:0};
    if(this.phase==='EXPOSED')return {kicker:this.profile.name+' · FINALE',
      action:this.profile.key==='CADENCE'?'DODGE THE DIAMOND · GUIDE IT BACK':'PARRY THE BLUE FIRE BACK',
      detail:this.profile.coreTune+' direct blasts also hurt. '+(this.coreHitsRequired-this.coreHits)+' hits remain.'+
        (this.profile.key==='NOVA'?' Blue fire reforms in '+Math.ceil(Math.max(0,7.5-this.phaseTimer))+'s.':''),
      progress:this.profile.key==='NOVA'?this.phaseTimer/7.5:this.coreHits/this.coreHitsRequired};
    if(this.phase==='DEFEAT')return {kicker,action:'SOVEREIGN BROKEN',detail:'The ascent continues.',progress:1};
    if(this.phase==='RECOVER'&&!this.chainDarts.some(d=>!d.isDead&&d.mode==='HOLD')&&!this.echoes.some(e=>!e.isDead&&e.mode==='SEEK'))
      return {kicker,action:this.counterSeen?'COUNTER LANDED · RECHARGE':'DIRECT HIT · CHIP THE RULER',detail:'Open body shots remove a few particles.',progress:0};
    if(this.profile.key==='ONYX'){
      const held=this.chainDarts.find(d=>!d.isDead&&d.mode==='HOLD');
      if(held)return {kicker,action:'HOLD CLICK NEAR THE RED TIP',detail:'Build TUG, then RELEASE to return the dart.',progress:held.tugProgress};
      return {kicker,action:this.phase.endsWith('_WARN')?'RED TRIANGLE INCOMING':
        this.phase==='B'?'EDGE DARTS CURVE IN · BREAK / TUG':'BREAK CHAIN LINKS · OR TUG THE TIP',
        detail:'Break enough links to turn the dart back.',progress:0};
    }
    if(this.profile.key==='NOVA'){const echo=this.echoes.find(e=>!e.isDead&&e.mode==='SEEK');
      return {kicker,action:echo?'MATCH '+echo.tuning+' · PARRY THE BLUE FIRE':'WATCH THE BLUE FIRE',
        detail:echo?'Switch tuning, charge, and release into the pulse.':'It repeats the tuning of your last blast.',progress:echo?Math.min(1,echo.age/3):0};
    }
    if(this.phase==='RECOVER')return {kicker,action:'CATCH THE NEXT BEAT',detail:'Reposition and recharge for the next measure.',progress:0};
    if(this.phase==='B'&&this.diamonds.some(d=>!d.isDead&&d.mode!=='RETURN'))return {
      kicker,action:'DODGE THE LOCKED DIAMOND',detail:'Move after it commits. The missed diamond curves back into Cadence.',progress:Math.min(1,this.phaseTimer/3)};
    const tune=this.phase.startsWith('B')?'HIGH':'LOW',phase=this.beatClock%1.2;
    return {kicker,action:'SET '+tune+' · RELEASE ON THE METRONOME FLASH',detail:'The pendulum marks the beat. Counter as the weight reaches its mark.',progress:phase/1.2};
  }
  getHint(){
    if(this.phase==='EXPOSED')return this.profile.key==='CADENCE'?'DODGE THE DIAMOND · RETURN IT':'PARRY BLUE FIRE · RETURN IT';
    if(this.profile.key==='ONYX')return this.phase.endsWith('_WARN')?'CHAIN DART INCOMING':
      this.chainDarts.some(d=>!d.isDead&&d.mode==='HOLD')?'HOLD CHARGE NEAR TIP · RELEASE':'MID · BREAK LINKS / RETURN DART';
    if(this.profile.key==='NOVA')return 'MATCH ECHO COLOUR · PARRY';
    return this.phase==='B'?'DODGE DIAMONDS · RETURN THEM': 'FIRE '+(this.phase.startsWith('B')?'HIGH':'LOW')+' ON THE FLASH';
  }
  update(dt,guitar,shaft){
    if(this.isDead)return;
    this.phaseTimer+=dt;this.staggerTimer=Math.max(0,this.staggerTimer-dt);
    if(this.phase==='RECOVER'&&!this.regeneratedThisRecovery&&this.phaseTimer>=.65){this.regeneratedThisRecovery=true;this.regenerate();}this.hitFlash=Math.max(0,this.hitFlash-dt);
    const act=this.getAct();if(act>this.lastAct){this.lastAct=act;this.staggerTimer=Math.max(this.staggerTimer,.7);
      if(typeof hud!=='undefined'&&hud)hud.addPopup('ACT '+(act===2?'II':'III')+' · THE FORM FRACTURES',
        this.anchor.pos.x,this.anchor.pos.y-115,this.profile.color);
      if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playWarning(this.profile.key);
    }
    const a=this.anchor;
    if(this.phase==='DEFEAT'){
      this.defeatTimer+=dt;
      a.applyForce(a.arrive(createVector(shaft.x+shaft.width/2,shaft.y+140)));a.update();
      if(this.defeatTimer>=2.4){this.isDead=true;this.isCleared=true;a.isDead=true;}
      return;
    }
    if(this.phase==='EXPOSED'){
      if(this.pendingCoreHits>0&&this.phaseTimer-this.lastCoreHitAt>=.65){
        this.pendingCoreHits--;this.hitCore('RETURNED ATTACK');
      }
      if(this.phase==='DEFEAT')return;
      a.applyForce(a.arrive(createVector(shaft.x+shaft.width/2+Math.sin(this.phaseTimer*1.3)*55,shaft.y+shaft.height*.61)));a.update();
      if(this.profile.key==='NOVA'){
        if(this.phaseTimer>=this.echoLaunches*2+.4&&this.echoes.filter(e=>!e.isDead).length<2)
          this.launchEcho(guitar);
        this.updateEchoes(dt,guitar);
      }
      if(this.profile.key==='CADENCE'){
        if(this.phaseTimer>=this.diamondLaunches*2+.5&&this.diamonds.filter(d=>!d.isDead).length<2)
          this.launchDiamond(guitar);
        this.updateDiamonds(dt,guitar);
      }
      if(this.profile.key==='NOVA'&&this.phase==='EXPOSED'&&this.phaseTimer>=7.5&&this.pendingCoreHits===0){
        const restored=this.regenerate(52,true);
        this.phase='A_WARN';this.phaseTimer=0;this.anchor.phase='A_WARN';this.nextAttack='A_WARN';
        this.echoLaunches=0;
        if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playWarning('NOVA');
        this.focus={x:Math.max(shaft.x+245,Math.min(shaft.x+shaft.width-245,guitar.pos.x)),
          y:Math.max(shaft.y+360,Math.min(shaft.y+shaft.height-220,guitar.pos.y))};
        if(typeof hud!=='undefined'&&hud)hud.addPopup('BLUE FIRE REFORMS · +'+restored,a.pos.x,a.pos.y-105,this.profile.color);
      }
      return;
    }
    const attackSpan=this.getAct()===3?3.0:this.getAct()===2?3.2:3.4;
    const durations={ENTRANCE:3,A_WARN:1.5,A:attackSpan,B_WARN:1.5,B:attackSpan,RECOVER:1.3};
    if(this.phaseTimer>=durations[this.phase]){
      const previous=this.phase;this.phaseTimer=0;
      if(previous==='ENTRANCE')this.phase='A_WARN';
      else if(previous==='A_WARN')this.phase='A';
      else if(previous==='B_WARN')this.phase='B';
      else if(previous==='A'||previous==='B'){this.phase='RECOVER';this.regeneratedThisRecovery=false;this.nextAttack=previous==='A'?'B_WARN':'A_WARN';}
      else this.phase=this.nextAttack;
      if(this.phase.endsWith('_WARN')){
        if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playWarning(this.profile.key);
        this.focus={x:Math.max(shaft.x+245,Math.min(shaft.x+shaft.width-245,guitar.pos.x)),
          y:Math.max(shaft.y+360,Math.min(shaft.y+shaft.height-220,guitar.pos.y))};
      }
      if(this.phase==='A'||this.phase==='B'){
        this.cycle++;
        if(this.profile.key==='ONYX')this.launchChains(guitar,shaft);
        if(this.profile.key==='NOVA')this.echoLaunches=0;
        if(this.profile.key==='CADENCE'){this.beatClock=0;this.lastCounterBeat=-1;this.diamondLaunches=0;}
      }
    }
    a.phase=this.phase;a.beatClock=this.beatClock;
    const target={x:shaft.x+shaft.width/2+Math.sin(this.cycle*.9+this.phaseTimer*.7)*90,y:shaft.y+155};
    a.applyForce(a.arrive(createVector(target.x,target.y)));a.update();
    if(this.phase==='ENTRANCE'){
      this.arrival.target={x:a.pos.x,y:Math.max(shaft.y+195,a.pos.y)};this.arrival.updateVision(dt);
    }
    if(this.profile.key==='ONYX')this.updateChains(dt,guitar,shaft);
    if(this.profile.key==='NOVA'){
      if(this.phase==='A'||this.phase==='B'){
        const times=this.phase==='A'?[.15,1.4,2.55]:[.15,1.25,2.35];
        if(this.echoLaunches<times.length&&this.phaseTimer>=times[this.echoLaunches])this.launchEcho(guitar);
      }
      this.updateEchoes(dt,guitar);
    }
    if(this.profile.key==='CADENCE'&&['A','B'].includes(this.phase)){
      if(this.phase==='B'&&this.phaseTimer>=this.diamondLaunches*1.35+.6&&this.diamondLaunches<2)this.launchDiamond(guitar);
      const oldBeat=Math.floor(this.beatClock/1.2);this.beatClock+=dt;
      if(Math.floor(this.beatClock/1.2)>oldBeat&&typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playBeat();
    }
    if(this.profile.key==='CADENCE')this.updateDiamonds(dt,guitar);
    const center=this.phase==='ENTRANCE'||this.phase==='RECOVER'?a.pos:this.focus;
    const tune=this.phase.startsWith('A')?this.profile.attackATune:this.profile.attackBTune;
    for(const p of this.getLivePoints()){
      const dart=p.chainIndex!=null?this.chainDarts[p.chainIndex]:null;
      if(dart&&!dart.isDead){
        const per=dart.slotCount||54,u=(p.chainSlot+1)/(per+1);
        const sway=Math.sin(u*Math.PI)*Math.sin(this.phaseTimer*8+u*12)*10;
        p.homeTarget.x=a.pos.x+(dart.pos.x-a.pos.x)*u+sway;
        p.homeTarget.y=a.pos.y+(dart.pos.y-a.pos.y)*u;
        p.resonance='MID';p.dangerous=dart.mode==='SEEK'&&this.staggerTimer===0&&!(this.cycle===1&&this.phase==='A'&&this.phaseTimer<1.4);
      }else{
        const animationTime=this.profile.key==='CADENCE'&&['A','B'].includes(this.phase)?this.beatClock:this.phaseTimer;
        const slot=rulerShapeSlot(this.profile.key,this.phase,p.bossSlotIndex,this.initialPointCount,animationTime);
        p.homeTarget.x=center.x+slot.x;p.homeTarget.y=center.y+slot.y;
        p.resonance=tune;
        const beatDanger=this.profile.key!=='CADENCE'||Math.min(this.beatClock%1.2,1.2-this.beatClock%1.2)<.24;
        p.dangerous=(this.phase==='A'||this.phase==='B')&&this.staggerTimer===0&&beatDanger&&!(this.cycle===1&&this.phase==='A'&&this.phaseTimer<1.4);
      }
      p.maxSpeed=this.phase==='A'||this.phase==='B'?11:9;
    }
  }
  show(){
    if(this.isDead)return;
    const c=drawingContext;
    if(this.phase.endsWith('_WARN')){
      c.save();c.strokeStyle=this.profile.color;c.globalAlpha=.75;c.lineWidth=2;c.setLineDash([6,7]);
      c.beginPath();c.arc(this.focus.x,this.focus.y,225,0,Math.PI*2);c.stroke();c.setLineDash([]);
      c.fillStyle=this.profile.color;c.font='bold 14px monospace';c.textAlign='center';
      c.fillText(this.getHint(),this.focus.x,this.focus.y-240);
      if(this.profile.key==='ONYX'&&this.phase==='B_WARN'){
        c.strokeStyle='#ff718f';c.lineWidth=2;c.setLineDash([8,8]);
        for(const side of [-1,1]){c.beginPath();
          c.moveTo(this.focus.x+side*390,this.focus.y-180);
          c.quadraticCurveTo(this.focus.x+side*240,this.focus.y-260,
            this.focus.x+side*85,this.focus.y-30);c.stroke();}
        c.beginPath();c.moveTo(this.focus.x,this.focus.y-390);
        c.quadraticCurveTo(this.focus.x+105,this.focus.y-220,this.focus.x,this.focus.y-65);c.stroke();
        c.setLineDash([]);
      }
      c.restore();
    }
    if(this.profile.key==='ONYX'&&this.chainDarts.length){
      c.save();c.strokeStyle='#ff315c';c.shadowColor='#ff315c';c.shadowBlur=13;c.lineWidth=2;
      for(const dart of this.chainDarts){
        if(dart.isDead)continue;
        const links=this.getLivePoints().filter(p=>p.chainIndex===dart.index).sort((a,b)=>a.chainSlot-b.chainSlot);
        c.beginPath();c.moveTo(this.anchor.pos.x,this.anchor.pos.y);
        for(const p of links)c.lineTo(p.pos.x,p.pos.y);
        c.lineTo(dart.pos.x,dart.pos.y);c.stroke();
        if(dart.mode==='ARC'){
          c.setLineDash([6,8]);c.globalAlpha=.7;c.beginPath();
          c.moveTo(dart.pos.x,dart.pos.y);
          c.quadraticCurveTo(dart.arcTarget.x,dart.arcTarget.y-85,
            dart.arcTarget.x,dart.arcTarget.y);c.stroke();c.setLineDash([]);c.globalAlpha=1;
        }
        if(dart.mode==='HOLD'){c.fillStyle='#ffe3e9';c.font='bold 11px monospace';c.textAlign='center';
          c.fillText('TUG '+Math.round(dart.tugProgress*100)+'%',dart.pos.x,dart.pos.y-35);}
      }c.restore();
    }
    if(this.profile.key==='NOVA'){
      c.save();c.strokeStyle='#74d9ff';c.globalAlpha=.36;c.setLineDash([5,7]);
      for(const e of this.echoes)if(!e.isDead&&e.mode==='WARN'){
        c.beginPath();c.moveTo(e.pos.x,e.pos.y);c.lineTo(e.target.x,e.target.y);c.stroke();}
      c.restore();
    }
    if(this.profile.key==='CADENCE'&&['A','B'].includes(this.phase)){
      const phase=this.beatClock%1.2,pulse=1-Math.min(1,phase/1.2);
      const theta=Math.sin(this.beatClock/1.2*Math.PI*2)*.62;
      c.save();c.strokeStyle=this.profile.color;c.lineWidth=3;c.globalAlpha=.35+pulse*.65;
      c.beginPath();c.arc(this.anchor.pos.x,this.anchor.pos.y,40+pulse*48,0,Math.PI*2);c.stroke();
      c.lineWidth=2;c.globalAlpha=.75;
      for(const side of (this.phase==='B'?[-1,1]:[0])){
        const pivotX=this.focus.x+side*(this.phase==='B'?125:0),pivotY=this.focus.y-155;
        const swing=this.phase==='B'?side*theta:theta;
        if(side===0){c.beginPath();c.moveTo(pivotX-175,pivotY+270);
          c.lineTo(pivotX,pivotY);c.lineTo(pivotX+175,pivotY+270);c.closePath();c.stroke();}
        c.lineWidth=5;c.beginPath();c.moveTo(pivotX,pivotY);
        c.lineTo(pivotX+Math.sin(swing)*225,pivotY+Math.cos(swing)*225);c.stroke();
        c.beginPath();c.arc(pivotX+Math.sin(swing)*225,pivotY+Math.cos(swing)*225,15,0,Math.PI*2);c.stroke();
      }
      c.fillStyle=this.profile.color;c.font='bold 12px monospace';c.textAlign='center';
      c.fillText(phase<.24||phase>1.2-.24?'NOW':'WAIT FOR THE FLASH',this.anchor.pos.x,this.anchor.pos.y-120);c.restore();
    }
    if(this.phase==='EXPOSED'){
      c.save();c.strokeStyle=this.profile.color;c.lineWidth=2;c.textAlign='center';
      for(let i=0;i<this.coreHitsRequired-this.coreHits;i++){c.globalAlpha=.75-i*.2;c.beginPath();
        c.arc(this.anchor.pos.x,this.anchor.pos.y,45+i*14+Math.sin(this.phaseTimer*3+i)*3,0,Math.PI*2);c.stroke();}
      c.globalAlpha=1;c.fillStyle=this.profile.color;c.font='bold 14px monospace';
      c.fillText(this.profile.coreTune+' / '+(this.coreHitsRequired-this.coreHits)+' CORE HITS'+
        (this.profile.key==='NOVA'?' · '+Math.ceil(Math.max(0,7.5-this.phaseTimer))+'s':''),
        this.anchor.pos.x,this.anchor.pos.y-115);c.restore();
    }
    if(this.phase==='DEFEAT'){c.save();c.globalAlpha=Math.max(0,1-this.defeatTimer/2.4);
      this.anchor.show();c.restore();return;}
    for(const p of this.points)p.show();
    for(const dart of this.chainDarts)dart.show();
    for(const e of this.echoes)e.show();
    if(this.profile.key==='CADENCE')for(const d of this.diamonds)if(!d.isDead&&d.mode==='WARN'){
      c.save();c.strokeStyle='#efd48b';c.globalAlpha=.55+.3*Math.sin(d.age*18)**2;
      c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();c.moveTo(d.pos.x,d.pos.y);
      c.lineTo(d.lock.x,d.lock.y);c.stroke();c.setLineDash([]);
      c.beginPath();c.arc(d.lock.x,d.lock.y,28,0,Math.PI*2);c.stroke();c.restore();
    }
    for(const d of this.diamonds)d.show();
    drawBossArrival(this,c);
    if(this.hitFlash>0){c.save();c.globalAlpha=this.hitFlash/.22*.8;c.strokeStyle=this.profile.color;c.lineWidth=4;
      c.beginPath();c.arc(this.anchor.pos.x,this.anchor.pos.y,54+(1-this.hitFlash/.22)*26,0,Math.PI*2);c.stroke();c.restore();}
  }
}
if(typeof module!=='undefined')module.exports={RulerBossController};
