const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const h=require('./harness.cjs'),root=path.resolve(__dirname,'..');
for(const file of ['data/sonata.js','behaviors/sonata.js','Orpheus.js','RuneSeal.js','SoundHero.js','systems/SonataController.js','systems/FinaleSequence.js','systems/EpilogueSequence.js'])vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
const Boss=vm.runInThisContext('SonataController'),force=vm.runInThisContext('sonataArriveForce'),Hero=vm.runInThisContext('SoundHero'),Sequence=vm.runInThisContext('FinaleSequence'),Epilogue=vm.runInThisContext('EpilogueSequence');
const shaft={x:20,y:20,width:760,height:860};
const shot=(b,awakened=false)=>({pos:{x:b.anchor.pos.x,y:b.anchor.pos.y+100},radius:200,tuning:{angle:Math.PI*2,force:1},awakened});
test('all finale actors inherit Vehicle and arrival forces stay finite and bounded',()=>{
 const boss=new Boss(400,-100),hero=new Hero(400,620,null);
 for(const actor of [boss.anchor,boss.prisoner,...boss.seals,hero])assert.ok(actor instanceof h.Vehicle);
 for(const target of [{x:400,y:-100},{x:10000,y:-10000},{x:0,y:0}]){
  const result=force(boss.anchor,target);assert.ok(Number.isFinite(result.x+result.y));assert.ok(Math.hypot(result.x,result.y)<=boss.anchor.maxForce+1e-9);
 }
 assert.equal(hero.maxChargeTime,.75);
});
test('four patterns and paired act two retain bounded particle count and finite goals',()=>{
 const boss=new Boss(400,270),g=new h.Guitar(400,620);
 for(let act=1;act<=2;act++){
  if(act===2)boss.beginFinalAct();
  const seen=new Set();
  for(let i=0;i<2400;i++){boss.update(1/60,g,shaft);if(boss.phase==='ACTIVE')seen.add(boss.voice);
   for(const p of boss.getLivePoints())assert.ok(Number.isFinite(p.homeTarget.x+p.homeTarget.y));
  }
  assert.equal(seen.size,4);assert.equal(boss.points.length,192);
 }
});
test('Orpheus overpowers the guitar before Act II can defeat him',()=>{
 const boss=new Boss(400,280);boss.setPhase('RECOVER');
 const first=shot(boss);assert.equal(boss.directHit(first),12);
 boss.hitCooldown=0;assert.equal(boss.directHit(first),0);assert.equal(boss.hp,88);
 while(boss.phase!=='OVERWHELM'){boss.hitCooldown=0;boss.directHit(shot(boss));}
 assert.equal(boss.hp,28);assert.equal(boss.isCleared,false);
 boss.update(1.7,new h.Guitar(400,620),shaft);
 assert.equal(boss.phase,'SACRIFICE');assert.equal(boss.isCleared,false);
 assert.equal(boss.directHit(shot(boss)),0);
 boss.beginFinalAct();assert.equal(boss.hp,140);assert.equal(boss.act,2);assert.equal(boss.name,'ORPHEUS');
 boss.setPhase('RECOVER');boss.hitCooldown=0;
 assert.equal(boss.directHit(shot(boss,true)),16);assert.equal(boss.hp,124);
 while(boss.hp>0){boss.hitCooldown=0;boss.directHit(shot(boss,true));}
 assert.equal(boss.phase,'DEFEAT');assert.equal(boss.isCleared,false);
 boss.update(4.1,new h.Guitar(400,620),shaft);assert.equal(boss.isCleared,false);
 assert.equal(boss.completeEpilogue(),true);assert.equal(boss.isCleared,true);
});
test('Orpheus epilogue plays the memories before victory and skip releases the encounter',()=>{
 const nodes=new Map(),make=()=>({hidden:false,textContent:'',onclick:null,querySelector:()=>({textContent:''})});
 global.document={hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);},body:{classList:{add(){},remove(){}}}};
 const boss=new Boss(400,280);boss.beginFinalAct();boss.setPhase('DEFEAT');
 const seq=new Epilogue(boss,{});
 assert.equal(seq.scene.key,'CRACK');assert.equal(boss.isCleared,false);
 seq.update(3.3);assert.equal(seq.scene.panel,0);
 seq.update(4.2);assert.equal(seq.scene.panel,1);
 assert.equal(boss.isCleared,false);
 seq.skip();assert.equal(seq.finished,true);seq.dispose();
 assert.equal(nodes.get('skip-finale').hidden,true);
 assert.equal(boss.completeEpilogue(),true);assert.equal(boss.completeEpilogue(),false);
});
test('homecoming returns the guitarist and guitar as steered Vehicles before victory',()=>{
 const nodes=new Map(),make=()=>({hidden:false,textContent:'',onclick:null,querySelector:()=>({textContent:''})});
 global.document={hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);},body:{classList:{add(){},remove(){}}}};
 const boss=new Boss(400,280);boss.beginFinalAct();boss.setPhase('DEFEAT');
 const seq=new Epilogue(boss,{},new h.Guitar(400,620));
 for(const actor of [seq.musician,seq.travelGuitar,seq.chair])assert.ok(actor instanceof h.Vehicle);
 seq.index=8;seq.time=2.58;seq.update(.05);assert.equal(seq.scene.key,'NORMALIZE');
 for(let i=0;i<4;i++){const scene=seq.scene;seq.update(scene.duration+.05);}
 assert.equal(seq.finished,true);assert.equal(boss.isCleared,false);
 seq.dispose();assert.equal(boss.completeEpilogue(),true);
});
test('destroying the swarm creates a timed opening and regenerates without removing boss health',()=>{
 const boss=new Boss(400,280);boss.setPhase('ACTIVE');
 for(const point of boss.points)boss.damagePoint(point);
 assert.equal(boss.phase,'EXPOSED');assert.equal(boss.hp,100);
 boss.update(6.1,new h.Guitar(400,620),shaft);
 assert.equal(boss.getLivePoints().length,192);assert.equal(boss.phase,'WARNING');
 assert.equal(boss.points.length,192);
});
test('altitude alone no longer wins and the fifth boss is reachable through Director',()=>{
 const score=new h.ScoreManager();score.altitude=4500;score.update(1,0,null);assert.equal(score.gameWon,false);
 const director=new h.Director();director.spawnBoss('SONATA',shaft);
 assert.equal(director.formations[0].bossWord,'SONATA');assert.equal(director.bossActive,true);
});
test('skip always returns control and hides cinematic UI without requiring media playback',()=>{
 const nodes=new Map(),make=()=>({hidden:false,textContent:'',onclick:null,querySelector:()=>({textContent:''})});
 global.document={hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);},body:{classList:{add(){},remove(){}}}};
 let stopped=false;const media={video:{pause(){}},stop(){stopped=true;}};
 const sequence=new Sequence(new Boss(400,280),media);sequence.skip();sequence.update(3,null);
 assert.equal(sequence.finished,true);assert.equal(stopped,true);assert.equal(nodes.get('skip-finale').hidden,true);
});

test('Orpheus gates overlapping particle contacts and converted swarms expose him safely',()=>{
 const boss=new Boss(400,270),g=new h.Guitar(400,620);
 boss.setPhase('ACTIVE');assert.equal(boss.canContactPlayer(),true);
 boss.onPlayerHit();assert.equal(boss.canContactPlayer(),false);
 boss.update(1.4,g,shaft);assert.equal(boss.canContactPlayer(),false);
 boss.update(.11,g,shaft);assert.equal(boss.canContactPlayer(),true);
 for(const p of boss.points.slice(0,-17)){p.isConverted=true;p.isDead=true;}
 assert.doesNotThrow(()=>boss.finishIfEmpty());assert.equal(boss.phase,'EXPOSED');
 boss.regenerate(192);assert.equal(boss.getLivePoints().length,192);
});

test('an early guitar defeat also releases the captive instead of ending the run',()=>{
 const boss=new Boss(400,280);
 boss.setPhase('ACTIVE');boss.triggerBreak();
 assert.equal(boss.phase,'SACRIFICE');assert.equal(boss.isCleared,false);
 boss.beginFinalAct();assert.equal(boss.act,2);assert.equal(boss.hp,140);
});

test('impact frees the guitarist and lets him arrive at the damaged guitar before the film',()=>{
 const boss=new Boss(400,280),g=new h.Guitar(400,625);global.guitar=g;global.shaft=shaft;
 const nodes=new Map(),make=()=>({hidden:false,textContent:'',onclick:null,querySelector:()=>({textContent:''})});
 global.document={hidden:false,getElementById:id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);},body:{classList:{add(){},remove(){}}}};
 const media={video:{pause(){},readyState:0},stop(){}};const seq=new Sequence(boss,media);
 assert.equal(seq.stage,'IMPACT');assert.equal(boss.prisoner.abducted,true);
 for(let i=0;i<45;i++)seq.update(1/60,g);
 assert.equal(seq.stage,'RELEASE');assert.equal(boss.prisoner.abducted,false);
 for(let i=0;i<200;i++)seq.update(1/60,g);
 assert.equal(seq.stage,'RELEASE');
 assert.ok(Math.hypot(boss.prisoner.pos.x-seq.target.x-43,boss.prisoner.pos.y-seq.target.y-8)<60);
 seq.update(.4,g);assert.equal(seq.stage,'CHECK');seq.dispose();
});



test('united hero has 125 life and unlimited amplifier until a new run resets it',()=>{
 const score=new h.ScoreManager();assert.equal(score.maxTune,100);assert.equal(score.unlimitedAmplifier,false);
 score.awaken();assert.equal(score.maxTune,125);assert.equal(score.tune,125);assert.equal(score.unlimitedAmplifier,true);
 for(let i=0;i<20;i++){assert.equal(score.canFireBlast(1),true);assert.equal(score.consumeBlastVolume(1),0);}
 assert.equal(score.volume,100);
 assert.equal(score.takeDamage(14),true);assert.equal(score.tune,111);
 score.reset();assert.equal(score.maxTune,100);assert.equal(score.tune,100);assert.equal(score.unlimitedAmplifier,false);
 assert.equal(score.consumeBlastVolume(1),50);assert.equal(score.volume,50);
});
