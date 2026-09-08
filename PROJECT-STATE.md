# PROJECT STATE

**Last updated:** 2026-09-08  
**Status:** Phase 1 runtime experiment ready

## Mission

HiveStream is a browser-based P2P video streaming platform whose primary purpose is to reduce server/origin bandwidth by sharing media directly among users.

The long-term goal is not merely faster playback. It is a persistent cooperative media swarm in which users retain and redistribute media so that repeated playback can increasingly avoid the origin entirely.

Local media ingestion is a first-class requirement: a user must eventually be able to select a video from local device storage, play it, identify it, persist it, and share it with other users.

## Priority order

1. P2P media distribution
2. Persistent media reuse
3. Local media ingestion
4. Swarm discovery and coordination
5. Playlist/media identity
6. Seeding and reseeding
7. Server bandwidth reduction
8. Playback synchronization
9. CyTube leader behavior compatibility

## Current architecture

```text
Room / Playlist / UI
        ↓
HiveStream Application Layer
  media identity
  playlist mapping
  replication policy
  local ingestion
        ↓
Distribution API
        ↓
p2p-media-loader
  peer discovery
  segment requests
  segment uploads
  HTTP/P2P hybrid loading
        ↓
Browser Storage
  IndexedDB initially
  OPFS investigation later
        ↓
HLS.js / Video.js
        ↓
HTMLMediaElement
```

## Current roadmap position

**Phase 1 — P2P proof.**

The standalone runtime experiment is now implemented at:

```text
experiments/phase-1-p2p-proof.html
```

Procedure and interpretation are documented at:

```text
docs/PHASE-1-P2P-PROOF.md
```

The experiment uses the current P2P Media Loader Hls.js integration and measures actual P2P/HTTP byte and segment events rather than treating peer discovery as proof of media transfer.

### Required measurements

- peer count
- HTTP downloaded bytes
- P2P downloaded bytes
- P2P uploaded bytes
- segment IDs acquired
- playback state
- later: persistent inventory

### Phase 1 exit condition

Phase 1 is complete only after a reproducible two-browser run demonstrates actual media segments/bytes moving through the P2P path.

## Evidence boundary

Research in `cytube-knowledge` establishes that p2p-media-loader has the mechanisms needed for segment storage, stored-segment inventory, announcements, requests, and uploads. The current experiment now provides the runtime instrument needed to prove the browser-to-browser media path.

One explicit open boundary remains the lifecycle of prepopulated persistent segments: when an active P2P loader starts, exactly when and how stored segments become visible to peers must be runtime-proven rather than assumed. That belongs to the persistence phase after Phase 1.

## Scope guardrail

Do not make the first MVP depend on:

- WebTorrent
- libp2p / Helia
- WebCodecs playback
- WebGPU
- token/reputation systems
- recommendation graphs
- sophisticated playback synchronization
- a custom media gossip protocol
- CyTube modification before the standalone P2P path is proven

These may become useful later, but none should obscure the first measurable proof of browser-to-browser media sharing.
