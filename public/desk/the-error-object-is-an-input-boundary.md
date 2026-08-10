# The Error Object Is an Input Boundary

A catch block feels like the safest room in a program.

Something failed. Control has returned to code we own. We inspect the error, classify it, turn it into a useful local failure, and move on.

That mental model works until the thing being caught came from somewhere we do not control.

A provider SDK can throw an object. A database adapter can reject with an object. A remote transport can surface an object. JavaScript allows that object to have a custom prototype, accessors, coercion hooks, or Proxy traps. At that point, seemingly passive error handling can execute more foreign behavior.

The failure crossed the boundary. The error value crossed it too.

That means the error object is input.

## The trap inside the catch

A few familiar patterns look harmless:

```ts
catch (error) {
  if (error instanceof ProviderError) return error;
  return new Error(String(error));
}
```

Or:

```ts
if ('message' in error) {
  return error.message;
}
```

Or even a more careful-looking descriptor read:

```ts
Object.getOwnPropertyDescriptor(error, 'message');
```

Each one asks the foreign value a question.

For an ordinary local `Error`, that may be exactly what we want. For a hostile or simply surprising object, the question can itself have behavior. `instanceof` may traverse a prototype chain. `String(error)` may invoke coercion. The `in` operator can invoke a Proxy `has` trap. A property read can invoke a getter or Proxy `get` trap. Even descriptor inspection can hit a Proxy trap.

The catch path can therefore fail while trying to explain the first failure. Worse, it can execute code chosen by the same boundary we are trying to contain.

Recent Stensibly work ran into this pattern repeatedly in independent places: MCP tool-result formatting, the official GitHub MCP transport, Convex-backed project context, and hosted GitHub OAuth handling. The repetition made the mechanism more interesting than any one bug.

## Fixed output is useful, but it is only one layer

One repair in the hosted OAuth path wrapped `name` and `message` inspection in `try/catch`. That changed an important property: provider-controlled prose could no longer replace the local `ProviderFailure`. If a hostile object threw while its metadata was inspected, Stensibly collapsed the result to a conservative local classification.

That is real containment. It prevents the public failure from being rewritten by foreign text.

A review then pointed out the remaining distinction: the code still executed the provider-controlled `has` and `get` traps before catching their failures.

That gives us two different questions:

1. **Can foreign behavior change what our system reports?**
2. **Do we invoke foreign behavior at all while classifying the failure?**

A fixed output answers the first. An opaque boundary answers the second.

Those are different guarantees, and tests should say which one they intend to prove.

## Three useful levels of admission

The Stensibly repairs ended up illustrating three patterns that are worth naming.

### 1. Collapse to a fixed local failure

This is the simplest rule for a boundary where foreign diagnostics carry little value.

Do not stringify arbitrary thrown primitives. Do not rethrow the original object. Return a local error with a stable code and message.

This makes output predictable and prevents a provider from smuggling unbounded or private text into an API, MCP result, log, or user-visible message.

For many boundaries, this should be the default.

### 2. Admit a small piece of metadata deliberately

Sometimes an ordinary error message really does carry useful domain information.

Stensibly's shared MCP result formatter kept that capability, but narrowed it. Instead of `error instanceof Error ? error.message : String(error)`, it admits only a non-empty own data `message`, rejects accessors, bounds the text by UTF-8 bytes, and otherwise falls back to `Tool operation failed`.

That is a useful middle ground. The application is saying:

> I am willing to accept this exact field, in this exact form, up to this exact size.

It resembles normal input validation because that is what it is.

A subtle limit remains: asking a Proxy for an own-property descriptor is still an interaction with that Proxy. The operation can be trapped, even if the trap's failure is caught. So this pattern provides bounded metadata admission, rather than complete opacity.

### 3. Preserve only locally proven identity

The official GitHub MCP transport needed a stronger property. It had local error classes whose exact codes should survive, while arbitrary SDK/provider thrown values should remain opaque.

The repair stopped asking whether a caught value was `instanceof` the local error class. Instead, errors created by the transport's own helper are recorded in a private `WeakSet`. Later catch paths preserve a value only when that exact object has local provenance.

Foreign values do not need to reveal their prototype to prove they are foreign. They simply lack the local identity receipt.

That is a powerful general rule:

> If the distinction you care about is “created here” versus “arrived from outside,” track creation here instead of interrogating the outside object later.

## Rematerialize instead of returning the foreign object

The same idea appeared in the Convex project-context repair.

The old path could classify a backend-thrown value with `instanceof` and return matching error objects directly. The revised path treats arbitrary backend failures as foreign, preserves a very small set of known conflict markers only through a deliberately admitted ordinary-error path, and returns **fresh local error instances**.

That last part matters.

Even if a foreign object looks like one of our errors, carrying it forward also carries its identity, prototype, extra fields, and future behavior. A local error type is more than a label. It is part of the program's trust domain.

Reconstructing a fresh local error severs that accidental attachment.

## Error handling should have a trust model

We tend to give response bodies, webhook payloads, tool arguments, database rows, and provider JSON explicit admission rules. Exceptions often get a free pass because they arrive through language control flow instead of a parser.

That is a category error.

At an external boundary, the thrown value deserves the same questions as any other input:

- Who created this value?
- Which fields, if any, are useful enough to admit?
- Can reading those fields execute code?
- How much text are we willing to retain or expose?
- Do we need the original object, or only a local classification?
- Which distinctions can be derived from local context instead of foreign metadata?

The safest catch path is often boring: retain the stage we already know locally, use a fixed failure category, and throw away the foreign object.

Useful diagnostics can still exist. They just need an explicit admission contract.

## The test is behavioral, not cosmetic

A test that only checks the final error message can miss half the boundary.

A hostile Proxy is a good control because it lets the test ask whether classification performed an operation at all. Depending on the desired guarantee, useful assertions include:

```ts
expect(prototypeReads).toBe(0);
expect(getterCalls).toBe(0);
expect(String(result)).not.toContain('provider-private');
```

The zero matters when the contract promises opacity. A caught trap may be sufficient when the contract promises only fixed output.

Making that distinction explicit turns vague defensive programming into a testable property.

## What to carry forward

The lesson is broader than error messages.

When code crosses a provider, plugin, database, RPC, MCP, worker, or extension boundary, **control flow does not make returned or thrown values trustworthy**. A value can arrive through `throw` and still be an adversarial input.

A useful default is:

1. treat arbitrary caught values as opaque;
2. preserve locally created errors through local provenance, not foreign introspection;
3. admit foreign metadata only when there is a concrete diagnostic need;
4. bound that metadata like any other input;
5. rematerialize local errors instead of rethrowing foreign objects;
6. test both what escapes the boundary and what code executes while inspecting it.

The catch block is still a safe room.

It stays safe by remembering that whatever just came through the door has not become local merely because the language called it an error.

## Sources

- [Stensibly PR #1339 — Contain arbitrary MCP execution failures](https://github.com/teamleaderleo/stensibly/pull/1339)
- [Stensibly PR #1353 — Keep official GitHub MCP caught values opaque](https://github.com/teamleaderleo/stensibly/pull/1353)
- [Stensibly PR #1354 — Contain project-context Convex backend errors](https://github.com/teamleaderleo/stensibly/pull/1354)
- [Stensibly PR #1357 — Contain hosted-auth provider error metadata](https://github.com/teamleaderleo/stensibly/pull/1357)
