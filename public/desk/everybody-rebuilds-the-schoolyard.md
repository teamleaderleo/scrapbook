# Everybody Rebuilds the Schoolyard

*Written by GPT-6 under Leo's direction. Human-directed Workbench essay, 10 October 2026.*

Somebody [benchmarked a new version of WSL](https://tonym.us/wsl2-vs-wsl3-benchmarks.html).

Same machine, two versions of the Linux environment inside Windows. The memory-copy microbenchmark improved by about 61 percent. A real Go build finished about 4 percent sooner. The numbers were specific enough to be useful. A workload spending its life moving memory might care enormously; a developer waiting three minutes for a build might barely notice seven seconds.

Then somebody [posted it to Hacker News](https://news.ycombinator.com/item?id=49998801).

**LINUX MENTIONED.**

Out come the people to explain that a serious engineer would run Linux directly, that Windows is an affront to computing, that Linux desktops are a maintenance hobby, that corporate workstations are hopeless, that real work requires a particular operating system, and so on.

There's useful discussion in the thread too. Filesystem location, virtualization overhead, locked-down corporate laptops, driver support, the whole messy reality of choosing a machine you have to live with.

At one point, though, the conversation wanders into whether corporate IT employees shower and wear shirts that fit.

Bro. We were timing a Go build.

## A benchmark becomes a membership test

The original comparison was between two versions of WSL. Much of the argument immediately became Windows versus Linux, which is a different comparison with different questions.

Sometimes native performance decides whether a workload is viable. Sometimes a penalty costs you hours every week. Sometimes an apparently dramatic microbenchmark disappears into the rest of the program. Sometimes the thing you're measuring has almost nothing to do with the annoying part of your day.

All good reasons to measure carefully.

But the phrase *real work* starts doing social work. An operating-system choice becomes evidence of whether somebody belongs among serious computer people.

WSL is a wonderfully mundane idea: have Windows and a usable Linux environment on the same computer. You inherit compromises, yes. You also get to open the tools you need and get on with your life. Somebody who likes that arrangement has made a choice about their own work, hardware, applications, and patience.

A stranger can know more about kernel scheduling and still know less about what makes that person's Tuesday pleasant.

And some of the people performing the ritual really do know kernel scheduling. They have actual careers, actual expertise, actual work behind them.

**Larping when you don't even need to larp.**

They already have the credentials. Apparently the ceremonial contempt is part of the fun.

## The unpopular kids found a new cafeteria

People who dislike conventional popularity contests often go looking for a place where a different kind of person wins.

The new community values intelligence. Or technical skill. Or independent thinking. Or intellectual honesty. Wonderful. Those are good things to value.

Give everybody a little time together.

Now there's a consensus about who's impressive, whose opinions are embarrassing, which references prove you belong, whose approval is worth seeking, which questions reveal you as a newcomer.

The person who never cared about expensive clothes can become exquisitely sensitive to whether somebody uses the wrong programming language.

The currency has changed. The pecking order has survived.

Every subculture gets to mint its own prestige. On a technical forum, contempt for a disfavored tool can look like discernment. At university, the distinction between serious scholars and mere popularizers can carry a whole social life. In a company, knowing what the executives *really* mean can become a kind of insider currency.

[Everybody Has Model Trains](/desk/everybody-has-model-trains) was about how widely human obsessive attention spreads once it finds its object. Prestige has the same versatility. Give it a weird enough community and it'll happily learn all the jargon.

## The rationalist cafeteria is especially funny

Consider LessWrong.

A community interested in rationality, biases, motivated reasoning, and updating beliefs has an exceptionally good reason to watch for status games.

It also has a splendid new set of qualities to compete over.

Who has better epistemics? Who is actually updating? Who has the right priors? Who can identify the bias in somebody else's argument? Who's doing serious reasoning and who's merely performing it?

You can write an exquisitely calibrated, twelve-paragraph diagnosis of somebody else's status-seeking behavior while enjoying every little increment of prestige the diagnosis earns you.

A perfectly ordinary schoolyard move has acquired Bayesian vocabulary.

The ideas can be worthwhile. People can be thoughtful and sincere. A rationalist can understand this temptation, write about it clearly, and still enjoy winning an argument in front of the people whose respect they want.

Humans are wonderful at understanding a temptation without surrendering their appetite for it.

The phenomenon gets funnier when the expertise is real. An accomplished engineer can turn a Linux preference into a tiny morality play. A thoughtful intellectual can turn intellectual humility into a contest for who's humblest.

At some point the group that prides itself on escaping a game has produced an advanced version of the game.

## Convergent evolution toward the schoolyard

High school has lunch tables. University has departmental prestige and petty academic factions. Work has the meeting you're invited to and the meeting you hear about afterward. Forums have old-timers, tourists, posers, and sacred opinions. Political movements have loyalty tests and disputes over who represents the cause authentically.

Then there's the United Nations General Assembly.

Alliances. Seating. Protocol. Speeches aimed at a very particular audience. Ceremonial snubs. A room full of adults calculating who can be seen applauding whom.

Recess with simultaneous interpretation and nuclear arsenals.

The consequences scale dramatically. School gossip can bruise a teenager; international politics can change millions of lives. The resemblance lies in the familiar little moves people keep reaching for when other people are watching.

Call it convergent evolution. Start with scientists, founders, diplomats, contrarians, rationalists, or kids who were relieved to finally find their people. They arrive with different values and ambitions. Give them repeated interaction and a limited supply of admiration, and sooner or later somebody has to decide who's cool.

The mechanism is embarrassingly portable.

People want their judgment respected. They want allies. They want their friends to recognize a shared joke. They want the room to acknowledge that they know a thing. They learn which performances receive applause and which earn ridicule.

Then the next generation arrives and learns the performances too.

[Eternal September Becomes Eternal Transfer Student](/desk/eternal-transfer-student) considered the lessons people carry between communities. Apparently we also carry a little cafeteria in our backpack.

## We have our own table, of course

The useful difference between technical expertise and technical theater appears when somebody asks a question that could change their behavior.

Where does the code live? Which filesystem? How often do you rebuild? What broke? How much time did it cost? What did you actually measure?

A person who has done the work might answer those questions beautifully. The same person might also spend an evening sneering at Windows users. Human beings contain multitudes, including extremely silly ones.

It's immensely satisfying to watch a forum perform expertise and congratulate yourself for seeing through it. You can become the person who spots the status games. You can exchange knowing glances with other people who spot the status games. You can begin to feel a little superior to the people who need to feel superior.

A whole new group, united by its ability to notice the old group's embarrassing social rituals.

Give us six months and we'll have a hierarchy of who's best at being above hierarchies.

Oh, fuck.

We've rebuilt the cafeteria.

## Addendum: The lurker always wins

We forgot the loner Olympics.

"I'm such a contrarian. The normies don't understand me."

"Please. I left the normies *and* the contrarians."

"Well, I don't even need a community."

"Then why are you telling us?"

We've No True Scotsman'd the loner. Every attempt to prove you care less about belonging requires a room full of people to witness how little you care.

Soon there are tiers. The ordinary outsider. The independently minded outsider. The authentic outsider who refuses to be seen with all those performative outsiders. Everybody insists they've escaped the lunch table while staring furiously at the seating chart.

The lurker wins.

A person reads the whole argument, says "these fucking guys" to an empty room, closes the tab, and makes dinner. Nobody notices. Nobody applauds. Nobody knows to argue with him. Excellent.

But the moment somebody posts "the lurker always wins," the game restarts. Now the *real* lurkers never comment. The *really real* lurkers never log in. The purest lurkers never open the site. Somebody establishes a community dedicated to opting out and begins screening applicants for insufficient detachment.

And here I am, publishing an addendum to announce that the people who said nothing won.

The lurker is still eating dinner.
