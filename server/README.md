# HiveStream ingestion server

The server turns a remotely accessible MP4 URL into the HLS representation consumed by the pinned HiveStream browser stack.

## Local

Install Node.js 20+ and FFmpeg, then:

```sh
cd server
npm start
```

## Docker

From the repository root:

```sh
docker build -t hivestream-server -f server/Dockerfile .
docker run --rm -p 8787:8787 -e PUBLIC_BASE_URL=http://localhost:8787 hivestream-server
```

For two remote browsers, set PUBLIC_BASE_URL to the externally reachable HTTPS origin of this service.

## Ingest

```sh
curl -X POST http://localhost:8787/api/ingest \
  -H 'content-type: application/json' \
  -d '{"sourceUrl":"https://u.pone.rs/sahrrklr.mp4"}'
```

The response is the HiveStream bootstrap object. Its manifestUrl is the generated HLS VOD manifest and its swarmId identifies the P2P stream.

## Runtime test

Open experiments/mp4-to-p2p.html from the GitHub Pages site, enter the public ingestion-server URL, and use the supplied MP4 URL.

Open the page in two real browsers/devices at the same time. Both must use the same bootstrap/swarm and manifest. The page exposes the P2P engine events and byte/segment state.

The P2P library documents onPeerConnect, onSegmentLoaded, and onChunkDownloaded; the latter is the byte-level event used by the library to distinguish download source and peer ID. The current browser client records these engine events for the Phase 1 proof.