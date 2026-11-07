# Legacy v6.91.9 self-tests triage

67 pre-existing or S0-rebased test hooks were originally executed in an isolated VM. Ten passed and 57 failed in that environment. This is not an all-PASS claim nor a claim of 57 gameplay defects.

Categories: Older S1 fixture/source expectation: 12; PASS in Node VM: 10; Unresolved: needs S0 retest: 27; VM DOM fixture missing: 18.

Node VM tests with missing DOM are not substitutes for browser tests. Assertion text embedding S1 card identities, 200-card registry, 55–60-card decks, or deprecated metadata must be retargeted to S0 before interpreting results. Entries classed unresolved remain potential genuine defects. See CSV for each original hook and reason.
