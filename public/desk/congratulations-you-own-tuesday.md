# Congratulations, You Own Tuesday

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 27 August 2026.*

The stupid premise was: treat money like a cell.

How many times can it split before the pieces stop feeling economically meaningful?

Divorce gives us the dumbest possible laboratory. Person A has a fortune. A marries B. They divorce and split the money. B marries C. B and C divorce. C marries D. Keep propagating the ritual downward and suddenly trickle-down economics has acquired a marriage license.

Under the clean cartoon where every divorce halves the relevant wealth,

\[
W_n = \frac{W}{2^n}.
\]

A million dollars goes to $500,000, then $250,000, then $125,000. Ten clean halvings leave about $977.

A billion has more runway:

| Divorce generation | Downstream share |
| ---: | ---: |
| 1 | $500M |
| 2 | $250M |
| 3 | $125M |
| 6 | $15.6M |
| 10 | $976,563 |
| 20 | $954 |

The money can travel surprisingly far before the newest recipient is arguing over a used Corolla.

Real divorce law immediately wrecks the clean halving machine with separate property, prenups, jurisdiction, support rules, transaction costs, children, houses, mortgages, human judgment, whatever. Great. We are doing divorce-onomics. The machine gets to be stupid enough that we can see what it does.

## The chain starts branching

The first version is a chain:

A marries B. Divorce.

B marries C. Divorce.

C marries D. Divorce.

The original fortune leaves a geometric trail behind it:

\[
A:\frac{W}{2},\quad
B:\frac{W}{4},\quad
C:\frac{W}{8},\quad
D:\frac{W}{16},\ldots
\]

Then somebody asks the obvious dangerous question: why should only the downstream recipient remarry?

A can remarry too.

Now both halves split again.

Then all four holders remarry.

Now there are eight.

A fortune stops walking down a line and starts exploding into a pyramid. With \(k\) starting fortunes and \(n\) complete rounds, the number of holders can grow like

\[
k2^n
\]

while each clean descendant share shrinks like

\[
\frac{W}{2^n}.
\]

Several starting fortunes give us several pyramids. The whole city can spend Saturday night passing little ancestral fragments of Rockefeller money around through increasingly complicated ex-spouse graphs.

So I gave the first toy city 100 starting fortunes totaling $10 billion and 100,000 adults.

Add a 5% haircut every time wealth passes through a divorce. The remaining 95% splits equally, so each child branch carries 47.5% of its parent's tracked wealth:

\[
S_n = 100\text{M}\cdot0.475^n.
\]

After nine complete rounds, 51,200 people carry pieces of the original fortune and each piece is about $123,096. Split 48,800 of those holders one more time and the money reaches the entire city.

The last 97,600 recipients get about $58,470 each. The 2,400 people who skipped that final divorce keep about $123,096.

Average tracked wealth per resident: about $60,021.

Original fortune: $10 billion.

Residents at the end: about $6.002 billion.

Somebody has eaten almost $3.998 billion.

Ah.

Lawyers.

## The pyramids collide

Separate pyramids are too polite. Let everybody marry across them.

For the next city, I started with 100,000 adults:

| Group | People | Wealth each | Total |
| --- | ---: | ---: | ---: |
| Billionaires | 10 | $1B | $10B |
| Millionaires | 990 | $5M | $4.95B |
| Affluent | 9,000 | $250K | $2.25B |
| Everyone else | 90,000 | $25K | $2.25B |
| **City** | **100,000** |  | **$19.45B** |

The mean begins at $194,500. The median begins at $25,000. The Gini coefficient is about 0.857.

Every round, pair the city randomly. If two people enter a marriage with \(x\) and \(y\), combine their tracked wealth, charge a 5% divorce toll, then give each person half of the remainder:

\[
x+y \longrightarrow
\begin{cases}
0.475(x+y)\\
0.475(x+y)
\end{cases}
\]

A billionaire meeting somebody with $25,000 therefore produces two people with about $475 million and a $50 million invoice drifting toward the family-law sector.

Then those two $475 million projectiles go back into the pool.

One fixed-seed run gives this:

| Round | Total wealth left with residents | Median | Top 1% share | Gini |
| ---: | ---: | ---: | ---: | ---: |
| 0 | $19.45B | $25K | 76.9% | 0.857 |
| 5 | $15.05B | $41K | 53.2% | 0.722 |
| 10 | $11.65B | $57K | 7.8% | 0.503 |
| 15 | $9.01B | $87K | 1.9% | 0.155 |
| 20 | $6.97B | $70K | 1.1% | 0.028 |

By round 20 the billionaire class has been atomized. The middle of the city has converged into a narrow band around seventy grand. The Gini looks gorgeous.

The city has also lost about $12.48 billion.

“Congratulations, citizens. We have achieved an almost perfect wealth distribution.”

“Excellent. Where's the rest of the wealth?”

“Administrative convergence costs.”

“What are administrative convergence costs?”

“Legal fees.”

“So who has the money?”

The family-law firms slowly close the vault door.

This is the first great law of divorce-onomics: a redistribution machine with an external toll collector can produce beautiful equality statistics while feeding the toll collector the city.

At 5% leakage per complete round, resident wealth carries a multiplier of \(0.95^n\). Twenty rounds leaves only about 35.8% of the starting wealth inside the participant pool.

The Gini can become immaculate while everybody gets poorer together.

Okay. Easy fix.

## Make the lawyers divorce too

Every lawyer who receives fees goes straight back into the marriage pool.

Now the fee stays inside the city. Total wealth remains $19.45 billion forever.

Surely we've closed the loophole.

I assigned 1,000 of the 100,000 residents to be lawyers. Every couple still pays 5% of its combined tracked wealth as a legal fee, except the fee goes to a randomly chosen lawyer. Lawyers themselves marry and divorce under exactly the same rule as everybody else.

The old billionaire class melts away.

The lawyers become the new aristocracy.

After 50 rounds in the same kind of random simulation, total city wealth is still $19.45 billion. The median sits around $142,000. The Gini settles around 0.295.

Average non-lawyer wealth settles near:

\[
\$175,976
\]

Average lawyer wealth settles near:

\[
\$2,028,357.
\]

In that run, 999 of the richest 1,000 people were lawyers.

“But we made the lawyers divorce!”

Yes.

Yesterday's lawyer fortune gets mixed outward through today's marriage. Then today's divorces happen and the lawyers get paid again.

They have a faucet.

We can derive the equilibrium without simulation. Let the city's mean wealth be \(\mu=\$194{,}500\), the divorce fee be \(f=0.05\), and lawyers be a fraction \(p=0.01\) of the population. After the fee, each spouse keeps

\[
r=\frac{1-f}{2}=0.475
\]

of the couple's combined wealth.

A typical non-lawyer with long-run expected wealth \(O\) meets a random partner with expected wealth \(\mu\), so

\[
O=r(O+\mu).
\]

That gives

\[
O=\frac{r\mu}{1-r}\approx \$175{,}976.
\]

A lawyer gets the same marriage dynamics plus an average share of the legal fees. Total fees each round are \(f\) times total city wealth, spread across \(p\) of the population:

\[
L=r(L+\mu)+\frac{f\mu}{p}.
\]

Solve it and:

\[
L\approx \$2{,}028{,}357.
\]

The lawyer ends up about 11.5 times richer than the average non-lawyer.

We have abolished the original billionaire caste and manufactured Legal Feudalism.

Beautiful.

## Fine. Everybody gets to be the lawyer

Permanent lawyer status is the bug.

Take the same 5% fee and randomly assign each divorce's fee to anybody in the city. Today you're the divorcing spouse. Tomorrow you receive somebody else's legal fee. Next week you own seventeen percent of a boat for four hours because we'll get there in a minute.

Run that for 30 rounds and the $19.45 billion stays inside the city.

One fixed-seed run lands around:

| Measure | Round 30 |
| --- | ---: |
| Mean | $194,500 |
| Median | $192,182 |
| Bottom 10% threshold | $172,528 |
| Top 10% threshold | $219,588 |
| Gini | 0.053 |

Now the fee is circulating instead of accumulating in a permanent profession. Everybody gets temporary turns at the toll booth, and repeated pairwise averaging keeps smearing the old concentrations outward.

Our final economic doctrine has arrived:

**Everybody must marry. Everybody must divorce. Everybody must occasionally be the lawyer.**

A central bank can pack up. Fiscal policy can go home. The Treasury becomes the Department of Matrimonial Circulation.

Excessive concentration in the upper decile?

Raise the marriage rate by 75 basis points.

Markets rally on rumors of three billionaire engagements.

CNBC hires a wedding correspondent.

The entire economy becomes a speed-dating event with an actuarial department.

Then somebody asks who gets custody of the yacht.

Oh.

Here comes the timeshare.

## Finally, a use for timeshares

Cash divides beautifully. A yacht remains one yacht.

So does the mansion, the Ferrari, the Basquiat, the ski chalet, the weird glass cube in Manhattan, whatever else survives the great matrimonial blender.

Selling every indivisible asset and distributing cash would work, except we'd be throwing away the most cursed invention already sitting on the shelf waiting for a purpose.

Timeshares.

The yacht gets time-sliced.

The mansion gets time-sliced.

The Ferrari gets time-sliced.

Property rights stop attaching only to an object. They attach to an object during a window:

\[
\text{property right}=\text{asset}\times\text{time interval}.
\]

You own the yacht Tuesday from 2 PM to 8 PM every third week through 2034.

Your ex owns Wednesday mornings.

Her next ex gets the first half of June.

A downstream divorce can split a six-hour yacht block into two three-hour yacht blocks. Keep propagating and somebody eventually inherits the right to stand on the aft deck from 4:17 to 4:23 PM on alternating leap years.

The old question was, “Who owns the house?”

The divorce-onomics question is, “Who owns the house right now?”

Inheritance becomes magnificent.

“I leave my daughter the villa.”

“Oh wow.”

“February.”

“All of February?”

“First and third weekends.”

Capitalism has become Google Calendar with deeds.

And this actually completes the thought experiment in a way cash alone couldn't. The money pyramid handles divisible wealth. Temporal ownership handles scarce indivisible goods. As the marriage graph spreads through the city, ownership itself gets chopped into smaller claims across people and time.

Own everything eventually.

Hold each thing briefly.

The timeshare salesperson, once regarded as a predator lurking beside the resort buffet, becomes a vital civil servant. Four-hour presentations turn into constitutional law. The booking portal becomes more important than the stock exchange.

Somewhere in the Department of Formerly Marital Assets, a clerk is handling the yacht calendar for 8,192 ex-spouses and their descendants.

The richest person alive is eventually somebody with an absolutely vicious Tuesday.
