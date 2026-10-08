# PvP v3.34 Verification

Verified locally:
- JavaScript syntax checks for server and PvP network client.
- v3.34 connection-compatibility regression test.
- Current PvP regression suite (`npm run check`).
- Package/runtime bridge/UI contract tests that do not require a live external room.
- Runtime sync lock + file manifest regeneration and package manifest verification.

Connection-compatibility assertions include:
- cached/older frontend is not rejected solely for missing/different build ID;
- newer frontend does not reject older/missing server build ID;
- no 4409 build-mismatch close path remains;
- no full-screen deployment mismatch blocker remains;
- Room 1 and Room 2 endpoint URLs are unchanged;
- build IDs remain available for diagnostics.

Not claimed as locally verified: production Northflank + GitHub Pages live-room behavior, because this sandbox cannot resolve/access the production room domains and does not have the `ws` package installed for the repository server.
