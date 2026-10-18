// Cadence's diamond is a steered Vehicle. A well-timed dodge breaks its target lock.
class CadenceDiamond extends Vehicle{
 constructor(x,y,target){
  super(x,y);this.lock={x:target.x,y:target.y};this.mode='WARN';this.age=0;
  this.maxSpeed=8.5;this.maxForce=.24;this.r=17;this.isDead=false;this.hitPlayer=false;
 }
 updateDiamond(dt,guitar,boss){
  this.age+=dt;
  if(this.mode==='WARN'&&this.age>=.65)this.mode='SEEK';
  const missed=Math.hypot(guitar.pos.x-this.lock.x,guitar.pos.y-this.lock.y)>85;
  const atLock=Math.hypot(this.pos.x-this.lock.x,this.pos.y-this.lock.y)<105;
  if(this.mode==='SEEK'&&this.age>1&&missed&&atLock)this.mode='RETURN';
  const target=this.mode==='RETURN'?boss:this.mode==='WARN'?{x:this.lock.x,y:this.lock.y-130}:
    this.age<1.7?this.lock:guitar.pos;
  this.maxSpeed=this.mode==='RETURN'?10:8.5;
  const force=diamondSteerForce(this,target,this.mode==='SEEK'&&this.age>=1.7?.13:.3);
  this.applyForce(createVector(force.x,force.y));super.update();
  if(this.age>5.5)this.isDead=true;
 }
 show(){
  if(this.isDead)return;const c=drawingContext;
  c.save();c.translate(this.pos.x,this.pos.y);
  c.rotate(Math.atan2(this.vel.y,this.vel.x)+Math.PI/2);
  c.shadowColor=this.mode==='RETURN'?'#fff1bd':'#efc46d';c.shadowBlur=15;
  if(typeof attackAtlas!=='undefined'&&attackAtlas)
   attackAtlas.draw(c,'cadenceDiamond',this.mode==='WARN'?'warn':this.mode==='RETURN'?'counter':'active',0,0,48,0,this.age);
  else{c.fillStyle=this.mode==='RETURN'?'#fff1bd':'#efc46d';c.beginPath();c.moveTo(0,-23);c.lineTo(14,0);c.lineTo(0,23);c.lineTo(-14,0);c.closePath();c.fill();}
  c.restore();
 }
}
if(typeof module!=='undefined')module.exports={CadenceDiamond};
