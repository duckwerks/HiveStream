# Phase 1 — P2P Proof

**Status:** Ready for runtime testing  
**Goal:** Prove that media segments actually move between two browsers over WebRTC.

## What this experiment proves

The Phase 1 experiment is deliberately narrower than HiveStream itself.

Two browser instances load the same HLS stream and use the same explicit swarm ID. P2P Media Loader handles tracker discovery, WebRTC peer connections, segment requests, and segment exchange.

The test page measures:

- peer connections
- HTTP downloaded bytes
- P2P downloaded bytes
- P2P uploaded bytes
- segment load events
- segment IDs observed
- playback state

A peer connection alone is **not** considered proof of P2P media delivery. The decisive evidence is media bytes or media segments reported as arriving through the P2P path.

## Experiment

```text
Browser A
   │
   ├── HLS HTTP bootstrap
   ├── P2P Media Loader
   └── WebRTC
          │
          │ media segments
          ▼
Browser B
   │
   ├── P2P Media Loader
   └── HLS playback
```

Both browsers must use:

```text
same HLS stream URL
same swarm ID
```

Start Browser A first so it has an opportunity to acquire media segments before Browser B joins.

## Test page

`experiments/phase-1-p2p-proof.html`

The page is intentionally standalone. It is not the HiveStream application and should not acquire application architecture prematurely.

## Recommended mobile test

Use two real browser instances/devices rather than an Android emulator. WebRTC behavior can differ substantially under emulator NAT.

A simple local HTTP server is preferable to opening the HTML file directly because it gives the page a normal HTTP origin.

Example from Termux after cloning the repository:

```bash
cd HiveStream
python -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/experiments/phase-1-p2p-proof.html
```

For two physical devices, the server must be reachable from both devices on the local network, for example by binding the server to the host's LAN interface and opening the host's LAN address.

## Test procedure

### Browser A

1. Open the Phase 1 page.
2. Leave the default HLS URL unless another known-good CORS-enabled HLS stream is being tested.
3. Leave the default swarm ID.
4. Press **Start P2P Player**.
5. Allow the player to acquire several segments.
6. Note the HTTP byte counter and segment count.

### Browser B

1. Open the same Phase 1 page.
2. Use the exact same HLS URL.
3. Use the exact same swarm ID.
4. Press **Start P2P Player**.
5. Wait for a peer connection.
6. Continue playback long enough for segment requests to occur.
7. Watch for **P2P downloaded** and/or **Segments via P2P** to become non-zero.

### Strongest evidence

The strongest Phase 1 result is:

```text
Peers connected > 0
P2P downloaded > 0
P2P uploaded > 0
Segments via P2P > 0
```

All four are not necessarily required on the same browser at the same moment. In particular, one browser may act as the HTTP bootstrap source while the other receives P2P segments.

## What to copy back for analysis

Press **Copy JSON Results** on each browser and provide both result objects.

The useful fields are:

```text
peers
bytes
segments
playback
verdict
```

Do not interpret a zero P2P result as a library failure until we inspect:

- whether both browsers joined the same swarm
- whether the tracker discovered the peer
- whether the browsers established WebRTC
- whether the first browser actually retained requested segments
- whether the second browser requested segments that the first browser possessed
- whether the public test stream permits the required CORS/HLS behavior
- whether the browser/network is preventing the WebRTC path

## Evidence classification

### PROVEN

A result is **runtime-proven** when a browser reports actual P2P segment/byte traffic from the P2P Media Loader event path.

### STRONG INFERRERENCE

A connected WebRTC peer without P2P media bytes proves peer connectivity, but not media transfer.

### UNPROVEN

A browser displaying a P2P-enabled player, or a tracker reporting a peer, does not by itself prove that video bytes crossed the WebRTC data channel.

## Phase 1 exit condition

Phase 1 is complete when we have a reproducible two-browser run demonstrating actual media bytes moving through the P2P path.

After that, the next step is **Phase 2 — Persistence**:

```text
HTTP/P2P segment acquisition
        ↓
HiveStream-owned persistent storage
        ↓
page reload / later session
        ↓
stored segment inventory
        ↓
P2P reuse
```

Do not add local-file ingestion, WebTorrent interoperability, libp2p, token economics, or CyTube integration until the Phase 1 proof is established.
