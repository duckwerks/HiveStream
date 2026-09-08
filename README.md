# HiveStream

HiveStream is a browser-based peer-to-peer video streaming platform.

Its primary purpose is to reduce origin/server bandwidth by allowing users to share video segments directly with one another. Over repeated watches, users can retain media locally so future playback can increasingly come from the room's own cooperative swarm rather than the original server.

HiveStream also allows users to introduce video from their own local device storage and make that media available to the swarm.

## Core idea

> HiveStream turns a recurring watch room from a server-fed collection of viewers into a persistent, cooperative media swarm.

```text
FIRST WATCH
Server/source
    ↓
Users acquire pieces
    ↓
Users seed users
    ↓
More users retain copies

REPEATED WATCHES
Room swarm contains many replicas/pieces
    ↓
Future playback can come mostly or entirely from users
    ↓
Origin/server video bandwidth approaches zero
```

## Current technical foundation

The initial media-plane foundation is **Novage p2p-media-loader**, with:

- HLS.js / Video.js for playback integration
- WebRTC DataChannels for browser-to-browser segment exchange
- IndexedDB as the first persistent storage layer
- HTTP as bootstrap and fallback transport
- HiveStream application logic above the P2P engine for media identity, playlist mapping, persistence, replication, and local ingestion

The guiding separation is:

> **HiveStream owns media identity, persistence, replication policy, room integration, and local ingestion. The P2P engine owns peer-to-peer segment exchange. The playback engine owns decoding and rendering.**

## Development sequence

1. **P2P proof** — prove actual segment traffic between two browsers.
2. **Persistence** — retain acquired media segments locally.
3. **Reuse** — serve retained segments to later playback without origin fetches where possible.
4. **Local ingestion** — allow a local video file to become swarm media.
5. **Replication** — intelligently retain, prefetch, seed, and evict media.
6. **CyTube integration** — connect the proven media layer to room/playlist behavior.

Playback synchronization is deliberately lower priority than P2P media distribution.

## Repository map

- `PROJECT-STATE.md` — current project state and immediate objective
- `ARCHITECTURE.md` — system architecture and layer boundaries
- `ROADMAP.md` — staged implementation plan
- `DECISIONS.md` — durable architectural decisions
- `OPEN-QUESTIONS.md` — unresolved engineering questions
- `LLM-HANDOFF.md` — starting point for another AI or developer
- `src/` — product source code
- `tests/` — automated and integration tests
- `experiments/` — disposable technical experiments
- `docs/` — supporting documentation
- `archive/` — superseded material

## Research provenance

CyTube reverse engineering, runtime tests, P2P engine research, and architecture investigations are maintained separately in the `cytube-knowledge` repository so that research evidence remains distinct from product code.

Human Project Lead: **Elwood Edwards**

AI Research & Engineering Assistant: **GPT-5.6 Luna (OpenAI)**
