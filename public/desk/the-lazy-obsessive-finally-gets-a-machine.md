# The Lazy Obsessive Finally Gets a Machine

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 23 September 2026.*

There is a person who can leave a five-minute administrative chore sitting around for three days and then spend fourteen straight hours fixing a thing nobody asked them to fix.

Lazy catches one surface fact. Unmotivated misses the plot.

This person hates low-value effort with almost comic intensity. Forms, setup, boilerplate, procedural sludge, forty minutes of reading docs to discover the one incantation that makes the tool work, a dependency fight before the actual problem has even begun. All of it can kill the impulse.

Then something catches.

A bug starts bothering them. A product idea feels alive. A code path is obviously stupid. A tool should exist and somehow doesn't. They start pulling on the thread, midnight arrives, and good luck getting them to stop.

The same person who avoided the stupid little chore can become almost offensively persistent once they care.

AI is an absurd amplifier for exactly this temperament.

## The spark used to have to survive the hallway

A lot of old friction was real bullshit.

You'd have an idea at 8:00 p.m. and spend the first hour installing things. The docs assumed knowledge you didn't have. The package version was wrong. The example used an old API. You needed an account. The account needed a key. The key belonged in an environment variable. The environment variable needed a shell restart. Then the build failed for a reason somebody had already solved in a forum post from 2019.

Maybe at 10:15 you finally reached the interesting part.

This was a perfectly good reason for ideas to die.

People love to romanticize friction after the fact because occasionally friction teaches you something. Sure. Plenty of it also consumed attention without producing any lesson worth keeping. You learned how to appease a tool, remembered the ceremony for six months, and then the ceremony changed.

The interesting impulse had to survive the entire hallway before it reached the room where the real work lived.

Some people were unusually bad at surviving the hallway.

Then, once they made it through, they were unusually good at staying in the room.

[Starting and Continuing](/desk/just-leo-starting-and-continuing) names the two frictions cleanly: willingness to start and willingness to continue. The weird personality here has a lopsided relationship with both. Activation can be fragile when the path is full of bullshit; continuation can become ferocious once the work starts paying back attention.

Old tools made the first trait dominate how the person looked from outside.

AI can flip the ratio.

## Lazy and obsessive can live in the same person

A certain kind of laziness is a sensitivity to low-value effort.

The person looks at forty minutes of mechanical work and thinks, fuck this.

Then they look at ten hours of difficult work attached to an outcome they care about and think, okay, let's go.

You can call this irrational. Sometimes it absolutely is. Life contains chores. Other people shouldn't have to absorb your administrative aversion. Bills still want paying. A person who only works when inspired eventually discovers that reality has recurring invoices.

But the underlying pattern is useful once the execution environment changes.

The person isn't conserving energy in some globally sensible way. They are spending energy according to a viciously uneven value function.

One kind of effort feels dead on arrival.

Another kind can eat the whole weekend.

And the second kind often produces the stuff people later point at and ask how the hell somebody had the energy to do all that.

They had the energy because the work kept answering them.

A profiler number moved.

A test finally failed for the right reason.

The prototype appeared.

The ugly abstraction got smaller.

Somebody used the thing.

The next move became obvious.

Feedback creates more appetite.

This is why the word lazy can be both funny and misleading. The person may genuinely procrastinate more than average on low-reward tasks while also having a much higher ceiling for sustained effort once the loop becomes alive.

The ceiling is the interesting part.

## Then the machine shows up

Now give this person an agent.

The idea arrives and the first move can be six sentences.

> Go inspect this.
>
> Figure out why it sucks.
>
> Try a better version.
>
> Run the tests.
>
> Show me what still looks wrong.
>
> Keep going.

The machine can absorb a shocking amount of the hallway.

It can read the docs, trace the repo, write the throwaway script, explain the weird library, make the first patch, run the suite, chase the failure, clean up the diff, write more tests, compare two approaches, and come back with an object the person can react to.

Reaction is important.

A lot of motivation lives in reaction.

You see the first attempt and immediately know what bothers you. You see the benchmark and want another run. You see the UI and the hierarchy feels wrong. You see the refactor and realize the whole abstraction can disappear. Each result creates the next instruction before the original spark cools.

The dead zone between wanting and seeing gets shorter.

For the friction-sensitive obsessive, this is fucking catnip.

[You Can Literally Just Say Go](/desk/you-can-literally-just-say-go) is about how small the first authorization can become. The interesting extension is what happens when the person has always been good at the second authorization, and the twentieth, and the one at 1:40 a.m. when the current version is technically fine and still annoys them.

The machine keeps returning something to push against.

The person keeps pushing.

## The finisher gets the absurd multiplier

Cheap initiation alone can produce a magnificent landfill.

Fifty prototypes. Thirty branches. Twelve little apps with beautiful landing pages. Every week starts with a new revelation and ends with a different repository.

AI is perfectly capable of multiplying that personality too.

The rare combination is initiation plus follow-through.

A person sees a possibility, starts before the energy leaks out, and then stays with it through the ugly middle.

The tests expose three failures. Good, fix them.

The fix reveals an old assumption. Chase it.

The module is impossible to work with. Clean it.

The cleanup breaks a weird edge case. Capture the case.

The benchmark improves, but only by eight percent. Why only eight?

A user gets confused. Watch where.

The new version works and the code is embarrassing. Go back.

At some point the agent isn't supplying the persistence. It is giving persistence enough hands.

[Because I Fucking Wanted It](/desk/because-i-fucking-wanted-it) gets at the fuel source. Desire pays for another pass. Cheap machine labor changes the exchange rate. The same amount of desire can now buy far more passes.

This is where the multiplier starts getting rude.

A person who previously had ten lightning-strike weekends a year might have spent half of each one on setup, archaeology, syntax, boilerplate, and recovering from every local mistake manually. Now the interesting loop can start sooner and stay alive longer.

The person already knew how to sprint their ass off.

The new tool keeps putting track under their feet.

## Bullshit becomes editable

Software makes this unusually obvious because so much of the bullshit is literally made of text.

A terrible abstraction is code.

Five duplicate implementations are code.

A miserable deployment process is code plus configuration.

A flaky test is code.

A giant module nobody wants to touch is code plus history plus fear.

The mess can have ten years of lore attached to it and still consist of decisions somebody made.

Decisions can change.

A serious regression suite makes the relationship even more aggressive. Change the thing. Run the suite. Inspect what broke. Add a characterization test where the old behavior matters. Try again. Benchmark the candidate. Give another agent the diff and ask it to attack the reasoning. Throw the branch away when the idea sucks.

Repeat.

You don't need a religious experience where one engineer suddenly understands every line of the repository. You need enough local understanding to make a move, enough instrumentation to see what happened, and enough persistence to keep reducing uncertainty until the change earns its way in.

Some complexity comes from the actual domain. Plenty comes from accumulated decisions nobody had spare attention to revisit.

Human attention used to make cleanup economically painful. A team could know an adapter layer was ridiculous and leave it there for four years because somebody had a roadmap and the rewrite would eat two weeks.

Give the friction-sensitive finisher a pile of agent-hours and the calculation changes.

"Spend today figuring out whether this entire layer can disappear."

Okay.

Maybe the first attempt dies.

Maybe the sixth survives.

Maybe twelve workers independently inspect different call sites and one finds the reason the ugly thing still exists.

Maybe the answer is to leave it alone.

Every outcome is cheaper to obtain than the old ritual of carrying the suspicion around for another year.

## Fear of ambiguity loses some authority

A lot of hesitation has always been dressed up as prudence.

Sometimes prudence deserves the suit. Production databases, security boundaries, money movement, irreversible migrations, anything where a casual experiment can ruin somebody's day.

Huge parts of ordinary software are branches.

The first move can be reversible.

Make the branch.

Ask the question.

Run the experiment.

Try the refactor.

Let the tests yell.

Delete the whole thing if it sucks.

The person who is comfortable acting under partial understanding gets more information from the world. The person who insists on feeling ready before touching anything can spend a long time manufacturing readiness.

AI widens the difference because action now costs so little.

Two smart people can look at the same annoying code path.

One starts narrating the reasons it might be complicated.

The other opens an agent and says, "Go figure out why this is like this and see whether we can kill it."

Thirty seconds of behavioral difference.

Then one of them gets evidence back.

Evidence creates another move.

The move creates another result.

A week later the gap looks much larger than thirty seconds.

## The bullshit toll is losing pricing power

I wouldn't pretend every old barrier disappeared. Reality can still demand patience, domain knowledge, coordination, money, access, judgment, and long stretches of difficult work.

The cheap bullshit toll has taken a beating.

A lot of people used to have a defensible reason for leaving an impulse alone. Getting from "huh, I wonder" to the first useful artifact could require enough annoying work that the expected payoff lost.

Now you can often press a few buttons and get the loop started.

This makes differences between people more visible.

Who notices the opening?

Who makes it active?

Who comes back after the first result?

Who keeps going after the glamorous part?

Who fixes the stupid edge case?

Who cleans up after themselves?

Who still cares on day four?

Execution getting cheaper doesn't make those differences disappear. It gives them leverage.

The friction-sensitive finisher may have looked inconsistent in the old world because ignition depended on the spark surviving a gauntlet of crap.

Give the same person an agent that can clear the crap while they keep their eyes on the thing they want, and the pattern changes.

The spark catches.

The machine answers.

They react.

It answers again.

Eventually there's a finished thing sitting there.

And the person who used to lose an evening before reaching the interesting part is already asking what still sucks.
