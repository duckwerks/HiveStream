# HiveStream Phase 1B — v10 Natural-Swarm WebRTC Connectivity Milestone

**Document:** Milestone record / experimental finding  
**Date:** 2026-09-21  
**Authors:** Ed (project owner) and ChatGPT (GPT-5.6 Luna, OpenAI)  
**Project:** HiveStream / P2P-Theater  
**Repository:** `duckwerks/HiveStream`  
**Diagnostic revision:** Phase 1B v10 — Natural Swarm Diagnostic  
**Status:** Milestone established; direct WebRTC connectivity remains the next blocker

---

## 1. Purpose

This document records a significant Phase 1B milestone reached during systematic analysis of the v10 natural-swarm experiments.

The experiment was designed to answer a broad question first:

> Can browser-based P2P video infrastructure discover other real peers and progress far enough toward WebRTC connectivity to exchange media, using a naturally populated public swarm?

The Mux HLS demonstration stream was intentionally used as a **natural public-swarm fixture**, rather than treating the experiment as only a two-device bootstrap test.

The project is progressing toward increasingly controlled experiments:

1. Natural swarm + selected stream variant.
2. Known-peer testing.
3. Known peers + fixed stream variant.
4. Known peers + fixed variant + custom swarm ID.
5. Protocol-conformant instrumentation and controlled P2P media proof.

This milestone concerns the boundary reached between steps 1 and 2.

---

## 2. Provenance and authorship

This record is intentionally explicit about authorship so that future developers and LLM-based coding/research systems can distinguish project-owner decisions from analysis generated during development.

### Human project owner

**Ed** — HiveStream / P2P-Theater project owner.

Ed defined the experimental purpose, testing philosophy, phased progression, diagnostic requirements, and project decisions recorded here.

### AI analysis collaborator

**ChatGPT — GPT-5.6 Luna (OpenAI)**.

ChatGPT performed the source-level analysis of the v10 diagnostic and systematic analysis of the exported experiment results, then prepared this milestone record from those findings.

### Provenance rule

This document is a project record, not an anonymous generated note. Future contributors should preserve authorship and date information when extending or correcting it.

The human-authored experimental intent and project decisions take precedence over AI interpretation. AI-generated technical conclusions should be re-verified against source code, library versions, and new experiment results when the implementation changes.

---

## 3. Experimental fixture

**HLS fixture:**

`https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`

The fixture was treated as a naturally populated public P2P environment. The purpose was not to assume that only the two locally controlled devices existed in the swarm.

The v10 diagnostic configured three WSS WebTorrent-compatible trackers:

- `wss://tracker.novage.com.ua`
- `wss://tracker.webtorrent.dev`
- `wss://tracker.openwebtorrent.com`

The diagnostic records actual tracker events independently rather than treating configuration as proof of tracker use.

---

## 4. Milestone finding

### The two actual test devices were proven to discover one another through the P2P swarm.

This is the central milestone.

The laptop and phone did not merely report unrelated public peers. Their actual p2p-media-loader/WebTorrent peer IDs were observed reciprocally:

**Laptop P2P peer ID**

`-PM0400-WSvFeUC1CKtO`

**Phone P2P peer ID**

`-PM0400-ItUwRm1m2lyJ`

The laptop observed the phone peer ID, and the phone observed the laptop peer ID.

Therefore the experiment establishes:

**Tracker/swarm peer discovery between the two controlled devices is working.**

This is materially stronger evidence than simply seeing a generic peer count or a public peer event.

---

## 5. Tracker discovery is working

The relevant runs recorded peer events associated with multiple configured trackers, including:

- `tracker.webtorrent.dev`
- `tracker.openwebtorrent.com`

This establishes that the experiment is not merely assuming that the first configured tracker, Nova, is responsible for all observations.

The diagnostic distinction is important:

**Configured tracker ≠ observed tracker activity ≠ successful WebRTC connection.**

The v10 results provide evidence for the middle stage: actual peer discovery events were observed.

---

## 6. ICE candidate gathering is working

The controlled devices also gathered and exchanged ICE candidate information.

### Phone

Observed candidate examples included:

- host candidate: `192.168.1.71`
- server-reflexive candidate: `50.120.51.163`

The laptop recorded the phone's candidates as remote candidates.

### Laptop

The laptop exposed a server-reflexive candidate including:

- `149.88.30.116`

The phone recorded that address as a remote candidate.

The results therefore establish:

- STUN candidate gathering is functioning.
- host and server-reflexive candidates are being produced.
- candidate information is reaching the opposite WebRTC side.

This is **not** evidence that a usable ICE path has been established.

---

## 7. The current boundary: ICE connectivity

The experiment did **not** reach a successfully selected ICE candidate pair.

Observed WebRTC progression included states such as:

### Phone

`checking → connecting → disconnected`

### Laptop

ICE checking/connection attempts followed by p2p-media-loader data-channel timeout behavior.

No successfully selected candidate pair was recorded.

Therefore the current evidence boundary is:

> **Peer discovery and ICE candidate exchange work, but direct WebRTC/ICE connectivity has not yet been established.**

This is currently the most important technical boundary identified by the v10 experiment.

---

## 8. Data-channel connection was not proven

No successful data-channel opening was recorded.

The laptop recorded a data-channel open timeout, while the phone ultimately recorded ICE disconnection.

This means the experiment has not yet established the next link in the chain:

`ICE selected pair → data channel → P2P transport`

An important instrumentation caveat remains: v10 primarily listens for the `datachannel` event. Because locally created data channels can exist without producing the diagnostic event in the expected direction, the next diagnostic revision should instrument `createDataChannel()` and/or WebRTC statistics as well.

Thus:

**No observed data-channel-open event is evidence of no observed open event, not absolute proof that no data channel ever existed.**

---

## 9. No P2P media transfer was established

The relevant fixed-rendition hybrid experiment selected:

- width: **848**
- height: **480**
- bitrate: **836280**

The run recorded approximately:

- 75 HTTP segment starts
- 51 HTTP segment loads
- 0 P2P segment starts
- 0 P2P segment loads
- 0 P2P bytes
- 0 connected P2P peers

A much longer laptop run, approximately 746 seconds, likewise produced approximately:

- 64 HTTP segment starts
- 64 HTTP segment loads
- 0 P2P segment starts
- 0 P2P segment loads
- 0 P2P bytes

Repeated connection attempts and timeouts occurred, but simply waiting longer did not produce P2P media transfer.

Therefore:

**P2P media delivery has not yet been demonstrated.**

This is not evidence that the HiveStream P2P media architecture is impossible. It identifies the current lower-level failure boundary that must be resolved before P2P segment delivery can occur.

---

## 10. Controlled rendition instrumentation is working

The v10 diagnostic successfully locked/reported the intended Mux rendition:

**848 × 480 @ 836,280 bitrate**

The master playlist contains multiple variants, including 720p, 320×184, 512×288, 848×480, and 1080p. The fixed test selected the intended 848×480 variant.

This is an important prerequisite for later controlled swarm experiments.

One remaining improvement is codec capture. p2p-media-loader v4 stream identity incorporates codec information in addition to properties such as bitrate and dimensions. The current instrumentation showed codec information as `null` in the relevant reports, so exact codec-level identity matching remains incomplete.

---

## 11. Multiple stream identities were observed

The natural-swarm results contain multiple infoHash values, including examples such as:

- `Dd+yrwrnofWI3vWhfz1l`
- `7NwtzJAqpJsMdvx7ddbS`
- `i0q7IwL7towfhu4Xnofx`

This is consistent with p2p-media-loader v4's stream identity model, in which stream identity is derived from variant properties and associated stream/swarm information.

This is significant because the natural Mux fixture contains multiple HLS variants. Seeing multiple identities should not automatically be treated as contradictory evidence. It is expected that different stream variants can map to different P2P identities.

For the later controlled tests, the exact variant must be held constant.

---

## 12. Evidence ladder

The Phase 1B diagnostic can now be understood as an evidence ladder:

`configured tracker`
→ `observed tracker peer`
→ `actual known-peer discovery`
→ `RTCPeerConnection`
→ `ICE candidates`
→ `selected/nominated ICE candidate pair`
→ `data channel`
→ `p2p-media-loader peer`
→ `P2P bytes`
→ `P2P segment`
→ `controlled variant/infoHash match`

### Current position

| Evidence stage | v10 result |
|---|---|
| Configured tracker | **Observed** |
| Tracker peer events | **Observed** |
| Laptop ↔ phone peer discovery | **PROVEN** |
| RTCPeerConnection | **Observed** |
| ICE candidate gathering | **PROVEN** |
| ICE checking/connecting | **Observed** |
| Selected ICE candidate pair | **Not observed** |
| Data-channel open | **Not observed** |
| Connected P2P peer | **Not observed** |
| P2P bytes | **0** |
| P2P segment | **0** |
| Controlled P2P media proof | **Not yet demonstrated** |

The milestone is therefore not “P2P video works.”

The milestone is:

> **HiveStream has now demonstrated reciprocal cross-device peer discovery and ICE candidate exchange in the natural public swarm, and the experiment has localized the next unresolved boundary to direct WebRTC/ICE connectivity before data-channel/P2P media transfer.**

---

## 13. What this rules out

The results substantially weaken several earlier explanations:

### Not simply “the tracker cannot find the other device”

The two devices found each other's actual P2P peer IDs.

### Not simply “STUN is completely broken”

Both sides gathered host and server-reflexive candidates and observed candidates from the other side.

### Not simply “the browser never creates WebRTC connections”

RTCPeerConnection activity and ICE state transitions were observed.

### Not simply “we did not wait long enough”

A substantially longer run still produced repeated connection attempts without P2P bytes.

---

## 14. What remains unresolved

The current evidence does **not** establish which precise direct-connectivity mechanism is responsible for the failure.

Possible classes of causes include:

- NAT behavior.
- Firewall policy.
- UDP filtering.
- Wi-Fi/client isolation.
- Browser/WebRTC policy.
- ICE candidate-pair handling.
- Signaling timing.
- p2p-media-loader/WebTorrent WebRTC negotiation behavior.
- Network-specific restrictions.

The current results do not justify assigning the failure specifically to CGNAT.

The next experiments should collect enough candidate-pair, ICE transport, and WebRTC statistics to distinguish these possibilities.

---

## 15. TURN decision

**Do not add TURN to the direct-connectivity experiment yet.**

The current experiment is intentionally testing direct browser-to-browser WebRTC connectivity.

Adding TURN immediately could make the test succeed through relay while hiding the direct ICE failure boundary.

A later experiment can deliberately introduce TURN and answer a different question:

> Can HiveStream establish P2P transport when direct connectivity is unavailable but relay connectivity is available?

That should remain a separate experiment and be clearly labeled as such.

---

## 16. Required v10 diagnostic improvements before the next serious run

The earlier source-level review identified four high-priority implementation fixes:

1. **Remove duplicate HLS event binding.**  
   v10 attaches HLS event handlers through two paths. This can duplicate logs and recovery/level-correction actions.

2. **Make controlled seed/receiver semantics explicit without abandoning natural-swarm testing.**  
   Natural-swarm testing remains valid because existing public peers may already possess segments. A controlled seed test should explicitly ensure Device A acquires the target segments before Device B is expected to receive them.

3. **Improve data-channel instrumentation.**  
   Instrument locally created data channels and/or WebRTC statistics in addition to the `datachannel` event.

4. **Correct ICE export wording.**  
   Detailed ICE/network candidate information is intentionally retained for this diagnostic. The export description must accurately state that network candidate addresses may be included.

Additional improvements:

5. Prefer `transport.selectedCandidatePairId` for selected-pair detection, with compatibility fallbacks.

6. Re-scope captured RTCPeerConnections when resetting a run so old connections cannot contaminate later results.

7. Distinguish historical “ever happened” connectivity flags from current connection state.

8. Keep verbose event logging. The project owner explicitly wants the detailed evidence preserved.

9. Keep the environment block.

10. Continue capturing actual p2p-media-loader runtime configuration.

11. Capture codec information for exact controlled variant matching.

12. Preserve the distinction between configured trackers and trackers that actually generate observed events.

13. Preserve the transition when any stall-rescue logic changes a run from P2P segment-only behavior to hybrid behavior.

---

## 17. Relationship to the controlled seed experiment

The project's intended controlled seed experiment remains valid:

### Device A

- hybrid mode
- fixed target variant
- natural swarm
- play sufficiently long to acquire the target segments
- remain available as a potential seed

### Device B

- P2P segment-only mode
- same fixed target variant
- same swarm identity
- attempt to obtain segments from the seeded peer

However, the v10 natural-swarm results show that the prerequisite lower-level WebRTC connection has not yet been established between the two devices.

Therefore the next efficient step is to characterize/fix direct WebRTC connectivity before using P2P segment transfer as the primary success criterion.

Once a data channel and P2P transport are proven, the seed/receiver experiment can move the evidence one level higher.

---

## 18. Significance of this milestone

This is the first Phase 1B result that cleanly separates the P2P stack into working and non-working layers.

### Demonstrated

- HLS fixture loading.
- Controlled variant selection.
- Multiple tracker configuration.
- Actual tracker peer discovery.
- Reciprocal discovery of the two controlled devices.
- WebRTC connection creation/activity.
- ICE candidate gathering.
- Exchange/observation of host and server-reflexive candidates.

### Not yet demonstrated

- Successful ICE candidate-pair selection.
- Open WebRTC data channel.
- Connected p2p-media-loader peer.
- P2P byte transfer.
- P2P segment delivery.
- End-to-end controlled P2P video proof.

This makes the result useful as a debugging milestone rather than merely a failed media test.

---

## 19. Source experiment records

The findings in this document were derived from the v10 experiment JSON records committed under:

`experiments/`

Important records included:

- `HiveStream-Phase1B-v10-hybrid-Laptop-Chrome-Wifi-2026-09-21T235001999Z.json`
- `HiveStream-Phase1B-v10-hybrid-Laptop-Chrome-Wifi-2026-09-22T001733778Z.json`
- `HiveStream-Phase1B-v10-hybrid-Laptop_Chrome_Wifi-2026-09-21T231842247Z.json`
- `HiveStream-Phase1B-v10-hybrid-Phone-Chrome-Wifi-2026-09-21T234832400Z.json`

The corresponding source-level baseline is:

`docs/HiveStream-Phase1B-v10-Source-Level-Review-Baseline.md`

---

## 20. Historical record

This milestone should be treated as a checkpoint in the HiveStream development history.

Future experiment documents should not rewrite this finding merely because later tests succeed. Instead, later results should be recorded as subsequent milestones that explain how the connectivity boundary was crossed, if and when it is crossed.

### Milestone statement

**As of 2026-09-21, HiveStream Phase 1B v10 has proven reciprocal laptop↔phone P2P peer discovery and ICE candidate exchange through the natural public swarm. The two devices did not establish a selected ICE candidate pair or data channel, and no P2P media bytes were transferred. The next engineering target is therefore direct WebRTC/ICE connectivity, not tracker discovery.**

---

## 21. Authorship / provenance reminder

**Human project owner:** Ed  
**AI analysis collaborator:** ChatGPT — GPT-5.6 Luna (OpenAI)  
**Date authored:** 2026-09-21  
**Purpose:** Permanent project-history and technical provenance record

When this document is copied, summarized, transformed, or used as context for future development, preserve the authorship and original date unless the document is explicitly superseded by a new, dated record.
