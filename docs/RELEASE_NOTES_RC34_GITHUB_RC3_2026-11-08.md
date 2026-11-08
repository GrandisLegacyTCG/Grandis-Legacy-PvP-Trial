# Grandis Legacy PvP Season 0 RC34 — GitHub RC3

**Release type:** staging / live QA candidate, **not FINAL**. **Build:** `gl-s0-rc34-github-rc3-2026-11-08`. **Base:** GitHub RC2 Deadlock Fix.

## Focus

- **BUG-05:** Correct defender-side Response/PASS being refused in browser when `pending` is viewer-safe masked as `UNKNOWN` but public Response owner is local. Keeps server as rule authority; does not expose private state. Regression runs the production browser network adapter and live authority for attacks in both directions.
- **BUG-06:** Shorten PvP PAY flight from 520ms to 340ms; add optional `?pvpPerf=1` ACK/server timing diagnostics. The number of legitimate action steps and server validation are retained. Real Northflank network latency is not measured.
- **BUG-07:** Provide 46px+ smartphone touch action dock for PLAY/PASS/PAY and other visible original controls; no changes to rules. Chromium synthetic fixture PASS, real mobile match unverified.
- **BUG-08:** Show action rejection feedback instead of silently failing.
- **Post-match:** Remove duplicate top-right RETURN TO LOBBY, use server-authoritative BACK TO LOBBY, show countdown, and automatically clear finished match after 60 seconds on server. Keep player's Deck and Formation; reset READY. Two-seat WebSocket verification PASS.
- **Labels:** Replace lingering Local AI / AI Turn presentation with PvP opponent text / available identity.

## Validation

`npm run build:precompress` and `npm run check` PASS in isolated working copy. The existing RC34 20/20 controlled rule regression PASS; new tests cover two-direction Response via production adapter, post-match cleanup, and touch dock static contract. GitHub Actions will also run a Docker build after manual push.

## Known OPEN work

- Mobile **lobby** design still requires work/approval (separate from mobile battlefield action dock).
- Coin Flip/opening/back-of-card/Hero reveal presentation is not yet validated/fixed.
- Full two-browser gameplay in deployed hosting, live mobile touch UX, and real remote Play Card latency are not certified.
- In-memory single room; use one server instance for QA.

See `docs/RC34_RC3_RESPONSE_POSTMATCH_FIXES_2026-11-08.md` for detail and `docs/GITHUB_DEPLOY_RC34.md` for a manual GitHub staging deployment. Do not overwrite the Season 1 repository.
