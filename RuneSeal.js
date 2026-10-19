class RuneSeal extends Vehicle {
  constructor(x,y,index){super(x,y);this.index=index;this.maxSpeed=5;this.maxForce=.3;this.age=0;}
  step(dt,target){this.age+=dt;const f=sonataArriveForce(this,target,45);this.applyForce(createVector(f.x,f.y));super.update();}
  show(prisoner,fade=1){
    const c=drawingContext;c.save();c.globalAlpha=fade;c.strokeStyle=SONATA.colors[this.index];c.lineWidth=2;
    c.setLineDash([7,5]);c.beginPath();c.moveTo(prisoner.pos.x,prisoner.pos.y-65);c.lineTo(this.pos.x,this.pos.y);c.stroke();c.setLineDash([]);
    c.translate(this.pos.x,this.pos.y);c.rotate(this.index*Math.PI/2);
    c.fillStyle='#121023';c.beginPath();c.moveTo(0,-14);c.lineTo(10,0);c.lineTo(0,14);c.lineTo(-10,0);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(-5,-5);c.lineTo(5,5);c.moveTo(5,-5);c.lineTo(-5,5);c.stroke();c.restore();
  }
}
if(typeof module!=='undefined')module.exports={RuneSeal};
