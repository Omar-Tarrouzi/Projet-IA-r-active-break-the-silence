// FormationController: Manages a single swarm formation, its anchor, points, and choreographed phases

class FormationController {
  constructor(shapeKey, startX, startY, options = {}) {
    this.rng = options.rng || (() => 0.5);
    this.shapeKey = shapeKey;
    this.shapeDef = SHAPES[shapeKey] || SHAPES.ARROW;
    this.points = [];
    this.phase = 'FORMING'; // 'FORMING', 'TELEGRAPH', 'STRIKE', 'RECOVER', 'EXIT', 'BROKEN'
    this.phaseTimer = 0;
    this.repeats = options.repeats !== undefined ? options.repeats : 1;
    this.isCleared = false;
    this.isDead = false;
    this.isBoss = options.isBoss || false;
    this.bossWord = options.bossWord || '';
    this.weakLetterIdx = options.weakLetterIdx !== undefined ? options.weakLetterIdx : 0;
    this.tookDamage = false;
    this.warningTarget=null;

    // Dual-entity / Pincer support
// Dual-entity support (PINCER and MURMURATION flanking)
    this.isDual = (this.shapeKey === 'PINCER' || !!this.shapeDef.isDual);
    if (this.isDual) {
      const offsetX = this.shapeKey === 'MURMURATION' ? 70 : 60; // wider spread for murmuration
      this.anchorLeft = new FormationAnchor(startX - offsetX, startY);
      this.anchorRight = new FormationAnchor(startX + offsetX, startY);
      this.anchorLeft.currentScale = this.shapeDef.baseScale || 80;
      this.anchorRight.currentScale = this.shapeDef.baseScale || 80;
      this.anchor = this.anchorLeft; // Backwards compatible fallback
    } else {
      this.anchor = new FormationAnchor(startX, startY);
      this.anchor.currentScale = this.shapeDef.baseScale || 70;
    }

    if(this.shapeKey==='SCISSORS')this.anchor.currentAngle=0;
    this.initialPointCount = 0;

    // Check if murmuration
    if (this.shapeKey === 'MURMURATION') {
      this.anchor.isMurmuration = true;
    }

    this._initPoints(options.font);
    if(["HAMMER","SCISSORS"].includes(this.shapeKey))for(const p of this.points){p.maxSpeed=7;p.maxForce=.5;p.rayonZoneDeFreinage=26;p.r=3;}
  }

  _initPoints(font) {
    let rawPoints = [];
    if (this.isBoss && this.bossWord) {
      rawPoints = generateWordPoints(this.bossWord, font, 240);
      this.shapeDef = {
        name: this.bossWord,
        basePoints: rawPoints.length,
        resonance: 'HIGH',
        contactDamage: 14,
        baseScale: 100
      };
      this.anchor.currentScale = 100;
    } else {
      rawPoints = this.shapeDef.generate(this.shapeDef.basePoints);
    }

    this.initialPointCount = rawPoints.length;

    // Dual-Entity Formations (e.g. PINCER / Twin Scythes)
    if (this.isDual) {
      const half = Math.floor(rawPoints.length / 2);
      this.points = rawPoints.map((offset, idx) => {
        const isLeft = (offset.wing === 'LEFT' || idx < half);
        const targetAnchor = isLeft ? this.anchorLeft : this.anchorRight;
        const px = targetAnchor.pos.x + offset.x * targetAnchor.currentScale + (this.rng() - 0.5) * 40;
        const py = targetAnchor.pos.y + offset.y * targetAnchor.currentScale - 70 + (this.rng() - 0.5) * 40;

        const pt = new SwarmPoint(px, py, offset, targetAnchor, this.shapeDef.resonance);
        pt.wing = isLeft ? 'LEFT' : 'RIGHT';
        return pt;
      });
      return;
    }

    this.points = rawPoints.map((offset, idx) => {
      // Spawn slightly dispersed around anchor
      const px = this.anchor.pos.x + offset.x * this.anchor.currentScale + (this.rng() - 0.5) * 60;
      const py = this.anchor.pos.y + offset.y * this.anchor.currentScale - 100 + (this.rng() - 0.5) * 60;

      const pt = new SwarmPoint(px, py, offset, this.anchor, this.shapeDef.resonance);

      // Mark weak letter in boss word
      if (this.isBoss && this.bossWord) {
        const charWidth = 2.0 / this.bossWord.length;
        const letterX = -1.0 + (this.weakLetterIdx + 0.5) * charWidth;
        if (Math.abs(offset.x - letterX) < charWidth * 0.6) {
          pt.isWeakLetter = true;
          pt.resonance = 'HIGH';
        }
      }

      return pt;
    });
  }

  getLivePoints() {
    return this.points.filter(p => !p.isDead && !p.isConverted);
  }

  update(dt, guitar, shaft, smartSwarmsUnlocked = false) {
    if (this.isDead) return;

    this.phaseTimer += dt;
    const liveCount = this.getLivePoints().length;

    // Break condition: < 25% points remain
    if (liveCount > 0 && liveCount < this.initialPointCount * 0.25 && this.phase !== 'BROKEN') {
      this.breakFormation();
      return;
    }

    // All points eliminated
    if (liveCount === 0) {
      this.isCleared = true;
      this.isDead = true;
      if (this.anchor) this.anchor.isDead = true;
      if (this.anchorLeft) this.anchorLeft.isDead = true;
      if (this.anchorRight) this.anchorRight.isDead = true;
      return;
    }

    // Dual-Entity Formations (PINCER / Twin Scythes)
    if (this.isDual) {
      this._updateDual(dt, guitar, shaft, liveCount);
      return;
    }

    if(this.shapeKey==='SCISSORS'){
      const closure=this.phase==='STRIKE'?Math.min(1,this.phaseTimer/0.8):0;
      for(const p of this.points){
        const slot=articulatedSlot(this.shapeKey,p.offset,closure);
        p.homeTarget=homePosition(this.anchor.pos,slot,this.anchor.currentScale,this.anchor.currentAngle);
      }
    }
    // PHASE LOGIC
    switch (this.phase) {
      case 'FORMING':
        // Anchor arrives to a central staging position in the upper shaft
        const stagingPos = createVector(shaft.x + shaft.width * 0.5, shaft.y + shaft.height * 0.28);
        this.anchor.applyForce(this.anchor.arrive(stagingPos, 0));
        this.anchor.update();

        if (this.phaseTimer >= 1.4) {
          this.phase = 'TELEGRAPH';
          this.phaseTimer = 0;this.warningTarget=null;
          if(typeof audioSynth!=='undefined'&&audioSynth)audioSynth.playWarning(this.shapeKey);
        }
        break;

      case 'TELEGRAPH':
        const lockAt=['HAMMER','SCISSORS'].includes(this.shapeKey)?1.2:.55;
        if(!this.warningTarget||this.phaseTimer<lockAt)this.warningTarget={x:guitar.pos.x,y:guitar.pos.y};
        const warning=this.warningTarget;
        // Distinct readable wind-ups
        if (this.shapeKey === 'ARROW') {
          // Pursue player during aim
          const pursueF = this.phaseTimer<lockAt?this.anchor.pursue(guitar):
            this.anchor.arrive(createVector(warning.x,warning.y-110));
          if (pursueF) {
            pursueF.mult(0.65);
            this.anchor.applyForce(pursueF);
          }
          // Face direction of player
          const aimVec = p5.Vector.sub(createVector(warning.x,warning.y), this.anchor.pos);
          this.anchor.currentAngle = aimVec.heading() - Math.PI / 2;
        } else if (this.shapeKey === 'HAMMER' || this.shapeKey === 'SCISSORS') {
          const hover=createVector(warning.x,warning.y-150);
          this.anchor.applyForce(this.anchor.arrive(hover));
          this.anchor.currentAngle=this.shapeKey==='HAMMER'?-1.1:0;
        } else if (this.shapeKey === 'AXE') {
          // Arrive beside guitar and rear back
          const besidePos = createVector(warning.x - 120, warning.y - 100);
          this.anchor.applyForce(this.anchor.arrive(besidePos, 0));
          this.anchor.currentAngle = -Math.PI * 0.6; // Reared back
        } else if (this.shapeKey === 'HAND') {
          // Drift near guitar with open wide fingers
          const hoverPos = createVector(warning.x, warning.y - 90);
          this.anchor.applyForce(this.anchor.arrive(hoverPos, 0));
          this.anchor.currentScale = this.shapeDef.baseScale * (1.1 + Math.sin(this.phaseTimer * 4) * 0.15);
        } else if (this.shapeKey === 'JACKHAMMER') {
          // Track guitar X above player
          const abovePos = createVector(warning.x, shaft.y + shaft.height * 0.35);
          this.anchor.applyForce(this.anchor.arrive(abovePos, 0));
        } else if (this.shapeKey === 'MURMURATION') {
          // The iris dilates before its particles rush the guitar.
          this.anchor.currentScale=this.shapeDef.baseScale*(1+Math.sin(this.phaseTimer*7)*.13);
          const targetPos = createVector(warning.x, warning.y - 120);
          this.anchor.applyForce(this.anchor.arrive(targetPos, 0));
        } else if (this.isBoss) {
          // Boss Word hover and pulse
          const bossHover = createVector(shaft.x + shaft.width * 0.5, shaft.y + shaft.height * 0.25);
          this.anchor.applyForce(this.anchor.arrive(bossHover, 0));
          this.anchor.currentAngle = Math.sin(this.phaseTimer * 2) * 0.05;
        }

        this.anchor.update();

        if (this.phaseTimer >= (["HAMMER","SCISSORS"].includes(this.shapeKey)?2:1)) {
          this.phase = 'STRIKE';
          this.phaseTimer = 0;
          if (this.shapeKey === 'MURMURATION') for(const p of this.getLivePoints()) if(p.state==='HOMED')p.state='FLOCK';
          if (this.shapeKey === 'ARROW') {
            // Lock dash velocity!
            this.anchor.lockStrikeVelocity(createVector(warning.x,warning.y), 8.5);
          }
        }
        break;

      case 'STRIKE':
        if (this.shapeKey !== 'ARROW') {
          this.anchor.applyForce(this.anchor.arrive(createVector(this.anchor.pos.x,this.anchor.pos.y)));
          this.anchor.update();
        }
        if (this.shapeKey === 'ARROW') {
          // Dash straight with locked velocity through steering force
          if (this.anchor.lockedVelocity) {
            const strikeForce = p5.Vector.sub(this.anchor.lockedVelocity, this.anchor.vel);
            strikeForce.limit(this.anchor.maxForce);
            this.anchor.applyForce(strikeForce);
          }
          this.anchor.update();
          if (this.phaseTimer >= 1.2 || this.anchor.pos.y > shaft.y + shaft.height) {
            this.anchor.unlockStrike();
            this.phase = 'RECOVER';
            this.phaseTimer = 0;
          }
        } else if (this.shapeKey === 'HAMMER' || this.shapeKey === 'SCISSORS') {
          const u=Math.min(1,this.phaseTimer/1.1);
          if(this.shapeKey==='HAMMER')this.anchor.currentAngle=-1.1+(u*u*(3-2*u))*3.6;
          if(this.phaseTimer>=1.4){this.phase='RECOVER';this.phaseTimer=0;}
        } else if (this.shapeKey === 'MURMURATION') {
          if(this.phaseTimer>=1.8){for(const p of this.getLivePoints())if(p.state==='FLOCK')p.state='HOMED';this.phase='RECOVER';this.phaseTimer=0;}
        } else if (this.shapeKey === 'AXE') {
          // Wide sweep rotation
          const sweepProgress = Math.min(1.0, this.phaseTimer / 0.8);
          this.anchor.currentAngle = -Math.PI * 0.6 + sweepProgress * Math.PI * 1.3;
          if (this.phaseTimer >= 0.9) {
            this.phase = 'RECOVER';
            this.phaseTimer = 0;
          }
        } else if (this.shapeKey === 'HAND') {
          // Contract fingers toward palm (grab)
          this.anchor.currentScale = Math.max(25, this.shapeDef.baseScale * (1.2 - this.phaseTimer * 1.2));
          if (this.phaseTimer >= 0.8) {
            this.phase = 'RECOVER';
            this.phaseTimer = 0;
          }
        } else if (this.shapeKey === 'JACKHAMMER') {
          // Vertical oscillating pound
          const poundOffset = Math.sin(this.phaseTimer * 16) * 60;
          this.anchor.pivot = { x: 0, y: Math.max(0, poundOffset) / this.anchor.currentScale };
          if (this.phaseTimer >= 1.5) {
            this.anchor.pivot = { x: 0, y: 0 };
            this.phase = 'RECOVER';
            this.phaseTimer = 0;
          }
        } else if (this.isBoss) {
          // Peel off waves
          if (this.phaseTimer >= 2.0) {
            this.phase = 'RECOVER';
            this.phaseTimer = 0;
          }
        }
        break;

      case 'RECOVER':
        // Slow recovery window via braking deceleration force
        const brakeForce = p5.Vector.mult(this.anchor.vel, -0.15).limit(0.25);
        this.anchor.applyForce(brakeForce);
        this.anchor.update();
        if (this.phaseTimer >= 1.1) {
          this.repeats--;
          if (this.repeats > 0) {
            this.phase = 'TELEGRAPH';
            this.phaseTimer = 0;this.warningTarget=null;
          } else {
            this.phase = 'EXIT';
            this.phaseTimer = 0;
          }
        }
        break;

      case 'EXIT':
        // Leaves screen using seek
        const exitPos = createVector(shaft.x + shaft.width * 0.5, shaft.y - 150);
        this.anchor.applyForce(this.anchor.seek(exitPos));
        this.anchor.update();

        if (this.anchor.pos.y < shaft.y - 100 || this.phaseTimer >= 2.5) {
          this.isDead = true;
          this.anchor.isDead = true;
        }
        break;

      case 'BROKEN':
        // Anchor is disabled, survivors are orphans
        this.anchor.isDead = true;
        if (liveCount === 0) {
          this.isDead = true;
        }
        break;
    }
  }

  _updateDual(dt, guitar, shaft, liveCount) {
    const liveLeft = this.points.filter(p => p.wing === 'LEFT' && !p.isDead && !p.isConverted).length;
    const liveRight = this.points.filter(p => p.wing === 'RIGHT' && !p.isDead && !p.isConverted).length;

    switch (this.phase) {
      case 'FORMING': {
        const stagingL = createVector(shaft.x + shaft.width * 0.28, shaft.y + shaft.height * 0.22);
        const stagingR = createVector(shaft.x + shaft.width * 0.72, shaft.y + shaft.height * 0.22);
        this.anchorLeft.applyForce(this.anchorLeft.arrive(stagingL, 0));
        this.anchorRight.applyForce(this.anchorRight.arrive(stagingR, 0));
        this.anchorLeft.update();
        this.anchorRight.update();

        if (this.phaseTimer >= 1.4) {
          this.phase = 'TELEGRAPH';
          this.phaseTimer = 0;this.warningTarget=null;
          if (typeof audioSynth !== 'undefined' && audioSynth && audioSynth.playPincerWarning) {
            audioSynth.playPincerWarning();
          }
          if (typeof hud !== 'undefined' && hud) {
            hud.addPopup('⚠ DUAL PINCER ATTACK! ⚠', shaft.x + shaft.width * 0.5, shaft.y + 140, '#ffb703');
          }
        }
        break;
      }

      case 'TELEGRAPH': {
        // Flank positions on opposite walls tracking player Y
        if(!this.warningTarget||this.phaseTimer<.7)this.warningTarget={x:guitar.pos.x,y:guitar.pos.y};
        const targetY = Math.min(shaft.y + shaft.height * 0.72, Math.max(shaft.y + 140, this.warningTarget.y - 60));
        const flankL = createVector(shaft.x + 65, targetY);
        const flankR = createVector(shaft.x + shaft.width - 65, targetY);

        if (liveLeft > 0) {
          this.anchorLeft.applyForce(this.anchorLeft.arrive(flankL, 0));
          const aimVecL = p5.Vector.sub(createVector(this.warningTarget.x,this.warningTarget.y), this.anchorLeft.pos);
          this.anchorLeft.currentAngle = aimVecL.heading() - Math.PI / 2;
          this.anchorLeft.currentScale = this.shapeDef.baseScale * (1.0 + Math.sin(this.phaseTimer * 16) * 0.12);
          this.anchorLeft.update();
        } else if (liveRight > 0) {
          // Left wing dead: Right anchor goes ENRAGED pursuit
          const pursueF = this.anchorRight.pursue(guitar);
          if (pursueF) this.anchorRight.applyForce(pursueF.mult(0.9));
          this.anchorRight.update();
        }

        if (liveRight > 0) {
          this.anchorRight.applyForce(this.anchorRight.arrive(flankR, 0));
          const aimVecR = p5.Vector.sub(createVector(this.warningTarget.x,this.warningTarget.y), this.anchorRight.pos);
          this.anchorRight.currentAngle = aimVecR.heading() - Math.PI / 2;
          this.anchorRight.currentScale = this.shapeDef.baseScale * (1.0 + Math.sin(this.phaseTimer * 16) * 0.12);
          this.anchorRight.update();
        } else if (liveLeft > 0) {
          // Right wing dead: Left anchor goes ENRAGED pursuit
          const pursueF = this.anchorLeft.pursue(guitar);
          if (pursueF) this.anchorLeft.applyForce(pursueF.mult(0.9));
          this.anchorLeft.update();
        }

        if (this.phaseTimer >= 1.25) {
          this.phase = 'STRIKE';
          this.phaseTimer = 0;
          // Scissor cross-strike velocities: Left dashes across to right, Right dashes across to left!
          const crossTargetL = createVector(shaft.x + shaft.width * 0.82, this.warningTarget.y + 70);
          const crossTargetR = createVector(shaft.x + shaft.width * 0.18, this.warningTarget.y + 70);
          if (liveLeft > 0) this.anchorLeft.lockStrikeVelocity(crossTargetL, 9.8);
          if (liveRight > 0) this.anchorRight.lockStrikeVelocity(crossTargetR, 9.8);
        }
        break;
      }

      case 'STRIKE': {
        if (this.anchorLeft.lockedVelocity) {
          const fL = p5.Vector.sub(this.anchorLeft.lockedVelocity, this.anchorLeft.vel);
          fL.limit(this.anchorLeft.maxForce);
          this.anchorLeft.applyForce(fL);
        }
        this.anchorLeft.update();

        if (this.anchorRight.lockedVelocity) {
          const fR = p5.Vector.sub(this.anchorRight.lockedVelocity, this.anchorRight.vel);
          fR.limit(this.anchorRight.maxForce);
          this.anchorRight.applyForce(fR);
        }
        this.anchorRight.update();

        const pastBottom = this.anchorLeft.pos.y > shaft.y + shaft.height && this.anchorRight.pos.y > shaft.y + shaft.height;
        if (this.phaseTimer >= 1.15 || pastBottom) {
          this.anchorLeft.unlockStrike();
          this.anchorRight.unlockStrike();
          this.phase = 'RECOVER';
          this.phaseTimer = 0;
        }
        break;
      }

      case 'RECOVER': {
        const brakeL = p5.Vector.mult(this.anchorLeft.vel, -0.15).limit(0.25);
        this.anchorLeft.applyForce(brakeL);
        this.anchorLeft.update();

        const brakeR = p5.Vector.mult(this.anchorRight.vel, -0.15).limit(0.25);
        this.anchorRight.applyForce(brakeR);
        this.anchorRight.update();

        if (this.phaseTimer >= 1.2) {
          this.repeats--;
          if (this.repeats > 0) {
            this.phase = 'TELEGRAPH';
            this.phaseTimer = 0;this.warningTarget=null;
          } else {
            this.phase = 'EXIT';
            this.phaseTimer = 0;
          }
        }
        break;
      }

      case 'EXIT': {
        const exitL = createVector(shaft.x + shaft.width * 0.3, shaft.y - 140);
        const exitR = createVector(shaft.x + shaft.width * 0.7, shaft.y - 140);
        this.anchorLeft.applyForce(this.anchorLeft.seek(exitL));
        this.anchorRight.applyForce(this.anchorRight.seek(exitR));
        this.anchorLeft.update();
        this.anchorRight.update();

        if ((this.anchorLeft.pos.y < shaft.y - 100 && this.anchorRight.pos.y < shaft.y - 100) || this.phaseTimer >= 2.5) {
          this.isDead = true;
          this.anchorLeft.isDead = true;
          this.anchorRight.isDead = true;
        }
        break;
      }

      case 'BROKEN': {
        this.anchorLeft.isDead = true;
        this.anchorRight.isDead = true;
        if (liveCount === 0) {
          this.isDead = true;
        }
        break;
      }
    }
  }

  breakFormation() {
    this.phase = 'BROKEN';
    if (this.anchor) this.anchor.isDead = true;
    if (this.anchorLeft) this.anchorLeft.isDead = true;
    if (this.anchorRight) this.anchorRight.isDead = true;
    this.points.forEach(p => {
      if (!p.isDead && p.state === 'HOMED') {
        p.state = 'FLOCK';
        p.orphanTimer = 6.0;
        // Give a little dispersion impulse
        const angle = this.rng() * Math.PI * 2;
        const desired = createVector(Math.cos(angle)*p.maxSpeed,Math.sin(angle)*p.maxSpeed);
        const f = velocityForce(p.vel,desired,p.maxForce);
        const scatterImpulse = createVector(f.x,f.y);
        p.applyForce(scatterImpulse);
      }
    });
  }

  show() {
    if(this.phase==='TELEGRAPH'&&this.warningTarget&&['ARROW','HAMMER','SCISSORS','AXE','JACKHAMMER','HAND','MURMURATION'].includes(this.shapeKey)){
      const c=drawingContext,t=this.phaseTimer,w=this.warningTarget;
      c.save();c.globalAlpha=.28+.28*Math.sin(t*12)**2;c.strokeStyle='#ffd4a5';c.lineWidth=2;c.setLineDash([8,7]);
      c.beginPath();c.arc(w.x,w.y,38+Math.sin(t*9)*6,0,Math.PI*2);c.stroke();
      c.beginPath();c.moveTo(this.anchor.pos.x,this.anchor.pos.y);c.lineTo(w.x,w.y);c.stroke();
      c.setLineDash([]);c.fillStyle='#fff0d4';c.font='bold 12px monospace';c.textAlign='center';
      c.fillText(this.shapeKey+' / WIND-UP',w.x,w.y-53);c.restore();
    }
    if (this.isDual) {
      this.anchorLeft.show();
      this.anchorRight.show();

      // Draw aggressive tension arc and cross-lines in telegraph
      if (this.phase === 'TELEGRAPH') {
        push();
        stroke(255, 183, 3, 140 + Math.sin(this.phaseTimer * 20) * 80);
        strokeWeight(2);
        drawingContext.setLineDash([6, 10]);
        line(this.anchorLeft.pos.x, this.anchorLeft.pos.y, this.anchorRight.pos.x, this.anchorRight.pos.y);
        drawingContext.setLineDash([]);
        pop();
      }
    } else {
      this.anchor.show();
    }

    // Boss Word: lightweight text label behind the particle cloud (single draw call)
    if (this.isBoss && this.bossWord && this.phase !== 'BROKEN' && this.phase !== 'EXIT') {
      const bossAnchor = this.isDual ? this.anchorLeft : this.anchor;
      if (bossAnchor && !bossAnchor.isDead) {
        push();
        textAlign(CENTER, CENTER);
        textSize(bossAnchor.currentScale * 0.65);
        if (typeof font !== 'undefined' && font) textFont(font);
        noStroke();
        fill(255, 60, 100, 35);
        text(this.bossWord, bossAnchor.pos.x, bossAnchor.pos.y);
        pop();
      }
    }

    // Energy seams join actual settled agents, so silhouettes dissolve with the swarm.
    if(['HAMMER','AXE','SCISSORS','HAND'].includes(this.shapeKey)){
      const c=drawingContext;c.save();c.strokeStyle=TUNINGS[this.shapeDef.resonance].color;
      c.globalAlpha=.3;c.lineWidth=1.5;
      const stride=this.shapeKey==='SCISSORS'?2:1;
      for(let group=0;group<stride;group++){
        c.beginPath();let previous=null;
        for(let i=group;i<this.points.length;i+=stride){
          const p=this.points[i];
          if(p.isDead||p.state!=='HOMED'){previous=null;continue;}
          if(previous&&Math.hypot(previous.pos.x-p.pos.x,previous.pos.y-p.pos.y)<30)c.lineTo(p.pos.x,p.pos.y);
          else c.moveTo(p.pos.x,p.pos.y);
          previous=p;
        }c.stroke();
      }c.restore();
    }
    // Draw all individual swarm points (shape emerges from positions, textToPoints style)
    this.points.forEach(p => p.show());
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FormationController };
}
