// Media is requested only when the fifth encounter arrives, never in p5 preload.
class FinaleMedia {
  constructor(){
    this.video=document.createElement('video');this.video.playsInline=true;this.video.preload='auto';
    this.video.src='assets/finale/awakening.mp4';this.video.load();
    this.first=new Image();this.first.src='assets/finale/awakening-first.webp';
    this.last=new Image();this.last.src='assets/finale/awakening-last.webp';
    this.rescue=new Image();this.rescue.src='assets/finale/musician-rescue.webp';
    this.orpheus=new Image();this.orpheus.src='assets/finale/orpheus-poses.png';
    this.heroFrames=new Image();this.heroFrames.src='assets/finale/sound-hero-animated.webp';
    this.hero=new Image();this.hero.src='assets/finale/sound-hero.png';
  }
  stop(){this.video.pause();if(this.video.readyState)this.video.currentTime=0;}
}
class FinaleSequence {
  constructor(boss,media){
    this.boss=boss;this.media=media;this.stage='IMPACT';this.time=0;this.finished=false;this.wait=0;
    this.target={x:typeof guitar!=='undefined'?Math.max(260,Math.min(540,guitar.pos.x)):400,y:typeof guitar!=='undefined'?Math.max(570,Math.min(690,guitar.pos.y)):625};this.playRequested=false;this.skipRequested=false;
    this.caption=document.getElementById('finale-caption');this.button=document.getElementById('skip-finale');
    this.button.hidden=false;this.button.onclick=()=>this.skip();
    this.caption.hidden=false;document.body.classList.add('finale-playing');
    this.setCaption('THE FORBIDDEN SONATA','The conductor strikes the guitar.');
  }
  setCaption(title,copy){this.caption.querySelector('strong').textContent=title;this.caption.querySelector('span').textContent=copy;}
  advance(stage){this.stage=stage;this.time=0;}
  skip(){this.media.video.pause();this.advance('RETURN');this.skipRequested=true;this.setCaption('SOVEREIGN OF SOUND','The last instrument has found its player.');}
  startClip(){
    if(this.playRequested)return;this.playRequested=true;
    const video=this.media.video;video.currentTime=0;video.volume=typeof musicDirector!=='undefined'?musicDirector.volume:.3;
    video.muted=false;
    video.play().catch(()=>{video.muted=true;return video.play();}).catch(()=>this.skip());
  }
  update(dt,guitar){
    if(document.hidden){this.media.video.pause();return;}
    this.time+=dt;
    if(this.stage==='IMPACT'){
      guitar.steerToCursor(createVector(this.target.x,this.target.y),shaft);guitar.update(dt,shaft);
      if(this.time>=.7){this.advance('RELEASE');this.boss.prisoner.abducted=false;this.setCaption('THE LAST STRING','The guitarist breaks free and reaches his damaged guitar.');}
    }else if(this.stage==='RELEASE'){
      guitar.steerToCursor(createVector(this.target.x,this.target.y),shaft);guitar.update(dt,shaft);
      this.boss.prisoner.abducted=false;this.boss.prisoner.target={x:this.target.x+43,y:this.target.y+8};this.boss.prisoner.updateScene(dt);
      for(const seal of this.boss.seals){const a=seal.index*Math.PI/2;seal.step(dt,{x:400+Math.cos(a)*350,y:400+Math.sin(a)*350});}
      if(this.time>=3.7){this.advance('CHECK');this.setCaption('STAY WITH ME','The four voices restore what Orpheus broke.');}
    }else if(this.stage==='CHECK'){
      if(this.time>=1.1&&this.media.video.readyState>=2){this.advance('VIDEO');this.setCaption('','');this.startClip();}
      else if(this.time>10)this.skip();
    }else if(this.stage==='VIDEO'){
      const video=this.media.video;
      if(video.error||video.ended){this.advance('RETURN');this.setCaption('SOVEREIGN OF SOUND','The last instrument has found its player.');}
      else if(video.paused&&this.playRequested)video.play().catch(()=>this.skip());
      if(this.time>18)this.skip();
    }else if(this.stage==='RETURN'&&this.time>=2.4){
      this.finished=true;this.media.stop();this.caption.hidden=true;this.button.hidden=true;document.body.classList.remove('finale-playing');
    }
  }
  show(){
    const c=drawingContext,media=this.media,rect={x:0,y:225,w:800,h:450};
    const imageReady=img=>img.complete&&img.naturalWidth;
    c.save();
    if(this.stage==='IMPACT'||this.stage==='RELEASE'){
      if(this.stage==='IMPACT')this.boss.prisoner.show();else this.boss.prisoner.showRescue(media.rescue,Math.hypot(this.boss.prisoner.pos.x-(this.target.x+43),this.boss.prisoner.pos.y-(this.target.y+8))<75);for(const seal of this.boss.seals)seal.show(this.boss.prisoner,Math.max(0,1-this.time/1.6));
      c.strokeStyle='#fff3da';c.lineWidth=2;c.beginPath();c.moveTo(guitar.pos.x-20,guitar.pos.y-16);c.lineTo(guitar.pos.x+14,guitar.pos.y-4);c.lineTo(guitar.pos.x-12,guitar.pos.y+8);c.stroke();
      if(this.stage==='IMPACT'){
        const flash=Math.max(0,1-this.time/.45);
        c.fillStyle='rgba(255,242,210,'+(flash*.7)+')';c.fillRect(0,0,800,900);
        c.strokeStyle='#ffecaf';c.globalAlpha=flash;c.lineWidth=3;c.beginPath();c.arc(guitar.pos.x,guitar.pos.y,24+(1-flash)*115,0,Math.PI*2);c.stroke();
      }else{
        const a=Math.max(0,Math.min(1,(this.time-2.35)/1.05));c.fillStyle='rgba(0,0,0,'+a+')';c.fillRect(0,0,800,900);
        if(imageReady(media.first)){c.globalAlpha=Math.max(0,(this.time-3)/.7);c.drawImage(media.first,rect.x,rect.y,rect.w,rect.h);}
      }
    }else if(this.stage==='CHECK'||this.stage==='VIDEO'){
      c.fillStyle='#000';c.fillRect(0,0,800,900);
      const frame=this.stage==='VIDEO'&&media.video.readyState>=2?media.video:media.first;
      if(frame===media.video||imageReady(frame))c.drawImage(frame,rect.x,rect.y,rect.w,rect.h);
    }else{
      const p=Math.min(1,Math.max(0,(this.time-.6)/1.4)),ease=p*p*(3-2*p);
      c.fillStyle='rgba(0,0,0,'+(1-ease)+')';c.fillRect(0,0,800,900);
      if(imageReady(media.hero)){
        // Exact last-frame crop coordinates preserve the pose at the handoff.
        const from={x:162.5,y:243.75,w:413.75,h:410.625},h=150,w=h*media.hero.naturalWidth/media.hero.naturalHeight;
        const to={x:this.target.x-w/2,y:this.target.y-h*.65,w,h};
        c.drawImage(media.hero,from.x+(to.x-from.x)*ease,from.y+(to.y-from.y)*ease,from.w+(to.w-from.w)*ease,from.h+(to.h-from.h)*ease);
      }
    }
    c.restore();
  }
  dispose(){this.media.stop();this.caption.hidden=true;this.button.hidden=true;document.body.classList.remove('finale-playing');}
}
if(typeof module!=='undefined')module.exports={FinaleMedia,FinaleSequence};
