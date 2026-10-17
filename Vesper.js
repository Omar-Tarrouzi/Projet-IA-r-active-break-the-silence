// The entire articulated silhouette is one visible Vehicle; limbs are local drawing geometry.
class Vesper extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 4.5; this.maxForce = 0.32;
    this.rayonZoneDeFreinage = 90;
    this.age = 0; this.phase = 'ENTRANCE'; this.isDead = false;
  }
  update() { super.update(); this.age += 1 / 60; updateRulerAnimation(this); }
  show() {
    if (this.isDead) return;
    const c = drawingContext, t = this.age;
    if(drawRulerAnimation(c,this))return;
    const open = ['ORBIT', 'ORBIT_WARN', 'HAND_WARN', 'MISSILE_WARN', 'MISSILE', 'WORD_WARN', 'WORD_ATTACK'].includes(this.phase);
    const rage = ['EDGE','SPEAR_WARN','LUNGE'].includes(this.phase);
    const broken=this.phase==='DEFEAT';const exposed=this.phase==='EXPOSED';
    c.save(); c.translate(this.pos.x, this.pos.y);
    if(broken){c.globalAlpha=Math.max(.12,1-(this.age%3)*.08);c.rotate(-.13);}
    c.strokeStyle = rage ? '#ff6b83' : '#c8b7ff'; c.lineWidth = 1.5;
    // Broken celestial crown.
    c.save(); c.rotate(Math.sin(t * 0.35) * 0.12);
    c.beginPath(); c.ellipse(0,-49,45,15,0,0,Math.PI*2); c.stroke();
    for (let s = -1; s <= 1; s += 2) {
      c.beginPath(); c.moveTo(s*19,-47); c.lineTo(s*36,-77); c.lineTo(s*29,-39); c.stroke();
    }
    c.restore();
    // Split mantle and geometric armour.
    c.fillStyle = '#171b36'; c.beginPath();
    c.moveTo(0,-28); c.lineTo(-29,-10); c.lineTo(-53,80);
    c.lineTo(-13,59); c.lineTo(0,102); c.lineTo(13,59); c.lineTo(53,80);
    c.lineTo(29,-10); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#343251'; c.beginPath(); c.moveTo(-22,-9); c.lineTo(0,7);
    c.lineTo(22,-9); c.lineTo(12,38); c.lineTo(0,52); c.lineTo(-12,38); c.closePath(); c.fill();
    // Porcelain mask, long horns, crimson eye slit.
    c.fillStyle = '#e3d9ef'; c.beginPath(); c.moveTo(-12,-48); c.lineTo(12,-48);
    c.lineTo(10,-27); c.lineTo(0,-19); c.lineTo(-10,-27); c.closePath(); c.fill();
    c.strokeStyle = '#ff698c'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-8,-36); c.lineTo(-2,-34); c.moveTo(2,-34); c.lineTo(8,-36); c.stroke();
    if(broken){c.strokeStyle='#202036';c.lineWidth=2;c.beginPath();c.moveTo(2,-48);c.lineTo(-3,-37);c.lineTo(6,-29);c.lineTo(0,-19);c.stroke();}
    // Continuous arm gestures. Only local pose is animated.
    for (const s of [-1,1]) {
      const lift = broken ? 64 : open ? -25 : 12;
      const hx = s * (broken ? 42 : open ? 89 : 57), hy = lift + Math.sin(t*1.7+s)*12;
      c.strokeStyle = '#b5a6d7'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(s*23,-10); c.bezierCurveTo(s*45,20,s*63,hy+22,hx,hy); c.stroke();
      c.strokeStyle = '#f0e5ff'; c.lineWidth = 1.4;
      for(let k=0;k<4;k++) {
        c.beginPath(); c.moveTo(hx,hy); c.quadraticCurveTo(hx+s*(8+k*2),hy-8,hx+s*(9+k*4),hy-17+k*3); c.stroke();
      }
      c.strokeStyle = '#826bab'; c.lineWidth = 0.8;
      c.beginPath(); c.arc(hx,hy,16,0,Math.PI*2); c.stroke();
    }
    c.fillStyle = exposed ? '#fff2cd' : rage ? '#ff6b83' : '#e6c581';
    c.save(); c.translate(0,19); c.rotate(Math.PI/4+Math.sin(t*3)*.14);
    if(exposed){c.shadowColor='#fff2cd';c.shadowBlur=24;c.fillRect(-10,-10,20,20);}
    else c.fillRect(-5,-5,10,10);c.restore();
    c.restore();
  }
}
if (typeof module !== 'undefined') module.exports = { Vesper };
