// The missing guitarist in the prologue. Body pose is local drawing geometry.
class Musician extends Vehicle {
  constructor(x,y) {
    super(x,y);this.age=0;this.playing=false;this.abducted=false;this.walking=false;this.facing='front';this.target={x,y};this.pointerTarget=null;
    this.maxSpeed=6;this.maxForce=.34;this.rayonZoneDeFreinage=55;
  }
  updateScene(dt) {
    this.age+=dt;
    this.applyForce(this.arrive(createVector(this.target.x,this.target.y)));
    super.update();
  }
  updateExplore(dt,controls,bounds) {
    this.age+=dt;const dx=(controls.right?1:0)-(controls.left?1:0),dy=(controls.down?1:0)-(controls.up?1:0);
    this.walking=!!(dx||dy);
    if(dy<0)this.facing='back';else if(dy>0)this.facing='front';
    let goal=this.walking?{x:this.pos.x+dx*90,y:this.pos.y+dy*90}:this.pointerTarget;
    if(goal){goal={x:Math.max(bounds.x,Math.min(bounds.x+bounds.width,goal.x)),
      y:Math.max(bounds.y,Math.min(bounds.y+bounds.height,goal.y))};
      if(goal.x>570&&goal.y<520)goal.y=520;
      if(goal.x<325&&goal.y<410)goal.y=410;
      this.applyForce(this.arrive(createVector(goal.x,goal.y)));
      if(!this.walking&&Math.hypot(this.pos.x-goal.x,this.pos.y-goal.y)<12)this.pointerTarget=null;
    }else{const f=velocityForce(this.vel,{x:0,y:0},this.maxForce);this.applyForce(createVector(f.x,f.y));}
    super.update();
  }
  showRescue(sheet,crouched){
    if(!sheet?.complete||!sheet.naturalWidth){this.show();return;}
    const c=drawingContext;c.save();c.translate(this.pos.x,this.pos.y);c.imageSmoothingEnabled=false;
    c.drawImage(sheet,crouched?256:0,0,256,256,-74,-148,148,148);
    c.restore();
  }
  show() {
    const c=drawingContext,t=this.age;
    if(typeof sceneAssets!=='undefined'&&sceneAssets){
      const frame=this.abducted?'musicianLiftGinger':this.playing?'musicianPlayGinger':
        this.walking?(this.facing==='back'?'musicianBackWalk':Math.floor(t*7)%2?'musicianWalkA':'musicianWalkB'):
        this.facing==='back'?'musicianBack':'musicianIdleGinger';
      const sprite=sceneAssets[frame];
      if(sprite){const h=this.abducted?163:this.playing?145:122,w=h*sprite.width/sprite.height;
        c.save();c.translate(this.pos.x,this.pos.y);c.imageSmoothingEnabled=false;
        if(frame==='musicianPlayGinger'){
          // The source has a tiny mark in its empty top-left margin. Omit that transparent corner.
          const inset=Math.max(8,Math.round(sprite.width*.035)),dx=inset*w/sprite.width,dy=inset*h/sprite.height;
          c.drawImage(sprite.canvas,inset,0,sprite.width-inset,sprite.height,-w/2+dx,-h,w-dx,h);
          c.drawImage(sprite.canvas,0,inset,inset,sprite.height-inset,-w/2,-h+dy,dx,h-dy);
        }else c.drawImage(sprite.canvas,-w/2,-h,w,h);
        c.restore();return;}
    }
    c.save();c.translate(this.pos.x,this.pos.y);c.strokeStyle='#eedaca';c.lineWidth=7;c.lineCap='round';
    c.fillStyle='#38475b';c.beginPath();c.moveTo(-24,-12);c.lineTo(19,-13);c.lineTo(28,62);c.lineTo(-31,61);c.closePath();c.fill();
    c.fillStyle='#d8aa89';c.beginPath();c.arc(0,-43,20,0,Math.PI*2);c.fill();
    c.fillStyle='#292735';c.beginPath();c.arc(-2,-51,22,Math.PI,Math.PI*2);c.fill();
    const hand=this.playing?Math.sin(t*15)*9:Math.sin(t*3)*3;
    c.beginPath();c.moveTo(-19,0);c.lineTo(-42,31);c.lineTo(-12,26+hand);
    c.moveTo(18,-1);c.lineTo(42,28);c.lineTo(12,28-hand*.4);c.stroke();
    c.strokeStyle='#40495e';c.lineWidth=9;c.beginPath();c.moveTo(-16,54);c.lineTo(-29,96);
    c.moveTo(15,54);c.lineTo(31,96);c.stroke();c.restore();
  }
}
if(typeof module!=='undefined')module.exports={Musician};

