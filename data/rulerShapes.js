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
  // Cadence: sweeping clock hands, then descending metronome bars.
  if(phase.startsWith('A')){
    const hand=index%4,v=Math.floor(index/4)/Math.ceil(count/4);
    const angle=hand*Math.PI/2+time*(phase==='A'?.95:0);
    return {x:Math.cos(angle)*(18+v*222),y:Math.sin(angle)*(18+v*222)};
  }
  const lane=index%4,v=Math.floor(index/4)/Math.ceil(count/4);
  return {x:(lane-1.5)*100+Math.sin(time*2+lane)*28,y:(v-.5)*420+(phase==='B'?progress*310-110:0)};
}
if(typeof module!=='undefined')module.exports={RULER_BOSSES,rulerShapeSlot};
