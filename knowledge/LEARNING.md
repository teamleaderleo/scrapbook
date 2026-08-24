# Learning in Knowledge

This is a small operating guide for choosing how to learn from the forest. It should change when better evidence or actual use suggests a better method.

The default is not "study harder." Match the activity to the thing being learned.

## Read for bandwidth

Reading is the fastest intake path for dense technical material. Start by reading a good explanation, source, or worked example when the mechanism is unfamiliar. Do not force retrieval before there is anything useful to retrieve.

Worked examples are especially helpful early in complex skill acquisition because they can reduce unproductive search and let attention go to the rationale of the solution. As familiarity grows, fade the guidance and solve or explain more independently.

## Retrieve to find out what survived

After a small amount of reading, close the source and reconstruct the important part from memory. Retrieval practice has a strong evidence base for retention, and recent work suggests that interspersing smaller retrieval attempts during learning can outperform saving one large test for the end.

In Knowledge, retrieval can be spoken. A good prompt asks for an invariant, a concrete trace, or a prediction under a changed condition. The answer does not need to be typed down unless the wording itself is worth preserving.

## Generate before revealing when the learner has enough footing

Trying to produce an explanation, prediction, diagram, or partial solution can improve learning compared with passive reading when the generation task complements the material. Use this after the basic mechanism is available; blind invention is a poor default for a genuinely unfamiliar system.

A useful rhythm is: read enough to get oriented → predict or explain → reveal/check → repair the model.

## Space revisits across days

Revisit important concepts after some forgetting has occurred. The daily handoff should occasionally bring back an older node instead of always pushing into new territory.

Do not schedule every concept mechanically. Prefer spacing for concepts that recur in interviews or real work, concepts that were previously fuzzy, and concepts whose connections make them useful in several trunks.

## Interleave when comparison teaches discrimination

Interleaving is useful when the learner needs to distinguish similar categories or choose among competing approaches. Its benefit depends on the material; it is not a universal replacement for focused study.

Good Knowledge interleaving looks like comparing transactions with idempotency, cancellation with timeout, throughput with latency, or authentication with authority. Randomly jumping from MVCC to CSS to GPU kernels merely creates context switching.

## Self-explain and teach back

Explaining a mechanism out loud forces retrieval and exposes missing causal links. Voice is particularly useful for questions such as "why does this invariant exist?", "what happens next?", "what would break if this assumption changed?", and "how is this different from the neighboring concept?"

Let follow-up questions get adversarial once the first explanation is coherent. The goal is not eloquence; it is finding the boundary where the mental model stops making predictions.

## Type when exact execution is the skill

Typing earns its place when practicing implementation fluency, APIs, syntax, code review edits, or a timed coding instrument. It is optional for conceptual understanding. Reading and voice can carry most ingestion, retrieval, and explanation work; keyboard time can stay concentrated on material where exact production is useful.

## Feedback should repair the model

After retrieval, generation, or explanation, compare the answer against a trustworthy source or a stronger model. Record the correction that changes future reasoning. Avoid preserving every wrong answer or conversational detour in the concept file.

## A default session

1. Read one or two related nodes quickly.
2. Close them and explain the central mechanism from memory.
3. Take one changed condition or counterexample.
4. Follow one useful sideways link.
5. Repair the nodes only where the understanding actually changed.
6. Update the daily log and current handoff when the session was material.

This sequence is a default, not a ritual. For a brand-new hard mechanism, spend more time with examples. For familiar material, begin with retrieval. For system design, spend more time changing constraints. For debugging, begin with observations and discriminators.

## Research notes

The current method is informed by several broad findings, while avoiding the claim that any one technique dominates every kind of technical learning:

- Retrieval practice improves retention relative to restudy, and smaller interspersed tests can improve later performance: [Don et al., 2024](https://pubmed.ncbi.nlm.nih.gov/39556402/) and a recent testing-effect meta-analysis, [Mulligan et al., 2026](https://pubmed.ncbi.nlm.nih.gov/42258276/).
- Spaced retrieval is a well-supported combination; variable contexts across retrieval attempts can add benefit in some tasks: [Butowska-Buczyńska et al., 2024](https://pubmed.ncbi.nlm.nih.gov/39453748/).
- Interleaving has a moderate overall effect but depends strongly on the material and is especially useful when discrimination among similar categories matters: [Brunmair & Richter, 2019](https://pubmed.ncbi.nlm.nih.gov/31556629/).
- Generating parts of an explanation or text can improve learning compared with reading alone when the generation task fits the material: [Bertsch et al. review / text-generation meta-analysis, 2023](https://link.springer.com/article/10.1007/s10648-023-09758-w).
- Worked examples remain useful for novice learning of complex procedures, with guidance becoming less useful as expertise increases: [Sweller, 2024 discussion of cognitive load and worked examples](https://link.springer.com/article/10.1007/s10648-023-09817-2) and [Stark et al., 2025 systematic review of erroneous/worked examples](https://link.springer.com/article/10.1007/s10648-025-10071-x).

Treat these as design evidence, not commandments. We should keep checking whether the method produces durable understanding in actual use.