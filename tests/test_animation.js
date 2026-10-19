const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./harness.cjs');
const {rulerIdlePose,rulerPose,rulerFrame,rulerTransitionFrames,rulerTransitionMix,reactRuler}=require('../ui/RulerAnimation.js');
test('Every ruler pose stays finite and restrained through warning, attack and defeat',()=>{
 for(const key of ['VESPER','ONYX','NOVA','CADENCE'])for(const phase of ['ENTRANCE','A_WARN','A','B','LUNGE','EXPOSED','DEFEAT'])for(let t=0;t<4;t+=.05){
  const p=rulerPose(key,phase,t,t,.4,t);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.abs(p.lean)<.4);assert.ok(p.scaleX>.9&&p.scaleY>.9);
 }
});
test('Warnings wind up before release and Cadence follows the 1.2 second combat beat',()=>{
 assert.ok(rulerPose('VESPER','HAND_WARN',1,0).arm>0);assert.ok(rulerPose('VESPER','HAND',0,0).arm<0);
 assert.notEqual(rulerPose('CADENCE','A',2,0,0,.3).arm,rulerPose('CADENCE','A',2,0,0,.9).arm);
 assert.equal(rulerFrame('ONYX','A_WARN'),'onyxCommand');assert.equal(rulerFrame('ONYX','A'),'onyxLunge');
});
test('Animation transitions and recoil decay without changing locomotion',()=>{
 const b=new h.RulerBoss(400,100,'ONYX');b.update();const before={x:b.pos.x,y:b.pos.y};
 b.phase='A_WARN';b.update();assert.ok(b.animation.blend<1);reactRuler(b);assert.equal(b.animation.recoil,.65);
 for(let i=0;i<50;i++)b.update();assert.equal(b.animation.recoil,0);assert.equal(b.animation.blend,1);assert.deepEqual({x:b.pos.x,y:b.pos.y},before);
});
test('Nova keeps at most four independent historical poses',()=>{
 const b=new h.RulerBoss(400,100,'NOVA');for(let i=0;i<500;i++)b.update();assert.equal(b.animation.history.length,4);
 assert.notEqual(b.animation.history[3].pose,b.animation.pose);assert.notEqual(b.animation.history[2].pose,b.animation.history[3].pose);
});

test('six held idle poses give each ruler a bounded fighting stance loop',()=>{
 for(const key of ['VESPER','ONYX','NOVA','CADENCE']){
  const start=rulerIdlePose(key,0),raised=rulerIdlePose(key,.35);
  assert.notEqual(start.y,raised.y);
  assert.ok(Math.abs(raised.y)<6);
  assert.ok(Math.abs(raised.squash)<.05);
 }
 assert.notEqual(rulerIdlePose('VESPER',.3).y,rulerIdlePose('ONYX',.3).y);
});

test('transition frames lead with the arm and let the cloak settle last',()=>{
 assert.equal(rulerFrame('VESPER','SPEAR_WARN'),'vesperCommand');
 assert.equal(rulerFrame('VESPER','LUNGE'),'vesperLunge');
 assert.ok(rulerTransitionFrames('A')<rulerTransitionFrames('A_WARN'));
 assert.ok(rulerTransitionFrames('RECOVER')>rulerTransitionFrames('A'));
 assert.ok(rulerTransitionMix(.5,.34)>rulerTransitionMix(.5,.9));
 for(const progress of [0,.1,.5,.9,1])for(const height of [0,.3,.7,1]){
  const mix=rulerTransitionMix(progress,height);
  assert.ok(mix>=0&&mix<=1);
 }
});

test('Nova remastered pose set is present, transparent, and kept small for the web',()=>{
 const fs=require('node:fs'),path=require('node:path');
 for(const pose of ['idle','command','lunge','shield']){
  const file=path.join(__dirname,'../assets/scene/nova-'+pose+'-v3.png');
  const data=fs.readFileSync(file);
  assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(data[25],6);
  assert.ok(data.readUInt32BE(20)===512&&data.length<650000);
 }
});
