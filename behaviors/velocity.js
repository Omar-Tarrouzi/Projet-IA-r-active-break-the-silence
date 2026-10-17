// Pure Reynolds steering. Never mutates inputs.
function velocityForce(velocity, desired, maxForce) {
  const x = desired.x - velocity.x, y = desired.y - velocity.y;
  const length = Math.hypot(x, y);
  const scale = length > maxForce && length > 0 ? maxForce / length : 1;
  return { x: x * scale, y: y * scale };
}
function compose(forces, maxForce) {
  let x = 0, y = 0, remaining = maxForce;
  for (const force of forces) {
    const length = Math.hypot(force.x, force.y);
    if (!length) continue;
    const share = Math.min(length, remaining);
    x += force.x * share / length; y += force.y * share / length;
    remaining -= share;
    if (remaining <= 0) break;
  }
  return { x, y };
}
// Predict braking distance so containment acts before crossing a wall.
function containmentForce(entity, bounds, margin=26) {
  const v=entity.vel, p=entity.pos, f=Math.max(0.001,entity.maxForce);
  const px=p.x+v.x*Math.abs(v.x)/(2*f), py=p.y+v.y*Math.abs(v.y)/(2*f);
  let x=v.x,y=v.y,needed=false;
  if(px<bounds.x+margin){x=entity.maxSpeed;needed=true;}
  else if(px>bounds.x+bounds.width-margin){x=-entity.maxSpeed;needed=true;}
  if(py<bounds.y+margin){y=entity.maxSpeed;needed=true;}
  else if(py>bounds.y+bounds.height-margin){y=-entity.maxSpeed;needed=true;}
  return needed?velocityForce(v,{x,y},f):null;
}
if (typeof module !== 'undefined') module.exports = { velocityForce, compose, containmentForce };
