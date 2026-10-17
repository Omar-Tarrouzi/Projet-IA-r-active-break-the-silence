// Shockwave Entity (extends Vehicle)
// An expanding sonic ripple propagating outward from the guitar

class Shockwave extends Vehicle {
  constructor(x, y, tuning, chargeRatio = 0, isHarmonized = false) {
    super(x, y);
    this.tuning = tuning;
    this.chargeRatio = chargeRatio;
    this.isHarmonized = isHarmonized;

    // Radius expands from 10px up to scaled maxRadius
    this.radius = 12;
    this.maxRadius = tuning.maxRadius * (0.4 + 0.6 * chargeRatio);
    this.expansionSpeed = 880; // px/s

    this.affectedPoints = new Set();
    this.isDead = false;
    this.dirAngle = -Math.PI / 2; // Upward orientation
  }

  updateExpansion(dt) {
    this.radius += this.expansionSpeed * dt;
    if (this.radius >= this.maxRadius) {
      this.isDead = true;
    }
  }

  show() {
    if (this.isDead) return;

    push();
    translate(this.pos.x, this.pos.y);

    const alpha = Math.max(0, 255 * (1 - this.radius / this.maxRadius));
    drawingContext.globalAlpha = alpha / 255;
    noFill();
    strokeWeight(3.5);
    stroke(this.tuning.color);

    if (this.tuning.angle < Math.PI * 1.99) {
      // Focused cone or beam
      const startAngle = this.dirAngle - this.tuning.angle / 2;
      const endAngle = this.dirAngle + this.tuning.angle / 2;
      arc(0, 0, this.radius * 2, this.radius * 2, startAngle, endAngle);
      line(0, 0, Math.cos(startAngle) * this.radius, Math.sin(startAngle) * this.radius);
      line(0, 0, Math.cos(endAngle) * this.radius, Math.sin(endAngle) * this.radius);
    } else {
      // Full circle wave
      circle(0, 0, this.radius * 2);
    }

    // Harmonize visual shimmer
    if (this.isHarmonized) {
      stroke(255, 240, 180, alpha * 0.8);
      strokeWeight(1.5);
      circle(0, 0, this.radius * 1.8);
    }

    pop();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Shockwave };
}
