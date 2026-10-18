// Autonomous presentation controller: chooses goals and existing player actions.
// It never writes Vehicle position, velocity or acceleration.
class DemoPilot {
 constructor(chapter='ASCENT'){this.chapter=chapter;this.time=0;this.cooldown=0;this.shots=0;this.lastAction='SEEK';}
 // Presentation pace changes the climb clock, never a Vehicle's locomotion.
 climbSpeed(normalSpeed){return Math.max(normalSpeed,this.time<7?70:100);}
 decide(dt,guitar,score,formations,pickups,shaft){
  this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
  const boss=formations.find(f=>f.isBoss&&!f.isDead),live=formations.filter(f=>!f.isDead),
    regular=live.find(f=>!f.isBoss),pickup=pickups.find(p=>!p.isDead&&p.pos.y>shaft.y+shaft.height*.4);
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  let target={x:shaft.x+shaft.width/2+Math.sin(this.time*.58)*160,y:shaft.y+shaft.height*.69},
    tuning='MID',focus=null,hold=false,fire=false,power=.55,reason='ARRIVE';
  if(pickup&&!boss){target={x:pickup.pos.x,y:clamp(pickup.pos.y,shaft.y+shaft.height*.47,shaft.y+shaft.height*.83)};reason='PICKUP';}
  if(regular){
    const points=regular.getLivePoints();focus=points.length?points[Math.floor(points.length*.5)]:regular.anchor;
    tuning=['LOW','MID','HIGH'].includes(regular.shapeDef.resonance)?regular.shapeDef.resonance:
      ['HAND','JACKHAMMER','MURMURATION'].includes(regular.shapeKey)?'LOW':
      ['ARROW','SCISSORS'].includes(regular.shapeKey)?'HIGH':'MID';
    target={x:focus.pos.x,y:clamp(focus.pos.y+190,shaft.y+shaft.height*.48,shaft.y+shaft.height*.78)};
    reason=regular.phase==='STRIKE'?'DODGE':'FORMATION';
  }
  if(boss){
    focus=boss.anchor;const exposed=boss.phase==='EXPOSED';
    tuning=exposed?(boss.profile?.coreTune||'HIGH'):'HIGH';
    target={x:focus.pos.x,y:exposed?shaft.y+shaft.height*.45:
      clamp(focus.pos.y+260,shaft.y+shaft.height*.47,shaft.y+shaft.height*.74)};
    reason=exposed?'CORE':'BOSS';power=exposed?.95:.68;
    if(exposed&&boss.coreDangerous){target={x:clamp(guitar.pos.x+(guitar.pos.x<boss.coreAim.x?-145:145),shaft.x+35,shaft.x+shaft.width-35),y:shaft.y+shaft.height*.62};reason='EVADE';}
    if(!exposed&&boss.profile?.key==='ONYX'){
      const dart=boss.chainDarts.find(d=>!d.isDead&&d.mode==='HOLD');
      if(dart){focus=dart;tuning='MID';target={x:dart.pos.x,y:clamp(dart.pos.y+105,shaft.y+shaft.height*.47,shaft.y+shaft.height*.8)};
        hold=true;reason='TUG';power=.72;
        fire=dart.tugProgress>=.83&&guitar.chargeDuration>=.66&&this.cooldown===0;
      }else tuning=boss.phase.startsWith('B')?boss.profile.attackBTune:boss.profile.attackATune;
    }else if(!exposed&&boss.profile?.key==='NOVA'){
      const echo=boss.echoes.find(e=>!e.isDead&&e.mode==='SEEK');
      if(echo){focus=echo;tuning=echo.tuning;target={x:echo.pos.x,y:clamp(echo.pos.y+175,shaft.y+shaft.height*.47,shaft.y+shaft.height*.79)};reason='PARRY';}
      else tuning=boss.phase.startsWith('B')?boss.profile.attackBTune:boss.profile.attackATune;
    }else if(!exposed&&boss.profile?.key==='CADENCE'){
      tuning=boss.phase.startsWith('B')?boss.profile.attackBTune:boss.profile.attackATune;
      if(['A','B'].includes(boss.phase)){
        hold=true;reason='BEAT';
        const beat=boss.beatClock/1.2,nearest=Math.round(beat);
        fire=Math.abs(beat-nearest)<.11&&nearest!==boss.lastCounterBeat&&guitar.chargeDuration>=.42&&this.cooldown===0;
      }
    }else if(!exposed&&boss.missiles?.length){
      const missile=boss.missiles.find(m=>!m.reflected&&!m.exploded&&m.age>=m.launchDelay);
      if(missile){focus=missile.anchor;tuning=missile.resonance;target={x:focus.pos.x,y:clamp(focus.pos.y+190,shaft.y+shaft.height*.47,shaft.y+shaft.height*.78)};reason='PARRY';}
    }else if(!exposed&&boss.getLivePoints().length){
      const points=boss.getLivePoints();focus=points[Math.floor(points.length*.45)];
      tuning=focus.resonance||'HIGH';reason='FINITE';
    }
  }
  const danger=live.flatMap(f=>f.getLivePoints().filter(p=>p.dangerous&&Math.hypot(p.pos.x-guitar.pos.x,p.pos.y-guitar.pos.y)<94)).sort((a,b)=>
    Math.hypot(a.pos.x-guitar.pos.x,a.pos.y-guitar.pos.y)-Math.hypot(b.pos.x-guitar.pos.x,b.pos.y-guitar.pos.y))[0];
  if(danger&&reason!=='TUG'&&reason!=='BEAT'){
    target={x:clamp(guitar.pos.x+(guitar.pos.x<danger.pos.x?-135:135),shaft.x+35,shaft.x+shaft.width-35),
      y:clamp(guitar.pos.y+55,shaft.y+shaft.height*.49,shaft.y+shaft.height*.84)};
    reason='EVADE';
  }
  const dx=focus?focus.pos.x-guitar.pos.x:0,dy=focus?focus.pos.y-guitar.pos.y:0,dist=Math.hypot(dx,dy);
  const radius={LOW:230,MID:340,HIGH:580}[tuning]*(.4+.6*power);
  const cone=tuning==='HIGH'?Math.abs(dx)<Math.max(26,-dy*.18):tuning==='MID'?Math.abs(dx)<Math.max(95,-dy*1.45):true;
  if(!fire&&focus&&!danger&&this.cooldown===0&&score.canFireBlast(power)&&dist<radius*.91&&
    (dy<0||tuning==='LOW')&&cone&&reason!=='TUG'&&reason!=='BEAT'&&(!boss||boss.phase!=='ENTRANCE')&&
    (!boss||boss.phase!=='EXPOSED'||boss.profile||boss.coreVulnerable)&&
    (!regular||!['FORMING','TELEGRAPH','ENCORE_WARN'].includes(regular.phase)))fire=true;
  if(fire&&!score.canFireBlast(power))fire=false;
  this.lastAction=reason;
  if(fire){this.cooldown=reason==='BEAT'?.72:reason==='TUG'?1.3:2.05;this.shots++;}
  return {target,tuning,hold,fire,power,reason};
 }
}
if(typeof module!=='undefined')module.exports={DemoPilot};
