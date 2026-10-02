/* HiveStream FFmpeg ingestion server. Author: Elwood Edwards. Engineering: GPT-5.6 Luna. */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
const MEDIA_ROOT = path.resolve(process.env.MEDIA_ROOT || "./media");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const SEGMENT_SECONDS = Number(process.env.HS_SEGMENT_SECONDS || 4);
await fs.mkdir(MEDIA_ROOT, { recursive: true });

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"});
  res.end(data);
}
function text(res, status, body, contentType="text/plain; charset=utf-8") {
  res.writeHead(status, {"content-type":contentType,"access-control-allow-origin":"*"});
  res.end(body);
}
function normalizeSource(value) {
  let u; try { u = new URL(value); } catch { throw new Error("sourceUrl must be a valid URL"); }
  if (!["http:","https:"].includes(u.protocol)) throw new Error("Only HTTP(S) source URLs are accepted");
  return u.toString();
}
function mediaIdFor(sourceUrl) { return createHash("sha256").update(sourceUrl).digest("hex").slice(0,32); }
function mediaDir(id) { return path.join(MEDIA_ROOT,id); }
async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function readBody(req) {
  const chunks=[]; let bytes=0;
  for await (const chunk of req) { bytes += chunk.length; if(bytes > 65536) throw new Error("Request body too large"); chunks.push(chunk); }
  return Buffer.concat(chunks).toString("utf8");
}
async function packageMp4ToHls(sourceUrl, id) {
  const dir=mediaDir(id); const manifest=path.join(dir,"media.m3u8");
  if(await exists(manifest)) return;
  await fs.mkdir(dir,{recursive:true});
  const temp=path.join(MEDIA_ROOT,`.tmp-${id}-${Date.now()}`); await fs.mkdir(temp,{recursive:true});
  const args=["-hide_banner","-loglevel","warning","-y","-i",sourceUrl,"-map","0:v:0","-map","0:a:0?","-c","copy","-f","hls","-hls_time",String(SEGMENT_SECONDS),"-hls_playlist_type","vod","-hls_segment_type","fmp4","-hls_fmp4_init_filename","init.mp4","-hls_segment_filename",path.join(temp,"segment-%05d.m4s"),path.join(temp,"media.m3u8")];
  try {
    await new Promise((resolve,reject)=>{
      const child=spawn(FFMPEG,args,{stdio:["ignore","ignore","pipe"]}); let stderr="";
      child.stderr.on("data",c=>{stderr+=c.toString(); if(stderr.length>12000) stderr=stderr.slice(-12000);});
      child.on("error",reject);
      child.on("close",code=>code===0?resolve():reject(new Error("FFmpeg exited with code "+code+(stderr?": "+stderr:""))));
    });
    if(!(await exists(path.join(temp,"media.m3u8"))) || !(await exists(path.join(temp,"init.mp4")))) throw new Error("FFmpeg produced no usable HLS package");
    await fs.rm(dir,{recursive:true,force:true}); await fs.rename(temp,dir);
  } catch(error) { await fs.rm(temp,{recursive:true,force:true}); throw error; }
}
async function ingest(sourceUrl) {
  const normalized=normalizeSource(sourceUrl); const mediaId=mediaIdFor(normalized);
  await packageMp4ToHls(normalized,mediaId);
  const base=PUBLIC_BASE_URL || `http://localhost:${PORT}`;
  return {protocol:"hivestream-bootstrap",version:1,mediaId,swarmId:"hivestream:"+mediaId,sourceUrl:normalized,manifestUrl:`${base}/media/${mediaId}/media.m3u8`,hls:{type:"vod",segmentType:"fmp4",segmentSeconds:SEGMENT_SECONDS}};
}
function mime(file) { if(file.endsWith(".m3u8")) return "application/vnd.apple.mpegurl"; if(file.endsWith(".mp4")) return "video/mp4"; if(file.endsWith(".m4s")) return "video/iso.segment"; return "application/octet-stream"; }
async function serveMedia(req,res,pathname) {
  const relative=pathname.slice("/media/".length); const file=path.resolve(MEDIA_ROOT,relative);
  if(!file.startsWith(MEDIA_ROOT+path.sep)) return text(res,403,"Forbidden");
  if(!(await exists(file))) return text(res,404,"Not found");
  const data=await fs.readFile(file);
  res.writeHead(200,{"content-type":mime(file),"content-length":data.length,"cache-control":"public, max-age=31536000, immutable","access-control-allow-origin":"*"}); res.end(data);
}
const server=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,"http://"+(req.headers.host||"localhost"));
    if(req.method==="OPTIONS"){res.writeHead(204,{"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"});return res.end();}
    if(req.method==="GET"&&url.pathname==="/health") return json(res,200,{ok:true,service:"hivestream-ingestion"});
    if(req.method==="POST"&&url.pathname==="/api/ingest"){const body=JSON.parse(await readBody(req));return json(res,200,await ingest(body.sourceUrl));}
    if(req.method==="GET"&&url.pathname.startsWith("/media/")) return serveMedia(req,res,url.pathname);
    return text(res,404,"Not found");
  } catch(error) { console.error(error); return json(res,400,{ok:false,error:error.message||String(error)}); }
});
server.listen(PORT,HOST,()=>console.log(`HiveStream ingestion server listening on ${HOST}:${PORT}`));
