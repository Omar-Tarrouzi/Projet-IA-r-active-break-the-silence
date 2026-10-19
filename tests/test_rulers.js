const test=require('node:test'),assert=require('node:assert/strict'),h=require('./harness.cjs');
const shaft={x:20,y:20,width:760,height:860};
test('Three new rulers have distinct finite steering formations and visible Vehicle bodies',()=>{
  assert.equal(Object.getPrototypeOf(h.RulerBoss),h.Vehicle);
  const signatures=new Set();
  for(const word of ['MUTE','ECHO','MEASURE']){
    const b=new h.RulerBossController(400,100,{bossWord:word}),g=new h.Guitar(400,680);
    assert.equal(b.points.length,128);
    assert.equal(b.getLivePoints().length,128);
    const slot=h.rulerShapeSlot(b.profile.key,'A',17,128,1);
    signatures.add(JSON.stringify(slot));
    let max=0;const force=b.anchor.applyForce.bind(b.anchor);
    b.anchor.applyForce=f=>{max=Math.max(max,Math.hypot(f.x,f.y));force(f);};
    const seen=new Set();for(let i=0;i<1000;i++) {b.update(1/60,g,shaft);seen.add(b.phase);}
    assert.ok(seen.has('A_WARN')&&seen.has('A')&&seen.has('B_WARN')&&seen.has('B'),word);
    assert.ok(max<=b.anchor.maxForce+1e-9);
    assert.ok(b.getLivePoints().every(p=>Number.isFinite(p.homeTarget.x)&&Number.isFinite(p.homeTarget.y)));
    b.damagePoint(b.points[0]);assert.equal(b.getLivePoints().length,127);
    assert.equal(b.points.length,128);
  }
  assert.equal(signatures.size,3);
});
test('Onyx falls with her chains; Nova and Cadence have counterable exposed finales',()=>{
 const g=new h.Guitar(400,680);
 for(const word of ['MUTE','ECHO','MEASURE']){
  const boss=new h.RulerBossController(400,100,{bossWord:word});
  boss.points.forEach(p=>p.isDead=true);boss.finishIfEmpty();
  if(word==='MUTE'){
   assert.equal(boss.phase,'DEFEAT');
  }else{
   assert.equal(boss.phase,'EXPOSED');
   const wave=()=>({pos:{x:boss.anchor.pos.x,y:boss.anchor.pos.y+100},radius:150,
    tuning:{id:boss.profile.coreTune,angle:Math.PI*2,force:1}});
   for(let i=0;i<3;i++){
    assert.equal(boss.strikeCore(wave()),true);assert.equal(boss.strikeCore(wave()),false);
    if(i<2)for(let frame=0;frame<42;frame++)boss.update(1/60,g,shaft);
   }
   assert.equal(boss.phase,'DEFEAT');
  }
  for(let i=0;i<150;i++)boss.update(1/60,g,shaft);
  assert.ok(boss.isDead&&boss.isCleared);
 }
});

test('Director stages all four bosses at their own altitude milestones',()=>{
  const d=new h.Director(10),score=new h.ScoreManager();
  for(const [word,alt] of [['HUSH',1000],['MUTE',2000],['ECHO',3000],['MEASURE',4000]]){
    score.altitude=alt;d.formations=[];d.restTimer=0;
    d.update(1/60,score,shaft,null);
    assert.equal(d.formations[0].bossWord,word);
    assert.equal(d.bossActive,true);
    d.onFormationCleared(d.formations[0],score,shaft);d.formations=[];
  }
});
test('Onyx chain requires a sustained nearby tug or fourteen broken links and returns limited damage',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'MUTE'}),g=new h.Guitar(400,200);
 assert.equal(Object.getPrototypeOf(h.ChainDart),h.Vehicle);
 b.phase='A';b.launchChains(g);const dart=b.chainDarts[0];dart.mode='HOLD';
 const sw=()=>({pos:{x:dart.pos.x,y:dart.pos.y},radius:55,chargeRatio:.9,tuning:{id:'HIGH',angle:Math.PI*2,force:1}});
 assert.equal(b.reflectChains(sw()),0);
 g.isCharging=true;for(let i=0;i<65;i++)b.updateChains(1/60,g,shaft);
 assert.ok(dart.tugProgress>=.82);assert.equal(b.reflectChains(sw()),1);
 for(let i=0;i<120;i++)b.updateChains(1/60,g,shaft);
 assert.ok(dart.isDead);assert.equal(b.getLivePoints().length,104);assert.equal(b.phase,'A');
 assert.ok(b.getLivePoints().every(p=>p.chainIndex===null));
 const second=new h.RulerBossController(400,100,{bossWord:'MUTE'});second.phase='A';second.launchChains(g);
 second.getLivePoints().filter(p=>p.chainIndex===0).slice(0,14).forEach(p=>second.damagePoint(p));
 assert.equal(second.chainDarts[0].mode,'RETURN');assert.ok(second.getLivePoints().length>=114);
});
test('Nova echoes the last tuning; matching parry sends only one bounded pulse back',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'ECHO'}),g=new h.Guitar(400,680);
 assert.equal(Object.getPrototypeOf(h.EchoPulse),h.Vehicle);
 b.phase='A';b.onPlayerBlast({tuning:{id:'MID'}});b.launchEcho(g);
 const e=b.echoes[0];assert.equal(e.tuning,'MID');e.mode='SEEK';
 const sw=id=>({pos:{x:e.pos.x,y:e.pos.y+60},radius:120,chargeRatio:.7,
   tuning:{id,angle:Math.PI*2,force:1},dirAngle:-Math.PI/2});
 assert.equal(b.reflectEchoes(sw('HIGH')),0);assert.equal(b.reflectEchoes(sw('MID')),1);
 assert.equal(b.reflectEchoes(sw('MID')),0);
 for(let i=0;i<120;i++)b.updateEchoes(1/60,g);
 assert.equal(b.getLivePoints().length,106);assert.equal(b.phase,'A');
});
test('Cadence rewards a correct release on the beat once, with readable off-beat failure',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'MEASURE'});b.phase='A';
 const sw=id=>({tuning:{id},chargeRatio:.7});
 b.beatClock=.65;assert.equal(b.onPlayerBlast(sw('LOW')),false);
 b.beatClock=1.2;assert.equal(b.onPlayerBlast(sw('HIGH')),false);
 assert.equal(b.onPlayerBlast(sw('LOW')),true);assert.equal(b.onPlayerBlast(sw('LOW')),false);
 assert.equal(b.getLivePoints().length,105);assert.ok(b.staggerTimer>0);
 b.phase='B';b.beatClock=2.4;b.lastCounterBeat=-1;
 assert.equal(b.onPlayerBlast(sw('LOW')),false);assert.equal(b.onPlayerBlast(sw('HIGH')),true);
 assert.equal(b.getLivePoints().length,82);
 const beatBoss=new h.RulerBossController(400,100,{bossWord:'MEASURE'}),g=new h.Guitar(400,680);
 beatBoss.phase='A';beatBoss.beatClock=.6;beatBoss.update(1/60,g,shaft);
 assert.ok(beatBoss.getLivePoints().every(p=>!p.dangerous));
 beatBoss.beatClock=1.18;beatBoss.update(1/60,g,shaft);
 assert.ok(beatBoss.getLivePoints().some(p=>p.dangerous));
});
test('Dart and echo locomotion applies bounded steering forces through Vehicle',()=>{
 for(const unit of [new h.ChainDart(400,100),new h.EchoPulse(400,100,{x:500,y:600},'MID')]){
  let max=0;const apply=unit.applyForce.bind(unit);unit.applyForce=f=>{max=Math.max(max,Math.hypot(f.x,f.y));apply(f)};
  for(let i=0;i<80;i++){if(unit instanceof h.ChainDart)unit.updateDart(1/60,{x:500,y:600});
    else unit.updatePulse(1/60,{x:400,y:100});}
  assert.ok(max<=unit.maxForce+1e-9);assert.ok(Number.isFinite(unit.pos.x)&&Number.isFinite(unit.pos.y));
 }
});

test('First ruler volley teaches its counter before contact can hurt',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'MUTE'}),g=new h.Guitar(400,680);
 b.phase='A';b.cycle=1;b.phaseTimer=.4;b.launchChains(g);
 b.update(1/60,g,shaft);
 assert.equal(b.getHazards().length,0);
 assert.ok(b.getLivePoints().every(p=>!p.dangerous));
 assert.match(b.getGuide().action,/CHAIN|TIP|RED/);
 b.phaseTimer=1.45;b.update(1/60,g,shaft);
 assert.ok(b.getLivePoints().some(p=>p.dangerous));
});
test('Ruler reserve crosses two readable acts and a counter cannot finish the boss',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'ECHO'}),g=new h.Guitar(400,680);
 assert.equal(b.getAct(),1);
 b.damageReserve(99);assert.equal(b.getLivePoints().length,100);
 b.damageReserve(99);assert.equal(b.getAct(),2);
 b.phase='A';b.update(1/60,g,shaft);assert.ok(b.staggerTimer>.6);
 b.damageReserve(99);b.damageReserve(99);assert.equal(b.getAct(),3);
 assert.ok(b.getLivePoints().length>0);assert.equal(b.phase,'A');
 b.update(1/60,g,shaft);assert.equal(b.lastAct,3);
});
test('Regular ascent opens with two distinct readable shapes',()=>{
 const d=new h.Director(123),g=new h.Guitar(400,680);
 d.spawnWave(shaft,null);assert.equal(d.formations[0].shapeKey,'ARROW');
 d.formations=[];d.spawnWave(shaft,null);assert.equal(d.formations[0].shapeKey,'HAMMER');
 const f=d.formations[0];f.phase='TELEGRAPH';f.update(1/60,g,shaft);
 assert.ok(f.warningTarget&&Number.isFinite(f.warningTarget.x));
});

test('Direct ruler shots chip only reachable non-guard phases once per wave',()=>{
 for(const word of ['MUTE','ECHO','MEASURE']){
  const b=new h.RulerBossController(400,100,{bossWord:word});
  const wave=()=>({pos:{x:400,y:300},radius:250,tuning:{id:'MID',angle:Math.PI*2,force:1},dirAngle:-Math.PI/2});
  b.phase='ENTRANCE';assert.equal(b.directHit(wave()),0);
  b.phase='A';const first=wave();assert.equal(b.directHit(first),3);assert.equal(b.directHit(first),0);
  b.phase='RECOVER';assert.equal(b.directHit(wave()),6);
  assert.equal(b.getLivePoints().length,119);
  assert.equal(b.directHit({pos:{x:400,y:800},radius:80,tuning:{id:'LOW',angle:Math.PI*2,force:1}}),0);
  b.phase='EXPOSED';assert.equal(b.directHit(wave()),0);
 }
});

test('Nova sends readable blue-fire volleys with bounded Vehicle trails and a spread finale',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'ECHO'}),g=new h.Guitar(400,680);
 b.phase='B';for(let i=0;i<3;i++)b.launchEcho(g);
 assert.deepEqual(b.echoes.map(e=>e.target.x),[275,400,525]);
 const e=b.echoes[0];for(let i=0;i<120;i++)e.updatePulse(1/60,b.anchor.pos);
 assert.equal(e.mode,'SEEK');assert.ok(e.flameTrail.length>0&&e.flameTrail.length<=7);
 assert.ok(e.flameTrail.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 assert.match(b.getGuide().action,/BLUE FIRE/);
});

test('Onyx return cannot expire on its original launch timer, and recovery restores a finite batch',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'MUTE'}),g=new h.Guitar(400,680);
 b.phase='A';b.launchChains(g);const dart=b.chainDarts[0];dart.age=5.95;
 b.returnChain(dart,'TEST');b.updateChains(1/60,g,shaft);
 assert.equal(dart.mode,'RETURN');assert.equal(dart.isDead,false);
 b.points.slice(60).forEach(p=>p.isDead=true);
 b.phase='RECOVER';b.phaseTimer=.64;b.update(1/60,g,shaft);
 assert.equal(b.getLivePoints().length,72);
 assert.equal(b.regenerationReserve,60);
 for(let i=0;i<25;i++)b.update(1/60,g,shaft);
 assert.equal(b.regenerationReserve,60);
});

test('Onyx has three edge-sweeping Vehicle darts before they seek, each with steered chain links',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'MUTE'}),g=new h.Guitar(400,680);
 b.phase='B';b.launchChains(g,shaft);
 assert.equal(b.chainDarts.length,3);
 assert.ok(b.chainDarts.every(d=>d instanceof h.ChainDart&&d.mode==='ARC'));
 assert.ok(b.chainDarts[0].pos.x<shaft.x&&b.chainDarts[2].pos.x>shaft.x+shaft.width);
 assert.ok(b.getLivePoints().filter(p=>p.chainIndex!=null).length===90);
 for(let i=0;i<60;i++)b.updateChains(1/60,g,shaft);
 assert.ok(b.chainDarts.every(d=>d.mode==='SEEK'));
});

test('Cadence swarm makes a swinging metronome bob and a mirrored double pendulum',()=>{
 const bob=t=>h.rulerShapeSlot('CADENCE','A',112,128,t);
 assert.ok(bob(.3).x>bob(.9).x+100);
 const left=h.rulerShapeSlot('CADENCE','B',1,128,.3);
 const right=h.rulerShapeSlot('CADENCE','B',0,128,.3);
 assert.ok(left.x<right.x);
});

test('Cadence diamonds remain Vehicle-steered, miss a dodging guitar, and strike her exposed core',()=>{
 const boss=new h.RulerBossController(400,100,{bossWord:'MEASURE'}),g=new h.Guitar(400,680);
 boss.points.forEach(p=>p.isDead=true);boss.finishIfEmpty();
 boss.launchDiamond(g);const d=boss.diamonds[0];assert.equal(Object.getPrototypeOf(h.CadenceDiamond),h.Vehicle);
 g.pos.x=530;let max=0;const apply=d.applyForce.bind(d);
 d.applyForce=f=>{max=Math.max(max,Math.hypot(f.x,f.y));apply(f);};
 let returned=false;for(let i=0;i<320;i++){
  boss.updateDiamonds(1/60,g);if(d.mode==='RETURN')returned=true;
  if(d.isDead)break;
 }
 assert.ok(returned);assert.ok(max<=d.maxForce+1e-9);
 assert.equal(boss.coreHits,1);
});
test('Nova keeps blue fire during exposure and a return damages the core',()=>{
 const boss=new h.RulerBossController(400,100,{bossWord:'ECHO'}),g=new h.Guitar(400,680);
 boss.points.forEach(p=>p.isDead=true);boss.finishIfEmpty();
 for(let i=0;i<36;i++)boss.update(1/60,g,shaft);
 assert.ok(boss.echoes.length>0);
 const e=boss.echoes[0];e.mode='RETURN';
 for(let i=0;i<180&&boss.coreHits===0;i++)boss.updateEchoes(1/60,g);
 assert.equal(boss.coreHits,1);
});

test('Cadence launches diamonds in the finale and close-together returns both count',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'MEASURE'}),g=new h.Guitar(400,680);
 b.phase='B';b.diamondLaunches=2;b.points.forEach(p=>p.isDead=true);b.finishIfEmpty();
 for(let i=0;i<40;i++)b.update(1/60,g,shaft);
 assert.ok(b.diamonds.length>0);
 b.creditCoreReturn('FIRST');b.creditCoreReturn('SECOND');
 assert.equal(b.coreHits,1);assert.equal(b.pendingCoreHits,1);
 for(let i=0;i<43;i++)b.update(1/60,g,shaft);
 assert.equal(b.coreHits,2);assert.equal(b.pendingCoreHits,0);
});

test('Nova reforms a finite shield after exposure while core damage persists',()=>{
 const b=new h.RulerBossController(400,100,{bossWord:'ECHO'}),g=new h.Guitar(400,680);
 b.points.forEach(p=>p.isDead=true);b.finishIfEmpty();
 assert.equal(b.phase,'EXPOSED');assert.equal(b.hitCore('TEST'),true);
 for(let i=0;i<Math.ceil(7.5*60)+3;i++)b.update(1/60,g,shaft);
 assert.equal(b.phase,'A_WARN');assert.equal(b.coreHits,1);
 assert.equal(b.getLivePoints().length,52);
 b.points.forEach(p=>p.isDead=true);b.finishIfEmpty();
 assert.equal(b.phase,'EXPOSED');assert.equal(b.coreHits,1);
});
