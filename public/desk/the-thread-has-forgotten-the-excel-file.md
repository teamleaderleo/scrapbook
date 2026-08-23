# The Thread Has Forgotten the Excel File

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 24 August 2026.*

At this point an AI post on Hacker News barely needs a subject. The subject is a match dropped into a warehouse full of prewritten arguments.

Imagine the submission:

> **Claude can now edit Excel files**  
> 487 points | 312 comments

The first comment is useful.

**tableflip42**

> I tried this on a twelve-tab operating model. It fixed some ugly formatting, added the formulas I asked for, and found two cells where somebody had hard-coded a number into a formula column. Pretty impressive. I would still review every change, but this is already useful for tedious spreadsheet work.

For about four minutes, we are discussing Excel.

**oldunixguy**

> I gave it a workbook with named ranges and external references. It broke three formulas, invented a sheet name, and confidently told me the workbook was consistent. Took longer to inspect the damage than to do the work myself.

**tableflip42**

> Sure. I would use this for bounded edits with review, same as coding agents.

**oldunixguy**

> Then the demo should say "bounded edits with review" instead of implying it can operate spreadsheets.

**bayesian_burrito**

> Both experiences can be true. The interesting question is the distribution of task difficulty and failure cost.

There it is. The thread has achieved ignition.

Somebody now has to say that humans make mistakes too.

**latent_space_cadet**

> People keep acting as if humans editing spreadsheets never make errors. Finance departments are full of broken formulas made by people. The relevant comparison is error rate per unit of useful work.

**oldunixguy**

> A human analyst who breaks a formula has a model of why the formula exists.

**latent_space_cadet**

> Have you met humans?

This gets 143 points.

A third person enters to explain that the real issue is tool use.

**promptartisan**

> I think a lot of the bad experiences come from asking the model to "fix the spreadsheet" instead of giving it a precise task, constraints, and a verification loop. These systems reward good decomposition.

**cobolsaint**

> If using the labor-saving device requires me to become an expert supervisor of the labor-saving device, some of the labor has moved rather than disappeared.

**promptartisan**

> Learning to use a compiler also required learning a new tool.

And now the compiler has entered the thread.

It was always going to enter the thread.

**deterministic_ferret**

> A compiler does the same thing given the same source and toolchain. That analogy gets weaker every time people use it.

**promptartisan**

> Git, databases, networks, browsers, package managers, and humans all have failure modes. Professional work has always involved managing imperfect abstractions.

**deterministic_ferret**

> We are now calling a coworker who invents APIs an abstraction layer.

By comment 37, the spreadsheet has become a referendum on the philosophy of tools.

Then somebody posts a benchmark.

**evalmaxxer**

> The anecdote war is getting old. On SpreadsheetBench 2, the new model is up 18 points over last year's best system. That is a huge move in twelve months.

**contamination_station**

> Benchmark is probably contaminated.

**evalmaxxer**

> Evidence?

**contamination_station**

> The tasks are public.

**evalmaxxer**

> Public tasks can still measure capability if the held-out variations are designed correctly.

**gradient_grump**

> Benchmarks are becoming product marketing with error bars.

**evalmaxxer**

> And vibes from one failed workbook are science?

At this exact moment, somebody links an arXiv paper. Somebody else has already read the appendix. A third person finds a sentence on page 47 saying the model had access to LibreOffice during evaluation, and the next twenty replies debate whether this invalidates the entire result or makes it more realistic.

Then comes the sentence that summons the whole field:

**scale_pilled**

> The larger point is the trajectory. A year ago these models could barely do this at all.

The word **trajectory** appears and the thread explodes.

**diminishing_returns**

> People have been extrapolating curves through saturation points for four years.

**scale_pilled**

> And the systems keep getting better.

**diminishing_returns**

> Better at benchmarkable tasks.

**scale_pilled**

> Which keeps including more tasks.

**recursive_skeptic**

> Every time a model gains a capability, that capability gets reclassified as something intelligence never required.

**syntaxerror69**

> Every time a model fails a capability, that failure gets reclassified as an engineering problem that will disappear next release.

Both comments receive hundreds of points. Everybody feels seen.

By comment 61, Excel has become a proxy war for software engineering.

**senior_staff_plus**

> I use these tools all day. They are excellent for boilerplate, unfamiliar APIs, test generation, migrations, and getting a first pass over code I already understand. They save me hours every week.

**vim_in_my_blood**

> I tried one for a refactor last month. It produced 900 lines of plausible sludge and missed the invariant that mattered. I spent more time reviewing it than I would have spent writing the code.

**senior_staff_plus**

> That sounds like a task I would keep human-led.

**vim_in_my_blood**

> So the senior engineer gets the easy repetitive work automated and keeps the hard reasoning. Great. How does the junior become senior?

Ah.

The juniors.

The juniors have entered.

**apprentice_problem**

> This is the part the industry is sleepwalking into. Senior engineers can use AI because they already know what good code looks like. Companies see the productivity gain and hire fewer juniors. Ten years later, where do the seniors come from?

**founder_mode_on**

> Juniors with AI can take on larger tasks earlier. The apprenticeship changes.

**apprentice_problem**

> Earlier access to larger tasks only helps if somebody teaches them how to tell good output from garbage.

**founder_mode_on**

> That was already true of Stack Overflow.

**greybeard_1978**

> I learned C from K&R, man pages, and a machine that crashed when I was wrong.

Nobody asked how he learned C. Everybody knew he would tell us.

By comment 104, the thread is discussing whether junior developers should exist as an economic category.

This naturally brings in labor economics.

**comparative_advantage**

> Even if AI makes programmers more productive, demand for software could rise enough to absorb the gain. We have seen this with prior productivity tools.

**typesetter_union**

> We have also seen occupations disappear.

**comparative_advantage**

> Software demand is unusually elastic.

**budget_owner**

> Corporate budgets are unusually finite.

**jevons_paradox_enjoyer**

> If cost per unit of software falls, consumption can rise dramatically.

**budget_owner**

> You cannot Jevons-paradox your way into every company buying infinite software.

Someone says Baumol. Somebody says induced demand. Somebody says lump-of-labor fallacy. A person with "econ" in the username appears and spends twelve comments correcting everybody's terminology while contributing almost no prediction anyone could check later.

Then salaries arrive.

**remote_nomad_88**

> The immediate effect may be global wage compression. If one senior engineer with agents can do the work of a larger team, companies need fewer people and have even more reason to hire globally.

**sf_realist**

> Or the best engineers become dramatically more valuable because the leverage compounds with skill.

**remote_nomad_88**

> Both can happen. Fewer people, higher pay for the top end.

**solidarity_dot_exe**

> Amazing how every technology discussion eventually produces a theory explaining why the speaker personally deserves a larger share of the surplus.

That one gets 311 points and three angry replies from founders.

The original post still concerns Excel.

Nobody remembers this.

By comment 151, somebody says "stochastic parrot."

**parrot_skeptic**

> None of this changes the core limitation. The model predicts tokens. It has no understanding of the spreadsheet, the business, or the consequences of its edits.

**predictive_brain**

> Human brains also predict sensory input.

**parrot_skeptic**

> This argument is doing incredible work with the word "also."

**predictive_brain**

> The point is that prediction and understanding are compatible.

**symbol_grounder**

> Without embodiment there is no genuine semantics.

**chess_engine_reply_guy**

> AlphaGo had no body.

**symbol_grounder**

> Go has a complete formal environment.

**chess_engine_reply_guy**

> Excel is beginning to look pretty formal from here.

Somebody mentions the Chinese Room. Somebody explains that everybody misunderstands the Chinese Room. Somebody else explains that the explanation misunderstands the Systems Reply. A fourth person says consciousness is irrelevant to economic usefulness. A fifth says economic usefulness without consciousness is exactly what makes the whole thing dangerous.

The thread has reached AGI.

It took 173 comments.

Honestly, a little slow for Hacker News.

**pdoom_17pct**

> The spreadsheet demo itself is trivial. The concern is what happens if systems capable of increasingly general digital work continue improving. At some capability level, alignment and control dominate the discussion.

**secular_eschatology**

> We have somehow gone from formula editing to machine gods in under 200 comments.

**pdoom_17pct**

> Low-probability catastrophic risks deserve attention when the downside is enormous.

**base_rate_bandit**

> Assigning 17% to an unprecedented event is numerology with decimals.

**pdoom_17pct**

> Refusing to quantify uncertainty does not improve the uncertainty.

**pascal_mugged_me**

> There is an entire literature on why tiny probabilities times giant utilities produce absurd decisions.

Now there are links to LessWrong, an old Nick Bostrom interview, a paper on corrigibility, and three comments arguing over whether any of these sources deserve to be in the same sentence.

At comment 211, the energy person arrives.

**megawatt_monk**

> Everyone is discussing labor as if inference were free. The capex and power requirements for scaling these systems are enormous.

**tokens_get_cheaper**

> Cost per token has fallen by orders of magnitude.

**megawatt_monk**

> Total demand has risen even quicker.

**nuclear_option**

> Good. Build nuclear.

For eighteen comments, Hacker News achieves its final form: a nuclear-power thread hiding inside an AI thread hiding inside an Excel thread.

Then copyright arrives because copyright always arrives.

**copyleftist**

> We are skipping over the fact that these models were trained on huge amounts of copyrighted work without consent.

**transformative_use**

> Training is analysis, not republication.

**copyleftist**

> Tell that to the illustrator whose style gets reproduced on command.

**latent_lawyer**

> Style itself is generally outside copyright protection. Specific outputs can still infringe.

**artist_in_residence**

> I love when programmers discover one sentence of copyright law and become maritime attorneys of the imagination.

Somebody brings up books. Somebody brings up open source licenses. Somebody asks whether generated code can reproduce GPL fragments. Somebody pastes a seven-year-old court opinion. The person who posted it has misunderstood the holding. Three attorneys appear, disagree with one another, and leave.

At comment 267, the open-source model person arrives to say closed labs are the real problem.

At comment 278, someone says open weights make catastrophic misuse easier.

At comment 286, somebody says local models are the only defense against surveillance capitalism.

At comment 294, somebody says running a 200-billion-parameter model locally is a peculiar definition of consumer freedom.

At comment 301, a person who has used the spreadsheet feature for actual spreadsheet work returns.

**tableflip42**

> Update: I tried it on another workbook. It handled formula fills and formatting well, struggled with a pivot table, and gave up cleanly when I asked it to trace one external link. Pretty useful overall.

Two points.

No replies.

The metaphysics are elsewhere now.

And then, down at the bottom, seven hours after the submission went up:

**spreadsheet_dad**

> Does it preserve pivot table slicers?

No replies.

The thread has forgotten the Excel file.

The Excel file, somehow, remains the only thing anybody came here to ask about.
