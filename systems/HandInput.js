class HandInput {
  constructor() {
    this.ready=false;this.loading=false;this.error='';
    this.target=null;this.pinch=false;this.released=false;
    this.lastFrame=-1;this.lastScan=0;this.lostAt=0;
    this.video=null;this.stream=null;this.landmarker=null;
    this.requestId=0;
  }
  async start(){
    if(this.ready||this.loading)return;
    this.loading=true;this.error='';
    const requestId=++this.requestId;
    try {
      if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera unavailable in this browser');
      // Pin an actually published browser package; 0.10.22 returns 404.
      const source='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
      const {FilesetResolver,HandLandmarker}=await import(source+'/vision_bundle.mjs');
      const files=await FilesetResolver.forVisionTasks(source+'/wasm');
      this.landmarker=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:1,minTrackingConfidence:.55});
      if(requestId!==this.requestId){this.landmarker.close();this.landmarker=null;return;}
      this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
      if(requestId!==this.requestId){this.stream.getTracks().forEach(track=>track.stop());this.stream=null;return;}
      this.video=document.createElement('video');
      Object.assign(this.video,{autoplay:true,muted:true,playsInline:true});
      this.video.srcObject=this.stream;
      await this.video.play();
      if(requestId!==this.requestId)return;
      this.ready=true;
    }catch(error){
      this.error=error?.name==='NotAllowedError'?'Camera permission denied':(error?.message||'Hand tracking unavailable');
      this.stop();
      this.error=this.error||'Hand tracking unavailable';
    }finally{this.loading=false;}
  }
  tick(now){
    if(!this.ready||!this.video||this.video.readyState<2||now-this.lastScan<50)return;
    if(this.video.currentTime===this.lastFrame)return;
    this.lastFrame=this.video.currentTime;this.lastScan=now;
    try{
      const result=this.landmarker.detectForVideo(this.video,now);
      const points=result.landmarks?.[0];
      if(!points){
        if(!this.lostAt)this.lostAt=now;
        if(now-this.lostAt>350){this.target=null;this.pinch=false;this.released=false;}
        return;
      }
      this.lostAt=0;
      const palm=points[9],thumb=points[4],finger=points[8],wrist=points[0];
      const x=Math.max(35,Math.min(765,(1-palm.x)*800));
      const y=Math.max(35,Math.min(865,palm.y*900));
      this.target=this.target?{x:this.target.x+(x-this.target.x)*.38,y:this.target.y+(y-this.target.y)*.38}:{x,y};
      const scale=Math.max(.04,Math.hypot(palm.x-wrist.x,palm.y-wrist.y));
      const gap=Math.hypot(thumb.x-finger.x,thumb.y-finger.y)/scale;
      if(!this.pinch&&gap<.45)this.pinch=true;
      else if(this.pinch&&gap>.68){this.pinch=false;this.released=true;}
    }catch(error){this.error=error.message||'Hand tracking interrupted';this.stop();}
  }
  takeRelease(){const result=this.released;this.released=false;return result;}
  stop(){
    this.requestId++;
    this.ready=false;this.pinch=false;this.released=false;this.target=null;
    this.landmarker?.close?.();this.landmarker=null;
    this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
    if(this.video){this.video.srcObject=null;this.video=null;}
  }
}
if(typeof module!=='undefined')module.exports={HandInput};

