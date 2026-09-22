# HiveStream Phase 1B v10 — Source-Level Review Baseline

Date: 2026-09-21
Scope: Complete source-level review of experiments/HiveStream-Phase1B-Natural-Swarm-Diagnostic-v10.html, used as the coding baseline for the next improved diagnostic.

## Testing model clarified by project owner

The Mux HLS demo stream is intentionally being treated as a natural public swarm experiment, not merely as a two-device bootstrap test.

Stream: https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

The test progression is intended to move from broad/natural P2P discovery toward increasingly controlled experiments:

1. Natural swarm + selected stream variant: determine whether browser P2P video segments can be obtained/shared at all through the public swarm.
2. Known-peer testing: determine whether specific known devices can connect directly.
3. Known peers + fixed stream variant: determine whether peers can exchange segments for the same variant.
4. Known peers + fixed variant + custom swarm ID: isolate the swarm and prove controlled peer-to-peer segment exchange.
5. Continue improving instrumentation so observations conform to the actual p2p-media-loader v4 event/configuration model.

Therefore, the earlier statement that P2P-only + P2P-only is not a valid bootstrap experiment must be interpreted narrowly: it is not a sufficient two-fresh-peer media bootstrap experiment. It does not invalidate the natural-swarm experiment, because the natural swarm may contain already-seeded peers. Likewise, a deliberate seed-then-receiver test is valid when the first device has actually downloaded and retained the target segments.

## v10 source-level findings to preserve for the next coding revision

### High priority

1. HLS event handlers are attached twice.
   - onHlsJsCreated calls attachHlsEvents().
   - The code also calls attachHlsEvents() after creating HlsWithP2P.
   - This can duplicate MANIFEST/LEVEL/ERROR handlers and cause duplicate logs or recovery/level-correction actions.
   - Fix by having exactly one attachment path or an explicit idempotent guard.

2. Do not confuse a fresh-peer bootstrap caveat with the natural-swarm experiment.
   - Natural swarm testing is intentionally designed to discover existing public peers/seeds for the Mux fixture.
   - A two-device controlled test must separately ensure a peer has acquired the exact target segments before expecting P2P media delivery.
   - The intended seed test is: Device A = hybrid + fixed variant + natural swarm, play the stream sufficiently to acquire/seed it; Device B = P2P segment-only + same variant + same swarm identity.
   - Later controlled tests use known peers and custom swarm IDs.

3. Data-channel instrumentation is incomplete.
   - Listening only for the datachannel event can miss a locally-created data channel.
   - Instrument createDataChannel and/or use WebRTC stats in addition to the event.
   - A missing datachannel event must not be interpreted as proof that no data channel existed.

4. ICE candidate addresses are intentionally useful diagnostic data.
   - The earlier privacy wording saying no public IP is exported conflicts with raw ICE candidate capture.
   - Project decision: retain detailed candidate/network information because this is a WebRTC P2P diagnostic and peer/network identity distinction is part of the experiment.
   - Do not fingerprint browsers or collect unnecessary persistent hardware identity.
   - Rewrite the export description to accurately say that ICE candidate/network addresses may be present for P2P diagnostics.

### Important correctness/diagnostic improvements

5. Restart contamination: the global captured peer-connection collection survives a run reset while per-run report state is reset. Old PCs can contaminate a later run. Clear/re-scope captured PCs by run generation.
6. Candidate-pair detection should use the standards path: prefer transport.selectedCandidatePairId; keep selected/nominated as compatibility/fallback signals. Do not depend on Firefox-specific selected semantics.
7. The diagnostic renderer is expensive but verbosity is intentional. The project owner explicitly wants verbose event logging and saves JSON rather than treating UI verbosity as a problem. Do not remove or substantially reduce event verbosity merely for mobile. If performance becomes an observed problem, optimize rendering without reducing captured evidence.
8. Historical vs current connectivity fields: peer-connected, candidate-pair-succeeded and data-channel-opened are effectively ever-happened flags. Either rename them explicitly as historical/ever-observed or add current-state fields.
9. remotePeerKnown is historical. Seeing a peer ID does not prove a currently connected peer. Keep peer discovery separate from current connectivity.
10. P2P-only terminology: simultaneousHttpDownloads: 0 disables HTTP media-segment downloads; it does not make all HTTP activity disappear because manifests/playlists still use HTTP. Prefer P2P segment-only when describing the mode.
11. Internal arrays can grow without bound: candidate records, candidate-pair records, scheduler events and transfer segment records should eventually be bounded or pruned for long runs. Public report truncation does not itself reclaim memory.
12. Generic P2P event logging duplicates high-frequency specific events. Preserve evidence, but consider reducing duplicate representation only after event signatures are fully validated.
13. Split proof categories: tracker discovery; WebRTC/ICE connectivity; P2P transport/data exchange; P2P media segment; controlled variant/identity match. Actual P2P segment delivery is stronger media evidence than any single low-level WebRTC flag.
14. No TURN is intentional for the direct-WebRTC experiment. Do not add TURN merely to make a two-device test pass. Direct connectivity should be characterized first; a later TURN test can be a separate experiment.
15. Do not label NAT/CGNAT conclusions too strongly. srflx candidates plus failure to establish a selected pair indicate a WebRTC connectivity problem but do not by themselves prove CGNAT.
16. Controlled rendition matching should include codecs. Width/height/bitrate are useful, but p2p-media-loader v4 stream identity also incorporates codec information. Record and compare codecs when determining whether two segment swarms are truly the same stream variant.
17. The target variant is the stream variant, not an assumption that every HLS segment independently advertises resolution. HLS media segments are members of a playlist/variant; the variant's declared attributes identify the rendition. The actual segment bytes are encoded media for that rendition. For stronger diagnostics, record the selected playlist/variant attributes and codec information alongside segment identity and infoHash.
18. Observed p2p-media-loader runtime config is valuable. Continue capturing p2pEngine.core.getConfig(). This is better evidence than only reporting requested settings.
19. Tracker configuration and tracker peer discovery must remain separate. A configured tracker is not necessarily reachable/used. Report actual tracker events independently for each configured WSS tracker.
20. Stall rescue changes the experiment mode. After HTTP rescue, the run is no longer pure P2P segment-only. Preserve the phase transition in the report.

## Project owner's explicit decisions incorporated

- Keep the environment block near the top of exported JSON. It is useful for distinguishing test environments and peers.
- Keep verbose event logging; JSON export is the intended way to handle the large event log.
- Keep detailed ICE/network candidate information for instrumentation.
- Do not fingerprint browsers.
- Distinguish browser/device instances using the existing non-hardware browser instance ID and actual P2P peer ID.
- The Mux demo is a natural public-swarm fixture for the early broad experiment.
- The phased progression toward known peers, fixed variants, and custom swarm IDs is intentional.

## Next implementation baseline

Before the next serious run, fix the four high-priority implementation items:
1. eliminate duplicate HLS event binding;
2. make controlled seed/receiver semantics explicit while preserving the natural-swarm experiment;
3. instrument locally-created data channels and/or WebRTC stats;
4. correct the ICE candidate export description.

Then analyze v10 results using the evidence ladder:

configured tracker -> observed tracker peer -> RTCPeerConnection -> ICE candidates -> selected/nominated candidate pair -> data channel -> p2p-media-loader peer -> P2P bytes -> P2P segment -> controlled variant/infoHash match

Do not require every lower-level milestone for every proof category; use the strongest evidence actually observed.