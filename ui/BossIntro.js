// Screen presentation only. The boss still moves solely through Vehicle steering.
const BOSS_INTROS=Object.freeze({
 SONATA:{sigil:'𝄞',kicker:'4400 M · FOUR VOICES. ONE CURSE.',color:'#f3d49c'},
 HUSH:{sigil:'♛',kicker:'1000 M · THE SILENCE TAKES ITS THRONE',color:'#c895ff'},
 MUTE:{sigil:'⛓',kicker:'2000 M · DISCORD BINDS THE SKY',color:'#ff718f'},
 ECHO:{sigil:'◇',kicker:'3000 M · THE ECHO ANSWERS BACK',color:'#74d9ff'},
 MEASURE:{sigil:'✧',kicker:'4000 M · THE LAST BEAT IS HERS',color:'#e9cf8b'}
});
function bossIntroCamera(boss,reduceMotion=false){
 if(!boss||boss.phase!=='ENTRANCE'||reduceMotion)return {scale:1,x:400,y:350};
 const t=boss.phaseTimer,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 const zoom=ease((t-1.62)/.48)*(1-ease((t-2.36)/.49));
 return {scale:1+zoom*.34,x:boss.anchor.pos.x,y:boss.anchor.pos.y};
}
function bossIntroReveal(t){
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 return {energy:1-ease((t-1.05)/.72),sprite:ease((t-1.05)/.68),card:ease((t-1.62)/.3)};
}
// The opening's steered energy condenses into the ruler's existing sprite.
// Striped clipping adds in-between reveal frames without moving the Vehicle.
function drawBossArrival(boss,c){
 if(boss.phase!=='ENTRANCE'){boss.anchor.show();return;}
 const reveal=bossIntroReveal(boss.phaseTimer);
 const calm=typeof reduceMotion!=='undefined'&&reduceMotion;
 if(boss.arrival&&reveal.energy>0){c.save();const x=boss.arrival.pos.x,y=boss.arrival.pos.y;
   c.translate(x,y);c.scale(1.38,1.38);c.translate(-x,-y);
   boss.arrival.showSilhouette(reveal.energy);c.restore();
   if(!calm){const q=boss.anchor.pos,col=(BOSS_INTROS[boss.bossWord]||BOSS_INTROS.HUSH).color;
     c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
     for(let strand=0;strand<4;strand++){
       const a=boss.phaseTimer*9+strand*1.57,reach=42+strand*11;
       const sx=q.x+Math.cos(a)*reach,sy=q.y+Math.sin(a)*reach;
       const midX=(sx+x)/2+Math.sin(a*2)*20,midY=(sy+y)/2+Math.cos(a*2)*18;
       c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(midX,midY,x,y);
       c.strokeStyle=strand%2?col:'#f7f2ff';c.lineWidth=strand%2?4:2;
       c.globalAlpha=reveal.energy*(strand%2?.35:.55);c.stroke();
     }
     c.strokeStyle=col;c.lineWidth=2;c.globalAlpha=reveal.energy*.75;
     c.beginPath();c.ellipse(q.x,q.y,45+Math.sin(boss.phaseTimer*13)*7,71,0,0,Math.PI*1.8);c.stroke();
     c.restore();}
 }
 if(reveal.sprite<=0)return;
 c.save();c.globalAlpha=reveal.sprite;
 if(!calm&&reveal.sprite<.97){
   const x=boss.anchor.pos.x,y=boss.anchor.pos.y;
   c.beginPath();for(let band=0;band<12;band++){
     const width=Math.max(0,Math.min(1,reveal.sprite*1.3-band*.025));
     c.rect(x-135,y-116+band*20,270*width,17);
   }c.clip();
 }
 boss.anchor.show();c.restore();
}
if(typeof module!=='undefined')module.exports={BOSS_INTROS,bossIntroCamera,bossIntroReveal,drawBossArrival};
