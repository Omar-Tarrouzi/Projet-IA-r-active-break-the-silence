const VESPER = Object.freeze({
  name: 'VESPER', subtitle: 'CONDUCTOR OF THE HOLLOW',
  altitude: 1000, particles: 240, spearThreshold: 0.28,
  ringSpeeds: [0.30, -0.19, 0.15], ringGap: 0.62, ringRadii: [105, 167, 229],
  missileCount: 4, missileDamage: 16, missileHitRadius: 58,
  missileParticlesPerVolley: 64, defeatDuration: 2.4, coreHitsRequired: 3,
  regenerationReserve: 420, regenerationBatch: 44, regenerationCeiling: 224, exposureDuration: 6.5,
  durations: { ENTRANCE: 3.6, ORBIT_WARN: 1.5, ORBIT: 4.8, RECALL: 1.8,
    SHIELD: 2.5, HAND_WARN: 1.4, HAND: 2.3, RECOVER: 1.7,
    MISSILE_WARN: 1.4, MISSILE: 4, WORD_WARN: 1.8, WORD_ATTACK: 3,
    EDGE: 3, SPEAR_WARN: 1.4, LUNGE: 1.5 }
});
// These are target offsets, never positions of entities. Agents arrive at them.
function bossSlot(mode, i, count, time, aim = 0) {
  const u = i / Math.max(1, count - 1);
  if (mode === 'ORBIT' || mode === 'ORBIT_WARN') {
    const ring = i % 3, slot = Math.floor(i / 3);
    const slots = Math.ceil((count - ring) / 3);
    const a = Math.PI / 2 + time * VESPER.ringSpeeds[ring] + VESPER.ringGap / 2
      + slot / Math.max(1, slots - 1) * (Math.PI * 2 - VESPER.ringGap);
    const r = VESPER.ringRadii[ring];
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  if (mode === 'HAND' || mode === 'HAND_WARN') {
    const finger = i % 5, v = Math.floor(i / 5) / Math.max(1, Math.ceil(count / 5) - 1);
    const curl = mode === 'HAND' ? Math.min(1, time / 1.8) : 0;
    const length = [75, 115, 132, 116, 80][finger];
    return { x: (finger - 2) * (31 - 19 * curl) + Math.sin(v * Math.PI) * curl * 20,
      y: 50 - v * length * (1 - 0.78 * curl) };
  }
  if (['EDGE', 'SPEAR_WARN', 'LUNGE'].includes(mode)) {
    const x = u * 210 - 85;
    const y = i % 4 < 2 ? (i % 2 ? 1 : -1) * 4 : (1 - u) * (i % 2 ? 1 : -1) * 24;
    return { x: x * Math.cos(aim) - y * Math.sin(aim),
      y: x * Math.sin(aim) + y * Math.cos(aim) };
  }
  const a = u * Math.PI * 2 + time * 0.3;
  const r = mode === 'SHIELD' || mode === 'RECALL' ? 82 + (i % 3) * 7 : 126 + 15 * Math.sin(a * 6);
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 1.15 };
}
// A fixed silhouette sampled by stroke length, like the game's letter outlines.
// Every slot belongs to one original particle index, so damage leaves permanent holes.
function generateThronePoints(count=VESPER.particles){
  const strokes=[
    [[-95,68],[-101,-91],[-77,-119],[-54,-91],[-32,-125],[0,-153],[32,-125],[54,-91],[77,-119],[101,-91],[95,68]],
    [[-73,46],[-72,-61],[-51,-78],[-32,-52],[0,-103],[32,-52],[51,-78],[72,-61],[73,46]],
    [[-92,10],[-138,16],[-150,45],[-99,53],[-76,45]],
    [[92,10],[138,16],[150,45],[99,53],[76,45]],
    [[-90,67],[90,67]],
    [[-81,68],[-85,139],[-49,139],[-43,78]],
    [[81,68],[85,139],[49,139],[43,78]],
    [[-101,111],[101,111]]
  ];
  const segments=[];
  for(const stroke of strokes)for(let k=1;k<stroke.length;k++){
    const a=stroke[k-1],b=stroke[k];
    segments.push({a,b,length:Math.hypot(b[0]-a[0],b[1]-a[1])});
  }
  const length=segments.reduce((sum,s)=>sum+s.length,0),points=[];
  for(let i=0;i<count;i++){
    let distance=i/count*length,j=0;
    while(j<segments.length-1&&distance>segments[j].length)distance-=segments[j++].length;
    const s=segments[j],u=s.length?distance/s.length:0;
    points.push({x:s.a[0]+(s.b[0]-s.a[0])*u,y:s.a[1]+(s.b[1]-s.a[1])*u});
  }
  return points;
}

function segmentDistance(from,to,point){
  const dx=to.x-from.x,dy=to.y-from.y,d=dx*dx+dy*dy;
  const t=d?Math.max(0,Math.min(1,((point.x-from.x)*dx+(point.y-from.y)*dy)/d)):0;
  return Math.hypot(from.x+t*dx-point.x,from.y+t*dy-point.y);
}
function missilePointSlot(i,count){
  const u=i/Math.max(1,count-1);
  if(u<.45){const v=u/.45;return {x:(i%2?1:-1)*(9+v*11),y:28-v*39};}
  if(u<.8){const v=(u-.45)/.35;return {x:(i%2?1:-1)*(20-v*18),y:-11-v*25};}
  return {x:(i%2?1:-1)*3,y:-36-(u-.8)*80};
}
function nextBossPhase(phase, ratio, recoverFrom = '') {
  if (ratio <= VESPER.spearThreshold) {
    return ({ EDGE:'SPEAR_WARN', SPEAR_WARN:'LUNGE', LUNGE:'RECOVER', RECOVER:'EDGE' })[phase] || 'EDGE';
  }
  return ({ ENTRANCE:'ORBIT_WARN', ORBIT_WARN:'ORBIT', ORBIT:'RECALL', RECALL:'SHIELD',
    SHIELD:'HAND_WARN', HAND_WARN:'HAND', HAND:'RECOVER',
    RECOVER:recoverFrom==='WORD_ATTACK'?'ORBIT_WARN':'MISSILE_WARN',
    MISSILE_WARN:'MISSILE', MISSILE:'WORD_WARN', WORD_WARN:'WORD_ATTACK', WORD_ATTACK:'RECOVER' })[phase] || 'ORBIT_WARN';
}
if (typeof module !== 'undefined') module.exports = { VESPER, bossSlot, nextBossPhase, generateThronePoints, segmentDistance, missilePointSlot };
