/*
 * CyTube External JS entry point for HiveStream.
 * Set window.HIVESTREAM_BACKEND_URL before loading this file.
 */
(async function(){
  const backend=window.HIVESTREAM_BACKEND_URL;
  if(!backend){console.error("[HiveStream] Set window.HIVESTREAM_BACKEND_URL");return;}
  const {installCyTubeHiveStream}=await import("https://duckwerks.github.io/HiveStream/src/cytube-hivestream.js");

  function waitFor(predicate,timeout=30000){
    return new Promise((resolve,reject)=>{
      const start=Date.now(); const timer=setInterval(()=>{
        try{if(predicate()){clearInterval(timer);resolve();return;}}catch{}
        if(Date.now()-start>timeout){clearInterval(timer);reject(new Error("HiveStream timed out waiting for CyTube"));}
      },100);
    });
  }

  await waitFor(()=>window.socket && document.getElementById("ytapiplayer"));
  const host=document.getElementById("ytapiplayer");
  const video=document.createElement("video");
  video.controls=true; video.playsInline=true; video.preload="auto";
  video.style.width="100%"; video.style.height="100%"; video.style.background="#000";
  host.replaceChildren(video);

  const status=document.createElement("div");
  status.style.cssText="position:absolute;left:8px;bottom:8px;padding:4px 7px;background:rgba(0,0,0,.75);color:#fff;font:12px monospace;z-index:20";
  status.textContent="HiveStream ready";
  host.style.position="relative"; host.appendChild(status);

  const controller=installCyTubeHiveStream({
    backendUrl:backend,
    videoElement:video,
    onEvent:item=>{
      if(item.type==="peer-connect") status.textContent="HiveStream P2P peer connected";
      if(item.type==="peer-close") status.textContent="HiveStream P2P peer disconnected";
      if(item.type==="hls-error") status.textContent="HiveStream HLS error";
    }
  });

  function sendChat(msg){window.socket.emit("chatMsg",{msg});}

  const controls=document.createElement("div");
  controls.id="hivestream-controls";
  controls.style.cssText="padding:8px;background:#111;display:flex;gap:6px;align-items:center";
  const input=document.createElement("input");
  input.type="url"; input.placeholder="MP4 URL"; input.value="https://u.pone.rs/sahrrklr.mp4";
  input.style.cssText="flex:1;min-width:0";
  const button=document.createElement("button");
  button.textContent="HiveStream";
  button.onclick=async()=>{
    button.disabled=true; status.textContent="Packaging MP4 with FFmpeg…";
    try {
      const result=await controller.ingestAndBootstrap(input.value.trim(),sendChat);
      status.textContent="HiveStream bootstrapped: "+result.mediaId;
      await controller.adapter.handleChatMessage(controller.adapter.createChatBootstrap(result));
    } catch(error) { status.textContent="HiveStream error: "+error.message; console.error(error); }
    finally { button.disabled=false; }
  };
  controls.append(input,button);
  host.parentElement?.insertBefore(controls,host.nextSibling);

  /* Receive HiveStream control messages from normal CyTube chat. */
  if(typeof window.addChatMessage==="function"){
    const original=window.addChatMessage;
    window.addChatMessage=function(data){
      try {
        if(data && typeof data.msg==="string" && data.msg.startsWith("HS1:")){
          controller.handleCyTubeChatMessage(data.msg).catch(error=>console.error("[HiveStream]",error));
          return;
        }
      } catch(error){console.error("[HiveStream]",error);}
      return original.apply(this,arguments);
    };
  } else {
    console.warn("[HiveStream] addChatMessage was not available; incoming bootstrap messages will not be auto-consumed.");
  }

  window.HiveStreamCyTube=controller;
  console.log("[HiveStream] CyTube adapter installed.");
})().catch(error=>console.error("[HiveStream] installation failed",error));
