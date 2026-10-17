// Tunings definition for ASCENT
const TUNINGS = {
  LOW: {
    id: 'LOW',
    name: 'Low Frequency',
    shortName: 'LOW',
    color: '#82f5d4', // Cyan/Teal
    glowColor: 'rgba(0, 245, 212, 0.4)',
    icon: '◉',
    maxRadius: 230,
    force: 0.6,
    stunDuration: 1.5,
    angle: Math.PI * 2, // Full 360 circle
    pierce: false,
    resonantShapes: ['HAND', 'JACKHAMMER', 'MURMURATION'],
    noteType: 'QUARTER'
  },
  MID: {
    id: 'MID',
    name: 'Mid Frequency',
    shortName: 'MID',
    color: '#ffbd70', // Warm Amber
    glowColor: 'rgba(255, 183, 3, 0.4)',
    icon: '▲',
    maxRadius: 340,
    force: 1.0,
    stunDuration: 1.2,
    angle: (2 * Math.PI) / 3, // 120 degree cone upward
    pierce: false,
    resonantShapes: ['AXE', 'PINCER', 'HAMMER'],
    noteType: 'EIGHTH'
  },
  HIGH: {
    id: 'HIGH',
    name: 'High Frequency',
    shortName: 'HIGH',
    color: '#c895ff', // Neon Magenta
    glowColor: 'rgba(247, 37, 133, 0.4)',
    icon: '⚡',
    maxRadius: 580,
    force: 1.4,
    stunDuration: 0.8,
    angle: (20 * Math.PI) / 180, // 20 degree focused beam
    pierce: true,
    resonantShapes: ['ARROW', 'SCISSORS', 'BOSS_LETTER'],
    noteType: 'HALF'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TUNINGS };
}
