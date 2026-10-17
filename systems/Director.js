// Director: Paces gameplay, altitude bands, wave spawns, boss encounters, and pickups

class Director {
  constructor(seed = 12345) {
    this.seed = seed;
    this.waveTimer = 1.25; // Quick first encounter after controls appear
    this.previousShape = null;
    this.shapeDeck = [];
    this.deckBand=null;
    this.waveIndex=0;
    this.currentBand = BANDS[0];
    this.formations = [];
    this.pickups = [];
    this.bossDefeated = {
      HUSH: false,
      MUTE: false,
      ECHO: false,
      MEASURE: false
    };
    this.bossActive = false;
    this.restTimer = 0;
  }

  // Linear Congruential Generator for deterministic seeded runs
  random() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  update(dt, scoreManager, shaft, font) {
    this.currentBand = getBandForAltitude(scoreManager.altitude);

    // Filter out dead formations
    this.formations = this.formations.filter(f => !f.isDead);
    this.pickups = this.pickups.filter(p => !p.isDead);

    // Rest window timer between waves
    if (this.restTimer > 0) {
      this.restTimer -= dt;
      return;
    }

    // Pending milestones cannot be skipped by climbing into the next band.
    const alt = scoreManager.altitude;
    const pending = BANDS.find(b => b.bossWord && alt >= b.bossAlt && !this.bossDefeated[b.bossWord]);
    if(pending && !this.bossActive) {
      if(this.formations.length===0) this.spawnBoss(pending.bossWord,shaft,font);
      return;
    }
    // Check regular wave spawns
    this.waveTimer -= dt;
    if (this.waveTimer <= 0 && this.formations.length < this.currentBand.maxFormations && !this.bossActive) {
      this.spawnWave(shaft, font);
      this.waveTimer = 2.3 + this.random() * 1.3;
    }
  }

  spawnWave(shaft, font) {
    const shapePool = this.currentBand.shapes;
    if(this.deckBand!==this.currentBand.name){this.shapeDeck=[];this.deckBand=this.currentBand.name;}
    // A seeded shuffle bag shows the full active vocabulary before repeats.
    if(!this.shapeDeck.length){this.shapeDeck=shapePool.slice();
      for(let i=this.shapeDeck.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));
        [this.shapeDeck[i],this.shapeDeck[j]]=[this.shapeDeck[j],this.shapeDeck[i]];}
    }
    if(this.shapeDeck[0]===this.previousShape&&this.shapeDeck.length>1){
      const next=this.shapeDeck.findIndex(key=>key!==this.previousShape);
      [this.shapeDeck[0],this.shapeDeck[next]]=[this.shapeDeck[next],this.shapeDeck[0]];
    }
    const shapeKey=this.waveIndex<2?['ARROW','HAMMER'][this.waveIndex]:this.shapeDeck.shift();
    if(this.waveIndex<2)this.shapeDeck=this.shapeDeck.filter(key=>key!==shapeKey);
    this.waveIndex++;
    this.previousShape=shapeKey;

    // Spawn above the shaft viewport
    const spawnX = shaft.x + shaft.width * (0.25 + this.random() * 0.5);
    const spawnY = shaft.y - 60;

    const controller = new FormationController(shapeKey, spawnX, spawnY, {
      repeats: Math.floor(1 + this.random() * 2),
      font: font, rng: () => this.random()
    });

    const existing = this.formations.reduce((n,f)=>n+f.getLivePoints().length,0);
    controller.points = controller.points.slice(0,Math.max(0,500-existing));
    controller.initialPointCount=controller.points.length;
    if(controller.points.length) this.formations.push(controller);

    // 35% chance to drop a pickup when a wave starts
    if (this.random() < 0.35 && this.pickups.length < 3) {
      this.spawnPickup(shaft);
    }
  }

  spawnBoss(bossWord, shaft, font) {
    this.bossActive = true;
    const spawnX = shaft.x + shaft.width * 0.5;
    const spawnY = shaft.y - 120;

    const bossController = bossWord==='HUSH'?new BossController(spawnX,spawnY,{bossWord}):new RulerBossController(spawnX,spawnY,{bossWord});
    this.formations.push(bossController);
  }

  onFormationCleared(controller, scoreManager, shaft) {
    if (controller.isBoss) {
      this.bossActive = false;
      this.bossDefeated[controller.bossWord] = true;
      scoreManager.healTune(30);
      scoreManager.addHarmonizeCharge();
    }

    // Formation clear bonus
    scoreManager.onFormationCleared(controller.tookDamage,controller.isBoss);

    // Guaranteed Harmonize pickup on formation clear
    if(scoreManager.harmonizeCharges<scoreManager.maxHarmonize)this.spawnPickup(shaft, 'HARMONIZE');
    else if(scoreManager.tune<90)this.spawnPickup(shaft,'TUNE');
    else if(scoreManager.volume<75)this.spawnPickup(shaft,'VOLUME');

    // Trigger rest window so player catches breath
    this.restTimer = this.currentBand.restWindow;
    return scoreManager.lastClear;
  }

  spawnPickup(shaft, type = null) {
    const pType = type || (this.random() < 0.75 ? 'HARMONIZE' : 'REST');
    const px = shaft.x + shaft.width * (0.2 + this.random() * 0.6);
    const py = shaft.y - 20;

    const pickup = new Pickup(px, py, pType);
    this.pickups.push(pickup);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Director };
}
