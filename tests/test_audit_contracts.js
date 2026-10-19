Object.assign(global, require('../behaviors/velocity.js'));
// Static and Spy Contract Test Suite for ASCENT V3-0
// Enforces Craig Reynolds 3-layer architecture, Vehicle inheritance, and locomotion integrity
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

// Mock Vector for Node testing
class MockVector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  copy() { return new MockVector(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
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

// Load base Vehicle from vehicle.js
const vm = require('vm');
const vehicleCode = fs.readFileSync(path.resolve(__dirname, '../vehicle.js'), 'utf8');
vm.runInThisContext(vehicleCode);
global.Vehicle = Vehicle;
global.Target = Target;

// Load entities
const { Guitar } = require('../Guitar.js');
const { FormationAnchor } = require('../FormationAnchor.js');
const { SwarmPoint } = require('../SwarmPoint.js');
const { Note } = require('../Note.js');
const { Pickup } = require('../Pickup.js');
const { Shockwave } = require('../Shockwave.js');
const { Spark } = require('../Spark.js');

// Load behaviors
const { calculateBoundariesForce } = require('../behaviors/boundaries.js');
const { calculateFleeForce } = require('../behaviors/flee.js');
const { homePosition } = require('../behaviors/formation.js');
global.homePosition = homePosition;
global.calculateBoundariesForce = calculateBoundariesForce;

// --- STATIC CONTRACT TESTS ---

test('Contract Lock: vehicle.js is 100% byte-for-byte identical to 3-Arrival_correction', () => {
  const refPath = path.resolve(__dirname, '../../3-Arrival_correction/vehicle.js');
  const targetPath = path.resolve(__dirname, '../vehicle.js');
  const targetData = fs.readFileSync(targetPath);
  if (fs.existsSync(refPath)) assert.deepStrictEqual(targetData, fs.readFileSync(refPath), 'vehicle.js must be a byte-for-byte copy of Project 3 reference');
  else assert.strictEqual(createHash('sha256').update(targetData).digest('hex'), 'fcd716d2129803f22aed8f365c44a595a0141842fa8e20fb77795b194fc58f1e', 'standalone release must preserve the verified course baseline');
});

test('Contract Lock: Every visible entity and leader class extends Vehicle', () => {
  const entities = [Guitar, SwarmPoint, FormationAnchor, Note, Pickup, Shockwave, Spark];
  entities.forEach(cls => {
    assert.strictEqual(
      Object.getPrototypeOf(cls),
      Vehicle,
      `${cls.name} must inherit directly from Vehicle`
    );
  });
});

test('Contract Lock: Static AST/Regex scan confirms NO direct pos/vel/acc writes outside Vehicle', () => {
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'tests' || ent.name === 'libraries') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) scan(full);
      else if (ent.name.endsWith('.js') && ent.name !== 'vehicle.js') {
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        let inConstructor = false;
        let braceDepth = 0;
        lines.forEach((l, i) => {
          if (l.includes('constructor(')) inConstructor = true;
          if (inConstructor) {
            if (l.includes('{')) braceDepth++;
            if (l.includes('}')) {
              braceDepth--;
              if (braceDepth <= 0) inConstructor = false;
            }
          } else {
            // Outside constructor, NO direct write to .acc, or assignment to .vel/.pos
            assert.ok(!/\.acc\s*(=|\.add|\.set|\.mult)/.test(l), `Acc mutation at ${ent.name}:${i+1}: ${l}`);
            assert.ok(!/\.vel\s*(=|\.mult|\.set\b)/.test(l), `Vel mutation at ${ent.name}:${i+1}: ${l}`);
            assert.ok(!/\.(pos|vel)\s*(\+|-)=/.test(l), `Direct pos/vel += at ${ent.name}:${i+1}: ${l}`);
          }
        });
      }
    }
  }
  scan(path.resolve(__dirname, '..'));
});

// --- SPY TESTS: VERIFY INHERITED COURSE FUNCTIONS ARE CALLED ---

test('Spy Contract: Guitar calls inherited Vehicle.arrive when steering to cursor', () => {
  const guitar = new Guitar(200, 200);
  let arriveCalled = false;
  guitar.arrive = function(target, d) {
    arriveCalled = true;
    return Vehicle.prototype.arrive.call(this, target, d);
  };

  const shaft = { x: 50, y: 50, width: 600, height: 700 };
  guitar.steerToCursor(createVector(300, 400), shaft);
  assert.strictEqual(arriveCalled, true, 'Guitar.steerToCursor must call inherited Vehicle.arrive');
});

test('Spy Contract: SwarmPoint in HOMED state calls inherited Vehicle.arrive', () => {
  const anchor = new FormationAnchor(200, 200);
  const pt = new SwarmPoint(250, 250, { x: 0, y: 0 }, anchor);
  pt.state = 'HOMED';

  let arriveCalled = false;
  pt.arrive = function(target, d) {
    arriveCalled = true;
    return Vehicle.prototype.arrive.call(this, target, d);
  };

  pt.updateState(0.016, null, [], { x: 0, y: 0, width: 800, height: 800 });
  assert.strictEqual(arriveCalled, true, 'SwarmPoint HOMED state must call inherited Vehicle.arrive');
});

test('Spy Contract: SwarmPoint recovering from stun calls inherited Vehicle.wander', () => {
  const pt = new SwarmPoint(200, 200);
  pt.state = 'STUNNED';
  pt.stunTimer = 0.2; // in gentle wander window (< 0.4s)

  let wanderCalled = false;
  pt.wander = function() {
    wanderCalled = true;
    return createVector(0.1, 0.1);
  };

  pt.updateState(0.016, null, [], { x: 0, y: 0, width: 800, height: 800 });
  assert.strictEqual(wanderCalled, true, 'SwarmPoint near end of stun must call inherited Vehicle.wander');
});

test('Spy Contract: Pickup.updateDrift calls inherited Vehicle.wander', () => {
  const pickup = new Pickup(300, 100, 'HARMONIZE');
  let wanderCalled = false;
  pickup.wander = function() {
    wanderCalled = true;
    return createVector(0.05, 0.05);
  };

  const shaft = { x: 50, y: 50, width: 600, height: 700 };
  pickup.updateDrift(0.016, shaft);
  assert.strictEqual(wanderCalled, true, 'Pickup must call inherited Vehicle.wander during drift');
});

const { getOrbitSlotPosition } = require('../behaviors/notes.js');
global.getOrbitSlotPosition = getOrbitSlotPosition;

test('Spy Contract: Note in ORBITING state calls inherited Vehicle.arrive', () => {
  const note = new Note(100, 100, 'QUARTER');

  let arriveCalled = false;
  note.arrive = function(target, d) {
    arriveCalled = true;
    return createVector(0.1, 0.1);
  };

  const guitar = new Guitar(200, 200);
  note.updateBehavior(0.016, guitar, [], 0, 1, 0);
  assert.strictEqual(arriveCalled, true, 'Note in QUARTER (orbiting) state must call inherited Vehicle.arrive');
});

test('Spy Contract: behaviors/boundaries.js wraps and calls vehicle.boundaries', () => {
  const v = new Vehicle(10, 100);
  v.vel = createVector(-2, 0);

  let boundariesCalled = false;
  v.boundaries = function(bx, by, bw, bh, d) {
    boundariesCalled = true;
    return Vehicle.prototype.boundaries.call(this, bx, by, bw, bh, d);
  };

  const force = calculateBoundariesForce(v, 0, 0, 800, 800, 35);
  assert.strictEqual(boundariesCalled, true, 'calculateBoundariesForce must wrap and call vehicle.boundaries()');
  assert.ok(force.x > 0, 'Inward force should push to the right when near left border');
});

test('Module Test: behaviors/flee.js produces inverse of seek and clamps to maxForce', () => {
  const v = new Vehicle(200, 200);
  const target = createVector(300, 200); // Target to the right
  const seekF = v.seek(target);
  const fleeF = calculateFleeForce(v, target);

  assert.ok(seekF.x > 0, 'Seek must point toward target (positive X)');
  assert.ok(fleeF.x < 0, 'Flee must point away from target (negative X)');
  assert.ok(fleeF.mag() <= v.maxForce + 0.0001, 'Flee force must not exceed maxForce');
});
