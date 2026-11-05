# Gemini integration: offline contract and protected accounting

Verified documentation date: November 4, 2026 (America/Bogota).

## Current delivery boundary

`Gemini.php` prepares the request, validates the provider envelope, validates the
review and connects usage receipts to the existing invitation/budget ledger. Its
transport seam is an explicitly supplied PHP closure. The next milestone adds
`GeminiHttps.php`, a **closed-by-default** cURL transport, and a private-file reader.
Neither is connected to a public or local preview route. With no transport, the
provider fails before reserving a review slot. No environment flag activates it.
See [secure preparation](SECURE.md) for the email-code and HTTPS helpers.

The two local HTTP previews continue to use `MockProvider`, paid budget zero and
their existing simulation notice. Spanish and English public HTML are unchanged.
The Google Cloud key has not been copied into this project. All new tests use
fictional data and synthetic Google-shaped envelopes; they prove software behavior,
not Gemini writing quality, availability, latency, authentication or actual billing.

## Contract and editorial scope

The server must select `gemini-review-v1` and receive an explicit true confirmation.
The default `Contract::request()` still requires `local-simulation-v1`. Neither
consent purpose authorizes the other. This code does not implement the visible
Google notice or invitation distribution in the interface. Email-code verification,
secure-cookie settings and a bilingual notice are now prepared as internal helpers,
without a public controller, actual mailer or hosting activation.

Only the draft assets, goal, constraints, language, business label, terms and
confirmed same-offer facts enter the model input. Source/destination URLs, unrelated
facts, account identifiers and campaign configuration are omitted. All user fields
are data, never system instructions. No destination fetching or Google Ads account
access is present.

This first integration retains the **extractive** response validator. Gemini can
select up to three complete confirmed facts and explain their relevance. It cannot
yet paraphrase or freely generate ad claims. The complete chosen fact must fit the
headline/description limit. Negations cannot be silently removed, changes require
owner confirmation, and pins/URLs/settings cannot be changed. IDs, draft revision,
original text, evidence, character counting and duplicates are checked in PHP.
Unchanged proposals and duplicate new proposals are also rejected.

This restriction deliberately preserves the existing safety contract. General
copy generation needs a separately validated factual/semantic review path. JSON
Schema and an LLM prompt alone do not establish factual or Google-policy compliance.

## API specification

- Fixed model candidate: `gemini-3.8-flash`; no `latest` alias or client choice.
- `POST https://generativelanguage.googleapis.com/v1beta/interactions`.
- API revision header: `2026-05-20`.
- JSON structured output; max three suggestions; required human confirmation.
- Stateless (`store=false`), non-streaming, synchronous; no tools or conversation ID.
- Output cap: 4,096 tokens; thinking level `low`, no thinking summaries.
- Request body: max 65,536 bytes; response body: max 131,072 bytes.
- Prepared cURL transport: 30-second total and 5-second connection deadlines,
  response cap enforced while receiving bytes, TLS verification, redirects disabled
  and a fixed endpoint. Tests substitute the cURL functions; they exercise that
  branch's options/error handling without opening a socket. Actual hosting/TLS and
  Google response behavior remain unverified.

The adapter accepts one completed text-only `model_output` step containing JSON.
Incomplete/blocked/failed/continuation responses are not retried or followed. Extra
tools or output modalities are never executed or priced as plain text. Provider
error bodies and private exceptions do not enter the public response.

## Reservation and usage accounting

The owner approved **USD 5 for the complete pilot**, shared across participants and
ES/EN. Calendar months do not renew that allowance. The Gemini orchestrator rejects
a server policy above 5,000,000 micro-USD before transport. The production default
remains zero; synthetic tests explicitly create their own test policies.

For this offline milestone, reserve a deliberately conservative **1,047,552
micro-USD (USD 1.047552)** before an attempt. This is a reservation, not a per-review
price. It includes the documented model input bound of 1,048,576 tokens, the requested
4,096 output tokens and a separate full 65,536-token thinking allowance. Reserving
only a characters/4 estimate would not establish a maximum. This conservative
reservation restricts concurrency and may refuse a final review even when its actual
cost would be small. A smaller reservation needs a validated provider token preflight
and confirmed output/thinking billing bounds before release.

The November 4 standard-text price snapshot is USD 0.75 input / USD 3.75 output
including thought per million tokens. Integer quarter-micro-USD arithmetic rounds
upward. The code expires this snapshot on **November 12, 2026 at 00:00 Bogotá**;
renew it only after checking model/billing rules again. The chosen model has not been
benchmarked against cheaper alternatives. Cache discounts are ignored conservatively.

Synthetic receipt settlement includes input, output and thought tokens. Missing,
negative, string-valued, inconsistent, unexpected-model, tool or out-of-bound usage
is uncertain. An all-zero receipt cannot release a nonempty request reservation.
Timeouts, non-200 responses and missing receipts retain the reservation and pause the
shared pilot until an administrator reconciles the outcome. No automatic replay,
retry or failover is implemented.

A known text usage receipt is settled even when the proposed copy is malformed or
the response is incomplete: a rejected answer can still have a cost. The same request
cannot invoke the provider twice. Revocation is checked even for a cached response;
expiry of the response cache does not permit another generation under the same ID.

**Usage-based accounting is not a Google invoice.** Before any live transport,
validate the real model response shape, token bounds, price/tier and safety/error
billing semantics. There is no applied Google project spend cap yet: AI Studio's
amount editor rendered without a field. Its monthly limit, once available, is an
additional delayed control, not a substitute for the lifetime ledger. Do not alter
the shared billing account to impose Lienzo's budget on other projects.

## Verification

November 4 result: **117 passing checks**: 55 new PHP adapter cases, 35 existing
PHP review cases, 25 existing pilot cases and 2 two-process races. These are the
targeted suites for this change, not a rerun of every site or browser test. Evidence:
`output/ads-gemini-2026-11-04/verification.json`. `git diff --check` also passed.

- `scripts/tests/ads-gemini-php.php`: offline contract, isolation, privacy projection,
  ES/EN responses, receipt accounting, uncertainty, quota and cached result behavior.
- `scripts/tests/ads-gemini-race.test.cjs`: two independent PHP processes racing on
  one request or the shared budget; the transport only writes a synthetic marker.
- Existing PHP contract and pilot suites must still pass. No frontend workflow was
  replaced or rebranded as live AI.

Supply each PHP suite a fresh private directory outside the web root. For the new
suite, use `allow_url_fopen=0`, PHP `-n`, PDO SQLite, mbstring and intl; cURL is not
loaded. Never wipe an existing participant database to repeat QA.

## Remaining activation gates

1. Validate the offline contract with real Gemini responses using an expressly
   authorized bounded test after credits and secure transport are reviewed.
2. Store the dedicated secret outside the repository/public root, with verified
   hosting permissions; establish its actual stable egress IP before IP restriction.
3. Complete verified access, visible Google consent, HTTPS sessions and abuse controls.
4. Check the price snapshot, reservation bounds and receipt/invoice reconciliation;
   configure the additional project cap when AI Studio allows it.
5. Review the exact credit purchase and its shared-account effect separately. No
   credit purchase or real generation is included in this development milestone.

## Official sources

- [Interactions API overview](https://aistudio.google.com/docs/interactions-overview)
- [Structured outputs](https://aistudio.google.com/docs/structured-output)
- [Interactions API reference](https://aistudio.google.com/api-reference/interactions-api)
- [Create interaction](https://aistudio.google.com/api-reference/interactions-api/create-interaction)
- [Gemini 3.8 Flash model limits](https://aistudio.google.com/docs/models/gemini-3.8-flash)
- [Standard pricing](https://aistudio.google.com/docs/pricing#gemini-3.8-flash)
- [Project spend caps](https://aistudio.google.com/docs/billing#project-spend-caps)
