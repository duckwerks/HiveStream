# HiveStream Phase 1B — v11 WebRTC Source-Level Audit

**Date:** 2026-09-21  
**Project owner:** William von Meister  
**Research / technical analysis / implementation:** GPT-5.6 Luna (OpenAI)  
**Baseline:** `HiveStream-Phase1B-Natural-Swarm-Diagnostic-v10.html`  
**Library:** `p2p-media-loader-hlsjs@4.0.0`  
**Pinned source:** `527105b420c15dfdb0e8ed4b6f0a261f48411192`

## Objective

v11 is an instrumentation revision, not an architecture rewrite. Its purpose is to identify the exact WebRTC negotiation boundary at which the current natural-swarm experiment stops progressing.

## Source-by-source audit

### `webtorrent/webtorrent-client/index.ts`

This is the decisive protocol source.

**Outgoing path**

1. Create `RTCPeerConnection`.
2. Create `RTCDataChannel("webtorrent")`.
3. `createOffer()`.
4. `setLocalDescription(offer)`.
5. Wait for ICE gathering.
6. Read the gathered `localDescription`.
7. Send WebTorrent tracker announce with `info_hash`, `peer_id`, `numwant`, `offers`, and `offer_id`.
8. Receive an answer for the matching `offer_id`.
9. `setRemoteDescription(answer)`.
10. Wait for the data channel to open.
11. Emit the peer-connected event.

**Incoming path**

1. Receive tracker offer with `peer_id` and `offer_id`.
2. Create `RTCPeerConnection`.
3. `setRemoteDescription(offer)`.
4. `createAnswer()`.
5. `setLocalDescription(answer)`.
6. Wait for ICE gathering.
7. Send answer with `to_peer_id` and `offer_id`.
8. Wait for the remote data channel to arrive and open.
9. Emit the peer-connected event.

**Instrumentation consequence:** v11 intercepts every browser operation above instead of inferring the path from ICE state alone.

### `types.ts`

The v4 event contract confirms:

- peer events carry `peerId`, `infoHash`, `streamType`, and `trackerUrl`;
- `onPeerConnectError` is distinct from later peer errors;
- `onChunkDownloaded` is positional:
  `(bytesLength, downloadSource, peerId, streamType, infoHash)`;
- `onSegmentStart` and `onSegmentLoaded` contain structured segment details.

v11 retains these exact shapes.

### `core.ts`

The Core registers streams once and computes `swarmId`, `identityHash`,
`streamSwarmId`, and `infoHash). v11 does not alter this identity model.

The existing diagnostic therefore remains capable of proving whether a P2P
segment belongs to the selected controlled stream identity.

### `p2p/peer-protocol.ts` and `p2p/loader.ts`

The P2P media protocol runs over the established WebRTC data channel. Therefore:

- PC creation is not a connection;
- ICE candidates are not a connection;
- a candidate pair existing is not necessarily the selected path;
- ICE connected is still distinct from a data channel being open;
- `onPeerConnect` is the library-level connection milestone;
- P2P chunk bytes are a later transport/media milestone.

v11 preserves those distinctions.

## v10 problems corrected in v11

### A. Incomplete data-channel instrumentation

v10 mainly observed the PC and later looked for data-channel events. That misses locally created channels.

v11 intercepts `createDataChannel()` and also listens for the remote `datachannel` event.

### B. Missing offer/answer operation trace

v10 could show ICE checking without proving whether an answer was ever accepted.

v11 records:

- `createOffer`
- `createAnswer`
- `setLocalDescription`
- `setRemoteDescription`
- `addIceCandidate` if any browser/library path uses it
- operation start/end/error timestamps.

### C. Wrong candidate-pair emphasis

The standards path is:

`transport.selectedCandidatePairId` -> matching `candidate-pair`.

Firefox's `candidate-pair.selected` is only a fallback.

v11 records both paths and labels the fallback rather than treating a nominated/succeeded pair as automatically selected.

### D. Old-PC contamination

v11 assigns each captured PC the current HiveStream `runId`. Reports only promote PCs from the current run.

### E. Duplicate HLS event binding

v10 bound HLS events inside `onHlsJsCreated` and again after constructing `HlsWithP2P`.

v11 keeps the first binding only.

## v11 evidence ladder

1. tracker configured
2. tracker event / peer discovery
3. RTCPeerConnection created
4. data channel created
5. offer or answer operation succeeds
6. local description set
7. remote description set
8. ICE candidates gathered
9. ICE checking
10. selected candidate pair
11. ICE connected/completed
12. data channel opened
13. p2p-media-loader `onPeerConnect`
14. P2P chunk bytes
15. P2P media segment
16. controlled stream identity match

## Interpretation rules

- A tracker peer sighting is discovery, not connectivity.
- ICE candidates are candidates, not proof of a working route.
- A succeeded/nominated pair is not automatically the currently selected pair.
- ICE connected without a data channel is not a p2p-media-loader peer connection.
- A data channel without `onPeerConnect` indicates the failure boundary is inside or immediately around the loader's peer protocol.
- P2P bytes without a controlled segment match do not prove the controlled rendition was served.

## What remains intentionally unchanged

- Mux natural public swarm fixture.
- Three WSS trackers.
- Natural/custom swarm modes.
- Controlled 848x480 / 836280 rendition.
- Hybrid and P2P-only modes.
- No TURN.
- No private-tracker redesign.
- No SeedToken or persistence work.
- No simultaneous timeout changes intended to manufacture success.

## Provenance

William von Meister is the HiveStream project owner and defines project decisions and experimental intent.

GPT-5.6 Luna is the research and technical analysis collaborator for v11. The
implementation is based on direct inspection of the pinned p2p-media-loader
source and current WebRTC API documentation. If the dependency or pinned commit
changes, this audit should be reverified rather than assumed to remain valid.
