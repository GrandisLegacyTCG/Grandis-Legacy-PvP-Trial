# Performance Budget — Grandis Legacy PvP v3.33

Date: 2026-09-04

## Goal

Keep the authoritative PvP room responsive on the low-vCPU Northflank services while retaining the new deployment handshake, player identity, internet signal, and VS AI battle presentation parity.

## Runtime decisions

- The ~12 MB shared browser/runtime source is compiled once into a `vm.Script` at Node process boot. Each match still receives an isolated VM context, but match start reuses the compiled script.
- Server-side browser rendering remains suppressed. Node resolves gameplay only; it does not build battlefield HTML.
- WebSocket per-message compression is explicitly disabled. PvP state packets are small enough that compression CPU is not worth the latency cost on a 0.1-vCPU room.
- WebSocket payloads are capped at 1 MiB.
- TCP `NoDelay` is enabled for WebSocket connections so small intent / acknowledgement frames are not intentionally buffered.
- Player internet-signal RTT sampling runs once every 10 seconds and only for actual players. Spectators do not generate signal-sampling traffic. A ping receives only a pong; it never triggers a full room snapshot/broadcast.
- The existing acting-player priority broadcast remains: the acting player receives the authoritative snapshot first and spectator serialization is deferred to the next event-loop turn.
- No metrics/tracker loop was added to the Node room server.
- Room diagnostics may retain up to 120 entries internally, but normal snapshots expose only the latest 40 to avoid repeatedly serializing old network-room logs on every gameplay broadcast.

## Size / traffic sanity check

Using the bundled VM harness with a normal Starter-vs-Starter opening state, the canonical board JSON measured approximately **6.3 KiB** before recipient metadata/masking. This is intentionally small enough to favor uncompressed low-CPU WebSocket delivery.

At the maximum two active players, the new signal sampler creates at most **12 application pings + 12 pongs per minute per room** (one ping every 10 seconds per player). It does not cause room broadcasts.

## What is not claimed

This sandbox cannot install/run the `ws` dependency, so a real two-browser Northflank latency benchmark was not executed here. The performance guarantees above are architecture/static-runtime checks plus local VM/runtime tests. Production latency still depends on Northflank region, client network, and successful deployment of the same v3.33 build to both room services.
