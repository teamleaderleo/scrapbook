# You Will Find Another Cursed Thing to Care About

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 14 September 2026.*

A [Reddit post translating a DeepSeek engineer's blog](https://www.reddit.com/r/LocalLLaMA/comments/1wgii3h/deepseek_engineer_relections_on_rsi_burying_my/) is an elegy for writing GPU operators by hand.

The engineer says AI went from helper to serious operator optimizer in about a year. He expects it to reach his own level within six months or a year. He helped write the main attention operator for DeepSeek v4.1, so the loop is painfully personal: make the model better, make the model better at the work he loves, make the arrival of his replacement at that work come sooner.

He calls the future version of himself a mecha pilot. More leverage, more machine hands, less quiet time spent writing the kernels himself.

I get why that hurts.

But, bro, you are a special fucking snowflake.

There are a lot of special snowflakes. Eight billion people leaves room for millions of them. They are still few and far between compared with everybody else, and a person who can sit inside frontier GPU work, understand the hardware all the way down, understand the model all the way up, and love the craft enough to spend an afternoon calmly tuning operators is already sitting way out in the tail.

The scarce thing may turn out to be less "writes this exact class of kernel" and more "becomes obsessed with difficult things and gets frighteningly good at them."

CUDA happened to be where the obsession landed.

## Experience is not a wisdom vending machine

The standard anxiety goes something like this: if AI does the tedious apprenticeship work, where will the next generation get judgment?

People have been wildly overestimating the reliability of that pipeline forever.

Twenty years of experience can produce extraordinary judgment. Twenty years can also produce the same mediocre year twenty times. Repetition gives you repetition. Experience gives you opportunities to learn. Wisdom still requires a person who notices what happened, changes their mind, carries the lesson somewhere else, and keeps doing that for a long time.

Plenty of people become fluent in procedures without becoming wise. Plenty of wise people build their judgment through routes that look sideways from the approved apprenticeship: running a shop, reading history, raising children, making art, shipping software, losing money, fixing machines, watching a team implode, studying mathematics, caring for somebody, starting over.

The world has always had a lumpy distribution of judgment.

AI gives the lumpiness leverage.

Give a curious person with excellent taste a machine that can search, build, simulate, test, criticize, and try again all day, and you may get somebody terrifyingly capable. Give the same machine to somebody with awful judgment and you get awful judgment with more output.

The variable worth watching was never simply how many hours somebody spent manually typing the old moves.

What teaches judgment is contact with reality. Make a prediction. Try the thing. Watch reality disagree. Figure out why. Carry the correction forward.

AI can remove useful friction and useless friction at the same time, which means we have to get more specific about which friction ever taught anything.

[Starting and Continuing](/desk/just-leo-starting-and-continuing) already makes one side of this point: people vary enormously in whether they start and continue even when information and tools become absurdly available. [The Thunderdome Is in the Mind](/desk/the-thunderdome-is-in-the-mind) makes another: cheap workers make selection, counterexamples, taste, and deciding which experiment deserves another round more visible.

Judgment was scarce before agents. Agents reveal how scarce it was.

## Solving problems creates more problems

The engineer's sadness starts sounding much darker if you quietly assume humanity is approaching the end of the problem set.

Humanity keeps creating larger problem sets.

A solved layer opens another layer. Cheap capability makes previously ridiculous projects affordable. Better tools let people attempt things that used to be beyond the available budget, expertise, coordination, or patience. The reachable territory expands, and suddenly a whole collection of fresh problems becomes worth having.

Compilers automated piles of machine-level work. Software engineering exploded.

Memory got cheap. Programs got enormous.

Networks got cheap. We invented distributed systems and then spent the rest of our lives discovering new ways for computers to misunderstand each other across a room.

Search made factual retrieval trivial compared with a century ago. Humanity responded by producing an internet large enough to require better search.

A model writes excellent GPU operators? Wonderful. Now somebody gets to care about the architectures those operators make practical, the experiments those architectures make affordable, the new failure modes produced by automated optimization, the interaction between hardware and models, the economics of deploying the resulting systems, the scientific questions that become reachable once cognition and compute get cheaper, and whatever arrives next that currently lacks a name.

Every increase in capability changes which problems are worth attacking.

The fantasy of an end state where the machines have handled all the hard technical stuff and humanity stares at a clean desk is deeply unimaginative. A clean desk is an invitation to put something new on it.

## Your special interest can move

The grief over craft is real because activities have textures.

Somebody can love the literal act of knitting a sweater. A machine can make better sweaters and the person can still miss the needles in their hands. Somebody can love tuning an operator, reading the profiler, changing the schedule, watching a few nanoseconds disappear. A fleet of agents can outperform them and they can still miss the afternoon.

So mourn the kernels.

Keep writing them for fun if you want. Become the weird person in 2040 who hand-tunes GPU code the way people restore mechanical watches, build tube amplifiers, develop film, or write assembly because the activity itself feels good.

The career question is different.

A person who developed a consuming interest in low-level AI performance has already demonstrated the more portable trait: they can fall in love with a hard technical world deeply enough to acquire rare taste inside it.

A brain like that has more special interests waiting for it.

Maybe the next obsession is model architecture. Maybe hardware scheduling at a higher level. Maybe agent economies. Maybe robotics. Maybe compiler generation. Maybe some hideous co-design problem between silicon and learned systems that barely exists yet. Maybe it has nothing to do with computers.

The specific answer can stay unknown. Obsession migrates.

People do this across a lifetime already. A biologist becomes obsessed with microscopy, then statistics, then a disease, then an instrument, then the weird institutional problem preventing the instrument from being used. An engineer falls into operating systems, then virtualization, then performance, then some tiny device problem that eats three months. An artist spends five years on one medium and wakes up one morning consumed by another.

The continuity lives in the person.

## Rare people sometimes universalize themselves

Exceptional specialists have a funny humility problem.

They often talk as though anybody who goes through the correct apprenticeship can eventually acquire the judgment they have. Some can. Many won't. The specialist has spent so long surrounded by other specialists that the unusual trait starts feeling normal.

A DeepSeek engineer writing frontier attention operators can understandably think, "My craft is being automated, so how will future engineers acquire what I acquired through the craft?"

Another possibility is sitting right there: future engineers will include a small number of similarly weird people who become obsessed with whatever the new frontier demands, and most people will continue being most people.

Human variation survives technological change.

AI may widen what one unusually capable person can do. It may let somebody cross domains with less ceremony. It may give a teenager access to tutors, simulators, code generation, laboratories made of software, and intellectual companionship that would once have required a major institution. Some of those teenagers will use the whole thing to become monsters in the best sense.

Most will use it normally.

People are like that.

## The frontier recedes

Recursive self-improvement deserves serious attention because a tool that helps improve the tool can accelerate the whole loop. The DeepSeek engineer is close enough to that loop to feel it in his own daily work.

But his story also contains a much older human pattern.

A person becomes excellent at a difficult craft. Technology absorbs more of the craft. The person can preserve it as art, move upward into directing the machines, move sideways into another domain, or discover a new obsession created by the capability that replaced the old one.

The loss can be romantic and sad. The afternoon by the window was beautiful. The exact rhythm of the work was his. A future full of agents can be richer and still contain things worth missing.

Then tomorrow produces another cursed thing.

Some new system behaves strangely. Some optimization refuses to make sense. Some impossible project becomes merely difficult. Some field opens because ten thousand hours of machine labor now cost what ten hours used to cost. Everybody sensible goes home.

And the same kind of person who once spent all afternoon tuning an attention kernel leans toward the screen.

Oh, fuck.

This is interesting.
