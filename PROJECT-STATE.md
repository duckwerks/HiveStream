# PROJECT STATE

**Last updated:** 2026-09-08
**Status:** Architectural baseline / pre-MVP implementation

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

The immediate objective is the smallest standalone two-browser experiment capable of demonstrating real P2P media traffic.

### Required measurements

- peer count
- HTTP downloaded bytes
- P2P downloaded bytes
- P2P uploaded bytes
- segment IDs acquired
- playback state
- later: persistent inventory

The proof must distinguish actual P2P segment traffic from ordinary HTTP loading.

## Evidence boundary

Research in `cytube-knowledge` establishes that p2p-media-loader has the mechanisms needed for segment storage, stored-segment inventory, announcements, requests, and uploads. The remaining engineering work is to prove the complete path in the target browsers and then build HiveStream-owned persistence/reuse behavior around it.

One explicit open boundary is the lifecycle of prepopulated persistent segments: when an active P2P loader starts, exactly when and how stored segments become visible to peers must be runtime-proven rather than assumed.

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
