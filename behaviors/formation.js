// Pure functions for formation transformations

/**
 * Computes the absolute home position of a swarm point based on the anchor's position,
 * point offset (normalized [-1, 1]), current scale, and rotation angle.
 *
 * @param {{x: number, y: number}} anchorPos - Anchor position vector
 * @param {{x: number, y: number}} offset - Normalized point offset
 * @param {number} scale - Pixel scaling factor
 * @param {number} angle - Rotation angle in radians
 * @param {{x: number, y: number}} [pivot={x:0, y:0}] - Local rotation pivot offset
 * @returns {{x: number, y: number}}
 */
function homePosition(anchorPos, offset, scale, angle = 0, pivot = { x: 0, y: 0 }) {
  // Apply scale relative to pivot
  const sx = (offset.x - pivot.x) * scale;
  const sy = (offset.y - pivot.y) * scale;

  // Rotate around pivot
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const rx = sx * cosA - sy * sinA;
  const ry = sx * sinA + sy * cosA;

  return {
    x: anchorPos.x + rx + pivot.x * scale,
    y: anchorPos.y + ry + pivot.y * scale
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { homePosition };
}
