// Predictable lock, then a bounded turn. Dodging the lock sends the diamond home.
function diamondSteerForce(entity,target,turnCap){
 const dx=target.x-entity.pos.x,dy=target.y-entity.pos.y,dist=Math.hypot(dx,dy);
 if(dist<.001)return {x:0,y:0};
 return velocityForce(entity.vel,{x:dx/dist*entity.maxSpeed,y:dy/dist*entity.maxSpeed},Math.min(entity.maxForce,turnCap));
}
if(typeof module!=='undefined')module.exports={diamondSteerForce};
