const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./harness.cjs');
const {BANDS}=require('../data/bands.js');
const shaft={x:20,y:20,width:760,height:860};

test('seeded wave deck shows every active shape before repeating',()=>{
 const run=()=>{const d=new h.Director(42);d.currentBand=BANDS[2];d.waveIndex=2;
   const shapes=[];for(let i=0;i<BANDS[2].shapes.length;i++){
     d.formations=[];d.spawnWave(shaft);shapes.push(d.formations.at(-1).shapeKey);
   }return shapes;};
 const first=run();assert.deepEqual(first,run());
 assert.equal(new Set(first).size,BANDS[2].shapes.length);
});

test('clean clears build an optional three-shape flourish; a hit resets it',()=>{
 const score=new h.ScoreManager();const start=score.score;
 for(let i=0;i<3;i++)score.onFormationCleared(false,false);
 assert.equal(score.cleanStreak,3);assert.equal(score.lastClear.flourish,true);
 assert.ok(score.score>start+3*750);
 score.onFormationCleared(true,false);
 assert.equal(score.cleanStreak,0);assert.equal(score.lastClear.clean,false);
 score.onFormationCleared(false,true);
 assert.equal(score.cleanStreak,0);
});

test('clear pickup responds to the resource the player needs',()=>{
 const d=new h.Director(42),score=new h.ScoreManager();
 const cleared=()=>d.onFormationCleared({isBoss:false,tookDamage:false},score,shaft);
 score.harmonizeCharges=0;cleared();assert.equal(d.pickups.at(-1).type,'HARMONIZE');
 score.harmonizeCharges=score.maxHarmonize;score.tune=35;cleared();assert.equal(d.pickups.at(-1).type,'TUNE');
 score.tune=100;score.volume=30;cleared();assert.equal(d.pickups.at(-1).type,'VOLUME');
 score.volume=100;const before=d.pickups.length;cleared();assert.equal(d.pickups.length,before+1);assert.equal(d.pickups.at(-1).type,'REST');
});

test('nearby energy is pulled by bounded steering and distant energy keeps drifting',()=>{
 const pickup=new h.Pickup(300,300,'VOLUME'),player=new h.Guitar(410,300);
 const near=h.pickupMagnetForce(pickup,player);
 assert.ok(near.x>0&&Math.hypot(near.x,near.y)<=pickup.maxForce+1e-9);
 player.pos.x=700;
 assert.deepEqual(h.pickupMagnetForce(pickup,player),{x:0,y:0});
 player.pos.x=410;
 pickup.updateDrift(1/60,shaft,player);
 assert.ok(pickup.acc.x>0&&pickup.maxSpeed===9);
});

test('hand fingers close individually while its palm stays stable',()=>{
 const hand=require('../data/shapes.js').generateHandPoints(110);
 const palm=hand[0],finger=hand.find(p=>p.finger===2&&p.reach>.6);
 const {articulatedSlot}=require('../data/shapes.js');
 assert.deepEqual(articulatedSlot('HAND',palm,1),{x:palm.x,y:palm.y});
 assert.ok(articulatedSlot('HAND',finger,1).y>finger.y+.1);
});

test('stage wave pair reaches overlapping strikes with staggered warnings',()=>{
 const d=new h.Director(9),score=new h.ScoreManager(),g=new h.Guitar(400,680);
 score.altitude=1300;d.bossDefeated.HUSH=true;d.currentBand=BANDS[2];d.waveTimer=0;
 let paired=false,doubleStrike=false;
 for(let frame=0;frame<420;frame++){
   d.update(1/60,score,shaft);
   if(d.formations.length>=2)paired=true;
   for(const f of d.formations)f.update(1/60,g,shaft);
   if(d.formations.filter(f=>f.phase==='STRIKE').length>=2)doubleStrike=true;
   if(doubleStrike)break;
 }
 assert.ok(paired&&doubleStrike);
});

test('arrow bends toward the dodging guitar without braking; scissors and hammer keep their choreography',()=>{
 const g=new h.Guitar(520,610),arrow=new h.FormationController('ARROW',400,260);
 arrow.phase='STRIKE';arrow.warningTarget={x:400,y:610};arrow.anchor.lockStrikeVelocity({x:400,y:610},8.5);
 arrow.phaseTimer=.43;arrow.update(1/60,g,shaft);
 assert.equal(arrow.redirectCue,true);assert.equal(arrow.redirected,true);
 const initialSpeed=arrow.anchor.vel.mag();
 arrow.phaseTimer=.68;arrow.update(1/60,g,shaft);
 assert.equal(arrow.redirectCue,true);assert.equal(arrow.anchor.lockedVelocity,null);
 assert.ok(arrow.anchor.vel.x>0&&arrow.anchor.vel.mag()>=initialSpeed*.9);
 const scissors=new h.FormationController('SCISSORS',400,260);
 scissors.phase='TELEGRAPH';scissors.warningTarget={x:520,y:610};scissors.update(1/60,g,shaft);
 assert.ok(Math.abs(scissors.anchor.currentAngle-Math.PI/2)<1e-8);
 scissors.phase='STRIKE';scissors.phaseTimer=.3;const before=scissors.anchor.pos.x;
 for(let i=0;i<35;i++)scissors.update(1/60,g,shaft);
 assert.ok(scissors.anchor.pos.x>before);
 const hammer=new h.FormationController('HAMMER',400,260);
 hammer.phase='STRIKE';hammer.warningTarget={x:520,y:610};hammer.phaseTimer=1.44;
 hammer.update(1/60,g,shaft);
 assert.ok(hammer.anchor.currentAngle>3.8);
});

test('a surviving regular shape makes one telegraphed final pass before exiting',()=>{
 const g=new h.Guitar(400,680),f=new h.FormationController('HAMMER',400,260,{repeats:1});
 f.phase='RECOVER';f.phaseTimer=1.1;f.update(1/60,g,shaft);
 assert.equal(f.phase,'ENCORE_WARN');
 f.phaseTimer=.81;f.update(1/60,g,shaft);assert.equal(f.phase,'ENCORE');
 f.phaseTimer=1.61;f.update(1/60,g,shaft);assert.equal(f.phase,'EXIT');
});
test('energy pickups build a bounded visible score chain and reset after a gap',()=>{
 const s=new h.ScoreManager();const a=s.onPickupCollected(),b=s.onPickupCollected();
 assert.equal(a.chain,1);assert.equal(b.chain,2);assert.ok(b.bonus>a.bonus);
 s.update(8,0,null);assert.equal(s.pickupChain,0);
});

test('departing forms release encounter slots and a defeated boss hands off promptly',()=>{
 const d=new h.Director(21),s=new h.ScoreManager();s.altitude=1300;d.bossDefeated.HUSH=true;
 d.currentBand=BANDS[2];d.waveTimer=0;
 const leaving=new h.FormationController('HAMMER',400,260),broken=new h.FormationController('ARROW',400,260);
 leaving.phase='EXIT';broken.phase='BROKEN';d.formations=[leaving,broken];
 d.update(1/60,s,shaft);
 assert.ok(d.formations.some(f=>!['EXIT','BROKEN'].includes(f.phase)));
 d.onFormationCleared({isBoss:true,bossWord:'HUSH',tookDamage:false},s,shaft);
 assert.equal(d.restTimer,.6);assert.ok(d.waveTimer<=.45);
});

test('demo shows three regular encounters between bosses before the next entrance',()=>{
 const d=new h.Director(34),s=new h.ScoreManager();s.altitude=2000;d.bossDefeated.HUSH=true;
 const keys=[];
 for(let n=0;n<3;n++){
   d.formations=[];d.restTimer=0;d.waveTimer=0;
   d.update(1/60,s,shaft,null,true);
   assert.equal(d.bossActive,false);
   assert.equal(d.formations.length,1);
   keys.push(d.formations[0].shapeKey);
 }
 assert.equal(d.demoEncountersSinceBoss,3);
 assert.equal(new Set(keys).size,3);
 d.formations=[];d.update(1/60,s,shaft,null,true);
 assert.equal(d.bossActive,true);
 assert.equal(d.formations[0].isBoss,true);
});

test('health and energy pickups pull toward the guitar from a visible distance',()=>{
 for(const type of ['TUNE','VOLUME']){
   const player=new h.Guitar(560,500),pickup=new h.Pickup(260,500,type);
   const initial=Math.hypot(player.pos.x-pickup.pos.x,player.pos.y-pickup.pos.y);
   for(let n=0;n<40;n++){pickup.updateDrift(1/60,shaft,player);pickup.update();}
   assert.ok(pickup.magnetStrength>0);
   assert.ok(Math.hypot(player.pos.x-pickup.pos.x,player.pos.y-pickup.pos.y)<initial);
   assert.ok(pickup.maxSpeed===9);
 }
});

test('the third opening encounter is a four-blade particle shuriken',()=>{
 const {generateShurikenPoints}=require('../data/shapes.js');
 const points=generateShurikenPoints(88);
 assert.equal(points.length,88);
 assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=1.1&&Math.abs(p.y)<=1.1));
 for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]])
   assert.ok(points.some(p=>p.x*x+p.y*y>.85));
 const d=new h.Director(7);d.currentBand=BANDS[0];
 const keys=[];for(let i=0;i<3;i++){d.formations=[];d.spawnWave(shaft);keys.push(d.formations.at(-1).shapeKey);}
 assert.deepEqual(keys,['ARROW','HAMMER','SHURIKEN']);
});
test('the opening teaches one form, then permits a bounded overlapping pair',()=>{
 const d=new h.Director(9),s=new h.ScoreManager();
 d.waveTimer=0;d.update(1/60,s,shaft);
 assert.equal(d.formations.length,1);
 d.waveTimer=0;d.update(1/60,s,shaft);
 assert.equal(d.formations.length,1);
 s.altitude=140;d.waveTimer=0;d.update(1/60,s,shaft);
 assert.equal(d.formations.length,2);
 assert.notEqual(d.formations[1].stagingX,null);
 assert.ok(d.formations.reduce((n,f)=>n+f.points.length,0)<=500);
});
test('regular wave rewards enter magnetic reach of the guitar',()=>{
 const d=new h.Director(17),s=new h.ScoreManager(),g=new h.Guitar(590,675);
 d.currentBand=BANDS[0];d.spawnWave(shaft,null,s,g);
 assert.equal(d.pickups.length,1);
 assert.ok(Math.hypot(d.pickups[0].pos.x-g.pos.x,d.pickups[0].pos.y-g.pos.y)<330);
 assert.ok(d.pickups[0].pos.y>shaft.y+shaft.height*.5);
});
test('particle shuriken curves around its locked target with bounded steering',()=>{
 const g=new h.Guitar(400,670),f=new h.FormationController('SHURIKEN',400,300);
 f.phase='STRIKE';f.warningTarget={x:400,y:650};
 const before=f.anchor.currentAngle;
 for(let i=0;i<100;i++)f.update(1/60,g,shaft);
 assert.ok(f.anchor.currentAngle-before>12);
 assert.ok(f.anchor.vel.mag()<=f.anchor.maxSpeed+1e-6);
 assert.ok(Math.hypot(f.anchor.pos.x-400,f.anchor.pos.y-300)>40);
});
test('unused transformation is absent from the startup path',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
 assert.equal(fs.existsSync(path.join(root,'assets/scene/hero-transformed.png')),false);
 assert.equal(fs.existsSync(path.join(root,'systems/TransformationScene.js')),false);
 for(const file of ['sketch.js','index.html','systems/Hud.js']){
   const source=fs.readFileSync(path.join(root,file),'utf8');
   assert.ok(!/transformationScene|heroTransformed|preview-transformation|TransformationScene/.test(source));
 }
});

