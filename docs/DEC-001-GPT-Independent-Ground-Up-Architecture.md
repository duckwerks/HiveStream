# DEC-001 — "If HiveStream Were Rebuilt From Scratch": GPT-5.6 Luna's Independent Ground-Up Architecture

**Author:** GPT-5.6 Luna (OpenAI), with Ed as project owner  
**Date:** 2026-09-14  
**Nature:** Independent architectural assessment and proposed design. This is not a source-proven research artifact and does not override existing decisions. It is intended to be compared against DEC-000 and used as input for future architecture revisions.

---

## Executive conclusion

If HiveStream were rebuilt from scratch, I would not begin by choosing libraries, writing a player, or reproducing CyTube behavior.

I would begin by defining the object HiveStream actually owns:

> **HiveStream is a browser-native cooperative media replication system, with HLS playback and CyTube as its first application.**

The central architectural object would therefore be a **Media Object**, not a URL, player, torrent, room, or swarm.

Everything else follows from that premise:

- HLS is a playback representation.
- hls.js is a playback engine.
- p2p-media-loader is the initial segment-distribution engine.
- WebRTC is the browser peer transport.
- a WSS tracker provides peer discovery.
- IndexedDB/OPFS provide local replicas.
- a Replication Manager decides what should be retained, prefetched, uploaded, or evicted.
- CyTube is an adapter that tells HiveStream what media a room wants to play.
- Tauri eventually provides a stronger, persistent replica node.

The project should optimize for **maintaining useful distributed media replicas among unreliable peers**, not merely for demonstrating browser-to-browser video transfer.

---

# 1. Start with the problem, not the technology

The project is easy to describe too narrowly as:

> "A P2P video player for CyTube."

I would instead define the problem as:

> **Can a population of ordinary browsers collectively acquire, retain, and redistribute media segments so that repeated viewing progressively reduces dependence on the origin?**

That is the actual engineering thesis.

Playback is the consumer of the system. P2P transport is the mechanism. CyTube is the first application environment.

The architecture should remain useful if CyTube disappeared tomorrow.

---

# 2. The fundamental object is a Media Object

The canonical object should not be a URL or transport swarm.

Conceptually:

```text
                    MEDIA OBJECT
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Identity        Metadata        Representations
                                         │
                              ┌──────────┼──────────┐
                              │          │          │
                           1080p      720p       480p
                              │          │          │
                              └──────┬───┴──────────┘
                                     │
                               Segment IDs
                                     │
                                     ▼
                              Local replicas
```

A URL is an acquisition source.

A CyTube media item is an application reference.

A P2P swarm is a temporary distribution mechanism.

The Media Object is what HiveStream owns.

---

# 3. Explicitly separate four identities

I would make identity an early architectural deliverable and distinguish at least four layers.

## 3.1 Media Identity

**What media is this?**

The canonical media identity must not depend on:

- CyTube
- room
- URL
- tracker
- peer
- session
- current swarm

Two independently obtained copies of equivalent media should have a path to the same Media Object.

## 3.2 Representation Identity

**Which encoded representation is this?**

For example:

```text
Media M
 ├── H.264/AAC 1080p
 ├── H.264/AAC 720p
 └── H.264/AAC 480p
```

Representations may be related without being identical.

## 3.3 Segment Identity

**Which exact media unit are we talking about?**

The segment becomes the important unit for verification, transfer, storage, and replication.

## 3.4 Swarm Identity

**Which peers are currently exchanging this material?**

Swarm identity is a transport/distribution concept. It must not silently become canonical content identity.

The conceptual hierarchy is:

```text
Media ID
   ↓
Representation ID
   ↓
Segment IDs
   ↓
Runtime swarm / peer population
```

This separation is one of the most important architectural protections in the project.

---

# 4. The segment is the real unit of persistence

I would not conceptualize HiveStream as a video cache.

I would conceptualize it as:

> **a distributed collection of verified media segments.**

A media object could therefore look conceptually like:

```text
Episode X
│
├── segment 0000 ── A B
├── segment 0001 ── A
├── segment 0002 ── A C
├── segment 0003 ── B C
├── segment 0004 ── C
├── ...
└── segment 0842 ── B
```

HiveStream can eventually reason about:

- local availability
- peer availability
- segment rarity
- playback urgency
- prefetch requirements
- storage budgets
- eviction candidates
- replication health

This is more useful than merely knowing that a swarm contains N peers.

---

# 5. Keep playback deliberately boring

The player should not understand HiveStream's distributed-systems complexity.

The desired path is:

```text
                 HiveStream
                     │
              Distribution API
                     │
              p2p-media-loader
                     │
               HLS / HTTP
                     │
                  hls.js
                     │
              HTMLMediaElement
```

If P2P is available:

```text
Peer → segment → player
```

If P2P is unavailable:

```text
HTTP → segment → player
```

If a peer disappears, playback should fall back to HTTP without requiring a different playback architecture.

> **P2P is an optimization, not the playback contract.**

This preserves the existing project decision and is a critical resilience property.

---

# 6. Make replication more important than the player

The central subsystem should eventually be a first-class:

```text
ReplicationManager
```

Its conceptual responsibilities are:

```text
ReplicationManager
       │
       ├── What should we retain?
       ├── What should we prefetch?
       ├── What should we upload?
       ├── What is rare?
       ├── What is urgently needed?
       ├── What can be evicted?
       └── What should receive scarce storage/bandwidth?
```

This is where HiveStream becomes a cooperative network rather than a P2P player with a cache.

---

# 7. Use three conceptual storage tiers

I would model storage as three levels even if the initial implementation maps several levels to the same browser API.

```text
Tier 0 — Playback material
          ↓
Tier 1 — Persistent local replica
          ↓
Tier 2 — Durable seeder
```

### Tier 0 — Playback material

Short-lived material required to maintain smooth playback.

### Tier 1 — Persistent replica

Segments deliberately retained after playback because they contribute to the cooperative network.

### Tier 2 — Durable seeder

An always-on or relatively persistent node with a stronger replication policy.

The eventual desktop client should be understood as a more capable replica node, not as a separate P2P architecture.

---

# 8. Browser and desktop should share one core

The architecture should be:

```text
                 HiveStream Core
                       │
          ┌────────────┼────────────┐
          │            │            │
       Browser    Shared runtime   Tauri
          │            │            │
     constrained   multi-tab     persistent
       replica      replica        seeder
```

The desktop environment should provide additional capabilities rather than a second implementation.

Tauri is a strong eventual candidate because the project benefits from direct filesystem access and a relatively small desktop footprint, but it should not become a dependency of the browser architecture.

---

# 9. Multi-tab semantics are required; SharedWorker is an implementation hypothesis

I agree with the architectural problem identified in DEC-000 but would phrase the commitment differently.

The requirement should be:

> **A browser profile should avoid unnecessary duplicate logical participation in the same HiveStream swarm/media replica.**

A SharedWorker is an attractive mechanism:

```text
Tab A ─┐
       ├── SharedWorker ── P2P/storage state
Tab B ─┘
```

But browser lifecycle behavior should be runtime-proven before SharedWorker is made an immutable architectural dependency.

The core API should therefore permit multiple runtime implementations:

```text
HiveStreamRuntime
       │
       ├── single-tab implementation
       ├── SharedWorker implementation
       └── desktop implementation
```

The semantic requirement matters more than the particular browser primitive.

---

# 10. Keep the media plane and control plane separate

The media plane handles bytes:

```text
HTTP
WebRTC DataChannels
segment requests
segment uploads
local storage
playback acquisition
```

The control plane handles application state:

```text
media identity
room references
playlist intent
replication policy
metadata
local availability declarations
future capability information
```

The control plane should not be allowed to become an unnecessary second media-gossip protocol while the existing P2P engine already handles segment exchange.

---

# 11. CyTube should be an extremely thin adapter

The target relationship is:

```text
                     CyTube
                       │
                 adapter only
                       │
                       ▼
                 HiveStream Core
                       │
             ┌─────────┼─────────┐
             │         │         │
          identity  replication playback
```

CyTube should be able to express operations such as:

```text
play(media)
pause()
seek(time)
queue(media)
remove(media)
```

HiveStream should not depend on CyTube internals for its fundamental data model.

The `cytube-knowledge` repository remains the appropriate home for reverse-engineering and durable knowledge about CyTube behavior.

---

# 12. Synchronization comes after distribution

I would deliberately defer sophisticated room synchronization.

The proof sequence should be:

```text
1. Identify media.
2. Identify representations.
3. Identify segments.
4. Transfer a segment peer-to-peer.
5. Persist a segment.
6. Serve a persisted segment to another browser.
7. Survive peer churn using HTTP fallback.
8. Maintain useful replicas.
9. Prefetch intelligently.
10. Integrate playlist behavior.
11. Integrate CyTube.
12. Synchronize viewers.
```

This prevents synchronization logic from obscuring whether the actual distributed-media thesis works.

---

# 13. Do not make WebCrypto identity or SeedTokens part of the first core

WebCrypto identities, signatures, reputation, ranks, and SeedTokens may eventually become valuable for cooperative governance.

They are not required to answer the foundational question:

> **Can browsers maintain and exchange useful media replicas?**

I would therefore create a hard conceptual boundary:

```text
CORE
 ├── media identity
 ├── representation identity
 ├── segment identity
 ├── acquisition
 ├── P2P transport
 ├── persistence
 ├── replication
 └── playback

COORDINATION / GOVERNANCE
 ├── room identity
 ├── signatures
 ├── reputation
 ├── tokens
 ├── permissions
 └── governance
```

This keeps distributed media engineering ahead of distributed governance engineering.

---

# 14. Keep the no-global-index principle

I would not create a giant global HiveStream catalog of everything users possess.

Instead:

```text
Room/content reference
       ↓
Media identity
       ↓
Known acquisition sources
       ↓
Local replicas
       ↓
P2P discovery
```

The network should primarily discover **availability**, not become a universal searchable catalog of every piece of media present in the network.

---

# 15. The tracker should be deliberately stupid

A self-hosted WSS tracker should primarily answer:

> "Which peers are currently participating in this swarm?"

It should not become HiveStream's authority for:

- what a user watches
- what a user permanently owns
- reputation
- room permissions
- token balances
- content governance

The tracker is infrastructure, not intelligence.

---

# 16. Local ingestion should share the same distribution model

A local file should eventually follow:

```text
Local file
   ↓
HiveStream ingestion API
   ↓
identify
   ↓
normalize / segment
   ↓
verify
   ↓
create representation
   ↓
local replica
   ↓
P2P distribution
```

The ingestion machinery itself should remain replaceable.

Possible future implementations include browser-side processing, desktop native tooling, or server-side preprocessing. The architecture should not hard-code one segmentation technology before benchmarking establishes which path is practical.

---

# 17. WebTorrent should leave the core architecture

I would not make WebTorrent a parallel media-plane fallback.

The architecture should have one primary browser P2P model:

```text
HLS
 ↓
p2p-media-loader
 ↓
WebRTC
```

WebTorrent should be treated as a future alternative only if demonstrated engineering evidence creates a compelling requirement.

This is intentionally softer than permanently prohibiting WebTorrent. The important architectural decision is that HiveStream should not have to reconcile two independent swarm models merely because both can move media.

---

# 18. Type the domain model, not the entire universe

I would favor TypeScript for HiveStream-owned code where type contracts materially reduce architectural mistakes.

The most valuable types would be things like:

```text
MediaObject
Representation
Segment
Replica
Peer
Swarm
ReplicationPolicy
PlaybackState
RoomMediaReference
```

The objective is not to create a heavyweight frontend framework or force every existing project artifact into TypeScript.

A small TypeScript core paired with a lightweight build process such as esbuild is sufficient if the resulting workflow remains compatible with the project's mobile-first development constraints.

---

# 19. Evidence discipline begins at the first commit

Every architectural statement should be classified where appropriate as:

- **SOURCE PROVEN**
- **RUNTIME PROVEN**
- **STRONG INFERENCE**
- **UNPROVEN / OPEN**
- **DESIGN PROPOSAL**

This distinction is especially important for browser APIs, storage behavior, WebRTC connectivity, third-party library behavior, and mobile lifecycle behavior.

A design should never quietly become a fact merely because it has appeared in several architecture documents.

---

# 20. The first engineering artifacts

If starting from zero, I would not begin with a polished player.

I would build the following proofs.

## HS-001 — Media Identity

Given two independently described sources, determine whether they can be associated with the same canonical Media Object.

## HS-002 — Representation Identity

Determine whether two HLS representations are equivalent, related, or distinct.

## HS-003 — Segment Identity

Establish deterministic identities for segments and a verification method for their bytes.

## HS-004 — Two-browser segment transfer

Prove only:

```text
Browser A ← segment ← Browser B
```

No CyTube. No playlist. No room synchronization.

## HS-005 — Persistent replica

Reload or terminate the browser and verify that an intentionally retained segment remains available.

## HS-006 — Replica serving

A second browser requests a segment that the first browser retained persistently.

The first browser supplies it without reacquiring it from the origin.

## HS-007 — Peer churn

Remove the peer and verify that HTTP fallback preserves playback or acquisition. Introduce another peer and verify recovery of P2P acquisition.

Only after these proofs would I move aggressively into:

```text
HS-008  Prefetch
HS-009  Rarity / replication policy
HS-010  Multi-tab runtime
HS-011  Playlist integration
HS-012  CyTube adapter
HS-013  Synchronization
HS-014  Local ingestion
HS-015  Desktop persistent seeder
```

---

# 21. Ground-up reference architecture

```text
                         ┌─────────────────────┐
                         │       CyTube        │
                         │     Adapter only    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │      HiveStream Core       │
                    │                           │
                    │ Media Identity            │
                    │ Representation Model      │
                    │ Segment Model             │
                    │ Replica State             │
                    │ Replication Policy        │
                    │ Playback Coordination     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ Distribution     │        │ Persistence      │
          │ Manager          │        │ Manager          │
          │                  │        │                  │
          │ peer selection   │        │ IndexedDB        │
          │ prefetch         │        │ OPFS candidate   │
          │ rarity           │        │ quota            │
          │ upload policy    │        │ eviction         │
          └────────┬─────────┘        └────────┬─────────┘
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                       ┌──────────────────┐
                       │ P2P Media Loader │
                       │                  │
                       │ WebRTC           │
                       │ WSS discovery    │
                       │ HTTP fallback    │
                       └────────┬─────────┘
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                       Peers         Origin
                         │             │
                         └──────┬──────┘
                                ▼
                         ┌──────────────┐
                         │    HLS.js    │
                         └──────┬───────┘
                                ▼
                         HTMLMediaElement
```

---

# 22. Architectural test for future decisions

Every proposed feature should answer:

> **Does this help HiveStream maintain and distribute verified media replicas efficiently among unreliable peers?**

If yes, it belongs in the core discussion.

If it helps an application layer but not the distribution core, it belongs above the core.

If it is interesting infrastructure without a demonstrated requirement, it belongs in an experiment or open question.

If it creates a second competing media-distribution model, the burden of proof should be high.

---

# Final position

The strongest version of HiveStream is not a more complicated video player.

It is a system in which ordinary browsers gradually become useful, temporary media replicas, while persistent nodes preserve important content and HTTP remains the safety net.

The architecture should therefore optimize for this progression:

```text
Origin
  ↓
Browser A
  ↓
Persistent replica
  ↓
Browser B
  ↓
Persistent replica
  ↓
Browser C
  ↓
Desktop durable seeder
  ↓
Future viewers
```

The long-term success criterion is not merely:

> "Browser A connected to Browser B."

It is:

> **"The network can keep useful media available even though individual browsers are unreliable."**

That is the architectural idea I would build HiveStream around from the beginning.
