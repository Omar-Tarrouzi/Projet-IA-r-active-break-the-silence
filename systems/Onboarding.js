class Onboarding {
  constructor() {
    this.mode=null;
    this.active=false;
    this.seen=false;
    this.step=0;
    this.picker=document.getElementById('control-picker');
    this.play=document.getElementById('play');
    this.tutorial=document.getElementById('tutorial');
    this.spotlight=document.getElementById('tutorial-spotlight');
    this.card=this.tutorial.querySelector('.tutorial-card');
    this.note=document.getElementById('control-note');
    document.querySelectorAll('[data-control]').forEach(button=>{
      button.addEventListener('click',()=>this.select(button.dataset.control));
    });
    document.getElementById('tutorial-next').addEventListener('click',()=>this.next());
    document.getElementById('tutorial-skip').addEventListener('click',()=>this.close());
    window.addEventListener('resize',()=>{if(this.active)this.render();});
  }
  select(mode) {
    const previous=this.mode;
    this.mode=mode;
    document.querySelectorAll('[data-control]').forEach(button=>{
      const selected=button.dataset.control===mode;
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    const notes={
      pointer:'Mouse or touch moves the guitar. Hold, then release to fire.',
      voice:'Microphone starting… allow access, then clap for a cone or hold a note for a beam.',
      hand:'Camera starting… allow access, then steer with your palm and pinch to fire.'
    };
    this.note.textContent=notes[mode];
    this.play.disabled=false;
    this.play.textContent='BEGIN ASCENT ↗';
    if(previous!==mode||mode==='voice'||mode==='hand')this.onModeChange?.(mode);
  }
  setStatus(message){this.note.textContent=message;}
  steps() {
    const mobile=window.innerWidth<=760;
    const tuning=mobile?'#mobile-bar':'.tunings';
    const modes={
      pointer:[
        ['MOVE THE GUITAR','Move your mouse or drag on touch. The guitar steers toward your pointer.', '@guitar'],
        ['CHARGE, THEN RELEASE','Hold the left mouse button or press the arena; release to send a sonic blast.', '#canvas-container'],
        ['MATCH THE COLOUR','Choose LOW, MID or HIGH with 1 / 2 / 3, then match the enemy colour. Space or DASH gives you an escape burst.',tuning]
      ],
      voice:[
        ['MOVE & LISTEN','Aim with mouse or touch. The microphone fires your attacks; allow access when asked. The meter responds to your voice.', '@guitar'],
        ['CLAP TO STRIKE','Make one short clap or sharp sound, then stop. On release it fires an amber MID cone that cleaves nearby shapes.',mobile?'#mobile-mic':'.mic-meter'],
        ['HOLD A NOTE','Sing or hold a steady sound for half a second, then go quiet. That charges and releases a magenta HIGH beam. The sensitivity slider helps with softer voices.',tuning],
        ['LOW & BACKUP','Choose LOW with 1 for a circular blast; hold and release mouse or touch to fire it. Use 2 / 3 for manual MID / HIGH and SPACE to dash.',tuning]
      ],
      hand:[
        ['SHOW YOUR HAND','Hold one hand inside the camera frame. Its position becomes the guitar target. Mouse remains available as backup.', '@guitar'],
        ['PINCH TO CHARGE','Bring thumb and index finger together; separate them to release a sonic blast.', '#canvas-container'],
        ['CHANGE RESONANCE','Use 1 / 2 / 3 or these buttons to match an enemy colour. Space or DASH still performs a dash.',tuning]
      ]
    };
    return modes[this.mode||'pointer'];
  }
  show(force=false){
    if(this.active||(!force&&this.seen))return;
    this.active=true;this.step=0;this.tutorial.hidden=false;
    this.render();
    requestAnimationFrame(()=>{if(this.active)this.render();});
    document.getElementById('tutorial-next').focus();
  }
  render(){
    const steps=this.steps(),[title,copy,selector]=steps[this.step];
    document.getElementById('tutorial-step').textContent=String(this.step+1).padStart(2,'0')+' / '+String(steps.length).padStart(2,'0');
    document.getElementById('tutorial-title').textContent=title;
    document.getElementById('tutorial-copy').textContent=this.mode==='hand'&&typeof handInput!=='undefined'&&handInput?.error&&this.step===0?'Camera unavailable. You can keep playing with mouse or touch; reload to retry camera access.':copy;
    document.getElementById('tutorial-next').textContent=this.step===steps.length-1?'LET’S PLAY ↗':'NEXT ↗';
    const target=document.querySelector(selector==='@guitar'?'#canvas-container canvas':selector);
    let box=target?.getBoundingClientRect();
    if(selector==='@guitar'&&box&&typeof guitar!=='undefined'&&guitar){
      const side=Math.min(130,box.width*.24);
      box={left:box.left+guitar.pos.x/800*box.width-side/2,top:box.top+guitar.pos.y/900*box.height-side/2,width:side,height:side};
    }
    if(box&&box.width&&box.height){
      const pad=10;
      Object.assign(this.spotlight.style,{left:Math.max(0,box.left-pad)+'px',top:Math.max(0,box.top-pad)+'px',width:Math.min(innerWidth-box.left+pad,box.width+pad*2)+'px',height:Math.min(innerHeight-box.top+pad,box.height+pad*2)+'px'});
    }else Object.assign(this.spotlight.style,{left:'20%',top:'20%',width:'60%',height:'55%'});
  }
  next(){if(this.step<this.steps().length-1){this.step++;this.render();}else this.close();}
  close(){if(!this.active)return;this.active=false;this.seen=true;this.tutorial.hidden=true;document.getElementById('canvas-container').focus?.();}
}
if(typeof module!=='undefined')module.exports={Onboarding};

