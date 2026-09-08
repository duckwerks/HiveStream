# LLM HANDOFF

## Read this first

HiveStream is a browser-based P2P video streaming platform.

The primary goal is **P2P media distribution to reduce server bandwidth**. Do not reinterpret the project as primarily a synchronization system, a generic torrent client, or a CyTube reverse-engineering exercise.

The second major goal is **persistent media reuse**: users should retain useful video segments so repeated playback can increasingly come from the room's users rather than the origin.

The third major goal is **local media ingestion**: a user should eventually be able to select a video from local device storage and introduce it into the same sharing system.

## Current state

The project is at the architectural baseline / pre-MVP implementation stage.

The immediate task is:

> Build the smallest standalone two-browser P2P media-loader test that reports actual P2P segment traffic.

Measure:

- peer count
- HTTP downloaded bytes
- P2P downloaded bytes
- P2P uploaded bytes
- segment IDs acquired
- playback state

Do not begin by modifying CyTube.

## Initial stack

- p2p-media-loader — initial segment-oriented P2P media engine
- HLS.js / Video.js — playback integration
- WebRTC DataChannels — browser-to-browser transport
- IndexedDB — initial persistent storage
- HTTP — bootstrap/fallback

## Architectural boundary

```text
HiveStream
  owns:
    media identity
    playlist mapping
    local ingestion
    persistence policy
    replication policy
    room integration

P2P engine
  owns:
    peer discovery
    segment exchange
    requests/uploads

Playback engine
  owns:
    decoding
    rendering
```

Core principle:

> **HiveStream owns the concept. The existing P2P engine does the difficult plumbing.**

## Roadmap

```text
1. P2P PROOF          ← current
2. PERSISTENCE
3. REUSE
4. LOCAL INGESTION
5. REPLICATION
6. CYTUBE INTEGRATION
```

## Evidence discipline

When describing behavior, classify it as one of:

- **SOURCE PROVEN** — established directly from source code or authoritative documentation.
- **RUNTIME PROVEN** — observed in an actual browser/runtime experiment.
- **STRONG INFERENCE** — follows closely from source plus runtime evidence but is not directly proven.
- **UNPROVEN / OPEN** — plausible but requires an experiment.
- **DESIGN PROPOSAL** — an architectural choice being suggested, not an observed fact.

Never turn a design proposal into a claimed implementation fact.

## Important prior research

The separate `cytube-knowledge` repository contains the CyTube reverse-engineering record and P2P engine research. It established that p2p-media-loader supports segment storage, stored-segment inventory, announcements, requests, uploads, and HTTP/P2P hybrid loading.

One important open boundary remains: when persistent segments are prepopulated before an active P2P loader exists, exactly when and how those segments become announced to peers must be runtime-proven.

## Do not prematurely add

Unless a concrete requirement appears, do not make the MVP depend on:

- WebTorrent
- libp2p / Helia
- WebCodecs playback
- WebGPU
- token/reputation systems
- recommendation graphs
- elaborate synchronization
- custom media gossip
- CyTube internals

## Project memory

This repository is intended to be understandable without access to the original chat history. Update durable state documents when architectural decisions or verified findings materially change the project.

Human Project Lead: **Elwood Edwards**

AI Research & Engineering Assistant: **GPT-5.6 Luna (OpenAI)**
