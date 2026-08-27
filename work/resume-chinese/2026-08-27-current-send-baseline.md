# Chinese résumé current send baseline — 2026-08-27

This is a small operational note for the current mainland-China send. It records the choices that have already been made so another renderer or reviewer does not reopen them by accident.

## Current content order

For the current Chinese résumé, keep this order unless a specific role gives a reason to change it:

1. **Preflight / 核心项目**
2. **开源工程** — Cloud Hypervisor first, then Vercel AI SDK, then Vite / Workers SDK
3. **实习经历** — IBM
4. **教育背景**
5. **技能**

This is a role-facing projection of English V13, not a claim that the English résumé should adopt the same section order. Preflight leads here because mainland client/runtime/performance/tooling readers can understand its game/runtime evidence immediately.

## Current sendable content

Use [`2026-08-27-mainland-game-tech-v13-consolidated.md`](2026-08-27-mainland-game-tech-v13-consolidated.md) as the content baseline for the current PDF.

The exact LaTeX source for the visually selected one-page A4 render is [`2026-08-27-mainland-game-tech-v13-balanced.tex`](2026-08-27-mainland-game-tech-v13-balanced.tex). It is the durable render source for the current cousin-send PDF and is intended to be compiled with XeLaTeX and the Noto Serif / Noto Sans CJK fonts named in the file. The Chinese résumé header uses **李孟熙** as the primary name with **Leo Li** retained smaller beside it for continuity with the English résumé and linked profiles.

The newer Preflight automation work remains Thunderdome input for a later résumé revision. Do not delay the current send merely to force it into this version.

## Rendering notes learned from the visual pass

Chinese should not inherit the English V13 typography mechanically.

For the current one-page A4 version:

- use a readable Chinese serif body with a clean sans/黑体-style heading face;
- keep margins compact but normal; do not make the page look like microprint;
- keep bullet and section spacing tight and even rather than airy;
- avoid large blank gaps before section headings or between OSS blocks;
- it is fine to leave a little more unused space at the bottom than at the top;
- preserve one-page readability ahead of filling every available millimeter;
- render to PDF and inspect the actual page image before calling the layout finished.

These are current rendering lessons, not permanent numeric spacing rules. If the copy changes materially, rebalance the page visually instead of preserving old measurements by ritual.

## Current cousin send

For the current family update, send the existing English V13 together with the current Chinese one-page PDF. Use **`李孟熙_中文简历_2026-08-27.pdf`** as the Chinese attachment filename. The accompanying WeChat wording lives in [`2026-08-27-cousin-wechat-note.md`](2026-08-27-cousin-wechat-note.md).

No additional explanation, referral request, or Preflight technical paragraph is needed unless the conversation naturally goes there.
