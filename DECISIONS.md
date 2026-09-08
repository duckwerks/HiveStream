# DECISIONS

This file records durable architectural decisions so future development does not depend on chat history.

## D-001 — HiveStream is a P2P media-distribution project

The primary purpose is browser-to-browser media sharing that reduces server/origin bandwidth. Playback synchronization is secondary.

## D-002 — Research and product code remain separate

CyTube reverse engineering and technical research belong in `cytube-knowledge`. HiveStream contains product architecture, implementation, tests, experiments, and durable decisions.

## D-003 — Use p2p-media-loader as the initial media-plane foundation

The project should first exploit an existing segment-oriented WebRTC P2P engine rather than immediately implementing a custom transport stack.

## D-004 — HiveStream owns application-level media identity

Transport/swarm identifiers are not the application's canonical media identity. HiveStream needs its own model for media, representations, segments, metadata, and local availability.

## D-005 — P2P is an optimization, not the playback contract

HTTP remains available for bootstrap and fallback. Peer availability is inherently variable in browsers.

## D-006 — IndexedDB first; investigate OPFS later

IndexedDB is the initial persistence mechanism because it is broadly available and straightforward for structured metadata plus binary segment storage. OPFS can be evaluated after the behavior is proven.

## D-007 — Do not introduce a second media gossip protocol prematurely

The existing P2P engine already has segment announcement/request mechanisms. HiveStream should add application-level coordination only where a real requirement exists.

## D-008 — CyTube is an adapter, not the foundation

CyTube compatibility should be built around a proven HiveStream media-distribution layer rather than making the initial architecture depend on Cytube internals.

## D-009 — Prove the smallest thing first

The next engineering milestone is a measurable two-browser P2P segment-transfer proof. Larger systems should not be designed around unverified assumptions.

## D-010 — Local uploads are first-class media ingestion

A local device file is not merely a temporary playback source. The target architecture allows it to become persistent, identifiable, and shareable swarm media.
