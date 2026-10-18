// The finale is drawn live in the playfield; the actor remains a Vehicle.
const TRANSFORMATION_DURATION=8.2;
function transformationShot(t,reduced=false){
  if(reduced)return {name:t<1.7?'origin':'reveal',x:400,y:430,scale:1};
  if(t<1.35)return {name:'last-chord',x:400,y:555,scale:2.55};
  if(t<2.55)return {name:'guitar-awakens',x:492,y:475,scale:2.25};
  if(t<4.15)return {name:'eyes-and-crown',x:405,y:265,scale:2.05};
  if(t<5.25){const u=(t-4.15)/1.1,s=u*u*(3-2*u);return {name:'pull-back',x:405-5*s,y:265+165*s,scale:2.05-1.05*s};}
  return {name:'hero-reveal',x:400,y:430,scale:1};
}
class TransformationScene {
  constructor(preview=false){
    this.preview=preview;this.time=0;this.duration=TRANSFORMATION_DURATION;
    this.musician=new Musician(400,710);this.musician.playing=true;
    this.cues=new Set();
  }
  update(dt){
    this.time=Math.min(this.duration,this.time+dt);
    this.musician.target={x:400,y:710-(this.time>2?Math.min(18,(this.time-2)*5):0)};
    this.musician.updateScene(dt);
    if(typeof audioSynth!=='undefined'&&audioSynth){
      for(const [at,key,method] of [[1.32,'spark','playCounter'],[2.55,'crown','playCoreBreak'],[5.1,'reveal','playBossReveal']]){
        if(this.time>=at&&!this.cues.has(key)){this.cues.add(key);audioSynth[method](key==='reveal'?'CADENCE':undefined);}
      }
    }
    return this.time>=this.duration;
  }
  get titleVisible(){return this.time>=5.2&&this.time<8.1;}
  get titleProgress(){return Math.max(0,Math.min(1,(this.time-5.2)/.45,(8.2-this.time)/.4));}
  show(reduced=false){
    const c=drawingContext,t=this.time,shot=transformationShot(t,reduced);
    c.save();c.fillStyle='#050b16';c.fillRect(0,0,800,900);
    const bg=c.createRadialGradient(400,390,28,400,390,550);
    bg.addColorStop(0,t<1.5?'#321323':'#152c47');bg.addColorStop(.52,'#111227');bg.addColorStop(1,'#030712');
    c.fillStyle=bg;c.fillRect(0,0,800,900);
    // Scene-wide, deterministic energy arcs; no physical particles or position mutation.
    if(!reduced){c.lineWidth=1.2;for(let i=0;i<18;i++){
      const phase=i*2.399+t*(i%2?-.75:.55),radius=195+Math.sin(t*2+i)*27;
      const x=400+Math.cos(phase)*radius,y=440+Math.sin(phase)*radius*.8;
      c.strokeStyle=i%3?'#52caff77':'#ffca6377';c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(phase)*28,y+Math.sin(phase)*28);c.stroke();
    }}
    c.translate(400,450);c.scale(shot.scale,shot.scale);c.translate(-shot.x,-shot.y);
    // A single steered Musician owns both appearances and the guitar attached to his art.
    if(t<1.52){c.save();c.translate(this.musician.pos.x-400,this.musician.pos.y-710);
      c.translate(0,61);c.scale(1.75,1.75);c.translate(0,-61);
      this.musician.show();c.restore();
    }
    const hero=typeof sceneAssets!=='undefined'?sceneAssets.heroTransformed:null;
    if(hero&&t>=1.36){
      const born=Math.min(1,Math.max(0,(t-1.36)/1.05));
      const w=470,h=w*hero.height/hero.width,x=this.musician.pos.x-w/2,y=this.musician.pos.y-h;
      c.save();c.imageSmoothingEnabled=true;
      // Light opens from the guitar's core, then resolves into the whole body.
      if(t<2.65){c.beginPath();c.ellipse(400,465,40+born*440,30+born*650,0,0,Math.PI*2);c.clip();}
      c.globalAlpha=Math.min(1,born*1.6);
      c.drawImage(hero.canvas,x,y,w,h);
      c.restore();
      if(!reduced){
        const pulse=1+Math.sin(t*4)*.08;
        c.save();c.globalCompositeOperation='lighter';c.lineWidth=2;
        c.strokeStyle='#6bdeff99';c.beginPath();c.ellipse(400,443,Math.max(8,170*born)*pulse,55+22*born,-.18,0,Math.PI*2);c.stroke();
        c.strokeStyle='#ffd77488';c.beginPath();c.ellipse(400,345,Math.max(8,135*born),25+25*born,.2,0,Math.PI*2);c.stroke();c.restore();
      }
    }
    c.restore();
    if(t>1.22&&t<1.7){c.save();c.fillStyle='#e9f7ff';c.globalAlpha=Math.max(0,1-Math.abs(t-1.4)/.3)*.82;c.fillRect(0,0,800,900);c.restore();}
    if(t<5.1){c.textAlign='center';c.font='600 14px monospace';c.fillStyle='#dbeaf6';
      c.fillText(t<1.35?'THE LAST CHORD IS NOT THE END':t<2.6?'THE INSTRUMENT REMEMBERS':t<4.2?'ONE VOICE RETURNS TO THE SKY':'BREAK THE SILENCE',400,815);}
    c.restore();
  }
}
if(typeof module!=='undefined')module.exports={TransformationScene,transformationShot,TRANSFORMATION_DURATION};

