// Boundary containment steering force
// Wraps vehicle.boundaries() from vehicle.js (which returns desired velocity)
// and computes the steering force: steering = desired - current velocity

/**
 * Calculates inward repulsive steering force when approaching bounds.
 * If passed a Vehicle, delegates to vehicle.boundaries() and computes steering force.
 *
 * @param {Vehicle|{pos: object, vel: object, maxSpeed: number, maxForce: number}} vehicleOrPos
 * @param {...any} args
 * @returns {{x: number, y: number}|p5.Vector}
 */
function calculateBoundariesForce(vehicleOrPos, ...args) {
  // Check if first argument is a Vehicle instance with boundaries() method
  if (vehicleOrPos && typeof vehicleOrPos.boundaries === 'function') {
    const [bx, by, bw, bh, margin = 35] = args;
    // Call the inherited boundaries method on the Vehicle (returns vitesseDesiree)
    const desired = vehicleOrPos.boundaries(bx, by, bw, bh, margin);
    if (!desired || (desired.x === 0 && desired.y === 0)) {
      return typeof createVector === 'function' ? createVector(0, 0) : { x: 0, y: 0 };
    }

    // Steering = desired - current velocity, limited to maxForce
    let fx = desired.x - vehicleOrPos.vel.x;
    let fy = desired.y - vehicleOrPos.vel.y;
    const mag = Math.hypot(fx, fy);
    const maxF = vehicleOrPos.maxForce || 0.2;
    if (mag > maxF) {
      fx = (fx / mag) * maxF;
      fy = (fy / mag) * maxF;
    }
    return typeof createVector === 'function' ? createVector(fx, fy) : { x: fx, y: fy };
  }

  // Fallback for tests or calls with raw (pos, vel, maxSpeed, maxForce, bx, by, bw, bh, margin)
  const pos = vehicleOrPos;
  const [vel, maxSpeed, maxForce, bx, by, bw, bh, margin = 35] = args;
  let desX = null;
  let desY = null;

  if (pos.x < bx + margin) {
    desX = maxSpeed;
  } else if (pos.x > bx + bw - margin) {
    desX = -maxSpeed;
  }

  if (pos.y < by + margin) {
    desY = maxSpeed;
  } else if (pos.y > by + bh - margin) {
    desY = -maxSpeed;
  }

  if (desX !== null || desY !== null) {
    const vx = desX !== null ? desX : vel.x;
    const vy = desY !== null ? desY : vel.y;
    const mag = Math.hypot(vx, vy);

    if (mag > 0.0001) {
      const targetSpeedX = (vx / mag) * maxSpeed;
      const targetSpeedY = (vy / mag) * maxSpeed;

      let fx = targetSpeedX - vel.x;
      let fy = targetSpeedY - vel.y;

      const fMag = Math.hypot(fx, fy);
      if (fMag > maxForce) {
        fx = (fx / fMag) * maxForce;
        fy = (fy / fMag) * maxForce;
      }
      return { x: fx, y: fy };
    }
  }

  return { x: 0, y: 0 };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateBoundariesForce };
}

