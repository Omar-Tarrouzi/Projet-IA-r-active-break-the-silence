// Three depth layers of travelling starlight. Every moving mote is a Vehicle.
class SpaceMote extends Vehicle {
  constructor(x,y,depth,twinkle=0){
    super(x,y);this.depth=depth;this.twinkle=twinkle;this.maxSpeed=6.8;this.maxForce=.48;
  }
  updateTravel(climbSpeed,boost=0){
    const speed=Math.min(this.maxSpeed,(.7+climbSpeed*.28+boost*.15)*this.depth);
    const desired={x:0,y:speed};
    const f=velocityForce(this.vel,desired,this.maxForce);
    this.applyForce(createVector(f.x,f.y));
    super.update();
  }
  show(){
    const c=drawingContext,len=Math.max(2,this.vel.y*(2+this.depth*3));
    c.save();c.globalAlpha=Math.min(.85,.18+this.depth*.25);
    c.strokeStyle=this.depth>1.35?'#a5e4ff':'#aa9acb';
    c.lineWidth=this.depth>1.35?1.5:1;
    c.beginPath();c.moveTo(this.pos.x,this.pos.y-len);c.lineTo(this.pos.x,this.pos.y);c.stroke();
    c.fillStyle='#e8eeff';c.fillRect(this.pos.x-.7,this.pos.y-.7,1.4,1.4);c.restore();
  }
}
if(typeof module!=='undefined')module.exports={SpaceMote};
