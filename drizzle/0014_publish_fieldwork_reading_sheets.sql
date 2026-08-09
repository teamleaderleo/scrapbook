-- Publish the first hand-curated Fieldwork collection as public Space notes.
-- The source URLs are pinned to the exact revisions used for this synthesis.
-- Reapplying this migration is safe: an existing slug is never replaced.

WITH owner AS (
  SELECT user_id
  FROM public.items
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  ORDER BY count(*) DESC
  LIMIT 1
),
seeds (
  slug,
  title,
  url,
  tags,
  category,
  read_markdown,
  read_html,
  practice_markdown,
  practice_html,
  practice_code
) AS (
  VALUES
  (
    'research-benders-need-stop-rules',
    'How do you know when a research rabbit hole is still useful?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/research-benders-need-discriminators-and-stop-rules.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:review','domain:research','time:5-min','device:phone','state:fresh','visibility:public'],
    'review',
    $md$## The question

How do you go deep without turning the work into an indefinitely growing pile of reading, branches, and experiments?

## Working model

A useful research step must still be able to change a decision. Pin the exact source and the result owner, preserve the first surprising observation, and make each plausible explanation face a test that could make it lose. Separate “this mechanism can work” from “this is the smallest justified change.”

Stop when the next probe cannot change the selected mechanism, claim boundary, or reopening condition. A careful negative result is a real result when it records what lost, what remains possible, and what new evidence would justify reopening.

## Why it matters

Without a discriminator, more depth mostly creates narrative momentum. With one, even a long investigation keeps shrinking the decision surface.

## Provenance

Synthesized from Linux Fieldwork at revision `c79d34b65fb2cd8c54234f361f073248c53b513a`. The source note describes a research method; it does not claim every investigation needs the same machinery.$md$,
    $html$<h2>The question</h2><p>How do you go deep without turning the work into an indefinitely growing pile of reading, branches, and experiments?</p><h2>Working model</h2><p>A useful research step must still be able to change a decision. Pin the exact source and the result owner, preserve the first surprising observation, and make each plausible explanation face a test that could make it lose. Separate “this mechanism can work” from “this is the smallest justified change.”</p><p>Stop when the next probe cannot change the selected mechanism, claim boundary, or reopening condition. A careful negative result is a real result when it records what lost, what remains possible, and what new evidence would justify reopening.</p><h2>Why it matters</h2><p>Without a discriminator, more depth mostly creates narrative momentum. With one, even a long investigation keeps shrinking the decision surface.</p><h2>Provenance</h2><p>Synthesized from Linux Fieldwork at revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>. The source note describes a research method; it does not claim every investigation needs the same machinery.</p>$html$,
    $md$## Try it

Take one open technical question and write four lines:

1. **Decision:** what choice could this work change?
2. **Discriminator:** what result would make the leading explanation lose?
3. **Stop rule:** when is the current question saturated?
4. **Reopen trigger:** what new evidence would make another pass worthwhile?

If line 2 is impossible to write, the question is probably still too vague.$md$,
    $html$<h2>Try it</h2><p>Take one open technical question and write four lines:</p><ol><li><strong>Decision:</strong> what choice could this work change?</li><li><strong>Discriminator:</strong> what result would make the leading explanation lose?</li><li><strong>Stop rule:</strong> when is the current question saturated?</li><li><strong>Reopen trigger:</strong> what new evidence would make another pass worthwhile?</li></ol><p>If line 2 is impossible to write, the question is probably still too vague.</p>$html$,
    NULL
  ),
  (
    'install-is-two-state-machines',
    'Why is file replacement really two state machines?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/filesystems/coreutils-install-state-machines.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:trace','domain:filesystems','time:20-min','device:phone','state:fresh','visibility:public'],
    'trace',
    $md$## The question

When a multi-source install command backs up a destination, fails to copy one source, then sees another source with the same name, which state owns the path?

## Working model

There are two nearby but independent machines.

**Invocation ownership** asks whether an earlier operand completed its data-copy phase for this destination. Only a completed copy owns the name; a source-stat failure, no-op comparison, or failed copy does not.

**Backup transaction** asks whether the old destination was moved aside and the replacement copy committed. If the backup exists but the copy fails, remove any partial destination and restore the backup. Failures after a completed copy do not roll the old file back.

The useful boundary is the commit event—not the function's final success boolean.

## Provenance

Synthesized from black-box GNU `install` behavior and controlled uutils work recorded at Linux Fieldwork revision `c79d34b65fb2cd8c54234f361f073248c53b513a`. It is a design model, not an upstream acceptance claim.$md$,
    $html$<h2>The question</h2><p>When a multi-source install command backs up a destination, fails to copy one source, then sees another source with the same name, which state owns the path?</p><h2>Working model</h2><p>There are two nearby but independent machines.</p><p><strong>Invocation ownership</strong> asks whether an earlier operand completed its data-copy phase for this destination. Only a completed copy owns the name; a source-stat failure, no-op comparison, or failed copy does not.</p><p><strong>Backup transaction</strong> asks whether the old destination was moved aside and the replacement copy committed. If the backup exists but the copy fails, remove any partial destination and restore the backup. Failures after a completed copy do not roll the old file back.</p><p>The useful boundary is the commit event—not the function's final success boolean.</p><h2>Provenance</h2><p>Synthesized from black-box GNU <code>install</code> behavior and controlled uutils work recorded at Linux Fieldwork revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>. It is a design model, not an upstream acceptance claim.</p>$html$,
    $md$## Trace it

Start with `dest/file = original`. Source A fails during data copy; source B later succeeds to the same name.

Draw both machines separately and mark these events:

- old destination renamed to backup;
- A begins, then fails;
- partial A removed;
- backup restored;
- B copies successfully.

The expected end state is `dest/file = B` and `dest/file~ = original`. Explain why marking A as an owner would produce the wrong answer.$md$,
    $html$<h2>Trace it</h2><p>Start with <code>dest/file = original</code>. Source A fails during data copy; source B later succeeds to the same name.</p><p>Draw both machines separately and mark these events:</p><ul><li>old destination renamed to backup;</li><li>A begins, then fails;</li><li>partial A removed;</li><li>backup restored;</li><li>B copies successfully.</li></ul><p>The expected end state is <code>dest/file = B</code> and <code>dest/file~ = original</code>. Explain why marking A as an owner would produce the wrong answer.</p>$html$,
    NULL
  ),
  (
    'cache-files-are-published-atomically',
    'Why should a cache filename mean “complete object”?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/reliability/cache-files-must-be-published-atomically.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:explain','domain:reliability','time:5-min','device:phone','state:fresh','visibility:public'],
    'explain',
    $md$## The question

What can go wrong when a threaded cache writes a response directly to its final filename?

## Working model

The final name becomes visible as soon as the writer opens it. A second request can mistake “a writer has started” for “the object is complete” and return the partial bytes as a successful cache hit.

Write to a unique temporary file in the destination directory, validate the whole object, close the writer, and atomically replace the final path. Remove the temporary file on every failure. Same-directory publication keeps the rename on one filesystem.

Atomic publication solves visibility, not every race. Two misses may still download twice, and integrity checks such as expected length remain separate.

## Provenance

Synthesized from Linux Fieldwork's mmdebstrap cache-proxy investigation at revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>What can go wrong when a threaded cache writes a response directly to its final filename?</p><h2>Working model</h2><p>The final name becomes visible as soon as the writer opens it. A second request can mistake “a writer has started” for “the object is complete” and return the partial bytes as a successful cache hit.</p><p>Write to a unique temporary file in the destination directory, validate the whole object, close the writer, and atomically replace the final path. Remove the temporary file on every failure. Same-directory publication keeps the rename on one filesystem.</p><p>Atomic publication solves visibility, not every race. Two misses may still download twice, and integrity checks such as expected length remain separate.</p><h2>Provenance</h2><p>Synthesized from Linux Fieldwork's mmdebstrap cache-proxy investigation at revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Try it

Sketch a two-request timeline. Request A creates the final path and pauses after one chunk. Request B arrives.

Then replace the direct write with `temporary → validate → close → atomic rename`. Which states can B observe before and after the change? What extra mechanism would you need to prevent duplicate downloads, and why is that a different requirement?$md$,
    $html$<h2>Try it</h2><p>Sketch a two-request timeline. Request A creates the final path and pauses after one chunk. Request B arrives.</p><p>Then replace the direct write with <code>temporary → validate → close → atomic rename</code>. Which states can B observe before and after the change? What extra mechanism would you need to prevent duplicate downloads, and why is that a different requirement?</p>$html$,
    NULL
  ),
  (
    'cache-fills-verify-declared-length',
    'Why is end-of-stream not proof that a cache fill succeeded?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/reliability/cache-fills-must-verify-declared-length.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:diagnose','domain:http','time:5-min','device:phone','state:fresh','visibility:public'],
    'diagnose',
    $md$## The question

An upstream promises 100 bytes, sends 40, and closes. Why can a cache still publish the short file even when the first client reports an incomplete response?

## Working model

Some HTTP read APIs return an ordinary empty read at premature EOF. The downstream client notices that the forwarded `Content-Length` was not met, but the proxy's loop may interpret EOF as success.

When an upstream declares a nonnegative length, count the bytes written and compare the count before publication. On mismatch, fail the fill and let temporary-file cleanup remove the candidate. A later request can then reach the upstream again.

Atomic rename and length validation compose: either one alone can still publish the wrong state.

## Provenance

Synthesized from a Python `http.client` / mmdebstrap investigation at Linux Fieldwork revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>An upstream promises 100 bytes, sends 40, and closes. Why can a cache still publish the short file even when the first client reports an incomplete response?</p><h2>Working model</h2><p>Some HTTP read APIs return an ordinary empty read at premature EOF. The downstream client notices that the forwarded <code>Content-Length</code> was not met, but the proxy's loop may interpret EOF as success.</p><p>When an upstream declares a nonnegative length, count the bytes written and compare the count before publication. On mismatch, fail the fill and let temporary-file cleanup remove the candidate. A later request can then reach the upstream again.</p><p>Atomic rename and length validation compose: either one alone can still publish the wrong state.</p><h2>Provenance</h2><p>Synthesized from a Python <code>http.client</code> / mmdebstrap investigation at Linux Fieldwork revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Diagnose it

For each case, decide whether EOF is enough to publish:

1. `Content-Length: 100`, received 100.
2. `Content-Length: 100`, received 40.
3. No declared length, response is validly close-delimited.

Then explain why “the first client already failed” does not protect the next client from a poisoned cache.$md$,
    $html$<h2>Diagnose it</h2><p>For each case, decide whether EOF is enough to publish:</p><ol><li><code>Content-Length: 100</code>, received 100.</li><li><code>Content-Length: 100</code>, received 40.</li><li>No declared length, response is validly close-delimited.</li></ol><p>Then explain why “the first client already failed” does not protect the next client from a poisoned cache.</p>$html$,
    NULL
  ),
  (
    'proxies-normalize-framing-after-decoding',
    'Why must a proxy rewrite headers after decoding a body?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/reliability/proxies-must-normalize-framing-after-decoding.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:trace','domain:http','time:20-min','device:phone','state:fresh','visibility:public'],
    'trace',
    $md$## The question

What happens if an HTTP library removes chunk framing from a body, but a proxy forwards `Transfer-Encoding: chunked` unchanged?

## Working model

Chunked encoding describes wire bytes. A client library may consume chunk sizes, separators, the terminal chunk, and trailers before returning only payload bytes. If the proxy sends those decoded bytes while advertising chunked encoding, the next client tries to parse payload text as chunk sizes.

Headers must describe the representation actually sent on the next hop. Remove stale transfer framing and hop-by-hop fields, including fields named by `Connection`, then choose a valid downstream boundary: correct length, newly generated chunk framing, or close delimiting.

A correct cache file does not prove the first streamed response was valid.

## Provenance

Synthesized from a loopback regression against Python's HTTP stack at Linux Fieldwork revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>What happens if an HTTP library removes chunk framing from a body, but a proxy forwards <code>Transfer-Encoding: chunked</code> unchanged?</p><h2>Working model</h2><p>Chunked encoding describes wire bytes. A client library may consume chunk sizes, separators, the terminal chunk, and trailers before returning only payload bytes. If the proxy sends those decoded bytes while advertising chunked encoding, the next client tries to parse payload text as chunk sizes.</p><p>Headers must describe the representation actually sent on the next hop. Remove stale transfer framing and hop-by-hop fields, including fields named by <code>Connection</code>, then choose a valid downstream boundary: correct length, newly generated chunk framing, or close delimiting.</p><p>A correct cache file does not prove the first streamed response was valid.</p><h2>Provenance</h2><p>Synthesized from a loopback regression against Python's HTTP stack at Linux Fieldwork revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Trace the representations

Label each line as **wire framing** or **logical payload**. Then write the valid downstream headers for a seven-byte payload.

The trap is preserving metadata from representation A after a library has already transformed the bytes into representation B.$md$,
    $html$<h2>Trace the representations</h2><p>Label each line as <strong>wire framing</strong> or <strong>logical payload</strong>. Then write the valid downstream headers for a seven-byte payload.</p><p>The trap is preserving metadata from representation A after a library has already transformed the bytes into representation B.</p>$html$,
    E'HTTP/1.1 200 OK\nTransfer-Encoding: chunked\n\n7\npayload\n0\n\n\n# decoded body returned by the client library\npayload'
  ),
  (
    'cancellation-cleanup-is-not-success',
    'Why can perfect cleanup still report a false success?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/processes/cancellation-cleanup-must-not-fall-through-to-success.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:diagnose','domain:processes','time:5-min','device:phone','state:fresh','visibility:public'],
    'diagnose',
    $md$## The question

A wrapper catches Ctrl-C, terminates its child, waits, removes every temporary file, and then exits 0. What is wrong if nothing leaked?

## Working model

Cleanup answers “did we leave the machine in a recoverable state?” Completion answers “did the requested operation finish?” They are different contracts.

A handler that breaks or returns into the ordinary success epilogue can silently skip remaining work while CI reports green. For each handled signal, decide descendant delivery, waiting and escalation, resource cleanup, final status or signal identity, and a diagnostic that distinguishes cancellation from failure.

Exit 130 is a conventional handled-SIGINT result; exact signal re-raising is another valid contract. Accidental status 0 is not.

## Provenance

Synthesized from Linux Fieldwork's parent-only SIGINT regression at revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>A wrapper catches Ctrl-C, terminates its child, waits, removes every temporary file, and then exits 0. What is wrong if nothing leaked?</p><h2>Working model</h2><p>Cleanup answers “did we leave the machine in a recoverable state?” Completion answers “did the requested operation finish?” They are different contracts.</p><p>A handler that breaks or returns into the ordinary success epilogue can silently skip remaining work while CI reports green. For each handled signal, decide descendant delivery, waiting and escalation, resource cleanup, final status or signal identity, and a diagnostic that distinguishes cancellation from failure.</p><p>Exit 130 is a conventional handled-SIGINT result; exact signal re-raising is another valid contract. Accidental status 0 is not.</p><h2>Provenance</h2><p>Synthesized from Linux Fieldwork's parent-only SIGINT regression at revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Review the handler

Find the control-flow error. Then list assertions for status, surviving descendants, temporary state, a success marker, and an immediate clean rerun.

Bonus: why should the matrix include a signal sent only to the parent PID rather than only process-group delivery?$md$,
    $html$<h2>Review the handler</h2><p>Find the control-flow error. Then list assertions for status, surviving descendants, temporary state, a success marker, and an immediate clean rerun.</p><p>Bonus: why should the matrix include a signal sent only to the parent PID rather than only process-group delivery?</p>$html$,
    E'try:\n    child.wait()\nexcept KeyboardInterrupt:\n    child.terminate()\n    child.wait()\n    break\n\n# ordinary success epilogue\nreturn 0'
  ),
  (
    'completed-failures-outlive-cleanup-signals',
    'Should a cleanup-time signal replace an already completed failure?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/processes/completed-results-must-not-be-replaced-by-later-cleanup-signals.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:review','domain:processes','time:20-min','device:phone','state:fresh','visibility:public'],
    'review',
    $md$## The question

A child durably reports failure, host cleanup begins, and then SIGTERM arrives. Which result should the wrapper report?

## Working model

Precedence should follow event order and ownership, not the order in which cleanup happens to inspect variables. If the child result was complete and durable before cleanup began, a later cleanup-time signal matters after success but should not replace that earlier authoritative failure.

A useful order for this proven sequence is: captured host failure; completed child failure; first cleanup-time signal; first cleanup failure; success.

This is not universal. If the child result was still provisional or buffered, the signal may be the first authoritative result.

## Provenance

Synthesized from Linux Fieldwork result-precedence investigations at revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>A child durably reports failure, host cleanup begins, and then SIGTERM arrives. Which result should the wrapper report?</p><h2>Working model</h2><p>Precedence should follow event order and ownership, not the order in which cleanup happens to inspect variables. If the child result was complete and durable before cleanup began, a later cleanup-time signal matters after success but should not replace that earlier authoritative failure.</p><p>A useful order for this proven sequence is: captured host failure; completed child failure; first cleanup-time signal; first cleanup failure; success.</p><p>This is not universal. If the child result was still provisional or buffered, the signal may be the first authoritative result.</p><h2>Provenance</h2><p>Synthesized from Linux Fieldwork result-precedence investigations at revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Build the table

Fill in the final result for:

- child success → cleanup-time SIGINT;
- child failure → cleanup-time SIGINT;
- missing child result → cleanup-time SIGINT;
- host failure → child failure → cleanup-time SIGINT.

For every answer, name when the winning result became final and who owned it.$md$,
    $html$<h2>Build the table</h2><p>Fill in the final result for:</p><ul><li>child success → cleanup-time SIGINT;</li><li>child failure → cleanup-time SIGINT;</li><li>missing child result → cleanup-time SIGINT;</li><li>host failure → child failure → cleanup-time SIGINT.</li></ul><p>For every answer, name when the winning result became final and who owned it.</p>$html$,
    NULL
  ),
  (
    'result-precedence-survives-exit-cleanup',
    'How do you keep EXIT cleanup from rewriting the real result?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/processes/result-precedence-must-survive-exit-cleanup.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:trace','domain:shell','time:20-min','device:phone','state:fresh','visibility:public'],
    'trace',
    $md$## The question

A shell wrapper can observe command failure, subordinate failure, a signal, and cleanup failure. Why does “last error wins” describe control flow rather than meaning?

## Working model

Capture the primary result before cleanup and encode precedence explicitly. A primary command or first handled-signal failure outranks a subordinate status channel; that outranks the first cleanup failure; success comes last.

Do not share one `$?`-based trap body across `EXIT`, `INT`, and `TERM`. A signal may be deferred while the shell waits, so `$?` can describe the completed child instead of the signal. Give signal handlers explicit statuses, prevent EXIT from running cleanup twice, and stabilize the first handled result while cleanup continues.

Fallible result-file reads also need containment so `set -e` cannot manufacture a new final failure.

## Provenance

Synthesized from Linux Fieldwork wrapper regressions at revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>A shell wrapper can observe command failure, subordinate failure, a signal, and cleanup failure. Why does “last error wins” describe control flow rather than meaning?</p><h2>Working model</h2><p>Capture the primary result before cleanup and encode precedence explicitly. A primary command or first handled-signal failure outranks a subordinate status channel; that outranks the first cleanup failure; success comes last.</p><p>Do not share one <code>$?</code>-based trap body across <code>EXIT</code>, <code>INT</code>, and <code>TERM</code>. A signal may be deferred while the shell waits, so <code>$?</code> can describe the completed child instead of the signal. Give signal handlers explicit statuses, prevent EXIT from running cleanup twice, and stabilize the first handled result while cleanup continues.</p><p>Fallible result-file reads also need containment so <code>set -e</code> cannot manufacture a new final failure.</p><h2>Provenance</h2><p>Synthesized from Linux Fieldwork wrapper regressions at revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Trace the traps

Run the shared-trap example mentally for a deferred TERM while the shell waits for a foreground child. What can `$?` contain when the handler finally runs?

Then rewrite the policy as a small precedence function. Keep cleanup once-only and retain the first cleanup failure while still attempting later cleanup.$md$,
    $html$<h2>Trace the traps</h2><p>Run the shared-trap example mentally for a deferred TERM while the shell waits for a foreground child. What can <code>$?</code> contain when the handler finally runs?</p><p>Then rewrite the policy as a small precedence function. Keep cleanup once-only and retain the first cleanup failure while still attempting later cleanup.</p>$html$,
    E'trap cleanup INT TERM EXIT\n\ncleanup() {\n  status=$?\n  # Which event does status actually describe?\n  finish "$status"\n}'
  ),
  (
    'negative-subprocess-codes-are-signals',
    'Why does Python return −15 for a terminated child?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/processes/negative-subprocess-returncodes-are-signals.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:explain','domain:python','time:5-min','device:phone','state:fresh','visibility:public'],
    'explain',
    $md$## The question

Why should a Python wrapper never pass a child's negative `subprocess` return code straight to `sys.exit()`?

## Working model

In Python, a negative return code means the child died from a signal: `-15` means SIGTERM. `SystemExit(-15)` creates an ordinary exit whose low byte is 241. That loses both signal identity and the conventional shell status 143.

A wrapper must choose deliberately: restore the default handler and re-signal itself to preserve exact signal termination, or map to `128 + signal` for a normal shell-style exit. Finish required local cleanup before re-signaling.

Positive codes remain ordinary exit statuses.

## Provenance

Synthesized from Linux Fieldwork's proxysolver signal-status investigation at revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>Why should a Python wrapper never pass a child's negative <code>subprocess</code> return code straight to <code>sys.exit()</code>?</p><h2>Working model</h2><p>In Python, a negative return code means the child died from a signal: <code>-15</code> means SIGTERM. <code>SystemExit(-15)</code> creates an ordinary exit whose low byte is 241. That loses both signal identity and the conventional shell status 143.</p><p>A wrapper must choose deliberately: restore the default handler and re-signal itself to preserve exact signal termination, or map to <code>128 + signal</code> for a normal shell-style exit. Finish required local cleanup before re-signaling.</p><p>Positive codes remain ordinary exit statuses.</p><h2>Provenance</h2><p>Synthesized from Linux Fieldwork's proxysolver signal-status investigation at revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Predict the observer

For child results `0`, `7`, and `-15`, write what these observers should see:

- another Python parent;
- a POSIX shell;
- `WIFSIGNALED` / `WTERMSIG`.

Compare exact re-raising with mapping SIGTERM to 143. Which contract does your wrapper need?$md$,
    $html$<h2>Predict the observer</h2><p>For child results <code>0</code>, <code>7</code>, and <code>-15</code>, write what these observers should see:</p><ul><li>another Python parent;</li><li>a POSIX shell;</li><li><code>WIFSIGNALED</code> / <code>WTERMSIG</code>.</li></ul><p>Compare exact re-raising with mapping SIGTERM to 143. Which contract does your wrapper need?</p>$html$,
    E'if returncode < 0:\n    signum = -returncode\n    # re-raise exactly, or map to 128 + signum\nelif returncode > 0:\n    raise SystemExit(returncode)'
  ),
  (
    'proxy-and-origin-credentials-are-different',
    'Why must a proxy separate proxy and origin credentials?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/security/proxies-must-separate-proxy-and-origin-credentials.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:review','domain:security','time:20-min','device:phone','state:fresh','visibility:public'],
    'review',
    $md$## The question

Why is forwarding `dict(request.headers)` from a proxy to an origin both a security bug and a compatibility bug?

## Working model

Headers have scope. `Proxy-Authorization` is a credential for the proxy, not a server selected by the request URL. Connection controls apply to one transport hop. `Connection` can name additional hop-specific fields, and header names are case-insensitive.

Construct the origin request from an explicit policy: remove proxy credentials and hop-by-hop fields, parse every `Connection` token, preserve one valid Host, and retain safe end-to-end fields—including repeated fields when their meaning requires it.

Origin `Authorization` is different from `Proxy-Authorization`; deleting both is not a safe shortcut.

## Provenance

Synthesized from a loopback mmdebstrap proxy regression at Linux Fieldwork revision `c79d34b65fb2cd8c54234f361f073248c53b513a`. It does not define every extension or CONNECT policy.$md$,
    $html$<h2>The question</h2><p>Why is forwarding <code>dict(request.headers)</code> from a proxy to an origin both a security bug and a compatibility bug?</p><h2>Working model</h2><p>Headers have scope. <code>Proxy-Authorization</code> is a credential for the proxy, not a server selected by the request URL. Connection controls apply to one transport hop. <code>Connection</code> can name additional hop-specific fields, and header names are case-insensitive.</p><p>Construct the origin request from an explicit policy: remove proxy credentials and hop-by-hop fields, parse every <code>Connection</code> token, preserve one valid Host, and retain safe end-to-end fields—including repeated fields when their meaning requires it.</p><p>Origin <code>Authorization</code> is different from <code>Proxy-Authorization</code>; deleting both is not a safe shortcut.</p><h2>Provenance</h2><p>Synthesized from a loopback mmdebstrap proxy regression at Linux Fieldwork revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>. It does not define every extension or CONNECT policy.</p>$html$,
    $md$## Review the request

Decide what reaches the origin:

- `Proxy-Authorization: Basic fake-secret`
- `Authorization: Bearer origin-token`
- `Connection: keep-alive, X-Hop`
- `X-Hop: local-only`
- `Range: bytes=0-1023`

Then state what a real loopback-origin test can prove that a helper-unit test cannot.$md$,
    $html$<h2>Review the request</h2><p>Decide what reaches the origin:</p><ul><li><code>Proxy-Authorization: Basic fake-secret</code></li><li><code>Authorization: Bearer origin-token</code></li><li><code>Connection: keep-alive, X-Hop</code></li><li><code>X-Hop: local-only</code></li><li><code>Range: bytes=0-1023</code></li></ul><p>Then state what a real loopback-origin test can prove that a helper-unit test cannot.</p>$html$,
    NULL
  ),
  (
    'subordinate-id-files-need-exact-account-matching',
    'Why is `grep $user /etc/subuid` the wrong identity check?',
    'https://github.com/teamleaderleo/linux-fieldwork/blob/c79d34b65fb2cd8c54234f361f073248c53b513a/notes/security/subordinate-id-files-require-exact-account-field-matching.md',
    ARRAY['source:linux-fieldwork','collection:fieldwork-studies-01','mode:diagnose','domain:linux','time:5-min','device:phone','state:fresh','visibility:public'],
    'diagnose',
    $md$## The question

How can a fuzzy search in `/etc/subuid` make setup silently skip the user it was supposed to configure?

## Working model

Subordinate-ID files are colon-delimited records; account identity is field 1. An unanchored regex can match a different account containing the requested name, and punctuation in the name can become regex syntax.

Extract field 1 and compare it as a fixed, whole string. Distinguish an absent file, an empty file, a delimiter-free malformed line, and an exact record. Apply the same semantics to subuid and subgid, and verify an immediate rerun does not append duplicates.

This check answers only whether an account has a record. Range overlap and allocation policy are separate contracts.

## Provenance

Synthesized from Linux Fieldwork's mmdebstrap package-test investigation at revision `c79d34b65fb2cd8c54234f361f073248c53b513a`.$md$,
    $html$<h2>The question</h2><p>How can a fuzzy search in <code>/etc/subuid</code> make setup silently skip the user it was supposed to configure?</p><h2>Working model</h2><p>Subordinate-ID files are colon-delimited records; account identity is field 1. An unanchored regex can match a different account containing the requested name, and punctuation in the name can become regex syntax.</p><p>Extract field 1 and compare it as a fixed, whole string. Distinguish an absent file, an empty file, a delimiter-free malformed line, and an exact record. Apply the same semantics to subuid and subgid, and verify an immediate rerun does not append duplicates.</p><p>This check answers only whether an account has a record. Range overlap and allocation policy are separate contracts.</p><h2>Provenance</h2><p>Synthesized from Linux Fieldwork's mmdebstrap package-test investigation at revision <code>c79d34b65fb2cd8c54234f361f073248c53b513a</code>.</p>$html$,
    $md$## Find the false positive

Requested account: `debci`.

Explain why `old-debci-helper:200000:65536` must not count. Then unpack what each flag protects in:

`cut -s -d: -f1 /etc/subuid | grep -Fxq -- "$user"`

Add one test for a regex-significant username and one for a malformed delimiter-free line.$md$,
    $html$<h2>Find the false positive</h2><p>Requested account: <code>debci</code>.</p><p>Explain why <code>old-debci-helper:200000:65536</code> must not count. Then unpack what each flag protects in:</p><p><code>cut -s -d: -f1 /etc/subuid | grep -Fxq -- "$user"</code></p><p>Add one test for a regex-significant username and one for a malformed delimiter-free line.</p>$html$,
    E'cut -s -d: -f1 /etc/subuid | grep -Fxq -- "$user"'
  ),
  (
    'build-the-ownership-model-before-the-patch',
    'What changes when you model ownership before proposing a patch?',
    'https://github.com/teamleaderleo/fieldwork/blob/49e8c7dabbc75f021b09d243b1d95ecac215bb07/research/vite-process-notes-2026-08-09.md',
    ARRAY['source:fieldwork','collection:fieldwork-studies-01','mode:review','domain:javascript','time:5-min','device:phone','state:fresh','visibility:public'],
    'review',
    $md$## The question

Why is “this code looks suspicious” a weaker starting point than an observed lifecycle anomaly plus an ownership model?

## Working model

Begin with the resource or state: who created it, which lifetime owns it, what transfers or ends that ownership, what completion means, and what happens on success, error, cancellation, restart, warm state, and cold state.

Then require a target-native regression that fails on a clean baseline before promoting a candidate. A plausible source theory is a hypothesis; a discriminator makes it a finding. Invalid probes are useful when you record how setup answered the wrong question.

Use one finding to inspect adjacent branches, but make each branch earn promotion independently.

## Provenance

Synthesized from the Vite correctness-lane process notes at Fieldwork revision `49e8c7dabbc75f021b09d243b1d95ecac215bb07`. These are process observations, not Vite requirements.$md$,
    $html$<h2>The question</h2><p>Why is “this code looks suspicious” a weaker starting point than an observed lifecycle anomaly plus an ownership model?</p><h2>Working model</h2><p>Begin with the resource or state: who created it, which lifetime owns it, what transfers or ends that ownership, what completion means, and what happens on success, error, cancellation, restart, warm state, and cold state.</p><p>Then require a target-native regression that fails on a clean baseline before promoting a candidate. A plausible source theory is a hypothesis; a discriminator makes it a finding. Invalid probes are useful when you record how setup answered the wrong question.</p><p>Use one finding to inspect adjacent branches, but make each branch earn promotion independently.</p><h2>Provenance</h2><p>Synthesized from the Vite correctness-lane process notes at Fieldwork revision <code>49e8c7dabbc75f021b09d243b1d95ecac215bb07</code>. These are process observations, not Vite requirements.</p>$html$,
    $md$## Apply the model

Pick one object from a running development server—a watcher, plugin container, dependency cache, child process, or bundle—and answer:

1. Who creates it?
2. What generation owns it?
3. What operation ends that generation?
4. What does settled cleanup mean?
5. Which warm/cold or success/failure pair could make the theory lose?

Only then sketch the smallest regression.$md$,
    $html$<h2>Apply the model</h2><p>Pick one object from a running development server—a watcher, plugin container, dependency cache, child process, or bundle—and answer:</p><ol><li>Who creates it?</li><li>What generation owns it?</li><li>What operation ends that generation?</li><li>What does settled cleanup mean?</li><li>Which warm/cold or success/failure pair could make the theory lose?</li></ol><p>Only then sketch the smallest regression.</p>$html$,
    NULL
  ),
  (
    'observed-friction-is-a-better-research-seed',
    'Why are real anomalies better research seeds than suspicious-looking code?',
    'https://github.com/teamleaderleo/fieldwork/blob/49e8c7dabbc75f021b09d243b1d95ecac215bb07/research/vite-process-notes-2026-08-09.md',
    ARRAY['source:fieldwork','collection:fieldwork-studies-01','mode:diagnose','domain:research','time:5-min','device:phone','state:fresh','visibility:public'],
    'diagnose',
    $md$## The question

What makes an unexpected rebuild, a close that never settles, or state that changes across restart a strong starting point for source research?

## Working model

Observed friction already supplies a consequence and a boundary. Trace the anomaly back to the component that owns the result, then build a small native probe with a clean baseline failure. This is more informative than scanning for code that merely resembles a familiar defect.

Classify failures along the way. A product regression, invalid fixture, discovery bug, platform flake, and formatting failure do not ask for the same repair. The first incomplete step has an owner.

Exploration can be messy; the eventual review shape should be one minimal change, its native regression, and the governing invariant.

## Provenance

Synthesized from the Vite correctness-lane process notes at Fieldwork revision `49e8c7dabbc75f021b09d243b1d95ecac215bb07`.$md$,
    $html$<h2>The question</h2><p>What makes an unexpected rebuild, a close that never settles, or state that changes across restart a strong starting point for source research?</p><h2>Working model</h2><p>Observed friction already supplies a consequence and a boundary. Trace the anomaly back to the component that owns the result, then build a small native probe with a clean baseline failure. This is more informative than scanning for code that merely resembles a familiar defect.</p><p>Classify failures along the way. A product regression, invalid fixture, discovery bug, platform flake, and formatting failure do not ask for the same repair. The first incomplete step has an owner.</p><p>Exploration can be messy; the eventual review shape should be one minimal change, its native regression, and the governing invariant.</p><h2>Provenance</h2><p>Synthesized from the Vite correctness-lane process notes at Fieldwork revision <code>49e8c7dabbc75f021b09d243b1d95ecac215bb07</code>.</p>$html$,
    $md$## Turn friction into a probe

Take one recent “that was weird” moment and write:

- the first observable mismatch;
- the smallest likely result owner;
- a baseline behavior that should fail;
- a control that proves the probe can distinguish the mechanism;
- a stop condition if the anomaly belongs to the fixture or environment instead.

Do not propose the patch yet.$md$,
    $html$<h2>Turn friction into a probe</h2><p>Take one recent “that was weird” moment and write:</p><ul><li>the first observable mismatch;</li><li>the smallest likely result owner;</li><li>a baseline behavior that should fail;</li><li>a control that proves the probe can distinguish the mechanism;</li><li>a stop condition if the anomaly belongs to the fixture or environment instead.</li></ul><p>Do not propose the patch yet.</p>$html$,
    NULL
  )
),
prepared AS (
  SELECT
    owner.user_id,
    seeds.*,
    jsonb_build_array(
      jsonb_build_object(
        'label', 'Read',
        'content', seeds.read_markdown,
        'content_html', seeds.read_html,
        'code', NULL,
        'code_html', ''
      ),
      jsonb_build_object(
        'label', 'Try it',
        'content', seeds.practice_markdown,
        'content_html', seeds.practice_html,
        'code', seeds.practice_code,
        'code_html', ''
      )
    ) AS versions
  FROM seeds
  CROSS JOIN owner
)
INSERT INTO public.items (
  user_id,
  title,
  slug,
  url,
  content,
  content_type,
  tags,
  category,
  score,
  code,
  content_html,
  code_html,
  default_index,
  versions
)
SELECT
  prepared.user_id,
  prepared.title,
  prepared.slug,
  prepared.url,
  prepared.read_markdown,
  'markdown',
  prepared.tags,
  prepared.category,
  100,
  NULL,
  prepared.read_html,
  '',
  0,
  prepared.versions
FROM prepared
WHERE NOT EXISTS (
  SELECT 1
  FROM public.items existing
  WHERE existing.slug = prepared.slug
);
