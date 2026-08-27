# Agent systems snapshot — 2026-08-27

This is a dated synthesis of a pattern that has become clearer across several owned systems. It is not a claim that one repository is a complete coding-agent platform, and it is not a replacement for the source repositories.

The recurring engineering rule is simpler:

> **Models, chats, and workers are useful but disposable. Durable external state should own the facts that must survive them. Consequential effects need current authority. Recovery starts by reconciling fresh evidence instead of trusting a remembered story.**

That rule did not begin as a single architecture. It kept reappearing while different problems were being solved.

## The decomposition

### Stensibly — responsibility, authority, and continuation

Repository: https://github.com/teamleaderleo/stensibly

Stensibly keeps work, evidence, next actions, blockers, handoffs, claims, leases, and effect receipts outside any one agent process. Browser, REST, MCP, fresh chats, and other workers are clients of the same server-owned ledger rather than competing sources of truth.

The system also separates responsibility from authority. A worker can be the named owner of a task while a current lease or explicit capability grant decides whether it may still perform the next effect. Externally visible GitHub changes use exact preconditions and ambiguous outcomes are reconciled before replay.

The recent repository-attention → mail continuation path is almost comically ordinary on the surface: useful work can wake a fresh session through email. That is intentional. The continuation channel can be boring because the durable project state, evidence, authority, and provider identity live elsewhere.

### Glaeda — disposable execution without disposable truth

Repository: https://github.com/teamleaderleo/glaeda

Glaeda attacks the physical execution side. Unknown work can receive a fresh isolated Linux worker; trusted repeated work can keep expensive project state, compiler state, Git objects, caches, indexes, and services hot when policy permits it.

The VM or workspace is not the durable execution record. Glaeda persists the identity, ownership, mutation intent, recovery debt, and terminal evidence required to decide what is safe after a controller crash or ambiguous external operation.

The useful tension is not `persistent` versus `disposable`. It is which physical state is safe and worthwhile to retain while the execution truth remains recoverable without it.

### Cultist — repository context that is allowed to say `UNKNOWN`

Repository: https://github.com/teamleaderleo/cultist

Cultist asks what repository evidence a worker should recover before changing code, and whether showing that evidence actually changes the next justified action.

Its deterministic analyzers preserve provenance, counterexamples, partial coverage, and explicit `UNKNOWN` instead of promoting a majority convention, historical co-change, stale provider snapshot, or incomplete active-work inventory into policy.

The research loop retains both action-changing and quiet results. Context is useful when it prevents a wrong turn, changes what gets inspected or validated, or saves a later worker from repeating expensive investigation; more context is not automatically better context.

### Elatura — keep the genuine application authoritative

Repository: https://github.com/teamleaderleo/elatura

Elatura treats heavyweight authenticated web applications as another working-set problem. The real signed-in application remains authoritative while browser tabs, windows, processes, and projections may be discarded and reacquired.

The project explores how much application state must remain fully live, what can be represented more cheaply, and how a human or computer-using agent can recover a truthful working view after navigation, discard, crash, or restart.

### Alàlana — deterministic bridges around model judgment

Repository: https://github.com/teamleaderleo/alalana

Alàlana keeps connector work intentionally boring. The first adapter turns selected Discord state into durable private GitHub views and accepts narrowly scoped deterministic write requests through a command mailbox.

There is no model in the sync or effect path. A model can inspect, judge, and author an explicit request; deterministic code owns provider interaction, idempotency, allowlists, receipts, and replay behavior.

### Fieldwork / Linux Fieldwork — evidence that survives the chat

Repositories:

- https://github.com/teamleaderleo/fieldwork
- https://github.com/teamleaderleo/linux-fieldwork

These repositories are where the same philosophy is applied to unfamiliar external code. Chat narration and tool output are transient. A useful investigation leaves exact source identity, reproduction commands, observed results, limits, negative controls, decisions, and a resumable next state.

The strongest output is often not a patch. Sometimes the evidence kills the initial theory, shows that another owner already has the right repair, or proves that a locally correct change would impose more review or compatibility cost than it returns.

## Why the pattern matters

None of these repositories is interesting merely because it uses agents, MCP, browser automation, VMs, or GitHub Actions. Those are mechanisms.

The more durable pattern is a set of failure assumptions:

- the current conversation can lose important state;
- a worker can disappear between observation and effect;
- retries can duplicate non-idempotent work;
- an external provider can return an ambiguous outcome;
- a stale snapshot can look complete when it is not;
- assignment does not prove current authority;
- a cache or warm workspace can be fast and still be invalid;
- a confident explanation can be weaker than one fresh repository fact.

The response is repeatedly the same: make ownership explicit, persist only the truth needed to recover, attach provenance to evidence, fail closed when authority or completeness is unknown, and let replaceable workers reacquire the current state.

## How this changes the résumé story

The useful career claim is **not** “built a secret agent harness.”

A stronger and more literal formulation is:

> Built and dogfood a hosted control plane for long-running human/agent work that keeps task state, handoffs, authority grants, and effect receipts durable across disposable sessions; exposes REST/MCP tools, fences GitHub mutations with exact preconditions, and reconciles ambiguous outcomes before replay.

For a coding-agent infrastructure role, that one Stensibly line can carry the owned-system slot while the rest of the page proves the same instincts under different constraints:

- **Vercel AI SDK** — external AI/developer-tool runtime correctness;
- **Cloud Hypervisor** — lifecycle, storage, device-memory, and ownership boundaries in a mature systems repository;
- **Vite / Workers SDK** — cleanup, restart, credential-freshness, and developer-tool state;
- **Preflight** — instrumentation, falsifiable performance work, runtime intervention, and measured verification.

The wider owned-project family stays useful behind the résumé. Glaeda adds execution and sandbox recovery; Cultist adds repository context and behavioral evaluation; Elatura adds authenticated-browser working-set recovery; Alàlana adds deterministic provider effects; Fieldwork supplies the research discipline tying evidence to source code.

That is enough of a pattern to mention directly now. It is not enough reason to stuff six owned projects onto one page.

## Current boundary

This portfolio does **not** establish frontier-scale production agent-fleet ownership, model training or post-training experience, or Moonshot-scale context infrastructure. Several owned systems are young and heavily dogfooded rather than widely adopted products.

The evidence is narrower and more inspectable: a sustained body of systems work around agent continuity, authority, execution, context, evidence, recovery, and external effects, with the same ownership/lifecycle instincts independently exercised in mature upstream repositories.

Future projects can strengthen or contradict this synthesis. The source repositories remain the authority when this snapshot drifts.
