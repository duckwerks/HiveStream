# OPEN QUESTIONS

## P2P transfer

- Can the target browser pair reliably establish WebRTC DataChannels through the selected tracker configuration?
- What portion of playback traffic is actually supplied by peers under realistic timing?
- How should HTTP and P2P scheduling be balanced when both sources are available?
- What happens to outstanding segment requests when a peer disappears?

## Persistence

- What is the most useful persistent key for media/representation/segment records?
- How should byte storage and metadata storage be separated?
- What quota behavior is encountered on target mobile browsers?
- What eviction policy should eventually be used?
- Should OPFS replace IndexedDB for large media bytes after the first persistence milestone?

## Reuse

- When pre-existing segments are inserted into persistent storage, exactly when does an active p2p-media-loader instance discover and announce them?
- Does a reload/restart require explicit inventory initialization before peer availability is advertised?
- How should partial local replicas be represented and prioritized?

## Local ingestion

- What media formats can be shared directly?
- When is transmuxing or segmentation required?
- Should local files be represented through HLS, DASH, or another segment abstraction?
- What is the smallest ingestion pipeline that works on both desktop and mobile browsers?

## Replication

- How many replicas are useful for a given media item?
- How should active/upcoming playlist items affect retention priority?
- How should peers decide whether to seed versus preserve battery/storage?
- How should a browser gracefully stop seeding when backgrounded or suspended?

## CyTube integration

- What is the minimum adapter surface needed to map Cytube playlist media to HiveStream media identities?
- Which existing playlist events matter to media distribution?
- Which CyTube behavior should be preserved exactly, and which should be replaced by HiveStream behavior?

## Deferred

These questions are deliberately not blockers for the first P2P proof:

- WebTorrent interoperability
- libp2p / Helia
- WebTransport architecture
- multi-tab coordination
- advanced playback synchronization
- token/reputation systems
- recommendation graphs
- custom signaling infrastructure
