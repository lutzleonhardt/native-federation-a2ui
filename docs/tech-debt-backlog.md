# Tech-debt backlog

Standing register of pre-existing code-health findings surfaced by the `/cs` gate. Nothing drains it automatically; a refactoring task consumes entries deliberately.

- [ ] `agent/src/config.ts` — `parseProvider` (Complex Conditional, 2 complex conditional expressions, L78) — pre-existing; grazed by task 7 · source: cs
- [ ] `shared/capabilities/surface-action.ts` — `dispatchSurfaceAction` (Excess Number of Function Arguments, Arguments = 5, L16) — pre-existing; grazed by task 1 · source: cs
