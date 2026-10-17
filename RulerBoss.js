// Ruler body. All translation comes from Vehicle steering and super.update().
class RulerBoss extends Vehicle {
  constructor(x,y,key){
    super(x,y);this.key=key;this.phase='ENTRANCE';this.age=0;this.isDead=false;
    this.maxSpeed=4.8;this.maxForce=.38;this.rayonZoneDeFreinage=80;
  }
  update(){super.update();this.age+=1/60;updateRulerAnimation(this);}
  show(){
    if(this.isDead)return;
    if(drawRulerAnimation(drawingContext,this))return;
    drawingContext.save();drawingContext.translate(this.pos.x,this.pos.y);
    drawingContext.fillStyle='#1a1629';drawingContext.fillRect(-48,-95,96,190);drawingContext.restore();
  }
}
if(typeof module!=='undefined')module.exports={RulerBoss};
