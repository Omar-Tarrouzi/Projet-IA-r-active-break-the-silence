const test=require('node:test');
const assert=require('node:assert/strict');
const {attackVisual,AttackAtlas}=require('../ui/AttackAtlas.js');
const {rulerPose}=require('../ui/RulerAnimation.js');

test('attack visual language follows boss, warning, counter and broken particle state',()=>{
  assert.deepEqual(attackVisual({boss:{profile:{key:'ONYX'},phase:'A_WARN'},state:'HOMED'}),{kind:'onyx',state:'warn'});
  assert.deepEqual(attackVisual({boss:{profile:{key:'NOVA'},phase:'A'},state:'HOMED',dangerous:true}),{kind:'nova',state:'active'});
  assert.deepEqual(attackVisual({boss:{profile:{key:'CADENCE'},phase:'B'},state:'STUNNED'}),{kind:'cadence',state:'break'});
  assert.deepEqual(attackVisual({boss:{bossWord:'HUSH',phase:'MISSILE'},state:'HOMED',missileIndex:0,resonance:'LOW'}),{kind:'vesper',state:'counter'});
  assert.deepEqual(attackVisual({boss:{bossWord:'HUSH',phase:'LUNGE'},state:'HOMED',bossSlotIndex:0}),{kind:'vesperTip',state:'idle'});
  assert.deepEqual(attackVisual({boss:{profile:{key:'CADENCE'},phase:'A',beatClock:1.2},state:'HOMED'}),{kind:'cadence',state:'hit'});
  assert.equal(attackVisual({state:'HOMED'}),null);
});

test('rulers breathe at rest and anticipate before commanding an attack',()=>{
  for(const key of ['VESPER','ONYX','NOVA','CADENCE']){
    const a=rulerPose(key,'RECOVER',1,0);
    const b=rulerPose(key,'RECOVER',1,1);
    assert.notEqual(a.breath,b.breath);
    assert.notEqual(a.stance,b.stance);
    assert.ok(rulerPose(key,'A_WARN',.7,1).gesture>0);
  }
});
test('attack sheet renders four states for each ruler without a browser canvas',()=>{
  let drawn=0;
  const context=new Proxy({drawImage(){drawn++;}},{
    get(target,key){return target[key]||(()=>{});},
    set(target,key,value){target[key]=value;return true;}
  });
  const previous=global.document;
  global.document={createElement:()=>({getContext:()=>context})};
  try{
    const atlas=new AttackAtlas();
    assert.equal(atlas.sheet.width,128);
    assert.equal(atlas.sheet.height,256);
    for(const kind of ['vesper','onyx','nova','cadence','onyxTip','novaCore','vesperTip','cadenceDiamond'])
      assert.equal(atlas.draw(context,kind,'warn',0,0),true);
    assert.equal(drawn,8);
  }finally{global.document=previous;}
});