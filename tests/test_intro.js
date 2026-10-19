const test=require('node:test'),assert=require('node:assert/strict');
const {BOSS_INTROS,bossIntroCamera,bossIntroReveal}=require('../ui/BossIntro.js');
const at=t=>({phase:'ENTRANCE',phaseTimer:t,anchor:{pos:{x:390,y:175}}});
test('Five boss title treatments have distinct color, mark and story line',()=>{
 assert.deepEqual(Object.keys(BOSS_INTROS),['SONATA','HUSH','MUTE','ECHO','MEASURE']);
 assert.equal(new Set(Object.values(BOSS_INTROS).map(x=>x.sigil)).size,5);
 assert.equal(new Set(Object.values(BOSS_INTROS).map(x=>x.color)).size,5);
 for(const profile of Object.values(BOSS_INTROS))assert.match(profile.kicker,/^[0-9]{4} M · /);
});
test('Cinematic zoom centers the steering boss and fully releases before attacks',()=>{
 assert.equal(bossIntroCamera(at(.3)).scale,1);
 const close=bossIntroCamera(at(2.2));assert.ok(close.scale>1.3&&close.scale<1.35);
 assert.deepEqual({x:close.x,y:close.y},{x:390,y:175});
 assert.equal(bossIntroCamera(at(3)).scale,1);
 assert.equal(bossIntroCamera({...at(1.5),phase:'A_WARN'}).scale,1);
 assert.equal(bossIntroCamera(at(1.5),true).scale,1);
});
test('Origin energy forms the sprite before card and zoom; transition stays bounded',()=>{
 const early=bossIntroReveal(.3),mid=bossIntroReveal(1.3),late=bossIntroReveal(1.95);
 assert.equal(early.energy,1);assert.equal(early.sprite,0);assert.equal(early.card,0);
 assert.ok(mid.energy>0&&mid.sprite>0);assert.equal(mid.card,0);
 assert.equal(late.sprite,1);assert.equal(late.card,1);assert.ok(late.energy<.1);
 for(let t=0;t<=4;t+=.07)for(const value of Object.values(bossIntroReveal(t)))assert.ok(value>=0&&value<=1);
});
