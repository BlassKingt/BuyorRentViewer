# SDD ledger — plan: docs/superpowers/plans/2026-10-20-buy-or-rent.md

User authorized direct implementation after analysis. Superpowers installed via skill-installer Git fallback; initial ZIP transfer incomplete.
Ruling: Reuse existing non-Git calculator directory and local before snapshots instead of creating a worktree — no repository exists — cost if wrong is local rollback rather than Git rollback.
Ruling: Use agreed design and direct-start authorization without repeating plan approval — user explicitly requested start — visual direction can be revised after this first version.
Ruling: Default unconfirmed exemption is not exempt; surcharge12% is clearly adjustable conservative scenario; selling fee1% is a visible example — avoid hidden free sale — user may need to replace estimates.

| Pair/task | Interface check | Result |
|---|---|---|
| Task1/2 | Scenario/Simulation/scan API | Task1 report is required before UI starts |
| Task2/3 | selectors/assets/screenshots/docs | final checks use completed UI |
| Task1 | model tests vs design | preserve financial invariants, replace time-off requirements |
| Task2 | UI tests vs design | no mandatory extra basic numeric inputs |
| Task3 | validation vs docs | no claim of deploy or approved character art |

Task1: complete. 42 unit tests and build pass. Fresh model review Spec PASS/Quality PASS; independent 500-scenario reconciliation pass. See model-report.md and model-review.md.
Task2: complete. One focused fix wave addressed provident start label, source labels, price-scan dependency and opportunity-cost wording. New regression RED then GREEN. Final42unit/9browser/build passed2026-10-21. Original usage-limit interruption recovered.
Task3: complete. Final independent review Spec PASS / Quality PASS supersedes initial CHANGES REQUIRED. No remaining actionable blocker. Root inspected latest desktop/mobile screenshots; documentation reflects delivered model. Local preview requested in Codex (queued); no public deployment or Hub verification.

Assets: base and chibi generated with built-in imagegen, copied into public/mascot and documented in docs/character-assets.md. Additional expression assets deferred until visual feedback; first version uses two identity-consistent forms and CSS motion.
Installation verification: all15 installed Superpowers directories contain SKILL.md; available through automatic discovery next turn, read directly this turn.
Independent smoke checks (rounded yuan): default5yr own/rental +18278, 23mo -109781, 24mo -11119, default mortgage5yr -144416. All ledger gaps <1e-8. Default unknown exemption tax0 arises from flatprice/no taxable gain, not assumed exemption.
README updated to V2 model/limitations and static deployment; docs/review snapshots excluded from Git via .gitignore.
Ruling: Keep reviewed monthly provident behavior and clarify first-month start in UI — original “之后” was misleading — avoids changing financial results, user can disable simultaneous monthly deductions when reserving balance.
Final verification evidence: ui-report.md correction wave records42unit375ms/9browser36.4s/build285.75kBJS. Browser .last-run.json read by root is passed. Final-review.md contains scoped acceptance. Local review snapshots retained for recoverability because no Git history exists; ignored in .gitignore.
