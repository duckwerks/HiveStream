# MP4 URL to P2P

HiveStream now has a first product implementation of the intended pipeline:

MP4 URL -> FFmpeg -> HLS VOD/fMP4 -> hls.js 1.7.0 + p2p-media-loader-hlsjs 4.0.0 -> WebRTC P2P.

## Backend

`server/server.js` accepts `POST /api/ingest` with:

`{"sourceUrl":"https://u.pone.rs/sahrrklr.mp4"}`

FFmpeg packages the source as HLS VOD using fragmented MP4 segments. Compatible media is stream-copied; it is not unnecessarily transcoded.

The response contains `mediaId`, `swarmId`, and `manifestUrl`.

Requirements: Node.js 20+ and FFmpeg on the server.

## Browser

`src/hivestream-client.js` uses the pinned HLS/P2P stack and consumes the bootstrap record. The bootstrap is metadata only and can be sent through CyTube chat using the `HS1:` prefix.

`src/cytube-hivestream.js` provides the backend-to-chat-to-player adapter.

## CyTube wiring

The adapter intentionally uses CyTube chat as the control-plane bootstrap and does not yet replace CyTube playlist/player internals. A CyTube external JS integration can create a controller, call `ingestAndBootstrap()` for an MP4 URL, and pass incoming chat messages to `handleCyTubeChatMessage()`.

The next integration step is to bind this media-plane adapter to the existing CyTube player lifecycle so a HiveStream bootstrap becomes a normal room media item.

## P2P evidence

The browser client records peer connect/close and segment-loaded events. The raw P2P engine event details are preserved in `state.events`; byte attribution is only counted when the engine reports a source/byte field. This avoids treating peer discovery alone as proof of segment transfer.