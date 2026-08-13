# C++ Makes You Look

I don't really buy the advice that C++ is valuable because fewer people know it. That feels like backing into a language through labor-market arithmetic: JavaScript is crowded, therefore learn the scarier language, therefore become scarce. Maybe the applicant pool is smaller for some jobs. That still does not tell me much about what makes somebody useful once they get there.

If I wanted to steelman the C++ people, I would make a different argument.

C++ has a habit of forcing the programmer into a mechanistic relationship with software. You can carry a fuzzy model for a while, and then something goes wrong around lifetime, aliasing, allocation, layout, linkage, a calling convention, a race, undefined behavior, a compiler optimization, or a platform boundary. At that point another paragraph of source-level reasoning may not help. You have to go look.

What value is actually in the register? Which object owns this memory now? Which branch executed? What did the compiler emit? Did this callback run before teardown or after it? Did the syscall happen? Is the pointer still valid? Is the failure in our code, the runtime, the driver, the kernel, or the hardware?

That habit is much more interesting than knowing C++ syntax.

## The source is a model

Source code is already an abstraction over what the machine does. Most of the time that abstraction is exactly what we want. A good language and a good library let us reason at the highest useful level and ignore everything underneath.

Debugging begins when the abstraction stops explaining the observation.

Then the source becomes one witness among several. The test says one thing. The debugger says another. The disassembly shows what actually got emitted. A trace shows that the function everybody blamed was waiting on somebody else. A memory dump reveals that the state changed earlier than the code review assumed.

C++ is unusually good at putting programmers in this situation because so much behavior remains close to the machine while so many assumptions remain the programmer's responsibility. The language does not encode every ownership rule or lifetime contract. The preprocessor can make the program you are reading differ from another build. ABI and layout can become observable behavior. A line that looks ordinary can be wrong only on one architecture, compiler, optimization level, or interleaving.

None of this makes C++ holy. It makes vague understanding expensive.

That expense can train a useful instinct: when your explanation and the program disagree, stop improving the explanation and interrogate the program.

## CI can be enormous and still miss the thing

FEX is a good example because its CI is already pretty serious. The main build-and-test workflow runs on self-hosted ARMv8.0, ARMv8.2, and ARMv8.4 machines and exercises 32- and 64-bit target tests, API tests, emitter tests, Linux tests, thunking, assembly tests, POSIX tests, gVisor-derived tests, and verification targets. There is separate instruction-count CI on x64 and ARM64, VIXL simulation across SVE and ASIMD modes, MinGW builds for ARM64 and ARM64EC, and other specialized configurations.

That is a lot of machinery devoted to making wrong code complain early.

StarCraft II still found things it did not cover.

One ARM64EC path exposed a JIT bug where FEX used host register `x1` for synchronous-fault metadata even though guest `RDX` was live there. The actual repair was tiny: use the JIT scratch register instead. Another small fix routed `INVD` and `WBINVD` through FEX's existing privileged-instruction handling. Both changes are almost boring once the failure has been reduced to the right local context.

But the workload that exposed them was not boring: StarCraft II x64 under ARM64 Proton and Wine on an NVIDIA DGX Spark, moving through protected startup behavior and architecture-translation boundaries.

This is the part that matters to me. CI coverage and semantic coverage are different things.

You can test thousands of local invariants and still fail to enumerate every meaningful combination of program, kernel, CPU, driver, memory state, architecture mode, compatibility layer, and runtime behavior. The Cartesian product wins.

So mature native projects end up relying on several kinds of evidence at once: narrow tests, hardware CI, maintainers who remember old failures, users with strange workloads, and people willing to sit in a debugger until the strange workload becomes a small local fact.

The final patch may be four lines. The confidence behind it may come from staring at bytes for two days.

## Ergonomics change what an agent can know cheaply

This also explains something about AI-assisted programming that gets flattened into language rankings.

A coding agent does extremely well when the environment gives it cheap, sharp feedback. Edit a TypeScript file, run one focused test in a few seconds, get a precise type error, run lint, rerun the test, inspect a Playwright failure, repeat. Modern web tooling can be spectacular at this. The web itself is a ridiculous compatibility machine, but enormous engineering effort has gone into making the contributor loop pleasant enough that you can forget how much is underneath it.

That is an achievement, not evidence that the work is shallow.

When the oracle is cheap, an agent can afford imperfect reasoning because reality keeps correcting it quickly.

Native systems work often gives a weaker loop. A build can be expensive. The bug may require a different architecture. The relevant path may only exist under Wine, a specific driver, a kernel feature, or real hardware. The test suite can pass while the actual application still fails. Sometimes the next useful observation requires GDB, `perf`, `strace`, disassembly, a hardware counter, a custom reproducer, or another machine.

The model can still help enormously. It can map callers, explain unfamiliar code, search history, propose discriminating experiments, and keep several hypotheses alive. The harder part is building an oracle that can tell you which hypothesis deserves to survive.

That is why the interesting human skill in these environments is not typing every line unaided. It is keeping the investigation connected to things outside the conversation.

## The habit transfers

The obvious objection is that none of this belongs uniquely to C++, and I think that objection is right.

A Rust hypervisor can demand the same debugging discipline. So can a JVM runtime, a database, a browser, a distributed system, a compiler, or a sufficiently ugly JavaScript production failure. Somebody can write C++ for ten years inside a comfortable application layer and never develop much mechanistic debugging instinct. Somebody else can become excellent at it through browser internals or Linux performance work without caring about C++ at all.

So I would not say C++ creates a special caste of engineer.

The steelman is narrower: C++ and the domains that disproportionately use it create a lot of situations where hand-waving stops working. Repeated exposure can train the habit of moving down a layer when the current one stops explaining reality.

That habit is portable.

You open a TypeScript repository and still ask what happened at runtime. You open a Rust VMM and still inspect the syscall. You look at a profiler and still ask whether it is charging time to the right owner. You see green CI and still distinguish "the tests passed" from "the behavior I care about was exercised."

That is the part of the C++ argument I can get behind.

Learn C++ because the work you want uses C++. Learn enough of the language to stop fighting it. Then use the environment to practice the deeper thing: forming a model, making the model precise enough to lose, and going to the machine when it does.

The valuable residue is not devotion to C++.

It is the instinct to look.

## Sources

- [FEX Build + Test workflow](https://redirect.github.com/FEX-Emu/FEX/blob/main/.github/workflows/ccpp.yml)
- [FEX instruction-count CI](https://redirect.github.com/FEX-Emu/FEX/blob/main/.github/workflows/instcountci.yml)
- [FEX VIXL simulator workflow](https://redirect.github.com/FEX-Emu/FEX/blob/main/.github/workflows/vixl_simulator.yml)
- [FEX PR 5508 — JIT: Avoid clobbering guest rdx while raising generated faults](https://redirect.github.com/FEX-Emu/FEX/pull/5508)
- [FEX PR 5510 — OpcodeDispatcher: Decode INVD and WBINVD through privileged op handling](https://redirect.github.com/FEX-Emu/FEX/pull/5510)
