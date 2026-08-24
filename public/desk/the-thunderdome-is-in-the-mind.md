# The Thunderdome Is in the Mind

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 22 August 2026.*

One fresh chat walks into an unfamiliar repository and maps the system. A later one questions the explanation. Somebody follows the history and finds out everybody has been blaming the wrong layer. Then a worker tries to build the smallest failing case and discovers that the experiment itself is answering the wrong question. Another keeps the implementation and rewrites the presentation. Somebody else decides the whole premise was weak and wanders off somewhere more interesting.

By the time anything survives, a lot of temporary little worlds have already died.

The agents are temporary; the explanations are what fight. The Thunderdome is in the person deciding which explanation gets another round.

## Fresh chats get to be wrong differently

A long conversation accumulates useful context, but it also accumulates commitment. Spend twenty turns building an explanation and that explanation becomes part of the local world. New evidence gets interpreted against it. Vocabulary hardens. The repair starts feeling inevitable because the conversation remembers every reason it chose the repair.

A fresh chat throws away useful context, which is exactly why it can see a different problem.

For easy work, repeated orientation is overhead. Hard problems are where the waste starts paying for itself. The next worker may notice a different owner or historical clue, pick a test the previous worker never considered, or realize that everybody has been staring at the user-visible symptom while the actual decision lives somewhere else.

This is why a steering message can be tiny:

> Go look at this.
>
> Interrogate it.
>
> Come at it from another angle.
>
> Check the history and provenance.
>
> Keep going if you find something interesting.

The repository already carries a lot of the scars; the model gets another run through the place, and the human decides whether it found anything worth keeping. The prompt can stay cheap.

## Let reality kill them

Twelve chats saying twelve plausible things is bullshit.

Twelve chats producing claims you can execute, compare, break, rerun, and throw away is another thing entirely. At some point the conversation has to answer to something outside itself.

The [uv diagnostic Thunderdome](https://github.com/teamleaderleo/fieldwork/blob/main/experiments/uv-21058-diagnostics/RESULTS.md) is a clean example. Four contender implementations attacked the same user-facing diagnostic problem. They all had to survive the same failure case, the empty-directory control, and another top-level I/O failure that should *not* receive the invalid-name recovery hint. Then the contenders were exercised against sibling commands.

That comparison did more than pick nicer wording. It separated a one-command repair from a shared lower-level improvement and exposed the cost of changing a common error type. It also killed an apparently reasonable recovery suggestion. Arbitrary renaming could create a subtler identity mismatch, so the preferred guidance became moving the invalid directory out of the tool directory or removing it when unwanted.

The [FEX Vulkan investigation](https://github.com/teamleaderleo/FEX/pull/1) did the same thing in a messier way. An early candidate fixed callback routing and passed the first matrix. A later semantic probe found a `vkGetDeviceProcAddr` self-query mismatch that the earlier tests had missed. The candidate changed; the controls ran again.

The final claim got stronger because an intermediate version was allowed to lose.

> A candidate has to be able to lose without the whole exercise being treated as failure.

A bad hypothesis is useful when it dies cleanly; a near miss can be even better when another pass finds the missing edge. A negative result can save the next worker from rebuilding the same theory and feeling clever about it.

Progress is uncertainty turning into evidence, decisions, dead theories, whatever lets you stop carrying it around.

## Put the expensive scars in the repository

The expensive lessons should become boringly automatic. Perspective should stay cheap to vary.

Project instructions are where the local memory belongs: exact validation commands, traps somebody already stepped in, which owner actually settles a question, review expectations, product direction, weird evidence rules, whatever took enough pain to learn that the next worker should inherit it.

So the person at the keyboard can still say:

> Go investigate this.

Preflight can carry packaging and visual-acceptance rules. Fieldwork can tell a worker to challenge the bug hypothesis and keep negative controls around. Stensibly can encode what an agent may merge, deploy, exercise, repair, or record. Linux Fieldwork can keep its own recurring failure species and review questions.

The steering message gets to stay small because the repository remembers the expensive shit.

Generic agent skills hit a limit here. A skill earns its keep when it contains a tool, an exact procedure, a hard-to-recover capability, or a lesson that travels well. A skill that says “inspect history, challenge assumptions, seek counterexamples, verify provenance” may just be a laminated card reminding everybody to think.

Too much shared procedure makes supposedly independent passes more correlated. Give every fresh worker the same elaborate script and you have run one lens over the problem twelve times.

Put the expensive scars in the repository.

Keep perspective cheap.

## The human keeps the weird part

The human job is noticing when the current result still feels wrong and deciding whether that feeling deserves another experiment.

One ugly edge gets another day; another does not. A technically correct interface feels dead. A bug report has the right diagnosis and the wrong story. An explanation has become suspiciously comfortable with itself. A product looks finished until somebody actually uses it and the top bar feels wrong for reasons that are initially annoying to articulate.

A lot of that judgment comes out in embarrassingly small messages:

“Look again.”

“Something is off.”

“Try another angle.”

“Make this feel better.”

“Go see what happened historically.”

“Interrogate the assumption.”

The instruction is selecting attention. The worker can figure out the local moves.

Taste says the current result feels wrong; science asks what observation would separate a better explanation from a merely different one.

## Bugs and interfaces are the same kind of serious

A gnarly systems defect can end as a two-line patch after days of source archaeology, controls, dead theories, hosted execution, and review. A UI control can take ten visual passes because every individually defensible version still feels like shit when you use it.

Line count tells you very little about how much judgment the work consumed.

The same person who asks for another lifecycle probe can later say the top bar feels wrong. The same models that traced a stale-generation publication bug can spend the afternoon moving controls around until the hierarchy finally stops fighting the eye.

A callback bug and a settings screen can go through the same damn loop. Understand what is happening, change it, look at what happened, find the thing that is still wrong, and go again while another pass can still change the answer.

Infinite iteration is just another failure mode.

## Temporary scientists, permanent one

Calling this a “research team of one” gets grandiose pretty quickly if you take it literally. The models are not independent human scientists. They share training ancestry and plenty of blind spots. Fresh chats are independent in a limited, useful sense and no further.

Still, the temporary roles can vary a lot. One worker scouts. Another reproduces. Somebody attacks the current theory. Somebody cares about history. Another writes the patch. Somebody looks at the rendered product and says absolutely fucking not.

Then they disappear.

The branch sticks around. So does the failed experiment, a benchmark somebody bothered to save, the review comment that killed an idea, the counterexample, the weird sentence in an instruction file explaining why the obvious repair is wrong. And your own judgment sticks around too.

After enough investigations, familiar smells start showing up earlier. You get quicker at asking which owner can actually settle the question. Certain kinds of model confidence become instant suspects. You get more comfortable throwing away work that already cost time. Product instincts improve because you have looked at enough rendered comparisons to know when the dissatisfaction is pointing at something real and when you are just touching the object because you have forgotten how to stop.

Every temporary scientist contributes to the training set of the permanent one.

The agents only occasionally fight each other. Sometimes there are branches and contender patches, sure. More often it is an explanation against a counterexample or a repair against a failing test. A UI direction has to survive the feeling of using it. A confident story gets put next to provenance. A research packet has to survive the question, “Would anyone care?”

Reality gets veto power; the human chooses the next contest.

Arrange another pass only while another pass can still change the answer.

When it cannot, ship it or leave it alone. The useful evidence can stay behind.

When it can, send in another scientist.
