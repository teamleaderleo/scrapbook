# Chinese résumé working lane

This directory is the working area for mainland-China-facing Chinese résumé adaptations.

The Chinese files here are **review artifacts**, not a second career source of truth. Current facts continue to come from:

- [`../resume-current.md`](../resume-current.md) — current one-page English selection;
- [`../resume-drafts/2026-08-26-v13.tex`](../resume-drafts/2026-08-26-v13.tex) — current V13 LaTeX;
- [`../resume-candidates.md`](../resume-candidates.md) — larger candidate reservoir;
- [`../records/preflight-live-performance.md`](../records/preflight-live-performance.md) — moving Preflight performance record;
- [`../records/open-source.md`](../records/open-source.md) — exact upstream status and review stories;
- [`../portfolio-inventory.md`](../portfolio-inventory.md) — broader owned-project context.

If any Chinese draft disagrees with those sources, fix the Chinese draft.

## Current baseline

The current English résumé baseline is **V13, dated 2026-08-26**.

The first Chinese seed is [`2026-08-27-mainland-game-tech-v13-seed.md`](2026-08-27-mainland-game-tech-v13-seed.md). It deliberately tests a mainland game/runtime/tooling presentation and leads with Preflight instead of copying the English section order.

## How old chats and other reviewers should contribute

Old conversations may have useful Chinese terminology, recruiter context, and earlier résumé decisions. Preserve that memory as editorial input while refreshing every factual claim against the current sources above.

Reviewers should add an independent proposal instead of silently overwriting somebody else's version. A useful filename is:

`YYYY-MM-DD-<reviewer-or-lens>-<focus>.md`

Examples of useful lenses include:

- mainland game-engine/runtime recruiter;
- miHoYo client/performance team;
- Tencent game technology / 研发效能;
- NetEase engine/tooling;
- general mainland systems/software recruiter;
- Chinese copy editor with technical-engineering experience.

A reviewer may change section order, terminology, density, or which evidence leads. Do not turn one reviewer's local choices into permanent résumé rules.

## Translation and positioning rules

- Adapt for the reader; do not translate English sentence by sentence.
- Keep company/project names in English where that is the natural engineering usage.
- Prefer Chinese technical language an engineer would actually use: 性能分析、运行时、字节码重写、缓存、存储布局、生命周期、故障处理、研发效能、构建/测试/发布工具链, etc.
- Preserve exact distinctions between employment, independent engineering, direct upstream merges, adopted repairs, open work, and research.
- Do not imply employment at open-source projects.
- Do not turn independent or OSS work into invented years of AAA/UE/C++ production experience.
- A game-targeted variant may lead with Preflight because the game/runtime/performance evidence is unusually legible there.
- Current job/company research belongs in `teamleaderleo/job-search`; this directory owns résumé wording and review output.

## Handoff for an older chat

Point the old conversation at this directory and say, approximately:

> Revive this thread. We worked on the Chinese résumé before, but the profile has changed substantially. Treat our old discussion as useful editorial memory and use `teamleaderleo/scrapbook/work/resume-chinese/README.md` plus the current V13 sources it links as the factual baseline. Read the current seed, compare it with what we used to believe about the profile, then add your own independent Chinese variant or review in `work/resume-chinese/`. Preserve exact evidence/status boundaries. Feel free to disagree with the other variants; we will compare them later.

## Later comparison

Once several useful variants exist, run a Thunderdome over them. Compare concrete choices—lead section, terminology, density, role family, and what uncertainty each version answers—then promote only the decisions that survive that comparison.
