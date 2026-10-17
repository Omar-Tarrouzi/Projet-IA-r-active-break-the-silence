// Blast / Shockwave flee forces and falloff calculations

const BLAST_MAX_FORCE = 14.0;

/**
 * Calculates flee force exerted by an expanding shockwave on a swarm point.
 * Returns null if the point is outside the shockwave's active radius or angular cone.
 *
 * @param {{pos: {x: number, y: number}}} point
 * @param {{pos: {x: number, y: number}, radius: number, tuning: object, dirAngle?: number}} shockwave
 * @returns {{x: number, y: number} | null}
 */
function calculateBlastForce(point, shockwave) {
  const dx = point.pos.x - shockwave.pos.x;
  const dy = point.pos.y - shockwave.pos.y;
  const dist = Math.hypot(dx, dy);

  // Outside active blast expanding wave
  if (dist > shockwave.radius || dist < 0.001) {
    return null;
  }

  // Check angular cone (for Mid 120 deg, High 20 deg, Low 360 deg)
  const tuning = shockwave.tuning;
  if (tuning && tuning.angle < Math.PI * 1.99) {
    // Blast aims upward (angle -PI/2)
    const aimAngle = shockwave.dirAngle !== undefined ? shockwave.dirAngle : -Math.PI / 2;
    const ptAngle = Math.atan2(dy, dx);
    let diff = Math.abs(ptAngle - aimAngle);
    // Normalize angle difference to [0, PI]
    while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);

    if (diff > tuning.angle / 2) {
      return null;
    }
  }

  // Falloff: stronger near blast front, decaying towards edges
  const falloff = Math.max(0.2, 1.0 - (dist / shockwave.radius) * 0.7);
  const tuningMult = (tuning && tuning.force) ? tuning.force : 1.0;

  // Flee direction = outward from blast center
  const nx = dx / dist;
  const ny = dy / dist;

  const speed = (point.maxSpeed || BLAST_MAX_FORCE) * falloff * tuningMult;
  const vx = point.vel ? point.vel.x : 0, vy = point.vel ? point.vel.y : 0;
  let fx = nx * speed - vx, fy = ny * speed - vy;
  const cap = point.maxForce === undefined ? BLAST_MAX_FORCE : point.maxForce;
  const length = Math.hypot(fx,fy);
  if(length>cap){fx*=cap/length;fy*=cap/length;}
  return {x:fx,y:fy,magnitude:Math.hypot(fx,fy)};

}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateBlastForce, BLAST_MAX_FORCE };
}
