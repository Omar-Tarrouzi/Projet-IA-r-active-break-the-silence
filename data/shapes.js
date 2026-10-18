// Procedural shape generators for swarm formations (normalized to [-1, 1])

function generateArrowPoints(count = 60) {
  const points = [];
  // Tip: (0, 1) [facing downward towards player] or (0, -1) depending on orientation.
  // In shmup, top-of-screen is y=0, bottom is y=height. A down-pointing spear has tip at (0, 0.9).
  // Tip: (0, 0.8), left wing: (-0.6, -0.7), right wing: (0.6, -0.7), notch: (0, -0.3), shaft base: (0, -0.9)
  
  // Left edge (notch to wing)
  const segments = [
    { from: { x: 0, y: 0.9 }, to: { x: -0.65, y: -0.7 } },
    { from: { x: -0.65, y: -0.7 }, to: { x: -0.2, y: -0.4 } },
    { from: { x: -0.2, y: -0.4 }, to: { x: -0.2, y: -0.9 } },
    { from: { x: -0.2, y: -0.9 }, to: { x: 0.2, y: -0.9 } },
    { from: { x: 0.2, y: -0.9 }, to: { x: 0.2, y: -0.4 } },
    { from: { x: 0.2, y: -0.4 }, to: { x: 0.65, y: -0.7 } },
    { from: { x: 0.65, y: -0.7 }, to: { x: 0, y: 0.9 } }
  ];

  let totalLength = 0;
  const segLengths = segments.map(s => {
    const len = Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y);
    totalLength += len;
    return len;
  });

  const step = totalLength / count;
  for (let i = 0; i < count; i++) {
    const targetDist = i * step;
    let accumulated = 0;
    for (let j = 0; j < segments.length; j++) {
      const segLen = segLengths[j];
      if (accumulated + segLen >= targetDist || j === segments.length - 1) {
        const segT = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
        const clampedT = Math.max(0, Math.min(1, segT));
        points.push({
          x: segments[j].from.x + clampedT * (segments[j].to.x - segments[j].from.x),
          y: segments[j].from.y + clampedT * (segments[j].to.y - segments[j].from.y)
        });
        break;
      }
      accumulated += segLen;
    }
  }

  return points;
}

function generateAxePoints(count = 90) {
  const points = [];
  // Handle: straight vertical cylinder from y=-0.9 to y=0.8
  const handlePoints = Math.floor(count * 0.35);
  for (let i = 0; i < handlePoints; i++) {
    const t = i / (handlePoints - 1);
    points.push({
      x: 0 + (i % 2 === 0 ? -0.05 : 0.05),
      y: -0.9 + t * 1.7
    });
  }

  // Crescent blade: on the right side (x: 0.1 to 0.85, y: -0.4 to 0.4)
  const bladePoints = count - handlePoints;
  for (let i = 0; i < bladePoints; i++) {
    const angle = -Math.PI / 2 + (i / (bladePoints - 1)) * Math.PI;
    const r = 0.75 + (i % 3 === 0 ? -0.15 : 0);
    points.push({
      x: 0.05 + Math.cos(angle) * r * 0.9,
      y: -0.1 + Math.sin(angle) * r
    });
  }

  return points;
}

function generateHandPoints(count = 110) {
  const points = [];
  // Palm: circle/oval around center (0, 0.2)
  const palmPoints = Math.floor(count * 0.4);
  for (let i = 0; i < palmPoints; i++) {
    const angle = (i / palmPoints) * Math.PI * 2;
    const rad = 0.35 + (i % 2 === 0 ? -0.08 : 0.05);
    points.push({
      x: Math.cos(angle) * rad * 0.8,
      y: 0.25 + Math.sin(angle) * rad * 0.7
    });
  }

  // 5 Fingers extending upward
  const fingerCount = count - palmPoints;
  const pointsPerFinger = Math.floor(fingerCount / 5);
  const fingerXSpans = [-0.65, -0.35, -0.05, 0.25, 0.55];
  const fingerLengths = [0.55, 0.75, 0.85, 0.78, 0.5];

  for (let f = 0; f < 5; f++) {
    const baseCount = (f === 4) ? fingerCount - pointsPerFinger * 4 : pointsPerFinger;
    const fx = fingerXSpans[f];
    const flen = fingerLengths[f];
    for (let i = 0; i < baseCount; i++) {
      const t = (i + 1) / (baseCount + 1);
      points.push({
        x: fx + (f - 2) * 0.06 * t,
        y: 0.05 - t * flen,
        finger: f, reach: t
      });
    }
  }

  return points;
}

function generateJackhammerPoints(count = 80) {
  const points = [];
  // Top handles: T-bar at y = -0.8
  const handlePts = Math.floor(count * 0.25);
  for (let i = 0; i < handlePts; i++) {
    const t = (i / (handlePts - 1)) * 2 - 1; // -1 to 1
    points.push({ x: t * 0.65, y: -0.8 });
  }

  // Body: vertical block from y=-0.75 to y=0.3
  const bodyPts = Math.floor(count * 0.45);
  for (let i = 0; i < bodyPts; i++) {
    const t = i / bodyPts;
    const side = (i % 3 === 0) ? -0.25 : (i % 3 === 1) ? 0.25 : 0;
    points.push({ x: side, y: -0.75 + t * 1.05 });
  }

  // Chisel tip: tapering to (0, 0.95)
  const chiselPts = count - handlePts - bodyPts;
  for (let i = 0; i < chiselPts; i++) {
    const t = i / (chiselPts - 1);
    const width = 0.2 * (1 - t);
    const sign = (i % 2 === 0) ? -1 : 1;
    points.push({ x: sign * width, y: 0.3 + t * 0.65 });
  }

  return points;
}

// Convert a word to normalized points using p5 font if available, or procedural fallback font
function generateWordPoints(word, font, count = 250) {
  if (font && typeof font.textToPoints === 'function') {
    try {
      const rawPoints = font.textToPoints(word, 0, 0, 100, {
        sampleFactor: 0.12,
        simplifyThreshold: 0
      });
      if (rawPoints && rawPoints.length > 0) {
        // Find bounds and normalize to [-1, 1]
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        rawPoints.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });

        const spanX = maxX - minX || 1;
        const spanY = maxY - minY || 1;
        const scale = Math.max(spanX, spanY) / 1.8;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        return rawPoints.map(p => ({
          x: (p.x - midX) / scale,
          y: (p.y - midY) / scale
        }));
      }
    } catch (e) {
      // Fallback below
    }
  }

  // Deterministic procedural block letter fallback
  return generateProceduralWordPoints(word, count);
}

function generateProceduralWordPoints(word,targetCount=200) {
  const glyphs={
    C:[[[1,0],[.2,0],[0,.2],[0,.8],[.2,1],[1,1]]],
    H:[[[0,0],[0,1]],[[1,0],[1,1]],[[0,.5],[1,.5]]],
    U:[[[0,0],[0,.8],[.2,1],[.8,1],[1,.8],[1,0]]],
    T:[[[0,0],[1,0]],[[.5,0],[.5,1]]],
    S:[[[1,0],[.18,0],[0,.18],[0,.4],[.18,.5],[.82,.5],[1,.6],[1,.82],[.82,1],[0,1]]],
    I:[[[0,0],[1,0]],[[.5,0],[.5,1]],[[0,1],[1,1]]],
    L:[[[0,0],[0,1],[1,1]]],
    E:[[[1,0],[0,0],[0,1],[1,1]],[[0,.5],[.82,.5]]],
    N:[[[0,1],[0,0],[1,1],[1,0]]],
    V:[[[0,0],[.5,1],[1,0]]],
    P:[[[0,1],[0,0],[.8,0],[1,.16],[1,.38],[.8,.54],[0,.54]]],
    R:[[[0,1],[0,0],[.8,0],[1,.16],[1,.38],[.8,.54],[0,.54]],[[.45,.54],[1,1]]]
  };
  const chars=word.toUpperCase().split(''),weights=chars.map(c=>c===' '? .55:c==='I'?.55:1);
  const gap=.24,total=weights.reduce((n,v)=>n+v,0)+gap*(chars.length-1);
  let left=-.9,segments=[];
  for(let k=0;k<chars.length;k++){
    const width=1.8*weights[k]/total;
    for(const stroke of (glyphs[chars[k]]||[[[0,0],[1,1]]]))for(let j=1;j<stroke.length;j++){
      const p=stroke[j-1],q=stroke[j];
      segments.push({a:{x:left+p[0]*width,y:-.6+p[1]*1.2},
        b:{x:left+q[0]*width,y:-.6+q[1]*1.2}});
    }
    left+=1.8*(weights[k]+gap)/total;
  }
  const lengths=segments.map(e=>Math.hypot(e.b.x-e.a.x,e.b.y-e.a.y));
  const totalLength=lengths.reduce((n,v)=>n+v,0);
  const points=[];
  for(let i=0;i<targetCount;i++){
    let distance=i/targetCount*totalLength,j=0;
    while(j<segments.length-1&&distance>lengths[j])distance-=lengths[j++];
    const e=segments[j],u=lengths[j]?distance/lengths[j]:0;
    points.push({x:e.a.x+(e.b.x-e.a.x)*u,y:e.a.y+(e.b.y-e.a.y)*u});
  }
  return points;
}

function generatePincerPoints(count = 90) {
  const points = [];
  const half = Math.floor(count / 2);

  // Left Scythe / Claw
  for (let i = 0; i < half; i++) {
    const t = i / (half - 1);
    const angle = -Math.PI * 0.55 + t * Math.PI * 0.85;
    const rOuter = 0.85;
    const rInner = 0.55;

    let px, py;
    if (i % 2 === 0) {
      px = Math.cos(angle) * rOuter * 0.85 - 0.15;
      py = Math.sin(angle) * rOuter;
    } else {
      const serration = (i % 4 === 1) ? 0.08 : -0.05;
      px = Math.cos(angle) * (rInner + serration) * 0.85 - 0.05;
      py = Math.sin(angle) * (rInner + serration);
    }
    points.push({ x: px, y: py, wing: 'LEFT' });
  }

  // Right Scythe / Claw (mirrored X)
  for (let i = 0; i < count - half; i++) {
    const t = i / (count - half - 1);
    const angle = -Math.PI * 0.55 + t * Math.PI * 0.85;
    const rOuter = 0.85;
    const rInner = 0.55;

    let px, py;
    if (i % 2 === 0) {
      px = -(Math.cos(angle) * rOuter * 0.85 - 0.15);
      py = Math.sin(angle) * rOuter;
    } else {
      const serration = (i % 4 === 1) ? 0.08 : -0.05;
      px = -(Math.cos(angle) * (rInner + serration) * 0.85 - 0.05);
      py = Math.sin(angle) * (rInner + serration);
    }
    points.push({ x: px, y: py, wing: 'RIGHT' });
  }

  return points;
}

function generateEyePoints(count=90) {
  const out=[];
  for(let i=0;i<count;i++){
    const u=i/count;
    if(u<.64){const a=u/.64*Math.PI*2;out.push({x:Math.cos(a)*.96,y:Math.sin(a)*.4});}
    else if(u<.88){const a=(u-.64)/.24*Math.PI*2;out.push({x:Math.cos(a)*.31,y:Math.sin(a)*.31});}
    else {const a=(u-.88)/.12*Math.PI*2;out.push({x:Math.cos(a)*.115,y:Math.sin(a)*.115});}
  }return out;
}

const SHAPES = {
  ARROW: {
    name: 'Arrow',
    basePoints: 60,
    resonance: 'HIGH',
    contactDamage: 12,
    baseScale: 70,
    generate: generateArrowPoints
  },
  AXE: {
    name: 'Axe',
    basePoints: 90,
    resonance: 'MID',
    contactDamage: 15,
    baseScale: 90,
    generate: generateAxePoints
  },
  PINCER: {
    name: 'Twin Scythes',
    basePoints: 90,
    resonance: 'MID', // Resonates with Mid Frequency (Clap or Warm Amber cone)
    contactDamage: 14,
    baseScale: 80,
    generate: generatePincerPoints,
    isDual: true
  },
  HAND: {
    name: 'Hand',
    basePoints: 110,
    resonance: 'LOW',
    contactDamage: 18,
    baseScale: 95,
    generate: generateHandPoints
  },
  JACKHAMMER: {
    name: 'Jackhammer',
    basePoints: 80,
    resonance: 'LOW',
    contactDamage: 14,
    baseScale: 85,
    generate: generateJackhammerPoints
  },
  MURMURATION: {
    name: 'Swarm Eye', basePoints: 90, resonance: 'LOW',
    contactDamage: 8, baseScale: 92, generate: generateEyePoints
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateArrowPoints,
    generateAxePoints,
    generatePincerPoints,
    generateEyePoints,
    generateHandPoints,
    generateJackhammerPoints,
    generateWordPoints,
    generateProceduralWordPoints,
    SHAPES
  };
}

function sampleOutline(vertices,count) {
  const lengths=vertices.map((p,i)=>{const q=vertices[(i+1)%vertices.length];return Math.hypot(q[0]-p[0],q[1]-p[1]);});
  const total=lengths.reduce((a,b)=>a+b,0),points=[];
  for(let i=0;i<count;i++){
    let distance=i/count*total,edge=0;
    while(edge<lengths.length-1&&distance>lengths[edge])distance-=lengths[edge++];
    const p=vertices[edge],q=vertices[(edge+1)%vertices.length],u=distance/lengths[edge];
    points.push({x:p[0]+(q[0]-p[0])*u,y:p[1]+(q[1]-p[1])*u});
  }
  return points;
}
function generateHammerPoints(count=130) {
  return sampleOutline([[-.8,-.9],[.8,-.9],[.91,-.73],[.8,-.35],[.14,-.35],[.14,.91],[-.14,.91],[-.14,-.35],[-.8,-.35],[-.91,-.73]],count);
}
function generateScissorsPoints(count=140) {
  const points=[];
  for(let i=0;i<count;i++){
    const jaw=i%2===0?-1:1,u=Math.floor(i/2)/Math.ceil(count/2);
    if(u<.6){
      const outline=sampleOutline([[-.045,.08],[-.09,-.88],[.015,-1],[.09,.08]],Math.ceil(count/2)*.6|0);
      const p=outline[Math.min(outline.length-1,Math.floor(u*Math.ceil(count/2)))];
      points.push({x:p.x*jaw,y:p.y,jaw});
    } else {const a=(u-.6)/.4*Math.PI*2;points.push({x:Math.cos(a)*.2,y:.43+Math.sin(a)*.28,jaw});}
  }
  return points;
}
function articulatedSlot(shape,offset,progress) {
  if(shape==='HAND'){
    const curl=Math.max(0,Math.min(1,progress));
    if(offset.finger===undefined)return {x:offset.x,y:offset.y};
    const side=offset.finger-2;
    return {x:offset.x-side*offset.reach*curl*.11,
      y:offset.y+offset.reach*offset.reach*curl*(offset.finger===2?.34:.43)};
  }
  if(shape!=='SCISSORS')return {x:offset.x,y:offset.y};
  const a=offset.jaw*(.72-.65*Math.max(0,Math.min(1,progress)));
  return {x:offset.x*Math.cos(a)-offset.y*Math.sin(a),y:offset.x*Math.sin(a)+offset.y*Math.cos(a)};
}
function generateShurikenPoints(count=88) {
  const points=[],hub=Math.max(12,Math.round(count*.22)),per=Math.floor((count-hub)/4);
  for(let i=0;i<hub;i++){const a=i/hub*Math.PI*2;points.push({x:Math.cos(a)*.2,y:Math.sin(a)*.2});}
  for(let blade=0;blade<4;blade++){
    const a=blade*Math.PI/2,outline=sampleOutline([[.12,-.16],[.69,-.25],[.98,-.03],[.41,.2],[.18,.12]],blade===3?count-hub-per*3:per);
    for(const p of outline)points.push({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
  }
  return points;
}
SHAPES.SHURIKEN={name:'Resonance Shuriken',basePoints:88,resonance:'LOW',contactDamage:12,baseScale:86,generate:generateShurikenPoints};
SHAPES.HAMMER={name:'War Hammer',basePoints:130,resonance:'MID',contactDamage:16,baseScale:115,generate:generateHammerPoints};
SHAPES.SCISSORS={name:'Shears',basePoints:140,resonance:'HIGH',contactDamage:14,baseScale:120,generate:generateScissorsPoints};
if(typeof module!=='undefined')Object.assign(module.exports,{generateHammerPoints,generateScissorsPoints,generateShurikenPoints,articulatedSlot});
