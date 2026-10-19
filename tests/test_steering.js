// Automated unit test suite for ASCENT steering behaviors and systems
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

// Mock p5 vector and global functions for Node test runner
class MockVector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  copy() { return new MockVector(this.x, this.y); }
  add(v) {
    if (v instanceof MockVector) { this.x += v.x; this.y += v.y; }
    else { this.x += v; this.y += v; }
    return this;
  }
  sub(v) {
    if (v instanceof MockVector) { this.x -= v.x; this.y -= v.y; }
    else { this.x -= v; this.y -= v; }
    return this;
  }
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

// Load modules
const { TUNINGS } = require('../data/tunings.js');
const { BANDS, getBandForAltitude, getTierForAltitude } = require('../data/bands.js');
const {
  generateArrowPoints,
  generateAxePoints,
  generatePincerPoints,
  generateHandPoints,
  generateJackhammerPoints,
  generateWordPoints,
  SHAPES
} = require('../data/shapes.js');
const { homePosition } = require('../behaviors/formation.js');
const { calculateBlastForce, BLAST_MAX_FORCE } = require('../behaviors/blast.js');
const { calculateSeparation, calculateAlignment, calculateCohesion } = require('../behaviors/flocking.js');
const { calculateBoundariesForce } = require('../behaviors/boundaries.js');
const { getOrbitSlotPosition, findNearestEnemyPoint } = require('../behaviors/notes.js');
const { SpatialGrid } = require('../systems/SpatialGrid.js');
const { ScoreManager } = require('../systems/Score.js');

test('Structural Integrity: vehicle.js is identical to reference', () => {
  const refPath = path.resolve(__dirname, '../../3-Arrival_correction/vehicle.js');
  const targetPath = path.resolve(__dirname, '../vehicle.js');
  const targetData = fs.readFileSync(targetPath);
  if (fs.existsSync(refPath)) assert.deepStrictEqual(targetData, fs.readFileSync(refPath), 'vehicle.js must be a byte-for-byte copy');
  else assert.strictEqual(createHash('sha256').update(targetData).digest('hex'), 'fcd716d2129803f22aed8f365c44a595a0141842fa8e20fb77795b194fc58f1e', 'standalone release must preserve the verified course baseline');
});

test('Formations: homePosition applies rotation, scale, and pivot accurately', () => {
  const anchor = { x: 200, y: 300 };
  const offset = { x: 1, y: 0 };
  const scale = 50;

  // Unrotated: (200 + 50, 300) = (250, 300)
  const pos0 = homePosition(anchor, offset, scale, 0);
  assert.strictEqual(Math.round(pos0.x), 250);
  assert.strictEqual(Math.round(pos0.y), 300);

  // Rotated 90 degrees (PI/2): (200, 300 + 50) = (200, 350)
  const pos90 = homePosition(anchor, offset, scale, Math.PI / 2);
  assert.strictEqual(Math.round(pos90.x), 200);
  assert.strictEqual(Math.round(pos90.y), 350);
});

test('Shapes: Procedural shapes generate normalized points within bounds [-1, 1]', () => {
  const arrow = generateArrowPoints(60);
  assert.strictEqual(arrow.length, 60);
  arrow.forEach(pt => {
    assert.ok(pt.x >= -1.1 && pt.x <= 1.1, `pt.x ${pt.x} out of range`);
    assert.ok(pt.y >= -1.1 && pt.y <= 1.1, `pt.y ${pt.y} out of range`);
  });

  const axe = generateAxePoints(90);
  assert.strictEqual(axe.length, 90);

  const pincer = generatePincerPoints(90);
  assert.strictEqual(pincer.length, 90);
  pincer.forEach(pt => {
    assert.ok(pt.x >= -1.1 && pt.x <= 1.1, `pincer pt.x ${pt.x} out of range`);
    assert.ok(pt.y >= -1.1 && pt.y <= 1.1, `pincer pt.y ${pt.y} out of range`);
  });

  const hand = generateHandPoints(110);
  assert.strictEqual(hand.length, 110);

  const hammer = generateJackhammerPoints(80);
  assert.strictEqual(hammer.length, 80);

  const wordPts = generateWordPoints('HUSH', null, 120);
  assert.ok(wordPts.length > 50);
});

test('Blast: calculateBlastForce correctly computes outward flee force and respects falloff & cap', () => {
  const shockwave = {
    pos: { x: 100, y: 100 },
    radius: 150,
    tuning: TUNINGS.LOW,
    dirAngle: -Math.PI / 2
  };

  // Point at distance 50px (inside radius)
  const ptInside = { pos: { x: 100, y: 150 } };
  const force = calculateBlastForce(ptInside, shockwave);
  assert.ok(force !== null, 'Force should exist inside radius');
  assert.ok(force.magnitude <= BLAST_MAX_FORCE, `Force ${force.magnitude} must respect BLAST_MAX_FORCE`);
  assert.ok(force.y > 0, 'Outward force should push downward along dy');

  // Point at distance 200px (outside radius 150)
  const ptOutside = { pos: { x: 100, y: 350 } };
  const forceOutside = calculateBlastForce(ptOutside, shockwave);
  assert.strictEqual(forceOutside, null, 'Force should be null outside blast radius');
});

test('Blast Cones: Mid and High tunings enforce angular restriction', () => {
  const midWave = {
    pos: { x: 200, y: 300 },
    radius: 200,
    tuning: TUNINGS.MID, // 120 deg cone upward (-PI/2)
    dirAngle: -Math.PI / 2
  };

  // Upward point (inside 120 cone)
  const ptUp = { pos: { x: 200, y: 200 } };
  assert.ok(calculateBlastForce(ptUp, midWave) !== null);

  // Downward point (outside 120 cone)
  const ptDown = { pos: { x: 200, y: 400 } };
  assert.strictEqual(calculateBlastForce(ptDown, midWave), null);
});

test('Flocking: Separation pushes away from close neighbors and limits to maxForce', () => {
  const boid = {
    pos: { x: 100, y: 100 },
    vel: { x: 0, y: 0 },
    maxSpeed: 5,
    maxForce: 0.35
  };
  const closeNeighbor = { pos: { x: 110, y: 100 } }; // to the right

  const sepForce = calculateSeparation(boid, [boid, closeNeighbor], 30);
  assert.ok(sepForce.x < 0, 'Separation should push away to the left (negative x)');
  const mag = Math.hypot(sepForce.x, sepForce.y);
  assert.ok(mag <= boid.maxForce + 0.0001, 'Separation force must not exceed maxForce');

  // Empty neighbors returns zero force
  const emptyForce = calculateSeparation(boid, [boid], 30);
  assert.strictEqual(emptyForce.x, 0);
  assert.strictEqual(emptyForce.y, 0);
});

test('Boundaries: Pushes inward near walls and returns zero in interior', () => {
  const maxSpeed = 5;
  const maxForce = 0.4;
  const rect = { bx: 0, by: 0, bw: 500, bh: 500 };

  // Near left border (x = 10 < margin 35)
  const leftForce = calculateBoundariesForce({ x: 10, y: 250 }, { x: -2, y: 0 }, maxSpeed, maxForce, rect.bx, rect.by, rect.bw, rect.bh, 35);
  assert.ok(leftForce.x > 0, 'Should push rightward away from left wall');

  // Well inside interior
  const centerForce = calculateBoundariesForce({ x: 250, y: 250 }, { x: 1, y: 1 }, maxSpeed, maxForce, rect.bx, rect.by, rect.bw, rect.bh, 35);
  assert.strictEqual(centerForce.x, 0);
  assert.strictEqual(centerForce.y, 0);
});

test('Notes: Rotating orbit slot positions around player', () => {
  const guitarPos = { x: 300, y: 400 };
  const slot0 = getOrbitSlotPosition(guitarPos, 0, 4, 60, 0);
  // angle 0: cos(0)=1, sin(0)=0 -> (360, 400)
  assert.strictEqual(Math.round(slot0.x), 360);
  assert.strictEqual(Math.round(slot0.y), 400);

  const slot1 = getOrbitSlotPosition(guitarPos, 1, 4, 60, 0);
  // angle PI/2: cos(PI/2)=0, sin(PI/2)=1 -> (300, 460)
  assert.strictEqual(Math.round(slot1.x), 300);
  assert.strictEqual(Math.round(slot1.y), 460);
});

test('SpatialGrid: Fast and accurate radius neighbor retrieval', () => {
  const grid = new SpatialGrid(50);
  const p1 = { pos: { x: 100, y: 100 } };
  const p2 = { pos: { x: 120, y: 100 } }; // dist 20
  const p3 = { pos: { x: 300, y: 300 } }; // dist ~280

  grid.insert(p1);
  grid.insert(p2);
  grid.insert(p3);

  const neighbors = grid.queryNeighbors(p1, 40);
  assert.strictEqual(neighbors.length, 1);
  assert.strictEqual(neighbors[0], p2);
});

test('ScoreManager: Resource economy, damage, i-frames, and dissonance', () => {
  const score = new ScoreManager();

  // Volume blast consumption & check
  assert.strictEqual(score.canFireBlast(0), true);
  score.consumeBlastVolume(1.0); // costs 20 + 30 = 50
  assert.strictEqual(score.volume, 50);

  // Dissonance rises when enemy near, decays when far
  score.update(1.0, 5.0, 150); // enemy within 200px
  assert.ok(score.dissonance > 1.0, 'Dissonance should increase');

  // Damage with i-frames
  const initialTune = score.tune;
  const hit1 = score.takeDamage(20);
  assert.strictEqual(hit1, true);
  assert.strictEqual(score.tune, initialTune - 20);
  assert.strictEqual(score.dissonance, 1.0, 'Dissonance resets to 1.0 on hit');

  // Secondary hit blocked during i-frames
  const hit2 = score.takeDamage(20);
  assert.strictEqual(hit2, false, 'Hit should be ignored during i-frames');

  // Advance past i-frames
  score.update(0.4, 5.0, null);
  assert.strictEqual(score.invulnerableTimer, 0);
  const hit3 = score.takeDamage(20);
  assert.strictEqual(hit3, true, 'Hit should register after i-frames expire');
});

test('ClapDetector: Short clap triggers MID attack, and sustained sharp noise triggers HIGH beam', () => {
  const { ClapDetector } = require('../systems/ClapDetector.js');
  const detector = new ClapDetector({ threshold: 0.25, onsetDelta: 0.15, sustainedMinTime: 0.35 });

  let midClapTriggered = false;
  let highBeamTriggered = false;
  let sustainedStarted = false;

  detector.onClapCallback = () => { midClapTriggered = true; };
  detector.onSustainedStartCallback = () => { sustainedStarted = true; };
  detector.onSustainedReleaseCallback = () => { highBeamTriggered = true; };

  detector.isListening = true;
  detector.dataArray = new Float32Array(512);

  // 1. SILENCE
  detector.analyser = { getFloatTimeDomainData: (arr) => arr.fill(0.02) };
  detector.update(0.016);
  assert.strictEqual(midClapTriggered, false);
  assert.strictEqual(highBeamTriggered, false);

  // 2. SHORT CLAP (< 0.25s)
  // Loud frame (0.1s)
  detector.analyser = { getFloatTimeDomainData: (arr) => arr.fill(0.45) };
  detector.update(0.08);

  // Sound ends (returns to silence)
  detector.analyser = { getFloatTimeDomainData: (arr) => arr.fill(0.02) };
  const event1 = detector.update(0.016);

  assert.strictEqual(event1, 'MID_CLAP', 'Short sound should classify as MID_CLAP');
  assert.strictEqual(midClapTriggered, true, 'MID clap callback should fire');
  assert.strictEqual(highBeamTriggered, false);

  // Advance past cooldown
  for (let i = 0; i < 20; i++) detector.update(0.02);
  midClapTriggered = false;

  // 3. SUSTAINED SHARP NOISE (held for >= 0.4s)
  detector.analyser = { getFloatTimeDomainData: (arr) => arr.fill(0.48) };
  for (let i = 0; i < 25; i++) {
    detector.update(0.02); // 25 * 0.02 = 0.5s of continuous noise
  }
  assert.strictEqual(sustainedStarted, true, 'Sustained noise should enter HIGH charging mode');

  // Sound drops below threshold (released)
  detector.analyser = { getFloatTimeDomainData: (arr) => arr.fill(0.02) };
  const event2 = detector.update(0.016);

  assert.strictEqual(event2, 'HIGH_BEAM', 'Released sustained noise should classify as HIGH_BEAM');
  assert.strictEqual(highBeamTriggered, true, 'HIGH beam callback should fire');
  assert.strictEqual(midClapTriggered, false, 'Should not trigger mid clap on sustained release');
});
