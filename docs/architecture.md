# Frontend architecture

- tokens: visual decisions only.
- ui: accessible primitives, depends on tokens only.
- app-shell: layout, depends on ui/tokens.
- client: remote platform client (generated + transport + SSE), no visual deps.
- platform: web/desktop capability abstraction; only tauri.ts may import Tauri.
- testing: fixtures/mocks.
