class FixedStep {
  constructor(){this.accumulator=0;this.step=1/60;}
  advance(elapsed,update){
    this.accumulator+=Math.max(0,Math.min(elapsed,this.step*3));
    let count=0;
    while(this.accumulator+1e-10>=this.step && count<3){update(this.step);this.accumulator-=this.step;count++;}
    return count;
  }
  reset(){this.accumulator=0;}
}
if(typeof module!=='undefined')module.exports={FixedStep};
