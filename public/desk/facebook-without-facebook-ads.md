# Facebook Without Facebook Ads

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 25 August 2026.*

GitHub's strongest feature may be that everybody is already there.

That sounds flippant, but it explains a lot. Developers already have accounts. Open-source projects already live there. Pull requests, issues, comments, releases, bots, security tooling, CI status, all of it piles into one familiar place. A repository can become public and immediately enter a network people already know how to use.

That's an enormous advantage.

It also means GitHub has to be careful about confusing the network with the products attached to it.

Git hosting is replaceable. CI is replaceable. Issue tracking is replaceable. Artifact storage is replaceable. A lot of the surrounding machinery can run perfectly well on computers you own.

Self-hosted Actions makes the tension unusually obvious.

If you're already running the runners, you've accepted most of the annoying operational work. You have the machines. You're dealing with images, networking, caches, credentials, scaling, whatever else your setup needs. Maybe you're running a few runners. Maybe you're running a whole fleet.

At that point GitHub Actions is valuable because it sits right next to GitHub. A pull request opens, a workflow runs, the result appears in the pull request. That's genuinely convenient.

As a CI system by itself, though, Actions can be pretty meh.

The YAML gets weird. The expression language gets weird. Reusable workflows only take you so far. Local reproduction is awkward. Debugging can be irritating. Once you're managing serious self-hosted compute, the balance gets stranger because you're doing a lot of the hard work yourself while still living inside GitHub's execution model.

So the free control plane has a useful role. It keeps the whole thing pleasant enough that nobody bothers asking a more dangerous question:

**What exactly am I still buying from GitHub?**

Because the answer can get thin surprisingly quickly.

You're buying the place where the repository lives. You're buying the event source. You're buying the pull request UI, the issue tracker, the identity system, the permissions, the checks. All useful. All very convenient.

But if you're already self-hosting a lot of your stack, then replacing the next layer stops sounding dramatic.

Run your own workers. Then run your own scheduler. Put artifacts in your own object store. Use your own registry. Use the secrets system you already have. Feed events into your own queue. Let your agents do the builds and tests and reviews. Post one status back to GitHub at the end.

Now most of the actual work is happening somewhere else.

The repository can stay on GitHub for a long time after that. Git itself is wonderfully portable; the social residue around the repository is where the friction lives. Pull request history, issues, accounts, integrations, all the familiar little traces accumulated over years.

And that gets to the real thing GitHub owns: the network.

Everybody's there because everybody's there.

Which is still an incredible business. But it creates a funny danger. The network effect belongs most strongly to GitHub itself, while the products around it still have to earn their keep.

Actions gets amazing distribution because it's attached to GitHub. That doesn't mean I'd choose Actions as my ideal CI system in an empty room.

Copilot gets amazing distribution because GitHub can put it directly in front of developers. Security products get the same advantage. Codespaces does too. Enterprise tooling, packages, all of it arrives with a head start most companies would kill for.

But distribution can cover for a mediocre product for a long time.

And, Christ, Microsoft knows how to do that.

Microsoft at its worst has always had this particular smell: the sales team is excellent, the enterprise agreement is excellent, procurement already knows the vendor, identity already runs through Microsoft, and the actual product is... fine.

Fine can survive for years when switching is annoying enough.

GitHub started from something much better than that. Developers actually liked it. People moved projects there because it felt better. GitHub understood that software development was social, and it made collaboration feel easy enough that the site became the default home for a huge part of software.

It'd be bleak to watch that turn into "your company already bought the Microsoft developer bundle."

AI makes this more dangerous because a lot of the old cost of leaving lived in glue.

Building your own CI used to mean maintaining your own CI. Every adapter breaks. Every API changes. Somebody writes a little internal service, then five years later everybody is scared to touch it. Buying the integrated thing spared you from becoming responsible for a small accidental software company inside your software company.

Agents make that tax smaller.

A capable agent can write adapters, migrate workflows, update integrations, repair little internal tools, keep open-source components talking to each other, and babysit a lot of the work that used to make "just build our own" sound exhausting.

For a technically capable team that already owns the machines, the old build-versus-buy calculation starts getting strange.

You can imagine an internal system with a Git server, an event stream, a task queue, object storage, a registry, secrets, workers, and a small UI holding it together. The company only has to make it work for itself. It can be as weird and specific as it wants.

If that gets cheap enough, GitHub risks becoming the front desk for software.

A very important front desk. A front desk everybody knows. The canonical repository is there. The issue is there. The pull request is there. Your public identity is there.

Meanwhile, the builds, tests, agents, deployments, analysis, and compute all happen somewhere else.

And then you get the ugly version of the Facebook analogy.

Facebook had a network effect and an extraordinarily effective way to turn that network into money: advertising. More people meant more attention; more attention meant more inventory; the network itself fed the business model.

GitHub has the network. The money mostly lives around it.

Enterprise seats, Actions, Copilot, security products, Codespaces, packages, whatever comes next. Those can all be good businesses. They also have to keep being good products.

If they drift into Microsoft-at-its-worst territory, where the sales motion and the lock-in are stronger than the software, GitHub can end up with a bizarre outcome: everybody still has a GitHub account, everybody still keeps the canonical repository there, and more of the valuable work keeps moving off the platform.

That's Facebook without Facebook ads.

The fix is almost embarrassingly simple.

Make really good products.

Make Actions so good that people who already own the compute still prefer GitHub's control plane. Make the agent experience so good that building your own swarm feels like wasted effort. Make the security tools excellent. Make enterprise administration pleasant. Make the surrounding products good enough that the network effect becomes an accelerant instead of a crutch.

GitHub has ridiculous distribution. It can put a developer product in front of a huge fraction of the software industry almost immediately.

If people with that much convenience still decide they'd rather assemble a pile of open-source software on their own machines, that's worth paying attention to.

The best version of GitHub's future is easy to imagine: everybody is already there, and the products are good enough that everybody is happy to stay.

The bad version is everybody is already there, so meh starts looking good enough.
