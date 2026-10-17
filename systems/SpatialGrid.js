// Bounded playfield grid; supports coordinates in [-7680,7680) at the default cell size.
class SpatialGrid {
  constructor(cellSize=60,capacity=1024){
    this.cellSize=cellSize;this.side=256;this.offset=128;
    this.head=new Int32Array(this.side*this.side);this.next=new Int32Array(capacity);
    this.entities=new Array(capacity);this.count=0;this.clear();
  }
  clear(){for(let i=0;i<this.count;i++)this.entities[i]=undefined;this.count=0;this.head.fill(-1);}
  insert(entity){
    const cx=Math.floor(entity.pos.x/this.cellSize)+this.offset;
    const cy=Math.floor(entity.pos.y/this.cellSize)+this.offset;
    if(cx<0||cy<0||cx>=this.side||cy>=this.side)throw new RangeError('Entity outside spatial grid');
    if(this.count>=this.next.length)throw new RangeError('Spatial grid capacity exceeded');
    const key=cy*this.side+cx,i=this.count++;
    this.entities[i]=entity;this.next[i]=this.head[key];this.head[key]=i;
  }
  queryNeighbors(entity,radius,out=[]){
    out.length=0;
    const x=entity.pos.x,y=entity.pos.y,r2=radius*radius;
    const minX=Math.max(0,Math.floor((x-radius)/this.cellSize)+this.offset);
    const maxX=Math.min(this.side-1,Math.floor((x+radius)/this.cellSize)+this.offset);
    const minY=Math.max(0,Math.floor((y-radius)/this.cellSize)+this.offset);
    const maxY=Math.min(this.side-1,Math.floor((y+radius)/this.cellSize)+this.offset);
    for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
      for(let i=this.head[cy*this.side+cx];i!==-1;i=this.next[i]){
        const other=this.entities[i],dx=x-other.pos.x,dy=y-other.pos.y;
        if(other!==entity&&dx*dx+dy*dy<=r2)out.push(other);
      }
    }
    return out;
  }
}
if(typeof module!=='undefined')module.exports={SpatialGrid};
