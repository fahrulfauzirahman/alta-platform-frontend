# alta-platform-frontend

SvelteKit + Tauri platform foundation.

- `apps/web`: SvelteKit web adapter, remote Rust API
- `apps/desktop`: static SPA + Tauri, remote Rust API
- `packages/tokens, ui, app-shell, client, platform, testing`

Reference slice: ReferenceItems list/create with SSE `reference_item.created.v1`.
Same UI package used by web and desktop. Web never imports Tauri.
