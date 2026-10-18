// Deterministic local formation slots. Missing particles leave persistent holes.
const RULER_BOSSES=Object.freeze({
  MUTE:{key:'ONYX',name:'HARM ONYX',domain:'QUEEN OF DISCORD',altitude:2000,color:'#ff718f',particles:128,coreTune:'MID',attackATune:'MID',attackBTune:'LOW'},
  ECHO:{key:'NOVA',name:'NOVA',domain:'DUKE OF ECHO',altitude:3000,color:'#74d9ff',particles:128,coreTune:'HIGH',attackATune:'HIGH',attackBTune:'MID'},
  MEASURE:{key:'CADENCE',name:'CADENCE',domain:'SOVEREIGN OF MEASURE',altitude:4000,color:'#e9cf8b',particles:128,coreTune:'LOW',attackATune:'LOW',attackBTune:'HIGH'}
});
function rulerShapeSlot(kind,phase,index,count,time){
  const u=index/Math.max(1,count-1),half=index%2,progress=phase.endsWith('_WARN')?0:Math.min(1,time/3);
  const a=u*Math.PI*2;
  if(phase==='ENTRANCE'||phase==='RECOVER'){
    const radius=90+(index%4)*8;
    return {x:Math.cos(a+time*.28)*radius,y:Math.sin(a+time*.28)*radius*.78};
  }
  if(kind==='ONYX'){
    if(phase.startsWith('A')){
      const v=(Math.floor(index/2)/Math.max(1,Math.ceil(count/2)-1))*2-1;
      return {x:v*240,y:(half?1:-1)*v*96+(phase==='A'?progress*310-90:-90)};
    }
    const radius=phase==='B'?95+progress*190:95;
    const diamond=Math.PI/4+(index%4)*Math.PI/2;
    const angle=diamond+Math.floor(index/4)/Math.ceil(count/4)*Math.PI*.48+time*.65;
    return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
  }
  if(kind==='NOVA'){
    if(phase.startsWith('A')){
      const ring=index%2,r=phase==='A'?85+progress*205-ring*72:85+ring*35;
      const angle=Math.floor(index/2)/Math.ceil(count/2)*Math.PI*2+time*.25;
      return {x:Math.cos(angle)*r,y:Math.sin(angle)*r};
    }
    const side=half?1:-1,v=Math.floor(index/2)/Math.ceil(count/2);
    const x=side*(110+Math.sin(v*Math.PI)*95);
    return {x:x*(phase==='B'?1-progress*.7:1),y:(v-.5)*430+Math.sin(time*4+v*8)*12};
  }
  // The whole finite swarm draws a metronome: frame, swinging rod and weighted bob.
  const beat=time/1.2*Math.PI*2;
  if(phase.startsWith('A')){
    const theta=Math.sin(beat)*.62;
    if(index<48){const edge=index%3,t=Math.floor(index/3)/16;
      const corners=[[-175,115],[0,-165],[175,115],[-175,115]];
      return {x:corners[edge][0]+(corners[edge+1][0]-corners[edge][0])*t,
        y:corners[edge][1]+(corners[edge+1][1]-corners[edge][1])*t};}
    if(index<94){const v=(index-48)/45;
      return {x:Math.sin(theta)*v*225,y:-155+Math.cos(theta)*v*225};}
    const angle=(index-94)/Math.max(1,count-94)*Math.PI*2;
    return {x:Math.sin(theta)*225+Math.cos(angle)*24,
      y:-155+Math.cos(theta)*225+Math.sin(angle)*24};
  }
  const side=index%2?-1:1,j=Math.floor(index/2),theta=side*Math.sin(beat)*.7;
  const pivotX=side*125;
  if(j<42){const v=j/41;return {x:pivotX+Math.sin(theta)*v*235,
    y:-165+Math.cos(theta)*v*235};}
  const angle=(j-42)/Math.max(1,Math.ceil(count/2)-42)*Math.PI*2;
  return {x:pivotX+Math.sin(theta)*235+Math.cos(angle)*26,
    y:-165+Math.cos(theta)*235+Math.sin(angle)*26};
}
if(typeof module!=='undefined')module.exports={RULER_BOSSES,rulerShapeSlot};
