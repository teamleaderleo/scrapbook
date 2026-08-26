# Infinite Information Doesn't Give You Infinite Energy

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 27 August 2026.*

I have a longstanding allergy to information asymmetry.

Not every asymmetry, obviously. Keep your password. Keep the encryption key. Keep the private medical record private. There are plenty of cases where information should stay narrow on purpose.

But a huge amount of ordinary human misery comes from somebody simply not knowing that a route exists, or not knowing the name of the thing they're already trying to find. A person doesn't know that a certain job exists. They don't know that a particular school has a transfer path. They don't know that the person across town solved the same problem last year. They don't know what to search, who to ask, which requirement is real, which one is boilerplate, whether the door is locked, or whether nobody ever tried the handle.

That kind of asymmetry has always felt awful to me because the information itself can be so cheap once somebody has it.

Then the job search got weird.

I started looking for unusually good engineering teams inside companies I would normally scroll past. Not prestige-shopping. Not "what Fortune 500 company should I work for." More like: okay, where is the absurdly technical work hiding?

The answer kept being everywhere.

[Westinghouse has software engineers working on nuclear safety I&C, operator HMIs, RTOS code, SCADE, and independent verification](https://github.com/teamleaderleo/job-search/blob/main/research/hidden-physical-software-atlas-2026-08-27.md). Caterpillar has autonomy engineers writing the software for mining and construction machines. Ericsson has people implementing 5G/6G baseband behavior in C++. Illumina has instrument software whose job is keeping sequencing data correct through power loss, retries, and restarts. Teradyne writes calibration software for the machines that test memory chips. Hexagon has one group estimating position from GNSS error models and another turning geometry into CNC instructions. Keysight has engineers inventing measurements over sampled optical and electrical waveforms.

None of this was secret.

That was the first unsettling part.

The postings were public. The product names were public. The teams were public. The documentation was public. In many cases the company had been describing the work in almost comically literal language for years.

I just didn't know the nouns.

I didn't know to search `LOCOTROL`, `Common Q`, `V93000`, `CGM`, `Baseband`, `WAFL`, `GammaPlan`, `In-Sight`, `DeltaV`, whatever. Search "software engineer" and the world looks flatter. Learn the proprietary nouns and suddenly the map acquires underground tunnels.

This is a pretty strong argument for making information easier to find. A person can make a radically better decision after one afternoon of seeing the territory properly.

It also runs directly into the strongest counterargument to my own information-asymmetry instinct:

**Infinite information doesn't give you infinite energy.**

Suppose I publish the entire map.

Here are the jobs. Here are the teams. Here are the skills that recur. Here are the hard gates. Here are the fake-looking gates that turn out to be surprisingly permeable. Here are the exact names to search. Here is a nuclear-software job that says C++ coursework counts. Here is the graphics team inside Garmin. Here is the geometry kernel inside Dassault. Here is a signal-processing job that explicitly accepts Applied Mathematics.

Great.

Now what?

Somebody still has to sit down and learn C++.

Or CUDA. Or numerical methods. Or embedded Linux. Or whatever the real missing capability turns out to be.

And "sit down and learn C++" is doing a heroic amount of work in that sentence. It means deciding this opportunity is real enough to deserve hundreds of hours. It means tolerating the part where the compiler gives you half a novel because one template argument is wrong. It means choosing this over every other thing you could learn. It means getting through the period where your new skill is too weak to be useful and too expensive to feel casual. It means doing enough real work that you can prove something afterward.

The information can be free while the action remains expensive as hell.

That's where a lot of generic talk about "upskilling" starts to sound thin.

Even if we imagine a perfectly run program — no credential scam, no stale curriculum, no corporate press release pretending a webinar is workforce development — it can still attack the wrong problem.

Sometimes the person does need training. Sometimes they already know enough and need a better way to prove it. Sometimes the missing skill is interview fluency under a clock. Sometimes the résumé is sending them into the wrong interview. Sometimes they're getting interviews and losing ordinary comparative selections. Sometimes the highest-return intervention is not another course; it's sending many more applications so one weird near miss doesn't carry the emotional weight of the whole search.

The [interview archive](https://github.com/teamleaderleo/job-search/blob/main/notes/interview-postmortems.md) makes this painfully concrete. One process exposed a real timed-implementation weakness. Another exposed weak retrieval around backend failure patterns. Google was a completely different failure mode: I cleared the interviews and then spent months in team matching before the candidacy ended without a match. MotherDuck ran a multi-person loop without leaving enough causal evidence to manufacture a lesson. Fiscal.ai went late-stage with broadly positive evidence and somebody else still got the job.

"Upskill" would be an absurdly lossy summary of those cases.

The useful question is smaller: **what is stopping this person from crossing this particular door?**

Maybe the answer is C++.

Fine. That is wonderfully concrete. Grit your teeth. Learn C++.

Maybe the answer is that you freeze when somebody asks you to build a Kanban board live. That's also concrete, and it suggests a different week of work.

Maybe the answer is that your résumé keeps advertising frontend when you want systems. Change the evidence hierarchy.

Maybe the answer is five years running RDMA clusters in production. Ah. Okay. That one does not collapse because you watched enough lectures on Saturday.

The whole population-level problem is worse because even a correct diagnosis doesn't guarantee action.

You can tell somebody exactly what would improve their odds and they may not believe you. They may believe you and decide the odds are still bad. They may want to do it and have no time. They may have time and no money. They may have both and be exhausted. They may reasonably prefer another life. They may start, discover that they hate the actual work, and have learned something useful by quitting.

Two people can receive the same perfect information and face completely different decisions.

"Spend six months learning C++ and a lot of strange technical careers become available" can sound like an invitation to one person and a threat to another. One has savings, curiosity, and an empty winter. Another has a child, rent due, and a job already consuming whatever concentration survived the commute.

The information asymmetry disappeared. The feasible action sets did not become equal.

Then there is the selection problem created by success.

Once I know that compilers, robotics, medical imaging, DSP, storage engines, CAD kernels, scientific instruments, avionics, telecom, grid software, and embedded systems are all real worlds, I have not become infinitely free. I have acquired a much nicer problem: now I have to choose.

The map can get so good that continuing to improve the map becomes another way not to leave.

This is where ["You Can Literally Just Say Go"](/desk/you-can-literally-just-say-go) starts touching the same problem from another side. A capable agent can make research and execution cheaper. It can inspect the territory, build exercises, explain a compiler error, generate experiments, compare job families, and keep the thread alive. That removes a remarkable amount of friction.

It does not choose what deserves six months of my life.

The human residue keeps getting smaller and somehow refuses to disappear.

Attention. Belief. Authorization. Commitment. The willingness to be embarrassed by a new domain for a while. The willingness to try a route before you know whether it pays. The willingness to stop collecting routes and walk down one.

I don't think this weakens the case for fighting information asymmetry. If anything, it makes the case more precise.

Good information can save somebody years of wandering. It can prevent fake gates from becoming permanent identities. It can tell a person, with evidence, "No, you are not categorically excluded from this; here is the actual gap." It can also do the opposite and save them from a fantasy: "This role genuinely wants years of specialist operating history; the neighboring door is better."

That is enormous leverage.

But information is leverage, not fuel.

Maybe the best career advice system is therefore less like a course catalog and more like diagnosis attached to a map. Show me the worlds. Show me the actual doors. Look at what I can already do. Tell me what is missing. Separate the thing I can learn next month from the thing that requires years of lived responsibility. Give me the cheapest experiment that would tell us whether this route is real.

Then leave room for the deeply inconvenient part.

I still have to do it.
