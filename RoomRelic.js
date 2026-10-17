// Torn pieces of the first room; every drifting prop uses Vehicle locomotion.
class RoomRelic extends Vehicle {
  constructor(x,y,kind,index=0) {
    super(x,y);this.kind=kind;this.index=index;this.age=0;this.target={x,y};this.origin={x,y};
    this.maxSpeed=4+index%3;this.maxForce=.22;this.rayonZoneDeFreinage=50;
  }
  updateRelic(dt) {
    this.age+=dt;
    this.applyForce(this.arrive(createVector(this.target.x,this.target.y)));
    super.update();
  }
  show() {
    const c=drawingContext,t=this.age;
    c.save();c.translate(this.pos.x,this.pos.y);c.rotate(Math.sin(t*.8+this.index)*.16);
    if(typeof sceneAssets!=='undefined'&&sceneAssets){
      const name=this.kind==='note'?'propNotes':'prop'+this.kind[0].toUpperCase()+this.kind.slice(1);
      const sprite=sceneAssets[name];if(sprite){const h=this.kind==='note'?24:this.kind==='page'?37:57,w=h*sprite.width/sprite.height;
        c.imageSmoothingEnabled=false;c.drawImage(sprite.canvas,-w/2,-h/2,w,h);c.restore();return;}
    }
    c.lineWidth=2;c.strokeStyle='#d9b99b';c.fillStyle='#483443';
    if(this.kind==='chair'){
      c.fillRect(-22,-25,44,27);c.strokeRect(-22,-25,44,27);
      c.fillRect(-17,-56,34,30);c.strokeRect(-17,-56,34,30);
      c.beginPath();c.moveTo(-16,2);c.lineTo(-22,38);c.moveTo(16,2);c.lineTo(22,38);c.stroke();
    }else if(this.kind==='lamp'){
      c.fillStyle='#f9d693';c.shadowColor='#ffcc76';c.shadowBlur=22;
      c.beginPath();c.arc(0,-15,14,0,Math.PI*2);c.fill();
      c.shadowBlur=0;c.strokeStyle='#ecdcbe';c.beginPath();c.moveTo(0,0);c.lineTo(0,39);c.moveTo(-20,39);c.lineTo(20,39);c.stroke();
    }else if(this.kind==='page'){
      c.fillStyle='#e5d8cb';c.fillRect(-18,-25,36,50);c.strokeRect(-18,-25,36,50);
      c.strokeStyle='#675673';for(let i=0;i<5;i++){c.beginPath();c.moveTo(-11,-14+i*8);c.lineTo(7+i%2*5,-14+i*8);c.stroke();}
    }else if(this.kind==='note'){
      c.fillStyle='#a9f5df';c.strokeStyle='#a9f5df';c.beginPath();c.ellipse(-4,9,7,5,-.3,0,Math.PI*2);c.fill();
      c.beginPath();c.moveTo(2,8);c.lineTo(2,-18);c.quadraticCurveTo(19,-11,10,-5);c.stroke();
    }
    c.restore();
  }
}
if(typeof module!=='undefined')module.exports={RoomRelic};

