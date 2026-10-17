// Flee Steering Behavior
// Ported from 1-Seek/vehicle.js (which implements flee as inverse of seek)
// Craig Reynolds (1999): Flee is the negative counterpart of seek

/**
 * Calculates flee steering force away from a target.
 *
 * @param {Vehicle} vehicle
 * @param {p5.Vector|{x: number, y: number}} target
 * @param {number} [detectionRadius=Infinity]
 * @returns {p5.Vector}
 */
function calculateFleeForce(vehicle, target, detectionRadius = Infinity) {
  const d = p5.Vector.dist(vehicle.pos, target);
  if (d > detectionRadius) {
    return createVector(0, 0);
  }

  // ETAPE 1: Direction opposée à la cible (vitesse désirée de fuite)
  let desiredSpeed = p5.Vector.sub(vehicle.pos, target);
  desiredSpeed.setMag(vehicle.maxSpeed);

  // ETAPE 2: Formule Reynolds: force = vitesseDesiree - vitesseActuelle
  let force = p5.Vector.sub(desiredSpeed, vehicle.vel);
  force.limit(vehicle.maxForce);

  return force;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateFleeForce };
}
