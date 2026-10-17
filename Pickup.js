// Pickup Entity (extends Vehicle)
// Drifting collectibles providing Harmonize charges and musical rests

class Pickup extends Vehicle {
  constructor(x, y, type = 'HARMONIZE') {
    super(x, y);
    this.type = type; // HARMONIZE, REST, TUNE or VOLUME
    this.maxSpeed = 2.2;
    this.maxForce = 0.15;
    this.r = 14;
    this.lifeTime = 12.0;
    this.isDead = false;

  }

  updateDrift(dt, shaft) {
    this.lifeTime -= dt;
    if (this.lifeTime <= 0 || this.pos.y > shaft.y + shaft.height + 30) {
      this.isDead = true;
      return;
    }

    // Wander gently while drifting downwards
    const wanderF = this.wander();
    if (wanderF) {
      wanderF.mult(0.5);
      this.applyForce(wanderF);
    }

    // Gentle downward bias
    const f = velocityForce(this.vel, {x:0,y:1.2}, this.maxForce*0.5);
    this.applyForce(createVector(f.x,f.y));
  }

  show() {
    if(this.isDead)return;
    const c=drawingContext;c.save();c.translate(this.pos.x,this.pos.y);
    const calm=typeof reduceMotion!=='undefined'&&reduceMotion;
    if(!calm)c.rotate(Math.sin(frameCount*.025)*.12);
    if(spriteAtlas){spriteAtlas.draw('glow',0,0,60,60);
      spriteAtlas.draw(this.type==='REST'?'rest':'pickup',0,0,32,32);}
    if(this.type==='TUNE'||this.type==='VOLUME'){
      c.fillStyle=this.type==='TUNE'?'#ff8aa6':'#82f5d4';c.font='bold 14px monospace';
      c.textAlign='center';c.textBaseline='middle';c.fillText(this.type==='TUNE'?'♥':'V',0,1);
    }c.restore();
  }
}
if(typeof module!=='undefined')module.exports={Pickup};
