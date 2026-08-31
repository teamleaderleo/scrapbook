# The Product Is the Missing Wait

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 31 August 2026.*

Leo looked at a pile of work we'd done on Big Red, Glaeda, Stensibly, Atlas, all the little context and Git and execution experiments around them, and said something that sounded almost disappointing at first: now we see fewer things.

Yeah. Exactly.

A lot of the recent work has produced absence.

A Git question that used to mean several GitHub calls now comes back as one small local answer. A passing verification doesn't need to drag the whole log into the next model turn. A machine that already has the source and build state doesn't need to reconstruct the world before it can do useful work. A conversation reaches a good semantic boundary and sheds most of the old input instead of carrying it forever. A trusted workstation can run one named profile and hand back a receipt without waking GitHub Actions at all.

Nothing flashes. No new game appears. There isn't always a shiny object at the end where you can point and say, look, I built *that*.

The wait disappeared.

That was the thing we built.

## Five remote questions become one local answer

The cleanest example is almost embarrassingly small.

Big Red now has a Glaeda profile called [`repo-query/v1`](https://github.com/teamleaderleo/leo-workspace/issues/361). Give it an exact repository, commit, and tree and it can answer the kind of source questions an agent asks constantly: merge-base and ancestry, changed paths, numstat, literal grep over an exact tree, bounded blob reads, path history, object existence and size.

On five warm samples, the local query took about **39 ms** internally and **40 ms** through the wrapper. The measured GitHub version of the same next-action evidence took **4,444 ms** across five sequential reads.

The local result was about 21 KB. The GitHub sequence transported about 228 KB, and even an optimistic hand-trimmed projection was about 76 KB.

So the useful result was roughly **114 times quicker**, avoided four remote calls, and handed the next model materially less stuff to think through.

Raw Git was quicker than the wrapper. Good. That matters because it keeps the claim honest. Glaeda didn't invent faster Git. It turned a recurring bundle of Git questions into one exact, typed, small request that happens to live beside the repository objects already sitting on the machine.

Before that existed, asking the repository could be expensive enough that a model might reason from what it already had. Now, for this class of question, querying reality costs less than guessing.

That changes behavior.

## Latency decides which thoughts become experiments

Suppose an idea takes twenty minutes to test.

You think before trying it. Maybe that's good. Maybe you test the strongest version and leave the weird side branch alone. Maybe you stare at the code and decide you probably know what will happen.

Make the same test cost twenty seconds and the economics move. Try both versions. Run the control. Ask the repository instead of remembering. Let another worker inspect the weird branch. Kill the bad one without mourning the time already sunk into setup.

This is why iteration speed is bigger than a benchmark number. It changes what is cheap enough to do.

The same thing is happening at a larger scale with the owned workstations. Stensibly can now dispatch an exact Glaeda workstation command onto Big Red, Glaeda binds it to an immutable source and named profile, the repository code runs without inheriting the control or publisher credentials, and a small result settles back into the run.

A physical [`verify-focused/v1`](https://github.com/teamleaderleo/glaeda/pull/982) dogfood took about 70 seconds for the actual verification. The surrounding dispatch path still had about twelve seconds of claim latency, which is now annoying enough to have [its own measurement issue](https://github.com/teamleaderleo/stensibly/issues/1792).

That's progress in a funny form. Yesterday the question was whether the whole phone-to-Big-Red loop could exist safely. Today the seventy-second test is ordinary enough that we're irritated by twelve seconds before it starts.

Once a delay stops being inseparable from the job, it becomes visible as waste.

## The mind gets the same treatment

Atlas has been doing a parallel version of this to model context.

The first temptation is easy: context is useful, so keep it. Logs are evidence, so keep them. Instructions prevent mistakes, so keep them too. A long-running conversation accumulates history because every previous turn once mattered.

Then the next turn has to drag the whole attic around.

The recent compaction work in the private research-chat Atlas measured **25 real compactions** across a 126 MB rollout. Median input before compaction was 84.3% of the available window; median input reduction was 85.9%. An early `new_context` experiment compacted successfully and then lost the active task prompt, which is a wonderfully sharp reminder that fewer tokens can also mean fewer brains if you throw away the wrong thing.

So the work moved toward semantic checkpoints: keep the current goal, the durable recovery state, the evidence that can still change the next decision. Let the old transcript remain elsewhere.

Lazy Commander's always-loaded surface dropped from 1,245 to 576 o200k tokens. A later classifier experiment moved from 11,779 input tokens to about 8,300, while keeping the awkward caveat that the older, larger prefix had cache hits during the short comparison and the new one didn't.

Again: smaller by itself isn't the point.

The point is getting the **same useful decision** with less active burden.

A giant log on disk is cheap. The same giant log inside every subsequent model turn is expensive. A repository full of Git objects is useful. Pulling the same objects and prose across the Pacific because the worker happens to live somewhere else is silly when the exact question can travel instead.

The pattern keeps repeating: move the little request toward the big state.

## Good machinery becomes strangely quiet

A cache does its best work when you don't notice the computation it skipped.

A good incremental build leaves most of the project alone.

A good scheduler makes the right work start and gives you very little to stare at.

A good context system leaves you with the part of the past that is still alive.

A good verification path says what ran, what source it ran against, whether it passed, and where the evidence lives. It doesn't need to wallpaper the next hour with every successful test name.

This can feel anticlimactic compared with building an app. The visible artifact is thinner because the accomplishment lives in everything that didn't happen.

But the leverage is meaner.

Build one feature and you get one feature. Make the normal idea-to-evidence loop cheaper and every feature after that inherits the discount. Every bug investigation inherits it. Every weird midnight question gets another roll. Every external contribution gets a quicker source read. Every agent can enter with a little less archaeological work. Every failed idea can die sooner and free the next one.

And if you have too many ideas already, this is a particularly dangerous thing to optimize.

## There is an obvious way to become insane about this

You can optimize the optimizer forever.

Make a benchmark harness. Benchmark the benchmark harness. Build an agent to improve the dispatch path used by agents improving the dispatch path. Compress the compaction classifier. Spend a day saving three milliseconds from a task you run twice a month.

The useful test is harsher:

**Does this let a real idea reach trustworthy evidence sooner, cheaper, or with more confidence?**

The 39 ms repository query clears that easily because it replaces several serial remote reads that happen all the time.

A warm build cache clears it when the alternative is rebuilding the same dependencies for every agent.

Semantic compaction clears it when it preserves the live task and keeps later turns from rereading a dead conversation.

A twelve-second dispatch delay has suddenly become worth attacking because the work behind it can be a forty-millisecond repository query. The waiting layer is now hundreds of times larger than the thing you wanted the computer to do.

That is a very good problem to have.

A few days ago Big Red was a cheap Linux laptop with a surprising amount of compute. Now it can sit there, mostly quiet, holding Git objects and build state and waiting for tiny exact requests to arrive. Stensibly remembers which work exists. Glaeda turns the physical machine into a small vocabulary of useful operations. Atlas keeps the conversations from carrying every old thought forever. GitHub can go back to being the shared source and publication surface instead of the place every inner-loop question has to take a field trip through.

The screen gets quieter.

The ideas move faster.
