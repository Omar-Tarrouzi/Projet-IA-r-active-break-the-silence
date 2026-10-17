class Spark extends Vehicle {
  constructor(x,y,colorStr,vel) {
    super(x,y); this.maxSpeed=6; this.maxForce=0.5; this.r=2;
    this.colorStr=colorStr||'#e6c581'; this.life=0.45; this.maxLife=0.45; this.isDead=false;
    const a=random(Math.PI*2);
    this.desired=vel?vel.copy():createVector(Math.cos(a)*5,Math.sin(a)*5);
  }
  updateSpark(dt) {
    if(this.isDead) return;
    const f=velocityForce(this.vel,this.life>0.25?this.desired:{x:0,y:0},this.maxForce);
    this.applyForce(createVector(f.x,f.y)); super.update();
    this.life-=dt; if(this.life<=0) this.isDead=true;
  }
  show() {
    const c=drawingContext; c.fillStyle=this.colorStr;
    c.globalAlpha=Math.max(0,this.life/this.maxLife);
    c.fillRect(this.pos.x,this.pos.y,2,2); c.globalAlpha=1;
  }
}
if(typeof module!=='undefined') module.exports={Spark};
