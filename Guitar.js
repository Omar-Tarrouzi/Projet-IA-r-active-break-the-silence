// Player Guitar Entity (extends Vehicle)

class Guitar extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 8.5;
    this.maxForce = 0.55;
    this.r = 22;

    this.currentTuning = 'LOW';
    this.isCharging = false;
    this.chargeDuration = 0; // seconds
    this.maxChargeTime = 1.0;
    this.chargeAuraRadius = 0;
    this.wobblePhase = 0;
    this.collectPulse = 0;
    this.collectColor = '#82f5d4';

    // Sonic Dash / String Bend
    this.dashCooldown = 0;
    this.maxDashCooldown = 1.2;
    this.dashTimer = 0;

  }

  setTuning(tuningKey) {
    if (TUNINGS[tuningKey]) {
      this.currentTuning = tuningKey;
    }
  }

  updateCharge(isHolding, dt, volumeAvailable) {
    if (isHolding && volumeAvailable) {
      this.isCharging = true;
      this.chargeDuration = Math.min(this.maxChargeTime, this.chargeDuration + dt);
    } else {
      this.isCharging = false;
      this.chargeDuration = 0;
    }

    const ratio = this.chargeDuration / this.maxChargeTime;
    const tuning = TUNINGS[this.currentTuning];
    const targetRadius = tuning.maxRadius * (0.4 + 0.6 * ratio);
    this.chargeAuraRadius = this.isCharging ? targetRadius : 0;
  }

  performDash(targetMouse, shaft, scoreManager) {
    if (this.dashCooldown > 0) return false;

    let dir = p5.Vector.sub(targetMouse, this.pos);
    if (dir.mag() < 10) {
      dir = this.vel.mag() > 0.1 ? this.vel.copy() : createVector(0, -1);
    }
    dir.setMag(18.5);

    this.dashDesired = dir;
    this.dashTimer = 0.25;
    this.dashCooldown = this.maxDashCooldown;
    if (scoreManager) scoreManager.invulnerableTimer = Math.max(scoreManager.invulnerableTimer,0.35);
    return true;
  }

  update(dt = 0.016, shaft = null) {
    this.collectPulse = Math.max(0,this.collectPulse-dt*2.8);
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }

    this.maxSpeed = this.dashTimer > 0 ? 15 : 8.5;
    this.maxForce = this.dashTimer > 0 ? 1.6 : 0.55;
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0,this.dashTimer-dt);
      const bounds={x:shaft.x,y:shaft.y+shaft.height*.4,width:shaft.width,height:shaft.height*.6};
      const desired = containmentForce(this,bounds,38) || velocityForce(this.vel,this.dashDesired,this.maxForce);
      this.applyForce(createVector(desired.x,desired.y));
    }
    super.update();
  }

  steerToCursor(targetMouse, shaft) {
    if (this.dashTimer > 0) return; // Allow dash impulse to carry through

    // Clamp target to shaft boundaries and player vertical band (bottom 45% of shaft)
    const margin = 28;
    const minX = shaft.x + margin;
    const maxX = shaft.x + shaft.width - margin;
    const minY = shaft.y + shaft.height * 0.45;
    const maxY = shaft.y + shaft.height - margin;

    const clampedTarget = createVector(
      Math.max(minX, Math.min(maxX, targetMouse.x)),
      Math.max(minY, Math.min(maxY, targetMouse.y))
    );

    // Pure steering with arrive
    const arriveForce = this.arrive(clampedTarget, 0);
    const bounds={x:shaft.x,y:shaft.y+shaft.height*.4,width:shaft.width,height:shaft.height*.6};
    const safe=containmentForce(this,bounds,28);
    this.applyForce(safe?createVector(safe.x,safe.y):arriveForce);
  }

  // Cinematic damage stays local to the Guitar Vehicle; physics still use Vehicle.update.
  showBroken(){
    const c=drawingContext,img=typeof spriteAtlas!=='undefined'?spriteAtlas?.images.get('guitar'):null;
    c.save();c.translate(this.pos.x,this.pos.y);c.rotate(.4);
    if(img){
      const cut=Math.floor(img.height*.49);
      c.save();c.translate(-8,-25);c.rotate(-.28);c.drawImage(img,0,0,img.width,cut,-19,-35,38,45);c.restore();
      c.save();c.translate(12,21);c.rotate(.38);c.drawImage(img,0,cut,img.width,img.height-cut,-25,-20,50,55);c.restore();
    }else{
      c.fillStyle='#e67f58';c.fillRect(-5,-52,10,38);c.beginPath();c.moveTo(-27,14);c.lineTo(0,-13);c.lineTo(28,20);c.lineTo(0,40);c.fill();
    }
    c.strokeStyle='#fff3d5';c.lineWidth=2;c.beginPath();c.moveTo(-13,-4);c.lineTo(-3,4);c.lineTo(6,-3);c.lineTo(15,5);c.stroke();
    c.strokeStyle='#74e9ff';c.globalAlpha=.65;c.beginPath();c.arc(3,1,34,Math.PI*.1,Math.PI*.8);c.stroke();
    c.restore();
  }
  show(scoreManager) {
    const c=drawingContext,t=frameCount/60,tuning=TUNINGS[this.currentTuning];
    const calm=typeof reduceMotion!=='undefined'&&reduceMotion;
    c.save();c.translate(this.pos.x,this.pos.y);
    c.rotate(calm?0:Math.max(-.25,Math.min(.25,this.vel.x*.025)));
    if(scoreManager?.invulnerableTimer>0)c.globalAlpha=.65;
    if(spriteAtlas){
      spriteAtlas.draw('glow',0,5,this.isCharging?125:78,this.isCharging?125:78);
      const scale=calm?1:1+Math.sin(t*3)*.018;
      spriteAtlas.draw('guitar',0,-12,63*scale,99*scale);
    }
    c.strokeStyle='#fff4d9';c.lineWidth=.5;
    for(let i=0;i<6;i++){
      const x=-2.3+i*.9,wobble=calm?0:Math.sin(t*(14+i)+i)*(this.isCharging?1.5:.3);
      c.beginPath();c.moveTo(x,-45);c.quadraticCurveTo(x+wobble,-8,x,19);c.stroke();
    }
    // Readable charge progress, rendered on the player entity.
    if(this.isCharging){
      c.strokeStyle=tuning.color;c.lineWidth=2;c.beginPath();
      c.arc(0,0,49,-Math.PI/2,-Math.PI/2+Math.PI*2*this.chargeDuration/this.maxChargeTime);c.stroke();
    }
    if(this.dashTimer>0){c.strokeStyle='#8fffe5';c.lineWidth=1;c.beginPath();c.ellipse(0,8,43,55,0,0,Math.PI*2);c.stroke();}
    if(this.collectPulse>0){
      c.globalAlpha=this.collectPulse*.8;c.strokeStyle=this.collectColor;c.lineWidth=3*this.collectPulse;
      c.beginPath();c.arc(0,0,29+(1-this.collectPulse)*46,0,Math.PI*2);c.stroke();
      c.globalAlpha=this.collectPulse*.23;c.fillStyle=this.collectColor;c.beginPath();c.arc(0,0,33,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
}
if(typeof module!=='undefined')module.exports={Guitar};
