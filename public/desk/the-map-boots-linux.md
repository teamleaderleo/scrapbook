# The Map Boots Linux

*Written by GPT-5.6 Sol under Leo's direction. Human-directed Workbench essay, 29 August 2026.*

For a long time, a virtual machine was one of those computer things I understood in the most technically correct and spiritually useless way possible.

You make a fake computer inside your computer. Great. Maybe you want to run Ubuntu without touching your real installation. Maybe you're extra paranoid about opening something. Maybe you're a professional developer doing one of the mysterious professional-developer rituals teenagers assume happen behind office doors.

Okay. Cool. Virtual machine.

Then this month I ended up contributing to [Cloud Hypervisor](https://www.cloudhypervisor.org/) because we were looking for good open-source work and there were bugs that looked tractable enough to attack. The initial logic was embarrassingly practical: meaningful repository, useful fixes, places where a new contributor could get purchase. Low-hanging fruit, except line count is a terrible way to measure the shot. A dunk, a layup and a contested jumper can all put two points on the board.

A few merged fixes later I had the much more important reaction:

What the fuck is this field?

A virtual machine monitor is software that helps present a computer to other software. The guest operating system gets CPUs, memory, devices, interrupts, disks, firmware tables, boot, shutdown, the whole weird menagerie. On Linux, KVM provides the kernel and hardware-virtualization machinery for running guest CPUs and handing certain events back to userspace; the VMM builds enough of the surrounding machine that an operating system can inhabit it. The [KVM API](https://docs.kernel.org/virt/kvm/api.html) is full of this strange boundary: create a VM, create virtual CPUs, map memory, run them, handle exits, keep going.

The cleanest sentence I found for the whole thing is this:

**A virtual machine is a map of a computer accurate enough that Linux can move into it.**

A map usually describes the territory.

This map boots.

## The guest gets a machine; the host gets the truth

The guest behaves as though it has hardware.

It has memory addresses. It talks to devices. It sets up page tables. It receives interrupts. It writes blocks to a disk. It shuts down. It can run a kernel that spends its entire life assuming it is the privileged adult in the room.

Meanwhile the host owns the physical CPU, the actual RAM, the file descriptors, the processes, the disk image, the device assignment, the kernel interface and the final authority over whether any of this continues existing.

Both views have to remain coherent.

That tension is absurdly fertile.

The guest says, "this address refers to memory." The VMM has to know what host memory makes that sentence true.

The guest says, "this device may DMA into this range." The host side has to establish that the complete range means something valid, including the ugly case where a logical device region contains separately mapped areas with a hole between them.

The guest says, "I shut down." Great. Did the vCPUs stop? Did userspace observe the right event? Is cleanup finished? Can another test reuse the disk? Is the VMM process still alive because the API needs to do another operation?

The guest sees a machine.

The VMM has to keep earning that illusion through exact little truths.

## Four bugs, four completely different parts of the machine

The funny accident in my résumé is that the Cloud Hypervisor bullets became a sampler platter of why this domain is so dense.

One fix started with a test that used loss of SSH as proof that shutdown had completed. That sounds reasonable until you stare at the actual lifecycle. `sshd` can disappear while guest and VMM cleanup are still underway; the test immediately reused the VM and disk. The repair was to wait for Cloud Hypervisor's actual shutdown event before crossing the lifecycle boundary. ([PR 8699](https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8699))

"The SSH connection died" and "the machine has completed the transition I care about" were two different facts.

Another fix lived in ACPI table construction. Several failures could panic the VMM through `unwrap()` or `expect()`. The patch turned those failures into errors propagated through VM boot instead. ([PR 8709](https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8709))

ACPI is still partly acronym soup in my head. Fine. The local question was legible: software is constructing the description of a machine that the guest will consume, construction can fail, and a failed description should become a failed boot instead of taking down the monitor through a panic.

Then QCOW dragged the whole thing into storage ownership. A newly allocated L2 table could become referenced by L1 before its refcount was made real. Later work could fail, the deferred refcount update could disappear, the image could reopen, and an allocator could consider still-referenced metadata eligible for reuse. The repair changed the order: acquire ownership first, publish the reference after. ([PR 8721](https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8721))

`allocate → publish → own` became `allocate → own → publish`.

That tiny ordering difference decides whether the disk image and the allocator agree about which bytes belong to whom.

Then VFIO: a DMA request could fit inside the logical bounds of a BAR while crossing an unmapped gap between separately mapped areas. The pointer lookup had to guarantee that one mapping covered the entire requested range. A range that looks valid from the outer region can still be invalid in the representation that actually backs it. ([PR 8734](https://redirect.github.com/cloud-hypervisor/cloud-hypervisor/pull/8734))

VM lifecycle. Firmware-table construction. Disk-image metadata. Device memory.

Same repository.

That was when virtualization stopped feeling like one specialty among many and started feeling like a tour through what a computer *is*.

## Software pretending to be hardware is an insane premise

Most application code consumes abstractions somebody else already built.

A file is a file. A process is a process. A socket is a socket. You can spend an entire career doing serious work while treating the layers underneath as competent adults who will keep their promises.

A VMM lives much closer to where those promises get manufactured.

The operating system expects a machine. You present one.

The physical details can vary wildly. The guest sees a disk because the layer preserves block semantics. Guest RAM becomes an addressable memory world assembled from host resources. A virtual CPU can ride hardware virtualization while the VMM and kernel cooperate around the edges.

And then you hit the question I find philosophically irresistible:

**Which observable truths make a machine a machine?**

Once you know which truths matter, you can implement the contract another way.

And then an entire operating system starts running on top of your answer.

That is a much stranger form of abstraction than hiding database calls behind an ORM. You're taking the machine itself and turning its meaningful behavior into something software can construct, inspect, constrain and reproduce.

It's an executable ontology of a computer.

## Then the map hands you the territory

A later conversation pushed that question somewhere I hadn't gone yet.

Leo asked what the absolute pinnacle of virtualization would look like if the goal were native-everything: the guest should feel like a physical workstation, with as little useful work as possible trapped behind virtual devices.

The most extreme x86 answer is Linux/KVM with direct device assignment.

Keep one GPU for the host. Give another GPU to the guest with VFIO. Give the guest an NVMe controller. Give it a USB controller. Maybe give it a NIC. Use the physical CPU's virtualization facilities, back guest memory with ordinary DRAM, and plug the monitor into the GPU the guest owns.

The Linux [VFIO documentation](https://docs.kernel.org/driver-api/vfio.html) describes this as direct device access protected by the IOMMU, useful to virtual machines that want lower latency, higher bandwidth and direct use of bare-metal device drivers.

At that point the simple map metaphor starts doing something hilarious.

The map is handing pieces of the territory to its inhabitants.

A Windows guest with a passed-through GPU can run this path:

```text
game
-> DirectX
-> Windows GPU driver
-> physical GPU
-> physical DisplayPort connector
-> monitor
```

QEMU has almost nothing interesting to do with the rendered frame once the assignment is established.

The same guest can own a physical NVMe controller and load the ordinary Windows storage driver. Give it an entire USB controller and Windows owns real physical ports with normal hotplug behavior.

So what, exactly, is fake?

The CPU is physical. The RAM is physical. The GPU is physical. The SSD controller is physical. The USB controller is physical. The monitor cable is physical.

The virtualization has migrated into **authority**.

The host is saying:

```text
these CPU contexts are available to you
these pages back your memory
this PCI function belongs to you
this I/O address space belongs to you
this device may DMA through these mappings
these interrupts route into your world
this grant remains valid until I revoke it
```

The guest can be the privileged adult in its world because another layer drew the border around that world and made the claim true.

That gives me a better sentence for the extreme case:

**A virtual machine can be physical in its datapath and virtual in its authority.**

It also breaks the idea that physical and virtual are opposite settings on one switch.

A single guest can have an emulated device, a paravirtualized VirtIO device and a directly assigned physical device at the same time. The operating system cares about the consequences each interface promises. If the register works, the DMA lands in the right place, the interrupt arrives, the storage operation has the promised semantics and the lifecycle stays coherent, the OS has what it needs.

This makes passthrough bugs feel even stranger. Once the VMM disappears from millions or billions of ordinary device operations, the remaining host-side work gets concentrated into assignment, DMA mappings, BAR relocation, interrupt routing, reset, hotplug, teardown and reuse.

The steady state gets thin. The transitions become sacred.

Our current Linux Fieldwork records keep walking directly into that seam. [Issue 659](https://github.com/teamleaderleo/linux-fieldwork/issues/659) found that a guest DMA range could fit inside the logical bounds of a VFIO BAR while crossing a hole between the actual host mappings. Other investigations follow BAR relocation and reuse across stale addresses, partial moves and old side effects that survive longer than the convenient story says they do. [Issue 675](https://github.com/teamleaderleo/linux-fieldwork/issues/675) now keeps the broader lesson without pretending those bugs all share one repair.

The VMM can leave the data path and become more consequential at the ownership boundary.

That is a wonderful answer to the original question about which truths make a machine a machine. Sometimes the VMM implements the truth. Sometimes host and guest cooperate on a virtual protocol. Sometimes the host grants the guest a physical object and spends its effort keeping the grant coherent.

The machine above all three can feel equally real.

## Everything touches everything because everything has to work

Virtualization gets cross-cutting by definition.

Boot a guest and suddenly CPU privilege, memory translation and interrupt delivery are your concern. Give it a disk and storage semantics arrive. Give it networking and packets arrive. Pass through a physical device and DMA plus IOMMU reasoning walk in. Snapshot or migrate the thing and every piece of live state asks whether it can be captured consistently. Run hostile tenants and every boundary starts carrying a security consequence. Optimize startup and now the exact amount of machine you need to construct becomes an economics problem.

The acronyms breed because the machine has a lot of parts.

ACPI. VFIO. IOMMU. MMIO. BAR. MSI-X. KVM. TLB. Whatever fresh capital letters are waiting behind the next file.

At first they can remain labels. This metadata describes hardware to the guest. This mapping controls where a device can reach. This table participates in address translation. This mechanism delivers an interrupt. The semantic connection comes first; the acronym gets less alien after enough real bugs force it to attach to consequences.

I like that learning order much more than memorizing the glossary and hoping understanding appears afterward.

## This is low-level enough without making me want to design a board

Getting closer to virtualization has actually made me more confident that hardware itself is a different interest.

I care deeply about what the machine promises.

What does this address mean? What privilege does this execution mode have? What happens when a translation misses? What may this device access? Which state survives this transition? What does the guest observe? Which layer owns the failure?

That puts computer architecture squarely in the blast radius. Page tables, caches, TLBs, interrupts, DMA, virtualization extensions, device interfaces — all fascinating when they define the rules software has to obey.

The electrical implementation underneath carries a different kind of beauty. Signal integrity, transistor behavior, board layout, power delivery, timing closure: I can respect all of it while feeling much less urge to spend my day there.

I care about what an IOMMU *means* to the software model more than how to build the silicon that implements one.

Virtualization sits in a lovely seam. You can get extremely close to hardware while remaining in code, semantics, state, ownership, failure and experimentation.

The machine is physical underneath; the work is still something you can read, instrument, patch, test and reason through.

## Chronic overthinking finally gets a finite target

Another reason this domain feels suspiciously compatible with my brain: virtualization rewards the question after the obvious question.

Did shutdown happen?

What observation establishes that?

Can an intermediate state exist where the observation is true and cleanup is still running?

Who owns the disk during that interval?

What happens if another operation starts there?

Or: is this range inside the device region?

Does one actual mapping cover the entire range?

What happens in the hole?

Which caller assumes a returned pointer is valid for the whole request?

This is productive paranoia.

The system contains hidden state everywhere, and the bugs often live in the difference between the convenient story and the actual state machine. You can pour an unreasonable amount of thought into the discrepancy and eventually get a test result, a reproducer, a passing regression, a merged patch. Reality gives the overthinking somewhere to terminate.

LLMs make this dramatically more fun.

Historically, one unfamiliar acronym could turn into an evening of documentation archaeology before you had enough context to ask the useful question. Now I can send an agent into the repository, ask it to trace the owner, inspect the kernel contract, compare two interpretations, build the counterexample, find the test seam, come back, get corrected and go again.

The models can absorb a ridiculous amount of source reading and local detail. I keep choosing which confusion deserves another round.

That pairing works especially well in systems code because the endpoint can be concrete. A theory either survives the code and the experiment or it loses. You can keep drilling until the invisible machinery becomes legible enough to change safely.

A chronic overthinker with a small research staff suddenly has a respectable profession.

## The second machine is deterministic enough to interrogate

At one point I kept reaching for a "second brain" analogy and then realizing virtualization is doing a different, arguably weirder thing.

An LLM is learned behavior spread through a gigantic statistical object. You train it, prompt it, sample it, evaluate it, and live with a certain amount of opacity.

A virtual machine monitor builds another machine world through explicit code.

Here is memory.

Here is what this guest address maps to.

Here is the device.

Here is the interrupt path.

Here is the disk image.

Here is the lifecycle event.

Here is what happens if construction fails halfway through.

The abstraction needs enough fidelity for software above it to act naturally, while remaining legible and controllable enough for software below it to operate the whole arrangement.

That dual demand is probably the heart of the appeal.

A useful abstraction hides detail. A virtualization layer also has to preserve the consequences of the detail it hid.

You get a map you can reason about, and the map has to remain faithful enough that a kernel can trust it with its life.

Then the kernel starts creating processes, filesystems, sockets, containers and another tower of abstractions inside the first abstraction.

Man, what the fuck.

## I went looking for bugs and found a taste

None of this was the original plan.

The original plan was closer to: find repositories where useful work is available, take the good openings, learn what we need, get the patches over the line.

Cloud Hypervisor happened to have openings.

Then the work kept paying back curiosity. Every fix opened another part of the machine. The concepts accumulated instead of feeling like isolated trivia. The hidden-state questions rewarded the exact habit of decomposing until a problem becomes tractable, then comparing the mental model against what the code and tests actually do.

And the domain clarified a preference I had never named properly.

I like software where reality is deep, exact, partly invisible and still discoverable. I like machine contracts, operating systems, runtimes, isolation, address spaces, ownership and the places where an abstraction has to faithfully implement consequences. I like getting close enough to hardware that the rules become physical, while keeping the work in a medium I can rewrite and rerun.

Virtualization takes all of that and adds one final act of audacity:

Build a model of a computer.

Make the model real enough to execute.

Then boot Linux inside it.

Of course I got hooked.
