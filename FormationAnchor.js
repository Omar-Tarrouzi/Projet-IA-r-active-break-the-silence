// FormationAnchor Entity (extends Vehicle)
// An invisible or debuggable Vehicle driving the formation's spatial motion purely via steering

class FormationAnchor extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 3.5;
    this.maxForce = 0.25;
    this.r = 10;

    // Transform parameters driven by animation scripts
    this.currentScale = 70;
    this.currentAngle = 0;
    this.pivot = { x: 0, y: 0 };
    this.lockedVelocity = null;
    this.isDead = false;
  }

  lockStrikeVelocity(targetPos, speed = 8.0) {
    this.maxSpeed = speed;
    const dx = targetPos.x - this.pos.x;
    const dy = targetPos.y - this.pos.y;
    const mag = Math.hypot(dx, dy);
    if (mag > 0.001) {
      this.lockedVelocity = createVector((dx / mag) * speed, (dy / mag) * speed);
      const impulse = p5.Vector.sub(this.lockedVelocity, this.vel);
      impulse.limit(this.maxForce);
      this.applyForce(impulse);
    }
  }

  unlockStrike() {
    this.lockedVelocity = null;
    this.maxSpeed = 3.5;
  }

  show() {
    // Only visible if Vehicle debug mode is enabled
    if (Vehicle.debug) {
      push();
      translate(this.pos.x, this.pos.y);
      noFill();
      stroke(255, 100);
      strokeWeight(1.5);
      circle(0, 0, 24);
      line(-12, 0, 12, 0);
      line(0, -12, 0, 12);
      pop();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FormationAnchor };
}
