const test=require('node:test');
const assert=require('node:assert/strict');
const {DemoPilot}=require('../systems/DemoPilot.js');
const {demoCommentary}=require('../systems/DemoCommentary.js');

const shaft={x:0,y:0,width:800,height:900};
const guitar=()=>({pos:{x:400,y:690},chargeDuration:0});
const score=()=>({canFireBlast:()=>true});
const point=(x,y,extra={})=>({pos:{x,y},dangerous:false,...extra});
const formation=(key='HAMMER',resonance='LOW')=>({isBoss:false,isDead:false,shapeKey:key,shapeDef:{resonance},phase:'FORM',anchor:point(400,380),getLivePoints:()=>[point(400,480)]});

test('demo chooses existing resonance, a valid target, and a timed blast without moving the guitar',()=>{
 const pilot=new DemoPilot(),player=guitar(),before=structuredClone(player);
 const attacking=formation('SCISSORS','HIGH');attacking.phase='STRIKE';
 const first=pilot.decide(1/60,player,score(),[attacking],[],shaft);
 assert.equal(first.tuning,'HIGH');assert.equal(first.fire,true);assert.equal(first.reason,'DODGE');
 assert.deepEqual(player,before);assert.ok(Number.isFinite(first.target.x)&&Number.isFinite(first.target.y));
 assert.equal(pilot.shots,1);
 assert.equal(pilot.decide(1/60,player,score(),[formation()],[],shaft).fire,false);
});

test('presentation climb reaches milestones sooner while normal speed remains a lower bound',()=>{
 const pilot=new DemoPilot();
 assert.equal(pilot.climbSpeed(12),70);
 pilot.time=7;
 assert.equal(pilot.climbSpeed(15),100);
 assert.equal(pilot.climbSpeed(120),120);
});

test('demo steers away from a dangerous point and keeps the caption action current',()=>{
 const pilot=new DemoPilot(),enemy=formation();enemy.getLivePoints=()=>[point(420,685,{dangerous:true})];
 const choice=pilot.decide(.02,guitar(),score(),[enemy],[],shaft);
 assert.equal(choice.reason,'EVADE');assert.equal(pilot.lastAction,'EVADE');assert.equal(choice.fire,false);
 assert.ok(choice.target.x<400);
});

test('Onyx counter waits for tug and charged release',()=>{
 const pilot=new DemoPilot(),player=guitar();
 const dart=point(405,540,{isDead:false,mode:'HOLD',tugProgress:.9});
 const boss={isBoss:true,isDead:false,phase:'A',profile:{key:'ONYX',attackATune:'LOW',attackBTune:'HIGH'},anchor:point(400,160),chainDarts:[dart],getLivePoints:()=>[]};
 let action=pilot.decide(.02,player,score(),[boss],[],shaft);
 assert.equal(action.reason,'TUG');assert.equal(action.hold,true);assert.equal(action.fire,false);
 player.chargeDuration=.7;
 action=pilot.decide(.02,player,score(),[boss],[],shaft);
 assert.equal(action.tuning,'MID');assert.equal(action.fire,true);
});

test('Cadence fires only on a charged beat; no shots when volume is insufficient',()=>{
 const pilot=new DemoPilot(),player=guitar();player.chargeDuration=.5;
 const boss={isBoss:true,isDead:false,phase:'A',profile:{key:'CADENCE',attackATune:'LOW',attackBTune:'HIGH'},anchor:point(400,160),beatClock:1.2,lastCounterBeat:0,getLivePoints:()=>[]};
 let action=pilot.decide(.02,player,score(),[boss],[],shaft);
 assert.equal(action.reason,'BEAT');assert.equal(action.tuning,'LOW');assert.equal(action.fire,true);
 pilot.cooldown=0;boss.beatClock=1.5;
 action=pilot.decide(.02,player,score(),[boss],[],shaft);
 assert.equal(action.fire,false);
 boss.beatClock=2.4;
 action=pilot.decide(.02,player,{canFireBlast:()=>false},[boss],[],shaft);
 assert.equal(action.fire,false);
});

test('exposed LOW core moves to reachable range and fires only when aligned',()=>{
 const pilot=new DemoPilot(),player=guitar();
 const boss={isBoss:true,isDead:false,phase:'EXPOSED',profile:{key:'CADENCE',coreTune:'LOW'},anchor:point(400,220),getLivePoints:()=>[]};
 let action=pilot.decide(.02,player,score(),[boss],[],shaft);
 assert.equal(action.target.y,405);assert.equal(action.fire,false);
 player.pos.y=405;
 action=pilot.decide(.02,player,score(),[boss],[],shaft);
 assert.equal(action.tuning,'LOW');assert.equal(action.fire,true);
});

test('French narration explains sound input and actual steering mechanics',()=>{
 const controls=demoCommentary({time:2});
 assert.match(controls.body,/claquement/i);assert.match(controls.body,/son tenu/i);
 const regular=demoCommentary({time:15,regular:formation()});
 assert.match(regular.body,/séparation, alignement et cohésion/i);
 const nova=demoCommentary({boss:{phase:'A',profile:{key:'NOVA'}},action:'PARRY'});
 assert.match(nova.formula,/ARRIVE.*SEEK/);assert.match(nova.body,/fréquence/i);
});

test('demo lets a regular shape finish its warning before auto-firing',()=>{
 const pilot=new DemoPilot(),enemy=formation('HAMMER','MID');
 for(const phase of ['FORMING','TELEGRAPH']){
   enemy.phase=phase;
   assert.equal(pilot.decide(1/60,guitar(),score(),[enemy],[],shaft).fire,false);
 }
 enemy.phase='STRIKE';
 assert.equal(pilot.decide(1/60,guitar(),score(),[enemy],[],shaft).fire,true);
});
