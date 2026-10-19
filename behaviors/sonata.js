// Pure bounded arrive force; no state mutation.
function sonataArriveForce(entity,target,radius=90){
  const dx=target.x-entity.pos.x,dy=target.y-entity.pos.y,d=Math.hypot(dx,dy);
  const speed=entity.maxSpeed*Math.min(1,d/radius);
  let x=(d>1e-8?dx/d*speed:0)-entity.vel.x,y=(d>1e-8?dy/d*speed:0)-entity.vel.y;
  const magnitude=Math.hypot(x,y),limit=entity.maxForce;
  if(magnitude>limit){x*=limit/magnitude;y*=limit/magnitude;}
  return {x,y};
}
if(typeof module!=='undefined')module.exports={sonataArriveForce};
