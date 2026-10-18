// Nova sends a delayed copy of the player's resonance. The body steers with Vehicle.
class EchoPulse extends Vehicle {
  constructor(x,y,target,tuning='HIGH'){
    super(x,y);this.target={x:target.x,y:target.y};this.tuning=tuning;
    this.mode='WARN';this.age=0;this.r=20;this.isDead=false;
    this.flameTrail=[];
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
    if(this.mode!=='WARN'){
      this.flameTrail.unshift({x:this.pos.x,y:this.pos.y});
      if(this.flameTrail.length>7)this.flameTrail.pop();
    }
    if(this.age>6)this.isDead=true;
  }
  show(){
    if(this.isDead)return;
    const c=drawingContext,col=TUNINGS[this.tuning]?.color||'#74d9ff';
    c.save();
    // Blue fire and its afterglow are drawn on this steered Vehicle.
    for(let i=this.flameTrail.length-1;i>=0;i--){
      const p=this.flameTrail[i],fade=1-i/this.flameTrail.length;
      c.globalAlpha=fade*(this.mode==='RETURN'?.28:.42);
      c.fillStyle=this.mode==='RETURN'?'#d5fff1':'#1388ee';
      c.beginPath();c.arc(p.x,p.y,3+fade*11,0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;c.translate(this.pos.x,this.pos.y);
    const heading=Math.atan2(this.vel.y,this.vel.x)+Math.PI/2;
    c.rotate(heading);
    for(let i=0;i<3;i++){
      const sway=Math.sin(this.age*14+i*2.1)*4;
      c.globalAlpha=this.mode==='WARN'?.36:.56;
      c.fillStyle=i===1?'#b9f7ff':'#34aaff';
      c.beginPath();c.moveTo((i-1)*8,-4);
      c.quadraticCurveTo((i-1)*9+sway,-19,(i-1)*7-sway,-34-i*5);
      c.quadraticCurveTo((i-1)*8+8,-17,(i-1)*8+5,-2);
      c.closePath();c.fill();
    }
    c.globalAlpha=1;
    c.shadowColor=col;c.shadowBlur=20;c.strokeStyle=col;c.lineWidth=3;
    for(let i=0;i<2;i++){c.globalAlpha=.9-i*.3;c.beginPath();
      c.arc(0,0,12+i*10+Math.sin(this.age*9-i)*3,0,Math.PI*2);c.stroke();}
    c.globalAlpha=1;
    if(typeof attackAtlas!=='undefined'&&attackAtlas)
      attackAtlas.draw(c,'novaCore',this.mode==='WARN'?'warn':this.mode==='RETURN'?'counter':'active',
        0,0,32,0,this.age);
    else{c.fillStyle='#f8f7ff';c.fillRect(-3,-3,6,6);}
    c.rotate(-heading);c.font='bold 12px monospace';c.textAlign='center';
    c.fillStyle='#f5fbff';c.fillText(this.tuning,0,-38);c.restore();
  }
}
if(typeof module!=='undefined')module.exports={EchoPulse};
