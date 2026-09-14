# Improvements Register

Unscheduled follow-ups promoted from task logs. Nothing reads this
automatically; it feeds `/plan` only when a task is deliberately opened
from it.

- [ ] Timeline/Map label collision layout for densely clustered items (alternating rows are not enough for 3+ near-same-date markers; real fix is measured collision avoidance, M3 material) — from task 5, scope m1-spike · source: wrap-up
- [x] Wire RENDER_FAILURE_HANDLER to the Task-7 chat correction run; the default handler only logs — from task 6, scope m1-spike · source: wrap-up · done in task 7
- [x] Verify createFrontendTool/registerFrontendTool with the real CopilotKit provider during Task-7 chat integration — from task 6, scope m1-spike · source: wrap-up · done in task 7
- [x] Implement meToContextEntry(me) when assembling the Task-7 agent context (carried from Task 3) — from task 6, scope m1-spike · source: wrap-up · done in task 7
- [x] Align the shell development port and agent CORS origin before Task-7 integration: the user-local shell port is 4300 while SHELL_ORIGIN is 4200 (carried from Task 5) — from task 6, scope m1-spike · source: wrap-up · done in task 7
- [ ] CopilotKit sits in the initial bundle (4.4 MB raw / 1.5 MB transfer) because @copilotkit/core lacks sideEffects: false; a route-level CopilotKit would need its seven root consumers moved too; budget raised to 5/6 MB meanwhile — from task 7, scope m1-spike · source: wrap-up
- [ ] Revisit the two initAgentStore workarounds (tool-result re-publish after onToolExecutionEnd, correction run deferred by a macrotask) on the next CopilotKit upgrade; both patch 0.3.1 behavior — from task 7, scope m1-spike · source: wrap-up
- [ ] The eval's A3 prompt example is close to the request-3 answer, so the gate measures example-following rather than derived wiring; vary the request phrasing or thin the example — from task 9, scope m1-spike · source: wrap-up
- [ ] Prompt caching is not enabled (no `cacheControl` in the provider options); the prompt is already ordered stable-first for a breakpoint behind the vocabulary — from task 9, scope m1-spike · source: wrap-up
- [ ] `ng lint` covers only `src/**`, so `eval/` and `agent/` stay unlinted — from task 9, scope m1-spike · source: wrap-up
- [ ] A rename of the `ag-ui` request-context key by `@ag-ui/mastra` would silently empty the prompt's vocabulary section — `agent.spec.ts` sets the key itself and stays green; a spec driving the real adapter (`MastraAgent.applyInputContext`) would catch it — from chore-agent-contract, scope m1-spike · source: wrap-up
