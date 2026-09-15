# DEC-000 — "If HiveStream Were Rebuilt From Scratch": Claude's Independent Assessment

**Authors:** Ed (project owner) & Claude (Anthropic)  
**Date:** 2026-09-14  
**Nature of this document:** an opinion/assessment, explicitly requested, not a source-proven research finding like the WS-0xx series. Written after full context on `duckwerks/cytube-knowledge`, `duckwerks/HiveStream`, and the calzoneman/sync deep-dive series. Intended as input for whoever (Ed, GPT-5.6 Luna, or a future session) next revises HiveStream's architecture docs — not a mandate to change anything already decided.

---

## What holds up and should NOT change

- **HLS + hls.js + p2p-media-loader + WebRTC** as the core stack. This isn't a compromise pick — it's production-validated (PeerTube runs the same library), actively maintained, permissively licensed, and already has a confirmed, non-invasive CyTube integration seam (the Video.js source-handler swap found in the 2026-09-07 checkpoint). No reason to re-open this choice.
- **IndexedDB for metadata/catalog, OPFS as the candidate for segment byte storage** — right direction, but still correctly a hypothesis to benchmark (especially on Android Chrome specifically) rather than a settled fact.
- **Self-hosted WSS tracker over public ones** — already the recommendation; would keep it, and would make it a day-one requirement rather than a "for production" upgrade, given the privacy exposure a guessable public swarm ID creates.
- **Not building out TURN infrastructure right now.** The April-2026 testing showed forced-relay TURN failing across every tested network/VPN combination; direct/STUN-assisted WebRTC is what's actually working. No evidence yet that investing in TURN infrastructure would pay for itself before there's a concrete production need.

## What I'd do differently

### 1. One P2P system, not two

The project keeps WebTorrent on the table as a fallback for local-file seeding if segmentation (MP4Box.js/ffmpeg.wasm) proves too costly. Rebuilding from scratch, I'd resist that from the start rather than treat it as an open door. Running two P2P systems side by side means two swarm models, two peer-discovery paths, and two independent sets of failure modes to debug and reconcile identity across. I'd commit everything — origin-hosted content and locally-ingested files alike — to the same p2p-media-loader pipeline via consistent segmentation, and only reach for WebTorrent if real, demonstrated engineering pain proves that wrong later. A single clean mental model is worth more up front than a shortcut that may never actually be needed.

### 2. Media identity designed first, not "eventually"

`streamSwarmId`/`infoHash` is already recognized as the right seam to hook HiveStream's own content-identity layer into, but it's still sitting as a should-define item rather than something built. Rebuilding from scratch, this would be the literal first deliverable — before any UI work, before CyTube integration — because it's the one decision that's expensive to change retroactively. Get it wrong (or leave it undefined too long) and two users' independently-sourced copies of the same episode never converge into the same swarm, which quietly undermines the entire rewatch-bandwidth thesis the project is built around.

### 3. A SharedWorker from day one, not a per-tab model

If a user has a CyTube room open in two tabs, a naive per-tab P2P implementation means duplicate peer connections, duplicate storage writes, and duplicate swarm participation for the same content. Centralizing P2P/storage state in a single SharedWorker per origin is modest extra work at the start and a real retrofit if deferred until after a per-tab model is already built.

### 4. Tauri over Electron for the eventual desktop persistent-seeder phase

Smaller footprint, direct filesystem access without Electron's overhead — a better fit for a project that's otherwise deliberately staying lean and dependency-light.

### 5. TypeScript for the HiveStream-owned layer specifically

Not a wholesale toolchain change — the rest of the project's workflow (Termux, plain JS) doesn't need to change. But the identity/storage-policy/scheduler code HiveStream itself owns is worth type-checking against `p2p-media-loader`'s own shipped type definitions, especially since that library's API has already changed meaningfully across v2→v4 and will likely keep moving. Paired with `esbuild` (a single fast binary, not an npm-heavy build graph) to keep the toolchain cost low enough that it doesn't fight the Android dev environment.

### 6. Evidence discipline as a rule from commit one

The SOURCE PROVEN / RUNTIME PROVEN / STRONG INFERENCE / UNPROVEN-OPEN / DESIGN PROPOSAL tagging the project settled into partway through is genuinely good practice — better than most research projects at this stage bother with. Rebuilding from scratch, I'd make it a rule from the very first document rather than something adopted after some earlier findings had already blurred the line between confirmed and assumed.

---

## Summary table

| Area | Verdict | Change from current plan? |
|---|---|---|
| Core stack (HLS/hls.js/p2p-media-loader/WebRTC) | Keep | No |
| IndexedDB + OPFS | Keep, but still unproven | No, just don't treat as settled yet |
| Tracker | Self-hosted WSS | No — but make it day-one, not later |
| TURN investment | Hold off | No |
| Local-file P2P mechanism | Single pipeline via p2p-media-loader | **Yes** — drop WebTorrent-as-fallback framing |
| Media identity timing | First deliverable | **Yes** — currently deferred |
| Multi-tab handling | SharedWorker from the start | **Yes** — not currently specified |
| Desktop seeder shell | Tauri | **Yes** — not currently specified |
| Language for HiveStream's own code | TypeScript + esbuild | **Yes** — not currently specified |
| Evidence discipline | Rule from commit one | Timing only — already adopted, just later than ideal |
