---
title: Frontier inference economics
kind: concept
trunk: ai-systems
summary: Recorded token volume splits into fresh prefill, cached context, and generated decode, which drive very different serving and replacement costs.
created: 2026-08-27
updated: 2026-08-27
---
# Frontier inference economics

A large token counter mixes several kinds of work. Capacity planning gets clearer after partitioning the weekly recorded volume `T` by generated-token share `o` and input cache-hit share `c`:

```text
output/decode       = T * o
input               = T * (1 - o)
fresh prefill       = T * (1 - o) * (1 - c)
cache-hit input     = T * (1 - o) * c
```

If telemetry reports cache-hit tokens as a subset of total input, partition that input once; do not add the cache-hit subset a second time. Generated reasoning tokens, when reported separately, belong on the decode side for capacity and cost modeling.

Fresh input drives prompt prefill. Generated output drives sequential decode. Cache hits reuse previously computed prefix state and can avoid most prompt recomputation, while still consuming cache/state memory, lookup, transfer, and scheduling capacity. Long context also raises the state carried through generation, so a cached 300K-token session and a short session with the same output length can have very different decode costs.

## 2026-08-27 frontier snapshot

Artificial Analysis Intelligence Index v4.1.1 puts the current high-end open-weight candidates directly around GPT-5.6 Sol xhigh. For this workload, an Intelligence score around 57 is a useful screening floor; actual long-running agent behavior remains the deciding test.

| Model | Weights | AA Intelligence | AA cost / index task | AA API output speed | Total / active parameters | Context |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| GPT-5.6 Sol xhigh | Proprietary | 59 | $0.67 | 72.4 tok/s | — | ~1M |
| Kimi K3 max | Open | 60 | $0.84 | 39.0 tok/s | 2.8T / 104B | 1M |
| Qwen3.8 2.4T-A95B | Open | 58 | $0.81 | 22.4 tok/s | 2.4T / 95B | 984K |
| GLM-5.3-Flash | Open | 57 | $0.09 | 50.2 tok/s | 320B / 18B | 1M |

The Artificial Analysis output-speed number is user-facing sequential generation speed for an API request. It is a latency metric, not aggregate cluster capacity. Aggregate serving needs separate measurements for fresh-prefill throughput, total decode throughput under concurrency, queueing, cache reuse, and per-stream generation speed.

The parameter counts also explain why GLM-5.3-Flash lives in a radically cheaper serving class. K3 activates about 5.8x as many parameters per token as GLM-5.3-Flash and stores about 8.8x as many total parameters; Qwen3.8 activates about 5.3x as many and stores 7.5x as many.

## Blended workload reference

Historical baseline for this note: **10–12 billion recorded frontier-model tokens per week**, kept as one blended workload with no product-surface split recorded. The generated-token fraction is modeled as a sensitivity band of 2–5%; the cache-hit fraction is another sensitivity parameter rather than a claim about measured telemetry.

A week has 604,800 seconds, so 10–12B recorded tokens correspond to 16,534–19,841 recorded tokens per second when averaged across the full week. That number is accounting volume. At a 2–5% generated share, the sequential decode requirement is far smaller:

| Weekly recorded volume | Average recorded rate | 2% generated | 3% generated | 5% generated |
| ---: | ---: | ---: | ---: | ---: |
| 10B | 16,534 tok/s | 331 decode tok/s | 496 decode tok/s | 827 decode tok/s |
| 12B | 19,841 tok/s | 397 decode tok/s | 595 decode tok/s | 992 decode tok/s |

At 95% cache reuse on input, fresh prefill averages roughly **785–810 tok/s** at 10B/week and **942–972 tok/s** at 12B/week across the same 2–5% output band. Cache sensitivity is large:

| Input cache-hit share | Fresh prefill at 10B/week | Fresh prefill at 12B/week |
| ---: | ---: | ---: |
| 90% | 1,571–1,620 tok/s | 1,885–1,944 tok/s |
| 95% | 785–810 tok/s | 942–972 tok/s |
| 97% | 471–486 tok/s | 565–583 tok/s |

This is the main correction to a naive throughput estimate. Treating all 16.5–19.8K recorded tokens per second as autoregressive generation overstates average decode demand by roughly 20–50x under the 2–5% output assumption.

### Active-hour concentration

A weekly average hides burstiness. If most work happens inside a consistent daily active window, multiply the 24-hour average by `24 / active_hours` before adding further peak headroom.

| Effective active window | Multiplier | Decode envelope from the blended workload |
| ---: | ---: | ---: |
| 24 h/day | 1x | 331–992 tok/s |
| 12 h/day | 2x | 662–1,984 tok/s |
| 8 h/day | 3x | 992–2,976 tok/s |

Multiple simultaneous agents can push instantaneous load higher again. Long-context cache misses and multimodal/tool bursts mainly pressure prefill, memory, and queueing even when average decode remains modest.

## API-equivalent replacement cost

The table below uses a 95% cache-hit assumption on input and a 2–5% generated-token band. These are replacement-cost estimates at public token rates, not subscription billing statements.

| Model/API | Fresh input / cache-hit / output per 1M | 10B tokens/week | 12B tokens/week | Annual envelope |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.6 Sol | $4.00 / $0.40 / $20.00 | $9.7K–$15.5K | $11.6K–$18.6K | $504K–$968K |
| Kimi K3 | $3.00 / $0.30 / $15.00 | $7.3K–$11.6K | $8.7K–$14.0K | $378K–$726K |
| Qwen3.8 2.4T-A95B, international implicit cache | $2.00 / $0.25 / $6.00 | $4.5K–$6.2K | $5.4K–$7.4K | $234K–$387K |
| GLM-5.3-Flash, AA-listed provider pricing | $0.15 / ~$0.0255 / $0.50 | $0.41K–$0.55K | $0.49K–$0.66K | $21K–$34K |

GLM's cache-hit figure above is derived from Artificial Analysis's listed $0.15/M input price and 83% cache discount as of this snapshot. Kimi's official K3 API reports more than 90% cache hits on coding workloads, which makes a high-cache sensitivity case worth modeling; a different workload can land elsewhere.

OpenAI currently applies a long-context multiplier to GPT-5.6 requests above 272K input tokens: 2x input, 2x cached input, and 1.5x output for the full request. If every modeled Sol request landed in that tier, the same 95%-cache envelope would rise to **$17.4K–$26.0K/week at 10B** and **$20.8K–$31.2K/week at 12B**, or roughly **$0.90M–$1.62M/year**. A real workload should be costed request by request according to how much volume actually crosses that threshold.

The gap between subscription spend and these numbers is a product-economics result. Included usage, quota policy, promotions, resets, and retail API rates belong to different accounting systems. API-equivalent spend is useful here as replacement cost, not as an estimate of a provider's marginal compute cost.

## Self-hosting arithmetic

Large sparse MoE models have two separate hardware stories. Total parameters largely set the weight-memory floor; active parameters drive much of the per-token expert compute. Released low-precision formats make the raw capacity arithmetic easy to see:

| Model | Low-precision case | Approximate raw weight bytes | Hardware implication |
| --- | --- | ---: | --- |
| Kimi K3 | native ~4-bit MXFP4 | ~1.4 TB | vLLM says 8x B300 is the easiest/minimum current NVIDIA deployment |
| Qwen3.8 2.4T-A95B | FP4 quantized | ~1.2 TB | vLLM says one 8x B300 node; FP8/BF16 require at least two B300-class nodes |
| GLM-5.3-Flash | FP8 | ~320 GB | memory arithmetic alone fits within a much smaller multi-GPU deployment |

Those raw figures exclude quantization metadata, runtime buffers, cache/state memory, allocator slack, vision components, replicas, and serving headroom. An 8x B300 node has 2.304 TB of HBM from eight 288 GB GPUs, which explains why the 4-bit K3/Qwen cases fit in that class while retaining room for runtime state.

vLLM reports Kimi K3 at 111 tok/s per user on TP8 and 118 tok/s on TP16 at batch size 1, rising to 331 and 370 tok/s with DSpark speculative decoding on its GB300 NVL72 benchmark setup. It also documents prefix caching across K3's recurrent KDA state and full-attention cache, plus prefill/decode disaggregation. These figures show why the blended workload's average decode requirement can fit into a small number of giant-model serving nodes even though the recorded token counter runs into billions. Active-hour concentration, concurrent long contexts, prefill, cache churn, multimodal work, and latency targets determine how far beyond the minimum deployment to go.

Current public hardware prices make the capital scale concrete:

| Reference deployment | Current public price | Continuous rental reference |
| --- | ---: | ---: |
| 8x B300 server | ~$533K–$565K starting price at Supermicro | 8 x $7.89/GPU-hour on Runpod = ~$10.6K/week, ~$553K/year |
| 8x H200 server | ~$318K starting price at Supermicro | 8 x $4.31/GPU-hour on Runpod Clusters = ~$5.8K/week, ~$302K/year |

The H200 row is a hardware-cost reference, not a claim that eight H200s can hold K3 or Qwen3.8 in their cited 4-bit forms. Eight H200s provide about 1.128 TB of HBM, already below K3's ~1.4 TB and Qwen's ~1.2 TB raw 4-bit weight arithmetic before runtime overhead.

The hardware-only purchase price of an 8x B300 node is roughly one year of continuous current rental. Ownership then adds power, cooling, rack space, high-speed networking, storage, spares, deployment work, monitoring, and operator time. Hosted model APIs can beat dedicated rental because providers pool many customers, batch concurrent work, keep expensive GPUs busy, and exploit prefix reuse across long-lived sessions.

## What to carry forward

The durable model is simple: **recorded tokens are an accounting quantity; fresh prefill and generated decode are the serving quantities**. Billions of recorded tokens can coexist with hundreds to a few thousand generated tokens per second when prompts dominate the counter and prefix reuse is high.

For the 2026-08-27 snapshot, the blended 10–12B/week workload implies hundreds to about one thousand decode tok/s on a 24/7 average, or roughly one to three thousand tok/s when concentrated into eight active hours. Frontier-ish open-weight replacement still starts around an 8x B300 node for K3/Qwen because the models themselves are enormous. That makes a half-million-dollar machine a credible minimum hardware reference even after correcting the decode-throughput math.

GLM-5.3-Flash is the economic outlier: it reaches the 57-point screening floor with only 18B active parameters and 320B total, yielding radically cheaper hosted inference and a much smaller self-host memory footprint. Whether that capability level survives the actual agent workload is an empirical question.

## Connections

[Inference serving](inference-serving.md) owns the general prefill/decode, batching, cache, and concurrency model. [Measurement](../engineering-judgment/measurement.md) explains why one token-rate metric cannot stand in for latency and throughput together. [Latency and tails](../performance/latency-throughput-tail.md) covers the user-visible cost of queueing and burst concentration. [Memory hierarchy](../performance/memory-hierarchy.md) connects model weights and cache state to HBM capacity and bandwidth. [Agent loops](agent-loops.md) adds tool latency and concurrent agent behavior around inference.

## Sources for the dated snapshot

Accessed 2026-08-27:

- Artificial Analysis: [GPT-5.6 Sol xhigh](https://artificialanalysis.ai/models/gpt-5-6-sol-xhigh), [Kimi K3 max](https://artificialanalysis.ai/models/kimi-k3), [Qwen3.8 2.4T-A95B](https://artificialanalysis.ai/models/qwen3-8-2-4t-a95b), and [GLM-5.3-Flash](https://artificialanalysis.ai/models/glm-5-3-flash).
- OpenAI: [GPT-5.6 Sol API model and pricing](https://developers.openai.com/api/docs/models/gpt-5.6-sol) and [ChatGPT token rate card](https://help.openai.com/en/articles/20001415).
- Kimi: [Kimi K3 technical blog and API pricing](https://www.kimi.com/en/blog/kimi-k3).
- vLLM: [Kimi K3 serving guide and benchmarks](https://vllm.ai/blog/2026-07-27-k3) and [Qwen3.8 2.4T-A95B serving support](https://vllm.ai/blog/2026-08-12-qwen3.8).
- Alibaba Cloud: [Qwen3.8 2.4T-A95B model information and international pricing](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-2-4t-a95b).
- Z.ai: [GLM-5.3-Flash technical release](https://z.ai/blog/glm-5.3-flash).
- Runpod: [B300 pricing](https://www.runpod.io/gpu-models/b300) and [cluster pricing](https://www.runpod.io/pricing).
- Supermicro: [current GPU server listings](https://store.supermicro.com/us_en/systems/gpu.html?product_list_order=price_desc).