class Hud {
  constructor() {
    this.cache = new Map(); this.popups=[];
    this.nodes = {};
    for(const id of ['band','altitude','milestone','altitude-fill','score','risk','clean-streak','tune','volume','volume-fill','dash','combo','harmony','boss-hud','boss-intro','boss-name','boss-intro-kicker','boss-intro-sigil','boss-intro-name','boss-intro-domain','boss-fill','boss-count','boss-phase','boss-counter','combat-guide','guide-kicker','guide-action','guide-detail','guide-meter','mobile-bar','mobile-life','mobile-volume','screen','screen-title','screen-kicker','screen-copy','play','duel','mic-status','session-status','mic-fill','mic-threshold','demo-panel','demo-tag','demo-title','demo-copy','demo-formula','demo-sound']) this.nodes[id]=document.getElementById(id);
    this.strings=Array.from(document.querySelectorAll('#strings i'));
    this.tunings=Array.from(document.querySelectorAll('[data-tuning]'));
    this.pool=Array.from({length:8},()=>{const n=document.createElement('span'); n.className='popup'; n.hidden=true; document.getElementById('popups').append(n); return n;});
  }
  text(id,value) { value=String(value); if(this.cache.get(id)!==value){this.nodes[id].textContent=value;this.cache.set(id,value);} }
  bar(id,value){const v=Math.round(Math.max(0,Math.min(1,value))*100)/100;if(this.cache.get(id)!==v){this.nodes[id].style.transform='scaleX('+v+')';this.cache.set(id,v);}}
  addPopup(text,x,y,color='#e6be78') {
    const n=this.pool.find(n=>n.hidden); if(!n)return;
    n.hidden=false; n.textContent=text; n.style.color=color;n.style.left=(x/8)+'%';n.style.top=(y/9)+'%';
    this.popups.push({n,life:1});
  }
  update(dt){for(let i=this.popups.length-1;i>=0;i--){const p=this.popups[i];p.life-=dt;p.n.style.opacity=Math.max(0,p.life);p.n.style.transform='translate(-50%,'+(-25*(1-p.life))+'px)';if(p.life<=0){p.n.hidden=true;this.popups.splice(i,1);}}}
  draw(score,guitar,director,shaft,mic){
    this.text('band',openingScene?'BEDROOM':director.currentBand.name.toUpperCase());
    const next=BANDS.find(b=>b.bossWord&&!director.bossDefeated[b.bossWord]);
    this.text('milestone',next?next.bossAlt+' M — UNKNOWN SIGNAL':'ALL RULERS BROKEN');this.text('altitude',Math.floor(score.altitude).toString().padStart(4,'0'));
    this.bar('altitude-fill',score.altitude/4000);this.text('score',Math.floor(score.score).toString().padStart(6,'0'));
    this.text('risk','×'+score.dissonance.toFixed(1));this.text('tune',Math.ceil(score.tune));
    this.text('clean-streak','CLEAN BREAKS '+score.cleanStreak%3+'/3 · OVERTURE');
    const strings=Math.ceil(score.tune/100*6);
    if(this.cache.get('strings')!==strings){this.strings.forEach((n,i)=>n.classList.toggle('broken',i>=strings));this.cache.set('strings',strings);}
    this.text('volume',Math.floor(score.volume)+'%');this.bar('volume-fill',score.volume/100);
    this.text('dash',guitar.dashCooldown>0?'DASH '+guitar.dashCooldown.toFixed(1)+'s':'DASH READY');
    this.text('combo',score.combo>=2?'COMBO ×'+score.combo:'BREAK THE SILENCE');this.text('harmony',score.harmonizeCharges);
    if(this.cache.get('tuning')!==guitar.currentTuning){this.tunings.forEach(n=>n.classList.toggle('active',n.dataset.tuning===guitar.currentTuning));this.cache.set('tuning',guitar.currentTuning);}
    this.text('mobile-life',Math.ceil(score.tune));this.text('mobile-volume',Math.floor(score.volume));
    const boss=director.formations.find(f=>f.isBoss&&!f.isDead);
    const demo=typeof demoPilot!=='undefined'&&demoPilot;
    this.nodes['demo-panel'].hidden=!demo;
    this.nodes['demo-panel'].dataset.opening=!!openingScene;
    this.nodes['demo-sound'].hidden=!demo||!audioSynth?.ctx||audioSynth.ctx.state==='running';
    if(demo){const regular=director.formations.find(f=>!f.isBoss&&!f.isDead);
      const analysis=demoCommentary({opening:!!openingScene,boss,regular,action:demo.lastAction,time:demo.time,shots:demo.shots});
      if(this.nodes['demo-panel'].dataset.signal!==analysis.id){this.nodes['demo-panel'].dataset.signal=analysis.id;
        this.nodes['demo-panel'].classList.remove('signal-flash');void this.nodes['demo-panel'].offsetWidth;
        this.nodes['demo-panel'].classList.add('signal-flash');}
      this.text('demo-tag',analysis.tag);this.text('demo-title',analysis.title);
      this.text('demo-copy',analysis.body);this.text('demo-formula',analysis.formula);
    }
    this.nodes['boss-hud'].hidden=!boss;
    const introEnd=boss?.profile?2.9:3.45;
    const showIntro=!!boss&&boss.phase==='ENTRANCE'&&boss.phaseTimer>1.62&&boss.phaseTimer<introEnd;
    this.nodes['boss-intro'].hidden=!showIntro;
    if(demo&&showIntro)this.nodes['demo-panel'].hidden=true;
    if(boss){const profile=boss.profile||{name:'VESPER',domain:'SOVEREIGN OF SILENCE',altitude:1000};
      const intro=BOSS_INTROS[boss.bossWord]||BOSS_INTROS.HUSH;
      this.nodes['boss-intro'].dataset.boss=boss.bossWord;
      this.nodes['boss-intro'].style.setProperty('--intro-color',intro.color);
      this.text('boss-name',profile.name);this.text('boss-intro-name',profile.name);
      this.text('boss-intro-sigil',intro.sigil);this.text('boss-intro-domain',profile.domain);
      this.text('boss-intro-kicker',intro.kicker);
    }
    if(showIntro){
      const t=boss.phaseTimer,appear=bossIntroReveal(t).card,leave=Math.min(1,(introEnd-t)*3),visibility=Math.max(0,Math.min(appear,leave));
      this.nodes['boss-intro'].style.opacity=visibility;
      this.nodes['boss-intro'].style.transform=reduceMotion?'none':'translate3d('+(1-appear)*-55+'px,'+(1-appear)*16+'px,0) scale('+(0.96+appear*.04)+')';
      this.nodes['boss-intro'].style.setProperty('--intro-clip',(100*(1-appear))+'%');
    }
    if(boss){const count=boss.getLivePoints().length;const exposed=boss.phase==='EXPOSED';
      const hits=boss.coreHitsRequired||VESPER.coreHitsRequired;
      const reforming=boss.bossWord==='HUSH'||boss.profile?.key==='NOVA';
      const shield=Math.max(0,Math.min(1,count/boss.initialPointCount));
      this.bar('boss-fill',reforming?Math.max(0,(hits-boss.coreHits-.5+shield*.5)/hits):exposed?(hits-boss.coreHits)/hits:shield);
      this.text('boss-count',reforming?'CORE '+boss.coreHits+'/'+hits+' · SWARM '+count:exposed?'CORE '+(hits-boss.coreHits)+' / '+hits:count+' / '+boss.initialPointCount);this.text('boss-phase',(boss.getAct?'ACT '+boss.getAct()+' · ':'')+boss.phase.replaceAll('_',' '));this.text('boss-counter',boss.getHint?boss.getHint():boss.profile?(exposed?boss.profile.coreTune+' · HIT CORE':boss.phase.endsWith('_WARN')?'MATCH '+(boss.phase.startsWith('A')?boss.profile.attackATune:boss.profile.attackBTune)+' · BREAK FORM':boss.phase==='A'||boss.phase==='B'?'DODGE · SHATTER PARTICLES':'PREPARE'):['SHIELD','RECALL'].includes(boss.phase)?'MID · BREAK GUARD':['HAND','HAND_WARN'].includes(boss.phase)?'LOW · BREAK GRASP':['MISSILE','MISSILE_WARN'].includes(boss.phase)?'MATCH COLOUR · PARRY':['ORBIT','ORBIT_WARN'].includes(boss.phase)?'FIND THE GAP':exposed?'CHARGE HIGH · HIT CORE':'HIGH · PIERCE');}
    const live=hasStarted&&!openingScene&&!isPaused&&!score.gameOver&&!(score.gameWon&&!score.endlessMode);
    const regular=director.formations.find(f=>!f.isBoss&&!f.isDead&&['TELEGRAPH','STRIKE'].includes(f.phase));
    let guide=boss?.getGuide?.();
    if(!guide&&regular){
      const actions={HAMMER:'DODGE THE SWING',SCISSORS:'SLIP BETWEEN THE BLADES',ARROW:'MOVE AFTER IT LOCKS ON',AXE:'GET BEHIND THE PIVOT',HAND:'ESCAPE THE PALM',JACKHAMMER:'MOVE BETWEEN POUNDS',PINCER:'DASH THROUGH THE GAP',MURMURATION:'GROUP THE FLOCK · BLAST'};
      guide={kicker:regular.shapeKey+' · '+regular.phase,action:actions[regular.shapeKey]||'BREAK THE FORM',
        detail:'Match its resonance: '+regular.shapeDef.resonance+' · 1/2/3 to tune.',progress:regular.phase==='TELEGRAPH'?regular.phaseTimer/1.25:1};
    }
    this.nodes['combat-guide'].hidden=!live||!guide||showIntro||!!demo;
    this.nodes['mobile-bar'].hidden=!live;
    if(live&&guide){this.text('guide-kicker',guide.kicker);this.text('guide-action',guide.action);
      this.text('guide-detail',guide.detail);this.bar('guide-meter',guide.progress||0);}
    this.bar('mic-fill',Math.min(1,(mic?.currentLevel||0)*3));
    this.nodes['mic-threshold'].style.transform='translateX('+Math.min(100,(mic?.threshold||.18)*300)+'px)';
    this.text('mic-status',mic?.permissionDenied?'Microphone unavailable · mouse controls ready':mic?.isListening?'LISTENING · '+Math.round(mic.currentLevel*100)+'%':'Optional · clap to blast, sing to charge');
    this.text('session-status',openingScene?'ORIGIN / THE ROOM':director.bossActive?'BOSS ENCOUNTER':isPaused?'SESSION PAUSED':'LIVE / '+Math.floor(score.altitude)+' M');
    const state=!hasStarted?'title':score.gameOver?'over':score.gameWon&&!score.endlessMode?'won':isPaused?'pause':'play';
    if(this.cache.get('screen')===state)return;this.cache.set('screen',state);
    document.body.classList.toggle('paused',state!=='play');
    this.nodes.screen.hidden=state==='play';
    if(state==='play')return;
    const copy={title:['ASCENT','A GUITAR AGAINST THE SILENCE','They become weapons. You become the sound that breaks them.','BEGIN ASCENT ↗'],
      pause:['PAUSED','LET THE ECHO SETTLE','Your next note is waiting.','RESUME SESSION ↗'],
      over:['SILENCED','THE LAST STRING BROKE',Math.floor(score.altitude)+' metres · '+Math.floor(score.score)+' points','TRY AGAIN ↗'],
      won:['ENCORE','THE SUMMIT IS YOURS',Math.floor(score.score)+' points. The Silence has fallen.','PLAY AGAIN ↗']}[state];
    this.text('screen-title',copy[0]);this.text('screen-kicker',copy[1]);this.text('screen-copy',copy[2]);this.text('play',copy[3]);this.nodes.duel.hidden=state==='pause';document.querySelector('.practice-menu').hidden=state==='pause';
  }
}
if(typeof module!=='undefined')module.exports={Hud};
