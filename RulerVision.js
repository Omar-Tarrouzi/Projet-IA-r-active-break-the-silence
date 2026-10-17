// Apparitions in the origin sequence. Each ruler is a Vehicle; animation is local pose.
const RULERS = Object.freeze([
  {key:'VESPER', name:'VESPER', domain:'SILENCE', color:'#c9a4ff'},
  {key:'ONYX', name:'HARM ONYX', domain:'DISCORD', color:'#ff789e'},
  {key:'NOVA', name:'NOVA', domain:'ECHO', color:'#74d9ff'},
  {key:'CADENCE', name:'CADENCE', domain:'MEASURE', color:'#f4d185'}
]);
class RulerVision extends Vehicle {
  constructor(x,y,key) {
    super(x,y);
    this.key=key;
    this.profile=RULERS.find(r=>r.key===key)||RULERS[0];
    this.age=0;this.maxSpeed=5;this.maxForce=.32;this.rayonZoneDeFreinage=55;
    this.target={x,y};this.trail=[];
  }
  updateVision(dt) {
    this.age+=dt;
    this.applyForce(this.arrive(createVector(this.target.x,this.target.y)));
    super.update();
    this.trail.push({x:this.pos.x,y:this.pos.y});
    if(this.trail.length>20)this.trail.shift();
  }
  // An apparition is a single steered Vehicle. These ribbons and bolts are local
  // drawing geometry, not extra actors or scripted world-space movement.
  showSilhouette(opacity=1) {
    const c=drawingContext,t=this.age,col=this.profile.color;
    c.save();c.globalCompositeOperation='lighter';
    // The wake bends with the actual steered trajectory.
    if(this.trail.length>2){
      for(let layer=0;layer<3;layer++){
        c.beginPath();for(let i=0;i<this.trail.length;i++){
          const p=this.trail[i],q=i/(this.trail.length-1),wave=Math.sin(t*13-i*.65+layer*2.1)*(1-q)*18;
          const x=p.x+wave,y=p.y+Math.cos(t*9-i*.5+layer)*(1-q)*9;
          if(!i)c.moveTo(x,y);else c.lineTo(x,y);
        }
        c.strokeStyle=layer===0?col:layer===1?'#d5f3ff':'#ffffff';
        c.globalAlpha=opacity*(layer===0?.25:layer===1?.12:.07);c.lineWidth=layer===0?27:layer===1?10:3;c.lineCap='round';c.stroke();
      }
    }
    c.translate(this.pos.x,this.pos.y);c.globalAlpha=opacity;
    const pulse=Math.sin(t*12+this.key.length)*.12,stretch=this.key==='ONYX'?1.3:this.key==='CADENCE'?.82:1;
    c.save();c.rotate(Math.sin(t*4)*.17);c.scale(stretch,1+pulse);
    c.globalCompositeOperation='source-over';
    const glow=c.createRadialGradient(0,0,3,0,0,67);
    glow.addColorStop(0,'#101323ee');glow.addColorStop(.18,col+'cc');glow.addColorStop(.45,col+'44');glow.addColorStop(1,col+'00');
    c.fillStyle=glow;c.beginPath();c.arc(0,0,67,0,Math.PI*2);c.fill();c.restore();c.globalCompositeOperation='lighter';
    // Hand-drawn lightning fractures, changing topology every few frames.
    const arms=this.key==='CADENCE'?8:this.key==='ONYX'?5:6;
    for(let a=0;a<arms;a++){
      const angle=a*Math.PI*2/arms+t*(this.key==='NOVA'?-.9:1.15),reach=42+12*Math.sin(t*7+a*4),branch=[];
      for(let k=0;k<=5;k++){const r=8+(reach-8)*k/5,jitter=k===0||k===5?0:Math.sin(Math.floor(t*17)*2.3+a*13+k*19)*9;
        branch.push({x:Math.cos(angle)*r+Math.cos(angle+Math.PI/2)*jitter,
          y:Math.sin(angle)*r+Math.sin(angle+Math.PI/2)*jitter});}
      for(const [width,alpha,ink] of [[9,.07,col],[2.5,.43,col],[1,.58,'#ffffff']]){
        c.beginPath();c.moveTo(branch[0].x,branch[0].y);for(let k=1;k<branch.length;k++)c.lineTo(branch[k].x,branch[k].y);
        c.globalAlpha=opacity*alpha;c.lineWidth=width;c.strokeStyle=ink;c.stroke();
      }
    }
    c.globalAlpha=opacity*.72;c.strokeStyle=col;c.lineWidth=2;
    if(this.key==='VESPER'){
      for(let i=0;i<2;i++){c.beginPath();c.ellipse(0,0,24+i*19,39+i*13,t*.7+i,0,Math.PI*1.65);c.stroke();}
    }else if(this.key==='ONYX'){
      for(let i=0;i<4;i++){const a=t*1.6+i*Math.PI/2;c.beginPath();c.moveTo(Math.cos(a)*49,Math.sin(a)*49);c.lineTo(Math.cos(a+.22)*66,Math.sin(a+.22)*66);c.lineTo(Math.cos(a-.22)*66,Math.sin(a-.22)*66);c.closePath();c.stroke();}
    }else if(this.key==='NOVA'){
      for(let i=0;i<3;i++){c.globalAlpha=opacity*(.28-i*.07);c.beginPath();c.ellipse(-i*13,0,27+i*17,19+i*11,t*.6,0,Math.PI*2);c.stroke();}
    }else{
      for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.8,r=i%3?56:67;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+8),Math.sin(a)*(r+8));c.stroke();}
    }
    c.globalAlpha=opacity*.65;c.fillStyle='#ffffff';c.beginPath();c.arc(0,0,3+pulse*3,0,Math.PI*2);c.fill();c.restore();
  }
  show() {
    const c=drawingContext,t=this.age,kind=this.key,col=this.profile.color;
    c.save();c.translate(this.pos.x,this.pos.y+Math.sin(t*1.8)*3);
    c.shadowColor=col;c.shadowBlur=14;
    if(typeof sceneAssets!=='undefined'&&sceneAssets){
      const frame=kind==='VESPER'?(Math.floor(t*1.2)%3===0?'vesperCommand':'vesperIdle'):
        kind==='ONYX'?(Math.floor(t*1.2)%3===0?'onyxCommand':'onyxIdle'):
        kind==='NOVA'?'novaIdle':'cadenceIdle';
      const sprite=sceneAssets[frame];
      if(sprite){const h=148,w=Math.min(180,h*sprite.width/sprite.height);
        c.imageSmoothingEnabled=false;c.drawImage(sprite.canvas,-w/2,-h/2,w,h);
        if(kind==='NOVA'){
          c.strokeStyle='#83dcff';c.lineWidth=1.2;c.globalAlpha=.28+.16*Math.sin(t*2);
          for(let i=0;i<2;i++){c.beginPath();c.ellipse(0,-10,26+i*12,34+i*16,t*.28+i*.6,0,Math.PI*2);c.stroke();}
        }else if(kind==='CADENCE'){
          c.strokeStyle='#ffe3a7';c.lineWidth=1.4;c.globalAlpha=.48;
          const swing=Math.sin(t*2.6)*.42;c.beginPath();c.moveTo(0,-13);
          c.lineTo(Math.sin(swing)*52,47);c.stroke();
          c.beginPath();c.arc(Math.sin(swing)*52,47,3,0,Math.PI*2);c.stroke();
        }
        c.restore();return;}
    }
    c.strokeStyle=col;c.lineWidth=2;c.lineCap='round';
    if(kind==='VESPER') {
      c.fillStyle='#171629';c.beginPath();c.moveTo(0,-28);c.lineTo(-30,-9);c.lineTo(-48,58);
      c.lineTo(-9,43);c.lineTo(0,75);c.lineTo(9,43);c.lineTo(48,58);c.lineTo(30,-9);c.closePath();c.fill();c.stroke();
      c.beginPath();c.ellipse(0,-56,38,10,Math.sin(t)*.08,0,Math.PI*2);c.stroke();
      for(const s of [-1,1]){c.beginPath();c.moveTo(s*16,-43);c.lineTo(s*32,-72);c.stroke();
        const handY=-18+Math.sin(t*2+s)*8;c.beginPath();c.moveTo(s*22,-13);
        c.quadraticCurveTo(s*56,15,s*75,handY);c.stroke();
        c.beginPath();c.arc(s*75,handY,7,0,Math.PI*2);c.stroke();}
      c.fillStyle='#e6def4';c.fillRect(-11,-45,22,23);c.fillStyle='#ff668c';c.fillRect(-8,-36,16,2);
    } else if(kind==='ONYX') {
      c.fillStyle='#261621';c.beginPath();c.moveTo(0,-31);c.lineTo(-39,-5);c.lineTo(-60,66);
      c.lineTo(-17,51);c.lineTo(0,78);c.lineTo(24,47);c.lineTo(56,57);c.lineTo(31,-8);c.closePath();c.fill();c.stroke();
      c.fillStyle='#4a2735';c.beginPath();c.moveTo(-36,-63);c.lineTo(-52,-84);c.lineTo(-16,-72);
      c.lineTo(0,-100);c.lineTo(18,-66);c.lineTo(48,-81);c.lineTo(33,-52);c.closePath();c.fill();c.stroke();
      c.fillStyle='#f4d5dc';c.beginPath();c.moveTo(-13,-53);c.lineTo(12,-53);c.lineTo(8,-29);c.lineTo(-6,-24);c.closePath();c.fill();
      for(const s of [-1,1]){const x=s*(50+Math.sin(t*2+s)*8);c.beginPath();c.moveTo(s*25,-4);
        c.lineTo(x,25);c.lineTo(x+s*15,38);c.stroke();}
      c.strokeStyle='#ffbcc9';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-50,25+i*13);c.lineTo(51,13+i*18+Math.sin(t*3+i)*7);c.stroke();}
    } else if(kind==='NOVA') {
      c.fillStyle='#102536';c.beginPath();c.moveTo(0,-35);c.lineTo(-24,-17);c.lineTo(-35,65);
      c.lineTo(0,51);c.lineTo(35,65);c.lineTo(24,-17);c.closePath();c.fill();c.stroke();
      for(let i=0;i<3;i++){c.globalAlpha=.65-i*.13;c.beginPath();
        c.ellipse(0,-32,40+i*18,48+i*13,t*.32+i*.5,0,Math.PI*2);c.stroke();}
      c.globalAlpha=1;c.fillStyle='#d5f5ff';c.beginPath();c.moveTo(-15,-50);c.lineTo(15,-50);
      c.lineTo(11,-25);c.lineTo(-11,-25);c.closePath();c.fill();
      c.fillStyle='#207492';c.fillRect(-12,-39,24,5);
      for(const s of [-1,1]){c.beginPath();c.moveTo(s*23,-12);
        c.quadraticCurveTo(s*70,-5,s*(57+Math.sin(t*2)*10),40);c.stroke();}
    } else {
      c.fillStyle='#2d2730';c.beginPath();c.moveTo(0,-36);c.lineTo(-27,-17);c.lineTo(-32,62);
      c.lineTo(0,51);c.lineTo(32,62);c.lineTo(27,-17);c.closePath();c.fill();c.stroke();
      c.fillStyle='#e6d5a9';c.beginPath();c.moveTo(0,-82);c.lineTo(-17,-53);c.lineTo(0,-62);
      c.lineTo(17,-53);c.closePath();c.fill();
      c.fillStyle='#f4e7c5';c.fillRect(-10,-51,20,27);
      c.strokeStyle='#ffe5a8';c.beginPath();c.moveTo(0,-70);c.lineTo(0,55);c.stroke();
      const swing=Math.sin(t*2.4)*.38;c.beginPath();c.moveTo(0,-18);
      c.lineTo(Math.sin(swing)*55,35);c.stroke();c.beginPath();c.arc(Math.sin(swing)*55,35,8,0,Math.PI*2);c.stroke();
      for(const s of [-1,1]){c.beginPath();c.moveTo(s*22,-10);c.lineTo(s*58,25+Math.sin(t*2+s)*7);c.stroke();}
    }
    c.restore();
  }
}
if(typeof module!=='undefined')module.exports={RULERS,RulerVision};

