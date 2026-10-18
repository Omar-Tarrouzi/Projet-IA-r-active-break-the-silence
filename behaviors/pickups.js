// Pure magnetic steering: nearby collectibles accelerate into the guitar.
function pickupMagnetForce(pickup,target,radius=230){
  if(!target||!target.pos)return {x:0,y:0};
  const dx=target.pos.x-pickup.pos.x,dy=target.pos.y-pickup.pos.y;
  const distance=Math.hypot(dx,dy);
  if(!distance||distance>=radius)return {x:0,y:0};
  const speed=Math.min(6,2.4+(radius-distance)/radius*3.6);
  return velocityForce(pickup.vel,{x:dx/distance*speed,y:dy/distance*speed},pickup.maxForce);
}
if(typeof module!=='undefined')module.exports={pickupMagnetForce};
