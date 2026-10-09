# QA — Grandis Legacy PvP v3.75.9

Automated release suite covers:

- two-donor architecture lock and PvP v3.51 authority hashes;
- single-lobby routing and absence of active third-donor references;
- 20-character player-name cap;
- requested Seat 1 / Seat 2 kick permission policy;
- canonical v3.51 compact 28x28 circular kick control;
- desktop lobby at 1600x720 and 1366x768 with no body/lobby vertical scrolling;
- hidden room-switch and Deck Builder / VS AI navigation controls;
- real browser pre-game stage ownership: v3.51 surface visible and v6 gameplay surface inactive during Coin Flip;
- Player 2 Coin Flip choice enabled and sending the canonical `choose-coin-flip` intent;
- Coin Flip overlay displayed over the battlefield background;
- no Hero/Legacy flight animation during Coin Flip;
- authoritative Opening Hand / Starting Shards / first Draw+Regen presentation completing before the v6 gameplay surface activates;
- post-opening v6 identity blocks: opponent top-left (connection bar right), local player bottom-right (connection bar left);
- Opening/Draw not leaking into Card Played;
- canonical gameplay including paid Skill, Meditation, Event on Round 1, Mana/Class-Shard payment and Response backbone;
- authoritative intent ownership/revision handling;
- defeat/casting lifecycle and advanced runtime systems;
- 200/200 canonical card runtime coverage;
- two-client server simulation for Coin Flip/Opening, hidden-hand privacy, and kick timing.

A real two-browser pass remains required before live promotion, especially for network latency, reconnect and physical animation feel on the deployment environment.
