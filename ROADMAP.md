# ROADMAP

## Phase 1 — P2P proof

**Goal:** demonstrate real browser-to-browser media segment transfer.

- Build the smallest standalone two-browser test.
- Load the same HLS media in two browsers.
- Establish peer discovery.
- Record peer count.
- Record HTTP bytes.
- Record P2P bytes received.
- Record P2P bytes uploaded.
- Record segment IDs acquired from each source.
- Confirm playback remains functional.

**Exit condition:** measurable P2P segment traffic is proven.

## Phase 2 — Persistence

**Goal:** make acquired media survive beyond the immediate playback session.

- Implement HiveStream-owned persistent segment metadata.
- Integrate IndexedDB storage.
- Track media identity → representation → segment identity.
- Record local availability.
- Verify stored bytes after reload.

**Exit condition:** a browser can retain useful media segments across sessions.

## Phase 3 — Reuse

**Goal:** prove that retained media can satisfy later playback without origin traffic where the local replica is sufficient.

- Reopen previously viewed media.
- Detect stored segments.
- Make them available to the P2P engine.
- Measure origin bytes versus reused/P2P bytes.
- Test partial replicas.
- Test peer churn and fallback.

**Exit condition:** repeated playback demonstrably benefits from retained replicas.

## Phase 4 — Local ingestion

**Goal:** allow a user to introduce a video from local device storage.

- Select local file.
- Identify media.
- Determine supported playback/segmentation path.
- Persist media locally.
- Make media addressable by HiveStream identity.
- Share its segments with peers.
- Allow another browser to acquire and play the media.

**Exit condition:** a locally supplied video can become shared swarm media.

## Phase 5 — Replication

**Goal:** turn individual cached copies into an intentional cooperative swarm.

- Decide which media to retain.
- Prioritize active and upcoming playlist items.
- Prefetch strategically.
- Seed useful replicas.
- Track availability.
- Handle storage quotas.
- Evict according to policy.
- Measure replication health.

**Exit condition:** swarm behavior is intentional rather than accidental.

## Phase 6 — CyTube integration

**Goal:** connect the proven HiveStream media layer to Cytube-style room and playlist behavior.

- Map playlist items to HiveStream media identities.
- Adapt room membership to swarm membership.
- Integrate existing CyTube media/player behavior.
- Preserve HTTP fallback.
- Preserve playlist semantics.
- Add only the synchronization needed by the product.

**Exit condition:** HiveStream P2P distribution works as the media layer of a Cytube-style room.

## Deferred investigations

These are intentionally postponed until the core path is proven:

- WebTorrent interoperability
- libp2p / Helia
- OPFS migration/optimization
- WebCodecs-based ingestion
- WebTransport services
- multi-tab coordination
- advanced playback synchronization
- token/reputation economy
- media recommendation graphs
- sophisticated custom signaling
