/* HiveStream browser media client. Pinned: hls.js 1.7.0, p2p-media-loader-hlsjs 4.0.0. */
import Hls from "https://cdn.jsdelivr.net/npm/hls.js@1.7.0/dist/hls.mjs";
import { HlsJsP2PEngine } from "https://cdn.jsdelivr.net/npm/p2p-media-loader-hlsjs@4.0.0/dist/p2p-media-loader-hlsjs.es.min.js";

const HlsWithP2P = HlsJsP2PEngine.injectMixin(Hls);
export const HIVESTREAM_BOOTSTRAP_PREFIX = "HS1:";
export function encodeBootstrap(value) { return HIVESTREAM_BOOTSTRAP_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(value)))); }
export function decodeBootstrap(message) {
  if(typeof message!=="string" || !message.startsWith(HIVESTREAM_BOOTSTRAP_PREFIX)) return null;
  try { return JSON.parse(decodeURIComponent(escape(atob(message.slice(HIVESTREAM_BOOTSTRAP_PREFIX.length))))); } catch { return null; }
}

export class HiveStreamPlayer {
  constructor(video, options={}) {
    this.video=video; this.options=options; this.hls=null;
    this.state={mediaId:null,swarmId:null,peers:0,httpBytes:0,p2pBytes:0,p2pUploadedBytes:0,segments:[],events:[]};
  }
  event(type,details) {
    const item={at:new Date().toISOString(),type,details:details??null};
    this.state.events.push(item); if(this.state.events.length>500) this.state.events.shift();
    this.options.onEvent?.(item,this.snapshot());
  }
  async load(bootstrap) {
    this.destroy();
    this.state.mediaId=bootstrap.mediaId; this.state.swarmId=bootstrap.swarmId;
    if(!HlsWithP2P.isSupported()) throw new Error("Hls.js MSE playback is not supported");
    this.hls=new HlsWithP2P({
      p2p:{
        core:{swarmId:bootstrap.swarmId,...(this.options.p2pCore||{})},
        onHlsJsCreated:hls=>{
          const p2p=hls.p2pEngine;
          p2p?.addEventListener("onPeerConnect",d=>{this.state.peers++;this.event("peer-connect",d);});
          p2p?.addEventListener("onPeerClose",d=>{this.state.peers=Math.max(0,this.state.peers-1);this.event("peer-close",d);});
          p2p?.addEventListener("onSegmentLoaded",d=>{
            const n=Number(d?.bytes??d?.size??d?.data?.byteLength??0);
            const source=String(d?.source??d?.type??"").toLowerCase();
            if(source.includes("p2p")) this.state.p2pBytes+=Number.isFinite(n)?n:0;
            if(source.includes("http")) this.state.httpBytes+=Number.isFinite(n)?n:0;
            if(d?.segmentId) this.state.segments.push({id:d.segmentId,source:d.source??null,bytes:n});
            this.event("segment-loaded",d);
          });
          this.options.onP2PEngine?.(p2p,hls);
        }
      }
    });
    this.hls.on(Hls.Events.ERROR,(_e,data)=>this.event("hls-error",data));
    this.hls.on(Hls.Events.MANIFEST_PARSED,()=>this.event("manifest-parsed",{levels:this.hls.levels.length}));
    this.hls.attachMedia(this.video);
    this.hls.loadSource(bootstrap.manifestUrl);
    return this.snapshot();
  }
  snapshot(){return JSON.parse(JSON.stringify(this.state));}
  destroy(){if(this.hls){this.hls.destroy();this.hls=null;} }
}

export class HiveStreamCyTubeAdapter {
  constructor(options={}){this.options=options;this.player=null;}
  attach(videoElement){this.player=new HiveStreamPlayer(videoElement,this.options);return this.player;}
  async handleChatMessage(message){const bootstrap=decodeBootstrap(message);if(!bootstrap)return false;if(!this.player)throw new Error("HiveStream player is not attached");await this.player.load(bootstrap);return bootstrap;}
  createChatBootstrap(bootstrap){return encodeBootstrap(bootstrap);}
}

export function installCyTubeHiveStream(options={}) {
  const adapter=new HiveStreamCyTubeAdapter(options);
  window.HiveStream=window.HiveStream||{};
  window.HiveStream.adapter=adapter;
  window.HiveStream.decodeBootstrap=decodeBootstrap;
  window.HiveStream.encodeBootstrap=encodeBootstrap;
  window.HiveStream.sendBootstrap=bootstrap=>{
    if(!window.socket) throw new Error("CyTube socket is unavailable");
    window.socket.emit("chatMsg",{msg:encodeBootstrap(bootstrap)});
  };
  return adapter;
}
