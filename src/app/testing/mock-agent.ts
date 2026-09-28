import { AbstractAgent } from '@ag-ui/client';
import type { BaseEvent, RunAgentInput } from '@ag-ui/core';
import { from, type Observable, type ObservableInput } from 'rxjs';

/** Chooses the events of one run; `runIndex` counts the runs this agent has seen. */
export type MockRunScript = (input: RunAgentInput, runIndex: number) => ObservableInput<BaseEvent>;

/**
 * Scripted AG-UI agent: the test seam behind `ASSISTANT_AGENT`. Every run's
 * input is kept so tests can assert what the shell would have sent. The event
 * helpers a script needs live in `replay/scripted-run.ts`.
 */
export class MockAgent extends AbstractAgent {
  readonly inputs: RunAgentInput[] = [];

  constructor(private readonly script: MockRunScript) {
    super({ agentId: 'assistant' });
  }

  override run(input: RunAgentInput): Observable<BaseEvent> {
    const runIndex = this.inputs.push(input) - 1;
    return from(this.script(input, runIndex));
  }
}
