// Score, resources (Tune, Volume, Dissonance), and economy manager

class ScoreManager {
  constructor() {
    this.tune = 100;
    this.maxTune = 100;
    this.volume = 100;
    this.maxVolume = 100;
    this.dissonance = 1.0;
    this.score = 0;
    this.altitude = 0;
    this.harmonizeCharges = 1; // Start with 1 Harmonize charge
    this.maxHarmonize = 2;
    this.invulnerableTimer = 0; // i-frame duration in seconds
    this.lastClimbMeter = 0;
    this.combo = 0;
    this.cleanStreak=0;this.lastClear=null;
    this.comboTimer = 0;
    this.pickupChain=0;this.pickupChainTimer=0;
    this.maxComboTimer = 2.4;
    this.gameOver = false;
    this.gameWon = false;
    this.endlessMode = false;
  }

  reset() {
    this.tune = 100;
    this.volume = 100;
    this.dissonance = 1.0;
    this.score = 0;
    this.altitude = 0;
    this.harmonizeCharges = 1;
    this.invulnerableTimer = 0;
    this.lastClimbMeter = 0;
    this.combo = 0;
    this.cleanStreak=0;this.lastClear=null;
    this.comboTimer = 0;
    this.pickupChain=0;this.pickupChainTimer=0;
    this.gameOver = false;
    this.gameWon = false;
    this.endlessMode = false;
  }

  getTier() {
    return 1 + Math.floor(this.altitude / 500);
  }

  update(dt, climbSpeed, nearestEnemyDist) {
    if (this.gameOver) return;

    // Altitude progression
    this.altitude += climbSpeed * dt;
    const currentMeter = Math.floor(this.altitude);
    if (currentMeter > this.lastClimbMeter) {
      const deltaMeters = currentMeter - this.lastClimbMeter;
      this.score += deltaMeters * 1 * this.getTier();
      this.lastClimbMeter = currentMeter;
    }

    // Win condition check
    if (this.altitude >= 4000 && !this.gameWon && !this.endlessMode) {
      this.gameWon = true;
    }

    // Volume regeneration (10/sec)
    this.volume = Math.min(this.maxVolume, this.volume + 10 * dt);

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    if(this.pickupChainTimer>0){this.pickupChainTimer=Math.max(0,this.pickupChainTimer-dt);if(!this.pickupChainTimer)this.pickupChain=0;}

    // Dissonance multiplier: rises if enemy is near (<200px), decays otherwise
    if (nearestEnemyDist !== null && nearestEnemyDist < 200) {
      this.dissonance = Math.min(3.0, this.dissonance + 0.25 * dt);
    } else {
      this.dissonance = Math.max(1.0, this.dissonance - 0.5 * dt);
    }

    // Invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
  }

  canFireBlast(chargeRatio = 0) {
    const cost = 20 + 30 * chargeRatio;
    return this.volume >= cost;
  }

  consumeBlastVolume(chargeRatio = 0) {
    const cost = 20 + 30 * chargeRatio;
    this.volume = Math.max(0, this.volume - cost);
    return cost;
  }

  refundVolume(amount) {
    this.volume = Math.min(this.maxVolume, this.volume + amount);
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0 || this.gameOver) return false;

    this.tune = Math.max(0, this.tune - amount);
    this.dissonance = 1.0; // Reset risk multiplier on hit
    this.combo = 0; // Break rhythm combo on damage
    this.comboTimer = 0;
    this.invulnerableTimer = 0.3; // 0.3s i-frames

    if (this.tune <= 0) {
      this.gameOver = true;
    }
    return true;
  }

  healTune(amount) {
    this.tune = Math.min(this.maxTune, this.tune + amount);
  }

  getComboRank() {
    if (this.combo >= 25) return { title: 'VIRTUOSO!', color: '#f72585', mult: 3.0 };
    if (this.combo >= 15) return { title: 'OVERDRIVE!', color: '#ffd166', mult: 2.5 };
    if (this.combo >= 8) return { title: 'GROOVE!', color: '#00f5d4', mult: 2.0 };
    if (this.combo >= 4) return { title: 'RHYTHM!', color: '#06d6a0', mult: 1.5 };
    return null;
  }

  onPointDestroyed() {
    this.combo++;
    this.comboTimer = this.maxComboTimer;
    const tier = this.getTier();
    const comboMult = this.combo >= 25 ? 3.0 : (this.combo >= 15 ? 2.5 : (this.combo >= 8 ? 2.0 : (this.combo >= 4 ? 1.5 : 1.0)));
    const pts = Math.round(10 * tier * this.dissonance * comboMult);
    this.score += pts;
    this.refundVolume(0.25 * comboMult);
    return pts;
  }

  onFormationCleared(tookHit = false,isBoss=false) {
    const tier = this.getTier();
    const bonus = Math.round(500 * tier * (tookHit ? 1.0 : 1.5));
    this.score += bonus;
    this.healTune(10);
    if(!isBoss)this.cleanStreak=tookHit?0:this.cleanStreak+1;
    const flourish=!isBoss&&!tookHit&&this.cleanStreak%3===0;
    if(flourish){this.score+=250*tier;this.refundVolume(25);}
    this.lastClear={bonus:bonus+(flourish?250*tier:0),clean:!tookHit,streak:this.cleanStreak,flourish,isBoss};
    return bonus;
  }

  onPickupCollected(){
    this.pickupChain=Math.min(5,this.pickupChain+1);
    this.pickupChainTimer=7;
    const bonus=60*this.getTier()*this.pickupChain;
    this.score+=bonus;
    this.refundVolume(4+this.pickupChain);
    return {chain:this.pickupChain,bonus};
  }

  addHarmonizeCharge() {
    this.harmonizeCharges = Math.min(this.maxHarmonize, this.harmonizeCharges + 1);
  }

  consumeHarmonizeCharge() {
    if (this.harmonizeCharges > 0) {
      this.harmonizeCharges--;
      return true;
    }
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScoreManager };
}
