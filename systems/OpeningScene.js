// A short scripted origin scene. All actors steer through their Vehicle superclass.
class OpeningScene {
  constructor(){
    this.mode='CINEMATIC';this.time=0;this.duration=8.4;
    this.musician=new Musician(420,425);this.musician.playing=true;
    this.guitar=new Guitar(418,354);
    this.chair=new RoomRelic(420,360,'chair',0);
    this.relics=[
      new RoomRelic(103,215,'lamp',1),
      new RoomRelic(212,280,'page',2),new RoomRelic(294,285,'note',3),
      ...Array.from({length:9},(_,i)=>new RoomRelic(405+i*4,350-i*3,'note',i+4))
    ];
    this.rulers=RULERS.map((r,i)=>new RulerVision([100,700,165,635][i],-155-i*45,r.key));
  }
  update(dt){
    const before=this.time;this.time+=dt;const t=this.time,rupture=t>=2.3;
    if(typeof audioSynth!=='undefined'&&audioSynth){
      if(before<2.3&&t>=2.3)audioSynth.playWarning('VESPER');
      if(before<3.6&&t>=3.6)audioSynth.playEnemyAttack('NOVA');
    }
    this.musician.playing=t<2.6;this.musician.abducted=t>=3.6;
    this.musician.target=t<3.6?{x:420,y:425}:
      {x:420+Math.sin(t*1.7)*12,y:425-Math.max(0,t-3.6)*128};
    this.musician.updateScene(dt);
    // The seat stays behind; the abduction gives it only a small steered recoil.
    this.chair.target=t<3.6?this.chair.origin:{x:Math.min(434,420+(t-3.6)*11),y:360};
    this.chair.updateRelic(dt);
    this.guitar.applyForce(this.guitar.arrive(createVector(t<4.6?447:405,t<4.6?405:680)));
    this.guitar.update(dt,{x:20,y:20,width:760,height:860});
    this.relics.forEach((p,i)=>{
      p.target=rupture?{x:p.origin.x+Math.sin(i*2.7)*165,y:p.origin.y-(t-2.3)*(55+i%4*19)}:p.origin;
      p.updateRelic(dt);
    });
    this.rulers.forEach((r,i)=>{
      const angle=i*Math.PI/2+(t-2.7)*1.95;
      r.maxSpeed=t<2.7?5:10;r.maxForce=t<2.7?.36:.72;
      r.target=t<2.7?{x:[95,690,160,640][i],y:-160}:
        t<5.3?{x:this.musician.pos.x+Math.cos(angle)*(t<3.6?160:55),y:this.musician.pos.y-75+Math.sin(angle)*(t<3.6?94:60)}:
        {x:420+(i-1.5)*48,y:-205-(t-5.3)*75};
      r.updateVision(dt);
    });
    return t>=this.duration;
  }
  show(){
    const c=drawingContext,t=this.time,rupture=Math.max(0,Math.min(1,(t-2.2)/1.15));
    c.save();
    if(typeof sceneAssets!=='undefined'&&sceneAssets?.room)c.drawImage(sceneAssets.room.canvas,0,0,800,900);
    else{c.fillStyle='#141b2a';c.fillRect(0,0,800,900);}
    this.chair.show();
    if(rupture){
      c.fillStyle='#06091bcc';c.globalAlpha=rupture*.42;c.fillRect(0,0,800,900);c.globalAlpha=1;
      const beam=c.createLinearGradient(300,0,505,0);
      beam.addColorStop(0,'#fff2cb00');beam.addColorStop(.5,'#fff2c48c');beam.addColorStop(1,'#fff2cb00');
      c.globalAlpha=rupture*(t>6?Math.max(.15,1-(t-6)*.5):.88);
      c.fillStyle=beam;c.beginPath();c.moveTo(384,0);c.lineTo(440,0);
      c.lineTo(508,645);c.lineTo(313,645);c.closePath();c.fill();c.globalAlpha=1;
    }
    if(t>2.25){this.relics.forEach(p=>p.show());}
    if(t>2.7&&t<7.8){c.save();c.globalAlpha=Math.min(1,(t-2.7)*1.7);
      this.rulers.forEach(r=>r.showSilhouette());c.restore();}
    // Four currents grasp the same point, then tighten into the lifting beam.
    if(t>3.55&&t<6.45){
      const grip=Math.min(1,(t-3.55)*2,Math.max(0,(6.45-t)*1.4));
      c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
      const center={x:this.musician.pos.x,y:this.musician.pos.y-73};
      this.rulers.forEach((r,i)=>{
        const midX=(r.pos.x+center.x)/2+Math.sin(t*11+i*2)*32;
        const midY=(r.pos.y+center.y)/2+Math.cos(t*9+i*3)*29;
        for(const [width,alpha] of [[15,.13],[3,.68],[1,.8]]){
          c.globalAlpha=grip*alpha;c.lineWidth=width;c.strokeStyle=width===1?'#fff9eb':r.profile.color;
          c.beginPath();c.moveTo(r.pos.x,r.pos.y);c.quadraticCurveTo(midX,midY,center.x+(i-1.5)*13,center.y);c.stroke();
        }
      });
      c.globalAlpha=grip*.65;c.strokeStyle='#fff6d6';c.lineWidth=2;c.beginPath();c.ellipse(center.x,center.y,18+Math.sin(t*18)*5,33,0,0,Math.PI*2);c.stroke();c.restore();
    }
    if(t<6.65){c.save();c.globalAlpha=t>5.6?Math.max(0,1-(t-5.6)/1.05):1;
      this.musician.show();c.restore();}
    if(t>=2.6){c.save();c.globalAlpha=Math.min(1,(t-2.6)*4);this.guitar.show();c.restore();}
    c.textAlign='center';c.fillStyle='#f8e9d6';c.font='600 17px monospace';
    const caption=t<1.8?'A FORBIDDEN SONG, PLAYED AT HOME.':
      t<3.2?'THE LAST CHORD BROKE THE LIGHT.':
      t<5.65?'SOMETHING CAME THROUGH.':'THE GUITAR FOLLOWED.';
    c.fillText(caption,400,795);
    c.font='11px monospace';c.fillStyle='#d4b7d5';
    c.fillText(t<5.65?'FOUR CURRENTS / ONE STOLEN VOICE':'BECOME THE SOUND THEY CANNOT COMMAND',400,826);
    c.restore();
  }
}
if(typeof module!=='undefined')module.exports={OpeningScene};
