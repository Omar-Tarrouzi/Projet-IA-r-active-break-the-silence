// Original SVG art, rasterized once. A rendering utility, not a world entity.
const GUITAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="176" viewBox="0 0 112 176"><defs><linearGradient id="body" x2="1" y2="1"><stop stop-color="#ffbd70"/><stop offset=".5" stop-color="#ed775b"/><stop offset="1" stop-color="#8f426d"/></linearGradient></defs><path d="M49 10 L47 3 L60 1 L67 23 L59 29 L60 93 L89 76 L82 112 L104 163 L68 144 L55 165 L39 142 L10 159 L29 111 L24 81 L47 97 Z" fill="#111c2d" stroke="#f6d6a1" stroke-width="2"/><path d="M45 97 L30 91 L36 116 L22 148 L43 133 L55 151 L67 132 L90 149 L74 112 L81 88 L60 103 L60 117 L46 117 Z" fill="url(#body)"/><path d="M50 24 L58 24 L58 122 L50 122 Z" fill="#e7c796"/><path d="M48 5 L59 4 L63 22 L51 25 Z" fill="#e7c796"/><path d="M43 7 L48 7 M44 14 L49 14 M60 10 L66 10 M62 18 L69 18" stroke="#75ffe1" stroke-width="3"/><path d="M49 35 L59 35 M49 46 L59 46 M49 58 L59 58 M49 70 L59 70 M49 82 L59 82 M49 94 L59 94" stroke="#856c5d" stroke-width="1"/><path d="M45 108 L64 108 L64 115 L45 115 Z M45 126 L64 126 L64 131 L45 131 Z" fill="#182235" stroke="#efd7ad"/><path d="M52 24 L52 128 M54 24 L54 128 M56 24 L56 128" stroke="#fff3d6" stroke-width=".7"/><path d="M55 137 L60 143 L55 148 L50 143 Z" fill="#7bffe0"/><circle cx="74" cy="129" r="3" fill="#f7d99f"/></svg>';
class SpriteAtlas {
  constructor() {
    this.images=new Map();
    this.load('guitar',GUITAR_SVG);
    const svg=body=>'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">'+body+'</svg>';
    this.load('note',svg('<path d="M18 35V10l20-5v25M18 17l20-5" fill="none" stroke="#f5d8a2" stroke-width="4"/><ellipse cx="12" cy="36" rx="8" ry="5" transform="rotate(-20 12 36)" fill="#f5d8a2"/><ellipse cx="32" cy="31" rx="8" ry="5" transform="rotate(-20 32 31)" fill="#f5d8a2"/>'));
    this.load('pickup',svg('<path d="M24 2L44 14v21L24 46 4 35V14z" fill="#122c32" stroke="#7effdc" stroke-width="2"/><path d="M26 9L13 27h10l-2 12 15-19H25z" fill="#7effdc"/>'));
    this.load('rest',svg('<path d="M24 2L44 14v21L24 46 4 35V14z" fill="#302237" stroke="#ffb9cd" stroke-width="2"/><path d="M20 12h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#ffb9cd"/>'));
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
    const c=canvas.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'#8fffe599');g.addColorStop(.3,'#8fffe530');g.addColorStop(1,'#8fffe500');c.fillStyle=g;c.fillRect(0,0,64,64);this.images.set('glow',canvas);
  }
  load(name,svg){
    const image=new window.Image();
    image.onload=()=>{const c=document.createElement('canvas');c.width=image.width*2;c.height=image.height*2;c.getContext('2d').drawImage(image,0,0,c.width,c.height);this.images.set(name,c);};
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  draw(name,x,y,w,h){
    const img=this.images.get(name);if(img)drawingContext.drawImage(img,x-w/2,y-h/2,w,h);
  }
}
let spriteAtlas;
