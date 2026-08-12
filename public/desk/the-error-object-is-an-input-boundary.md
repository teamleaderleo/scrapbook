# The Error Object Is an Input Boundary

A catch block feels like the safest room in a program.

Something failed. Control has returned to code we own. We inspect the error, classify it, turn it into a useful local failure, and move on.

That mental model gets shaky when the thing being caught came from somewhere we do not control. A provider SDK can throw an object. A database adapter can reject with an object. A remote transport can surface an object. JavaScript allows that object to carry custom prototypes, accessors, coercion hooks, or Proxy traps, which means seemingly passive error handling can execute more foreign behavior.

The failure crossed the boundary. The error value crossed it too. That makes the error object input.

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

Even descriptor inspection can interact with a Proxy:

```ts
Object.getOwnPropertyDescriptor(error, 'message');
```

For an ordinary local `Error`, these operations are mundane. For a hostile or simply surprising object, `instanceof` can traverse a prototype chain, string coercion can run user code, property access can invoke getters, and descriptor inspection can trigger Proxy traps. The catch path can therefore execute code chosen by the same boundary it is trying to contain.

Recent Stensibly work ran into versions of this problem in MCP result formatting, the official GitHub MCP transport, Convex-backed project context, and hosted GitHub OAuth handling. The repetition made the common mechanism more useful than any one repair.

## Fixed output and opaque handling are different guarantees

One hosted OAuth repair wrapped `name` and `message` inspection in `try/catch`. That prevented provider-controlled prose from replacing the local `ProviderFailure`: if inspection itself threw, the result collapsed to a conservative local classification.

A later review exposed the remaining distinction. The code still executed provider-controlled `has` and `get` traps before catching their failures.

So there are two separate guarantees worth naming. One says foreign behavior cannot change what our system reports. The stronger one says classification does not invoke foreign behavior in the first place. A fixed output provides the first. An opaque boundary provides the second. Tests should be explicit about which contract they are proving.

## Admit only what you actually need

Sometimes the best boundary is boring: discard the arbitrary thrown value and return a fixed local failure. This is especially attractive when provider diagnostics carry little value or risk leaking private text into an API, MCP result, log, or user-visible message.

Sometimes a small piece of metadata is genuinely useful. Stensibly's shared MCP result formatter kept ordinary error messages, but only through a narrow admission rule: a non-empty own data `message`, no accessor, bounded by UTF-8 bytes, with a fixed fallback otherwise. That is ordinary input validation applied to an exception path.

A subtle limit remains. Asking a Proxy for an own-property descriptor is still an interaction with that Proxy, even when failures are caught. Bounded metadata admission and complete opacity are different designs.

The official GitHub MCP transport needed the stronger design because it had local error classes whose exact codes should survive while arbitrary SDK or provider values stayed opaque. The repair stopped asking whether a caught value was `instanceof` the local error class. Errors created by the transport's own helper were recorded in a private `WeakSet`, and later catch paths preserved a value only when that exact object had local provenance.

That is a useful general move: when the distinction you care about is “created here” versus “arrived from outside,” track creation here instead of interrogating the outside object later.

## Rematerialize local errors

The same idea appeared in the Convex project-context repair. The old path could classify a backend-thrown value and return matching error objects directly. The revised path treated arbitrary backend failures as foreign, admitted only a very small amount of known conflict metadata where needed, and returned fresh local error instances.

That fresh instance severs more than prose. It drops foreign identity, prototype behavior, and extra fields that happened to travel with the original object. A local error type belongs to the program's own trust domain; recreating it locally keeps that distinction literal.

## Catch paths need an admission policy

Response bodies, webhook payloads, tool arguments, database rows, and provider JSON usually get explicit validation rules. Exceptions often receive looser treatment because they arrive through control flow instead of a parser. The difference is cosmetic. At an external boundary, a thrown value deserves the same questions as any other input: who created it, which fields are useful enough to admit, whether reading those fields can execute code, how much text should survive, and whether the original object needs to survive at all.

The test should match that policy. If the contract promises opacity, a hostile Proxy is useful because the test can assert that prototype reads, getters, or traps never ran. If the contract promises only fixed output, caught inspection failures may be acceptable. Checking the final message alone can miss the distinction entirely.

The practical default is simple enough: keep locally known stage and category information, preserve local errors through local provenance, and treat everything else as foreign unless there is a concrete reason to admit more.

The catch block stays useful because it can turn an uncontrolled failure into local control flow. That does not make the value that arrived with the failure local too.

## Sources

- [Stensibly PR #1339 — Contain arbitrary MCP execution failures](https://github.com/teamleaderleo/stensibly/pull/1339)
- [Stensibly PR #1353 — Keep official GitHub MCP caught values opaque](https://github.com/teamleaderleo/stensibly/pull/1353)
- [Stensibly PR #1354 — Contain project-context Convex backend errors](https://github.com/teamleaderleo/stensibly/pull/1354)
- [Stensibly PR #1357 — Contain hosted-auth provider error metadata](https://github.com/teamleaderleo/stensibly/pull/1357)
