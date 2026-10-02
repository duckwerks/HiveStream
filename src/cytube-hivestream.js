/* CyTube adapter for the HiveStream MP4 -> HLS -> P2P path. */
import { HiveStreamCyTubeAdapter, encodeBootstrap, decodeBootstrap } from "./hivestream-client.js";

export class CyTubeHiveStreamController {
  constructor({backendUrl,videoElement,p2pCore={},onEvent}) {
    this.backendUrl=backendUrl.replace(/\/$/,"");
    this.adapter=new HiveStreamCyTubeAdapter({p2pCore,onEvent});
    this.adapter.attach(videoElement);
  }
  async ingestAndBootstrap(sourceUrl,sendChat) {
    const response=await fetch(this.backendUrl+"/api/ingest",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sourceUrl})});
    const result=await response.json();
    if(!response.ok || result.ok===false) throw new Error(result.error||"HiveStream ingestion failed");
    const chatMessage=encodeBootstrap(result);
    await sendChat(chatMessage);
    return result;
  }
  async handleCyTubeChatMessage(message) {
    const bootstrap=decodeBootstrap(message);
    if(!bootstrap)return false;
    await this.adapter.handleChatMessage(message);
    return bootstrap;
  }
}

export function installCyTubeHiveStream(options) {
  const controller=new CyTubeHiveStreamController(options);
  window.HiveStreamCyTube=controller;
  return controller;
}
