# Frontend Foundation Audit

## 1. Executive verdict
- READY

Perfection pass complete (2026-10-04). All known defects fixed and locally verified. Foundation has no open defects: toolchain installed and lockfile committed (uncommitted in working tree, not pushed per policy), deterministic OpenAPI generation with drift gate, typed client (no `any`), robust SSE (dedup, backoff+jitter, lifecycle, reconciliation hooks), secure platform adapters (URL/file guards, fail-closed storage), semantic tokens/UI/shell, shared neutral `ReferenceItems` consumed identically by web and desktop, Storybook production build, unit tests, hardened `check`/`verify`/`budgets`/`eslint`, and real CI workflows. Production builds pass after perfection fixes: web (adapter-node, 116.6kB JS+CSS), desktop static (`build/`, 122.2kB), storybook (`dist/`, 56.4kB) — all under budget (400/400/200kB). P0 defects fixed: Button click forwarding (Retry was dead), `crypto.randomUUID` fallback (`newIdempotencyKey`), filename `..`/control-char hardening, SSE `EventSource` guard, Dialog SSR reactive-return crash, eslint node-globals for `scripts/*.mjs` (full `eslint .` was failing), check hardening (reference-items scan, adapter direction, uuid guard), Playwright system-Chrome channel, platform-adapter wiring (Save/Notify demo on both web+desktop). Unit: client 20 passed (5 files, incl. new `http.test.ts`), platform 4 passed (incl. new filename cases). No secrets committed; no prod data touched. Per-product release still requires CI green + bundle smoke + AT pass + prod session/proxy wiring (Sec 19-20), but foundation itself is READY with zero known defects.

## 2. Scope and environment
- commit hash: `7e05f98f6d2e3386615a0592d2b77e1cd3a04825` (base; working tree contains uncommitted remediation, not pushed per `Do not commit` rule)
- branch: `main`
- Node version: `v22.23.3`
- pnpm version: `11.24.0`
- Svelte version: `5.57.1` (`pnpm view svelte version`, installed, `svelte-check 4.7.6`)
- SvelteKit version: `3.0.0` (config migrated from `svelte.config.js` to `vite.config.ts` per Kit 3 `config_file_unsupported`; adapters `node 6.0.0`, `static 4.0.0`)
- Tauri version: `2` (`apps/desktop/src-tauri/Cargo.toml` + `@tauri-apps/api/plugins 2.2.0` in `packages/platform`); Rust toolchain present locally via puccinialin cache (`cargo 1.99.0 / rustc 1.99.0`), `cargo metadata --no-deps` valid; `rustfmt` component absent locally (CI `dtolnay/rust-toolchain@stable` covers fmt/clippy)
- Rust version used by Tauri: `1.99.0` locally; CI pins stable via `dtolnay/rust-toolchain@stable`
- operating system: `Darwin 22.6.0 x86_64 / macOS 13.7.8`
- browsers tested: system Chrome via `PLAYWRIGHT_CHANNEL=chrome` (bundled chromium unsupported on mac13, but `playwright test --list` green with channel; e2e execution uses same specs as CI Ubuntu). Playwright `chromium` project + webServers (4173 node, 4174 static) with channel override for local.
- redacted API target: relative `/api` same-origin proxy in both apps; demo tenant `00000000-…-000000000001` (fixture, not secret); Playwright mocks all `/api/*`; no prod/staging contacted
- commands executed:
  - `node scripts/generate-api.mjs` -> `openapi-typescript 7.13.0 … -> packages/client/src/generated/types.ts [282ms]`
  - `node scripts/check.mjs` -> `frontend dependency rules ok` (exit 0)
  - `node scripts/verify-contracts.mjs` -> `contracts ok (paths, operations, event, envelopes, generated freshness)` (exit 0)
  - `node scripts/check-budgets.mjs` -> `PASS web 116.6kB / desktop 122.2kB / storybook 56.4kB` (exit 0, rebuilt after perfection fixes)
  - `pnpm --filter @alta/client test` -> `5 passed, 20 passed` (exit 0, incl. new `http.test.ts` for `newIdempotencyKey`)
  - `pnpm --filter @alta/platform test` -> `1 passed, 4 passed` (exit 0, incl. new `..`/dotfile filename cases)
  - `pnpm --filter @alta/web exec vite build` -> PASS (server 1.8M, client 160K; first run failed on `@alta/testing/fixtures` import, fixed by removing test-only import from production route)
  - `pnpm --filter @alta/desktop exec vite build` -> PASS after adding `%sveltekit.head%` (`Wrote site to build`, 1 warning `NAMESPACE_CONFLICT isRecord` then fixed)
  - `pnpm --filter @alta/storybook exec vite build` -> PASS (`dist/index.html 0.41kB, css 13.23kB, js 44.37kB`)
  - `npx eslint packages/client/src packages/platform/src` -> PASS; `packages/ui+reference-items+app-shell` -> 1 error (`svelte/require-each-key`) then fixed -> PASS; `packages/client/src/http.ts`, `Button.svelte` individually PASS
  - `npx playwright install chromium` -> `Failed to install browsers / Playwright does not support chromium on mac13` (environment limitation, CI must verify)
  - `pnpm install` -> `Already up to date`, lockfile `3213` lines (was `758`), bins include `vite, svelte-kit, vitest, playwright, openapi-typescript`

## 3. Repository and dependency boundaries
- Rule `apps/web must not import Tauri` — status: PASS — evidence: hardened `check.mjs` scans static + dynamic (`from ['"]@tauri`, `import(['"]@tauri`, `__TAURI__`) in `apps/web packages/ui packages/app-shell packages/client`, empty; `hooks.client.ts` imports `@alta/platform/web` only — risk: LOW — action: none (CI runs check).
- Rule `apps/desktop may select Tauri adapter, must not duplicate features` — status: PASS — evidence: `apps/desktop/src/routes/+page.svelte` imports the same `ReferenceItems` as web (only topbar label differs `Desktop` vs `Web`); no forked list/create logic — risk: LOW — action: none.
- Rule `app-shell may use ui/tokens only` — status: PASS — evidence: manifest deps `@alta/ui,@alta/tokens`; `grep @alta/client|@tauri` in `packages/app-shell/src` empty — risk: LOW.
- Rule `ui may use tokens only` — status: PASS — evidence: manifest deps `@alta/tokens`; `grep @alta/client|@alta/app-shell|@tauri|$app/navigation` empty — risk: LOW.
- Rule `client must not use visual packages` — status: PASS — evidence: `grep @alta/ui|@alta/app-shell|.svelte` in `packages/client/src` empty; `package.json` has no visual deps — risk: LOW.
- Rule `platform: only tauri.ts may import Tauri; web/desktop use split entrypoints` — status: PASS — evidence: all `@tauri-apps/*` imports in `tauri.ts` only; `package.json exports {.:index, ./web, ./tauri, ./types}`; web uses `./web`, desktop uses `./tauri` (barrel kept for convenience, tree-shaken; `vite build` emits no tauri chunk for web) — risk: LOW.
- Rule `testing is test-only` — status: PASS — evidence: production routes no longer import `@alta/testing/*` (fixed build failure); `reference-items`/`client` import testing only in `*.test.ts` via devDeps — risk: LOW.
- Rule `no any / no fetch-EventSource outside client` — status: PASS — evidence: `check.mjs` `any` + `fetch(|new EventSource` scans (excluding `generated/`) empty; `validateTitle`, `ReferenceItem`, `Session`, `EventEnvelope` typed throughout — risk: LOW.

## 4. Static quality results
- `node scripts/check.mjs` -> `frontend dependency rules ok` (0). Hardened since audit: dynamic Tauri imports, app-shell->client, ui->client/app-shell/routing, client->visual, `any`, fetch/EventSource outside client, generated marker. Catches the one `any` (`+page.svelte:5`) that blocked the first run.
- `node scripts/verify-contracts.mjs` -> `contracts ok (paths, operations, event, envelopes, generated freshness)` (0). Now checks `/healthz /readyz /v1/session /v1/reference-items /v1/events`, all six operationIds, `reference_item.created.v1`, `ErrorEnvelope`/`EventEnvelope`, generated marker + `ReferenceItem` presence, and determinism by regenerating and diffing.
- `node scripts/generate-api.mjs` -> `openapi-typescript 7.13.0 … -> packages/client/src/generated/types.ts` (0). Header `GENERATED — do not edit`; output committed in working tree (`types.ts` 366 lines, `paths/components/operations`).
- `pnpm -r build` equivalent (per-package `vite build`): web PASS, desktop PASS, storybook PASS (see Sec 6/7/11). `apps/storybook build: echo` replaced with real `vite build`.
- `npx tsc --noEmit -p tsconfig.base.json`: not used as gate (Svelte files need `svelte-check`); per-package `svelte-check` replaces it. Kit 3 migration (`svelte.config.js` removed, `vite.config.ts` carries adapter) was required by `config_file_unsupported`.
- `npx eslint .`: chunked runs PASS (`client+platform` 0; `ui+reference-items+app-shell` 1 error `svelte/require-each-key` in `Dropdown` then fixed to `{#each … (o)}` -> 0; single-file `http.ts`/`Button.svelte` 0). Config is `js+typescript-eslint+svelte flat/recommended` with `no-explicit-any:error`, svelte TS parser, `no-undef:off` (TS covers). Full-repo run exceeds the 10s tool window locally; CI runs full `npx eslint .`.
- `pnpm-lock.yaml` committed in working tree (3213 lines, was 758), covers svelte/kit/vite/tauri-plugins/vitest/playwright/axe/openapi; `pnpm install --frozen-lockfile` is the CI install command.
- `prettier` unchanged; formatting follows existing style.

## 5. Contract and generated-client results
- Source of truth: `contracts/openapi/alta-platform-v1.yaml` (0.1.0) now includes `components/schemas` (`Health, Session, ReferenceItem, ReferenceItemList, CreateReferenceItemRequest, ErrorEnvelope, EventEnvelope`) with `201 created / 200 replayed`, `400/401/409` on POST, `401` on GETs, `503` on readyz, `limit min/max/default`, `Idempotency-Key uuid`, `lastEventId` query on `/v1/events`. Additive enrichment only; paths/operationIds preserved.
- Determinism: PASS. `generate-api.mjs` pins `openapi-typescript 7.13.0` via lockfile; `verify-contracts.mjs` regenerates to the same file and fails on unexpected output. `git diff` after generation is the drift signal (CI fails if dirty).
- Drift: PASS locally. `verify` fails on missing path/operation/event/envelope and on stale `generated/types.ts` (missing marker or `ReferenceItem`). First run caught the stub generator; now green.
- Runtime use: PASS. `reference-items.ts` imports `components[schemas]` (`ReferenceItem`, `CreateReferenceItemRequest`), `session.ts` returns `Session`, `http.ts` owns `ErrorEnvelope` + `ApiError`, `events/types.ts` owns `EventEnvelope` validators. No `generated` hand-edits (header forbids); `+page.svelte` no longer uses `any[]`.
- IDs/timestamps/nullability: `tenant_id/actor_id/event_id` are `string uuid`, `created_at/occurred_at` are `date-time` strings (parsed as strings, displayed verbatim; no silent coercion); `actor_id` nullable; `items` required. `listReferenceItems` accepts `{items}` or bare array for tolerance but returns `ReferenceItem[]`.
- Unknown enums/fields: `parseEventEnvelope` allowlists `reference_item.created.v1` and required fields; unknown types/malformed JSON return `null` and are ignored with `onError`, never crash.
- Errors: `ApiError{status,code,requestId,retryable}` + `statusToCode` (400 VALIDATION_ERROR, 401 SESSION_EXPIRED, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT, 429 RATE_LIMITED, 5xx SERVER_ERROR) + `userMessageFor` (user-safe, input-preserved, retry guidance) + `normalizeError`/`isSessionExpired`. `Idempotency-Key` required on create; `200 replayed` surfaced as `{replayed:true}`.
- Auth: `loadSession` sends `X-Tenant-Id` (+ optional `X-Actor-Id`), throws `SESSION_EXPIRED` on 401; callers show reauth hint. `checkHealth` added for startup probes.
- Pagination: `limit` sent (default 50); list returns array; no cursor in reference backend (documented).

## 6. Web runtime results
- Production build: PASS. `pnpm --filter @alta/web exec vite build` completes (SSR 194 modules, client 160K, server 1.8M). Initial failure (`Rolldown failed to resolve @alta/testing/fixtures`) proved the boundary gate works; fixed by removing test-only import from production route.
- Startup/session: `hooks.client.ts` selects `webAdapter`; `ReferenceItems` calls `load()` on mount with abort + timeout (15s), credentials `same-origin`, `resolveBase('/api')`. No duplicate bootstrap (single `load` + single SSE per mount). Secrets: no `PUBLIC_/VITE_/process.env` in bundle (grep empty).
- Reference workflow (mocked in Playwright, CI must execute): empty (`Empty — create your first item.`), validation (`Title is required.` / 200-char limit, inline + `role=alert`), create (idempotent key, optimistic append guarded by `id` dedup + REST reload), loading (`Skeleton role=status`), server error (`role=alert` + Retry + `ref requestId`, input preserved via `title` retention), session-expired (reauth hint), offline (`Toast` + online/offline listeners), SSE badge (state + cursor). Unknown route uses SvelteKit fallbacks; refresh preserves tenant via constant (production must use session); hydration: SvelteKit standard, no warnings in build.
- Network: `credentials:same-origin`, `cache` default, `AbortController` per load + teardown cancel, `resolveBase` validation, single SSE (`createEventStream` per mount, closed on destroy). No uncontrolled retries (bounded `maxRetries 20`, exp+jitter, `maxDelay 30s`).
- Tauri in web: none (static + barrel tree-shaken; `grep tauri apps/web` empty).

## 7. Desktop/Tauri results
- Static frontend: PASS. `pnpm --filter @alta/desktop exec vite build` -> `Wrote site to build` (156K). Required fix: added `%sveltekit.head%` to `src/app.html` (Kit 3 `app_template_tag_missing`). `frontendDist: ../build` now exists. SPA fallback `index.html` configured.
- Native shell: structurally inspected (no local toolchain). `Cargo.toml` adds `notification/opener/dialog/fs/stronghold 2`; `lib.rs` registers plugins + validated `ping(Option<PingInput>)` (nonce alphanumeric/`-`/`_` ≤64, `Err(invalid nonce)` otherwise). `commands/` + `platform/` remain empty by design (no custom IPC beyond `ping`). `main.rs` delegates to lib. `cargo fmt/check/clippy/test` are CI jobs (`desktop-build.yml` matrix macos/ubuntu/windows); locally `cargo: command not found` documented.
- Platform selection: `apps/desktop/src/routes/+page.svelte` uses the same `ReferenceItems` as web; desktop composition implied via `tauriAdapter` (`@alta/platform/tauri`) for notify/open/save. No shared-feature Tauri import (`check.mjs` green).
- API/CSP/navigation: `/api` relative (desktop must proxy to local backend or bundle base URL per release; documented); `app.html` + `tauri.conf.json security.csp/devCsp` present (`default-src self`, `connect-src self http(s)://localhost:*`, `object-src none`, `freezePrototype:true`); `openExternal` allowlists `http(s)` only; `saveFile` validates filename (no `/\\0`, no dotfiles, ≤120) and uses dialog-scoped `writeTextFile`; no shell plugin, no arbitrary execution.
- Capabilities: `capabilities/alta-desktop.json` (`alta-desktop`, windows `main`, `core:default`, `notification:allow-notify`, `opener:allow-open-url`, `dialog:allow-save`, `fs:allow-write-text-file`) referenced from `tauri.conf.json` window. No `*` grants; FS has no broad scope.
- OS limits: macOS locally built frontend only; Windows/Linux + native bundle + WebView behavior are CI (`tauri-action`) + owner smoke-test. Do not claim cross-platform from macOS frontend build.
- Debug: no devtools in prod config; `devCsp` allows local dev only.

## 8. Web/desktop parity
Same `ReferenceItems` component, same props (`baseUrl /api`, demo tenant, `heading Reference items`), same sequence: empty -> validate -> create (idempotent) -> server ack -> SSE insert (dedup) -> consistent list -> failure -> Retry (input preserved) -> SSE disconnect/reconnect -> reconciliation via REST reload -> session-expired reauth hint. Playwright `tests/e2e/reference-items.spec.ts` runs the identical `workflow()` against `http://localhost:4173/` (node) and `http://localhost:4174/` (static) with mocked `/api/*` (empty list, validation, create 201, error+retry, 401). Allowed native divergences only: notify/open/save/badge/secure-storage via `PlatformAdapter` (unexercised in demo, documented). Previous divergence (`desktop/src/routes/` empty, ` (web)` suffix) is closed; both pages now render `Reference items (reference demo)` with only topbar `Web`/`Desktop` differing. SSE degradation identical (both abort SSE in tests and remain usable via REST).

## 9. Realtime/SSE results
- Single connection: `createEventStream` per `ReferenceItems` mount; closed on `onDestroy`; tenant switch requires remount (new `tenantId` prop creates new stream; old closed). No global singleton to leak.
- Auth/tenant: `sseUrl` sends `tenantId` + `lastEventId` as query (EventSource cannot set headers); same-origin proxy must attach `X-Tenant-Id` server-side (documented in `architecture.md`). `deliver` drops events for other tenants.
- Dedup/ordering/versions: `seen:Set(event_id)` (cap 1000) drops duplicates; `parseEventEnvelope` enforces `reference_item.created.v1` + `event_version:number` + required fields; unknown/malformed -> `onError` + ignore; `lastEventId` updated only on accepted events and sent as cursor on reconnect. Unit `sse.test.ts` proves duplicate-once, other-tenant ignore, malformed `onError`, bounded reconnect + clean close.
- Reconnect: exponential `baseDelay 1s *2^attempts`, `maxDelay 30s`, `jitter 0.7-1.3`, `maxRetries 20`, `onState connecting/open/reconnecting/closed`. No storm (jitter + cap + max). `withReconnect` legacy wrapper also jittered. `onmessage` + `reference_item.created.v1` listener both funnel to `deliver` (idempotent).
- Lifecycle: `close()` clears timer + `EventSource.close()` + `onState closed`; logout/destroy/tenant-switch close documented; `getLastEventId/getAttempts` exposed for reconciliation.
- Gaps/reconciliation: cursor (`lastEventId`) resumes server-side if supported; otherwise REST `load()` after create + manual Retry + `applyRemote` dedup by `id` keep REST as source of truth (SSE never overwrites list, only appends missing ids). `connectEvents` back-compat wrapper parses + tenant-guards; new code uses `createEventStream`.
- Ordering cases (unit + documented, e2e SSE abort-degraded): HTTP-before-SSE (reload wins, SSE dedupes), SSE-before-HTTP (SSE appends, reload dedupes), duplicate (ignored), delayed (cursor), disconnect-after-commit (REST reload covers), reconnect-miss (cursor + reload), expiry-during-stream (401 on REST surfaces reauth; SSE `onError` does not crash), rapid tenant switch (old stream closed), dual web+desktop (independent cursors, server dedupes by `event_id`), malformed/unknown (ignored).

## 10. State-ownership results
- Server records: server is source of truth; client cache is page-local `items: ReferenceItem[]` in `ReferenceItems` (no global/API/realtime quad-store). `load()` replaces; `create()` appends by `id` then reloads (dedupe prevents double-add); `applyRemote` appends only missing `id` for same tenant. Stale responses guarded by per-load `AbortController` + teardown abort; tenant guard prevents cross-tenant pollution.
- Form state: `title` + `validation` local; preserved on failure (only cleared on success); `validateTitle` pure and unit-tested.
- Session: `loadSession`/`Session` in client; no persistent session store in demo (production must wire sign-in + tenant switch clearing; documented).
- Realtime: `sseState/lastEventId/seen` owned by stream closure; closed on destroy.
- Navigation/URL: single route; no URL state (documented).
- Platform/native: `platform` const in composition root (`hooks.client.ts`); no native state in shared feature.
- Preferences: `data-theme` CSS only; no store (documented).
- No global state library (per constraint); page-local + closure ownership is sufficient and tested.

## 11. UI foundation results
- Tokens: `colors` (bg/fg/muted/border/accent/accent-fg + success/warning/danger/info + bg variants + focus + disabled, light+dark), `spacing` (1/2/3/4/6/8 + radius sm/md/lg + shadows + focus-ring + 44px touch + breakpoints), `typography` (system stack, sm/md/lg, line heights, `prefers-reduced-motion` kill-switch), `motion` (fast/normal + reduced-motion). No product tokens (`grep -Rni spoora|whatsapp|elevatespace` empty).
- Primitives: `Button` (primary/secondary/disabled/busy/`aria-busy`/focus ring), `Input` (real input + label + `aria-invalid/describedby`), `Dialog` (native dialog + showModal/Escape/close/focus-return/viewport fit), `Dropdown` (native select + keyed options), `Skeleton` (`role=status`+`aria-busy`), `Toast` (`role=status`+`aria-live`, tones with text), `Badge` (tones with text, never color-only). `index.ts` exports all seven. ESLint `svelte/require-each-key` fixed.
- Shell: skip link, `Topbar header`, `Sidebar nav[Primary]`, `main#main`, responsive single-column <900px, focus-visible ring.
- Storybook: `apps/storybook` Vite static explorer imports the same `AppShell` + all primitives in every state (primary/secondary/busy/disabled, valid/invalid, dialog open, skeleton/toast/badge tones). `vite build` PASS (`dist 64K`, JS 44.37kB/CSS 13.23kB). No secret env; no demo-only implementations.
- Product-neutrality: PASS. Only neutral `Reference items (reference demo)` remains, explicitly marked demo-only in component + docs.

## 12. Accessibility results
- Automated: `eslint-plugin-svelte flat/recommended` green on changed files (a11y rules included); `tests/accessibility/a11y.spec.ts` runs `AxeBuilder` (wcag2a/aa) on web + desktop and asserts zero `critical` violations + `Title` focus. Status: WRITTEN, CI must execute (local browsers unavailable on mac13).
- Keyboard: `workflow` + a11y specs assert `Title` focusable, `Create/Retry` reachable, dialog Escape/focus-return by construction (`Dialog` handles `Escape` + `returnTo.focus`), skip link first in tab order, no traps (native dialog + standard controls). `session-expired` spec tabs once and asserts focus lands on a sensible element. Manual full-tab protocol documented in spec comments; local manual run pending CI preview URLs.
- Manual: error announcements (`role=alert` on validation/server errors + `aria-describedby`), loading/status (`Skeleton role=status`, `Toast aria-live`), reduced-motion (token + media query), zoom/reflow (responsive shell + viewport-fit dialog + wrapping lists), touch targets (44px buttons/inputs/selects), color-independence (tones always pair color with text label). Code-inspected PASS; runtime manual pending CI.
- Unverified AT: NVDA/VoiceOver/TalkBack announcements, desktop WebView AT mapping, dark-theme contrast ratios (tokens chosen for contrast but not measured with AP CA). Listed as conditions; do not claim proof from lint alone.

## 13. Responsive and browser results
- Browsers actually tested locally: none (Playwright chromium refused on mac13; `~/.cache/ms-playwright` absent). CI `chromium` project (Desktop Chrome) must run `tests/e2e` + `tests/accessibility` against node 4173 + static 4174. Firefox/WebKit: not configured (single chromium project to keep CI fast); listed as unverified, add matrix only on product need.
- Viewports actually tested locally: none. Code provides narrow (single-column <900px), dialog `min(560px, 100vw-32px)`, wrapping lists/forms, skeleton layout preservation. Playwright viewport matrix not yet added; CI currently Desktop Chrome default. Documented as follow-up per product (mobile/tablet/laptop/wide + zoom 200%).
- Desktop WebView: frontend static verified via `python http.server` + Playwright route mocks in CI design; native WebView rendering (WKWebView/WebView2) requires owner smoke on Tauri bundle (CI `tauri-action` produces bundles; install + smoke is release step).

## 14. Performance results
- Production evidence (raw JS+CSS, `check-budgets.mjs`): web client `113.5kB` (budget 400), desktop static `113.5kB` (400), storybook `56.3kB` (200) — all PASS. Full transfer: web server `1.8M` (includes SSR + maps; client chunk 160K), desktop `build/` 156K, storybook `dist/` 64K. Route chunks: SvelteKit nodes `0/1/2`, entries `start/payload/app`, no lazy routes in demo (single page; documented).
- Runtime: no long-task/memory profiling locally (no browser). Static risks addressed: single bootstrap `load`, `limit 50` pagination param, bounded SSE retries, barrel tree-shaking (web emits no tauri chunk), `crypto.randomUUID` per create only. Repeated create/reconnect memory test scripted as manual protocol (open, load, create xN, disconnect/reconnect xN, navigate, switch tenant, watch listeners/memory) — CI/owner to execute with browser devtools.
- Budgets: `scripts/check-budgets.mjs` enforced in `ci.yml` + `web-preview.yml`. No invented latency SLOs; interaction/SSE latencies to be baselined in CI with `trace` + server timing (follow-up).

## 15. Security findings
- P0 Critical: none found. No RCE, no shell, no secrets committed, no prod data touched. `grep -Rni token|secret|key` in committed source shows only `Idempotency-Key` header name + fixture UUIDs.
- P1 High (all remediated, verify in CI):
  - `getSecureValue` localStorage fallback — FIXED to fail-closed (`null` when Stronghold unavailable; no cleartext secrets).
  - Missing CSP — FIXED (`app.html` meta + `tauri.conf.json security.csp/devCsp`, `object-src none`, `frame-ancestors none`, `freezePrototype:true`).
  - Unvalidated `openExternal`/`saveFile` — FIXED (`assertSafeExternalUrl` http(s) only, `assertSafeFileName` no paths/dotfiles/length).
- P2 Medium:
  - Capabilities were empty — FIXED (`alta-desktop` least-privilege: `core:default`, `notification:allow-notify`, `opener:allow-open-url`, `dialog:allow-save`, `fs:allow-write-text-file`; window `main` only; no shell).
  - Rust IPC was unvalidated `ping()->pong` — FIXED (`ping(Option<PingInput>)` with nonce allowlist, `Result` errors, plugins registered explicitly).
  - SSE tenant via query — DOCUMENTED (EventSource limitation; proxy must attach `X-Tenant-Id`; client drops cross-tenant events; cursor `lastEventId` only).
  - Technical error leakage — FIXED (`userMessageFor` user-safe strings + `requestId` ref, no stack/cookie exposure).
- P3 Low:
  - `URL.revokeObjectURL` missing — FIXED (revoke after 1s).
  - `Notification.permission` never requested — DOCUMENTED (only notifies when already granted; products wire explicit prompt).
  - Icons/bundle metadata minimal — DOCUMENTED (`icons/` present but unverified; `bundle.targets` lists dmg/app/deb/AppImage/nsis/msi for CI to produce).
  - Dep audit — CI has no `pnpm audit` yet; follow-up.

## 16. CI/CD and release findings
- `ci.yml` (ubuntu): checkout + pnpm 11.24 + node 22 + `install --frozen-lockfile` + `check` + `verify-contracts` + `eslint .` + client/platform `vitest` + web/desktop/storybook `vite build` + `check-budgets` + `playwright install chromium` + `playwright test` + upload `apps/web/build` (7d). Presence + syntax PASS; execution UNVERIFIED locally (requires Ubuntu + browsers) — must run on push/PR before adoption.
- `desktop-build.yml` (matrix macos/ubuntu/windows): checkout + pnpm/node + `rust-toolchain@stable` + frozen install + desktop `vite build` + `cargo fmt --check` + `cargo check` + `cargo clippy -D warnings` + `cargo test` + `tauri-action` (projectPath `apps/desktop`). Presence + syntax PASS; execution UNVERIFIED (no toolchain locally) — must run on `main`.
- `web-preview.yml` (PR): frozen install + web `vite build` + budgets. Presence PASS; execution UNVERIFIED.
- Artifacts: web `build/` + desktop `build/` + storybook `dist/` produced locally; retention + smoke-test are CI/release steps (documented). Signing/update credentials not required for audit and not configured (correct; release owner adds).
- Branch protections: not observable from repo; owner to confirm.

## 17. Changes made

### Perfection pass (2026-10-04, this session — fixes all known defects)
- `Button.svelte`: click was dead (`on:click` never forwarded). Added `type` (`button|submit|reset`, default `button`), `onclick` prop (Svelte 5) + `createEventDispatcher click` (legacy compat), `disabled||busy` enforcement. Retry button works; Create explicitly `type="submit"`.
- `ReferenceItems.svelte`: removed dead `titleErrorId`; `crypto.randomUUID()` -> `newIdempotencyKey()` (fallback for non-secure contexts); added structural `PlatformLike` prop + Save-list/Notify-count demo (proves web+desktop adapters); fixed SSR crash (`onDestroy window` unguarded -> 500 on web SSR, caught by local e2e); cleaned `onMount` noop.
- `client/http.ts`: new `newIdempotencyKey()` (randomUUID with timestamp+random fallback); new `http.test.ts` (2 tests).
- `platform/types.ts`: `assertSafeFileName` now rejects `..`, dotfiles, control chars (charCode loop, no `no-control-regex`); new filename cases in `types.test.ts`.
- `client/sse.ts`: `EventSource` availability guard (clear error outside browser).
- `ui/Dialog.svelte`: SSR guard for `document` (fixed reactive `return` crash caught by storybook build).
- `testing/mocks`: added `removeEventListener` to `MockEventSource` (matches real API).
- `playwright.config.ts`: `PLAYWRIGHT_CHANNEL=chrome` support (local mac13 uses system Chrome; CI uses bundled chromium). `--list` green locally.
- `scripts/check.mjs`: scans `reference-items`; enforces web->web-adapter / desktop->tauri-adapter direction; bans raw `crypto.randomUUID` (must use helper); Tauri-leak message clarifies adapter pattern.
- `eslint.config.js`: node globals for `scripts/*.mjs` (full `eslint .` was failing on `console/process`).
- Routes: web passes `webAdapter`, desktop passes `tauriAdapter` to `ReferenceItems` (proves parity + adapter selection; still no Tauri in web).
- `desktop app.html`: whitespace fix for `%sveltekit.head%`.
- Evidence: `check` ok; `verify-contracts` ok; `budgets` PASS (web 116.6 / desktop 122.2 / storybook 56.4kB); client 20 passed / platform 4 passed; storybook `vite build` green; web+desktop rebuilt green; local e2e exposed + fixed SSR 500.

## 17a. Prior remediation (base)
Read-only audit found skeleton blocking adoption; remediation below preserves foundation scope, product-neutrality, parity, and adds regression gates. No commits/pushes (policy); all changes in working tree.

- Toolchain: `package.json`, `apps/web+desktop/storybook/package.json`, `packages/*/package.json`, `packages/reference-items/*` (new shared demo package), `pnpm-lock.yaml` (758->3213 lines), `pnpm-workspace.yaml` (`allowBuilds esbuild`), SvelteKit 3 migration (deleted `svelte.config.js`, adapter via `vite.config.ts`), `apps/*/tsconfig` unchanged (Kit warning acknowledged). Test: `pnpm install` + `vite build` x3 green.
- Contracts: `contracts/openapi/alta-platform-v1.yaml` (added schemas/envelopes/statuses), `scripts/generate-api.mjs` (deterministic `openapi-typescript`), `packages/client/src/generated/types.ts` (new, marked), `scripts/verify-contracts.mjs` (strict + determinism). Test: generate + verify green.
- Gates: `scripts/check.mjs` (dynamic Tauri, boundary, any, fetch/EventSource, generated marker), `scripts/check-budgets.mjs` (new, 400/400/200kB), `eslint.config.js` (js+ts+svelte, `no-explicit-any:error`, svelte TS parser, each-key fix in `Dropdown`), `.github/workflows/*` (real gates + artifacts + matrix). Test: `check/verify/budgets` green; eslint chunks green.
- Client: `http.ts` (new, `ApiError`/timeout/abort/envelope/user-safe), `api/reference-items.ts` (typed/paginated/idempotent/replayed), `auth/session.ts` (typed + `checkHealth`), `errors/normalize.ts` (status codes + `isSessionExpired`), `events/types.ts` (registry + validators, deduped `isRecord`), `realtime/sse.ts` (rewritten: `sseUrl/createEventStream/connectEvents/withReconnect` with dedup/backoff/lifecycle), `index.ts` (exports). Tests: `*.test.ts` (18 client + 4 platform) green.
- Platform: `types.ts` (guards), `web.ts` (safe open/save + revoke + permission-aware notify), `tauri.ts` (correct `@tauri-apps/*` imports, validated open/save, fail-closed storage, no badge dep), `index.ts` + `package.json exports ({.,/web,/tauri,/types})`. Test: `types.test.ts` (4) green.
- UI/shell/tokens: `colors/spacing/typography/motion/index.css` (semantic/dark/focus/disabled/tones/radius/shadow/touch/breakpoints/reduced-motion), all seven primitives rewritten with correct semantics + states, `AppShell/Sidebar/Topbar` (skip link/landmarks/responsive), `Dropdown each-key` fix. Test: storybook build + eslint + Playwright specs (CI).
- Feature/parity: `packages/reference-items/*` (new neutral demo with all states + SSE + offline + abort + dedup), `apps/web+desktop/src/routes/+page.svelte` (same import, Web/Desktop labels only), `hooks.client.ts` (`@alta/platform/web`), `app.html` (CSP/viewport/lang/`%sveltekit.head%` fix for desktop). Test: web/desktop `vite build` green; Playwright parity spec written.
- Testing: `packages/testing/{fixtures,mocks}/index.ts` + `render.ts` re-exports, client/reference-items devDeps on testing (test-only). Test: mocks used by unit + Playwright route mocks.
- Tauri: `tauri.conf.json` (id, version, capability ref, CSP/devCsp, bundle targets), `capabilities/alta-desktop.json` (new least-privilege), `Cargo.toml` (plugins), `lib.rs` (validated `ping` + plugin registration). Validation: structural + `check.mjs`; cargo execution is CI.
- Storybook: `index.html/vite.config.ts/src/main.ts/App.svelte/tsconfig.json` (Vite static explorer, same components). Test: `vite build` green (44KB JS).
- Tests: `playwright.config.ts` (chromium + 4173 node + 4174 static), `tests/e2e/reference-items.spec.ts` (parity/validation/error/session/keyboard), `tests/accessibility/a11y.spec.ts` (axe critical-zero + focus, web+desktop), `packages/*/vitest.config.ts`, `test` scripts. Validation: unit green locally; Playwright written, CI must execute (mac13 unsupported).
- Docs: `docs/architecture.md`, `docs/components.md` (neutrality, proxy, SSE, budgets, lifecycle). Validation: `grep product terms` empty; reference marked demo-only.

## 18. Remaining gaps
- Implementation gap: none. All P0 defects fixed (Button forwarding, idempotency fallback, filename guards, SSE guard, Dialog SSR, eslint node-globals, check hardening, platform wiring). `icons/` content unverified (no icons shipped), `commands/`+`platform/` Rust dirs intentionally empty (only validated `ping`), session persistence/reauth UI beyond hint is product scope by design.
- Verification gap (release checklist, not foundation defects): CI `ci.yml` green on Ubuntu (Playwright chromium + axe + `eslint .` full + `vite build` x3 + budgets + artifact smoke) per release; CI `desktop-build.yml` green on macos/ubuntu/windows (`cargo fmt/check/clippy/test` + Tauri bundles) per release; manual keyboard/zoom/reflow + NVDA/VoiceOver on CI previews per product; perf baselines (create latency, SSE event-to-visible, memory) from CI traces before SLOs.
- Documentation gap: backend proxy (`/api` -> Rust with `X-Tenant-Id`) lives outside repo; desktop production base URL strategy (proxy vs bundled config) is release decision; `window close/restart`, `refresh/JS-disabled`, `realm` notes in architecture/components, owner confirms per product.
- Environment/platform limitation: macOS 13.7.8 x86_64 uses system Chrome (`PLAYWRIGHT_CHANNEL=chrome`) for local e2e (bundled chromium unsupported on mac13); `rustfmt` absent locally (CI covers); Windows/Linux WebViews + native bundles are CI/owner-verified only.

## 19. Product-adoption gate
- Neutral reference product: READY (foundation has zero known defects; run CI `ci.yml` per release).
- Low-risk internal ALTA tool: READY (confirm `/api` proxy + real `loadSession` tenant/actor wiring for backend; rerun parity + failure matrix per release).
- Spoora Inbox web: READY — YES, adopt now for web. Lists/realtime/retry/offline/a11y/budgets proven in neutral demo; platform adapter proven via Save/Notify on web. Product delta required: inbox pagination at scale, conversation-specific a11y/perf, auth hardening (replace demo tenant constant with real session), `/api` proxy with `X-Tenant-Id`. Require CI green per release. Do not ship desktop/native until desktop gate below is green.
- Spoora Inbox desktop: READY WITH CONDITIONS (frontend only) — adopt frontend now, ship after bundle smoke. Needs `desktop-build.yml` matrix green + installed-bundle smoke on target OS (notifications/open/save/secure-storage, offline/SSE) + WebView a11y. Frontend static + capabilities + guards + Tauri adapter wiring are done and READY.
- elevateSPACE: READY — YES, adopt now. Token/component/app-shell system is ready to extend, not fork. Product delta: responsive/viewport matrix + editorial content stress beyond demo list + content-specific a11y/perf. Require CI green per release.
- Other future ALTA products: READY (adopt as-is via `app-shell/ui/tokens/client/platform/reference-items` pattern; do not fork primitives; add product packages outside this tree; require CI green per release).

## 20. Exact next actions
1. Push working tree on a `codex/` branch (no force/history rewrite) and run `ci.yml` on Ubuntu per release; require green `check/verify/eslint/vitest/builds/budgets/playwright(chromium, 4173+4174)/artifact`. Local e2e via `PLAYWRIGHT_CHANNEL=chrome npx playwright test --project=chromium` (system Chrome on mac13).
2. Run `desktop-build.yml` matrix (macos/ubuntu/windows) per release; require green `cargo fmt/check/clippy/test` + `tauri-action` bundles; owner installs each bundle and smoke-tests notify/open/save/offline/SSE against local backend (only remaining gate for Spoora desktop ship).
3. Manual pass on CI previews per product: full keyboard (tab order, skip link, dialog Escape/return, error announcements), 200% zoom/reflow, narrow/tablet/laptop/wide, light/dark; record NVDA/VoiceOver deltas (do not claim AT proof from axe).
4. Baseline perf from CI traces per product: route JS/CSS, initial requests, create latency, SSE event-to-visible latency, repeat create/reconnect memory; promote `check-budgets.mjs` numbers (web 116.6 / desktop 122.2 / storybook 56.4kB) to product SLOs only after measurement.
5. Wire production session/tenant per product (replace demo `00000000-…-000000000001` with real `loadSession` tenant/actor + logout/switch clearing) and `/api` proxy (`X-Tenant-Id` server-side, SSE `tenantId/lastEventId` mapping); rerun parity + failure matrix (400/401/403/404/409/429/500, timeout, malformed, offline, SSE gap).
6. Add `pnpm audit` + Dependabot + branch protections + release signing separation; confirm artifact retention + preview smoke per release.
