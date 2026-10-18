// ASCENT - Main Sketch
// Vertical shmup built on Craig Reynolds' steering behaviours with p5.js & Noise/Clap Detection

let font;
let sceneAssets;
let guitar;
let director;
let scoreManager;
let hud;
let spatialGrid;
let audioSynth;
let musicDirector;
let lastAudioAttack="";
let lastIntroCueBoss=null;
let clapDetector;
let demoPilot=null;

let shockwaves = [];
let alliedNotes = [];
let hitParticles = [];
const neighborScratch=[];
const emptyNeighbors=[];

let shaft = { x: 0, y: 0, width: 780, height: 860 };
let screenShake = 0;
let isPaused = false;
let orbitAngle = 0;
let hasStarted=false;
let lastDuel=false;
let openingScene=null;
let pointerCharging=false;
let touchCharging=false;let touchTarget=null;
let reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let teacherMode=false;
const simulationClock=new FixedStep();
let backgroundLayer;
let spaceMotes=[];let spaceCycle=0;let roomRelics=[];
let frameSamples=[];
let lastPerf=0;
const params=new URLSearchParams(location.search);

function preload() {
  const base='assets/scene/';
  sceneAssets={};
  const names=['room-rpg','musician-idle','musician-walk-a','musician-walk-b','musician-back','musician-back-walk','musician-play','musician-lift',
    'vesper-idle','vesper-command','vesper-lunge','vesper-exposed',
    'onyx-idle','onyx-command','onyx-shield','onyx-lunge',
    'nova-idle','nova-command','nova-lunge','nova-shield',
    'cadence-idle','cadence-command','cadence-lunge','cadence-shield',
    'prop-chair','prop-lamp','prop-page','prop-headphones','prop-amp','prop-notes'];
  for(const name of names){const key=name.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());sceneAssets[key]=loadImage(base+name+'.webp');}
  sceneAssets.room=loadImage(base+'room-rpg-no-guitar.png');
}

function setup() {
  const canvasW = 800;
  const canvasH = 900;
  pixelDensity(1);
  const canvas = createCanvas(canvasW, canvasH);
  canvas.parent('canvas-container');

  // Prevent right-click context menu so right click cancels blast charge smoothly
  canvas.elt.addEventListener('contextmenu', (e) => e.preventDefault());
  const touchAt=e=>{const r=canvas.elt.getBoundingClientRect();touchTarget={x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};};
  canvas.elt.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;
    touchAt(e);touchCharging=true;pointerCharging=false;canvas.elt.setPointerCapture(e.pointerId);e.preventDefault();});
  canvas.elt.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!touchCharging)touchTarget=null;
    if(e.pointerType==='touch'&&touchCharging){touchAt(e);e.preventDefault();}});
  const finishTouch=e=>{if(e.pointerType!=='touch'||!touchCharging)return;
    touchAt(e);touchCharging=false;pointerCharging=false;
    if(hasStarted&&!isPaused&&guitar?.isCharging){const ratio=guitar.chargeDuration/guitar.maxChargeTime;
      fireSonicBlast(ratio,false);guitar.isCharging=false;guitar.chargeDuration=0;}e.preventDefault();};
  canvas.elt.addEventListener('pointerup',finishTouch);canvas.elt.addEventListener('pointercancel',finishTouch);

  // Shaft centering
  shaft.width = Math.min(width - 40, 760);
  shaft.height = height - 40;
  shaft.x = (width - shaft.width) / 2;
  shaft.y = (height - shaft.height) / 2;

  spatialGrid = new SpatialGrid(60);
  scoreManager = new ScoreManager();
  spriteAtlas=new SpriteAtlas(); attackAtlas=new AttackAtlas();
  document.getElementById("hero-guitar").src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(GUITAR_SVG);
  hud = new Hud();
  director = new Director(7391);
  audioSynth = new AudioSynth();
  musicDirector=new MusicDirector(audioSynth);

  // Microphone noise/clap detector
  // - Short Clap => MID Attack (Amber Cone Blast)
  // - Long Sharp Noise => HIGH Attack (Magenta Piercing Laser Beam)
  clapDetector = new ClapDetector({ threshold: 0.18, onsetDelta: 0.08, sustainedMinTime: 0.35 });

  // 1. Short Clap => MID Attack
  clapDetector.onClapCallback = (clapPower) => {
    guitar.setTuning('MID');
    fireSonicBlast(clapPower, 'CLAP_MID', 'MID');
  };

  // 2. Long Sharp Noise => HIGH Attack
  clapDetector.onSustainedStartCallback = () => {
    guitar.setTuning('HIGH');
    guitar.isCharging = true;
    hud.addPopup('BEAM CHARGING...', guitar.pos.x, guitar.pos.y - 30, '#f72585');
  };

  clapDetector.onSustainedProgressCallback = (ratio) => {
    guitar.setTuning('HIGH');
    guitar.isCharging = true;
    guitar.chargeDuration = ratio * guitar.maxChargeTime;
  };

  clapDetector.onSustainedReleaseCallback = (chargeRatio) => {
    guitar.isCharging = false;
    guitar.chargeDuration = 0;
    guitar.setTuning('HIGH');
    fireSonicBlast(chargeRatio, 'NOISE_HIGH', 'HIGH');
  };

  guitar = new Guitar(shaft.x + shaft.width * 0.5, shaft.y + shaft.height * 0.78);
  backgroundLayer=createGraphics(800,900); buildBackdrop(backgroundLayer);
  resetSpace();
  randomSeed(7391);
  document.getElementById('play').onclick=()=>{
    demoPilot=null;
    if(isPaused){isPaused=false;return;}
    if(scoreManager.gameOver||scoreManager.gameWon){startSession(lastDuel);return;}
    lastDuel=false;startOpening();
  };
  document.getElementById('duel').onclick=()=>{demoPilot=null;startSession(document.getElementById('boss-select').value);};
  document.getElementById('demo').onclick=()=>startDemo();
  document.getElementById('demo-boss').onclick=()=>startDemo(document.getElementById('boss-select').value);
  document.getElementById('demo-exit').onclick=stopDemo;
  document.getElementById('demo-sound').onclick=()=>audioSynth.init();
  document.getElementById('skip-opening').onclick=()=>startSession(false);
  document.querySelectorAll('[data-tuning]').forEach(b=>b.onclick=()=>{if(!demoPilot)guitar.setTuning(b.dataset.tuning);});
  document.getElementById('mic-toggle').onclick=()=>{if(clapDetector.isListening)clapDetector.stop();else clapDetector.start();};
  document.getElementById('music-volume').oninput=e=>musicDirector.setVolume(Number(e.target.value)/100);
  document.getElementById('sfx-volume').oninput=e=>audioSynth.setSfxVolume(Number(e.target.value)/100);
  document.getElementById('pause-button').onclick=()=>{if(hasStarted)isPaused=!isPaused;};
  document.getElementById('mobile-dash').onclick=()=>{const t=touchTarget||{x:mouseX,y:mouseY};if(guitar&&hasStarted&&guitar.performDash(createVector(t.x,t.y),shaft,scoreManager))audioSynth.playDash();};
  document.getElementById('mobile-mic').onclick=()=>{if(clapDetector.isListening)clapDetector.stop();else clapDetector.start();};
  document.querySelector('.sound-tutorial').open=window.innerWidth>760;
  document.getElementById('reduce-motion').checked=reduceMotion;
  document.getElementById('reduce-motion').onchange=e=>{reduceMotion=e.target.checked;document.body.classList.toggle("reduced",reduceMotion);};
  document.body.classList.toggle("reduced",reduceMotion);
  document.getElementById('sensitivity').oninput=e=>clapDetector.threshold=0.33-Number(e.target.value)*0.03;
  teacherMode=params.has('teacher');
  if(params.has('demo'))startDemo(params.get('demo'));
  else if(params.has('boss'))startSession(params.get('boss')||'HUSH');
}
function startDemo(chapter='ASCENT'){
  const duel=['HUSH','MUTE','ECHO','MEASURE'].includes(chapter)?chapter:false;
  if(clapDetector?.isListening)clapDetector.stop();
  demoPilot=new DemoPilot(duel||'ASCENT');
  if(duel)startSession(duel);else startOpening();
}
function stopDemo(){demoPilot=null;restartGame();hasStarted=false;document.body.classList.remove('playing');}
function startOpening() {
  restartGame();hasStarted=true;openingScene=new OpeningScene();
  document.getElementById('skip-opening').hidden=false;
  audioSynth.init();musicDirector.setVolume(musicDirector.volume);musicDirector.setScene('ASCENT');musicDirector.pause(false);
}
function startSession(duel) {
  lastDuel=duel||false;restartGame(); hasStarted=true;document.body.classList.add("playing");
  document.getElementById('skip-opening').hidden=true;
  if(duel){const word=typeof duel==='string'?duel:'HUSH';const alt=word==='HUSH'?1000:RULER_BOSSES[word]?.altitude||1000;
    scoreManager.altitude=alt;scoreManager.lastClimbMeter=alt;director.waveTimer=999;
    for(const band of BANDS)if(band.bossWord&&band.bossAlt<alt)director.bossDefeated[band.bossWord]=true;
    director.spawnBoss(word,shaft,font);}
  audioSynth.init();musicDirector.setVolume(musicDirector.volume);musicDirector.setScene(duel||'ASCENT');musicDirector.pause(false);
}


function windowResized() { /* CSS scales the fixed 800 × 900 playfield. */ }
function draw() {
  if(demoPilot&&scoreManager?.gameOver)startSession(lastDuel);
  const start=performance.now(), dt=Math.min(0.05,deltaTime/1000);
  const active=hasStarted&&!openingScene&&!isPaused&&!scoreManager.gameOver&&!(scoreManager.gameWon&&!scoreManager.endlessMode);
  if(openingScene){let done=false;simulationClock.advance(dt,step=>{if(openingScene&&openingScene.update(step))done=true;});if(done)startSession(false);}
  else if(active) simulationClock.advance(dt,updateGame); else simulationClock.reset();
  const boss=director.formations.find(f=>f.isBoss&&!f.isDead);
  const finalPush=boss&&(boss.phase==='EXPOSED'||boss.coreHits>0||boss.getLivePoints().length/boss.initialPointCount<.10);
  const arriving=boss?.phase==='ENTRANCE'&&boss.phaseTimer<1.62;
  musicDirector.setScene(!hasStarted?'':finalPush?'TRIUMPH':boss&&!arriving?boss.bossWord:'ASCENT');
  musicDirector.pause(!active&&!openingScene);musicDirector.tick();
  if(boss&&boss.phase==='ENTRANCE'&&boss.phaseTimer>=1.62&&lastIntroCueBoss!==boss){
    audioSynth.playBossReveal(boss.profile?.key||'VESPER');lastIntroCueBoss=boss;
  }
  const attack=boss&&['HAND','MISSILE','WORD_ATTACK','LUNGE','A','B'].includes(boss.phase)?boss.bossWord+':'+boss.phase+':'+boss.cycle:'';
  if(attack&&attack!==lastAudioAttack&&active)audioSynth.playEnemyAttack(boss.profile?.key||'VESPER');
  lastAudioAttack=attack;
  const updateMs=performance.now()-start;
  background(9,12,19);
  push();
  if(!reduceMotion && screenShake>0 && active)translate((random(1)-0.5)*screenShake,(random(1)-0.5)*screenShake);
  screenShake=Math.max(0,screenShake-dt*25);
  image(backgroundLayer,0,0);
  if(openingScene){openingScene.show();pop();hud.update(dt);hud.draw(scoreManager,guitar,director,shaft,clapDetector);return;}
  const introCamera=bossIntroCamera(boss,reduceMotion);
  if(introCamera.scale>1){translate(400,340);scale(introCamera.scale);translate(-introCamera.x,-introCamera.y);}
  for(const mote of spaceMotes)mote.show();
  drawingContext.save();drawingContext.globalAlpha=.25;for(const relic of roomRelics)relic.show();drawingContext.restore();
  director.pickups.forEach(p=>p.show());
  director.formations.forEach(f=>f.show());
  alliedNotes.forEach(n=>n.show()); shockwaves.forEach(sw=>sw.show());
  hitParticles.forEach(p=>p.show());
  if(hasStarted)guitar.show(scoreManager);
  if(teacherMode)drawTeacher();
  pop();
  hud.update(active?dt:0);hud.draw(scoreManager,guitar,director,shaft,clapDetector);
  if(params.has('perf')) {
    frameSamples.push(deltaTime);if(frameSamples.length>180)frameSamples.shift();
    if(millis()-lastPerf>500){
      const sorted=frameSamples.slice().sort((a,b)=>a-b);
      const out=document.getElementById('perf');out.hidden=false;
      out.textContent='FRAME p95 '+sorted[Math.floor(sorted.length*.95)].toFixed(1)+' ms · UPDATE '+updateMs.toFixed(2)+' ms · DRAW '+(performance.now()-start-updateMs).toFixed(2)+' ms · '+director.formations.reduce((n,f)=>n+f.getLivePoints().length,0)+' POINTS';
      lastPerf=millis();
    }
  }
}
function buildBackdrop(g) {
  const c=g.drawingContext;
  const sky=c.createLinearGradient(0,0,0,900);sky.addColorStop(0,'#100d24');sky.addColorStop(.52,'#081429');sky.addColorStop(1,'#050b19');
  c.fillStyle=sky;c.fillRect(0,0,800,900);
  for(const n of [{x:95,y:130,r:340,color:'#49235c44'},{x:650,y:560,r:440,color:'#0b627048'},{x:420,y:850,r:260,color:'#3b265049'}]){
    const glow=c.createRadialGradient(n.x,n.y,5,n.x,n.y,n.r);glow.addColorStop(0,n.color);glow.addColorStop(1,'#00000000');
    c.fillStyle=glow;c.fillRect(0,0,800,900);
  }
  // Far dust and a fixed vignette keep the space deep while Vehicle stars move.
  for(let i=0;i<90;i++){const x=(i*177.51)%800,y=(i*i*43.17)%900;c.globalAlpha=.04+(i%5)*.025;c.fillStyle='#c7d5ff';c.fillRect(x,y,1,1);}
  c.globalAlpha=1;const vignette=c.createRadialGradient(400,420,150,400,420,640);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#01030bab');c.fillStyle=vignette;c.fillRect(0,0,800,900);
}
function makeSpaceMote(i,y){
  const x=24+((i*231.139+spaceCycle*97.19)%752);
  const depth=.35+(i%7)*.27;
  return new SpaceMote(x,y,depth,i*.37);
}
function resetSpace(){spaceCycle=0;spaceMotes=Array.from({length:105},(_,i)=>makeSpaceMote(i,(i*173.7)%900));
  roomRelics=Array.from({length:8},(_,i)=>makeRoomRelic(i,(i*193.1)%950-50));}
function makeRoomRelic(i,y){
  const kind=['note','page','note','chair','note','page','lamp','note'][i%8];
  const x=80+((i*227.3+spaceCycle*71)%640),relic=new RoomRelic(x,y,kind,i);
  relic.maxSpeed=1.8;relic.maxForce=.12;relic.rayonZoneDeFreinage=90;return relic;
}
function updateSpace(climbSpeed,boost){
  for(let i=0;i<spaceMotes.length;i++){
    const mote=spaceMotes[i];mote.updateTravel(climbSpeed,boost);
    if(mote.pos.y>920){spaceCycle++;spaceMotes[i]=makeSpaceMote(i,-25-(i%13)*6);}
  }
  for(let i=0;i<roomRelics.length;i++){
    const relic=roomRelics[i];relic.maxSpeed=.9+climbSpeed*.075+boost*.08;
    relic.target={x:relic.origin.x+Math.sin(relic.age*.6+i)*25,y:1050};
    relic.updateRelic(1/60);
    if(relic.pos.y>965)roomRelics[i]=makeRoomRelic(i,-90-i*19);
  }
}
function drawTeacher(){
  const pts=director.formations.flatMap(f=>f.getLivePoints()).sort((a,b)=>
    Math.hypot(a.pos.x-guitar.pos.x,a.pos.y-guitar.pos.y)-Math.hypot(b.pos.x-guitar.pos.x,b.pos.y-guitar.pos.y)).slice(0,20);
  const c=drawingContext;c.save();c.lineWidth=1;
  for(const p of [guitar,...pts]){
    c.strokeStyle='#63edbd';c.beginPath();c.moveTo(p.pos.x,p.pos.y);c.lineTo(p.pos.x+p.vel.x*9,p.pos.y+p.vel.y*9);c.stroke();
    if(p.homeTarget){c.strokeStyle='#ad92ff66';c.beginPath();c.moveTo(p.pos.x,p.pos.y);c.lineTo(p.homeTarget.x,p.homeTarget.y);c.stroke();}
  }
  c.restore();
}

function updateGame(dt) {
  if (scoreManager.gameOver || (scoreManager.gameWon && !scoreManager.endlessMode)) {
    return;
  }

  updateParticles(dt);
  const climbSpeed=demoPilot?demoPilot.climbSpeed(director.currentBand.climbSpeed):director.currentBand.climbSpeed;
  updateSpace(director.bossActive?1:climbSpeed,guitar.dashTimer>0?8:0);
  orbitAngle += dt * 2.2;

  // Update Clap Detection transient analysis
  clapDetector.update(dt);

  // Track closest enemy distance for dissonance multiplier
  let closestEnemyDist = Infinity;
  const allEnemyPoints = [];

  director.formations.forEach(form => {
    form.points.forEach(pt => {
      if (!pt.isDead && !pt.isConverted) {
        allEnemyPoints.push(pt);
        const d = p5.Vector.dist(pt.pos, guitar.pos);
        if (d < closestEnemyDist) closestEnemyDist = d;
      }
    });
  });

  // Score & Resource updates
  const pendingBoss=BANDS.find(b=>b.bossWord&&!director.bossDefeated[b.bossWord]&&scoreManager.altitude>=b.bossAlt);
  scoreManager.update(dt, director.bossActive||pendingBoss?0:climbSpeed, closestEnemyDist < Infinity ? closestEnemyDist : null);
  if(!director.bossDefeated.MEASURE)scoreManager.gameWon=false;
  if(director.bossDefeated.MEASURE && scoreManager.altitude>=4000)scoreManager.gameWon=true;

  // Player input: steer guitar to cursor
  const demoAction=demoPilot?.decide(dt,guitar,scoreManager,director.formations,director.pickups,shaft);
  const inputTarget=demoAction?.target||touchTarget||{x:mouseX,y:mouseY};
  if(demoAction)guitar.setTuning(demoAction.tuning);
  guitar.steerToCursor(createVector(inputTarget.x,inputTarget.y), shaft);
  guitar.update(dt, shaft);

  // Guitar blast charging (mouse fallback)
  const isHoldingLeft = demoAction?demoAction.hold:touchCharging || (pointerCharging && mouseIsPressed && mouseButton === LEFT);
  if(!clapDetector.isSustainedMode)guitar.updateCharge(isHoldingLeft, dt, scoreManager.canFireBlast(0));
  if(demoAction?.fire){fireSonicBlast(demoAction.power,false,demoAction.tuning);guitar.updateCharge(false,0,true);}

  // Spatial Grid population for flocking
  spatialGrid.clear();
  allEnemyPoints.forEach(pt => {
    if (pt.state === 'FLOCK') {
      spatialGrid.insert(pt);
    }
  });

  // Director wave pacing
  director.update(dt, scoreManager, shaft, font);

  // Formations update
  director.formations.forEach(form => {
    const previousPhase=form.phase;
    form.update(dt, guitar, shaft, director.currentBand.smartSwarms);
    if(!form.isBoss&&previousPhase!==form.phase&&form.phase==='STRIKE')audioSynth.playEnemyAttack('SWARM');
    if(form.getHazards)for(const hazard of form.getHazards()){
      if(p5.Vector.dist(hazard.pos,guitar.pos)>hazard.r+guitar.r)continue;
      hazard.hitPlayer=true;
      if(form.profile.key==='ONYX'){hazard.mode='HOLD';hazard.target={x:guitar.pos.x,y:guitar.pos.y};}
      else hazard.isDead=true;
      if(scoreManager.takeDamage(10)){form.tookDamage=true;audioSynth.playDamage();screenShake=9;
        spawnSparks(guitar.pos.x,guitar.pos.y,form.profile.color,12);
        hud.addPopup(form.profile.key==='ONYX'?'CHAIN DART HIT':'ECHO HIT',guitar.pos.x,guitar.pos.y-35,form.profile.color);}
    }
    if(form.isBoss&&form.coreDangerous&&!form.coreContactUsed&&p5.Vector.dist(form.anchor.pos,guitar.pos)<48+guitar.r){
      form.coreContactUsed=true;
      if(scoreManager.takeDamage(14)){form.tookDamage=true;audioSynth.playDamage();screenShake=12;
        spawnSparks(guitar.pos.x,guitar.pos.y,'#ff728f',16);hud.addPopup(form.name+' / STRIKE',guitar.pos.x,guitar.pos.y-35,'#ff728f');}
    }

    // Form points update
    form.points.forEach(pt => {
      if (pt.isDead) return;

      const neighbors = pt.state === 'FLOCK' ? spatialGrid.queryNeighbors(pt, 70, neighborScratch) : emptyNeighbors;
      pt.updateState(dt, guitar, neighbors, shaft, director.currentBand.smartSwarms);
      pt.update();

      // Check contact damage with player during active attack or flock
      if (!pt.isDead && pt.state !== 'STUNNED' && !pt.isConverted && (pt.boss ? pt.dangerous : form.phase==='STRIKE'||pt.state==='FLOCK')) {
        const distToPlayer = p5.Vector.dist(pt.pos, guitar.pos);
        if (distToPlayer < pt.r + guitar.r) {
          // Check if player has an active Quarter shield note to absorb hit
          const shieldNote = alliedNotes.find(n => n.kind === 'QUARTER' && !n.isDead);
          if (shieldNote) {
            shieldNote.isDead = true;
            if(pt.boss)pt.boss.damagePoint(pt,'shield');else pt.isDead = true;
            hud.addPopup('BLOCKED!', pt.pos.x, pt.pos.y, '#06d6a0');
            spawnSparks(pt.pos.x, pt.pos.y, '#06d6a0', 10);
            screenShake = 4;
          } else {
            const hitTaken = scoreManager.takeDamage(form.shapeDef.contactDamage || 12);
            if (hitTaken) {
              form.tookDamage = true;
              audioSynth.playDamage();
              screenShake = 12;
              spawnSparks(guitar.pos.x, guitar.pos.y, '#ef476f', 16);
              hud.addPopup(`-${form.shapeDef.contactDamage}`, guitar.pos.x, guitar.pos.y - 20, '#ef476f');
            }
          }
        }
      }
    });

    if (form.isCleared && !form.bonusAwarded) {
      form.bonusAwarded = true;
      const clear=director.onFormationCleared(form, scoreManager, shaft);
      const message=form.isBoss?'SOVEREIGN BROKEN · +TUNE':clear.flourish?'OVERTURE! · +VOLUME +'+clear.bonus:
        clear.clean?'CLEAN BREAK '+clear.streak%3+'/3 · +'+clear.bonus:'FORM BROKEN · +'+clear.bonus;
      hud.addPopup(message, shaft.x + shaft.width * 0.5, shaft.y + 140, clear.flourish?'#ffd166':'#82f5d4');
      audioSynth.playConversion();if(form.isBoss)audioSynth.playCoreBreak();
    }
  });

  // Pickups update & contact check
  director.pickups.forEach(p => {
    p.updateDrift(dt, shaft);
    p.update();

    if (!p.isDead && p5.Vector.dist(p.pos, guitar.pos) < p.r + guitar.r) {
      p.isDead = true;
      if (p.type === 'HARMONIZE') {
        if(scoreManager.harmonizeCharges<scoreManager.maxHarmonize){
          scoreManager.addHarmonizeCharge();
          hud.addPopup('+HARMONIZE CHARGE', guitar.pos.x, guitar.pos.y - 30, '#ffd166');
        }else if(scoreManager.volume<95){
          scoreManager.refundVolume(25);
          hud.addPopup('CHARGE FULL · +25 VOLUME',guitar.pos.x,guitar.pos.y-30,'#82f5d4');
        }else{
          scoreManager.score+=150*scoreManager.getTier();
          hud.addPopup('CHARGE FULL · SCORE BONUS',guitar.pos.x,guitar.pos.y-30,'#ffd166');
        }
        audioSynth.playConversion();
      } else if(p.type==='TUNE'){
        scoreManager.healTune(15);hud.addPopup('+15 TUNE',guitar.pos.x,guitar.pos.y-30,'#ff8aa6');
        audioSynth.playConversion();
      } else if(p.type==='VOLUME'){
        scoreManager.refundVolume(35);hud.addPopup('+35 VOLUME',guitar.pos.x,guitar.pos.y-30,'#82f5d4');
        audioSynth.playConversion();
      } else {
        // REST: slow all active enemies via braking deceleration force
        allEnemyPoints.forEach(pt => {
          const brakeForce = p5.Vector.mult(pt.vel, -0.6).limit(pt.maxForce);
          pt.applyForce(brakeForce);
        });
        hud.addPopup('REST! SWARM SLOWED', guitar.pos.x, guitar.pos.y - 30, '#06d6a0');
      }
    }
  });

  // Shockwaves expansion & blast collision logic
  for (let sIdx = shockwaves.length - 1; sIdx >= 0; sIdx--) {
    const sw = shockwaves[sIdx];
    sw.updateExpansion(dt);

    for(const form of director.formations)if(form.isBoss){
      if(form.reflectMissiles)form.reflectMissiles(sw);
      if(form.reflectChains)form.reflectChains(sw);
      if(form.reflectEchoes)form.reflectEchoes(sw);
      if(form.strikeCore)form.strikeCore(sw);
      if(form.directHit)form.directHit(sw);
    }
    allEnemyPoints.forEach(pt => {
      if (pt.isDead || pt.isConverted || sw.affectedPoints.has(pt)) return;
      if(pt.boss&&pt.missileIndex!=null)return;

      const blastForce = calculateBlastForce(pt, sw);
      if (blastForce) {
        if(pt.boss?.profile){sw.rulerPointHits=sw.rulerPointHits||new Map();
          const used=sw.rulerPointHits.get(pt.boss)||0;if(used>=18)return;
          sw.rulerPointHits.set(pt.boss,used+1);}
        sw.affectedPoints.add(pt);
        const impulse = createVector(blastForce.x, blastForce.y);

        // Guard absorbs a finite portion of each blast, and still loses particles.
        if(pt.boss && pt.boss.phase==='SHIELD'){
          sw.guardHits=sw.guardHits||0;
          if(sw.guardHits>=8)return;
          sw.guardHits++;
        }
        // Check resonance
        const isResonant = sw.tuning.id === pt.resonance || sw.tuning.resonantShapes.includes(pt.resonance) ||
          sw.tuning.resonantShapes.includes(pt.anchor?.shapeKey) ||
          (pt.isWeakLetter && sw.tuning.id === 'HIGH');

        if (sw.isHarmonized) {
          // HARMONIZE CONVERSION: turn point into allied Note!
          const conversionChance = isResonant ? 1.0 : 0.5;
          if (director.random() <= conversionChance && alliedNotes.length < 60) {
            pt.isConverted = true;
            pt.isDead = true;
            if(pt.boss)pt.boss.finishIfEmpty();

            const noteKind = sw.tuning.noteType || 'EIGHTH';
            const note = new Note(pt.pos.x, pt.pos.y, noteKind, pt.vel);
            alliedNotes.push(note);

            spawnSparks(pt.pos.x, pt.pos.y, sw.tuning.color, 8);
            audioSynth.playConversion();
          } else {
            pt.stun(sw.tuning.stunDuration, impulse);
          }
        } else if (isResonant) {
          // RESONANT SHATTER: Destroy point!
          if(pt.boss)pt.boss.damagePoint(pt,'blast');else pt.isDead = true;
          const earned = scoreManager.onPointDestroyed();
          audioSynth.playCombo(scoreManager.combo);
          spawnSparks(pt.pos.x, pt.pos.y, sw.tuning.color, 10);
          const rank = scoreManager.getComboRank ? scoreManager.getComboRank() : null;
          hud.addPopup(`+${earned}${rank ? ' ' + rank.title : ''}`, pt.pos.x, pt.pos.y, sw.tuning.color);
        } else {
          // NON-RESONANT: Stun and scatter
          pt.stun(sw.tuning.stunDuration, impulse);
          spawnSparks(pt.pos.x, pt.pos.y, '#7a889b', 4);
        }
      }
    });

    if (sw.isDead) {
      shockwaves.splice(sIdx, 1);
    }
  }

  // Allied Notes update & collision logic
  const quarterNotes = alliedNotes.filter(n => n.kind === 'QUARTER' && !n.isDead);
  for (let nIdx = alliedNotes.length - 1; nIdx >= 0; nIdx--) {
    const note = alliedNotes[nIdx];
    const orbIdx = quarterNotes.indexOf(note);

    note.updateBehavior(dt, guitar, allEnemyPoints, orbIdx, quarterNotes.length, orbitAngle);
    note.update();

    // Homing Eighth or Boomerang Half attacks enemy points
    if (note.kind === 'EIGHTH' || note.kind === 'HALF') {
      for (let pIdx = 0; pIdx < allEnemyPoints.length; pIdx++) {
        const ep = allEnemyPoints[pIdx];
        if (ep.isDead || ep.isConverted) continue;

        if (p5.Vector.dist(note.pos, ep.pos) < note.r + ep.r) {
          if(ep.boss)ep.boss.damagePoint(ep,'note');else ep.isDead = true;
          note.pierceCount++;
          scoreManager.onPointDestroyed();
          audioSynth.playCombo(scoreManager.combo);
          spawnSparks(ep.pos.x, ep.pos.y, note.color, 8);

          if (note.pierceCount >= note.maxPierce) {
            note.isDead = true;
            break;
          }
        }
      }
    }

    if (note.isDead) {
      alliedNotes.splice(nIdx, 1);
    }
  }
}

// Fire a sonic blast triggered by clap (MID), sustained noise (HIGH), or mouse release
function fireSonicBlast(power = 1.0, triggerType = false, forcedTuningKey = null) {
  if (!guitar || !hasStarted || isPaused || scoreManager.gameOver || (scoreManager.gameWon&&!scoreManager.endlessMode)) return;

  const tuningKey = forcedTuningKey || guitar.currentTuning;
  guitar.setTuning(tuningKey);
  const tuning = TUNINGS[tuningKey];
  const chargeRatio = Math.max(0.35, Math.min(1.0, power));

  if (scoreManager.canFireBlast(chargeRatio)) {
    scoreManager.consumeBlastVolume(chargeRatio);

    const isHarmonized = scoreManager.consumeHarmonizeCharge();
    const sw = new Shockwave(guitar.pos.x, guitar.pos.y - 12, tuning, chargeRatio, isHarmonized);
    shockwaves.push(sw);
    for(const form of director.formations)if(form.onPlayerBlast)form.onPlayerBlast(sw);

    audioSynth.playBlast(tuningKey, chargeRatio);
    screenShake = 4 + chargeRatio * 11;
    spawnSparks(guitar.pos.x, guitar.pos.y - 10, tuning.color, 16);

    if (triggerType === 'CLAP_MID') {
      hud.addPopup('👏 CLAP! MID CONE BLAST', guitar.pos.x, guitar.pos.y - 35, '#ffb703');
    } else if (triggerType === 'NOISE_HIGH') {
      hud.addPopup('⚡ SHARP NOISE! HIGH LASER BEAM', guitar.pos.x, guitar.pos.y - 35, '#f72585');
    } else if (triggerType) {
      hud.addPopup('SONIC BLAST FIRED!', guitar.pos.x, guitar.pos.y - 35, tuning.color);
    }
  }
}

// Mouse release fires blast (fallback if player chooses not to clap)
function mouseReleased(event) {
  const wasCharging=pointerCharging;pointerCharging=false;
  if(!hasStarted||isPaused||!wasCharging||demoPilot)return;
  if (mouseButton === LEFT && guitar && guitar.isCharging) {
    const chargeRatio = guitar.chargeDuration / guitar.maxChargeTime;
    fireSonicBlast(chargeRatio, false);
    guitar.isCharging = false;
    guitar.chargeDuration = 0;
  }
}

// Mouse click triggers mic authorization on user gesture
function mousePressed(event) {
  if(openingScene&&event?.target?.tagName==='CANVAS'){openingScene.click(mouseX,mouseY);return;}
  if(!hasStarted||isPaused||demoPilot||event?.target?.tagName!=='CANVAS')return;
  if(mouseButton===LEFT)pointerCharging=true;
  if (mouseButton === RIGHT) {
    if (guitar && guitar.isCharging) {
      const chargeRatio = guitar.chargeDuration / guitar.maxChargeTime;
      const cost = 20 + 30 * chargeRatio;
      // Charging is free until release, so cancellation has no refund.
      guitar.isCharging = false;
      guitar.chargeDuration = 0;
      hud.addPopup('CHARGE CANCELLED', guitar.pos.x, guitar.pos.y - 25, '#708096');
    } else if (guitar) {
      if (guitar.performDash(createVector(mouseX, mouseY), shaft, scoreManager)) {
        audioSynth.playDash();
        hud.addPopup('SONIC DASH!', guitar.pos.x, guitar.pos.y - 30, '#00f5d4');
        screenShake = 6;
      }
    }
  }

  // Restart on click if game over
  if (scoreManager && scoreManager.gameOver) {
    restartGame();
  }
}

// Mouse wheel switches tuning
function mouseWheel(event) {
  if(!hasStarted||isPaused||demoPilot||event.target?.tagName!=='CANVAS')return;
  const tunings = ['LOW', 'MID', 'HIGH'];
  let currentIdx = tunings.indexOf(guitar.currentTuning);
  if (event.delta > 0) {
    currentIdx = (currentIdx + 1) % tunings.length;
  } else {
    currentIdx = (currentIdx - 1 + tunings.length) % tunings.length;
  }
  guitar.setTuning(tunings[currentIdx]);
  return false;
}

function keyPressed() {
  if(demoPilot){if(keyCode===ESCAPE)stopDemo();return;}
  if(openingScene){if(keyCode===ESCAPE)startSession(false);return;}
  if(document.activeElement?.tagName==='INPUT')return;
  if(key==='x'||key==='X'){teacherMode=!teacherMode;return;}
  if(key==='.'&&isPaused){updateGame(1/60);return;}
  if(!hasStarted)return;
  if(isPaused && !['p','P','r','R'].includes(key) && keyCode!==ESCAPE)return;
  if (key === '1') guitar.setTuning('LOW');
  else if (key === '2') guitar.setTuning('MID');
  else if (key === '3') guitar.setTuning('HIGH');
  else if (key === 'p' || key === 'P' || keyCode === ESCAPE) isPaused = !isPaused;
  else if (key === 'd' || key === 'D') teacherMode = !teacherMode;
  else if (key === 'r' || key === 'R') restartGame();
  else if (key === 'm' || key === 'M') {
    if (clapDetector) {
      if (clapDetector.isListening) clapDetector.stop();
      else clapDetector.start();
    }
  } else if (key === 'e' || key === 'E') {
    if (scoreManager.gameWon) {
      scoreManager.endlessMode = true;
    }
  } else if (key === ' ') {
    // Spacebar triggers Sonic Dash with i-frames
    if (guitar && guitar.performDash(createVector(mouseX, mouseY), shaft, scoreManager)) {
      audioSynth.playDash();
      hud.addPopup('SONIC DASH!', guitar.pos.x, guitar.pos.y - 30, '#00f5d4');
      screenShake = 6;
    }
  } else if (key === 'b' || key === 'B') {
    // Keyboard shortcut to test sonic blast
    fireSonicBlast(1.0, false);
  }
}

function restartGame() {
  openingScene=null;isPaused=false;lastAudioAttack="";pointerCharging=false;touchCharging=false;touchTarget=null;simulationClock.reset();randomSeed(7391);
  scoreManager.reset();
  guitar = new Guitar(shaft.x + shaft.width * 0.5, shaft.y + shaft.height * 0.78);
  director = new Director(7391);
  shockwaves = [];
  alliedNotes = [];
  hitParticles = [];
  screenShake = 0;
  resetSpace();
}

function spawnSparks(x,y,colorStr,count=10) {
  const limit=reduceMotion?40:120;
  for(let i=0;i<Math.min(count,4)&&hitParticles.length<limit;i++)hitParticles.push(new Spark(x,y,colorStr));
}
function updateParticles(dt) {
  for(let i=hitParticles.length-1;i>=0;i--){
    hitParticles[i].updateSpark(dt);
    if(hitParticles[i].isDead)hitParticles.splice(i,1);
  }
}
