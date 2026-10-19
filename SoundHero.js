// Whole-frame animation is presentation only; Guitar/Vehicle own locomotion.
function soundHeroFrame(age,speed,charging,chargeRatio,attackTime,dashing,calm=false){
  if(attackTime>0)return attackTime>.25?10:11;
  if(charging)return chargeRatio>.45?9:8;
  if(dashing)return 6;
  if(speed>1.2)return calm?4:4+Math.floor(age*(7+Math.min(speed,9)*.4))%4;
  return calm?0:[0,1,2,3,2,1][Math.floor(age*5)%6];
}
class SoundHero extends Guitar {
  constructor(x,y,sprite){
    super(x,y);this.sprite=sprite;this.awakened=true;this.maxChargeTime=.75;this.blastReach=1.12;this.visualAge=0;
    this.attackTime=0;this.attackPower=0;this.facing=1;this.turnTime=0;this.frame=0;this.previousFrame=0;this.frameBlend=1;
    this.animationSheet=typeof finaleMedia!=='undefined'?finaleMedia?.heroFrames:null;
    if(!this.animationSheet&&typeof Image!=='undefined'){this.animationSheet=new Image();this.animationSheet.src='assets/finale/sound-hero-animated.webp';}
  }
  onBlast(power=1){this.attackTime=.44;this.attackPower=Math.max(0,Math.min(1,power));}
  update(dt,shaft){
    this.visualAge+=dt;this.attackTime=Math.max(0,this.attackTime-dt);this.turnTime=Math.max(0,this.turnTime-dt);
    super.update(dt,shaft);
    // Hysteresis prevents nervous flipping around an arrival target.
    if(Math.abs(this.vel.x)>1.6&&Math.sign(this.vel.x)!==this.facing){this.facing=Math.sign(this.vel.x);this.turnTime=.16;}
    const calm=typeof reduceMotion!=='undefined'&&reduceMotion;
    const next=soundHeroFrame(this.visualAge,Math.hypot(this.vel.x,this.vel.y),this.isCharging,this.chargeDuration/this.maxChargeTime,this.attackTime,this.dashTimer>0,calm);
    if(next!==this.frame){this.previousFrame=this.frame;this.frame=next;this.frameBlend=0;}
    this.frameBlend=Math.min(1,this.frameBlend+dt/ .06);
  }
  show(score){
    const c=drawingContext,img=this.sprite,sheet=this.animationSheet;
    const ready=sheet?.complete&&sheet.naturalWidth,oldReady=img?.complete&&img.naturalWidth;
    if(!ready&&!oldReady){super.show(score);return;}
    const calm=typeof reduceMotion!=='undefined'&&reduceMotion,t=this.visualAge;
    const moving=Math.min(1,Math.hypot(this.vel.x,this.vel.y)/8.5),attack=this.attackTime/.44;
    c.save();c.translate(this.pos.x,this.pos.y);c.globalAlpha=score?.invulnerableTimer>0?.78:1;
    const opacity=c.globalAlpha,arrival=Math.min(1,t/ .6);
    // Preserve the final film image briefly before dissolving into the live pose.
    if(oldReady&&(!ready||arrival<1)){c.globalAlpha=opacity*(ready?1-arrival:1);const w=150*img.naturalWidth/img.naturalHeight;c.drawImage(img,-w/2,-97.5,w,150);}
    if(ready){
      c.save();c.translate(0,calm?0:Math.sin(t*4.5)*(2+moving));
      c.rotate(calm?0:Math.max(-.12,Math.min(.12,this.vel.x*.012))+Math.sin(attack*Math.PI)*.06*this.facing);
      const turn=calm?1:1-.18*Math.sin(Math.PI*this.turnTime/.16);
      c.scale(this.facing*turn,calm?1:1+Math.sin(t*4.5)*.008);
      const draw=(frame,alpha)=>{c.globalAlpha=opacity*arrival*alpha;c.drawImage(sheet,(frame%4)*384,Math.floor(frame/4)*384,384,384,-83,-108,166,166);};
      if(this.frameBlend<1)draw(this.previousFrame,1-this.frameBlend);draw(this.frame,this.frameBlend);c.restore();
    }
    c.globalAlpha=opacity;c.strokeStyle=TUNINGS[this.currentTuning].color;c.lineWidth=2;
    if(this.isCharging){c.beginPath();c.arc(0,0,56,-Math.PI/2,-Math.PI/2+Math.PI*2*this.chargeDuration/this.maxChargeTime);c.stroke();}
    // Short strum arc belongs to this Vehicle's visual, never to a second physics body.
    if(this.attackTime>0){c.globalAlpha=attack*.85;c.lineWidth=2+this.attackPower*2;c.beginPath();c.ellipse(0,-6,35+(1-attack)*38,18+(1-attack)*18,-.3*this.facing,.15,Math.PI*1.4);c.stroke();}
    if(this.collectPulse>0){c.globalAlpha=this.collectPulse;c.strokeStyle=this.collectColor;c.beginPath();c.arc(0,0,30+(1-this.collectPulse)*46,0,Math.PI*2);c.stroke();}
    c.globalAlpha=1;c.fillStyle='#fff7da';c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();c.restore();
  }
}
if(typeof module!=='undefined')module.exports={SoundHero,soundHeroFrame};
