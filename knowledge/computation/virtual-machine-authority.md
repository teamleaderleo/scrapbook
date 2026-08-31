---
title: Virtual machines as authority over real resources
kind: concept
trunk: computation
summary: A VM can use physical CPU, memory, and devices directly while the hypervisor remains responsible for granting, constraining, and revoking that ownership.
created: 2026-08-31
updated: 2026-08-31
---
# Virtual machines as authority over real resources

A virtual machine is easier to understand when `virtual` stops meaning `fake`.

A guest can execute on the physical CPU, occupy physical DRAM, and own whole PCIe devices. What remains virtual is often the **authority relationship**: the host decides which resources belong to the guest, what addresses they may reach, how interrupts are routed, and when the grant begins or ends.

A useful compact model is:

> **A VM can be physical in its datapath and virtual in its authority.**

## Three device relationships

An operating system can receive a usable device in several ways.

```text
emulation
  guest sees device semantics
  VMM implements the behavior

paravirtualization
  guest knows it has a cooperative virtual device
  guest and host use an efficient shared protocol

passthrough / assignment
  guest receives the physical device
  VMM establishes ownership and leaves most steady-state I/O to hardware
```

A single VM can mix all three.

VirtIO is a common paravirtualized path. VFIO lets userspace safely access assigned devices through an IOMMU-protected interface; the Linux kernel documentation explicitly calls out virtual-machine device assignment for lower latency, higher bandwidth, and use of ordinary bare-metal device drivers: <https://docs.kernel.org/driver-api/vfio.html>.

## Concrete trace

Consider a Linux/KVM host with a Windows guest:

```text
Linux host
  -> host GPU
  -> host NVMe
  -> host USB controller

Windows guest
  -> physical GPU via VFIO
  -> physical NVMe controller via VFIO
  -> physical USB controller via VFIO
```

With the monitor connected to the guest-owned GPU:

```text
game
  -> DirectX
  -> Windows GPU driver
  -> physical GPU
  -> physical display connector
  -> monitor
```

The hypervisor still created the VM, established memory mappings, admitted the PCI device, and coordinates the assignment. Rendering itself can proceed through the native guest driver and the physical GPU.

CPU and memory have the same mixed character. Guest instructions execute on the physical CPU under hardware virtualization. Guest physical addresses resolve through an additional translation layer into host physical memory. The bytes still live in DRAM; the host controls which DRAM belongs to the guest.

## Invariant

The guest may act as the owner of an assigned resource only while the host-side ownership and translation state make that claim true.

For a passed-through PCI device, that includes questions such as:

- which guest owns the device;
- which BAR locations are current;
- which host mappings back guest-visible MMIO;
- which IOMMU mappings permit DMA;
- which interrupt routes are active;
- whether reset or teardown has completed;
- when an old address or device becomes reusable.

A stale answer can make two layers disagree about who owns the same physical capability.

## Why thinner datapaths make transition code more important

Passthrough removes the VMM from large amounts of routine device traffic. That concentrates correctness in a smaller number of ownership transitions.

A GPU may execute billions of operations without QEMU interpreting them. The dangerous moments become assignment, DMA-map changes, BAR relocation, reset, hotplug, migration, teardown, and reuse.

This is visible in current Linux Fieldwork investigations. [Issue 659](https://github.com/teamleaderleo/linux-fieldwork/issues/659) found a VFIO DMA range that fit inside a logical BAR while crossing a hole between actual host mappings. [Issue 675](https://github.com/teamleaderleo/linux-fieldwork/issues/675) records the broader hunting lesson: direct assignment thins the ordinary path and makes device-ownership transitions unusually consequential.

## Connection to performance

This is the hardware version of a recurring performance move: remove work from the middle when the endpoint can safely consume the real resource directly.

That connects to [profiling the critical path](../performance/profiling-critical-path.md). Removing a mediation layer can reduce latency and CPU work, while the remaining setup and transition path becomes the place to measure and harden.

The same principle appears in Glaeda: move the request toward already-resident useful state instead of reconstructing or transporting that state for every operation. Device assignment moves the guest toward the physical device.

## Connections

[Authority](../security/authority.md) supplies the security vocabulary: a resource grant is meaningful only while it remains current and revocable under the owning policy. [Runtime lifetimes](../toolchains/runtime-lifetimes.md) explains why assignment, reset, teardown, and reuse are lifetime transitions instead of cosmetic bookkeeping. [Memory hierarchy](../performance/memory-hierarchy.md) is nearby because virtualization adds translation and locality effects without changing the underlying physical memory hierarchy.

The Workbench essays [The Map Boots Linux](../../public/desk/the-map-boots-linux.md) and [The Guest Gets the Territory](../../public/desk/the-guest-gets-the-territory.md) develop the conceptual side of the same model.

## Pressure questions

- If a Windows VM owns a physical GPU and the monitor is plugged into that GPU, what exactly remains virtual?
- Which steady-state operations can bypass the VMM once a device is assigned?
- Which transitions still require host-side mediation?
- What evidence proves that an old DMA mapping, BAR location, interrupt route, or device grant is dead before reuse?
- When does a `virtual computer` become better described as a coherent claim over physical resources?