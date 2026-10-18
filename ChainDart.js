// A red triangular projectile. Its travel is entirely inherited Vehicle steering.
class ChainDart extends Vehicle {
  constructor(x,y,index=0){
    super(x,y);this.index=index;this.mode='WARN';this.age=0;this.r=17;this.isDead=false;
    this.maxSpeed=11;this.maxForce=.72;this.rayonZoneDeFreinage=42;
  }
  updateDart(dt,target){
    this.age+=dt;
    this.maxSpeed=this.mode==='RETURN'?13:11;
    this.applyForce(this.mode==='WARN'||this.mode==='HOLD'?this.arrive(createVector(target.x,target.y)):
      this.seek(createVector(target.x,target.y)));
    super.update();
  }
  show(){
    if(this.isDead)return;
    const c=drawingContext,heading=this.vel.mag()>.2?Math.atan2(this.vel.y,this.vel.x):Math.PI/2;
    c.save();c.translate(this.pos.x,this.pos.y);c.rotate(heading+Math.PI/2);
    const state=this.mode==='WARN'?'warn':this.mode==='RETURN'?'counter':
      this.mode==='HOLD'?'hit':'active';
    if(typeof attackAtlas!=='undefined'&&attackAtlas)
      attackAtlas.draw(c,'onyxTip',state,0,0,58,0,this.age);
    else{
      c.fillStyle=this.mode==='RETURN'?'#fff4bd':'#ff315c';
      c.beginPath();c.moveTo(0,-33);c.lineTo(20,17);c.lineTo(0,8);c.lineTo(-20,17);c.closePath();c.fill();
    }
    c.restore();
  }
}
if(typeof module!=='undefined')module.exports={ChainDart};
