// Curving pursuit: preserve momentum with a bounded Reynolds force.
function redirectPursuitForce(entity,target,turnForce=0.38){
 const dx=target.x-entity.pos.x,dy=target.y-entity.pos.y;
 const distance=Math.hypot(dx,dy);
 if(distance<0.001)return {x:0,y:0};
 const speed=entity.maxSpeed;
 return velocityForce(entity.vel,{x:dx/distance*speed,y:dy/distance*speed},Math.min(entity.maxForce,turnForce));
}
if(typeof module!=='undefined')module.exports={redirectPursuitForce};
