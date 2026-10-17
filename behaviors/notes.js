// Specific target positions and calculations for allied Note vehicles

/**
 * Computes rotating orbit slot position around the player guitar.
 *
 * @param {{x: number, y: number}} guitarPos
 * @param {number} slotIndex
 * @param {number} totalSlots
 * @param {number} orbitRadius
 * @param {number} rotationAngle
 * @returns {{x: number, y: number}}
 */
function getOrbitSlotPosition(guitarPos, slotIndex, totalSlots, orbitRadius = 60, rotationAngle = 0) {
  const angleStep = (2 * Math.PI) / Math.max(1, totalSlots);
  const angle = rotationAngle + slotIndex * angleStep;

  return {
    x: guitarPos.x + Math.cos(angle) * orbitRadius,
    y: guitarPos.y + Math.sin(angle) * orbitRadius
  };
}

/**
 * Finds the nearest active enemy swarm point to target.
 *
 * @param {{x: number, y: number}} pos
 * @param {Array<object>} enemyPoints
 * @returns {object | null}
 */
function findNearestEnemyPoint(pos, enemyPoints) {
  let nearest = null;
  let minDist = Infinity;

  for (let i = 0; i < enemyPoints.length; i++) {
    const pt = enemyPoints[i];
    if (pt.isDead || pt.isConverted) continue;

    const d = Math.hypot(pos.x - pt.pos.x, pos.y - pt.pos.y);
    if (d < minDist) {
      minDist = d;
      nearest = pt;
    }
  }

  return nearest;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getOrbitSlotPosition,
    findNearestEnemyPoint
  };
}
