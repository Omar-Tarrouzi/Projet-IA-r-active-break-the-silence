// Presentation controller; every actor in the farewell and homecoming is a Vehicle.
class EpilogueSequence {
  constructor(boss,assets=null,hero=null){
    this.boss=boss;this.index=0;this.time=0;this.finished=false;
    this.hero=hero;const start=hero?.pos||{x:400,y:635};
    this.musician=new Musician(start.x,start.y);this.musician.maxSpeed=8.5;this.musician.maxForce=.75;
    this.travelGuitar=new Guitar(start.x+20,start.y+28);this.travelGuitar.setTuning('HIGH');
    this.chair=new RoomRelic(420,360,'chair');
    const load=src=>{if(assets?.[src])return assets[src];if(typeof Image==='undefined')return null;const image=new Image();image.src='assets/finale/'+src;return image;};
    this.memory=load('orpheus-memory.webp');this.cracked=load('orpheus-cracked.webp');this.human=load('orpheus-human-clean.webp');
    this.caption=document.getElementById('finale-caption');this.button=document.getElementById('skip-finale');
    this.button.hidden=false;this.button.textContent='SKIP MEMORY ↗';this.button.onclick=()=>this.skip();
    this.caption.hidden=false;document.body.classList.add('finale-playing','epilogue-playing');
    this.scenes=[
      {key:'CRACK',duration:3.2,title:'THE SCORE BREAKS',copy:'The sovereign fractures. Beneath the silence, a memory survives.'},
      {key:'MEMORY',panel:0,duration:4.1,title:'BEFORE THE SONATA',copy:'Once, Orpheus and Eurydice shared an ordinary life beneath the open sky.'},
      {key:'MEMORY',panel:1,duration:4.1,title:'THE DIVIDE',copy:'Death took her beyond a threshold he could not cross.'},
      {key:'MEMORY',panel:2,duration:4.5,title:'THE FORBIDDEN SCORE',copy:'He wrote a song to bind life and death. It split him into four sovereign voices instead.'},
      {key:'CALL',duration:4.1,title:'EURYDICE',copy:'“Orpheus. The song is over. Come to me.”',voice:'female'},
      {key:'ANSWER',duration:3.4,title:'ORPHEUS',copy:'“I spent so long trying to reach you. I am ready.”',voice:'male'},
      {key:'REVEAL',duration:3.7,title:'THE MAN BENEATH THE CROWN',copy:'The last cracks fill with light. The curse lets him go.'},
      {key:'THANKS',duration:4.2,title:'ORPHEUS',copy:'“Thank you. You gave me back my own voice.”',voice:'male'},
      {key:'FADE',duration:2.6,title:'THE FINAL NOTE',copy:'At last, there is no distance between them.'},
      {key:'NORMALIZE',duration:2.5,title:'THE SOUND REMAINS',copy:'The borrowed sovereign power settles. The guitarist is himself again.'},
      {key:'RIDE',duration:3.7,title:'TAKE US HOME',copy:'The guitar answers him, and carries its player back through the sky.'},
      {key:'HOME',duration:3.7,title:'WHERE THE SONG BEGAN',copy:'The doorway opens onto the room they left behind.'},
      {key:'REST',duration:2.8,title:'A NEW FIRST CHORD',copy:'Together, they have a whole world of songs left to play.'}
    ];
    this.enter();
  }
  get scene(){return this.scenes[this.index];}
  enter(){
    const scene=this.scene;if(!scene)return;
    this.caption.querySelector('strong').textContent=scene.title;
    this.caption.querySelector('span').textContent=scene.copy;
    this.button.textContent=['NORMALIZE','RIDE','HOME','REST'].includes(scene.key)?'SKIP HOMECOMING ↗':'SKIP MEMORY ↗';
    if(typeof audioSynth!=='undefined'&&audioSynth&&['NORMALIZE','RIDE','HOME'].includes(scene.key))audioSynth.playCue(scene.key==='HOME'?523:392,scene.key==='HOME'?784:659,.55,.08);
    if(scene.voice)this.speak(scene.copy,scene.voice);
  }
  speak(line,kind){
    const synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance;
    if(!synth||!Utterance)return;
    try{
      synth.cancel();const voiceLine=new Utterance(line.replace(/[“”]/g,''));voiceLine.lang='en-GB';voiceLine.rate=kind==='female'?.83:.78;voiceLine.pitch=kind==='female'?1.15:.85;voiceLine.volume=.85;
      const voices=synth.getVoices?.()||[];const match=voices.find(v=>v.lang?.startsWith('en')&&(/female/i.test(v.name)=== (kind==='female'))) || voices.find(v=>v.lang?.startsWith('en'));
      if(match)voiceLine.voice=match;synth.speak(voiceLine);
    }catch(_){/* Captions carry the story when browser speech is unavailable. */}
  }
  update(dt){
    if(this.finished||document.hidden)return;
    this.time+=Math.max(0,dt);
    if(['NORMALIZE','RIDE','HOME','REST'].includes(this.scene.key))this.updateHome(dt);
    else this.boss.anchor.step(dt,{x:400,y:355});
    if(this.time>=this.scene.duration){this.time=0;this.index++;if(this.index>=this.scenes.length)this.finished=true;else this.enter();}
  }
  updateHome(dt){
    const key=this.scene.key,origin=this.hero?.pos||{x:400,y:635};
    const goal=key==='NORMALIZE'?{x:origin.x+20,y:origin.y+24}:
      key==='RIDE'?{x:400+Math.sin(this.time*1.8)*55,y:this.time<2.75?240:-145}:
      {x:470,y:408};
    this.travelGuitar.applyForce(this.travelGuitar.arrive(createVector(goal.x,goal.y)));
    this.travelGuitar.update(dt);
    this.musician.target=key==='NORMALIZE'?{x:origin.x,y:origin.y}:
      key==='RIDE'?{x:this.travelGuitar.pos.x,y:this.travelGuitar.pos.y-22}:
      {x:420,y:425};
    this.musician.updateScene(dt);
  }
  skip(){this.finished=true;}
  showHome(c,scene){
    const key=scene.key,room=key==='HOME'||key==='REST';
    if(room&&typeof sceneAssets!=='undefined'&&sceneAssets?.room)c.drawImage(sceneAssets.room.canvas,0,0,800,900);
    else image(backgroundLayer,0,0);
    if(room){this.chair.show();
      const opening=key==='HOME'?Math.max(0,1-this.time/1.5):0;
      if(opening){c.fillStyle='rgba(9,13,32,'+(opening*.45)+')';c.fillRect(0,0,800,900);}
    }else{
      c.fillStyle='rgba(5,9,24,.38)';c.fillRect(0,0,800,900);
      c.save();c.strokeStyle='#ffe3a2';c.lineWidth=3;c.globalAlpha=.6;
      c.beginPath();c.ellipse(400,15,145,60,0,0,Math.PI*2);c.stroke();
      if(key==='RIDE'&&!(typeof reduceMotion!=='undefined'&&reduceMotion)){
        for(let i=0;i<28;i++){const x=(i*137)%800,y=(i*219+this.time*170)%900;
          c.globalAlpha=.12+(i%4)*.07;c.beginPath();c.moveTo(x,y);c.lineTo(x-7,y+25);c.stroke();}
      }c.restore();
    }
    const normal=key!=='NORMALIZE'||this.time>1.05;
    if(key==='RIDE'){
      c.save();c.lineCap='round';
      for(let i=0;i<3;i++){
        c.strokeStyle=i===0?'#fff2c2':i===1?'#83f5e6':'#dcb6ff';c.lineWidth=4-i;
        c.globalAlpha=(typeof reduceMotion!=='undefined'&&reduceMotion)?.17:.35-i*.07;
        const x=this.travelGuitar.pos.x,y=this.travelGuitar.pos.y;
        c.beginPath();c.moveTo(x+(i-1)*13,y+30);c.bezierCurveTo(x+(i-1)*25,y+105,x+Math.sin(this.time*7+i)*24,y+175,x+(i-1)*42,y+250);c.stroke();
      }c.restore();
    }
    if(!normal&&this.hero)this.hero.show();
    if(normal){this.travelGuitar.show();this.musician.show();}
    if(key==='NORMALIZE'){
      const burst=Math.max(0,1-Math.abs(this.time-1.05)/.45);
      c.fillStyle='rgba(255,245,206,'+(burst*.88)+')';c.fillRect(0,0,800,900);
      c.save();c.strokeStyle='#fff0bb';c.globalAlpha=Math.max(0,1-this.time/2.5);
      c.lineWidth=2;c.beginPath();c.arc(this.musician.pos.x,this.musician.pos.y-65,30+this.time*95,0,Math.PI*2);c.stroke();c.restore();
    }
    if(key==='REST'){
      const glow=c.createRadialGradient(445,405,5,445,405,140);glow.addColorStop(0,'#ffdc8977');glow.addColorStop(1,'#ffdc8900');
      c.fillStyle=glow;c.fillRect(285,235,320,340);
    }
    c.fillStyle='rgba(4,4,12,.65)';c.fillRect(0,750,800,150);
  }
  show(){
    const c=drawingContext,scene=this.scene;if(!scene)return;
    background(6,7,14);c.save();
    if(['NORMALIZE','RIDE','HOME','REST'].includes(scene.key))this.showHome(c,scene);
    else if(scene.key==='MEMORY'||scene.key==='CALL'||scene.key==='ANSWER'){
      const panel=scene.panel??(scene.key==='CALL'?1:0);
      if(this.memory?.complete&&this.memory.naturalWidth){
        const sw=this.memory.naturalWidth/3,drift=(typeof reduceMotion!=='undefined'&&reduceMotion)?0:Math.min(1,this.time/scene.duration)*18;
        c.drawImage(this.memory,panel*sw,0,sw,this.memory.naturalHeight,-drift,-8,800+drift*2,916);
      }
      c.fillStyle=scene.key==='MEMORY'?'rgba(24,11,7,.16)':'rgba(15,8,13,.48)';c.fillRect(0,0,800,900);
      c.fillStyle='rgba(20,11,10,.72)';c.fillRect(0,740,800,160);
    }else{
      image(backgroundLayer,0,0);
      c.fillStyle='rgba(8,7,16,.72)';c.fillRect(0,0,800,900);
      const revealed=scene.key==='REVEAL'||scene.key==='THANKS'||scene.key==='FADE';
      const opening=scene.key==='REVEAL'?Math.min(1,this.time/2.1):1;
      const glow=c.createRadialGradient(400,335,5,400,335,revealed?310:190);
      glow.addColorStop(0,revealed?'rgba(255,243,199,'+(.44*opening)+')':'rgba(255,205,132,.22)');glow.addColorStop(1,'rgba(255,225,170,0)');c.fillStyle=glow;c.fillRect(0,0,800,750);
      if(revealed){
        const fade=scene.key==='FADE'?Math.max(0,1-this.time/2.35):1;
        if(scene.key==='REVEAL')this.boss.anchor.showEnding(this.cracked,1-opening);
        this.boss.anchor.showEnding(this.human,opening*fade,.92);
        if(scene.key==='REVEAL'){c.fillStyle='rgba(255,245,210,'+Math.max(0,.8-Math.abs(this.time-1.8)*.8)+')';c.fillRect(0,0,800,900);}
      }else{
        this.boss.anchor.showEnding(this.cracked,1);
        const fracture=Math.min(1,scene.key==='CRACK'?this.time/2.5:1);
        c.save();c.translate(this.boss.anchor.pos.x,this.boss.anchor.pos.y);c.strokeStyle='#ffe0a0';c.lineWidth=1.4;c.globalAlpha=.35+fracture*.45;
        for(let i=0;i<9;i++){const a=i*2.399963,x=Math.cos(a)*fracture*115,y=Math.sin(a)*fracture*165;c.beginPath();c.moveTo(x*.26,y*.26);c.lineTo(x*.55+Math.sin(i*9)*13,y*.55);c.lineTo(x,y);c.stroke();}
        c.restore();
      }
      c.fillStyle='rgba(4,4,12,.65)';c.fillRect(0,750,800,150);
    }
    const fadeIn=Math.min(1,this.time/.55),fadeOut=Math.min(1,(this.scene.duration-this.time)/.6);
    c.fillStyle='rgba(5,3,8,'+(.55*(1-Math.min(fadeIn,fadeOut)))+')';c.fillRect(0,0,800,900);
    c.restore();
  }
  dispose(){
    globalThis.speechSynthesis?.cancel?.();this.caption.hidden=true;this.button.hidden=true;this.button.onclick=null;
    document.body.classList.remove('finale-playing','epilogue-playing');
  }
}
if(typeof module!=='undefined')module.exports={EpilogueSequence};
