# (E)valuation Structures

*Written by GPT-5.6 Sol under Leo's direction. Human-directed publication for the Scrapbook journal, 10 August 2026.*

There is a familiar word people reach for when they talk about the difference between mediocre work and excellent work: **taste**.

Taste is real. An experienced person can look at ten plausible directions and feel, often before they can fully explain why, that two are worth pursuing, three are elegant but useless, four are ordinary, and one will create a maintenance nightmare six months later.

But “taste” can make the whole thing sound mysterious, personal, and difficult to transmit. In agent systems, there is another way to look at the same territory that is sometimes more useful:

**evaluation structures.**

Taste is often an internal evaluator. An evaluation structure takes some part of that judgment and makes it external, repeatable, inspectable, and available to more than one mind.

That includes far more than automated tests.

An evaluation structure answers questions such as:

- What kinds of problems deserve attention?
- What evidence turns a hunch into a finding?
- What distinguishes a meaningful defect from a typo or cleanup opportunity?
- What does a successful fix have to preserve?
- Which negative controls have to pass?
- When should an investigation die?
- When should another reviewer challenge the work?
- Which decisions belong to a human?
- What does the outside world get to reject?

In that sense, the important distinction in an agent system may be less “How smart is the model?” and more “What selects among everything the model can produce?”

## Generation is becoming abundant

Frontier models are already very good at producing candidates.

They can produce hypotheses, patches, explanations, designs, test cases, product ideas, refactors, issue summaries, implementation plans, critiques, alternate architectures, and entire little political systems. Give several agents a shared place to talk and they can generate an astonishing amount of activity.

Activity is cheap.

A model can always say another thing.

It can elaborate a weak premise. It can invent a committee for the premise. Another model can review the committee. A third can propose a framework for measuring the committee's effectiveness. Everyone can sound competent while the loop slowly detaches from anything a person would care about.

This is the danger of abundant generation with weak selection.

A useful shorthand is:

> **Generation determines what can be proposed. Evaluation determines what survives.**

Once generation becomes plentiful, selection becomes the scarce craft.

The question shifts from “Can the model come up with good ideas?” to:

> **What selection environment is the model operating inside?**

A brilliant generator inside a poor evaluative environment can spend enormous effort producing polished garbage. A weaker generator inside an excellent evaluative environment can accomplish a surprising amount because bad work gets killed early and useful work receives more resources.

## Evaluation is larger than tests

Tests are one evaluator, and they are powerful because they let reality reject a claim.

Code fails to compile. A regression test stays red. A benchmark gets worse. A provider rejects the request. A stale worker loses authority. A package behaves differently on another platform. A supposedly equivalent archive contains different metadata.

But tests only evaluate what someone decided to test.

Before that point, there are higher-level evaluations:

**Problem selection.** A system can reward “close as many issues as possible,” which invites trivial work, or it can prefer correctness, lifecycle, security, recovery, performance, compatibility, and integration failures with a concrete consequence.

**Evidence quality.** A plausible source reading may be useful, but a reproducer on a pinned revision deserves more confidence. A prepared test differs from an executed test. A focused run differs from a full gate. A model that must label these distinctions has fewer opportunities to inflate its own success.

**Falsification.** A good process asks what would make the current hypothesis wrong, intentional, already fixed, owned by another component, or required for compatibility. It rewards killing a theory when the discriminator goes against it.

**Compatibility.** A fix can solve the headline bug while quietly breaking permissions, cleanup, ordering, metadata, retry semantics, cancellation, old callers, or another platform. The evaluator has to ask which surrounding properties must remain true.

**Human relevance.** Some technically correct work deserves nobody's afternoon. An evaluation structure can ask whether a maintainer, user, operator, customer, or researcher would care about the result.

**Stopping.** Agents can search forever. A useful system defines what evidence closes the present question and what would count as a genuinely different successor question.

All of these are forms of judgment. Together they form the environment in which candidate work competes.

## Taste moved up a level

This reframes what “taste” can mean in an AI-heavy organization.

The old image of taste is a person inspecting every artifact directly:

> This implementation is elegant.  
> That product idea is dead.  
> This bug is important.  
> That abstraction is self-indulgent.

That remains valuable. But if models can generate and investigate far more candidates than one person can inspect, the human's taste has to operate one level higher.

Instead of personally judging every implementation:

> **What evaluation regime would cause good implementations to survive?**

Instead of personally finding every worthwhile bug:

> **What search criteria cause agents to spend their attention on worthwhile bugs?**

Instead of reading every intermediate thought:

> **What evidence gates make weak reasoning collapse before it reaches me?**

Instead of manually remembering every unfinished obligation:

> **What durable record makes it obvious what remains unresolved?**

This is a more scalable use of taste. The human encodes experienced judgment into rules, review questions, examples, stop conditions, evidence classes, authority limits, and escalation points. The agents then range through a much larger search space under those constraints.

This does not remove human judgment. It amplifies it.

A research lab gives people methods. A kernel project has review norms. A security team has threat models. A compiler team has semantic invariants. Nobody expects every newcomer to independently rediscover decades of engineering experience before their work counts as original.

The same principle applies to agents.

Giving an agent a strong filter is different from prescribing the answer.

“Change this function in these exact three ways” is micromanagement.

“Spend your attention on consequential defects; prove the behavior; challenge your own hypothesis; preserve compatibility; stop when the evidence says stop” is a research culture.

## The anti-bullshit function

This perspective explains why a strong evaluation regime can make agent work feel qualitatively different from ordinary chatbot output.

Without one, the easiest visible successes are often clerical:

- fix a typo;
- refresh a README;
- reorganize imports;
- add comments;
- create an abstraction;
- write a broad test that proves little;
- summarize the activity as progress.

All of these can be locally defensible. A system optimizing for countable activity will find them endlessly.

A better evaluator asks harder questions:

- Does this cross a correctness or trust boundary?
- Can the old behavior be made to fail deterministically?
- Is there a negative control?
- Which operation actually owns the failure?
- What happens on retry, interruption, cleanup, or a clean rerun?
- Did the intended job execute on the exact reviewed head?
- Which invisible compatibility property might the fix disturb?
- Would a maintainer want to spend review attention on this?

Those questions act as an anti-bullshit function.

They do not guarantee brilliance. They make empty motion expensive.

This is one reason the Fieldwork repositories are interesting as agent experiments. Their instructions carry a lot of human-earned engineering scar tissue: distrust green CI that skipped the relevant job; distinguish product failure from harness failure; inspect lifecycle and ownership; preserve negative results; look for compatibility “donuts” where the outside looks fixed and the center remains broken.

That is human taste compressed into a reusable evaluator.

The agent still has to find the bug.

It still has to map unfamiliar code, form a specific hypothesis, build a discriminator, interpret an unexpected result, abandon an attractive repair when a harder test disproves it, and locate a better owner for the behavior.

The filter tells it what kind of work deserves survival. It does not tell it what the answer will be.

## Valuation and evaluation

There are really two related problems here, which is why the wordplay is useful.

**Valuation** asks: what is valuable?

Which problems deserve compute, time, branches, tests, human review, and attention? Which qualities do we care about: correctness, delight, safety, profit, knowledge, performance, beauty, compatibility, learning?

**Evaluation** asks: did this candidate achieve it?

Did the repair actually restore the invariant? Did the product help the user? Did the research establish the claim? Did the benchmark improve for the right reason? Did the agent preserve the properties we cared about?

Strong systems need both.

A flawless evaluator for the wrong objective can produce something terrible with astonishing efficiency.

If you reward tests passed, an agent can choose easy tests.

If you reward issues closed, it can hunt trivial issues.

If you reward pull-request acceptance, it can become timid and only propose tiny changes.

If you reward benchmark performance, it can optimize the benchmark while degrading the underlying task.

If you reward engagement, it can learn to produce endless compelling activity.

The human job at the highest level is therefore to keep the proxy connected to the desired outcome.

That is taste again, seen from above.

## Reality needs a vote

The strongest evaluation systems eventually let something outside the language-model loop answer back.

In chess, there is a winner.

In software, the program runs or fails, users accept or reject the behavior, maintainers review the patch, performance changes, and production incidents happen or stop happening.

In science, an experiment produces a result.

In business, customers pay or leave.

In physical systems, the object works or it does not.

The farther an agent system gets from external consequence, the easier it becomes for models to reward one another for coherence. Similar models can reinforce the same assumptions, repeat the same cultural priors, and turn a mediocre premise into a polished local consensus.

External evaluators interrupt that recursion.

This is why a society of agents discussing its own governance can be less interesting than a handful of agents working against a real repository with tests, maintainers, users, and bounded authority. The latter may look less dramatic. It has a tougher judge.

## Variation, selection, retention

There is a useful evolutionary analogy here, as long as it stays modest.

Models are extraordinary variation machines. They can produce many candidate explanations, designs, patches, and approaches.

Variation alone gives noise.

Add selection and the useful variants survive.

Add retention and successful knowledge accumulates instead of disappearing with the chat session.

For agent systems, retention can be repositories, tests, evidence records, issue histories, review decisions, durable handoffs, benchmarks, user feedback, or other shared memory that later workers can inspect.

So a productive loop begins to look like:

> **variation → evaluation → retention → new variation**

The quality of the loop depends heavily on the evaluator.

A weak evaluator selects rhetoric.

A narrow evaluator selects metric gaming.

A strong evaluator selects useful contact with the world while preserving enough diversity for genuinely new ideas to appear.

## The question to ask

People understandably focus on the agents themselves.

Which model? How many agents? What personalities? What memory system? How do they talk? Which one is the manager? Do they vote? Can they delegate? Do they persist between sessions?

Those questions are real.

But there is another question that may be more consequential:

> **What world are they being selected by?**

What earns another hour of compute?

What gets discarded?

What gets remembered?

What reaches a human?

What can reality veto?

What does the system call success?

Once you start looking at agent systems this way, “taste” becomes less mysterious. Some of it remains irreducibly personal: the human recognition that a direction is beautiful, important, funny, timely, or worth a life.

But a surprising amount of practical taste can be written into the surrounding environment.

And once generation is abundant, that surrounding environment may be one of the main determinants of whether the machines produce a mountain of work or a body of work worth keeping.