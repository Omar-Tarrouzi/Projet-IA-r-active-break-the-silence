const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const h=require('./harness.cjs');
const shaft={x:20,y:20,width:760,height:860};
test('New visible boss inherits the untouched course Vehicle',()=>assert.equal(Object.getPrototypeOf(h.Vesper),h.Vehicle));
test('Vesper keeps his fixed Vehicle swarm and takes three distinct hits during exposure',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.points.slice(0,180).forEach(p=>p.isDead=true);
 for(let i=0;i<800;i++)b.update(1/60,g,shaft);
 assert.equal(b.points.length,240);assert.ok(b.getLivePoints().length<=h.VESPER.regenerationCeiling);
 b.points.forEach(p=>p.isDead=true);b.finishIfEmpty();assert.equal(b.phase,'EXPOSED');
 const wave=()=>({pos:{x:b.anchor.pos.x,y:b.anchor.pos.y+100},radius:150,
  tuning:{id:'LOW',angle:Math.PI*2,force:1}});
 for(let i=0;i<h.VESPER.coreHitsRequired;i++){
  assert.equal(b.strikeCore(wave()),true);assert.equal(b.strikeCore(wave()),false);
  if(i<h.VESPER.coreHitsRequired-1)for(let frame=0;frame<42;frame++)b.update(1/60,g,shaft);
 }
 assert.equal(b.phase,'DEFEAT');
 for(let i=0;i<150;i++)b.update(1/60,g,shaft);assert.ok(b.isCleared&&b.isDead);
});

test('Boss visits ring, recall, shield and articulated hand phases',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680),seen=new Set();
 for(let i=0;i<1800;i++){b.update(1/60,g,shaft);seen.add(b.phase);}
 for(const p of ['ENTRANCE','ORBIT_WARN','ORBIT','RECALL','SHIELD','HAND_WARN','HAND','RECOVER'])assert.ok(seen.has(p),p);
});
test('Every boss force is bounded, locomotion uses Vehicle.update, input target is immutable',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 let calls=0,arrivalCalls=0;const original=h.Vehicle.prototype.update;
 h.Vehicle.prototype.update=function(){if(this===b.anchor)calls++;if(this===b.arrival)arrivalCalls++;
   return original.call(this);};
 const originalForce=b.anchor.applyForce;
 b.anchor.applyForce=function(f){assert.ok(Math.hypot(f.x,f.y)<=this.maxForce+1e-9);originalForce.call(this,f);};
 const before={x:g.pos.x,y:g.pos.y};
 try{for(let i=0;i<600;i++)b.update(1/60,g,shaft);}finally{h.Vehicle.prototype.update=original;}
 assert.equal(calls,600);assert.ok(arrivalCalls>0&&arrivalCalls<600);
 assert.deepEqual({x:g.pos.x,y:g.pos.y},before);
});
test('Near-complete rings share a narrow, rotating escape corridor',()=>{
 const gap=h.VESPER.ringGap;assert.ok(gap<.75&&gap>.4);
 for(let time=0;time<6;time+=.4){
  for(let ring=0;ring<3;ring++){
   const slots=80;const first=h.bossSlot('ORBIT',ring,240,time);
   const last=h.bossSlot('ORBIT',ring+(slots-1)*3,240,time);
   const center=Math.PI/2+time*h.VESPER.ringSpeeds[ring];
   const angle=p=>Math.atan2(p.y,p.x);
   const delta=a=>Math.atan2(Math.sin(a-center),Math.cos(a-center));
   assert.ok(Math.abs(Math.abs(delta(angle(first)))-gap/2)<1e-6);
   assert.ok(Math.abs(Math.abs(delta(angle(last)))-gap/2)<1e-6);
  }
 }
});
test('A boss at 1000m cannot be skipped by the next altitude band; normal waves wait',()=>{
 const d=new h.Director(1),score=new h.ScoreManager();score.altitude=1300;
 d.update(1/60,score,shaft);assert.equal(d.formations[0].bossWord,'HUSH');assert.equal(d.bossActive,true);
 const boss=d.formations[0];d.onFormationCleared(boss,score,shaft);assert.equal(d.bossDefeated.HUSH,true);
});
test('Pure steering and priority composition honor maxForce without mutating inputs',()=>{
 const v={x:8,y:-2},d={x:-15,y:9},before=JSON.stringify([v,d]);
 const f=h.velocityForce(v,d,.55);assert.ok(Math.hypot(f.x,f.y)<=.55000001);assert.equal(JSON.stringify([v,d]),before);
 assert.deepEqual(h.compose([{x:3,y:0},{x:0,y:3}],2),{x:2,y:0});
 assert.deepEqual(h.velocityForce(v,v,.5),{x:0,y:0});
});
test('Blast uses desired minus current velocity and actual entity force cap',()=>{
 const point={pos:{x:50,y:0},vel:{x:0,y:0},maxSpeed:5,maxForce:.35};
 const f=h.calculateBlastForce(point,{pos:{x:0,y:0},radius:100,tuning:{angle:Math.PI*2,force:1}});
 assert.ok(f.x>0);assert.ok(f.magnitude<=.350000001);
});
test('Fixed simulation gives identical updates at 30, 60 and 144Hz; stalls capped at three',()=>{
 for(const hz of [30,60,144]){const c=new h.FixedStep();let count=0;for(let i=0;i<hz;i++)c.advance(1/hz,()=>count++);assert.equal(count,60);}
 const c=new h.FixedStep();assert.equal(c.advance(10,()=>{}),3);c.reset();assert.equal(c.accumulator,0);
});
test('Spatial grid matches brute force including negative cells and reusable query buffer',()=>{
 const grid=new h.SpatialGrid(60),points=Array.from({length:500},(_,i)=>({pos:{x:(i*127.7)%1300-250,y:(i*73.1)%1000-150}})),scratch=[];
 points.forEach(p=>grid.insert(p));
 for(let i=0;i<points.length;i+=7){
  const p=points[i],expected=points.filter(q=>q!==p&&Math.hypot(q.pos.x-p.pos.x,q.pos.y-p.pos.y)<=70);
  assert.deepEqual(new Set(grid.queryNeighbors(p,70,scratch)),new Set(expected));
 }
 grid.clear();assert.equal(grid.queryNeighbors(points[0],70).length,0);
});
test('Dash and containment keep the player inside the viewport without coordinate writes',()=>{
 const g=new h.Guitar(70,700),score=new h.ScoreManager();
 g.performDash(createVector(-100,700),shaft,score);
 for(let i=0;i<180;i++){g.steerToCursor(createVector(-100,700),shaft);g.update(1/60,shaft);assert.ok(g.pos.x>=shaft.x&&g.pos.x<=shaft.x+shaft.width);}
});
test('Strict static audit includes constructors, component assignments and mutator methods',()=>{
 const root=path.resolve(__dirname,'..');
 function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(['tests','libraries','tools','vehicle.js'].includes(e.name))continue;
  const file=path.join(dir,e.name);if(e.isDirectory()){scan(file);continue;}if(!e.name.endsWith('.js'))continue;
  const code=fs.readFileSync(file,'utf8').split('\n').map(l=>l.split('//')[0]).join('\n');
  assert.ok(!/\.(?:pos|vel|acc)(?:\.[xy])?\s*(?:=(?!=)|[+*\/-]=|\+\+|--)/.test(code),file);
  assert.ok(!/\.(?:pos|vel|acc)\.(?:set|add|sub|mult|div|limit|normalize|rotate|setMag)\s*\(/.test(code),file);
 }}
 scan(root);
});

test('Hammer and scissors generate exact stable silhouettes and complete their strike cycle',()=>{
 const {generateHammerPoints,generateScissorsPoints,articulatedSlot}=require('../data/shapes.js');
 for(const fn of [generateHammerPoints,generateScissorsPoints]){
  const pts=fn(140);assert.equal(pts.length,140);assert.deepEqual(fn(140),pts);
  pts.forEach(p=>assert.ok(Math.abs(p.x)<=1&&Math.abs(p.y)<=1));
 }
 const p={x:.1,y:-.9,jaw:1};
 assert.ok(Math.abs(articulatedSlot('SCISSORS',p,1).x)<Math.abs(articulatedSlot('SCISSORS',p,0).x));
 for(const key of ['HAMMER','SCISSORS']){
   const f=new FormationController(key,400,60,{repeats:1}),g=new h.Guitar(400,650),seen=new Set();
   for(let i=0;i<600;i++){f.update(1/60,g,shaft);seen.add(f.phase);}
   for(const state of ['FORMING','TELEGRAPH','STRIKE','RECOVER','EXIT'])assert.ok(seen.has(state),key+state);
 }
});
test('A quiet one-frame clap triggers once; ambient noise does not; sustained sound remains HIGH',()=>{
 const {ClapDetector}=require('../systems/ClapDetector.js');
 const mic=new ClapDetector();let amplitude=0,claps=0,beams=0;
 mic.isListening=true;mic.dataArray=new Float32Array(2048);
 mic.analyser={getFloatTimeDomainData(a){a.fill(amplitude);}};
 mic.onClapCallback=()=>claps++;mic.onSustainedReleaseCallback=()=>beams++;
 for(let i=0;i<120;i++){amplitude=.02;mic.update(1/60);}assert.equal(claps,0);
 amplitude=.2;mic.update(1/60);amplitude=0;mic.update(1/60);assert.equal(claps,1);
 for(let i=0;i<30;i++)mic.update(1/60);
 amplitude=.24;for(let i=0;i<40;i++)mic.update(1/60);
 amplitude=0;mic.update(1/60);assert.equal(beams,1);assert.equal(claps,1);
});

test('Reflected missile removes exactly its damage budget and returns survivors',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.phase='MISSILE';b.phaseTimer=0;b.launchMissiles();
 const m=b.missiles[0];
 const blast={pos:{x:m.anchor.pos.x,y:m.anchor.pos.y+1},radius:5,tuning:{id:'MID',angle:Math.PI*2,force:1}};
 assert.equal(b.reflectMissiles(blast),1);
 b.phase='WORD_WARN'; // Reflected missiles must persist beyond the salvo.
 for(let i=0;i<180&&b.getLivePoints().length===240;i++)b.update(1/60,g,shaft);
 assert.equal(b.getLivePoints().length,240-h.VESPER.missileDamage);
 assert.ok(b.getLivePoints().filter(p=>p.bossSlotIndex%4===0).some(p=>p.missileIndex==null));
 assert.equal(b.points.length,240);
});
test('Words are cached particle slots and distinct attack phases',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 assert.equal(b.wordShapes.CHUT.length,240);assert.equal(b.wordShapes.SILENCE.length,240);
 const shape=b.wordShapes.CHUT;b.phase='WORD_WARN';b.currentAttackWord='CHUT';
 b.update(1/60,g,shaft);assert.equal(b.wordShapes.CHUT,shape);
 assert.ok(new Set(b.getLivePoints().map(p=>Math.round(p.homeTarget.x))).size>20);
 for(let i=0;i<130;i++)b.update(1/60,g,shaft);assert.equal(b.phase,'WORD_ATTACK');
 assert.ok(b.getLivePoints().some(p=>p.dangerous));
});

test('Vesper cycles through missiles and living words before repeating rings',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680),seen=new Set();
 for(let i=0;i<2900;i++){b.update(1/60,g,shaft);seen.add(b.phase);}
 for(const phase of ['MISSILE_WARN','MISSILE','WORD_WARN','WORD_ATTACK'])assert.ok(seen.has(phase),phase);
});
test('Travelling starlight uses bounded Vehicle steering and follows ascent speed',()=>{
 assert.equal(Object.getPrototypeOf(h.SpaceMote),h.Vehicle);
 const slow=new h.SpaceMote(100,0,1),fast=new h.SpaceMote(100,0,1);
 let max=0;const original=fast.applyForce.bind(fast);fast.applyForce=f=>{max=Math.max(max,Math.hypot(f.x,f.y));original(f);};
 for(let i=0;i<60;i++){slow.updateTravel(1);fast.updateTravel(8);}
 assert.ok(fast.pos.y>slow.pos.y+60);assert.ok(max<=fast.maxForce+1e-9);
});

test('Staggered missiles advertise MID and HIGH counters and never summon replacements',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.phase='MISSILE';b.launchMissiles();
 assert.equal(b.missileCount,4);assert.deepEqual(b.missiles.map(m=>m.resonance),['MID','HIGH','MID','HIGH']);
 b.update(1/60,g,shaft);assert.ok(b.getLivePoints().some(p=>p.resonance==='MID'));
 assert.ok(b.getLivePoints().some(p=>p.resonance==='HIGH'));
 assert.equal(b.points.length,240);
});

test('The finite swarm writes VESPER, forms a throne, and leaves damage holes',()=>{
 const throne=h.generateThronePoints(240),again=h.generateThronePoints(240);
 assert.equal(throne.length,240);assert.deepEqual(throne,again);
 assert.ok(Math.min(...throne.map(p=>p.x))<-140);
 assert.ok(Math.max(...throne.map(p=>p.x))>140);
 assert.ok(Math.min(...throne.map(p=>p.y))<-145);
 assert.ok(Math.max(...throne.map(p=>p.y))>130);
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 assert.equal(b.introWord.length,240);
 b.update(1/60,g,shaft);
 const written={...b.points[0].homeTarget};
 b.phaseTimer=1.55;b.update(1/60,g,shaft);
 const seated={...b.points[0].homeTarget};
 assert.ok(Math.hypot(written.x-seated.x,written.y-seated.y)>25);
 b.phase='RECALL';b.phaseTimer=0;b.update(1/60,g,shaft);
 assert.ok(Math.hypot(b.points[0].homeTarget.x-b.anchor.pos.x,b.points[0].homeTarget.y-b.anchor.pos.y)<230);
 b.damagePoint(b.points[0],'test');
 assert.equal(b.getLivePoints().length,239);
 assert.equal(b.throneShape.length,240);
});

test('Missile volley keeps the throne present and never spends more than its finite allotment',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.phase='MISSILE';b.launchMissiles();b.update(1/60,g,shaft);
 const flying=b.getLivePoints().filter(p=>p.missileIndex!=null);
 assert.equal(flying.length,h.VESPER.missileParticlesPerVolley);
 assert.equal(b.getLivePoints().length,240);
 const seated=b.getLivePoints().filter(p=>p.missileIndex==null);
 assert.ok(seated.length>=160);
 assert.ok(seated.every(p=>Math.hypot(p.homeTarget.x-b.anchor.pos.x,p.homeTarget.y-b.anchor.pos.y)<230));
 b.missiles.forEach(m=>b.detachMissile(m.index));
 assert.equal(b.getLivePoints().filter(p=>p.missileIndex!=null).length,0);
});

test('Regular ascent reaches Vesper quickly and consecutive shapes vary',()=>{
 const d=new h.Director(17),score=new h.ScoreManager();
 const seen=[];d.spawnWave(shaft);seen.push(d.formations.at(-1).shapeKey);
 for(let i=0;i<20;i++){d.formations=[];d.spawnWave(shaft);seen.push(d.formations.at(-1).shapeKey);}
 for(let i=1;i<seen.length;i++)assert.notEqual(seen[i],seen[i-1]);
 const {getBandForAltitude}=require('../data/bands.js');
 let altitude=0,seconds=0;
 while(altitude<1000){altitude+=getBandForAltitude(altitude).climbSpeed/60;seconds+=1/60;}
 assert.ok(seconds<85&&seconds>65,seconds);
});

test('Blue missile parries empty the throne but cannot instantly finish Vesper',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.points.slice(0,235).forEach(p=>p.isDead=true);b.phase='MISSILE';b.launchMissiles();
 b.missiles.forEach(m=>{m.reflected=true;m.age=1;});
 for(let i=0;i<180;i++)b.update(1/60,g,shaft);
 assert.equal(b.getLivePoints().length,0);assert.equal(b.phase,'EXPOSED');
 assert.equal(b.coreHits,0);assert.equal(b.isCleared,false);
});

test('Vesper exposure is safe, bounded, and ends with a replenished throne',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.points.forEach(p=>p.isDead=true);b.finishIfEmpty();
 let max=0;const apply=b.anchor.applyForce.bind(b.anchor);
 b.anchor.applyForce=f=>{max=Math.max(max,Math.hypot(f.x,f.y));apply(f);};
 for(let i=0;i<Math.ceil(h.VESPER.exposureDuration*60)+3;i++)b.update(1/60,g,shaft);
 assert.equal(b.coreDangerous,false);assert.ok(max<=.400001);
 assert.ok(b.getLivePoints().length>=80);assert.equal(b.phase,'RECALL');
});

test('The four ruler apparitions and opening actors all inherit Vehicle',()=>{
 for(const Type of [h.RulerVision,h.RoomRelic,h.Musician])
   assert.equal(Object.getPrototypeOf(Type),h.Vehicle);
 assert.deepEqual(h.RULERS.map(r=>r.key),['VESPER','ONYX','NOVA','CADENCE']);
 const opening=new h.OpeningScene();
 assert.equal(opening.rulers.length,4);
 assert.equal(opening.chair.kind,'chair');
 assert.ok(opening.chair instanceof h.Vehicle);
 assert.ok(opening.relics.some(p=>p.kind==='note'));
});

test('Opening begins with the song, remains cinematic, and figures leave with bounded steering',()=>{
 const scene=new h.OpeningScene();let max=0;
 assert.equal(scene.mode,'CINEMATIC');assert.equal(scene.musician.playing,true);
 for(const actor of [scene.musician,scene.chair,...scene.relics,...scene.rulers]){
   const apply=actor.applyForce.bind(actor);actor.applyForce=f=>{max=Math.max(max,Math.hypot(f.x,f.y)-actor.maxForce);apply(f);};
 }
 let done=false;for(let i=0;i<510;i++)done=scene.update(1/60);
 assert.equal(done,true);assert.ok(max<1e-9);
 assert.ok(scene.musician.pos.y<300);
 assert.ok(scene.rulers.every(r=>r.target.y<0));
});

test('Vesper teaches the ring gap before its first contact window',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.phase='ORBIT';b.phaseTimer=.5;b.update(1/60,g,shaft);
 assert.ok(b.getLivePoints().every(p=>!p.dangerous));
 assert.match(b.getGuide().action,/ROTATING GAP/);
 b.phaseTimer=1.3;b.update(1/60,g,shaft);
 assert.ok(b.getLivePoints().some(p=>p.dangerous));
});

test('Vesper body takes bounded chip hits while rings and shield guard him',()=>{
 const b=new h.BossController(400,100);
 const wave=()=>({pos:{x:400,y:300},radius:250,tuning:{id:'MID',angle:Math.PI*2,force:1},dirAngle:-Math.PI/2});
 b.phase='ORBIT';assert.equal(b.directHit(wave()),0);
 b.phase='SHIELD';assert.equal(b.directHit(wave()),0);
 b.phase='RECOVER';const first=wave();assert.equal(b.directHit(first),6);assert.equal(b.directHit(first),0);
 b.phase='LUNGE';assert.equal(b.directHit(wave()),3);
 assert.equal(b.getLivePoints().length,231);
 b.phase='EXPOSED';assert.equal(b.directHit(wave()),0);
});

test('Opening guitar separates only after the playing pose ends; energy wakes stay bounded',()=>{
 const scene=new h.OpeningScene();
 for(let i=0;i<150;i++)scene.update(1/60);
 assert.equal(scene.musician.playing,true);assert.ok(scene.rulers.every(r=>r.trail.length<=20));
 for(let i=0;i<120;i++)scene.update(1/60);
 assert.equal(scene.musician.playing,false);assert.equal(scene.musician.abducted,true);
 assert.ok(scene.rulers.every(r=>r.trail.length>0&&r.trail.length<=20));
 assert.ok(scene.rulers.every(r=>Number.isFinite(r.pos.x)&&Number.isFinite(r.pos.y)));
});

test('Vesper visibly recalls a finite batch, and a direct blast cancels that window',()=>{
 const g=new h.Guitar(400,680);
 const b=new h.BossController(400,100);b.points.slice(0,90).forEach(p=>p.isDead=true);
 b.phase='RECALL';for(let i=0;i<55;i++)b.update(1/60,g,shaft);
 assert.equal(b.getLivePoints().length,240-90+h.VESPER.regenerationBatch);
 assert.equal(b.regenerationReserve,h.VESPER.regenerationReserve-h.VESPER.regenerationBatch);
 assert.equal(b.points.length,240);
 const interrupted=new h.BossController(400,100);interrupted.points.slice(0,90).forEach(p=>p.isDead=true);
 interrupted.phase='RECALL';
 const wave={pos:{x:400,y:300},radius:250,tuning:{id:'MID',angle:Math.PI*2,force:1},dirAngle:-Math.PI/2};
 assert.equal(interrupted.directHit(wave),6);
 for(let i=0;i<55;i++)interrupted.update(1/60,g,shaft);
 assert.equal(interrupted.getLivePoints().length,144);
 assert.equal(interrupted.regenerationReserve,h.VESPER.regenerationReserve);
 interrupted.phase='RECALL';interrupted.recallInterrupted=false;interrupted.regeneratedThisRecall=false;
 interrupted.regenerationReserve=0;assert.ok(interrupted.regenerate()>0);
});

test('Vesper takes any tuning during the opening, then shields his body when the throne returns',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 b.points.forEach(p=>p.isDead=true);b.finishIfEmpty();
 const wave=()=>({pos:{x:b.anchor.pos.x,y:b.anchor.pos.y+90},radius:150,
  tuning:{id:'LOW',angle:Math.PI*2,force:1}});
 assert.equal(b.strikeCore(wave()),true);assert.equal(b.strikeCore(wave()),false);
 for(let i=0;i<Math.ceil(h.VESPER.exposureDuration*60)+2;i++)b.update(1/60,g,shaft);
 assert.ok(b.getLivePoints().length>0);assert.equal(b.strikeCore(wave()),false);
 assert.equal(b.coreHits,1);
});

test('Regular swarms commit to their warning target before striking',()=>{
 for(const shape of ['ARROW','HAMMER','SCISSORS','AXE','HAND','JACKHAMMER','MURMURATION','PINCER']){
   const f=new FormationController(shape,400,60),near=new h.Guitar(310,650),far=new h.Guitar(590,720);
   f.phase='TELEGRAPH';f.phaseTimer=shape==='HAMMER'||shape==='SCISSORS'?1.25:shape==='PINCER'?.82:.62;
   f.warningTarget={x:near.pos.x,y:near.pos.y};f.update(1/60,far,shaft);
   assert.deepEqual(f.warningTarget,{x:near.pos.x,y:near.pos.y},shape);
 }
});

test('Director overlaps a strike with a fresh formation but staggers warnings',()=>{
 const d=new h.Director(27),score=new h.ScoreManager();
 d.spawnWave(shaft);const first=d.formations[0];first.phase='STRIKE';d.waveTimer=0;
 d.update(1/60,score,shaft);assert.equal(d.formations.length,1);
 first.phase='RECOVER';d.waveTimer=0;d.update(1/60,score,shaft);
 assert.equal(d.formations.length,1);
 // The basement allows one formation; later stages permit an overlap in recovery.
 score.altitude=1300;d.bossDefeated.HUSH=true;first.phase='STRIKE';d.waveTimer=0;d.update(1/60,score,shaft);
 assert.equal(d.formations.length,2);
 d.formations[1].phase='TELEGRAPH';d.waveTimer=0;d.update(1/60,score,shaft);
 assert.equal(d.formations.length,2);
});


test('Vesper rings counter-rotate and finite edge recovery keeps the fight active',()=>{
 const b=new h.BossController(400,100),g=new h.Guitar(400,680);
 assert.ok(h.VESPER.ringSpeeds[0]*h.VESPER.ringSpeeds[1]<0);
 b.points.slice(0,185).forEach(p=>p.isDead=true);
 b.phase='EDGE';b.phaseTimer=0;
 for(let i=0;i<55;i++)b.update(1/60,g,shaft);
 assert.ok(b.getLivePoints().length>55);
 assert.ok(b.regenerationReserve<h.VESPER.regenerationReserve);
 const reserve=b.regenerationReserve;
 for(let i=0;i<55;i++)b.update(1/60,g,shaft);
 assert.equal(b.regenerationReserve,reserve);
});

test('abduction leaves the separate chair in the room with only a steered recoil',()=>{
 const scene=new h.OpeningScene(),start={x:scene.chair.pos.x,y:scene.chair.pos.y};
 for(let i=0;i<300;i++)scene.update(1/60);
 assert.equal(scene.musician.abducted,true);
 assert.ok(scene.musician.pos.y<start.y);
 assert.ok(scene.chair.pos.x>=start.x&&scene.chair.pos.x<start.x+16);
 assert.ok(Math.abs(scene.chair.pos.y-start.y)<2);
 assert.ok(!scene.chair.isDead);
});

test('opening ginger poses and separate chair ship as transparent sprites',()=>{
 for(const name of ['musician-play-ginger-game-v2','musician-idle-ginger-game-v2','musician-lift-ginger-game-v2','prop-chair-clean-game-v2']){
   const file=path.join(__dirname,'../assets/scene',name+'.png');
   const bytes=fs.readFileSync(file);
   assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
   assert.equal(bytes[25],6,'sprite should include an alpha channel');
   assert.ok(bytes.length>30_000&&bytes.length<150_000);
 }
});
