// Flocking behaviors: Separation, Alignment, Cohesion

function calculateSeparation(boid, neighbors, desiredDist = 30) {
  let steerX = 0;
  let steerY = 0;
  let count = 0;

  for (let i = 0; i < neighbors.length; i++) {
    const other = neighbors[i];
    if (other === boid) continue;

    const dx = boid.pos.x - other.pos.x;
    const dy = boid.pos.y - other.pos.y;
    const d = Math.hypot(dx, dy);

    if (d > 0 && d < desiredDist) {
      // Weight inversely proportional to distance
      steerX += (dx / d) / d;
      steerY += (dy / d) / d;
      count++;
    }
  }

  if (count > 0) {
    steerX /= count;
    steerY /= count;

    const mag = Math.hypot(steerX, steerY);
    if (mag > 0.0001) {
      // desired = direction * maxSpeed
      const desX = (steerX / mag) * boid.maxSpeed;
      const desY = (steerY / mag) * boid.maxSpeed;

      // force = desired - vel
      let fx = desX - boid.vel.x;
      let fy = desY - boid.vel.y;

      const fMag = Math.hypot(fx, fy);
      if (fMag > boid.maxForce) {
        fx = (fx / fMag) * boid.maxForce;
        fy = (fy / fMag) * boid.maxForce;
      }
      return { x: fx, y: fy };
    }
  }

  return { x: 0, y: 0 };
}

function calculateAlignment(boid, neighbors, perceptionRadius = 55) {
  let avgVelX = 0;
  let avgVelY = 0;
  let count = 0;

  for (let i = 0; i < neighbors.length; i++) {
    const other = neighbors[i];
    if (other === boid) continue;

    const d = Math.hypot(boid.pos.x - other.pos.x, boid.pos.y - other.pos.y);
    if (d > 0 && d < perceptionRadius) {
      avgVelX += other.vel.x;
      avgVelY += other.vel.y;
      count++;
    }
  }

  if (count > 0) {
    avgVelX /= count;
    avgVelY /= count;

    const mag = Math.hypot(avgVelX, avgVelY);
    if (mag > 0.0001) {
      const desX = (avgVelX / mag) * boid.maxSpeed;
      const desY = (avgVelY / mag) * boid.maxSpeed;

      let fx = desX - boid.vel.x;
      let fy = desY - boid.vel.y;

      const fMag = Math.hypot(fx, fy);
      if (fMag > boid.maxForce) {
        fx = (fx / fMag) * boid.maxForce;
        fy = (fy / fMag) * boid.maxForce;
      }
      return { x: fx, y: fy };
    }
  }

  return { x: 0, y: 0 };
}

function calculateCohesion(boid, neighbors, perceptionRadius = 75) {
  let sumPosX = 0;
  let sumPosY = 0;
  let count = 0;

  for (let i = 0; i < neighbors.length; i++) {
    const other = neighbors[i];
    if (other === boid) continue;

    const d = Math.hypot(boid.pos.x - other.pos.x, boid.pos.y - other.pos.y);
    if (d > 0 && d < perceptionRadius) {
      sumPosX += other.pos.x;
      sumPosY += other.pos.y;
      count++;
    }
  }

  if (count > 0) {
    const targetX = sumPosX / count;
    const targetY = sumPosY / count;

    // Seek towards center of mass
    const dx = targetX - boid.pos.x;
    const dy = targetY - boid.pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.0001) {
      const desX = (dx / dist) * boid.maxSpeed;
      const desY = (dy / dist) * boid.maxSpeed;

      let fx = desX - boid.vel.x;
      let fy = desY - boid.vel.y;

      const fMag = Math.hypot(fx, fy);
      if (fMag > boid.maxForce) {
        fx = (fx / fMag) * boid.maxForce;
        fy = (fy / fMag) * boid.maxForce;
      }
      return { x: fx, y: fy };
    }
  }

  return { x: 0, y: 0 };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateSeparation,
    calculateAlignment,
    calculateCohesion
  };
}

// Single perception pass; separation/alignment/cohesion remain independent terms.
function calculateFlockingForce(boid,neighbors) {
  let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,ns=0,na=0,nc=0;
  const x=boid.pos.x,y=boid.pos.y;
  for(let i=0;i<neighbors.length;i++){
    const p=neighbors[i];if(p===boid)continue;
    const dx=x-p.pos.x,dy=y-p.pos.y,d2=dx*dx+dy*dy;
    if(!d2)continue;
    if(d2<784){sx+=dx/d2;sy+=dy/d2;ns++;}
    if(d2<3025){ax+=p.vel.x;ay+=p.vel.y;na++;}
    if(d2<4900){cx+=p.pos.x;cy+=p.pos.y;nc++;}
  }
  function term(dx,dy,count){
    if(!count)return {x:0,y:0};
    const length=Math.sqrt(dx*dx+dy*dy);
    if(length<.0001)return {x:0,y:0};
    return velocityForce(boid.vel,{x:dx/length*boid.maxSpeed,y:dy/length*boid.maxSpeed},boid.maxForce);
  }
  const sep=term(sx,sy,ns),ali=term(ax,ay,na),coh=term(nc?cx/nc-x:0,nc?cy/nc-y:0,nc);
  return {x:sep.x*1.5+ali.x+coh.x*.8,y:sep.y*1.5+ali.y+coh.y*.8};
}
if(typeof module!=='undefined')module.exports.calculateFlockingForce=calculateFlockingForce;
