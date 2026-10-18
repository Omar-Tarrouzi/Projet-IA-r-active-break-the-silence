// SwarmPoint Entity (extends Vehicle)
// An enemy particle that steers to form weapons, flocks, or recovers from sonic blasts

class SwarmPoint extends Vehicle {
  constructor(x, y, offset = { x: 0, y: 0 }, anchor = null, resonance = 'LOW') {
    super(x, y);
    this.offset = offset; // Normalized shape offset [-1, 1]
    this.anchor = anchor;
    this.resonance = resonance;

    this.maxSpeed = 5.0;
    this.maxForce = 0.35;
    this.rayonZoneDeFreinage = 38;
    this.r = 4.5;

    this.state = 'HOMED'; // 'HOMED', 'FLOCK', 'STUNNED', 'CONVERTED'
    this.stunTimer = 0;
    this.maxStun = 1.0;
    this.orphanTimer = 6.0; // Life timer for orphaned points
    this.isDead = false;
    this.isConverted = false;
    this.isWeakLetter = false;
    this.wing = null; // 'LEFT' or 'RIGHT' for dual/split swarm attacks

    // Visual attributes
    this.baseColor = '#7a889b'; // Desaturated Silence cyan/slate
    this.stunColor = '#3a4454';

    // Cache parsed RGB for the resonance color (avoids repeated color() calls per frame)
    this._cachedColorRGB = null;
  }

  stun(duration, externalImpulse) {
    this.state = 'STUNNED';
    this.stunTimer = duration;
    this.maxStun = duration;

    if (externalImpulse) {
      this.scatterDesired = externalImpulse.copy().setMag(this.maxSpeed);
    }
  }

  updateState(dt, guitar, neighbors, shaft, smartSwarmsUnlocked = false) {
    if (this.isDead) return;

    // STUNNED STATE
    if (this.state === 'STUNNED') {
      this.stunTimer -= dt;

      // Apply linear drag force: -k * vel
      const desired = this.stunTimer > this.maxStun - 0.45 && this.scatterDesired ? this.scatterDesired : this.vel.copy().mult(0.94);
      const df = velocityForce(this.vel, desired, this.maxForce * 0.7);
      const dragForce = createVector(df.x, df.y);
      this.applyForce(dragForce);

      // Gentle wander near end of stun
      if (this.stunTimer < 0.4 && this.stunTimer > 0) {
        const wanderF = this.wander();
        if (wanderF) {
          wanderF.mult(0.3);
          this.applyForce(wanderF);
        }
      }

      if (this.stunTimer <= 0) {
        // Reform window: returns to HOMED if anchor alive and active, else to FLOCK orphan
        if (this.anchor && !this.anchor.isDead) {
          this.state = 'HOMED';
        } else {
          this.state = 'FLOCK';
        }
      }
      return;
    }

    // ORPHAN FLOCK TIMER
    if (this.state === 'FLOCK' && (!this.anchor || this.anchor.isDead)) {
      this.orphanTimer -= dt;
      if (this.orphanTimer <= 0) {
        this.isDead = true;
        return;
      }
    }

    // HOMED STATE: Arrive at transformed target home
    if (this.state === 'HOMED' && this.anchor) {
      const home = this.homeTarget || homePosition(
        this.anchor.pos,
        this.offset,
        this.anchor.currentScale,
        this.anchor.currentAngle,
        this.anchor.pivot
      );
      const targetVec = createVector(home.x, home.y);
      const arriveF = this.arrive(targetVec, 0);
      this.applyForce(arriveF);
      return;
    }

    // FLOCK STATE (Murmuration or Orphans)
    if (this.state === 'FLOCK') {
      // Priority Override: Smart Swarms evade guitar charge aura
      if (smartSwarmsUnlocked && guitar && guitar.isCharging && guitar.chargeAuraRadius > 10) {
        const distToGuitar = p5.Vector.dist(this.pos, guitar.pos);
        if (distToGuitar < guitar.chargeAuraRadius + 70) {
          const evadeF = this.evade(guitar);
          if (evadeF) {
            evadeF.mult(2.2);
            evadeF.limit(this.maxForce);
            this.applyForce(evadeF);
            return; // Priority override takes precedence
          }
        }
      }

      // Weighted sum of Reynolds flocking + boundaries
      const flock = calculateFlockingForce(this,neighbors);
      const bnd = calculateBoundariesForce(
        this,
        shaft.x,
        shaft.y,
        shaft.width,
        shaft.height,
        30
      );

      const combined = createVector(0, 0);
      combined.add(createVector(flock.x,flock.y));
      combined.add(createVector(bnd.x * 2.0, bnd.y * 2.0));

      // Murmuration follows guitar with dual-flanking pincer behavior
      if (guitar && this.anchor && this.anchor.isMurmuration) {
        if (this.wing === 'LEFT' || this.wing === 'RIGHT') {
          const flankOffsetX = this.wing === 'LEFT' ? -125 : 125;
          const targetPos = createVector(guitar.pos.x + flankOffsetX, guitar.pos.y - 40);
          const seekFlank = this.seek(targetPos);
          if (seekFlank) {
            combined.add(seekFlank.mult(1.05));
          }
        } else {
          const pursueF = this.pursue(guitar);
          if (pursueF) {
            combined.add(pursueF.mult(1.0));
          }
        }
      }

      combined.limit(this.maxForce);
      this.applyForce(combined);
    }
  }

  show() {
    if (this.isDead || this.isConverted) return;
    const c = drawingContext;
    const color = this.chainIndex!=null&&this.boss?.profile?.key==='ONYX' ? '#ff315c' :
      this.state==='STUNNED' ? '#55627a' :
      this.state==='FLOCK' ? '#a9c4ff' : (TUNINGS[this.resonance] || TUNINGS.HIGH).color;
    const visual=typeof attackVisual==='function'?attackVisual(this):null;
    if(visual && typeof attackAtlas!=='undefined' && attackAtlas){
      const missileHead=this.missileIndex!=null&&this.missileSlot===0;
      const angle=this.vel.mag()>.2?Math.atan2(this.vel.y,this.vel.x)+Math.PI/2:0;
      attackAtlas.draw(c,visual.kind,visual.state,this.pos.x,this.pos.y,
        visual.kind==='vesperTip'?24:missileHead?22:this.chainIndex!=null?15:12,angle,this.boss?.phaseTimer||0);
    }else{
      c.fillStyle=color;
      c.beginPath(); c.arc(this.pos.x,this.pos.y,this.r,0,Math.PI*2); c.fill();
    }
    if(this.boss && this.dangerous) {
      c.fillStyle='#f5eaff'; c.fillRect(this.pos.x-1,this.pos.y-1,2,2);
    }
  }
}
if(typeof module!=='undefined') module.exports={SwarmPoint};
