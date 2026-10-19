const test=require('node:test');
const assert=require('node:assert/strict');
const {Onboarding}=require('../systems/Onboarding.js');
const {HandInput}=require('../systems/HandInput.js');

function node(){
  return {hidden:false,disabled:false,textContent:'',style:{},dataset:{},attributes:{},classList:{toggle(){}},setAttribute(key,value){this.attributes[key]=value;},addEventListener(){},focus(){},querySelector(){return node();},getBoundingClientRect(){return {left:80,top:60,width:300,height:180};}};
}
test('player chooses one of three modes before starting and tutorial advances safely',()=>{
  const nodes=new Map(),buttons=['pointer','voice','hand'].map(mode=>Object.assign(node(),{dataset:{control:mode}}));
  global.document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},querySelectorAll:()=>buttons,querySelector:()=>node()};
  global.window={innerWidth:1200,addEventListener(){}};
  global.innerWidth=1200;global.innerHeight=900;global.requestAnimationFrame=fn=>fn();
  const onboarding=new Onboarding();
  onboarding.select('voice');
  assert.equal(onboarding.mode,'voice');
  assert.equal(onboarding.play.disabled,false);
  assert.equal(buttons[1].attributes['aria-pressed'],'true');
  assert.equal(buttons[0].attributes['aria-pressed'],'false');
  onboarding.show();
  assert.equal(onboarding.active,true);
  assert.match(nodes.get('tutorial-title').textContent,/MOVE/);
  onboarding.next();
  assert.match(nodes.get('tutorial-title').textContent,/CLAP/);
  onboarding.next();onboarding.next();
  assert.equal(onboarding.active,false);
  assert.equal(onboarding.seen,true);
});
test('tracked palm is mirrored into a target and pinch release fires only once',()=>{
  const input=new HandInput();
  const landmarks=()=>Array.from({length:21},()=>({x:.5,y:.5}));
  const close=landmarks();close[0]={x:.5,y:.7};close[9]={x:.5,y:.5};close[4]={x:.53,y:.43};close[8]={x:.55,y:.43};
  const open=close.map(p=>({...p}));open[8]={x:.74,y:.43};
  let points=close;
  input.ready=true;input.video={readyState:3,currentTime:1};
  input.landmarker={detectForVideo:()=>({landmarks:[points]})};
  input.tick(1000);
  assert.equal(input.pinch,true);
  assert.ok(input.target.x>=35&&input.target.x<=765);
  points=open;input.video.currentTime=2;input.tick(1060);
  assert.equal(input.pinch,false);
  assert.equal(input.takeRelease(),true);
  assert.equal(input.takeRelease(),false);
  points=close;input.video.currentTime=3;input.tick(1120);
  assert.equal(input.pinch,true);
  input.video.currentTime=4;input.landmarker={detectForVideo:()=>({landmarks:[]})};
  input.tick(1500);input.video.currentTime=5;input.tick(1900);
  assert.equal(input.pinch,false);
  assert.equal(input.takeRelease(),false);
});
