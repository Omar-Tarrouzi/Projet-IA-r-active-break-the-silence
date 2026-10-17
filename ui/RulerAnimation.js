// Local articulation of one Vehicle. No physics or attack targets are changed.
function rulerPose(key,phase,time,age,recoil=0,beat=0){
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const warn=phase.endsWith('_WARN'),attack=['A','B','ORBIT','HAND','MISSILE','WORD_ATTACK','LUNGE'].includes(phase);
 const wind=warn?ease(time/.65):0,strike=attack?Math.exp(-time*5):0;
 const hurt=Math.sin(Math.min(1,recoil/.65)*Math.PI/2),rhythm=key==='CADENCE'&&attack?Math.sin(beat/1.2*Math.PI*2):0;
 return {lean:-wind*.045+strike*.09-hurt*.14+rhythm*.025,y:Math.sin(age*2)*2+wind*3-strike*5+hurt*6+rhythm*4,
 arm:wind*.12-strike*.19+hurt*.21+rhythm*.075,hair:Math.sin(age*2.3-.7)*.018-strike*.035+hurt*.025,
 cloth:Math.sin(age*2-1.2)*.025+strike*.055-hurt*.045,scaleX:1-wind*.025+strike*.04+hurt*.025,
 scaleY:1+wind*.02-strike*.035-hurt*.04,glow:warn?wind:attack?strike:0};
}
function rulerFrame(key,phase){
 const prefix=key.toLowerCase();
 if(['EXPOSED','DEFEAT'].includes(phase))return prefix+(key==='VESPER'?'Exposed':'Shield');
 if(key==='VESPER')return prefix+(['EDGE','SPEAR_WARN','LUNGE'].includes(phase)?'Lunge':['ORBIT','HAND','MISSILE','WORD_ATTACK','ORBIT_WARN','HAND_WARN','MISSILE_WARN','WORD_WARN'].includes(phase)?'Command':'Idle');
 return prefix+(phase.endsWith('_WARN')?'Command':['A','B'].includes(phase)?'Lunge':'Idle');
}
function updateRulerAnimation(body){
 const frame=rulerFrame(body.key||'VESPER',body.phase);
 if(!body.animation)body.animation={phase:body.phase,time:0,frame,previous:frame,blend:1,recoil:0,history:[],tick:0};
 const a=body.animation;
 if(a.phase!==body.phase){a.phase=body.phase;a.time=0;}
 if(a.frame!==frame){a.previous=a.frame;a.frame=frame;a.blend=0;}
 a.time+=1/60;a.blend=Math.min(1,a.blend+1/12);a.recoil=Math.max(0,a.recoil-1/60);
 const next=rulerPose(body.key||'VESPER',body.phase,a.time,body.age,a.recoil,body.beatClock||0);
 // Continuous intermediate poses, including interruption by a counter hit.
 if(!a.pose)a.pose=next;else for(const k of Object.keys(next))a.pose[k]+=(next[k]-a.pose[k])*.28;
 if(body.key==='NOVA'&&++a.tick%6===0){a.history.push({x:body.pos.x,y:body.pos.y,frame:a.frame,pose:{...a.pose}});if(a.history.length>4)a.history.shift();}
}
function reactRuler(body,strength=1){if(!body.animation)updateRulerAnimation(body);body.animation.recoil=Math.max(body.animation.recoil,.65*Math.max(0,Math.min(1,strength)));}
// Continuous horizontal bands bend the existing artwork without cutout seams.
// Head/hair sway, shoulder extension and cloth lag have separate pose channels.
function drawRulerLayers(c,sprite,h,pose,motion){
 const w=Math.min(260,h*sprite.width/sprite.height),source=sprite.canvas;
 const bands=Math.min(24,sprite.height),step=sprite.height/bands;
 for(let i=0;i<bands;i++){
  const sy=i*step,sh=Math.min(step,sprite.height-sy),u=(sy+sh*.5)/sprite.height;
  const hair=Math.pow(Math.max(0,1-u/.3),2);
  const cloth=Math.pow(Math.max(0,(u-.42)/.58),2);
  const shoulders=Math.exp(-Math.pow((u-.32)/.14,2));
  const dx=(pose.hair*hair*55+pose.cloth*cloth*85)*motion;
  const stretch=1+pose.arm*shoulders*.28*motion;
  c.drawImage(source,0,sy,sprite.width,sh,-w*stretch/2+dx,-h/2+sy/sprite.height*h,w*stretch,sh/sprite.height*h+.35);
 }
}
let rulerRenderSurface;
function drawRulerAnimation(c,body){
 if(typeof sceneAssets==='undefined'||!sceneAssets||!body.animation)return false;
 const a=body.animation;if(!sceneAssets[a.frame])return false;
 const key=body.key||'VESPER',h=key==='VESPER'||key==='ONYX'?205:218;
 const color=key==='ONYX'?'#ff718f':key==='NOVA'?'#74d9ff':key==='CADENCE'?'#e9cf8b':'#c8b7ff';
 const motion=(typeof reduceMotion!=='undefined'&&reduceMotion)? .2:1;
 const draw=(x,y,frame,pose,alpha,glow)=>{
  const img=sceneAssets[frame];if(!img)return;
  c.save();c.translate(x,y+pose.y*motion);c.rotate(pose.lean*motion);c.scale(1+(pose.scaleX-1)*motion,1+(pose.scaleY-1)*motion);
  c.globalAlpha=alpha;c.imageSmoothingEnabled=false;c.shadowColor=color;c.shadowBlur=0;
  // Sprites already contain painted glow; avoid costly live blur on every frame.
  if(!rulerRenderSurface){rulerRenderSurface=document.createElement('canvas');rulerRenderSurface.width=320;rulerRenderSurface.height=280;}
  const layer=rulerRenderSurface.getContext('2d');layer.clearRect(0,0,320,280);layer.save();layer.translate(160,140);
  layer.imageSmoothingEnabled=false;drawRulerLayers(layer,img,h,pose,motion);layer.restore();
  c.drawImage(rulerRenderSurface,-160,-140);c.restore();
 };
 // Trail snapshots are render history of this Vehicle, never autonomous particles.
 if(key==='NOVA'&&motion===1&&['A','B','A_WARN','B_WARN'].includes(body.phase))for(let i=0;i<a.history.length-1;i++){
  const s=a.history[i];draw(s.x,s.y,s.frame,s.pose,.045+i*.025,0);
 }
 const blend=a.blend*a.blend*(3-2*a.blend),alpha=body.phase==='DEFEAT'?.6:1;
 if(blend<1)draw(body.pos.x,body.pos.y,a.previous,a.pose,(1-blend)*alpha,0);
 draw(body.pos.x,body.pos.y,a.frame,a.pose,blend*alpha,4+a.pose.glow*6);return true;
}
if(typeof module!=='undefined')module.exports={rulerPose,rulerFrame,updateRulerAnimation,reactRuler};
