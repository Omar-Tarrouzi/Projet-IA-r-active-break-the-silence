// One articulated Vehicle: crown, arms and cloth are local rendering geometry.
class Orpheus extends Vehicle {
  constructor(x,y){super(x,y);this.maxSpeed=4;this.maxForce=.23;this.age=0;this.phase='ENTRANCE';this.act=1;this.voice=0;this.r=36;this.visualPose=0;this.oldPose=0;this.poseMix=1;}
  step(dt,target){this.age+=dt;const pose=this.phase==='WARNING'?1:this.phase==='ACTIVE'?2:this.phase==='RECOVER'||this.phase==='EXPOSED'?3:0;if(pose!==this.visualPose){this.oldPose=this.visualPose;this.visualPose=pose;this.poseMix=0;}this.poseMix=Math.min(1,this.poseMix+dt*5);const f=sonataArriveForce(this,target);this.applyForce(createVector(f.x,f.y));super.update();}
  showEnding(sprite,opacity=1,scale=1){
    if(!sprite?.complete||!sprite.naturalWidth)return;
    const c=drawingContext,h=370*scale,w=h*sprite.naturalWidth/sprite.naturalHeight;
    c.save();c.globalAlpha=Math.max(0,Math.min(1,opacity));
    c.translate(this.pos.x,this.pos.y+(typeof reduceMotion!=='undefined'&&reduceMotion?0:Math.sin(this.age*1.7)*3));
    c.drawImage(sprite,-w/2,-h*.52,w,h);c.restore();
  }
  show(){
    const c=drawingContext,t=this.age,calm=typeof reduceMotion!=='undefined'&&reduceMotion;
    const wind=calm?0:Math.sin(t*2.4)*10,command=this.phase==='WARNING'?Math.min(1,this.poseTime/1.1):this.phase==='ACTIVE'?1:.18;
    const color=SONATA.colors[this.voice],reveal=this.act===2;
    c.save();c.translate(this.pos.x,this.pos.y);
    const art=typeof finaleMedia!=='undefined'&&finaleMedia?.orpheus;
    if(art?.complete&&art.naturalWidth){
      const boxes=[[0,0,741,613],[741,0,560,617],[0,617,808,592],[808,617,493,592]];
      const drawPose=(index,alpha)=>{const [x,y,w,h]=boxes[index],scale=300/h;c.globalAlpha=alpha;c.drawImage(art,x,y,w,h,-w*scale/2,-151,w*scale,h*scale);};
      c.translate(0,calm?0:Math.sin(t*2)*3);drawPose(this.oldPose,1-this.poseMix);drawPose(this.visualPose,this.poseMix);c.restore();return;
    }
    c.strokeStyle=color;c.lineWidth=1.5;c.globalAlpha=.38;
    for(let k=0;k<4;k++){c.beginPath();c.ellipse(0,-32,75+k*9,105+k*7,Math.PI/5*(k-1.5),0,Math.PI*1.8);c.stroke();}
    c.globalAlpha=1;
    // Two flowing mantle lobes, continuous joins at the torso.
    for(const side of [-1,1]){
      const g=c.createLinearGradient(0,-50,side*100,160);g.addColorStop(0,'#35324e');g.addColorStop(1,'#100e22');
      c.fillStyle=g;c.strokeStyle='#9a8294';c.lineWidth=2;
      c.beginPath();c.moveTo(side*15,-74);c.bezierCurveTo(side*84,-70,side*(95+wind),65,side*(118-wind),157);
      c.quadraticCurveTo(side*67,135,side*50,102);c.lineTo(side*22,147);c.lineTo(0,-35);c.closePath();c.fill();c.stroke();
      c.strokeStyle=SONATA.colors[side<0?0:3];c.beginPath();c.moveTo(side*31,-40);c.quadraticCurveTo(side*(55+wind*.5),50,side*84,129);c.stroke();
      const ex=side*(38+command*18),ey=-15-command*35,hx=side*(70+command*29),hy=12-command*90;
      c.strokeStyle='#cbc3ce';c.lineWidth=17;c.lineCap='round';c.beginPath();c.moveTo(side*23,-56);c.lineTo(ex,ey);c.lineTo(hx,hy);c.stroke();
      c.strokeStyle='#27243c';c.lineWidth=12;c.stroke();
      c.strokeStyle='#edd8ce';c.lineWidth=5;c.beginPath();c.moveTo(hx,hy);c.lineTo(hx+side*8,hy-12);c.stroke();
      for(let f=0;f<3;f++){c.beginPath();c.moveTo(hx+side*6,hy-9);c.lineTo(hx+side*(9+f*4),hy-17-f*2);c.stroke();}
    }
    c.fillStyle='#242239';c.strokeStyle='#e5ca88';c.lineWidth=2;
    c.beginPath();c.moveTo(-27,-65);c.lineTo(27,-65);c.lineTo(38,70);c.lineTo(0,100);c.lineTo(-38,70);c.closePath();c.fill();c.stroke();
    c.strokeStyle=reveal?'#f4df9c':'#a99aae';c.lineWidth=3;
    for(let k=0;k<4;k++){c.beginPath();c.moveTo(-19,-45+k*22);c.lineTo(19,-34+k*22);c.stroke();}
    c.fillStyle='#ddd0cd';c.beginPath();c.ellipse(0,-92,20,27,0,0,Math.PI*2);c.fill();
    c.fillStyle='#151326';c.beginPath();c.moveTo(-24,-96);c.lineTo(-15,-126);c.lineTo(14,-123);c.lineTo(25,-94);c.lineTo(8,-109);c.lineTo(-8,-100);c.closePath();c.fill();
    c.strokeStyle='#f7e3ba';c.lineWidth=3;
    c.beginPath();c.moveTo(-40,-114);c.lineTo(-35,-153);c.lineTo(-18,-139);c.moveTo(40,-114);c.lineTo(35,-153);c.lineTo(18,-139);c.stroke();
    for(let k=0;k<4;k++){c.strokeStyle=SONATA.colors[k];c.beginPath();c.moveTo(-23+k*15,-147);c.lineTo(-23+k*15,-168-(k%2)*8);c.stroke();}
    c.fillStyle=color;c.shadowColor=color;c.shadowBlur=10;c.fillRect(-13,-95,9,3);c.fillRect(5,-95,9,3);c.shadowBlur=0;
    c.fillStyle='#efcc8e';c.beginPath();c.moveTo(0,-38);c.lineTo(10,-22);c.lineTo(0,-6);c.lineTo(-10,-22);c.closePath();c.fill();
    c.restore();
  }
}
if(typeof module!=='undefined')module.exports={Orpheus};
