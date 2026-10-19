const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./harness.cjs');global.Guitar=h.Guitar;
const {SoundHero,soundHeroFrame}=require('../SoundHero.js');
const shaft={x:20,y:20,width:760,height:860};
test('hero has distinct idle, flight, charge and strike frames with reduced-motion support',()=>{
 assert.equal(new Set(Array.from({length:12},(_,i)=>soundHeroFrame(i*.2,0,false,0,0,false))).size,4);
 assert.equal(new Set(Array.from({length:20},(_,i)=>soundHeroFrame(i*.07,6,false,0,0,false))).size,4);
 assert.equal(soundHeroFrame(0,0,true,.2,0,false),8);assert.equal(soundHeroFrame(0,0,true,.8,0,false),9);
 assert.equal(soundHeroFrame(0,8,false,0,.4,false),10);assert.equal(soundHeroFrame(0,8,false,0,.1,false),11);
 assert.equal(soundHeroFrame(2,0,false,0,0,false,true),0);assert.equal(soundHeroFrame(2,8,false,0,0,false,true),4);
});
test('hero flips with steering velocity but stays stable near rest; attacks recover and locomotion stays inherited',()=>{
 const hero=new SoundHero(400,620,null),guitar=new h.Guitar(400,620);
 for(let i=0;i<20;i++){hero.applyForce(createVector(-.3,0));guitar.applyForce(createVector(-.3,0));hero.update(1/60,shaft);guitar.update(1/60,shaft);}
 assert.equal(hero.facing,-1);assert.equal(hero.pos.x,guitar.pos.x);assert.equal(hero.pos.y,guitar.pos.y);
 hero.onBlast(.8);assert.equal(hero.attackTime,.44);assert.equal(hero.blastReach,1.12);
 for(let i=0;i<60;i++)hero.update(1/60,shaft);
 assert.equal(hero.attackTime,0);assert.ok(hero.frame>=0&&hero.frame<12);
 const still=new SoundHero(400,620,null);still.facing=-1;still.update(1/60,shaft);assert.equal(still.facing,-1);
});
