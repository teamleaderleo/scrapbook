# Facebook Without Facebook Ads

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 25 August 2026.*

GitHub is a weird product to evaluate because you rarely choose it in an empty room. You choose it after everybody else already did.

Pull requests, issues, comments, releases, bots, security alerts, checks — an absurd amount of software life piles into one familiar place. Send somebody a GitHub link and most of the interaction is already legible. They have an account. They know where the discussion goes. Their tools know how to talk to it. Open-source projects, companies, recruiters, libraries, random people fixing a typo at two in the morning, everybody arrives with years of accumulated familiarity.

GitHub's network is its best product.

The rest gets more awkward once you start pulling pieces away from it.

When GitHub floated the self-hosted Actions charge, the accounting was easy enough to understand: self-hosted customers still consume the Actions control plane, and GitHub has real costs running it ([GitHub Changelog](https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/)). If I'm already running the runner, though, I've accepted a decent amount of operational work. I own the machine, or the Kubernetes cluster, or whatever we decided was a good idea six months ago. I'm handling images, caches, credentials, networking, scaling, GPUs if things have gotten weird. GitHub provides the coordination layer.

The coordination has value; a capable shop can reproduce it too.

Actions wins by adjacency. A pull request opens, the workflow fires, the check appears in the pull request. Great. The experience is convenient because all the pieces are touching.

Consider Actions as a CI system by itself and the affection gets weaker. The YAML gets strange. The expression language gets strange. Reusable workflows go only so far. Local reproduction is awkward. Debugging gets annoying. Once you're operating a serious self-hosted fleet, you're doing a lot of the work anyway while GitHub keeps ownership of an opinionated execution model.

Free orchestration makes that trade easy to accept. Meter the orchestration separately and somebody eventually asks what they could run themselves.

Quite a lot.

A company doing serious self-hosting already has machines and people who know how to operate them. Look around and the rest of the kit is sitting there too: object storage, a registry, a secrets system, queues, observability, schedulers, internal services, a pile of agents wandering around fixing things, whatever. At some point “build our own CI” stops meaning “invent Jenkins from first principles” and starts meaning “connect the parts we already own.”

Then the migration gets incremental.

Keep the GitHub repository. Receive the event. Send it into your own system. Let your machines build the commit. Let your agents inspect it, argue about it, run tests, push artifacts, deploy it, clean up after themselves. When they're done, post a status back to the pull request.

GitHub becomes the place where the green checkmark appears.

The repository can stay for a very long time on that alone. Git itself travels easily. The annoying residue lives around it: pull request history, issues, accounts, permissions, integrations, all the little social traces that accumulate because people have been using the same place for years.

So the repo stays while more of the work leaves.

Agents make this easier because glue is getting cheaper. Internal systems have always carried a tax in adapters and maintenance. One API changes and somebody has to care. A homegrown tool survives its original author and suddenly the team owns a tiny software company whose only customer is itself.

Coding agents are unusually good at exactly this class of boring connective work. Migrate the workflow. Update the adapter. Fix the API call. Add the missing button to the internal UI. Keep five open-source components talking to each other. A team can peel away one annoying layer at a time; the grand replacement project dissolves into a sequence of small jobs.

Internal software gets one luxury GitHub lacks: one customer.

Your scheduler only has to schedule your jobs. Your review agent only has to understand the way your company reviews code. Your build system can assume the registry you actually use, the hardware you actually own, the deployment model you actually have. It can be weird. Weird is fine when everybody using it works in the same building, or at least the same Slack.

Eventually GitHub can occupy a very thin role while remaining socially indispensable.

Canonical repository here. Pull request here. Issue here. Identity here. Green checkmark here.

Everything expensive happens somewhere else.

Facebook had a cleaner answer to this problem: ads.

Facebook's network and its money machine were tightly coupled. More people meant more attention; more attention meant more ad inventory. The network itself produced something Facebook could sell at enormous scale.

GitHub's network can remain incredibly powerful while the money migrates to adjacent systems.

Enterprise seats help. Copilot helps. Actions, security products, Codespaces, packages, whatever comes next, all get absurd distribution from sitting next to the canonical repository. Each of those products has to win a product comparison once a customer decides to compare it.

And, Christ, Microsoft knows how to make that comparison disappear for a while.

Microsoft at its worst has always had this particular smell: the sales team is excellent, the enterprise agreement is excellent, identity already runs through Microsoft, procurement knows the vendor, security approved it last year, and the software itself is... fine.

Fine can have an incredible career when switching is annoying.

GitHub losing that kind of developer preference would be especially sad because GitHub won in a much more romantic way. Developers wanted to be there. It understood that software development was social, and it made collaboration easy enough that the site became a default home for software before enterprise procurement had much to say about it.

The Microsoftified version flips the source of loyalty. Engineers stay because the agreement is signed, the accounts exist, the integrations are old, and moving sounds like work.

AI keeps making the “sounds like work” part less persuasive.

The answer is insultingly simple: make the products excellent.

Give me an Actions control plane I would miss if I moved the repository. Give me agents good enough that my local swarm feels like a hobby project. Make enterprise administration pleasant. Make the security tooling feel worth choosing on its own. Let GitHub's insane distribution introduce people to products they keep because they love using them.

GitHub already has the rarest asset in software: everybody showed up.

The repo can remain canonical while the build farm, agents, security analysis, deployment system, artifact store, and all the interesting compute move onto machines the customer controls. GitHub keeps receiving the events and displaying the results.

Facebook had ads.

A green checkmark is a much thinner business.
