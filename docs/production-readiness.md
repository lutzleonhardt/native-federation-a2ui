# Not production-ready: what a real deployment needs

This is a demo. Two threats are worth keeping apart: the integrity of the code a
remote delivers, and the content of the vocabulary it announces.

**Code.** A remote is fully trusted code: it runs inside the shell's page. The
trust boundary is the manifest. Native Federation and import maps can check
integrity through SRI hashes. This demo does not switch that on, and the
trade-off is an honest one: SRI protects only if the hash comes from the host
side, and that collides with independent deployment, because the hash changes
with every deploy of the remote. The way out is a registry with signed hashes.

**Vocabulary.** New is the path through the prompt: a remote's descriptions are
pasted into the system prompt. Here the damage is bounded, because the agent
server has no tools. The LLM can only call the three client tools in the
browser.

What is built:

- The URL is a whitelist: it can narrow the manifest, never add a remote.
- A runtime check of what a remote delivers (`isAgentCapability`).
- Schema validation at the tool boundary, before any tool code runs.
- Rollback of a surface that fails a guard.
- A correction budget: three per user turn.

What a real deployment needs:

- Authentication in front of the agent endpoint. CORS is not access control.
- A budget and a rate limit per user, plus cost caps on the provider side.
- Limits on input length, `max_tokens` and step count.
- Topic binding, with off-topic scenarios in the eval.
- A length limit and a schema for remote descriptions, and delimiters around
  them in the prompt.
- A review of the vocabulary as part of accepting a remote.
- A defense against injection through data content: the name and the city of
  the first search hit reach the LLM.
- Logging of what the model saw.

The hosted demo needs none of this. It runs in replay mode: no live model, no
key, no server. Free text gets the answer "not recorded".
