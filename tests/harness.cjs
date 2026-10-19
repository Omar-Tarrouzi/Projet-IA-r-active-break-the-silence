const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
class MockVector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x,y) {this.x=x;this.y=y;return this;}
  static mult(v,n) {return new MockVector(v.x*n,v.y*n);}
  copy() { return new MockVector(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mult(n) { this.x *= n; this.y *= n; return this; }
  div(n) { if (n !== 0) { this.x /= n; this.y /= n; } return this; }
  mag() { return Math.hypot(this.x, this.y); }
  setMag(len) {
    const m = this.mag();
    if (m > 0.00001) { this.x = (this.x / m) * len; this.y = (this.y / m) * len; }
    return this;
  }
  limit(max) {
    if (this.mag() > max) this.setMag(max);
    return this;
  }
  dist(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
  heading() { return Math.atan2(this.y, this.x); }
  normalize() { return this.setMag(1); }
  static sub(v1, v2) { return new MockVector(v1.x - v2.x, v1.y - v2.y); }
  static add(v1, v2) { return new MockVector(v1.x + v2.x, v1.y + v2.y); }
  static dist(v1, v2) { return Math.hypot(v1.x - v2.x, v1.y - v2.y); }
  static random2D() {
    const a = Math.random() * Math.PI * 2;
    return new MockVector(Math.cos(a), Math.sin(a));
  }
}

global.p5 = { Vector: MockVector };
global.createVector = (x, y) => new MockVector(x, y);
global.random = (min, max) => (max !== undefined ? min + Math.random() * (max - min) : Math.random() * min);
global.map = (val, inMin, inMax, outMin, outMax) => outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
global.push = () => {};
global.pop = () => {};
global.circle = () => {};
global.stroke = () => {};
global.fill = () => {};
global.noFill = () => {};
global.noStroke = () => {};
global.rect = () => {};
global.line = () => {};
global.strokeWeight = () => {};
global.translate = () => {};
global.rotate = () => {};
global.drawingContext = { setLineDash: () => {}, shadowBlur: 0, shadowColor: '' };


global.cos=Math.cos;global.sin=Math.sin;
global.random=(a,b)=>b===undefined?a*.5:(a+b)/2;
const root=path.resolve(__dirname,'..');
for(const file of ['vehicle.js','data/tunings.js','data/bands.js','data/shapes.js','data/boss.js','data/rulerShapes.js','behaviors/velocity.js','behaviors/redirect.js','behaviors/diamond.js','behaviors/formation.js','behaviors/boundaries.js','behaviors/flocking.js','behaviors/notes.js','behaviors/pickups.js','behaviors/flee.js','behaviors/blast.js','ui/BossIntro.js','Guitar.js','FormationAnchor.js','SwarmPoint.js','ui/RulerAnimation.js','Vesper.js','RulerVision.js','RulerBoss.js','ChainDart.js','CadenceDiamond.js','EchoPulse.js','RoomRelic.js','Musician.js','Pickup.js','Note.js','Spark.js','SpaceMote.js','Shockwave.js','systems/BossController.js','systems/RulerBossController.js','systems/OpeningScene.js','systems/FormationController.js','systems/Director.js','systems/Score.js','systems/FixedStep.js','systems/SpatialGrid.js']){
  vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
}
module.exports={Vehicle,Guitar,Pickup,SwarmPoint,Vesper,RulerBoss,ChainDart,EchoPulse,RulerBossController,CadenceDiamond,RULER_BOSSES,rulerShapeSlot,RULERS,RulerVision,RoomRelic,Musician,OpeningScene,BossController,FormationController,Director,ScoreManager,FixedStep,SpatialGrid,velocityForce,compose,containmentForce,pickupMagnetForce,bossSlot,nextBossPhase,VESPER,generateThronePoints,segmentDistance,SpaceMote,calculateBlastForce};
