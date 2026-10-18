// Altitude bands and progression configuration for ASCENT
const BANDS = [
  {
    name: 'Basement',
    minAlt: 0,
    maxAlt: 500,
    maxFormations: 1,
    climbSpeed: 12.0, // m/s
    shapes: ['ARROW', 'HAMMER'],
    smartSwarms: false,
    restWindow: 4.0, // seconds
    subtext: 'Learn to maneuver, dodge, and resonate.'
  },
  {
    name: 'Studio',
    minAlt: 500,
    maxAlt: 1200,
    maxFormations: 2,
    climbSpeed: 13.0,
    shapes: ['ARROW', 'HAMMER', 'SCISSORS', 'AXE', 'PINCER', 'HAND', 'MURMURATION'],
    smartSwarms: false,
    bossAlt: 1000,
    bossWord: 'HUSH',
    restWindow: 3.5,
    subtext: 'Switch tunings. Shatter resonant shapes or harmonize.'
  },
  {
    name: 'Stage',
    minAlt: 1200,
    maxAlt: 2200,
    maxFormations: 2,
    climbSpeed: 14.0,
    shapes: ['ARROW', 'HAMMER', 'SCISSORS', 'AXE', 'PINCER', 'HAND', 'JACKHAMMER', 'MURMURATION'],
    smartSwarms: true, // Swarm evades charge aura
    bossAlt: 2000,
    bossWord: 'MUTE',
    restWindow: 3.0,
    subtext: 'Smart swarms evade your charge. Bait them!'
  },
  {
    name: 'Stadium',
    minAlt: 2200,
    maxAlt: 3500,
    maxFormations: 3,
    climbSpeed: 15.0,
    shapes: ['ARROW', 'HAMMER', 'SCISSORS', 'AXE', 'PINCER', 'HAND', 'JACKHAMMER', 'MURMURATION'],
    smartSwarms: true,
    bossAlt: 3000,
    bossWord: 'ECHO',
    restWindow: 2.5,
    subtext: 'All swarms active. Hear the echo before it strikes.'
  },
  {
    name: 'Orbit', minAlt: 3500, maxAlt: 4500, maxFormations: 3, climbSpeed: 15,
    shapes: ['HAMMER','SCISSORS','AXE','PINCER','HAND','JACKHAMMER','MURMURATION'],
    smartSwarms: true, bossAlt: 4000, bossWord: 'MEASURE', restWindow: 2.5,
    subtext: 'Keep your own rhythm against the final ruler.'
  }
];

function getBandForAltitude(alt) {
  for (let i = BANDS.length - 1; i >= 0; i--) {
    if (alt >= BANDS[i].minAlt) {
      return BANDS[i];
    }
  }
  return BANDS[0];
}

function getTierForAltitude(alt) {
  return 1 + Math.floor(alt / 500);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BANDS, getBandForAltitude, getTierForAltitude };
}
