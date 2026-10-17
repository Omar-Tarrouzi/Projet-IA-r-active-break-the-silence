// Allied Note Entity (extends Vehicle)
// Formed by harmonizing swarm points to fight for the player

class Note extends Vehicle {
  constructor(x, y, kind = 'EIGHTH', initialVel = null) {
    super(x, y);
    if (initialVel) {
      const f = velocityForce(this.vel, initialVel, this.maxForce);
      this.applyForce(createVector(f.x,f.y));
    }
    this.kind = kind; // 'EIGHTH', 'QUARTER', 'HALF'
    this.r = 8;
    this.isDead = false;
    this.pierceCount = 0;
    this.maxPierce = kind === 'HALF' ? 5 : 1;

    if (kind === 'EIGHTH') {
      this.maxSpeed = 7.5;
      this.maxForce = 0.45;
      this.lifeTime = 4.5;
      this.symbol = '♪';
      this.color = '#ffb703';
    } else if (kind === 'QUARTER') {
      this.maxSpeed = 6.0;
      this.maxForce = 0.4;
      this.lifeTime = 8.0;
      this.symbol = '♩';
      this.color = '#00f5d4';
    } else {
      // HALF Boomerang
      this.maxSpeed = 8.0;
      this.maxForce = 0.45;
      this.lifeTime = 5.5;
      this.symbol = '𝅗𝅥';
      this.color = '#f72585';
      this.isReturning = false;
    }
  }

  updateBehavior(dt, guitar, enemyPoints, orbitIndex, totalOrbiters, orbitAngle) {
    this.lifeTime -= dt;
    if (this.lifeTime <= 0) {
      this.isDead = true;
      return;
    }

    if (this.kind === 'QUARTER') {
      // Arrives at designated rotating orbit slot around guitar
      const slotPos = getOrbitSlotPosition(guitar.pos, orbitIndex, totalOrbiters, 62, orbitAngle);
      const targetVec = createVector(slotPos.x, slotPos.y);
      const arriveF = this.arrive(targetVec, 0);
      this.applyForce(arriveF);
      return;
    }

    if (this.kind === 'EIGHTH') {
      // Pursues nearest enemy point
      const targetPt = findNearestEnemyPoint(this.pos, enemyPoints);
      if (targetPt) {
        const pursueF = this.pursue(targetPt);
        if (pursueF) {
          this.applyForce(pursueF);
        }
      } else {
        // Drifts forward with seek
        const forwardTarget = createVector(this.pos.x, this.pos.y - 100);
        this.applyForce(this.seek(forwardTarget));
      }
      return;
    }

    if (this.kind === 'HALF') {
      // Boomerang: Seek forward then return to guitar
      if (!this.isReturning) {
        const aheadTarget = createVector(this.pos.x, guitar.pos.y - 350);
        this.applyForce(this.seek(aheadTarget));
        if (this.pos.y < guitar.pos.y - 300 || this.lifeTime < 3.0) {
          this.isReturning = true;
        }
      } else {
        const returnF = this.arrive(guitar.pos, 0);
        this.applyForce(returnF);
        if (p5.Vector.dist(this.pos, guitar.pos) < 20) {
          this.isDead = true;
        }
      }
    }
  }

  show() {
    if(this.isDead)return;
    const c=drawingContext;c.save();c.translate(this.pos.x,this.pos.y);c.rotate(Math.sin(frameCount*.04)*.13);
    if(spriteAtlas)spriteAtlas.draw('note',0,0,25,25);c.restore();
  }
}
if(typeof module!=='undefined')module.exports={Note};
