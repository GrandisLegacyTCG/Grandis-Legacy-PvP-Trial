# Root Cause Audit — PvP v3.38

- Hero/Legacy size: structural stage mismatch; fixed by reusing Hero `hero-card-anchor`, not by another sizing override.
- Heal feedback: server transport discarded semantic `heal`; fixed at authoritative event transport and client mapping.
- SGH/Escape Arrow: nested parent/child Response modal lifecycle conflicted with normal Response commit semantics; replaced by generic committed Response + separate mandatory payment framework.
- Authoritative source loading: server still referenced old v0.14.2/v0.13.2/v1.89 filenames/hashes despite new client metadata; corrected at the server source gate itself.
- Grand Arbalest/Rapid Chamber: core draw logic was already correct; retained and regression-tested rather than rewritten.
