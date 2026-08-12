# An Error Message Owes You a Next Move

More information does not automatically make a better error.

An error earns diagnostic detail when that detail changes what somebody does next.

That sounds obvious until code review reaches an internal failure path. A reviewer sees a categorical error such as `AddressOverflow` and immediately imagines an improvement: include the base address, include the length, include the table name, include everything available at the failure site. Each addition carries more information. The harder question is whether any of it changes the debugging decision.

A recent Cloud Hypervisor change made that question concrete. PR #8709 replaces several ACPI-construction panics with typed errors. Checked address additions can return `AddressOverflow`; guest-memory writes preserve `GuestMemoryError`; `fw_cfg` delivery preserves its `io::Error`; the ACPI layer owns those failures and the VM layer wraps them as `CreatingAcpiTables`.

The interesting part is not the `?` operators. Rust makes most of that propagation mechanical once the return types change. The interesting part is deciding how much meaning each failure should carry.

## Different failures need different context

Cloud Hypervisor already shows two useful styles side by side.

Configuration validation often echoes the bad value. `CpusMaxLowerThanBoot(max, boot)` renders both CPU counts. `TooManyCpus(specified)` reports the requested count and the supported limit.

That detail is immediately actionable. The operator can change the configuration.

VM lifecycle errors look different. `CreatingAcpiTables` says what operation failed and preserves the underlying `acpi::Error` as its source. Nearby variants follow the same pattern: creating an e820 map, adding an `fw_cfg` item, populating `fw_cfg`, resuming the VM. The local layer contributes a stable category; the subsystem source carries the lower-level failure when one exists.

Those two styles answer different questions.

A user-input error asks:

> What value should I change?

A lifecycle error asks:

> Which operation failed, and what did the lower layer report?

An internal arithmetic overflow can ask something narrower still:

> Which assumption about this computation failed?

The amount of useful context changes with the responder's next move.

## The address-overflow case

PR #8709 consolidates repeated expressions like:

```rust
address.checked_add(length).unwrap()
```

into a helper returning `Result<GuestAddress>`:

```rust
fn next_table_address(address: GuestAddress, length: u64) -> Result<GuestAddress> {
    address.checked_add(length).ok_or(Error::AddressOverflow)
}
```

A richer variant could carry both operands. That would reveal exactly which addition overflowed numerically.

But consider what a developer would do after seeing either message.

With:

```text
ACPI table address overflow
```

the next move is to inspect why ACPI table placement reached the end of the guest-address range.

With:

```text
ACPI table address overflow: 0xffffffffffffffe0 + 0x40
```

the next move is still to inspect why ACPI table placement reached the end of the guest-address range.

The second message contains more bits. It barely changes the investigation.

If ACPI placement later becomes driven by dynamic or user-controlled addresses, those operands could become valuable. If several independent layout mechanisms can overflow in materially different ways, table identity may become even more useful than the raw arithmetic. Context should grow when the failure model grows.

Until then, a categorical internal error can be enough.

## Source errors are different

The same PR makes a different choice for guest-memory and `fw_cfg` failures:

```rust
GuestMemory(#[source] vm_memory::GuestMemoryError),
FwCfg(#[source] io::Error),
```

Here, throwing away the source would discard real diagnostic state produced by another subsystem. The caller may need to know whether guest memory rejected an address, whether an I/O operation failed, or which lower-level condition caused delivery to fail.

The error type therefore keeps two layers of meaning:

```text
VM operation
  → ACPI operation
    → subsystem failure
```

Each layer adds information appropriate to its responsibility.

This is different from stuffing every locally available number into the top-level message. Preserving a source keeps the causal chain. Interpolating internal operands merely because they are nearby may add detail without adding a decision.

## A small actionability test

Before adding diagnostic context, ask five questions:

1. **Who is expected to respond to this failure?** A user, operator, maintainer, or another program?
2. **What can that responder change?** Configuration, environment, code, or nothing directly?
3. **Would the extra value select a different next action?** If every value leads to the same investigation, the value may be noise.
4. **Does the lower layer already carry the useful detail?** Preserve a source instead of duplicating it when possible.
5. **Does the surrounding code use this kind of context here?** Error style is part of a codebase's vocabulary; consistency helps readers predict where detail lives.

This test does not argue for terse errors everywhere. It argues for purposeful errors.

A parser should often repeat the invalid field. A network failure should often preserve the transport source. A boundary crossing may need stable local classification plus bounded foreign detail. An internal impossible-state error may need only the category that tells a maintainer which assumption broke.

## The review lesson

There is a related trap in code review: confusing a possible enhancement with a defect.

A reviewer can almost always imagine a richer error message, another assertion, one more test case, an additional comment, or a more general abstraction. The existence of an improvement does not establish that the current patch is weak.

The useful review question is proportional:

> Does this proposed addition change correctness, observability, compatibility, or the next debugging decision enough to justify expanding the patch?

That question becomes especially important for a narrow reliability change. PR #8709 has a clear boundary: turn naturally fallible ACPI operations into propagated errors while leaving existing internal VMM and table-construction invariants alone. Expanding every reachable invariant or enriching every nearly unreachable branch would produce a different project.

A good patch can stop at a coherent boundary.

## Error messages are interfaces to action

Errors are often described as information for humans, but that is too broad. They are interfaces between a failure and a response.

The best error contains enough information to choose the response, preserve the causal chain, and locate the responsible layer. Beyond that point, additional detail can become speculative bookkeeping.

So the useful standard is simple:

> Add context when it changes the next move.

That rule scales from command-line validation to hypervisor boot failures. It also keeps code review focused on the difference between information that exists and information somebody can actually use.

## Sources

- [Cloud Hypervisor PR #8709 — Propagate ACPI table construction errors](https://github.com/cloud-hypervisor/cloud-hypervisor/pull/8709)
- [Cloud Hypervisor issue #8666 — create_acpi_tables and children panic](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8666)
- [Cloud Hypervisor `vm.rs` at PR head — lifecycle error categories and sources](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/e9c86bacee14a2fd6fe871dc678c6b3f1ac4012a/vmm/src/vm.rs)
- [Cloud Hypervisor `config.rs` at PR head — validation errors that echo actionable values](https://github.com/cloud-hypervisor/cloud-hypervisor/blob/e9c86bacee14a2fd6fe871dc678c6b3f1ac4012a/vmm/src/config.rs)
