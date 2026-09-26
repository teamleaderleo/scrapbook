# Buy Bob Another Seat

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 26 September 2026.*

Two LocalLLaMA threads managed to turn a normal make-or-buy question into a referendum on local AI.

One side takes the public API price for a frontier model, multiplies it by a giant token count, looks at the annual number and says cloud inference is economically doomed. Another side looks at a half-million-dollar accelerator server, adds idle time and operator work, and says local inference is economically doomed.

Everybody has enough arithmetic to sound serious.

The company buying the AI somehow disappears.

Before a business builds an inference plant, it can buy Bob a seat.

## Start with the product you're actually buying

As of September 2026, [ChatGPT Business](https://openai.com/business/pricing/) sells Standard seats for $20 a month on annual billing and Premium seats for $100. Premium carries five times the included usage, and a workspace can buy credits after included usage runs out.

[Claude Team](https://claude.com/blog/claude-team-updates) is sitting in almost exactly the same neighborhood: $20 Standard, $100 Premium on annual billing, five times the usage for Premium, plus additional capacity for power users. Anthropic also sells [prepaid usage bundles](https://support.claude.com/en/articles/14246112-buy-usage-bundles) with discounts that rise with the size of the bundle.

Prices will change. The category is more important than today's exact rate.

If Alice can do her work inside a $100 seat, the marginal procurement decision is absurdly simple. Give Alice the seat.

A $100 seat costs $1,200 a year. Give the same person a $100 seat from another provider and the combined annual spend is $2,400. A $500,000 accelerator server represents more than two hundred years of that one-person, two-provider subscription spend before power, cooling, networking, repair, financing, spare capacity or anybody's time enters the calculation.

Obviously the server can serve more than one person. That is the point of doing the comparison at the right level. A human subscription and an accelerator node are completely different products serving completely different workload envelopes.

The question comes first:

**Does the seat solve the job?**

If it does, procurement is finished.

Nobody gets a medal for replacing a wonderfully cheap shared service with a private machine.

## Seat economics are weird on purpose

A human is an unusually friendly thing to sell expensive compute to.

Humans sleep. They go to lunch. They sit in meetings. They stare at a paragraph for four minutes. They ask three questions, disappear into a code editor, come back later and ask another one. Even extremely heavy users have gaps.

A provider gets to pool millions of these lumpy little demand curves across a giant fleet.

The subscription is therefore doing more than hiding token accounting from the user. It is selling a pooled service at a human-shaped price.

[Somebody Out There Needs the Tokens](/desk/somebody-out-there-needs-the-tokens) came out of the absurd edge case: a $200 subscription attached to a workload that had recorded more than a billion model tokens in ten hours. The interesting part was precisely how disconnected the retail subscription price could become from the raw amount of inference delivered to one extreme user.

For an employer buying seats for employees, this can be fantastic.

Buy Standard for ordinary users. Give Premium to the maniacs. Add credits where the product allows it. Mix providers where different models earn their place. Keep doing this until the product stops fitting the work.

The marginal user can be incredibly cheap.

## The API starts when the human disappears

A background agent is a different customer.

It can work at 3:14 in the morning. It can submit another request the instant the previous one finishes. A queue of two hundred tasks has no meeting to attend. A nightly batch job has no natural reason to stop because somebody went home.

Once the workload becomes programmatic, continuous or machine-paced, per-human seat economics stop describing what you are buying.

Great. Now compare compute.

Even here, the usual internet comparison jumps straight to the loudest possible number: synchronous public API sticker pricing.

OpenAI's [Batch API](https://developers.openai.com/api/docs/guides/batch) currently charges 50 percent less than synchronous API use for work that can tolerate asynchronous completion. For larger enterprise workloads, [Reserved Tier](https://openai.com/api-reserved-tier/) lets customers pre-purchase provisioned throughput for GPT-5.6-era models. Older model families have [Scale Tier](https://openai.com/api-scale-tier/), where token throughput is purchased in committed units.

Retail pay-as-you-go API pricing is a product. Batch is another product. Reserved capacity is another product. Negotiated enterprise agreements are another product. Raw GPU rental is another product.

A company with a giant stable workload has procurement people for a reason.

Multiplying the most expensive convenient retail rate by a factory-scale workload and declaring the resulting number to be "cloud economics" is the AI version of pricing a datacenter from AWS on-demand VM rates.

Of course the number gets ugly.

The cloud provider also knows the number gets ugly.

## Then let the workload earn a factory

Owning accelerators can be an excellent decision.

I have already been doing the less theatrical version of this accounting in [Glaeda issue 777](https://github.com/teamleaderleo/glaeda/issues/777) and the linked [frontier inference economics note](https://github.com/teamleaderleo/scrapbook/blob/main/knowledge/ai-systems/frontier-inference-economics.md).

The workload model separates recorded tokens into fresh prefill, cache-hit input and generated decode because those create very different serving demand. It carries burst concentration separately from the 24-hour average. It keeps model quality beside throughput. It treats host CPU, RAM, storage, browser work and tool execution as resources that can contend independently from the accelerator.

The current measured mix is especially useful because it destroys the easy intuition that a giant token counter equals a giant amount of fresh model computation. Recent Codex telemetry showed about 97.8 percent input-cache reuse and a tiny generated-output share. Under one current GPT-5.6 Sol replacement-cost calculation, a 10 to 12 billion recorded-token weekly workload at that measured mix lands around $275,000 to $330,000 a year at public standard-context API-equivalent rates.

Now dedicated hardware belongs in the conversation.

A few hundred thousand dollars of recurring replacement cost is enough to make a large accelerator purchase, a dedicated rental contract, or some other committed capacity worth serious analysis.

The same note also shows why the answer changes so violently when the workload changes. More generated output, lower cache reuse, long-context multipliers, different open-weight models, different hardware, different burst windows and different latency targets move the economics by multiples.

This is ordinary accounting.

Purchase price. Economic life. Residual value. Power. Cooling. Operator time. Repairs. Idle capacity. Rental rate. API rate. Cache reuse. Measured useful throughput. Queueing. Model quality. Failure behavior.

Then ask which option produces accepted work for the least money at the service level you actually need.

No secret spreadsheet is required to discover the existence of the crossover. Better private data helps locate the crossover more precisely.

## Privacy gets a price too

"On-prem privacy" often arrives in these discussions as if privacy itself settles the purchase.

Sometimes it does.

A contract can require a defined processing environment. A regulated workload can have a real data-residency constraint. A company can possess trade secrets valuable enough to justify tighter control. An organization can decide that a particular class of data stays on machines it owns.

Cool. Put the requirement in the model and pay for it.

A huge amount of ordinary business work lives somewhere else. OpenAI's current Business offering says it does not train on business data by default. Anthropic says the same for Claude Team. A company whose requirements are satisfied by those products gets to buy the service instead of operating the machine.

Owning the box gives you control and gives you the entire operational bill for exercising that control.

Privacy should survive contact with the threat model, the contract and the accounting department.

## Model quality belongs on the invoice

A second easy mistake is comparing dollars per token while quietly changing the model.

A frontier API and a local open-weight model can both emit tokens. The tokens can have very different economic value.

If the local model requires twice as many agent loops, causes more failed edits, needs more human review, struggles with the exact long-context workload or simply cannot do the task at the same level, cheap local tokens can become expensive finished work.

The useful denominator is closer to:

**dollars per accepted task**

or, for a fleet:

**dollars per unit of useful completed work at the required latency and reliability**

Glaeda's inference work deliberately keeps task and fleet completion in the experiment instead of worshipping one tokens-per-second number.

The same rule applies in the other direction. A local model with good enough quality, resident state and very high utilization can become wonderfully cheap. Once the machine is already paid for and a queue can keep feeding it useful work, the marginal economics can get beautiful.

Measure the work.

## The hybrid answer keeps showing up

The ideological argument wants a winner.

Cloud or local.

Rent or own.

Closed or open.

Centralized or sovereign.

Procurement can be much less exciting.

A business can buy cheap human seats for interactive work, send asynchronous automation through batch pricing, reserve capacity when demand becomes predictable, rent specialized accelerators for temporary jobs, own the stable base load once utilization justifies it, and send peaks back to somebody else's giant fleet.

The later Glaeda work keeps converging on exactly this kind of composition for serious inference:

**resident local base load + hosted burst overflow**

The owned machine gets a queue. Background work keeps it productive when interactive demand is quiet. The provider absorbs ugly peaks, model diversity and capacity the local fleet would be stupid to provision permanently.

Cloud pooling remains valuable. Ownership remains valuable.

Each one gets the part of the workload it is good at.

## Buy the boring thing first

A lot of local-AI discourse gets emotionally attached to the machine.

The box is tangible. You own it. The fans spin for you. Nobody can change your rate limit. Nobody can discontinue the model. The whole setup feels independent in a way a subscription never will.

Great. Machines are fun. I own a growing little compute fleet partly because owning useful machines is fun.

Business accounting gets to be much less romantic.

Use the cheapest product that actually buys the capability you need under terms you can live with.

For human work, that may be another seat.

For a power user, it may be a premium seat and credits.

For a giant asynchronous workload, it may be Batch.

For predictable API demand, it may be reserved or negotiated capacity.

For a steady accelerator queue, it may be rented or owned hardware.

For a steady floor with ugly peaks, it may be all of the above at once.

The workload can earn its way toward the factory.

Until then, Bob is sitting there waiting for somebody to approve another $100 seat.
