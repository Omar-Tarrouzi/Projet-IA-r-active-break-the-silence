// All ruler animation is local to its Vehicle. No translation or physics is written here.
const RULER_IDLE_FRAMES=Object.freeze([
 {y:0,squash:0,arm:0,hair:-.12,cloth:.18,foot:0},
 {y:-1.2,squash:-.012,arm:.015,hair:0,cloth:.07,foot:-.015},
 {y:-3.8,squash:-.026,arm:.035,hair:.18,cloth:-.12,foot:-.035},
 {y:-2.9,squash:-.012,arm:.02,hair:.14,cloth:-.2,foot:-.02},
 {y:1.5,squash:.022,arm:-.02,hair:-.06,cloth:.05,foot:.04},
 {y:1,squash:.014,arm:-.012,hair:-.16,cloth:.2,foot:.025}
]);
function rulerEase(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function rulerIdlePose(key,age){
 const cycle=key==='VESPER'?1.65:key==='ONYX'?1.18:key==='NOVA'?1.4:1.2;
 const phase=((age/cycle*RULER_IDLE_FRAMES.length)%RULER_IDLE_FRAMES.length+
   RULER_IDLE_FRAMES.length)%RULER_IDLE_FRAMES.length;
 const index=Math.floor(phase),next=(index+1)%RULER_IDLE_FRAMES.length;
 // The brief holds make each pose read like a drawn fighting-game frame.
 const mix=rulerEase((phase-index-.1)/.8);
 const scale=key==='ONYX'?1.12:key==='NOVA'?.9:1;
 const a=RULER_IDLE_FRAMES[index],b=RULER_IDLE_FRAMES[next],out={};
 for(const channel of Object.keys(a))out[channel]=(a[channel]+(b[channel]-a[channel])*mix)*scale;
 return out;
}
function rulerPose(key,phase,time,age,recoil=0,beat=0){
 const warn=phase.endsWith('_WARN'),attack=['A','B','ORBIT','HAND','MISSILE','WORD_ATTACK','LUNGE'].includes(phase);
 const wind=warn?rulerEase(time/.65):0,strike=attack?Math.exp(-time*5):0;
 const hurt=Math.sin(Math.min(1,recoil/.65)*Math.PI/2);
 const rhythm=key==='CADENCE'&&attack?Math.sin(beat/1.2*Math.PI*2):0;
 const idle=rulerIdlePose(key,age),rest=warn?.65:attack?.4:1;
 return {
  lean:-wind*.045+strike*.09-hurt*.14+rhythm*.025,
  y:idle.y*rest+wind*3-strike*5+hurt*6+rhythm*4,
  arm:idle.arm*rest+wind*.12-strike*.19+hurt*.21+rhythm*.075,
  hair:idle.hair*.055*rest-strike*.035+hurt*.025,
  cloth:idle.cloth*.15*rest+strike*.055-hurt*.045,
  scaleX:1+idle.squash*rest-wind*.025+strike*.04+hurt*.025,
  scaleY:1-idle.squash*rest+wind*.02-strike*.035-hurt*.04,
  glow:warn?wind:attack?strike:0,
  breath:-idle.squash*.6*rest,
  stance:idle.foot*rest+(key==='CADENCE'?rhythm*.025:0),
  foot:idle.foot*rest,
  gesture:(key==='ONYX'?.27:key==='VESPER'?.23:key==='NOVA'?.18:.13)*wind-strike*.14+hurt*.17
 };
}
function rulerFrame(key,phase){
 const prefix=key.toLowerCase();
 if(['EXPOSED','DEFEAT'].includes(phase))return prefix+(key==='VESPER'?'Exposed':'Shield');
 if(key==='VESPER')return prefix+(phase==='LUNGE'?'Lunge':
   ['SPEAR_WARN','ORBIT','HAND','MISSILE','WORD_ATTACK','ORBIT_WARN','HAND_WARN','MISSILE_WARN','WORD_WARN'].includes(phase)?'Command':'Idle');
 return prefix+(phase.endsWith('_WARN')?'Command':['A','B'].includes(phase)?'Lunge':'Idle');
}
function rulerTransitionFrames(phase){
 return phase.endsWith('_WARN')?14:['A','B','LUNGE'].includes(phase)?8:18;
}
function rulerTransitionMix(blend,u){
 const shoulders=Math.exp(-Math.pow((u-.34)/.16,2));
 const cloth=Math.pow(Math.max(0,(u-.49)/.51),2);
 const delay=cloth*.22-shoulders*.13;
 return rulerEase((blend-delay)/(1-delay));
}
function updateRulerAnimation(body){
 const key=body.key||'VESPER',frame=rulerFrame(key,body.phase);
 if(!body.animation)body.animation={phase:body.phase,time:0,frame,previous:frame,
   blend:1,transitionFrames:18,recoil:0,history:[],tick:0};
 const a=body.animation;
 if(a.phase!==body.phase){a.phase=body.phase;a.time=0;}
 if(a.frame!==frame){a.previous=a.frame;a.frame=frame;a.blend=0;a.transitionFrames=rulerTransitionFrames(body.phase);}
 a.time+=1/60;a.blend=Math.min(1,a.blend+1/a.transitionFrames);
 a.recoil=Math.max(0,a.recoil-1/60);
 const next=rulerPose(key,body.phase,a.time,body.age,a.recoil,body.beatClock||0);
 if(!a.pose)a.pose=next;else for(const channel of Object.keys(next))
   a.pose[channel]+=(next[channel]-a.pose[channel])*.28;
 if(key==='NOVA'&&++a.tick%6===0){
  a.history.push({x:body.pos.x,y:body.pos.y,frame:a.frame,pose:{...a.pose}});
  if(a.history.length>4)a.history.shift();
 }
}
function reactRuler(body,strength=1){
 if(!body.animation)updateRulerAnimation(body);
 body.animation.recoil=Math.max(body.animation.recoil,.65*Math.max(0,Math.min(1,strength)));
}
// Twenty-four articulated strips: shoulder/hand leads; hair and mantle follow;
// boots flex slightly while the character stays at the same Vehicle position.
function drawRulerLayers(c,sprite,h,pose,motion,previous=null,blend=1){
 const w=Math.min(260,h*sprite.width/sprite.height),source=sprite.canvas;
 const bands=Math.min(24,sprite.height),step=sprite.height/bands;
 for(let i=0;i<bands;i++){
  const sy=Math.floor(i*sprite.height/bands),end=Math.floor((i+1)*sprite.height/bands);
  const sh=end-sy,u=(sy+sh*.5)/sprite.height;
  const hair=Math.pow(Math.max(0,1-u/.3),2);
  const cloth=Math.pow(Math.max(0,(u-.42)/.58),2);
  const shoulders=Math.exp(-Math.pow((u-.32)/.14,2));
  const legs=Math.pow(Math.max(0,(u-.66)/.34),2);
  const dx=(pose.hair*hair*55+pose.cloth*cloth*85+pose.stance*legs*48)*motion;
  const dy=pose.foot*legs*20*motion;
  const stretch=1+(pose.arm+pose.gesture)*shoulders*.34*motion+pose.breath*(1-u)*motion;
  const x=Math.round(-w*stretch/2+dx),y=Math.round(-h/2+sy/sprite.height*h+dy);
  const width=Math.round(w*stretch),height=Math.max(1,Math.round(end/sprite.height*h)-Math.round(sy/sprite.height*h));
  if(previous&&blend<1){
   const local=rulerTransitionMix(blend,u),old=previous.canvas;
   const oldY=i*previous.height/bands,oldH=Math.min(previous.height/bands,previous.height-oldY);
   c.globalAlpha=1-local;c.drawImage(old,0,oldY,previous.width,oldH,x,y,width,height);
   c.globalAlpha=local;
  }
  c.drawImage(source,0,sy,sprite.width,sh,x,y,width,height);
  c.globalAlpha=1;
 }
}
let rulerRenderSurface;
function drawRulerAnimation(c,body){
 if(typeof sceneAssets==='undefined'||!sceneAssets||!body.animation)return false;
 const a=body.animation;if(!sceneAssets[a.frame])return false;
 const key=body.key||'VESPER',h=key==='VESPER'||key==='ONYX'?205:key==='NOVA'?198:218;
 const color=key==='ONYX'?'#ff718f':key==='NOVA'?'#74d9ff':key==='CADENCE'?'#e9cf8b':'#c8b7ff';
 const motion=(typeof reduceMotion!=='undefined'&&reduceMotion)?.2:1;
 const draw=(x,y,frame,pose,alpha,previous=null,blend=1)=>{
  const img=sceneAssets[frame];if(!img)return;
  c.save();c.translate(x,y+pose.y*motion);c.rotate(pose.lean*motion);
  c.scale(1+(pose.scaleX-1)*motion,1+(pose.scaleY-1)*motion);
  c.globalAlpha=alpha;c.imageSmoothingEnabled=false;c.shadowColor=color;c.shadowBlur=0;
  if(!rulerRenderSurface){
   rulerRenderSurface=document.createElement('canvas');
   rulerRenderSurface.width=320;rulerRenderSurface.height=280;
  }
  const layer=rulerRenderSurface.getContext('2d');
  layer.clearRect(0,0,320,280);layer.save();layer.translate(160,140);
  layer.imageSmoothingEnabled=false;
  if(key==='VESPER'||key==='ONYX'){
   // Keep Vesper and Onyx intact; independently moving strips exposed seams.
   const w=Math.min(260,h*img.width/img.height),x=-w/2,y=-h/2;
   const old=previous&&sceneAssets[previous];
   if(old&&blend<1){layer.globalAlpha=1-blend;layer.drawImage(old.canvas,x,y,w,h);layer.globalAlpha=blend;}
   layer.drawImage(img.canvas,x,y,w,h);layer.globalAlpha=1;
  }else drawRulerLayers(layer,img,h,pose,motion,previous&&sceneAssets[previous],blend);
  layer.restore();c.drawImage(rulerRenderSurface,-160,-140);c.restore();
 };
 if(key==='NOVA'&&motion===1&&['A','B','A_WARN','B_WARN'].includes(body.phase))
  for(let i=0;i<a.history.length-1;i++){
   const s=a.history[i];draw(s.x,s.y,s.frame,s.pose,.045+i*.025);
  }
 const alpha=body.phase==='DEFEAT'?.6:1;
 draw(body.pos.x,body.pos.y,a.frame,a.pose,alpha,motion===1?a.previous:null,a.blend);
 return true;
}
if(typeof module!=='undefined')module.exports={
 rulerIdlePose,rulerPose,rulerFrame,rulerTransitionFrames,rulerTransitionMix,
 updateRulerAnimation,reactRuler
};