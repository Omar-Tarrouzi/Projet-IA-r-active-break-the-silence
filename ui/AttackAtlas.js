// Pre-rendered attack frames; each moving particle remains a Vehicle.
const ATTACK_KINDS=['vesper','onyx','nova','cadence','onyxTip','novaCore','vesperTip','cadenceDiamond'];
function attackVisual(point){
  if(!point?.boss)return null;
  const key=point.boss.profile?.key||point.boss.bossWord;
  const kind=key==='ORPHEUS'?['vesper','onyx','nova','cadence'][point.sonataVoice??point.boss.voice]:key==='ONYX'?'onyx':key==='NOVA'?'nova':key==='CADENCE'?'cadence':key==='HUSH'?'vesper':null;
  if(!kind)return null;
  const phase=point.boss.phase||'';
  const beat=point.boss.beatClock||0;
  const beatWindow=key==='CADENCE'&&['A','B'].includes(phase)&&
    Math.min(beat%1.2,1.2-beat%1.2)<.24;
  const state=point.state==='STUNNED'?'break':
    point.missileIndex!=null&&point.resonance==='LOW'?'counter':
    phase.endsWith('_WARN')||phase==='WARNING'||phase==='RECALL'?'warn':
    beatWindow?'hit':point.dangerous?'active':'idle';
  const spearTip=kind==='vesper'&&['EDGE','SPEAR_WARN','LUNGE'].includes(phase)&&point.bossSlotIndex===0;
  return {kind:spearTip?'vesperTip':kind,state};
}
class AttackAtlas{
  constructor(){
    this.size=32;this.sheet=document.createElement('canvas');
    this.sheet.width=128;this.sheet.height=32*ATTACK_KINDS.length;
    const c=this.sheet.getContext('2d');
    for(let row=0;row<ATTACK_KINDS.length;row++)for(let frame=0;frame<4;frame++){
      c.save();c.translate(frame*32+16,row*32+16);
      this.paint(c,ATTACK_KINDS[row],frame);c.restore();
    }
  }
  paint(c,kind,frame){
    const warn=frame===0,bright=frame===2,returned=frame===3;
    const ink=returned?'#fff0bd':kind==='onyx'||kind==='onyxTip'?'#ff476b':
      kind==='nova'||kind==='novaCore'?'#7ce0ff':kind==='cadence'?'#efd48b':'#c7b7ff';
    c.globalAlpha=warn?.58:1;c.strokeStyle=ink;c.fillStyle=ink;c.lineWidth=bright?2.3:1.6;
    if(kind==='onyx'){
      c.rotate(frame%2?.18:-.18);c.beginPath();c.moveTo(-7,-4);c.lineTo(0,-8);c.lineTo(7,-4);
      c.lineTo(7,4);c.lineTo(0,8);c.lineTo(-7,4);c.closePath();c.stroke();
      c.fillStyle=bright?'#ffe7ef':'#6b1834';c.fillRect(-2,-2,4,4);
    }else if(kind==='onyxTip'){
      c.beginPath();c.moveTo(0,-14);c.lineTo(10,9);c.lineTo(0,5);c.lineTo(-10,9);c.closePath();c.fill();
      c.fillStyle=returned?'#70273a':'#290f24';c.beginPath();
      c.moveTo(0,-8);c.lineTo(4,5);c.lineTo(0,2);c.lineTo(-4,5);c.fill();
    }else if(kind==='nova'){
      const flicker=frame%2?2:-2;
      c.beginPath();c.moveTo(0,9);c.quadraticCurveTo(-8,4,-5,-3);
      c.quadraticCurveTo(-3,-7+flicker,0,-13);
      c.quadraticCurveTo(1,-5,5,-9+flicker);
      c.quadraticCurveTo(9,1,4,7);c.closePath();c.fill();
      c.fillStyle=returned?'#e5fff3':'#d8f8ff';
      c.beginPath();c.moveTo(0,6);c.lineTo(-2,1);c.lineTo(1,-4);c.lineTo(3,3);c.closePath();c.fill();
    }else if(kind==='cadenceDiamond'){
      c.beginPath();c.moveTo(0,-14);c.lineTo(11,0);c.lineTo(0,14);c.lineTo(-11,0);c.closePath();c.fill();
      c.fillStyle=returned?'#675222':'#392b20';c.beginPath();c.moveTo(0,-7);c.lineTo(5,0);c.lineTo(0,7);c.lineTo(-5,0);c.closePath();c.fill();
    }else if(kind==='novaCore'){
      const radius=10;
      c.beginPath();c.arc(0,0,radius,frame*.23,Math.PI*1.65+frame*.23);c.stroke();
      c.beginPath();c.moveTo(-3,0);c.lineTo(0,-4);c.lineTo(4,0);c.lineTo(0,4);c.closePath();c.fill();
      if(kind==='novaCore'){c.globalAlpha=.65;c.beginPath();c.arc(0,0,14,0,Math.PI*2);c.stroke();}
    }else if(kind==='vesperTip'){
      c.beginPath();c.moveTo(0,-15);c.lineTo(7,-2);c.lineTo(3,9);c.lineTo(0,5);c.lineTo(-3,9);c.lineTo(-7,-2);c.closePath();c.fill();
      c.fillStyle='#211c3f';c.fillRect(-1,-3,2,9);
    }else if(kind==='cadence'){
      c.beginPath();c.arc(0,0,8,-Math.PI*.75,Math.PI*.75);c.stroke();
      c.beginPath();c.moveTo(0,-10);c.lineTo(0,frame===2?4:1);c.lineTo(4,3);c.stroke();
      c.fillRect(-2,8,4,2);
    }else{
      c.rotate(frame*.13);c.beginPath();c.moveTo(0,-10);c.lineTo(7,-2);c.lineTo(2,10);
      c.lineTo(-6,3);c.closePath();c.fill();c.fillStyle='#231d43';
      c.beginPath();c.moveTo(0,-5);c.lineTo(3,-1);c.lineTo(0,5);c.lineTo(-2,1);c.fill();
    }
  }
  draw(c,kind,state,x,y,size=13,angle=0,time=0){
    const row=ATTACK_KINDS.indexOf(kind);if(row<0)return false;
    const frame=state==='warn'?0:state==='break'||state==='hit'?2:state==='counter'?3:1+Math.floor(time*7)%2;
    c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=false;
    c.drawImage(this.sheet,frame*32,row*32,32,32,-size/2,-size/2,size,size);c.restore();return true;
  }
}
let attackAtlas;
if(typeof module!=='undefined')module.exports={attackVisual,ATTACK_KINDS,AttackAtlas};