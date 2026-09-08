# ARCHITECTURE

## Core principle

> **HiveStream owns the concept. The existing P2P engine does the difficult plumbing.**

HiveStream should not initially reinvent peer discovery, WebRTC transport, segment scheduling, and upload/request protocols when a working segment-oriented P2P engine already provides those primitives.

## Layer model

```text
┌─────────────────────────────────────────────┐
│ Room / Playlist / User Interface            │
├─────────────────────────────────────────────┤
│ HiveStream Application Layer                │
│                                             │
│ • media identity                             │
│ • playlist mapping                           │
│ • local media ingestion                      │
│ • persistence policy                         │
│ • replication policy                         │
│ • room integration                           │
├─────────────────────────────────────────────┤
│ Distribution API                             │
├─────────────────────────────────────────────┤
│ p2p-media-loader                             │
│                                             │
│ • peer discovery                             │
│ • WebRTC segment exchange                    │
│ • segment requests                           │
│ • segment uploads                            │
│ • HTTP fallback                              │
│ • segment storage interface                  │
├─────────────────────────────────────────────┤
│ Browser Storage / APIs                       │
│                                             │
│ • IndexedDB initially                        │
│ • OPFS investigation later                   │
├─────────────────────────────────────────────┤
│ HLS.js / Video.js                            │
├─────────────────────────────────────────────┤
│ HTMLMediaElement                             │
└─────────────────────────────────────────────┘
```

## Media identity versus transport identity

HiveStream should own the identity of a media object independently from the temporary identifiers used by a P2P transport engine.

A media object conceptually contains:

- stable media identity
- metadata
- one or more representations
- manifest information
- segment identities
- local availability
- replication state

The transport layer answers: **who can exchange this segment?**

HiveStream answers: **what media does this segment belong to, should we retain it, and how does it relate to the room playlist?**

## Media plane and control plane

### Media plane

The media plane carries the actual video/audio bytes:

- HTTP acquisition
- WebRTC DataChannels
- segment requests
- segment uploads
- local storage
- playback loading

### Control plane

The control plane coordinates the application:

- room membership
- playlist state
- media identity
- metadata
- replication policy
- local-ingestion declarations
- future capability and availability information

Keeping these planes separate prevents room logic from becoming entangled with raw segment transport.

## Persistent replica model

A stored segment should eventually be treated as a local replica, not merely as a disposable playback cache.

```text
Origin / HTTP
      │
      ▼
Browser A ───── WebRTC ─────► Browser B
   │                              │
   ▼                              ▼
Local replica                 Local replica
   │                              │
   └────────── future peers ──────┘
```

This is the mechanism by which repeated viewing can progressively reduce origin bandwidth.

## Local ingestion

A local file follows a different acquisition path:

```text
Local device file
      ↓
HiveStream ingestion
      ↓
media identity / segmentation
      ↓
local persistence
      ↓
P2P advertisement
      ↓
other users acquire segments
```

The exact segmentation/transmuxing strategy remains an implementation question. The architectural requirement is that locally introduced media eventually enters the same persistent distribution system as remotely acquired media.

## Replication manager

Replication intelligence belongs to HiveStream rather than the underlying transport library.

Future conceptual component:

```text
ReplicationManager
       │
       ├── What should we retain?
       ├── What should we prefetch?
       ├── What should we seed?
       ├── What can we evict?
       └── Which playlist items need priority?
```

This is where the long-term cooperative-swarm behavior will live.

## HTTP remains a valid path

P2P is an optimization, not the playback contract.

If a segment is unavailable from peers, HTTP remains the bootstrap/fallback path. This makes the system resilient to peer churn, NAT limitations, browser lifecycle behavior, and incomplete replicas.

## Deferred architecture

The following technologies remain possible future components, not current dependencies:

- WebTorrent interoperability
- libp2p / Helia for richer control or content identity
- OPFS for larger/faster persistent media storage
- WebCodecs for advanced ingestion or low-level media processing
- WebTransport for server-side control/bootstrap services
- multi-tab coordination using SharedWorker/BroadcastChannel/Web Locks
- advanced synchronization
- reputation/token systems

They should be introduced only when a concrete requirement justifies them.
