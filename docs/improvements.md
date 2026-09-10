# Improvements Register

Unscheduled follow-ups promoted from task logs. Nothing reads this
automatically; it feeds `/plan` only when a task is deliberately opened
from it.

- [ ] Timeline/Map label collision layout for densely clustered items (alternating rows are not enough for 3+ near-same-date markers; real fix is measured collision avoidance, M3 material) — from task 5, scope m1-spike · source: wrap-up
- [ ] Wire RENDER_FAILURE_HANDLER to the Task-7 chat correction run; the default handler only logs — from task 6, scope m1-spike · source: wrap-up
- [ ] Verify createFrontendTool/registerFrontendTool with the real CopilotKit provider during Task-7 chat integration — from task 6, scope m1-spike · source: wrap-up
- [ ] Implement meToContextEntry(me) when assembling the Task-7 agent context (carried from Task 3) — from task 6, scope m1-spike · source: wrap-up
- [ ] Align the shell development port and agent CORS origin before Task-7 integration: the user-local shell port is 4300 while SHELL_ORIGIN is 4200 (carried from Task 5) — from task 6, scope m1-spike · source: wrap-up
