# Grandis Legacy PvP S0 RC39 — Repo RC6 P3 (13 November 2026)

**Build:** `gl-s0-pvp-rc39-beta2-repo-rc6-p3-2026-11-13`  
**Networking:** RC6 Stage 2 single WebSocket (unchanged); gameplay authoritative on server.

This release integrates eight PvP Part 3 presentation bug reports. It restores public Card Played history from the committed server journal (including DEF/BLOCK/DODGE and reactions), adds clickable detail, restores server-confirmed opponent card-flight audio and animations, adds post-Response true HP loss and status numbers including nonprinted/variable attacks such as Arrow Barrage, fixes Item/Protection arrow routing, adds owner-only notices when the opponent moves a card from Hand/Deck/Field to Discard, removes redundant Coin Flip text and silent in-flight wait toast, and holds outcome notices one additional second vs the VS AI base.

**Important baseline note:** The latest RC5 ZIP was visible in the project Library but its raw bytes were not available to the working environment. This release was built from the provided **Repo RC4 full ZIP**, with the two RC5 corrections independently reproduced from the official RC5 QA notes (final attack Mana continuation accepted; blind Mana draft no full Battlefield DOM redraw). It is NOT a byte-for-byte modification of the original RC5 archive.

See `docs/RC39_PVP_REPO_RC6_P3_RELEASE_2026-11-13.md` for focused QA and testing limitations. No GitHub push and no Northflank deploy were performed.
