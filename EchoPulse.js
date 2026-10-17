// Nova sends a delayed copy of the player's resonance. The body steers with Vehicle.
class EchoPulse extends Vehicle {
  constructor(x,y,target,tuning='HIGH'){
    super(x,y);this.target={x:target.x,y:target.y};this.tuning=tuning;
    this.mode='WARN';this.age=0;this.r=20;this.isDead=false;
    this.maxSpeed=7.2;this.maxForce=.62;this.rayonZoneDeFreinage=40;
  }
  updatePulse(dt,boss){
    this.age+=dt;if(this.mode==='WARN'&&this.age>.9)this.mode='SEEK';
    const target=this.mode==='RETURN'?boss:this.mode==='WARN'?
      {x:boss.x,y:boss.y+70}:this.target;
    this.maxSpeed=this.mode==='RETURN'?11.5:7.2;
    this.applyForce(this.mode==='WARN'?this.arrive(createVector(target.x,target.y)):
      this.seek(createVector(target.x,target.y)));
    super.update();
    if(this.age>6)this.isDead=true;
  }
  show(){
    if(this.isDead)return;
    const c=drawingContext,col=TUNINGS[this.tuning]?.color||'#74d9ff';
    c.save();c.translate(this.pos.x,this.pos.y);
    c.shadowColor=col;c.shadowBlur=20;c.strokeStyle=col;c.lineWidth=3;
    for(let i=0;i<2;i++){c.globalAlpha=.9-i*.3;c.beginPath();
      c.arc(0,0,12+i*10+Math.sin(this.age*9-i)*3,0,Math.PI*2);c.stroke();}
    c.globalAlpha=1;c.fillStyle='#f8f7ff';c.fillRect(-3,-3,6,6);
    c.font='bold 12px monospace';c.textAlign='center';c.fillText(this.tuning,0,-29);c.restore();
  }
}
if(typeof module!=='undefined')module.exports={EchoPulse};
