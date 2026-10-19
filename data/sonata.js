const SONATA = Object.freeze({
  name:'??????', revealedName:'ORPHEUS', altitude:4400, particles:192,
  patterns:['CROWN','CHAINS','ECHO','BEAT'],
  colors:['#c895ff','#ff557c','#74d9ff','#f6d287'],
  tunes:['LOW','MID','HIGH','MID'],
  warning:1.65, active:3.8, recovery:2.7
});
// Formation goals only: the agents reach them through their existing arrive steering.
function sonataSlot(kind,i,count,time,focus,anchor,act=1){
  const group=i%3,u=Math.floor(i/3)/Math.max(1,Math.ceil(count/3)-1);
  if(kind==='CROWN'){
    const gap=1.12,rotation=[.42,-.33,.23][group]*time*(act===2?1.2:1);
    const a=Math.PI/2+gap/2+u*(Math.PI*2-gap)+rotation;
    return {x:focus.x+Math.cos(a)*(95+group*62),y:focus.y+Math.sin(a)*(95+group*62)};
  }
  if(kind==='CHAINS'){
    const lane=i%4,v=Math.floor(i/4)/Math.max(1,Math.ceil(count/4)-1);
    const travel=Math.min(1,time/1.7),sx=lane<2?35:765,sy=260+(lane%2)*190;
    const hx=sx+(focus.x-sx)*travel,hy=sy+(focus.y-sy)*travel;
    return {x:sx+(hx-sx)*v+Math.sin(v*Math.PI)*Math.sin(time*2+lane)*65,
      y:sy+(hy-sy)*v+Math.sin(v*Math.PI)*Math.cos(time*1.5+lane)*60};
  }
  if(kind==='ECHO'){
    const lane=i%6,v=Math.floor(i/6)/Math.max(1,Math.ceil(count/6)-1);
    const a=Math.PI/2+(lane-2.5)*.28+Math.sin(time*.8)*.17;
    const r=60+v*430+Math.min(120,time*30);
    return {x:anchor.x+Math.cos(a)*r+Math.sin(v*12-time*4)*15,y:anchor.y+Math.sin(a)*r};
  }
  const side=i%2?-1:1,v=Math.floor(i/2)/Math.max(1,Math.ceil(count/2)-1);
  const theta=Math.sin(time*2.1)*.85*side,px=anchor.x+side*85,py=anchor.y-20;
  const cx=px+Math.sin(theta)*310,cy=py+Math.cos(theta)*310,a=v*Math.PI*2;
  return {x:cx+Math.cos(a)*48,y:cy+Math.sin(a)*85};
}
if(typeof module!=='undefined')module.exports={SONATA,sonataSlot};
